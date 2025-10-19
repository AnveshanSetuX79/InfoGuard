# InfoGuard

## Overview

InfoGuard is a demo-ready misinformation defense suite that combines a FastAPI backend, a Twilio-compatible WhatsApp bot, and a polished Chrome extension prototype. Together they showcase how multilingual fact-checking workflows, deterministic demo data, and privacy-aware UX can deliver confident verdicts across chat apps and the web.

- **Backend API (FastAPI)**: Serves deterministic claim verdicts, mock retrieval, and OCR endpoints backed by curated sample data.
- **WhatsApp Bot (FastAPI + Twilio)**: Responds to forwarded claims via Twilio's WhatsApp Sandbox, returning localized fact-checks.
- **Chrome Extension (Manifest v3)**: Highlights suspicious terms on any page and opens a rich popup with verdicts, confidence scoring, sources, and user actions.
- **Static Website**: Marketing-style landing page describing InfoGuard’s value proposition and demo flows.

Use this repository to run scripted demos, simulate misinformation scenarios, and demonstrate multilingual UX across surfaces.

---

## Repository Structure

```text
InfoGuard/
├── backend/                  # FastAPI services and deterministic demo data
│   ├── main.py                # REST API: check-claim, retrieve, OCR endpoints
│   ├── whatsapp_bot.py        # Twilio webhook handler serving the WhatsApp demo
│   ├── requirements.txt       # Python dependencies (FastAPI, Twilio, OCR libs)
│   ├── Dockerfile             # Container image for backend + OCR dependencies
│   └── sample_data/           # Curated verdicts and claim index JSON
├── extension/                 # Chrome extension prototype (Manifest v3)
│   ├── manifest.json          # Extension configuration
│   ├── background/service.js  # Service worker bridging content + backend
│   ├── content/highlight.js   # DOM highlighter for suspicious keywords
│   ├── popup/                 # Popup UI (HTML/CSS/JS)
│   └── shared/                # Reusable mock data + type definitions
├── website/                   # Landing page assets for InfoGuard marketing site
├── docker-compose.yml         # Multi-service compose file (API + WhatsApp bot)
├── demo_script.md             # Guided walkthrough for live demos
├── jsconfig.json              # VS Code configuration for extension JS typing
└── README.md                  # You are here
```

---

## Features by Surface

### Backend API (FastAPI)

1. **Claim Analysis** – `POST /api/v1/check-claim` returns deterministic verdicts sourced from `sample_data/preloaded_demo.json`. Responses include confidence scores, multilingual explanations (English, Hindi, Tamil), sources, and suggested replies.
2. **Evidence Retrieval** – `POST /api/v1/retrieve` blends cached evidence (`claims_index.json`) with deep links to WHO and Reuters to simulate evidence gathering.
3. **Feedback Capture** – `POST /api/v1/feedback` logs simple feedback events in memory for demo telemetry.
4. **OCR Endpoint** – `POST /api/v1/ocr` (multipart) accepts images and runs Tesseract OCR when dependencies are available. Falls back gracefully if OCR libraries are missing.
5. **Demo Access** – `GET /api/v1/demo/{category}` fetches localized demo responses by category (`false`, `partly_true`, `true`, `meme_image`).

### WhatsApp Bot

- Exposes `POST /webhook` for Twilio's WhatsApp Sandbox.
- Mirrors backend verdict generation with keyword heuristics to map claims to demo categories.
- Returns polite, emoji-rich replies including confidence, embedded sources, and call-to-action buttons.
- Supports light language switching (English, Hindi, Tamil) based on message hints.

### Chrome Extension

- **Content Script** (`content/highlight.js`): Injects highlight styling and wraps suspicious keywords (e.g., “5G”, “microchip”). Clicking a highlight triggers verdict retrieval.
- **Background Service Worker** (`background/service.js`): Handles messaging between content and popup, fetches verdicts from backend (with mock fallback), caches latest verdict context, and opens the popup.
- **Popup UI** (`popup/index.html`, `popup/script.js`, `popup/styles.css`): Presents verdict summary, animated confidence bar, multilingual strings, source cards, copy/save buttons, and privacy toggle. Includes shimmer loading overlay and interactive feedback animations.

### Static Website

- Marketing narrative authored in `website/index.html` with supporting `styles.css` and `script.js`.
- Sections include hero story, capabilities, workflows, demo preview, sources, privacy messaging, roadmap, and contact prompts.
- Designed for showcasing InfoGuard's UX story in pitches or product overviews.

---

## Getting Started

### 1. Prerequisites

- **Docker & Docker Compose** (recommended for running backend + bot together).
- **Python 3.11** if running backend locally without containers.
- **Node.js/NPM** (optional) for linting or tooling around the extension.
- **ngrok** and **Twilio Sandbox** access for WhatsApp demo exposure.
- **Chrome Browser** with developer mode enabled to load the extension.

