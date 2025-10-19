// @ts-check

/**
 * Mock dataset representing verdicts from the backend pipeline.
 * @type {Record<string, import("./types.js").ClaimVerdict>}
 */
export const mockVerdictsByKeyword = {
  "5g": {
    label: "false",
    summary: "Claim debunked by multiple fact-checkers in the past week.",
    confidence: 0.88,
    explanation:
      "The claim about the vaccine causing 5G signal boost has been repeatedly debunked by WHO and independent telecom experts. There is no scientific mechanism linking 5G frequencies with vaccine components.",
    sources: [
      {
        title: "WHO Myth Busters",
        url: "https://www.who.int/emergencies/diseases/novel-coronavirus-2019/advice-for-public/myth-busters",
      },
      {
        title: "Reuters Fact Check",
        url: "https://www.reuters.com/article/factcheck-5g-vaccine-idUSL1N2M70DU",
      },
      {
        title: "AltNews Analysis",
        url: "https://www.altnews.in/fact-check-coronavirus-and-5g-conspiracy",
      },
    ],
    replyTemplate:
      "Hey! Sharing this because I checked with WHO and Reuters—there's no link between vaccines and 5G signals. It's a recurring hoax. Stay safe!",
  },
  "miracle cure": {
    label: "misleading",
    summary:
      "Bold cure-all claims usually omit clinical evidence and known side effects.",
    confidence: 0.73,
    explanation:
      "There are no peer-reviewed trials confirming this so-called miracle cure. Experts from the CDC warn that it can interfere with common prescriptions and cause adverse reactions.",
    sources: [
      {
        title: "CDC Guidance on Alternative Treatments",
        url: "https://www.cdc.gov/",
      },
      {
        title: "Johns Hopkins Analysis",
        url: "https://www.hopkinsmedicine.org/health",
      },
    ],
    replyTemplate:
      "Quick heads-up: doctors haven't validated this miracle cure, and it could conflict with meds. I'd double-check with a physician before trying it!",
  },
  "secret lab": {
    label: "needs_review",
    summary:
      "Authorities are still investigating the claim; no verified evidence yet.",
    confidence: 0.41,
    explanation:
      "Independent fact-checkers note the claim traces back to anonymous forums and hasn't been confirmed by any official agency. Investigations are ongoing, and no formal reports cite a secret lab leak.",
    sources: [
      {
        title: "WHO Situation Report",
        url: "https://www.who.int/",
      },
      {
        title: "BBC Newsroom Updates",
        url: "https://www.bbc.com/news",
      },
    ],
    replyTemplate:
      "Looks like this secret lab story is still unverified. Officials haven't released evidence, so I'm waiting for confirmed reports before sharing it further.",
  },
  microchip: {
    label: "false",
    summary:
      "No credible proof exists that microchips are implanted via vaccines.",
    confidence: 0.9,
    explanation:
      "Medical-grade syringes can't deliver microchips of any meaningful capability. Fact-checkers from AP and WHO call this a recycled hoax with zero technical feasibility.",
    sources: [
      {
        title: "Associated Press Fact Check",
        url: "https://apnews.com/hub/fact-checking",
      },
      {
        title: "WHO Fact vs Fiction",
        url: "https://www.who.int/",
      },
    ],
    replyTemplate:
      "Sharing that experts have debunked the microchip vaccine story—it's not technically possible with standard syringes. Good to double-check before passing it on!",
  },
};

/**
 * Default verdict used when no keyword match is found.
 * @type {import("./types.js").ClaimVerdict}
 */
export const mockVerdict = mockVerdictsByKeyword["5g"];

/**
 * Retrieve a verdict based on keyword text.
 * @param {string | undefined | null} keyword
 */
export function getMockVerdict(keyword) {
  if (!keyword) return mockVerdict;
  const normalized = keyword.trim().toLowerCase();
  return mockVerdictsByKeyword[normalized] ?? mockVerdict;
}
