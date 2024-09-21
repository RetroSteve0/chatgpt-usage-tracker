// background.js

// This can be used to perform background tasks if needed
// Currently, usage resets are handled in content.js based on timestamps

// Example: Listen for extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('ChatGPT Usage Tracker Extension Installed.');
});
