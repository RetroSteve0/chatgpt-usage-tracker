// popup.js

/**
 * Handles the display and manual adjustments of usage data in the popup interface.
 */

/**
 * Defines usage limits and display names for models (should match content.js)
 */
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

/**
 * Formats the usage data into a readable string for the usage summary.
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
 * Loads current usage data and populates both the usage summary and manual adjustment inputs.
 */
function loadUsageData() {
  chrome.storage.local.get(['usageData'], (result) => {
    const usageData = result.usageData || {};

    // Populate input fields for each model
    for (let model in usageLimits) {
      const usesInput = document.getElementById(`uses-${model}`);
      const resetInput = document.getElementById(`reset-${model}`);

      if (usageData[model]) {
        const remaining = Math.max(usageLimits[model].limit - usageData[model].count, 0);
        usesInput.value = remaining;

        // Convert resetTime from timestamp to datetime-local format
        if (usageData[model].resetTime) {
          const resetDate = new Date(usageData[model].resetTime);
          const tzOffset = resetDate.getTimezoneOffset() * 60000; // in milliseconds
          const localISOTime = (new Date(resetDate - tzOffset)).toISOString().slice(0,16);
          resetInput.value = localISOTime;
        } else {
          resetInput.value = '';
        }
      } else {
        // If no data exists, set default values
        usesInput.value = usageLimits[model].limit;
        resetInput.value = '';
      }
    }
  });
}

/**
 * Saves the manual adjustments made by the user to chrome.storage.local
 */
function saveUsageData() {
  const statusMessage = document.getElementById('status-message');

  const newUsageData = {};

  for (let model in usageLimits) {
    const usesInput = document.getElementById(`uses-${model}`);
    const resetInput = document.getElementById(`reset-${model}`);

    const remainingUses = parseInt(usesInput.value, 10);
    const resetTimeISO = resetInput.value;
    const resetTime = resetTimeISO ? new Date(resetTimeISO).getTime() : null;

    // Input Validation
    if (isNaN(remainingUses) || remainingUses < 0) {
      alert(`Please enter a valid number of remaining uses for ${displayNames[model] || model}.`);
      return;
    }

    if (!resetTimeISO || isNaN(resetTime)) {
      alert(`Please enter a valid reset time for ${displayNames[model] || model}.`);
      return;
    }

    // Ensure that the reset time is in the future
    const currentTime = Date.now();
    if (resetTime <= currentTime) {
      alert(`Please enter a reset time that is in the future for ${displayNames[model] || model}.`);
      return;
    }

    // Calculate the count based on remaining uses
    const limit = usageLimits[model].limit;
    const count = limit - remainingUses >= 0 ? limit - remainingUses : 0;

    newUsageData[model] = {
      count: count,
      resetTime: resetTime
    };
  }

  // Save the new usage data to chrome.storage.local
  chrome.storage.local.get(['usageData'], (result) => {
    const usageData = result.usageData || {};

    // Update usageData with new values
    for (let model in newUsageData) {
      usageData[model] = {
        count: newUsageData[model].count,
        resetTime: newUsageData[model].resetTime
      };
    }

    chrome.storage.local.set({ usageData }, () => {
      console.log('popup.js: Usage data updated manually.');
      statusMessage.textContent = 'Usage data updated successfully!';
      setTimeout(() => {
        statusMessage.textContent = '';
      }, 3000);
      
      // Optionally, refresh usage data in the popup if you choose to keep the summary
      // loadUsageData();
    });
  });
}

/**
 * Resets all usage data to default limits and clears reset times.
 */
function resetAllUsage() {
  if (confirm('Are you sure you want to reset all usage data? This cannot be undone.')) {
    chrome.storage.local.set({ usageData: {} }, () => {
      console.log('popup.js: All usage data has been reset.');
      loadUsageData();
      const statusMessage = document.getElementById('status-message');
      statusMessage.textContent = 'All usage data has been reset.';
      setTimeout(() => {
        statusMessage.textContent = '';
      }, 3000);
    });
  }
}

// Initialize the popup
document.addEventListener('DOMContentLoaded', () => {
  loadUsageData();

  const saveButton = document.getElementById('save-button');
  saveButton.addEventListener('click', saveUsageData);

  const resetButton = document.getElementById('reset-button');
  resetButton.addEventListener('click', resetAllUsage);
});
