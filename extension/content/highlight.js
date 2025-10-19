// @ts-check

/**
 * Simple heuristic highlighter for demo purposes.
 * Wraps suspicious terms defined in `SUSPICIOUS_KEYWORDS` with a custom span.
 */
const SUSPICIOUS_KEYWORDS = ["5G", "miracle cure", "secret lab", "microchip"];

const HIGHLIGHT_CLASS = "infoguard-highlight";
const BLOCKED_PARENT_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "NOSCRIPT",
  "TEXTAREA",
]);
const KEYWORD_REGEX = new RegExp(
  `(${SUSPICIOUS_KEYWORDS.map(escapeRegExp).join("|")})`,
  "gi"
);

/**
 * Inject highlight styles once per page.
 */
function injectStyles() {
  if (document.getElementById("infoguard-highlight-style")) return;

  const style = document.createElement("style");
  style.id = "infoguard-highlight-style";
  style.textContent = `
    .${HIGHLIGHT_CLASS} {
      background: rgba(56, 189, 248, 0.25);
      border-bottom: 2px dashed rgba(14, 165, 233, 0.8);
      padding: 0 2px;
      cursor: pointer;
      transition: background 200ms ease;
    }
    .${HIGHLIGHT_CLASS}:hover {
      background: rgba(56, 189, 248, 0.45);
    }
  `;

  document.head.appendChild(style);
}

/**
 * Scan text nodes and highlight suspicious keywords.
 */
function highlightKeywords(root = document.body) {
  if (!root) return;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue) return NodeFilter.FILTER_REJECT;
      const text = node.nodeValue.toLowerCase();
      return SUSPICIOUS_KEYWORDS.some((keyword) =>
        text.includes(keyword.toLowerCase())
      )
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT;
    },
  });

  const toWrap = [];
  while (walker.nextNode()) {
    toWrap.push(walker.currentNode);
  }

  toWrap.forEach((textNode) => {
    const parent = textNode.parentElement;
    if (!parent) return;
    if (parent.closest(`.${HIGHLIGHT_CLASS}`)) return;

    const parentTag = parent.tagName;
    if (parentTag && BLOCKED_PARENT_TAGS.has(parentTag)) return;

    const textContent = textNode.nodeValue ?? "";
    const fragment = buildHighlightedFragment(textContent);
    if (!fragment) return;

    parent.replaceChild(fragment, textNode);
  });
}

/**
 * Build a fragment containing highlighted spans for suspicious keywords.
 * @param {string} originalText
 */
function buildHighlightedFragment(originalText) {
  const pieces = originalText.split(KEYWORD_REGEX);
  if (pieces.length === 1) return null;

  const fragment = document.createDocumentFragment();

  pieces.forEach((piece, index) => {
    if (!piece) return;

    if (index % 2 === 1) {
      const span = document.createElement("span");
      span.className = HIGHLIGHT_CLASS;
      span.textContent = piece;
      span.dataset.keyword = piece;
      span.addEventListener("click", () => {
        const payload = {
          type: "HIGHLIGHT_CLICKED",
          keyword: piece,
          snippet: createSnippet(originalText, piece),
        };

        try {
          if (
            typeof chrome !== "undefined" &&
            chrome.runtime?.sendMessage &&
            chrome.runtime?.id
          ) {
            chrome.runtime.sendMessage(payload, () => {
              const err = chrome.runtime.lastError;
              if (
                err &&
                /Receiving end does not exist|Extension context invalidated/i.test(
                  err.message || ""
                )
              ) {
                return;
              }
            });
          }
        } catch (error) {
          console.warn("InfoGuard highlight messaging failed", error);
        }
      });
      fragment.appendChild(span);
    } else {
      fragment.appendChild(document.createTextNode(piece));
    }
  });

  return fragment;
}

/**
 * Create a succinct snippet around the keyword for downstream consumers.
 * @param {string} contextText
 * @param {string} keyword
 */
function createSnippet(contextText, keyword) {
  const normalized = contextText.trim().replace(/\s+/g, " ");
  if (!normalized) return keyword;

  if (normalized.length <= 180) return normalized;

  const keywordIndex = normalized.toLowerCase().indexOf(keyword.toLowerCase());
  if (keywordIndex === -1) {
    return `${normalized.slice(0, 177)}…`;
  }

  const start = Math.max(0, keywordIndex - 60);
  const end = Math.min(normalized.length, keywordIndex + keyword.length + 60);
  const snippet = normalized.slice(start, end).trim();

  return `${start > 0 ? "…" : ""}${snippet}${
    end < normalized.length ? "…" : ""
  }`;
}

/**
 * Escape regular expression metacharacters in a string.
 * @param {string} value
 */
function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

injectStyles();
highlightKeywords();
