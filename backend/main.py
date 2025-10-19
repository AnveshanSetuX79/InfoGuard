from fastapi import FastAPI, HTTPException
from fastapi import UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import os
from typing import List, Optional
import re
from io import BytesIO
try:
    import numpy as np
    import cv2
    import pytesseract
    OCR_AVAILABLE = True
except Exception:
    OCR_AVAILABLE = False

app = FastAPI(title="InfoGuard API", description="API for InfoGuard misinformation detection")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For demo purposes only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load preloaded demo data
DATA_PATH = os.path.join(os.path.dirname(__file__), "sample_data", "preloaded_demo.json")
CLAIMS_INDEX_PATH = os.path.join(os.path.dirname(__file__), "sample_data", "claims_index.json")

try:
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        demo_data = json.load(f)
except FileNotFoundError:
    demo_data = {}
    print(f"Warning: Demo data file not found at {DATA_PATH}")

# Load claims index cache
try:
    with open(CLAIMS_INDEX_PATH, "r", encoding="utf-8") as f:
        claims_index = json.load(f)
except FileNotFoundError:
    claims_index = []
    print(f"Warning: Claims index file not found at {CLAIMS_INDEX_PATH}")

# Define models
class ClaimRequest(BaseModel):
    text: str
    language: str = "en"
    demo_id: Optional[str] = None

class Source(BaseModel):
    title: str
    url: str
    excerpt: Optional[str] = None

class ClaimResponse(BaseModel):
    verdict: str
    confidence: float
    explanation: str
    sources: List[Source]
    suggested_reply: str
    id: str

class FeedbackRequest(BaseModel):
    id: str
    verdict: str
    upvote: bool
    source: Optional[str] = "unknown"

# In-memory feedback store for demo purposes
feedback_events: List[dict] = []

@app.get("/")
def read_root():
    return {"status": "ok", "message": "InfoGuard API is running"}

def normalize_claim(text: str) -> str:
    """
    Lightweight normalization for demo:
    - Lowercase
    - Collapse whitespace
    - Strip surrounding quotes
    - Remove common punctuation noise
    """
    if not text:
        return ""
    t = text.strip().lower()
    # Remove surrounding quotes
    t = t.strip('"\'\u201C\u201D\u2018\u2019')
    # Replace non-word separators with spaces
    t = re.sub(r"[\t\n\r]+", " ", t)
    t = re.sub(r"\s+", " ", t)
    return t

@app.post("/api/v1/check-claim", response_model=ClaimResponse)
def check_claim(request: ClaimRequest):
    """
    Check a claim for misinformation and return a verdict
    """
    # For demo purposes, we'll return a deterministic response based on the text
    # In a real implementation, this would call a model or service
    
    # Try to find a matching demo item
    category = None
    
    # Check for keywords in the normalized text to determine category
    text_lower = normalize_claim(request.text)
    if "herbal tea" in text_lower and "covid" in text_lower:
        category = "false"
    elif "vitamin c" in text_lower and "covid" in text_lower:
        category = "partly_true"
    elif "mask" in text_lower and "viral spread" in text_lower:
        category = "true"
    elif "vaccine" in text_lower and "microchip" in text_lower:
        category = "meme_image"
    
    # If demo_id is provided, use that instead
    if request.demo_id:
        category = request.demo_id
    
    # If no category is found, default to false
    if not category or category not in demo_data:
        category = "false"
    
    # Get the demo data for the category and language
    language = request.language if request.language in ["en", "hi", "ta"] else "en"
    
    try:
        result = demo_data[category][language]
        # Recompute confidence using retrieval-based scoring for demo
        # This uses the returned sources as evidence inputs
        recomputed_conf = compute_confidence(result.get("sources", []))
        # Blend with existing confidence for stability
        blended = min(0.98, max(0.0, 0.6 * result.get("confidence", 0.0) + 0.4 * recomputed_conf))
        result["confidence"] = blended
        return result
    except KeyError:
        # Fallback to English if the requested language is not available
        try:
            return demo_data[category]["en"]
        except KeyError:
            raise HTTPException(status_code=404, detail="Demo data not found")

@app.post("/api/v1/feedback")
def post_feedback(payload: FeedbackRequest):
    event = {
        "id": payload.id,
        "verdict": payload.verdict,
        "upvote": payload.upvote,
        "source": payload.source,
    }
    feedback_events.append(event)
    return {"ok": True}

# -----------------------------
# Evidence retrieval and scoring
# -----------------------------

