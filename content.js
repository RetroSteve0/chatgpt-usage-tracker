// content.js

/**
 * ChatGPT Usage Tracker Content Script
 * 
 * This script tracks the usage of different ChatGPT models by monitoring new messages
 * in the chat area of the ChatGPT website. It displays a usage indicator on the page,
 * manages usage counts, handles automatic resets based on predefined periods, and shows
 * a splash screen upon first installation.
 */

// -----------------------------
// Configuration
// -----------------------------

// Define usage limits for each ChatGPT model
const usageLimits = {
  "4o": { limit: 80, period: 3 * 60 * 60 * 1000 },            // 80 messages per 3 hours
  "o1-preview": { limit: 50, period: 7 * 24 * 60 * 60 * 1000 }, // 50 messages per week
  "o1-mini": { limit: 50, period: 24 * 60 * 60 * 1000 },     // 50 messages per day
  "4": { limit: 40, period: 3 * 60 * 60 * 1000 }            // 40 messages per 3 hours
  // "4o-mini": Unlimited (No tracking)
};

// Define user-friendly display names for each model
const displayNames = {
  "4": "ChatGPT 4",
  "4o": "ChatGPT 4o",
  "o1-mini": "ChatGPT o1-mini",
  "o1-preview": "ChatGPT o1-preview"
};

// -----------------------------
// Utility Functions
// -----------------------------

/**
 * Returns the current timestamp in milliseconds.
 * @returns {number} Current timestamp.
 */
const now = () => new Date().getTime();

/**
 * Detects the current ChatGPT model being used by examining specific DOM elements.
 * @returns {string|null} The model key if detected, otherwise null.
 */
function detectModel() {
  console.log('detectModel: Starting model detection.');
  const spans = document.querySelectorAll('span.text-token-text-secondary');
  for (let span of spans) {
    const text = span.textContent.trim();
    if (["4o mini", "4", "4o", "o1-preview", "o1-mini"].includes(text)) {
      const modelKey = text.replace(' mini', '-mini'); // Convert to key format (e.g., "4o mini" -> "4o-mini")
      console.log(`detectModel: Detected model - ${modelKey}`);
      return modelKey;
    }
  }
  console.log('detectModel: No model detected.');
  return null;
}

// -----------------------------
// Storage Initialization
// -----------------------------

/**
 * Initializes usage data in chrome.storage.local if it doesn't exist.
 */
chrome.storage.local.get(['usageData'], (result) => {
  if (!result.usageData) {
    chrome.storage.local.set({ usageData: {} }, () => {
      console.log('initializeStorage: Initialized usageData in storage.');
    });
  } else {
    console.log('initializeStorage: usageData already exists.');
  }
});

// -----------------------------
// Usage Tracking Functions
// -----------------------------

/**
 * Increments the usage count for a specific model and tracks the last used model.
 * @param {string} model - The key of the ChatGPT model.
 */
function incrementUsage(model) {
  console.log(`incrementUsage: Attempting to increment usage for model - ${model}`);
  
  if (model === "4o-mini") {
    // Unlimited usage; no tracking needed.
    console.log('incrementUsage: Model is 4o-mini. No tracking needed.');
    return;
  }

  chrome.storage.local.get(['usageData'], (result) => {
    let usageData = result.usageData || {};

    const currentTime = now();

    if (!usageData[model]) {
      // First usage of the model
      usageData[model] = {
        count: 1,
        resetTime: currentTime + usageLimits[model].period
      };
      console.log(`First message sent for ${displayNames[model] || model}. Timer started.`);
    } else {
      // Subsequent usage
      // Check if the reset period has passed
      if (currentTime > usageData[model].resetTime) {
        // Reset count and timer
        usageData[model].count = 1;
        usageData[model].resetTime = currentTime + usageLimits[model].period;
        console.log(`Usage period reset for ${displayNames[model] || model}. Timer restarted.`);
      } else {
        // Increment count without resetting timer
        usageData[model].count += 1;
        console.log(`Usage incremented for ${displayNames[model] || model}: ${usageData[model].count}/${usageLimits[model].limit}`);
      }
    }

    // Save updated usage data and update the last used model
    chrome.storage.local.set({ 
      usageData,
      lastUsedModel: model  // Track the last used model
    }, () => {
      console.log(`incrementUsage: Updated usageData and set lastUsedModel to ${model}.`);
      checkLimit(model, usageData[model].count);
      updateIndicator();
    });
  });
}

