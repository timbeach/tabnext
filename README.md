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

**From the Chrome Web Store (easiest):**
[tabnext on the Chrome Web Store](https://chromewebstore.google.com/detail/tabnext/emomhgbeeiicnljgihhnnimgknknkefb)
— works in Chrome, Brave, Edge, Vivaldi, anything Chromium ≥ 121.

**From source (no store, no waiting):**

1. `git clone https://github.com/timbeach/tabnext`
2. Open `brave://extensions` (or `chrome://extensions`)
3. Turn on **Developer mode** (top right)
4. **Load unpacked** → select the `tabnext` directory

Either way, pin the icon if you want the tab-count badge visible. The
badge is per profile — each profile counts its own tabs.

**The story behind it:** [tabnext — Open New Browser Tabs Next to Your
Current One](https://timbeach.com/a/tabnext/)

## How it works

One background service worker, event-driven, asleep between events:

- **Placement:** on tab creation, the new tab is moved to just after the
  active tab (or, for tabs created already-active like Ctrl+T, after the
  previously used tab). The move waits 150 ms and is skipped if the tab
  joined a tab group, was closed, or was part of a creation burst.
  Windows are "quiet" for 2 s after creation, and bursts (creations
  < 300 ms apart) extend the quiet — so session restore keeps its tab
  order and its tab groups intact.
- **Tab groups:** grouped tabs are never moved. Opening a tab from
  inside a group places it in that group, next to you.
- **Badge:** every tab open/close/attach/detach recounts
  `chrome.tabs.query({})` into the badge.

## Manual test checklist

- [ ] Ctrl+T opens next to the current tab
- [ ] Middle-clicked link opens next to the current tab
- [ ] Link from an external app opens next to the current tab
- [ ] Session restore preserves tab order
- [ ] Session restore keeps tabs in their tab groups
- [ ] Ctrl+T from a tab inside a group opens next to it, in the group
- [ ] New window (Ctrl+N) behaves normally
- [ ] Badge tracks open/close across two windows
- [ ] A second profile counts independently

## License

MIT
