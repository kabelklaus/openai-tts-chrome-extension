# OpenAI TTS Chrome Extension

A Chrome extension that uses the OpenAI Text-to-Speech API to read selected text on web pages.

## Features

- Reads selected text on web pages
- Supports all OpenAI TTS voices (Alloy, Echo, Fable, Onyx, Nova, Shimmer)
- Adjustable speech speed
- Stores API key and settings locally
- Keyboard shortcut support (Ctrl+Shift+S / Cmd+Shift+S on Mac)
- Context menu integration (right-click menu)
- Options page for advanced settings
- Clipboard support for reading text

## Installation

1. Download the repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked extension"
5. Select the folder containing the extension files

## Usage

1. Click the extension icon to open the popup
2. Enter your OpenAI API key and click "Save"
3. Choose a voice and speech speed
4. Select text on a webpage
5. Use one of these methods to have the text read aloud:
   - Click the extension icon
   - Use the context menu (right-click)
   - Use the keyboard shortcut (Ctrl+Shift+S / Cmd+Shift+S on Mac)

## Configuration

- Access advanced settings through the options page
- Customize keyboard shortcuts in Chrome's extension settings
- Configure voice preferences and API settings

## Notes

- You need a valid OpenAI API key with access to the TTS API
- Using the OpenAI API incurs costs
- The extension requires permissions for: activeTab, storage, contextMenus, scripting, and clipboard access