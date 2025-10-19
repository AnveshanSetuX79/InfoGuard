// @ts-check
import { mockVerdict, getMockVerdict } from "../shared/mockData.js";

/**
 * Available languages for the UI
 * @type {Record<string, string>}
 */
const LANGUAGES = {
  en: "English",
  hi: "Hindi",
  ta: "Tamil",
};

/**
 * Current language selection
 * @type {string}
 */
let currentLanguage = "en";

let latestSnippet = "";

/**
 * Map verdict labels to friendly display strings, theme classes, and accent colors.
 * @type {Record<
 *   import("../shared/types.js").VerdictLabel,
 *   {
 *     text: string;
 *     sectionClass: string;
 *     badgeClass: string;
 *     badgeText: string;
 *     highlightColor: string;
 *     translations: Record<string, {text: string, badgeText: string}>
 *   }
 * >}
 */
const VERDICT_COPY = {
  verified: {
    text: "Verified",
    sectionClass: "verdict--success",
    badgeClass: "badge--success",
    badgeText: "Credible Claim",
    highlightColor: "#10b981",
    translations: {
      hi: {
        text: "सत्यापित",
        badgeText: "विश्वसनीय दावा",
      },
      ta: {
        text: "சரிபார்க்கப்பட்டது",
        badgeText: "நம்பகமான கூற்று",
      },
    },
  },
  misleading: {
    text: "Needs Context",
    sectionClass: "verdict--warning",
    badgeClass: "badge--warning",
    badgeText: "Needs Context",
    highlightColor: "#f59e0b",
    translations: {
      hi: {
        text: "संदर्भ की आवश्यकता है",
        badgeText: "संदर्भ की आवश्यकता है",
      },
      ta: {
        text: "சூழல் தேவை",
        badgeText: "சூழல் தேவை",
      },
    },
  },
  false: {
    text: "False",
    sectionClass: "verdict--danger",
    badgeClass: "badge--danger",
    badgeText: "False Claim",
    highlightColor: "#ef4444",
    translations: {
      hi: {
        text: "गलत",
        badgeText: "गलत दावा",
      },
      ta: {
        text: "தவறானது",
        badgeText: "தவறான கூற்று",
      },
    },
  },
  needs_review: {
    text: "Needs Review",
    sectionClass: "verdict--neutral",
    badgeClass: "badge--neutral",
    badgeText: "Pending Review",
    highlightColor: "#475569",
    translations: {
      hi: {
        text: "समीक्षा की आवश्यकता है",
        badgeText: "समीक्षा लंबित",
      },
      ta: {
        text: "மதிப்பாய்வு தேவை",
        badgeText: "மதிப்பாய்வு நிலுவையில் உள்ளது",
      },
    },
  },
};

/**
 * UI strings for different languages
 * @type {Record<string, Record<string, string>>}
 */
const UI_STRINGS = {
  en: {
    verdict: "Verdict",
    confidence: "Confidence",
    snippet: "Snippet",
    explanation: "Explanation",
    sources: "Sources",
    copyReply: "Copy Reply",
    save: "Save",
    language: "Language",
    privacy: "Privacy",
    cloud: "Cloud",
    onDevice: "On-device",
    selectHighlight: "Select a highlight to view context.",
    noSources: "No sources available.",
  },
  hi: {
    verdict: "निर्णय",
    confidence: "विश्वास",
    snippet: "अंश",
    explanation: "व्याख्या",
    sources: "स्रोत",
    copyReply: "जवाब कॉपी करें",
    save: "सहेजें",
    language: "भाषा",
    privacy: "गोपनीयता",
    cloud: "क्लाउड",
    onDevice: "डिवाइस पर",
    selectHighlight: "संदर्भ देखने के लिए हाइलाइट का चयन करें।",
    noSources: "कोई स्रोत उपलब्ध नहीं है।",
  },
  ta: {
    verdict: "தீர்ப்பு",
    confidence: "நம்பிக்கை",
    snippet: "துண்டு",
    explanation: "விளக்கம்",
    sources: "மூலங்கள்",
    copyReply: "பதிலை நகலெடு",
    save: "சேமி",
    language: "மொழி",
    privacy: "தனியுரிமை",
    cloud: "கிளவுட்",
    onDevice: "சாதனத்தில்",
    selectHighlight:
      "சூழலைப் பார்க்க ஒரு முக்கியத்துவத்தைத் தேர்ந்தெடுக்கவும்.",
    noSources: "மூலங்கள் எதுவும் கிடைக்கவில்லை.",
  },
};

/**
 * Initialize popup with mock data while backend integration is pending.
 */
