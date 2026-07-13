// tabnext — new tabs next to current + tab-count badge.
// Zero permissions: we never read tab URLs or titles.

// ---- badge: live count of all tabs in this profile ----

chrome.action.setBadgeBackgroundColor({ color: "#4c566a" });
chrome.action.setBadgeTextColor({ color: "#eceff4" });

async function updateBadge() {
  const tabs = await chrome.tabs.query({});
  await chrome.action.setBadgeText({ text: String(tabs.length) });
}

chrome.tabs.onRemoved.addListener(updateBadge);
chrome.tabs.onAttached.addListener(updateBadge);
chrome.tabs.onDetached.addListener(updateBadge);
chrome.runtime.onStartup.addListener(updateBadge);
chrome.runtime.onInstalled.addListener(updateBadge);

// ---- placement: every new tab lands right of the current tab ----

// Browser-initiated bulk creation (session restore, reopen-closed-window)
// must be left alone: moving those tabs scrambles their order and rips
// them out of their tab groups (tabs.move to an index outside a group's
// span strips membership). A window is "quiet" for 2 s after it is
// created, and any tab created during a quiet period — or within 300 ms
// of the previous creation — extends the quiet, so a restore burst
// shields itself for its whole duration.
const WINDOW_QUIET_MS = 2000;
const BURST_EXTEND_MS = 1000;
const BURST_GAP_MS = 300;
const SETTLE_MS = 150;

const quietUntil = new Map(); // windowId -> epoch ms
const lastCreatedAt = new Map(); // windowId -> epoch ms

chrome.windows.onCreated.addListener((win) => {
  quietUntil.set(win.id, Date.now() + WINDOW_QUIET_MS);
});
chrome.windows.onRemoved.addListener((windowId) => {
  quietUntil.delete(windowId);
  lastCreatedAt.delete(windowId);
});

// True (and quiet gets extended) when this creation is part of a
// browser-initiated burst rather than a single user action.
function inQuietPeriod(windowId) {
  const now = Date.now();
  const prev = lastCreatedAt.get(windowId) ?? 0;
  lastCreatedAt.set(windowId, now);
  const quiet = now < (quietUntil.get(windowId) ?? 0) || now - prev < BURST_GAP_MS;
  if (quiet) quietUntil.set(windowId, now + BURST_EXTEND_MS);
  return quiet;
}

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

function placeNextToCurrent(newTab) {
  if (inQuietPeriod(newTab.windowId)) return;
  if ((newTab.groupId ?? -1) > -1) return; // created straight into a group
  const createdAt = Date.now();

  // Group membership may be assigned only AFTER onCreated fires (the docs
  // are explicit about this), so let the tab settle, then re-check it
  // before moving.
  setTimeout(async () => {
    let tab;
    try {
      tab = await chrome.tabs.get(newTab.id);
    } catch (_e) {
      return; // already closed
    }
    if ((tab.groupId ?? -1) > -1) return; // joined a group while settling
    if ((lastCreatedAt.get(tab.windowId) ?? 0) > createdAt) return; // burst
    const ref = await referenceTab(tab);
    if (!ref) return;
    const target = ref.index + 1;
    if (tab.index === target) return;
    try {
      await chrome.tabs.move(tab.id, { index: target });
    } catch (_e) {
      // Tab closed or dragged mid-flight; nothing to do.
    }
  }, SETTLE_MS);
}

chrome.tabs.onCreated.addListener((tab) => {
  placeNextToCurrent(tab);
  updateBadge();
});