/**
 * Checks if the usage count has exceeded the limit for a model.
 * @param {string} model - The key of the ChatGPT model.
 * @param {number} count - The current usage count.
 */
function checkLimit(model, count) {
  const limit = usageLimits[model].limit;
  if (count > limit) {
    console.log(`checkLimit: Usage limit exceeded for ${model}. Count: ${count}, Limit: ${limit}`);
    notifyUser(`Usage limit reached for ${displayNames[model] || model}. Limit: ${limit} messages.`);
    // Optionally, disable input or take other actions here
    disableInput();
  } else {
    console.log(`checkLimit: Usage within limit for ${model}. Count: ${count}, Limit: ${limit}`);
  }
}

/**
 * Disables the input field to prevent further messages when the usage limit is reached.
 */
function disableInput() {
  const inputField = document.querySelector('div.ProseMirror');
  if (inputField) {
    inputField.setAttribute('contenteditable', 'false');
    inputField.style.backgroundColor = '#f0f0f0'; // Visual indication
    console.log('disableInput: Input field disabled due to usage limit.');
  } else {
    console.log('disableInput: Input field not found.');
  }
}

/**
 * Enables the input field when usage counts are reset.
 */
function enableInput() {
  const inputField = document.querySelector('div.ProseMirror');
  if (inputField) {
    inputField.setAttribute('contenteditable', 'true');
    inputField.style.backgroundColor = ''; // Reset to original
    console.log('enableInput: Input field enabled.');
  } else {
    console.log('enableInput: Input field not found.');
  }
}

/**
 * Notifies the user with an in-page notification message.
 * @param {string} message - The message to display.
 */
function notifyUser(message) {
  console.log(`notifyUser: ${message}`);
  // Create a notification element if it doesn't exist
  let notification = document.getElementById('chatgpt-usage-notification');
  if (!notification) {
    notification = document.createElement('div');
    notification.id = 'chatgpt-usage-notification';
    notification.classList.add('notification');
    document.body.appendChild(notification);
  }

  // Set the message and display the notification
  notification.textContent = message;
  notification.style.display = 'block';

  // Hide the notification after 5 seconds
  setTimeout(() => {
    notification.style.display = 'none';
  }, 5000);
}

// -----------------------------
// Reset Functionality
// -----------------------------

/**
 * Resets usage counts and timers if their periods have expired.
 */
function resetUsageIfNeeded() {
  chrome.storage.local.get(['usageData'], (result) => {
    let usageData = result.usageData || {};
    let hasReset = false;

    for (let key in usageData) {
      if (key === "4o-mini") continue; // Skip unlimited usage models
      const data = usageData[key];
      const currentTime = now();

      if (data.resetTime && currentTime >= data.resetTime) {
        // Reset count and set new resetTime
        usageData[key].count = 0;
        usageData[key].resetTime = currentTime + usageLimits[key].period;
        hasReset = true;
        console.log(`resetUsageIfNeeded: Usage for ${displayNames[key] || key} has been reset.`);
      }
    }

    if (hasReset) {
      chrome.storage.local.set({ usageData }, () => {
        console.log('resetUsageIfNeeded: Updated usageData after reset.');
        updateIndicator();
        enableInput();
      });
    } else {
      console.log('resetUsageIfNeeded: No usage data needed to reset.');
    }
  });
}

// -----------------------------
// Splash Screen Functions
// -----------------------------

/**
 * Displays the splash screen overlay with a welcome message.
 */
function showSplashScreen() {
  // Create the splash screen container
  const splash = document.createElement('div');
  splash.id = 'chatgpt-usage-splash';
  
  // Inner content with the updated message
  splash.innerHTML = `
    <div class="splash-content">
      <h2>Welcome to ChatGPT Usage Tracker!</h2>
      <p>Thank you for installing the ChatGPT Usage Tracker extension. This tool helps you monitor and manage your ChatGPT usage across different models.</p>
      <p><strong>Please Note:</strong> This extension tracks your ChatGPT usage by monitoring new messages in the chat area. It does not have access to your account data, so any messages sent using limited models <strong>before</strong> installing this extension won't be counted. As a result, your usage tracker may not reflect these earlier messages.</p>
      <button class="close-button">Close</button>
    </div>
  `;
  
  // Append the splash screen to the body
  document.body.appendChild(splash);
  
  // Add event listener to the Close button to remove the splash screen
  const closeButton = splash.querySelector('.close-button');
  closeButton.addEventListener('click', () => {
    splash.remove();
    console.log('showSplashScreen: Splash screen closed by user.');
  });

  console.log('showSplashScreen: Splash screen displayed.');
}

