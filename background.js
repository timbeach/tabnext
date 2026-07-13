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
