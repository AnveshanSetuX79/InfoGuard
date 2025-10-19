// @ts-check

import { getMockVerdict } from "../shared/mockData.js";

// Default to localhost for development; can be overridden via chrome.storage
const DEFAULT_API_BASE_URL = "http://localhost:8000";

/** @typedef {{ keyword: string; verdict: import("../shared/types.js").ClaimVerdict & { snippet?: string } }} LatestVerdictContext */
/** @typedef {{ apiBaseUrl?: string }} InfoGuardSettings */

/** @type {LatestVerdictContext | null} */
let latestVerdictContext = null;
/** @type {string} */
let cachedApiBaseUrl = DEFAULT_API_BASE_URL;
let settingsPrimed = false;

loadSettings()
  .then(({ apiBaseUrl }) => {
    cachedApiBaseUrl = apiBaseUrl ?? DEFAULT_API_BASE_URL;
    settingsPrimed = true;
  })
  .catch((error) => console.warn("InfoGuard: settings preload failed", error));

/**
 * Retrieve extension settings from storage.
 * @returns {Promise<InfoGuardSettings>}
 */
async function loadSettings() {
  if (!chrome.storage?.sync) {
    return { apiBaseUrl: DEFAULT_API_BASE_URL };
  }

  return new Promise((resolve) => {
    chrome.storage.sync.get({ apiBaseUrl: DEFAULT_API_BASE_URL }, (items) => {
      if (chrome.runtime.lastError) {
        console.warn(
          "InfoGuard: Failed to load settings",
          chrome.runtime.lastError
        );
        resolve({ apiBaseUrl: DEFAULT_API_BASE_URL });
        return;
      }

      resolve({ apiBaseUrl: items.apiBaseUrl ?? DEFAULT_API_BASE_URL });
    });
  });
}

/**
 * Get the latest API base URL, refreshing the cache if needed.
 * @returns {Promise<string>}
 */
async function getApiBaseUrl() {
  if (cachedApiBaseUrl) {
    return cachedApiBaseUrl;
  }

  const settings = await loadSettings();
  cachedApiBaseUrl = settings.apiBaseUrl ?? DEFAULT_API_BASE_URL;
  return cachedApiBaseUrl;
}

/**
 * Fetch a verdict from backend, map to extension ClaimVerdict, with mock fallback.
 * @param {string} text
 * @param {string} snippet
 * @param {string} [language]
 */
async function fetchVerdict(text, snippet, language = "en") {
  try {
    const base = await getApiBaseUrl();
    const url = `${base.replace(/\/$/, "")}/api/v1/check-claim`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, language }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    /** @type {{ verdict: string; confidence: number; explanation: string; sources: {title:string; url:string; excerpt?:string}[]; suggested_reply: string; id: string }} */
    const data = await res.json();

    const mapped = mapBackendToClaimVerdict(data, snippet);
    return mapped;
  } catch (error) {
    console.warn("InfoGuard: backend fetch failed, using mock", error);
    const mock = getMockVerdict(text);
    return { ...mock, snippet };
  }
}

/**
 * Map backend ClaimResponse into extension ClaimVerdict shape.
 * @param {{ verdict: string; confidence: number; explanation: string; sources: {title:string; url:string; excerpt?:string}[]; suggested_reply: string; id: string }} resp
 * @param {string} snippet
 * @returns {import("../shared/types.js").ClaimVerdict & { snippet?: string }}
 */
function mapBackendToClaimVerdict(resp, snippet) {
  const label = classifyLabel(resp.verdict);
  return {
    label,
    summary: resp.verdict,
    confidence: resp.confidence,
    explanation: resp.explanation,
    sources: (resp.sources || []).map((s) => ({ title: s.title, url: s.url })),
    replyTemplate: resp.suggested_reply || "",
    snippet,
  };
}

/**
 * Heuristic mapping from verdict text to label expected by popup.
 * @param {string} verdictText
 * @returns {import("../shared/types.js").VerdictLabel}
 */
function classifyLabel(verdictText = "") {
  const t = verdictText.toLowerCase();
  if (t.includes("false") || t.includes("fake") || t.includes("incorrect")) return "false";
  if (t.includes("true") || t.includes("verified") || t.includes("credible")) return "verified";
  if (t.includes("context") || t.includes("misleading") || t.includes("partly")) return "misleading";
  return "needs_review";
}

/**
 * Background service worker: bridge between content scripts and backend API.
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "PING") {
    sendResponse({ ok: true, timestamp: Date.now() });
    return true;
  }

  if (message.type === "REQUEST_VERDICT") {
    // Expected payload: { text: string, language?: string, snippet?: string }
    const text = message.text || message.snippet || "";
    const snippet = message.snippet || message.text || "";
    const language = message.language || "en";

    fetchVerdict(text, snippet, language).then((verdict) => {
      latestVerdictContext = { keyword: text, verdict };
      sendResponse({ ok: true, verdict });
    }).catch((error) => {
      console.warn("REQUEST_VERDICT failed", error);
      const fallback = getMockVerdict(text);
      latestVerdictContext = { keyword: text, verdict: { ...fallback, snippet } };
      sendResponse({ ok: false, verdict: { ...fallback, snippet } });
    });
    return true;
  }

  if (message.type === "HIGHLIGHT_CLICKED") {
    const text = message.keyword || message.snippet || "";
    const snippet = message.snippet || message.keyword || "";

    fetchVerdict(text, snippet, "en").then((verdict) => {
      latestVerdictContext = { keyword: text, verdict };

      chrome.action.openPopup().catch((error) =>
        console.warn("Unable to open InfoGuard popup", error)
      );

      sendResponse({ ok: true });
    }).catch(() => {
      // Fallback to mock already handled in fetchVerdict
      sendResponse({ ok: true });
    });
    return true;
  }

  if (message.type === "POPUP_READY") {
    if (latestVerdictContext) {
      sendResponse({ ok: true, payload: latestVerdictContext });
    } else {
      sendResponse({ ok: false });
    }
    return true;
  }

  return undefined;
});