/**
 * Checks if the splash screen has been shown before and displays it if not.
 */
function checkAndShowSplashScreen() {
  chrome.storage.local.get(['hasShownSplash'], (result) => {
    if (!result.hasShownSplash) {
      showSplashScreen();
      chrome.storage.local.set({ hasShownSplash: true }, () => {
        console.log('checkAndShowSplashScreen: Splash screen marked as shown.');
      });
    } else {
      console.log('checkAndShowSplashScreen: Splash screen already shown.');
    }
  });
}

// -----------------------------
// Usage Indicator Functions
// -----------------------------

/**
 * Updates the usage indicator UI element with current usage data.
 * Displays "ChatGPT o1-mini: 25 uses remaining" in green when collapsed.
 * Removes this text when expanded.
 */
function updateIndicator() {
  let indicator = document.getElementById('chatgpt-usage-indicator');
  if (!indicator) {
    // Create the indicator container if it doesn't exist
    indicator = document.createElement('div');
    indicator.id = 'chatgpt-usage-indicator';
    indicator.innerHTML = `
      <div class="header">
        <div class="header-top">
          <h3>ChatGPT Usage</h3>
          <button class="toggle-button">▼</button>
        </div>
        <div class="header-bottom">
          <span id="collapsed-usage-text">ChatGPT o1-mini: 25 uses remaining</span>
        </div>
      </div>
      <div class="content">
        <ul></ul>
      </div>
    `;
    document.body.appendChild(indicator);

    // Add event listener for the header to collapse/expand the indicator
    const header = indicator.querySelector('.header');
    header.addEventListener('click', (event) => {
      // Prevent toggle when clicking on the toggle button to avoid event bubbling
      if (event.target.classList.contains('toggle-button') || event.target.closest('.toggle-button')) {
        return;
      }
      indicator.classList.toggle('expanded'); // Toggle the 'expanded' class
      const toggleButton = indicator.querySelector('.toggle-button');
      toggleButton.textContent = indicator.classList.contains('expanded') ? '▲' : '▼';
      console.log('updateIndicator: Toggled usage indicator.');
    });

    // Retrieve and apply the collapsed state from storage
    chrome.storage.local.get(['isCollapsed'], (result) => {
      if (result.isCollapsed) {
        indicator.classList.add('collapsed');
        const toggleButton = indicator.querySelector('.toggle-button');
        toggleButton.textContent = '▲';
      }
    });
  }

  // Retrieve usageData and lastUsedModel from storage
  chrome.storage.local.get(['usageData', 'lastUsedModel'], (result) => {
    const usageData = result.usageData || {};
    const lastUsedModel = result.lastUsedModel || null;
    const list = indicator.querySelector('ul');
    list.innerHTML = ''; // Clear existing list items

    // Calculate remaining uses for the last used model
    let remainingUsesText = "N/A";
    if (lastUsedModel && usageLimits[lastUsedModel]) {
      const usedCount = usageData[lastUsedModel]?.count || 0;
      const remaining = usageLimits[lastUsedModel].limit - usedCount;
      remainingUsesText = `${remaining} uses remaining`;
    }

    // Update the collapsed usage text
    const collapsedUsageText = indicator.querySelector('#collapsed-usage-text');
    if (collapsedUsageText) {
      if (lastUsedModel) {
        const displayName = displayNames[lastUsedModel] || lastUsedModel;
        collapsedUsageText.textContent = `${displayName}: ${remainingUsesText}`;
      } else {
        collapsedUsageText.textContent = `ChatGPT Usage: N/A`;
      }
    }

    // Iterate through all defined models to display their usage stats
    for (let key in usageLimits) {
      const data = usageData[key] || { count: 0, resetTime: null };
      const limit = usageLimits[key].limit || "N/A";
      const remaining = usageLimits[key] ? Math.max(usageLimits[key].limit - data.count, 0) : "N/A";
      
      let resetTimeText = getDefaultResetText(key); // Get default reset time for unused models

      if (data.resetTime) {
        const remainingTime = data.resetTime - now();

        if (remainingTime > 0) {
          const resetInHours = Math.floor(remainingTime / (1000 * 60 * 60));
          const resetInMinutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
          resetTimeText = `${resetInHours}h ${resetInMinutes}m`;
        } else {
          resetTimeText = getResetTimeAfterExpiry(key);
        }
      }

      // Use displayNames mapping for user-friendly model names
      const displayName = displayNames[key] || key;

      // Create a list item for the model's usage stats
      const listItem = document.createElement('li');

      // Check if this model is the last used model
      if (key === lastUsedModel) {
        listItem.classList.add('last-used'); // Add a special class for highlighting
        console.log(`updateIndicator: Highlighting last used model - ${displayName}`);
      }

      listItem.innerHTML = `
        <strong>${displayName}:</strong> ${data.count}/${limit} messages (${remaining} remaining)
        <br/>
        <em>Resets in: ${resetTimeText}</em>
      `;
      list.appendChild(listItem);
    }
  });

  // After updating the indicator, check if any usage counts need to be reset
  resetUsageIfNeeded();
}

