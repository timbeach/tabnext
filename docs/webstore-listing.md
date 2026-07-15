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

**Detailed description** (plain text — CWS renders no markdown):

Your new tab just opened at the far end of the tab strip. Again.
Somewhere past tab forty, in the region cartographers mark "here be
dragons."

tabnext fixes that. New tabs open exactly where you are: immediately to
the right of the tab you're on. Ctrl+T, middle-clicked links, links
from other apps — everything lands next to you, not at the end of the
world.

And because you're clearly a person who opens tabs, the penguin on your
toolbar keeps score: a live badge with the number of tabs you have
open. No judgment. Just a number. (You can pretend it's judgment.)

THE EULOGY

This is a Manifest V3 replacement for "Open Tabs Next to Current," a
beloved extension that Chromium's MV2 retirement took from us. Rest
easy, old friend. The penguin carries on your work.

WHAT IT COSTS YOU

Nothing. Not money, not privacy.

• Zero permissions — install it and your browser won't warn you about
anything, because there's nothing to warn about. tabnext never reads
your URLs, titles, or history. It counts tabs and it moves tabs. That's
it. That's the whole thing.

• Tab-group safe — grouped tabs are never yanked out of their groups,
and session restore keeps your order and your groups exactly as you
left them. Open a tab from inside a group and it joins the group, right
next to you.

• Nothing resident — one event-driven service worker that sleeps
between tab events. No settings page. No popup. No onboarding tour. It
just does the thing.

Free and open source (MIT). Two files. Read every line in about two
minutes: https://github.com/timbeach/tabnext

Works in Chrome, Brave, Edge, Vivaldi — anything Chromium ≥ 121.

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