function bootstrapPopup(verdict = mockVerdict) {
  // Show shimmer animation first
  const shimmerOverlay = document.getElementById("shimmerOverlay");
  if (shimmerOverlay) {
    shimmerOverlay.classList.remove("hidden");

    // Hide shimmer after 750ms to simulate loading
    setTimeout(() => {
      shimmerOverlay.classList.add("hidden");
      renderVerdict(verdict);
    }, 750);
  } else {
    renderVerdict(verdict);
  }
}

/**
 * Render the verdict data in the popup
 * @param {import("../shared/types.js").ClaimVerdict} verdict
 */
function renderVerdict(verdict) {
  const verdictSection = document.getElementById("verdictSection");
  const verdictBadge = document.querySelector(".popup__badge");
  const verdictLabel = verdictSection?.querySelector(".verdict__label");
  const verdictValue = document.getElementById("verdictValue");
  const confidenceFill = document.getElementById("confidenceFill");
  const confidencePercent = document.getElementById("confidencePercent");
  const explanation = document.getElementById("explanationText");
  const sourceList = document.getElementById("sourceList");
  const snippetText = document.getElementById("snippetText");

  if (
    !verdictSection ||
    !verdictValue ||
    !confidenceFill ||
    !confidencePercent ||
    !explanation ||
    !sourceList
  ) {
    console.warn("Popup DOM not ready; aborting bootstrap.");
    return;
  }

  const verdictMeta = VERDICT_COPY[verdict.label] ?? VERDICT_COPY.needs_review;
  const baseSectionClass = "popup__section popup__verdict";
  verdictSection.className = baseSectionClass;
  verdictSection.classList.add(verdictMeta.sectionClass);
  verdictSection.setAttribute("data-verdict", verdict.label);
  verdictSection.style.setProperty(
    "--verdict-highlight",
    verdictMeta.highlightColor
  );

  // Get translated text based on current language
  const verdictText =
    currentLanguage !== "en" && verdictMeta.translations[currentLanguage]
      ? verdictMeta.translations[currentLanguage].text
      : verdictMeta.text;

  const badgeText =
    currentLanguage !== "en" && verdictMeta.translations[currentLanguage]
      ? verdictMeta.translations[currentLanguage].badgeText
      : verdictMeta.badgeText;

  if (verdictBadge) {
    verdictBadge.className = `popup__badge ${verdictMeta.badgeClass}`;
    verdictBadge.textContent = badgeText;
  }

  if (verdictLabel) {
    verdictLabel.textContent = verdictText;
  }

  verdictValue.textContent = verdict.summary;

  const confidence = Math.round(verdict.confidence * 100);
  confidencePercent.textContent = `${confidence}%`;
  confidencePercent.style.color = verdictMeta.highlightColor;

  // Animate the confidence fill
  confidenceFill.style.width = "0%";
  confidenceFill.style.background = createConfidenceGradient(
    verdictMeta.highlightColor
  );
  confidenceFill.style.boxShadow = `0 0 0 1px ${hexToRgba(
    verdictMeta.highlightColor,
    0.25
  )}, 0 10px 18px -8px ${hexToRgba(verdictMeta.highlightColor, 0.5)}`;

  // Animate the confidence fill with a slight delay
  setTimeout(() => {
    confidenceFill.style.transition = "width 0.8s ease-out";
    confidenceFill.style.width = `${confidence}%`;
  }, 100);

  explanation.textContent = verdict.explanation;

  if (snippetText) {
    snippetText.textContent = latestSnippet || UI_STRINGS[currentLanguage].selectHighlight;
  }

  sourceList.innerHTML = "";
  sourceList.classList.toggle(
    "source-list--empty",
    verdict.sources.length === 0
  );

  // Add source cards
  if (verdict.sources && verdict.sources.length > 0) {
    verdict.sources.forEach((source) => {
      const sourceItem = document.createElement("li");
      sourceItem.className = "source-item";

      const sourceCard = document.createElement("div");
      sourceCard.className = "source-card";

      const sourceTitle = document.createElement("h3");
      sourceTitle.className = "source-title";
      sourceTitle.textContent = source.title;

      const sourceExcerpt = document.createElement("p");
      sourceExcerpt.className = "source-excerpt";
      sourceExcerpt.textContent = source.url;

      const sourceLink = document.createElement("a");
      sourceLink.className = "source-link";
      sourceLink.href = source.url;
      sourceLink.target = "_blank";
      sourceLink.textContent = "Open";

      sourceCard.appendChild(sourceTitle);
      sourceCard.appendChild(sourceExcerpt);
      sourceCard.appendChild(sourceLink);
      sourceItem.appendChild(sourceCard);
      sourceList.appendChild(sourceItem);
    });
  } else {
    const noSourcesItem = document.createElement("li");
    noSourcesItem.textContent = UI_STRINGS[currentLanguage].noSources;
    sourceList.appendChild(noSourcesItem);
  }

  setupButtons(verdict);
}

