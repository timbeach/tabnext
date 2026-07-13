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
