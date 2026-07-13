# tabnext Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **This plan's verification is manual-in-browser.** The spec (docs/superpowers/specs/2026-07-13-tabnext-design.md) rules out an automated harness. Steps marked **[HUMAN]** need Timothy clicking in Brave; everything else is automatable.

**Goal:** A Manifest V3 Brave/Chromium extension that opens every new tab immediately right of the current tab and shows a live tab-count badge on its toolbar icon.

**Architecture:** One background service worker, fully event-driven. Placement = stateless live-query of the reference tab (active tab, or previously-used tab via `lastAccessed` when the new tab is created already-active) with a 2-second window-age guard protecting session restore. Badge = recount on every tab lifecycle event.

**Tech Stack:** Plain JavaScript, MV3 `chrome.*` APIs. No build step, no dependencies, no framework.

## Global Constraints

- `manifest.json` must have **no `permissions` key at all** — the extensions page must show "requires no special permissions".
- Manifest V3; requires Chromium ≥121 (`Tab.lastAccessed`).
- Plain JS, no build step; the repo root IS the loadable extension.
- Repo: `~/code/tabnext` (already exists with spec committed on `main`).
- Commit messages: plain, imperative, **no Co-Authored-By / AI-attribution trailers** (a pre-tool hook blocks them).
- All new-tab types get moved (Ctrl+T, new-tab button, link-opened, external-app links) — no config, no options page.

---

### Task 1: Loadable skeleton (manifest + icons)

**Files:**
- Create: `manifest.json`
- Create: `background.js` (empty placeholder for now)
- Create: `icons/16.png`, `icons/48.png`, `icons/128.png`
- Create: `.gitignore`

**Interfaces:**
- Produces: an extension that loads unpacked with zero errors; `background.js` is the single service worker later tasks fill in.

- [ ] **Step 1: Write `manifest.json`**

```json
{
  "manifest_version": 3,
  "name": "tabnext",
  "version": "1.0.0",
  "description": "Open new tabs next to the current tab, and count how many tabs you have open.",
  "background": {
    "service_worker": "background.js"
  },
  "action": {
    "default_title": "tabnext — open tab count",
    "default_icon": {
      "16": "icons/16.png",
      "48": "icons/48.png"
    }
  },
  "icons": {
    "16": "icons/16.png",
    "48": "icons/48.png",
    "128": "icons/128.png"
  }
}
```

Note: **no `permissions` key.** `tabs.query`/`tabs.move`/`action.setBadgeText` need none (we never read `url`/`title`).

- [ ] **Step 2: Create placeholder `background.js`**

```js
// tabnext — new tabs next to current + tab-count badge.
// Filled in by Tasks 2 and 3.
```

- [ ] **Step 3: Generate icons with ImageMagick**

Two overlapping tab shapes — the bright one is the new tab landing next to the current one. Nord-ish palette to match the rest of Timothy's setup.

```bash
cd ~/code/tabnext && mkdir -p icons
magick -size 128x128 xc:none \
  -fill '#2e3440' -draw 'roundrectangle 4,4 124,124 24,24' \
  -fill '#4c566a' -draw 'roundrectangle 20,36 76,92 8,8' \
  -fill '#88c0d0' -draw 'roundrectangle 52,52 108,108 8,8' \
  icons/128.png
magick icons/128.png -resize 48x48 icons/48.png
magick icons/128.png -resize 16x16 icons/16.png
```

- [ ] **Step 4: Create `.gitignore`**

```
*.pem
*.crx
```

(Chromium drops these next to the source if you ever use "Pack extension".)

- [ ] **Step 5: Validate manifest JSON**

Run: `cd ~/code/tabnext && node -e "JSON.parse(require('fs').readFileSync('manifest.json','utf8')); console.log('manifest OK')"`
Expected: `manifest OK`

- [ ] **Step 6: [HUMAN] Load unpacked in Brave**

`brave://extensions` → Developer mode ON → Load unpacked → `~/code/tabnext`.
Expected: extension "tabnext" appears, **no red Errors button**, detail page says "This extension requires no special permissions". Pin the icon to the toolbar.

- [ ] **Step 7: Commit**

```bash
cd ~/code/tabnext && git add manifest.json background.js icons/ .gitignore
git commit -m "Add loadable MV3 skeleton: manifest, icons, empty worker"
```

