# Chrome Web Store listing — tabnext

Everything to paste into https://chrome.google.com/webstore/devconsole
(one-time $5 developer registration required).

## Product details

**Name:** tabnext

**Summary** (≤132 chars):
Open new tabs next to the current tab — not at the end — and see a live
count of your open tabs. Zero permissions.

**Category:** Tools

**Language:** English

**Detailed description:**

New tabs in Chromium browsers open at the far end of the tab strip.
tabnext opens them where you actually are: immediately to the right of
the tab you're on. Ctrl+T, middle-clicked links, links from other apps —
everything lands next to you.

It also shows a live badge on its toolbar icon with the number of tabs
you have open, so you always know how deep you are.

A Manifest V3 replacement for "Open Tabs Next to Current", which was
retired with Manifest V2.

— Zero permissions. tabnext never reads your URLs, titles, or history,
  and the install prompt reflects that: no warnings at all.
— Tab-group friendly. Grouped tabs are never yanked out of their groups;
  session restore keeps your order and your groups intact. Opening a tab
  from inside a group places it in that group, next to you.
— No settings, no popup, nothing resident. One event-driven service
  worker that sleeps between tab events.
— Free and open source (MIT): https://github.com/timbeach/tabnext

## Privacy tab

**Single purpose description:**
Positions newly created tabs next to the currently active tab and
displays the number of open tabs on the extension's badge.

**Permission justifications:** none requested — the extension declares
no permissions and no host permissions.

**Data usage:** does not collect, use, or transfer ANY user data. Check
"none of the above" for every data category; certify compliance.

**Remote code:** No, all code is packaged.

## Assets

- Upload zip: run `./package.sh` → `tabnext-<version>.zip`
- Store icon 128×128: `icons/128.png` (auto-taken from the zip manifest)
- Screenshot 1280×800: `docs/store-assets/screenshot-1280x800.png`
  (replace with a real capture of your tab strip whenever you like)
- Small promo tile 440×280: `docs/store-assets/tile-440x280.png`

## Publish steps

1. Register (once): https://chrome.google.com/webstore/devconsole → pay $5.
2. "New item" → upload `tabnext-<version>.zip`.
3. Paste the Product details + Privacy sections above; upload the
   screenshot and tile.
4. Set visibility Public → Submit for review. Zero-permission extensions
   typically clear review in a day or two.
5. Later versions: bump `"version"` in manifest.json, re-run
   `./package.sh`, upload the new zip on the same item.

Note for Brave users: Brave installs straight from the Chrome Web Store,
so one listing covers Chrome, Brave, Edge, Vivaldi, etc.