RELIABILITY_WEIGHTS = {
    "who.int": 0.95,
    "cdc.gov": 0.95,
    "science.org": 0.92,
    "pubmed.ncbi.nlm.nih.gov": 0.92,
    "reuters.com": 0.9,
    "bbc.com": 0.88,
    "apnews.com": 0.88,
}

def hostname_from_url(url: str) -> str:
    try:
        from urllib.parse import urlparse
        host = urlparse(url).hostname or ""
        return host.lower()
    except Exception:
        return ""

def compute_confidence(sources: List[dict]) -> float:
    if not sources:
        return 0.5
    total = 0.0
    count = 0
    for s in sources:
        host = hostname_from_url(s.get("url", ""))
        weight = 0.7  # default baseline
        for key, val in RELIABILITY_WEIGHTS.items():
            if key and key in host:
                weight = max(weight, val)
        # Simple cap for excerpt presence as a quality hint
        if s.get("excerpt"):
            weight = min(1.0, weight + 0.03)
        total += weight
        count += 1
    avg = total / max(1, count)
    # Slight boost with more agreeing sources
    coverage_boost = min(0.08, 0.02 * max(0, count - 1))
    return max(0.0, min(1.0, avg + coverage_boost))

def match_claim_in_cache(text: str):
    """
    Find the best matching cached claim by keyword overlap.
    """
    if not claims_index:
        return None
    q = normalize_claim(text)
    best = None
    best_score = 0
    for item in claims_index:
        kws = [normalize_claim(k) for k in item.get("keywords", [])]
        score = sum(1 for k in kws if k and k in q)
        if score > best_score:
            best = item
            best_score = score
    return best

def live_fetch_who_reuters(query: str) -> List[dict]:
    """
    Construct live search URLs for WHO and Reuters for the given query.
    We avoid scraping; just provide deep links users can open.
    """
    from urllib.parse import quote_plus
    q = quote_plus(query.strip())
    sources = [
        {
            "title": "WHO Search",
            "url": f"https://www.who.int/search?indexCatalogue=genericsearchindex1&searchQuery={q}",
        },
        {
            "title": "Reuters Fact Check Search",
            "url": f"https://www.reuters.com/site-search/?query={q}&section=fact-check",
        },
    ]
    return sources

@app.post("/api/v1/retrieve")
def retrieve_evidence(request: ClaimRequest):
    """
    Demo retrieval endpoint: returns sources from the closest demo category
    and a computed confidence based on source reliability and count.
    """
    # Prefer a cache hit from claims index
    cached = match_claim_in_cache(request.text)
    cached_sources = cached.get("sources", []) if cached else []
    # Also derive category heuristically for demo consistency
    text_lower = normalize_claim(request.text)
    if "herbal tea" in text_lower and "covid" in text_lower:
        category = "false"
    elif "vitamin c" in text_lower and "covid" in text_lower:
        category = "partly_true"
    elif "mask" in text_lower and "viral spread" in text_lower:
        category = "true"
    elif "vaccine" in text_lower and "microchip" in text_lower:
        category = "meme_image"
    else:
        category = "false"

    # Add live search links
    live_sources = live_fetch_who_reuters(request.text)

    # Merge and compute confidence
    all_sources = list(cached_sources) + list(live_sources)
    conf = compute_confidence(all_sources)
    return {"sources": all_sources, "confidence": conf, "category": category, "cache_id": (cached.get("id") if cached else None)}

@app.get("/api/v1/demo/{category}")
def get_demo(category: str, language: str = "en"):
    """
    Get a pre-cached demo item for the specified category
    """
    if category not in demo_data:
        raise HTTPException(status_code=404, detail=f"Category {category} not found")
    
    if language not in ["en", "hi", "ta"]:
        language = "en"
    
    try:
        return demo_data[category][language]
    except KeyError:
        # Fallback to English if the requested language is not available
        try:
            return demo_data[category]["en"]
        except KeyError:
            raise HTTPException(status_code=404, detail="Demo data not found")

@app.post("/api/v1/ocr")
async def ocr_endpoint(file: UploadFile = File(...)):
    """
    Extract text from an uploaded image using Tesseract OCR.
    Accepts: multipart/form-data with field name 'file'.
    """
    if not OCR_AVAILABLE:
        # Graceful fallback if OCR libs are not available in the environment
        return {
            "text": "",
            "language": "en",
            "note": "OCR libraries unavailable in this environment."
        }

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Please upload an image file")

    content = await file.read()
    arr = np.frombuffer(content, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise HTTPException(status_code=400, detail="Unable to decode image")

    # Basic preprocessing for better OCR
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    gray = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)[1]

    try:
        text = pytesseract.image_to_string(gray)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR failed: {e}")

    text = text.strip()
    return {
        "text": text,
        "language": "en"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)