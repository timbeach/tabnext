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