---

### Task 2: Tab-count badge

**Files:**
- Modify: `background.js` (replace placeholder body)

**Interfaces:**
- Produces: `updateBadge()` — async, no args, queries all tabs in the profile and writes the count to the action badge. Task 3 calls it from `tabs.onCreated`.

- [ ] **Step 1: Write the badge logic in `background.js`**

Replace the file's contents with:

```js
// tabnext — new tabs next to current + tab-count badge.
// Zero permissions: we never read tab URLs or titles.

// ---- badge: live count of all tabs in this profile ----

chrome.action.setBadgeBackgroundColor({ color: "#4c566a" });
chrome.action.setBadgeTextColor({ color: "#eceff4" });

async function updateBadge() {
  const tabs = await chrome.tabs.query({});
  await chrome.action.setBadgeText({ text: String(tabs.length) });
}

chrome.tabs.onCreated.addListener(updateBadge);
chrome.tabs.onRemoved.addListener(updateBadge);
chrome.tabs.onAttached.addListener(updateBadge);
chrome.tabs.onDetached.addListener(updateBadge);
chrome.runtime.onStartup.addListener(updateBadge);
chrome.runtime.onInstalled.addListener(updateBadge);
```

- [ ] **Step 2: Syntax-check**

Run: `cd ~/code/tabnext && node --check background.js && echo "syntax OK"`
Expected: `syntax OK`

- [ ] **Step 3: [HUMAN] Verify badge in Brave**

`brave://extensions` → tabnext → reload (circular arrow). Then:
- Badge on the pinned icon shows the current tab count.
- Ctrl+T → count increments. Ctrl+W → decrements.
- Open a second window, open tabs there → count covers both windows.
Expected: all three hold; no errors on the extension card.

- [ ] **Step 4: Commit**

```bash
cd ~/code/tabnext && git add background.js
git commit -m "Add live tab-count badge"
```

---

### Task 3: Placement — new tabs next to current

**Files:**
- Modify: `background.js` (append placement section; change the `onCreated` listener wiring)

**Interfaces:**
- Consumes: `updateBadge()` from Task 2 (called alongside placement in the shared `onCreated` listener).
- Produces: `placeNextToCurrent(newTab)` — async, takes the `chrome.tabs.Tab` from `onCreated`, moves it to reference-tab index + 1 or leaves it alone per the guards.

- [ ] **Step 1: Append placement logic to `background.js`**

Replace the single line `chrome.tabs.onCreated.addListener(updateBadge);` with the placement section below, and add it AFTER the badge section (final file = badge section + this):

```js
// ---- placement: every new tab lands right of the current tab ----

// Tabs created within this window-age are session-restore or fresh-window
// tabs; leave them where Brave put them.
const WINDOW_AGE_MS = 2000;
const windowBirth = new Map(); // windowId -> epoch ms

chrome.windows.onCreated.addListener((win) => {
  windowBirth.set(win.id, Date.now());
});
chrome.windows.onRemoved.addListener((windowId) => {
  windowBirth.delete(windowId);
});

// The tab the new tab should land after: the active tab — unless the new
// tab was created already-active (Ctrl+T, new-tab button), in which case
// the previously used tab (highest lastAccessed among the others).
async function referenceTab(newTab) {
  const [active] = await chrome.tabs.query({
    active: true,
    windowId: newTab.windowId,
  });
  if (active && active.id !== newTab.id) return active;
  const others = (await chrome.tabs.query({ windowId: newTab.windowId }))
    .filter((t) => t.id !== newTab.id);
  if (others.length === 0) return null;
  return others.reduce((a, b) =>
    (a.lastAccessed ?? 0) >= (b.lastAccessed ?? 0) ? a : b
  );
}

async function placeNextToCurrent(newTab) {
  const birth = windowBirth.get(newTab.windowId);
  if (birth !== undefined && Date.now() - birth < WINDOW_AGE_MS) return;
  const ref = await referenceTab(newTab);
  if (!ref) return;
  const target = ref.index + 1;
  if (newTab.index === target) return;
  try {
    await chrome.tabs.move(newTab.id, { index: target });
  } catch (_e) {
    // Tab closed or dragged mid-flight; nothing to do.
  }
}

chrome.tabs.onCreated.addListener((tab) => {
  placeNextToCurrent(tab);
  updateBadge();
});
```