### 2. Launch with Docker Compose (recommended)

```powershell
Set-Location "c:\Users\Dell\OneDrive\Desktop\InfoGuard"
docker compose up --build
```

This builds the Python image (including OCR dependencies) and launches:

1. **Backend API** on `http://localhost:8000`
2. **WhatsApp bot** on `http://localhost:8001`

Use `docker compose down` to stop services.

### 3. Run Backend Locally (without Docker)

```powershell
Set-Location "c:\Users\Dell\OneDrive\Desktop\InfoGuard\backend"
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

For the WhatsApp bot:

```powershell
uvicorn whatsapp_bot:app --reload --port 8001
```

> **Note:** OCR endpoints rely on Tesseract/OpenCV. Install system dependencies or run inside Docker for full functionality.

### 4. Load the Chrome Extension

1. Open `chrome://extensions/`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked** and select `c:\Users\Dell\OneDrive\Desktop\InfoGuard\extension`
4. Pin the extension icon to the toolbar for quick access

While browsing, highlights appear automatically on suspicious keywords. Click a highlight to trigger verdict retrieval and open the popup.

### 5. Configure WhatsApp Demo

1. Start backend + bot (Docker or local `uvicorn` commands above).
2. Run ngrok to tunnel the bot:
   ```powershell
   ngrok http 8001
   ```
3. In Twilio Console → WhatsApp Sandbox, set the webhook URL to the ngrok HTTPS forwarding address (e.g., `https://abcd1234.ngrok.io/webhook`).
4. Join the sandbox via Twilio instructions.
5. Forward demo claims (e.g., “Drinking herbal tea cures COVID.”) and observe localized fact-check replies.

---

## Demo Playbook

Refer to `demo_script.md` for a staged walkthrough covering:

1. **Backend Verification** – Show running containers, test `GET /docs`, exercise `/api/v1/check-claim` in Swagger.
2. **WhatsApp Bot** – Send sample English/Hindi/Tamil claims and highlight verdict formatting.
3. **Chrome Extension** – Demonstrate highlight interactions, shimmer loading, animated confidence bar, source cards, language toggles, privacy switch, and feedback buttons.
4. **OCR Flow** – Visit `http://localhost:8000/api/v1/demo/meme_image`, upload sample meme, and show OCR-to-verdict pipeline.
5. **Privacy Messaging** – Emphasize on-device toggle and ethical data handling.

---

## Configuration & Customization

- **API Base URL for Extension**: Stored via `chrome.storage.sync`; defaults to `http://localhost:8000`. Modify in popup settings (once wired) or extend the service worker to allow manual overrides.
- **Highlight Keywords**: Update `SUSPICIOUS_KEYWORDS` in `content/highlight.js` to target additional phrases.
- **Demo Data**: Expand `sample_data/preloaded_demo.json` and `claims_index.json` with new categories, sources, and languages.
- **Mock Verdicts**: Adjust `extension/shared/mockData.js` to align with new scenarios or backend responses.

---

## Development Tooling

- `.vscode/tasks.json` contains helper commands (`docker compose up/down`, log tailing) for convenience inside VS Code.
- `jsconfig.json` enables IntelliSense and static checking for the extension’s modular JavaScript.
- Linting or bundling is not preconfigured; add tooling (e.g., ESLint, Prettier, Vite) as needed.

---

## Troubleshooting

- **API Unavailable**: Ensure Docker containers are running or `uvicorn` processes are active on ports 8000/8001. Check firewall permissions.
- **Twilio Webhook Errors**: Confirm ngrok tunnel is active and Twilio sandbox webhook targets the HTTPS URL ending with `/webhook`.
- **Extension Not Highlighting**: Refresh the page after loading the extension. Review `content/highlight.js` logs via DevTools → Console.
- **Clipboard Access Blocked**: Chrome may require page focus or user gesture to allow copied text. Click within popup before using “Copy Reply”.
- **OCR Failures**: Run inside Docker (ensures Tesseract libs) or install local dependencies. Fallback response indicates whether OCR support is missing.

---

## Roadmap Ideas

- Integrate live retrieval backed by external APIs instead of static JSON.
- Add analytics dashboard for feedback events and claim categories.
- Implement secure auth for privacy toggle and saved verdicts.
- Expand language support beyond English/Hindi/Tamil.
- Package Chrome extension for Chrome Web Store submission.
- Deploy backend services (e.g., Fly.io, Render) for persistent demos.

---

## Licensing & Credits

This project is provided as a demo artifact without an explicit license. Before productionizing, add appropriate licensing and ensure compliance with dependencies (FastAPI, Twilio, Chrome Manifest v3, Tesseract). Sample data references WHO, Reuters, CDC, BBC fact-check resources.

---

## Acknowledgements

- Inspired by public misinformation-fighting initiatives and fact-checking organizations.
- Icons and imagery referenced in the extension and landing page are placeholders for demonstration purposes.
