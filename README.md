
# ChatGPT Usage Tracker

**ChatGPT Usage Tracker** is a Chrome extension that helps you monitor your message usage limits on ChatGPT. It tracks the number of messages sent with each ChatGPT model and timestamps when the first message was sent. This way, you always know how many messages you have left before reaching your limit.

## Features

- **Model-Specific Tracking**: Keeps a separate count of messages for each ChatGPT model (e.g., GPT-4, GPT-4o).
- **Usage Limit Alerts**: Notifies you when you're approaching or have reached your message limit for a model.
- **Time-Based Resets**: Automatically resets usage counts after the predefined period for each model.
- **On-Page Usage Indicator**: Displays an unobtrusive usage indicator directly on the ChatGPT page.
- **No Account Access Required**: Operates entirely within your browser without accessing your OpenAI account data.

## Limitations

- **No Retrospective Tracking**: Cannot account for messages sent before installing the extension or messages sent via the ChatGPT mobile app.
- **Local Tracking Only**: Usage data is stored locally in your browser and does not sync across devices or browsers.
- **No Account Integration**: Since the extension doesn't access your account, it relies on monitoring the chat area to track usage.

## Installation

1. **Clone the Repository**

   ```bash
   git clone https://github.com/RetroSteve0/chatgpt-usage-tracker.git
   ```
2.  **Open Chrome Extensions Page**
    -   Navigate to `chrome://extensions/` in your Chrome browser.
3.  **Enable Developer Mode**
    -   Toggle the **Developer mode** switch in the top-right corner.
4.  **Load the Unpacked Extension**
    -   Click on **Load unpacked**.
    -   Select the `chatgpt-usage-tracker` directory you just cloned.

## Usage

1.  **Visit ChatGPT**
    -   Go to [chatgpt.com](https://chatgpt.com/) and log in to your account.
2.  **Start Chatting**
    -   Use ChatGPT as you normally would. The extension will automatically track your messages.
3.  **View Usage**
    -   An on-page indicator will display your current usage stats.
    -   Click on the indicator to expand and view detailed statistics for each model.

## FAQ
### Why isn't this extension on the Chrome Web Store?
Publishing extensions on the Chrome Web Store requires a developer registration fee of $5. Since this is a personal project, I chose to share it directly rather than publishing it on the store.

### Does this extension access my personal data?
No, the extension does not access or transmit any personal data from your OpenAI account. It operates by monitoring the chat area within your browser to track message usage.

### Can I use this extension on other browsers?
This extension is developed for Google Chrome. However, it may work on other Chromium-based browsers like Microsoft Edge or Brave with similar installation steps.

### How accurate is the usage tracking?
The extension tracks messages sent during active browser sessions where the extension is installed and active. It cannot track messages sent from other devices, browsers, or before installation.

## Contributing
Contributions are welcome! If you have suggestions, find a bug, or want to add a new feature:

-   **Fork the Repository**: Click the **Fork** button at the top right of the [GitHub page](https://github.com/RetroSteve0/chatgpt-usage-tracker).
-   **Create a New Branch**: For your feature or bug fix.
-   **Submit a Pull Request**: Describe your changes and submit a pull request for review.

## License

This project is licensed under the MIT License.

## Acknowledgements
-   **OpenAI**: For providing the ChatGPT platform.
-   **Community**: Thanks to everyone who uses the extension and provides feedback.