/**
 * Create an accent gradient for the confidence bar using the verdict color.
 * @param {string} baseHex
 */
function createConfidenceGradient(baseHex) {
  const soft = hexToRgba(baseHex, 0.4);
  const vivid = hexToRgba(baseHex, 1);
  return `linear-gradient(90deg, ${soft}, ${vivid})`;
}

/**
 * Convert a HEX color to RGBA with the provided opacity.
 * @param {string} hex
 * @param {number} alpha
 */
function hexToRgba(hex, alpha = 1) {
  let sanitized = hex.replace("#", "");

  if (sanitized.length === 3) {
    sanitized = sanitized
      .split("")
      .map((char) => `${char}${char}`)
      .join("");
  }

  const bigint = parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Wires interaction buttons for copy/save/feedback prototypes.
 */
function setupButtons(verdict) {
  const copyButton = document.getElementById("copyReplyBtn");
  const saveButton = document.getElementById("saveBtn");
  const feedbackPositive = document.getElementById("feedbackPositive");
  const feedbackNegative = document.getElementById("feedbackNegative");

  copyButton?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(verdict.replyTemplate);
      copyButton.textContent = "Copied!";
      setTimeout(() => (copyButton.textContent = "Copy Reply"), 2000);
    } catch (error) {
      console.error("Failed to copy reply", error);
    }
  });

  saveButton?.addEventListener("click", () => {
    saveButton.textContent = "Saved";
    setTimeout(() => (saveButton.textContent = "Save"), 2000);
  });

  const sendFeedback = async (isPositive) => {
    try {
      await fetch("http://localhost:8000/api/v1/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: verdict.id || "", verdict: verdict.summary || "", upvote: !!isPositive, source: "extension" }),
      });
    } catch (e) {}
  };

  feedbackPositive?.addEventListener("click", async () => {
    await sendFeedback(true);
    feedbackPositive.classList.add("feedback-active");
    setTimeout(() => feedbackPositive.classList.remove("feedback-active"), 600);
  });

  feedbackNegative?.addEventListener("click", async () => {
    await sendFeedback(false);
    feedbackNegative.classList.add("feedback-active");
    setTimeout(() => feedbackNegative.classList.remove("feedback-active"), 600);
  });
}

/**
 * Update UI language based on selected language
 * @param {string} lang - Language code (en, hi, ta)
 */
function updateLanguage(lang) {
  if (!LANGUAGES[lang]) return;

  currentLanguage = lang;

  // Update language toggle buttons
  const langButtons = document.querySelectorAll(".toggle-btn");
  langButtons.forEach((btn) => {
    if (btn instanceof HTMLElement) {
      btn.classList.toggle("toggle-btn--active", btn.dataset.lang === lang);
    }
  });

  // Update UI text elements - using safe DOM queries with null checks
  // The 'Verdict' label lives in .verdict__label, not .section__title
  const verdictLabelEl = document.querySelector(".verdict__label");
  if (verdictLabelEl) verdictLabelEl.textContent = UI_STRINGS[lang].verdict;
  
  const confidenceHeader = document.querySelector(".confidence__header span:first-child");
  if (confidenceHeader) confidenceHeader.textContent = UI_STRINGS[lang].confidence;
  
  const sectionTitles = document.querySelectorAll(".section__title");
  // Indexes: 0 = Snippet, 1 = Explanation, 2 = Sources
  if (sectionTitles[0]) sectionTitles[0].textContent = UI_STRINGS[lang].snippet;
  if (sectionTitles[1]) sectionTitles[1].textContent = UI_STRINGS[lang].explanation;
  if (sectionTitles[2]) sectionTitles[2].textContent = UI_STRINGS[lang].sources;
  
  // Update button text
  const copyBtn = document.getElementById("copyReplyBtn");
  if (copyBtn) copyBtn.textContent = UI_STRINGS[lang].copyReply;
  
  const saveBtn = document.getElementById("saveBtn");
  if (saveBtn) saveBtn.textContent = UI_STRINGS[lang].save;
  
  // Update toggle labels
  const langToggleLabel = document.querySelector(".language-toggle .toggle-label");
  if (langToggleLabel) langToggleLabel.textContent = UI_STRINGS[lang].language + ":";
  
  const privacyToggleLabel = document.querySelector(".privacy-toggle .toggle-label");
  if (privacyToggleLabel) privacyToggleLabel.textContent = UI_STRINGS[lang].privacy + ":";

  // Update privacy label based on current state
  const privacyToggle = document.getElementById("privacyToggle");
  const privacyLabel = document.getElementById("privacyLabel");
  if (privacyLabel) {
    privacyLabel.textContent =
      privacyToggle && privacyToggle.checked
        ? UI_STRINGS[lang].onDevice
        : UI_STRINGS[lang].cloud;
  }

  // Re-render the current verdict with the new language
  const verdictSection = document.getElementById("verdictSection");
  if (verdictSection) {
    const verdictLabel = verdictSection.getAttribute("data-verdict");
    if (verdictLabel) {
      const currentVerdict = getMockVerdict();
      fetchTranslatedContent(currentVerdict, lang);
    }
  }
}