(Pinned-tab clamping is Chromium's: moving an unpinned tab into the pinned block gets clamped to the first unpinned slot — no special-casing, per spec.)

- [ ] **Step 2: Syntax-check**

Run: `cd ~/code/tabnext && node --check background.js && echo "syntax OK"`
Expected: `syntax OK`

- [ ] **Step 3: [HUMAN] Verify placement in Brave**

Reload the extension, then with several tabs open and a middle one active:
1. Ctrl+T → new tab appears immediately RIGHT of the tab you were on.
2. Middle-click a link → opens right of current.
3. Click a link from an external app (Slack/st) → lands right of current, not at the end.
4. Quit Brave entirely, reopen with session restore → restored tab ORDER unchanged.
5. Ctrl+N (new window) → nothing weird, single tab.
Expected: all five hold.

- [ ] **Step 4: Commit**

```bash
cd ~/code/tabnext && git add background.js
git commit -m "Place new tabs next to the current tab"
```

---

### Task 4: README, license, full manual checklist

**Files:**
- Create: `README.md`
- Create: `LICENSE` (MIT, `Copyright (c) 2026 Timothy Beach`)

**Interfaces:**
- Produces: install + test docs; the manual checklist below is the project's regression suite.

- [ ] **Step 1: Write `README.md`**

```markdown
# tabnext

Open new tabs next to the current tab — not at the far end of the tab
strip — and show a live count of open tabs on the toolbar icon.

A Manifest V3 replacement for the late "Open Tabs Next to Current"
(MV2, disabled by Chromium in 2025). Built for Brave; works in any
Chromium browser (Chromium ≥ 121).

- **No permissions.** The extensions page says "requires no special
  permissions" — tabnext never reads URLs, titles, or history.
- **No build step, no dependencies.** Two files. The repo is the
  extension.

## Install

1. `git clone https://github.com/timbeach/tabnext`
2. Open `brave://extensions` (or `chrome://extensions`)
3. Turn on **Developer mode** (top right)
4. **Load unpacked** → select the `tabnext` directory
5. Pin the icon if you want the tab-count badge visible

Repeat per browser profile — each profile counts its own tabs.

## How it works

One background service worker, event-driven, asleep between events:

- **Placement:** on tab creation, the new tab is moved to just after the
  active tab (or, for tabs created already-active like Ctrl+T, after the
  previously used tab). Tabs created within 2 s of their window's birth
  are left alone so session restore and new windows keep their order.
- **Badge:** every tab open/close/attach/detach recounts
  `chrome.tabs.query({})` into the badge.

## Manual test checklist

- [ ] Ctrl+T opens next to the current tab
- [ ] Middle-clicked link opens next to the current tab
- [ ] Link from an external app opens next to the current tab
- [ ] Session restore preserves tab order
- [ ] New window (Ctrl+N) behaves normally
- [ ] Badge tracks open/close across two windows
- [ ] A second profile counts independently

## License

MIT
```

- [ ] **Step 2: Write `LICENSE`**

Standard MIT text with `Copyright (c) 2026 Timothy Beach`:

```
MIT License

Copyright (c) 2026 Timothy Beach

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

- [ ] **Step 3: [HUMAN] Run the full manual checklist**

Run every item in the README checklist (second profile included).
Expected: all seven pass. Any failure → fix before Task 5.

- [ ] **Step 4: Commit**

```bash
cd ~/code/tabnext && git add README.md LICENSE
git commit -m "Add README and MIT license"
```

---

### Task 5: Publish to GitHub

**Files:** none (repo operation)

**Interfaces:**
- Consumes: the completed, checklist-passing repo on `main`.

- [ ] **Step 1: Create the public repo and push**

```bash
cd ~/code/tabnext && gh repo create timbeach/tabnext --public \
  --description "Open new tabs next to the current tab + live tab-count badge. MV3, zero permissions." \
  --source . --push
```

Expected: repo created, `main` pushed.

- [ ] **Step 2: Verify**

Run: `gh repo view timbeach/tabnext --json url,description -q .url`
Expected: `https://github.com/timbeach/tabnext`
