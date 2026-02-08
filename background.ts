// Background Service Worker

declare var chrome: any;

// Listen for the extension icon click
chrome.action.onClicked.addListener((tab: any) => {
  if (tab.id) {
    // Send a message to the content script in the active tab
    chrome.tabs.sendMessage(tab.id, { action: "TOGGLE_OVERLAY" }).catch((err: any) => {
      console.warn("Could not send message to content script. The page might not be loaded yet.", err);
    });
  }
});