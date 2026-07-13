# tabnext — Design

**Date:** 2026-07-13
**Status:** Approved design
**Location:** `~/code/tabnext`

## Problem

The MV2 extension "Open Tabs Next to Current" was disabled when Chromium
(and Brave) dropped Manifest V2 support. Its job: every new tab opens
immediately to the right of the current tab instead of at the far end of
the tab strip. No maintained MV3 replacement fits the suckless bar, so we
build our own — and while we're in there, add the other thing Timothy
wants from an extension: a live count of open tabs.

The dwmblocks status-bar counter (native-messaging host, per-profile count
files, `sb-bravetabs`) designed on 2026-07-05 in `~/code/brave-tab-counter`
is **parked**, not replaced; this extension's badge covers the day-to-day
"how many tabs?" itch with zero infrastructure.

## What it is

One Manifest V3 extension for Brave (portable to any Chromium browser):

1. **Placement** — every newly created tab is moved to sit immediately
   right of the currently active tab in its window ("all new tabs", same
   behavior as the original extension: Ctrl+T, new-tab button, link-opened
   tabs, tabs opened by external apps).
2. **Badge** — the toolbar icon shows the total tab count across all
   windows of the profile, updated live.

No options page, no popup, no build step, **no permissions** (the
extensions page shows "requires no special permissions", like the
original). Loaded unpacked, once per profile.

## Architecture

`manifest.json` + one background service worker (`background.js`, ~60
lines). Everything is event-driven; the worker sleeps between events.

### Placement logic (stateless live-query — chosen over a tracked
last-active-tab map, which needs the `storage` permission and has its own
restore races)

- `tabs.onCreated(newTab)` → find the reference tab → if `newTab` is not
  already at `ref.index + 1`, `tabs.move` it there.
- **Reference tab:** query `{active: true, windowId}`. If that returns a
  tab other than `newTab`, use it (background-opened tabs, external-app
  links). If it returns `newTab` itself — foreground opens like Ctrl+T
  are created already-active — fall back to the *previously used* tab:
  the highest `lastAccessed` among the window's other tabs (`lastAccessed`
  is available without any permission, Chromium ≥121). A window with no
  other tabs → nothing to do.
- **Session-restore / new-window guard (revised 2026-07-13 after manual
  testing found restores ripping tabs out of tab groups):** a fixed 2 s
  window-age check is not enough — restore bursts outlive it, restores
  can target pre-existing windows, and `tabs.move` to an index outside a
  group's span strips group membership. Two reinforcing guards instead:
  - **Quiet window:** a window is quiet for 2 s after creation; any tab
    created during a quiet period, or within 300 ms of the previous
    creation in that window, extends the quiet by 1 s. A restore burst
    shields itself for its whole duration. In-memory maps suffice: the
    event burst keeps the worker alive.
  - **Settle-then-verify:** the move is deferred 150 ms; the tab is then
    re-fetched and skipped if it was closed, joined a tab group
    (membership may be assigned only after `onCreated` fires — documented
    behavior), or was followed by further creations (burst). Cost: a
    Ctrl+T tab visibly hops from strip-end to its place after ~150 ms.
- **Tab groups:** tabs created directly into a group, or grouped during
  the settle delay, are never moved. Side effect of Chromium's own move
  semantics: Ctrl+T while inside a group places the new tab into that
  group (move target lands within the group's span) — accepted as
  correct for group users.
- **Pinned tabs:** if the active tab is pinned, Chromium clamps the moved
  unpinned tab to the first slot after the pinned block. We rely on the
  clamp rather than special-casing.
- **Rapid multi-open:** each tab lands at active+1, so a burst ends up in
  reverse order right of the current tab — matches the original
  extension's behavior.

### Badge logic

- `tabs.onCreated` / `tabs.onRemoved` / `tabs.onAttached` /
  `tabs.onDetached` → `tabs.query({})` → `action.setBadgeText` with the
  count; `runtime.onStartup` and `runtime.onInstalled` set the initial
  value.
- Muted badge background color (dark gray) — informative, not alarming.
- Per-profile by nature: each profile runs its own copy of the extension.

## Repo layout

```
~/code/tabnext/
  manifest.json      # MV3, background.service_worker, action, no permissions
  background.js      # placement + badge, ~60 lines
  icons/             # 16 / 48 / 128 px
  README.md          # what/why, load-unpacked install, manual test checklist
  docs/superpowers/specs/2026-07-13-tabnext-design.md
```

Public GitHub repo (MIT) so other Aegix/Brave users can load it.

## Install

`brave://extensions` → Developer mode → Load unpacked →
`~/code/tabnext/` — once per profile.

## Failure modes

| Scenario | Behavior |
|---|---|
| Session restore (incl. tab groups) | Quiet-window + burst guards skip moves; settle re-check catches late group assignment; restored order and groups intact. |
| Restore into a pre-existing window | Burst guard + settle re-check cover it (no window-creation event to lean on); at most the first restored tab, if ungrouped, may move. |
| New window's first tab | Quiet window — left alone. |
| Worker idle-killed | Next tab event re-wakes it; placement and badge are stateless recomputations. |
| Worker wakes mid-restore (window not in map) | Treated as old window; a restore-burst tab could get moved. Rare, cosmetic, accepted. |
| Tab created already active (Ctrl+T, new-tab button) | Reference falls back to the previously used tab via `lastAccessed`. |
| Only tab in its window | No reference tab → left alone. |
| Badge count > 999 | Chromium truncates badge text (~4 chars); acceptable. |

## Testing

Browser-extension APIs need a live browser; a Puppeteer harness would
dwarf the extension. Testing = a manual checklist in the README, run in
real Brave:

- Ctrl+T opens next to current tab
- middle-click link opens next to current tab
- link from external app (Slack/st) opens next to current tab
- session restore preserves tab order
- new window unaffected
- badge tracks open/close across two windows
- second profile counts independently

## Out of scope (YAGNI)

- dwmblocks/status-bar integration (parked 2026-07-05 spec in
  `~/code/brave-tab-counter`)
- options/config UI
- Web Store packaging
- incognito windows
- Firefox
