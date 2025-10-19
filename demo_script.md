# InfoGuard Demo Script

## Setup Instructions

1. Start the backend services:
   ```
   cd InfoGuard
   docker-compose up
   ```

2. Start ngrok to expose the WhatsApp webhook:
   ```
   ngrok http 8001
   ```

3. Configure Twilio sandbox with the ngrok URL:
   - Go to Twilio Console > WhatsApp Sandbox
   - Set the webhook URL to: `https://[your-ngrok-url]/webhook`

4. Load the Chrome extension:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `extension` folder

## Demo Flow

### 1. Backend Services Verification (30 seconds)
- Show the terminal with running Docker containers
- Verify API endpoints are accessible:
  - Open browser to `http://localhost:8000/docs` to show Swagger UI
  - Demonstrate the `/api/v1/check-claim` endpoint with a sample request

### 2. WhatsApp Bot Demo (1 minute)
- Forward the false claim to the WhatsApp sandbox number:
  ```
  "Drinking herbal tea cures COVID."
  ```
- Show the formatted response with:
  - ⚠️ Likely False — 78%
  - Explanation
  - Sources
  - Action buttons

- Toggle language to Hindi and send:
  ```
  "हर्बल चाय पीने से कोविड ठीक हो जाता है।"
  ```
- Show the Hindi response with the same structured format

### 3. Chrome Extension Demo (2 minutes)
- Navigate to a news website (e.g., `example.com/news`)
- Point out highlighted keywords (e.g., "5G", "miracle cure")
- Click on a highlighted keyword
- Show the popup appearing with:
  - Shimmer loading animation
  - Progress bar animation filling to confidence level
  - Verdict card with explanation
  - Source cards with links
  - Action buttons at the bottom

- Click "Copy Reply" and paste into a text editor to show the formatted response
- Demonstrate language toggle:
  - Switch to Tamil and show UI updates
  - Switch back to English

### 4. OCR Demo (1 minute)
- Navigate to the OCR demo page:
  ```
  http://localhost:8000/api/v1/demo/meme_image
  ```
- Upload the sample meme image about "vaccine contains microchip"
- Show the OCR result and subsequent fact-check response
- Point out the high confidence score (92%) and sources

### 5. Privacy Features (30 seconds)
- In the extension popup, toggle the "Privacy" switch to "On-device"
- Point out the badge changing to "On-device Processing"
- Click the feedback thumbs-up button to demonstrate the animation
- Explain that in a full implementation, this would enable local processing without sending data to servers

## Key Talking Points

- **Multilingual Support**: The system works in English, Hindi, and Tamil
- **Deterministic Responses**: Pre-cached data ensures reliable demo performance
- **Polished UI**: Animations, progress bars, and micro-interactions enhance user experience
- **Privacy-Focused**: On-device processing option for sensitive information
- **Cross-Platform**: Same core functionality available via WhatsApp and Chrome extension

## Troubleshooting

- If WhatsApp messages aren't receiving responses, check the ngrok URL and Twilio configuration
- If the extension isn't highlighting keywords, refresh the page and check the console for errors
- If Docker containers fail to start, ensure ports 8000 and 8001 are available