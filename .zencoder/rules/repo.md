# InfoGuard Repository Guide

## Project Overview

InfoGuard is an agentic AI companion that monitors incoming messages (e.g., WhatsApp forwards) and highlighted web content to detect and explain potential misinformation in real time. It provides source-backed verdicts, confidence scoring, and polite response suggestions to help users shut down false claims quickly and responsibly.

## Core Value Proposition

- **Agentic workflow**: Detects claims, gathers evidence, scores confidence, and crafts explanations.
- **Transparency by design**: Every verdict includes sources, rationale, and a confidence percentage.
- **Multilingual empathy**: Initial focus on English and major Indian languages with a human-friendly tone.
- **Unified backend**: Powers both WhatsApp bot interactions and a Chrome extension experience.

## Key User Flows

1. **Active WhatsApp Forward Check**

   - User forwards a message to the bot.
   - Backend runs claim detection → evidence search → confidence scoring.
   - Bot replies with verdict, explanation, confidence, sources, and optional buttons (`Copy Reply`, `Save`, `Feedback`).

2. **Passive Browser Highlight**

   - Chrome extension highlights suspicious text/headlines.
   - Click opens a popup card with verdict, confidence, explanation, and sources.

3. **Reply Helper**

   - Generates polite, multilingual replies users can copy to counter misinformation.

4. **Edge Case Handling (Future Enhancements)**
   - OCR pipeline for meme images.
   - Partial truth classification (`Needs Check`).
   - Feedback-driven adaptive learning animations.

## Tentative Architecture

```
backend/
  ├─ ingestion/           # Input handling (WhatsApp webhook, extension API)
  ├─ claim_detection/     # Lightweight HuggingFace classifier + heuristics
  ├─ normalization/       # Claim rewriting for searchability
  ├─ evidence_search/     # Cached fact-check DB + live trusted source queries
  ├─ scoring/             # Aggregates evidence reliability & recency
  ├─ explanation/         # Template-based response composer
  ├─ transport/           # WhatsApp/Twilio + Chrome extension bridge
  └─ tests/
extension/
  ├─ popup/               # Verdict UI
  ├─ content/             # Web page scanners
  ├─ background/          # Message passing, caching
  └─ assets/
docs/
  ├─ demo_scripts/        # Pre-scripted flows for hackathon demos
  └─ research_notes/
```

_(Structure is aspirational; adapt as code is added.)_

## Trusted Source Hierarchy

1. **Fact-checkers**: Snopes, PolitiFact, AltNews, BoomLive.
2. **Health & Government Agencies**: WHO, CDC, Ministry of Health and Family Welfare (India).
3. **Major Newsrooms**: BBC, Reuters, The Hindu, Al Jazeera (with corrections policy).
4. **Academic Literature**: PubMed, arXiv (with caution), peer-reviewed journals.

## Prototype Tech Stack (Hackathon Ready)

- **Runtime**: Python (FastAPI or Flask) or Node.js (Express) — choose the team’s strength.
- **NLP**: HuggingFace transformers (distilled models for speed), spaCy for language handling.
- **Data**: SQLite / JSON cache for preloaded fact-check records, optional Redis for caching.
- **Messaging**: Twilio WhatsApp Sandbox, Ngrok for tunneling.
- **Browser Extension**: Manifest V3, vanilla JS/TypeScript + Tailwind or simple CSS.
- **CI (Optional)**: GitHub Actions for linting/tests.

## Setup Checklist (Proposed)

1. Create virtual environment (Python) or Node workspace.
2. Install dependencies (see forthcoming `requirements.txt` or `package.json`).
3. Configure environment variables:
   - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`
   - `FACT_CHECK_DB_PATH`
   - `NGROK_ENDPOINT`
4. Seed cached fact-check DB with curated examples for demo reliability.
5. Start backend server and connect Twilio webhook.
6. Build/serve Chrome extension from `extension/` folder (load unpacked in Chrome).

## Development Guidelines

- **Explainability first**: Prefer deterministic, template-driven explanations before LLM free-form text.
- **Latency conscious**: Cache expensive calls; pre-fetch common claims for demos.
- **Localization**: Keep strings externalized for easier translation.
- **Security & Privacy**: Process only user-forwarded content; avoid storing PII.
- **Testing**: Include unit tests for claim scoring and template rendering.

## Demo Script Tips

1. **WhatsApp Flow**

   - Preload 3–4 demo messages (False, Partly True, True, Meme Image).
   - Show multilingual response toggle.
   - Demonstrate feedback buttons with simple animation/state change.

2. **Chrome Extension Flow**

   - Highlight sensational headline.
   - Show verdict card with shimmer loading state → populated results.
   - Emphasize confidence bar and source links.

3. **Closing Pitch**
   - “InfoGuard doesn’t just fact-check — it learns from you, speaks your language, and keeps misinformation in check, one message at a time.”

## Roadmap Snapshot

- **Day 1–3 (MVP)**: WhatsApp bot + backend fact-check pipeline + template responses.
- **Week 1**: Chrome extension MVP + OCR integration using Tesseract or EasyOCR.
- **Weeks 2–4**: Source retrieval improvements, better scoring calibration, feedback loop.
- **Future**: On-device inference, multilingual expansion, AI-generated reply summaries.

## Contribution Notes

- Use feature branches named `feature/<slug>`.
- Prefer descriptive commit messages (e.g., `feat: add claim normalization module`).
- Open PRs with demo steps or screenshots when UI changes are involved.

## Assets & References

- Maintain demo prompts and transcripts under `docs/demo_scripts/`.
- Store logos/UI mockups under `extension/assets/`.
- Document trusted source APIs and scraping scripts in `docs/research_notes/`.

---

Feel free to expand or revise this guide as the project evolves. Keeping this document current will help contributors ramp up quickly and ensure consistent delivery during the hackathon.
