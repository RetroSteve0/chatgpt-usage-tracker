// popup.js

/**
 * Fetches and displays the usage summary from chrome.storage.local
 */

/**
 * Formats the usage data into a readable string.
 * @param {Object} usageData - The usage data from storage.
 * @param {Object} usageLimits - The usage limits configuration.
 * @param {Object} displayNames - The display names for models.
 * @returns {string} The formatted usage summary.
 */
function formatUsageSummary(usageData, usageLimits, displayNames) {
  let summary = [];

  for (let key in usageLimits) {
    const data = usageData[key] || { count: 0, resetTime: null };
    const limit = usageLimits[key].limit;
    const remaining = Math.max(limit - data.count, 0);

    let resetTimeText = 'N/A';
    if (data.resetTime) {
      const resetDate = new Date(data.resetTime);
      resetTimeText = resetDate.toLocaleString([], { hour: '2-digit', minute: '2-digit' });
    }

    const displayName = displayNames[key] || key;
    summary.push(`${displayName}: ${remaining} remaining, Resets at: ${resetTimeText}`);
  }

  return summary.join('\n');
}

/**
 * Updates the usage summary in the popup.
 */
function updateUsageSummary() {
  const summaryDiv = document.getElementById('usage-summary');

  // Define usage limits and display names (should match content.js)
  const usageLimits = {
    "4": { limit: 40, period: 3 * 60 * 60 * 1000 },          // 40 messages per 3 hours
    "4o": { limit: 80, period: 3 * 60 * 60 * 1000 },         // 80 messages per 3 hours
    "o1-mini": { limit: 50, period: 24 * 60 * 60 * 1000 },   // 50 messages per day
    "o1-preview": { limit: 50, period: 7 * 24 * 60 * 60 * 1000 } // 50 messages per week
    // "4o-mini": Unlimited (No tracking)
  };

  const displayNames = {
    "4": "ChatGPT 4",
    "4o": "ChatGPT 4o",
    "o1-mini": "ChatGPT o1-mini",
    "o1-preview": "ChatGPT o1-preview"
  };

  chrome.storage.local.get(['usageData'], (result) => {
    const usageData = result.usageData || {};
    const summary = formatUsageSummary(usageData, usageLimits, displayNames);
    summaryDiv.textContent = summary;
  });
}

/**
 * Resets the usage data.
 */
function resetUsage() {
  chrome.storage.local.set({ usageData: {} }, () => {
    updateUsageSummary();
    alert('Usage data has been reset.');
  });
}

// Initialize the popup
document.addEventListener('DOMContentLoaded', () => {
  updateUsageSummary();

  const resetButton = document.getElementById('reset-button');
  resetButton.addEventListener('click', resetUsage);
});