/**
 * Returns the default reset time text based on the model's period.
 * @param {string} model - The key of the ChatGPT model.
 * @returns {string} The default reset time text.
 */
function getDefaultResetText(model) {
  switch (model) {
    case "4o":
      return "3h 0m";
    case "o1-preview":
      return "7d 0h";
    case "o1-mini":
      return "24h 0m";
    case "4":
      return "3h 0m";
    default:
      return "N/A";
  }
}

/**
 * Returns the reset time text when the usage period has expired.
 * @param {string} model - The key of the ChatGPT model.
 * @returns {string} The reset time text after expiry.
 */
function getResetTimeAfterExpiry(model) {
  switch (model) {
    case "4o":
      return "3h 0m";
    case "o1-preview":
      return "7d 0h";
    case "o1-mini":
      return "24h 0m";
    case "4":
      return "3h 0m";
    default:
      return "N/A";
  }
}

// -----------------------------
// Mutation Observer Setup
// -----------------------------

/**
 * Observes the chat message container to detect new messages and increment usage counts.
 */
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'childList') {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // Detect sent messages; adjust selector based on actual ChatGPT DOM structure
          if (node.matches('article[data-testid^="conversation-turn-"]')) {
            console.log('observer: Detected new message.');
            const model = detectModel();
            if (model) {
              incrementUsage(model);
            } else {
              console.log('observer: No model detected for the new message.');
            }
          }
        }
      });
    }
  });
});

/**
 * Starts observing the chat message container for new messages.
 * Retries if the container is not immediately available due to dynamic loading.
 */
const startObserving = () => {
  // Adjust the selector based on the actual ChatGPT.com DOM structure
  const messageContainer = document.querySelector("body > div.relative.flex.h-full.w-full.overflow-hidden.transition-colors.z-0 > div.relative.flex.h-full.max-w-full.flex-1.flex-col.overflow-hidden");
  if (messageContainer) {
    observer.observe(messageContainer, { childList: true, subtree: true });
    console.log('startObserving: Started observing message container.');
  } else {
    // Retry if the container is not found yet (e.g., due to dynamic loading)
    console.log('startObserving: Message container not found. Retrying in 1 second.');
    setTimeout(startObserving, 1000);
  }
};

// -----------------------------
// Initialization on Page Load
// -----------------------------

/**
 * Initializes the extension functionalities upon page load.
 */
window.addEventListener('load', () => {
  console.log('content.js: Page loaded. Initializing extension.');
  startObserving();             // Start monitoring new messages
  updateIndicator();            // Display or update the usage indicator
  checkAndShowSplashScreen();   // Show splash screen if not shown before
});

// -----------------------------
// Periodic Updates and Storage Listener
// -----------------------------

// Periodically update the usage indicator every 1 minute
setInterval(() => {
  console.log('setInterval: Updating usage display.');
  updateIndicator();
}, 60 * 1000); // 60,000 milliseconds

/**
 * Listens for changes in chrome.storage and updates the usage indicator in real-time.
 */
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && (changes.usageData || changes.lastUsedModel)) {
    console.log('chrome.storage.onChanged: Detected changes in usageData or lastUsedModel.');
    updateIndicator();
    if (changes.usageData && changes.usageData.newValue) {
      for (let model in changes.usageData.newValue) {
        const count = changes.usageData.newValue[model].count;
        checkLimit(model, count);
      }
    }
  }
});