/**
 * Fetch translated content from backend based on language
 * @param {import("../shared/types.js").ClaimVerdict} verdict
 * @param {string} lang
 */
function fetchTranslatedContent(verdict, lang) {
  // In a real implementation, this would make an API call to get translations
  // For now, we'll simulate this with a timeout and mock data

  const shimmerOverlay = document.getElementById("shimmerOverlay");
  if (shimmerOverlay) {
    shimmerOverlay.classList.remove("hidden");
  }

  setTimeout(() => {
    // Simulate getting translated content from backend
    if (lang === "hi") {
      verdict.summary = "हिंदी में अनुवादित सारांश";
      verdict.explanation =
        "यह दावा कई तथ्य-जांचकर्ताओं द्वारा खारिज किया गया है। वैज्ञानिक प्रमाण इसका समर्थन नहीं करते हैं।";
      verdict.replyTemplate =
        "नमस्ते! मैंने यह जानकारी विश्वसनीय स्रोतों से जांची है और यह सही नहीं है।";
    } else if (lang === "ta") {
      verdict.summary = "தமிழில் மொழிபெயர்க்கப்பட்ட சுருக்கம்";
      verdict.explanation =
        "இந்த கூற்று பல உண்மை சரிபார்ப்பாளர்களால் மறுக்கப்பட்டுள்ளது. அறிவியல் ஆதாரங்கள் இதை ஆதரிக்கவில்லை.";
      verdict.replyTemplate =
        "வணக்கம்! நான் இந்த தகவலை நம்பகமான ஆதாரங்களிலிருந்து சரிபார்த்தேன், இது உண்மையல்ல.";
    }

    if (shimmerOverlay) {
      shimmerOverlay.classList.add("hidden");
    }

    renderVerdict(verdict);
  }, 500);
}

function listenForHighlightMessages() {
  const cr = typeof globalThis !== "undefined" ? globalThis.chrome : undefined;
  if (!cr?.runtime?.onMessage) return;

  cr.runtime.onMessage.addListener((message) => {
    if (message.type !== "SHOW_VERDICT") return;

    const verdict = getMockVerdict(message.keyword);
    latestSnippet = message.snippet || "";
    bootstrapPopup(verdict);
  });
}

function requestLatestVerdictFromBackground() {
  const cr = typeof globalThis !== "undefined" ? globalThis.chrome : undefined;
  if (!cr?.runtime?.sendMessage) {
    bootstrapPopup();
    return;
  }

  cr.runtime.sendMessage({ type: "POPUP_READY" }, (response) => {
    if (cr.runtime.lastError) {
      console.warn("POPUP_READY handshake failed", cr.runtime.lastError);
      bootstrapPopup();
      return;
    }

    if (!response?.ok || !response.payload) {
      bootstrapPopup();
      return;
    }

    const { keyword, verdict } = response.payload;
    const hydratedVerdict = {
      ...getMockVerdict(keyword),
      ...verdict,
    };
    latestSnippet = "";
    bootstrapPopup(hydratedVerdict);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  requestLatestVerdictFromBackground();
  listenForHighlightMessages();

  // Set up language toggle buttons
  const langButtons = document.querySelectorAll(".toggle-btn");
  langButtons.forEach((btn) => {
    if (btn instanceof HTMLElement) {
      btn.addEventListener("click", () => {
        updateLanguage(btn.dataset.lang || "en");
      });
    }
  });

  // Set up privacy toggle
  const privacyToggle = document.getElementById("privacyToggle");
  const privacyLabel = document.getElementById("privacyLabel");
  if (privacyToggle && privacyLabel) {
    privacyToggle.addEventListener("change", () => {
      const checked = privacyToggle instanceof HTMLInputElement ? privacyToggle.checked : false;
      privacyLabel.textContent = checked
        ? UI_STRINGS[currentLanguage].onDevice
        : UI_STRINGS[currentLanguage].cloud;
    });
  }
});
