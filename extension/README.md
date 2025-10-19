# InfoGuard Chrome Extension (MVP)

## Overview

This extension surfaces InfoGuard verdicts inside the browser. The initial MVP focuses on a polished popup experience powered by mock data so stakeholders can preview the UX before backend integration.

## Structure

```
extension/
  ├─ manifest.json         # Manifest V3 configuration
  ├─ popup/                # Popup HTML, styles, and scripts
  ├─ content/              # Highlighting logic injected into web pages
  ├─ background/           # Service worker ready for messaging + networking
  ├─ shared/               # Shared types and mock data
  └─ assets/               # Icons and additional assets (placeholders for now)
```

## Getting Started

1. **Build assets (optional):** All files are plain HTML/CSS/JS and require no bundler.
2. **Load the extension:**
   - Open `chrome://extensions` in Google Chrome.
   - Toggle **Developer mode**.
   - Click **Load unpacked** and select the `extension/` directory.
3. **Demo the popup:** Click the InfoGuard icon in the toolbar. The popup displays a verdict, explanation, confidence bar, and source links populated via `shared/mockData.js`.
4. **Test highlights:** Visit any page containing keywords such as `5G`, `miracle cure`, `secret lab`, or `microchip`. The content script highlights matching text for demo visibility.

## Next Steps

- Replace mock verdict with real backend responses via the background service worker.
- Expand `content/highlight.js` with smarter heuristics or API-driven detection.
- Store user preferences (language, tone) using the `chrome.storage` APIs.
- Add icon assets under `assets/` and update the manifest paths accordingly.
