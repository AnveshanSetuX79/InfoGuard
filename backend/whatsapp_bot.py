from fastapi import FastAPI, Request, Form, HTTPException
from fastapi.responses import PlainTextResponse
import requests
import json
import os
from twilio.twiml.messaging_response import MessagingResponse

# This would be imported from main.py in a real implementation
# For demo purposes, we'll duplicate some code
DATA_PATH = os.path.join(os.path.dirname(__file__), "sample_data", "preloaded_demo.json")

try:
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        demo_data = json.load(f)
except FileNotFoundError:
    demo_data = {}
    print(f"Warning: Demo data file not found at {DATA_PATH}")

app = FastAPI(title="InfoGuard WhatsApp Bot")

@app.get("/")
def read_root():
    return {"status": "ok", "message": "InfoGuard WhatsApp Bot is running"}

@app.post("/webhook", response_class=PlainTextResponse)
async def webhook(request: Request, Body: str = Form(...), From: str = Form(...), To: str = Form(...)):
    """
    Twilio webhook for WhatsApp messages
    """
    # Create a response object
    resp = MessagingResponse()
    
    # Get the message text
    message_text = Body.strip()
    
    # Determine the language based on the message content or user preference
    # For demo purposes, we'll default to English
    language = "en"
    
    # Check if the message contains any language indicators
    if "हिंदी" in message_text or "hindi" in message_text.lower():
        language = "hi"
    elif "தமிழ்" in message_text or "tamil" in message_text.lower():
        language = "ta"
    
    # Process the message to determine which demo category it matches
    category = determine_category(message_text)
    
    # Get the verdict for the category and language
    try:
        verdict = get_verdict(category, language)
        
        # Format the response
        response_text = format_whatsapp_response(verdict, language, message_text)
        resp.message(response_text)
    except Exception as e:
        # Fallback to a generic response
        resp.message("Sorry, I couldn't process that message. Please try again with a different claim.")
    
    return str(resp)

def determine_category(text):
    """
    Determine which category the message belongs to based on keywords
    """
    text_lower = text.lower()
    
    if "herbal tea" in text_lower and "covid" in text_lower:
        return "false"
    elif "vitamin c" in text_lower and "covid" in text_lower:
        return "partly_true"
    elif "mask" in text_lower and "viral spread" in text_lower:
        return "true"
    elif "vaccine" in text_lower and "microchip" in text_lower:
        return "meme_image"
    
    # Default to false if no match is found
    return "false"

def get_verdict(category, language):
    """
    Get the verdict for the category and language
    """
    if category not in demo_data:
        category = "false"
    
    if language not in ["en", "hi", "ta"]:
        language = "en"
    
    try:
        return demo_data[category][language]
    except KeyError:
        # Fallback to English
        return demo_data[category]["en"]

def format_whatsapp_response(verdict, language, original_text: str):
    """
    Format the verdict for WhatsApp
    """
    # Emoji based on verdict
    emoji = "⚠️" if verdict["verdict"] in ["Likely False", "संभवतः गलत", "பொய்யாக இருக்கலாம்"] else "ℹ️"
    
    # Format the response
    response = f"{emoji} {verdict['verdict']} — {int(verdict['confidence'] * 100)}%\n\n"
    response += f"Claim: \"{original_text}\"\n\n"
    response += f"Why: {verdict['explanation']}\n\n"
    
    # Add sources
    response += "Sources:\n"
    for source in verdict["sources"]:
        response += f"- {source['title']}: {source['url']}\n"
    
    # Add actions
    response += "\nActions: [Copy reply] [Save] [Feedback 👍/👎]"
    
    return response

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)