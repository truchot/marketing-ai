// ============================================================
// Website Enrichment Pipeline (non-blocking)
// Fire-and-forget analysis that stores insights as ClientFacts
// ============================================================

import type { AddClientFactUseCase } from "@/domains/memory/use-cases/add-client-fact";
import { logError } from "@/lib/error-handler";
import { callClaudeHaiku, cleanHtml, extractJsonFromResponse, fetchAndCleanHtml } from "./index";

// ============================================================
// Types
// ============================================================

export interface WebsiteInsights {
  company: {
    name: string | null;
    description: string | null;
    size: string | null;
    location: string | null;
  };
  valueProposition: string | null;
  offerings: string[];
  targetAudience: string[];
  socialProof: {
    testimonials: boolean;
    caseStudies: boolean;
    metrics: string[];
    logos: boolean;
  };
  contentPresence: {
    blog: boolean;
    newsletter: boolean;
    podcast: boolean;
    webinars: boolean;
    resources: boolean;
  };
  technicalSignals: {
    cms: string | null;
    analytics: string[];
    chatWidget: string | null;
    leadCapture: boolean;
  };
  socialLinks: Record<string, ScoredSocialLink>;
  pricingModel: string | null;
  messaging: string[];
}

// ============================================================
// Internal helpers
// ============================================================

function fetchPageContent(url: string): Promise<string | null> {
  return fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; DiscoveryBot/1.0)" },
    signal: AbortSignal.timeout(10_000),
  })
    .then((res) => (res.ok ? res.text() : null))
    .catch(() => null);
}

function extractText(html: string): string {
  return cleanHtml(html, 3000);
}

function extractMeta(html: string): { title: string | null; description: string | null; ogImage: string | null } {
  const title = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() ?? null;
  const description =
    html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i)?.[1]?.trim() ??
    html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i)?.[1]?.trim() ??
    null;
  const ogImage =
    html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["']/i)?.[1]?.trim() ??
    null;
  return { title, description, ogImage };
}

interface ScoredSocialLink {
  url: string;
  confidence: "high" | "medium" | "low";
}

function extractSocialLinks(html: string, websiteUrl: string, companyName?: string): Record<string, ScoredSocialLink> {
  // Build reference tokens from company name and domain for matching
  const domain = new URL(websiteUrl).hostname.replace(/^www\./, "").split(".")[0].toLowerCase();
  const tokens = new Set<string>([domain]);
  if (companyName) {
    tokens.add(companyName.toLowerCase().replace(/[^a-z0-9]/g, ""));
  }

  const links: Record<string, ScoredSocialLink> = {};
  const patterns: [string, RegExp][] = [
    ["linkedin", /https?:\/\/(?:www\.)?linkedin\.com\/(?:company|in)\/[^\s"'<>]+/gi],
    ["twitter", /https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/[^\s"'<>]+/gi],
    ["instagram", /https?:\/\/(?:www\.)?instagram\.com\/[^\s"'<>]+/gi],
    ["youtube", /https?:\/\/(?:www\.)?youtube\.com\/(?:@|channel\/|c\/)[^\s"'<>]+/gi],
    ["facebook", /https?:\/\/(?:www\.)?facebook\.com\/[^\s"'<>]+/gi],
    ["tiktok", /https?:\/\/(?:www\.)?tiktok\.com\/@[^\s"'<>]+/gi],
  ];

  for (const [name, regex] of patterns) {
    const allMatches = html.match(regex);
    if (!allMatches) continue;

    // Score each match and pick the best one
    let best: ScoredSocialLink | null = null;
    for (const url of allMatches) {
      const confidence = scoreSocialLink(url, name, tokens);
      if (!best || confidenceRank(confidence) > confidenceRank(best.confidence)) {
        best = { url, confidence };
      }
      if (confidence === "high") break; // No need to check more
    }

    // Only keep medium+ confidence links
    if (best && best.confidence !== "low") {
      links[name] = best;
    }
  }

  return links;
}

function scoreSocialLink(url: string, platform: string, companyTokens: Set<string>): "high" | "medium" | "low" {
  const urlLower = url.toLowerCase();

  // Extract the path segment (the handle/slug) from the URL
  const pathSegment = urlLower
    .replace(/https?:\/\/(?:www\.)?(?:linkedin\.com|twitter\.com|x\.com|instagram\.com|youtube\.com|facebook\.com|tiktok\.com)\//, "")
    .replace(/^(?:company|in|@|channel|c)\//, "")
    .replace(/[/?#].*$/, "")
    .replace(/[^a-z0-9]/g, "");

  // High: the handle/slug contains a company token
  for (const token of companyTokens) {
    if (token.length >= 3 && pathSegment.includes(token)) return "high";
  }

  // Medium: LinkedIn /company/ pages (likely official even without name match)
  // or links found in structured social sections (heuristic: linkedin company pages are almost always official)
  if (platform === "linkedin" && urlLower.includes("/company/")) return "medium";

  // Low: personal profiles, unrelated handles
  return "low";
}

function confidenceRank(c: "high" | "medium" | "low"): number {
  return c === "high" ? 3 : c === "medium" ? 2 : 1;
}

function detectTechnicalSignals(html: string): WebsiteInsights["technicalSignals"] {
  const lower = html.toLowerCase();

  // CMS detection
  let cms: string | null = null;
  if (lower.includes("wp-content") || lower.includes("wordpress")) cms = "WordPress";
  else if (lower.includes("shopify")) cms = "Shopify";
  else if (lower.includes("__next") || lower.includes("_next/static")) cms = "Next.js";
  else if (lower.includes("wix.com")) cms = "Wix";
  else if (lower.includes("squarespace")) cms = "Squarespace";
  else if (lower.includes("webflow")) cms = "Webflow";

  // Analytics
  const analytics: string[] = [];
  if (lower.includes("google-analytics") || lower.includes("gtag") || lower.includes("ga4")) analytics.push("Google Analytics");
  if (lower.includes("plausible")) analytics.push("Plausible");
  if (lower.includes("hotjar")) analytics.push("Hotjar");
  if (lower.includes("segment.com") || lower.includes("analytics.js")) analytics.push("Segment");
  if (lower.includes("matomo") || lower.includes("piwik")) analytics.push("Matomo");

  // Chat widget
  let chatWidget: string | null = null;
  if (lower.includes("intercom")) chatWidget = "Intercom";
  else if (lower.includes("drift")) chatWidget = "Drift";
  else if (lower.includes("crisp")) chatWidget = "Crisp";
  else if (lower.includes("hubspot")) chatWidget = "HubSpot";
  else if (lower.includes("tawk.to") || lower.includes("tawk")) chatWidget = "Tawk.to";
  else if (lower.includes("zendesk")) chatWidget = "Zendesk";

  // Lead capture
  const leadCapture =
    lower.includes("newsletter") ||
    lower.includes("subscribe") ||
    lower.includes("lead") ||
    lower.includes("signup") ||
    lower.includes("mailchimp") ||
    lower.includes("convertkit") ||
    lower.includes("hubspot");

  return { cms, analytics, chatWidget, leadCapture };
}

function detectSubpages(html: string, baseUrl: string): { aboutUrl: string | null; pricingUrl: string | null } {
  const base = baseUrl.replace(/\/$/, "");
  let aboutUrl: string | null = null;
  let pricingUrl: string | null = null;

  const hrefMatches = html.match(/href=["']([^"']*?)["']/gi) ?? [];
  for (const m of hrefMatches) {
    const href = m.replace(/href=["']/i, "").replace(/["']$/, "");
    const lower = href.toLowerCase();

    if (!aboutUrl && (/\/about/i.test(lower) || /\/a-propos/i.test(lower) || /\/qui-sommes/i.test(lower))) {
      aboutUrl = href.startsWith("http") ? href : `${base}${href.startsWith("/") ? "" : "/"}${href}`;
    }
    if (!pricingUrl && (/\/pricing/i.test(lower) || /\/tarif/i.test(lower) || /\/plans/i.test(lower))) {
      pricingUrl = href.startsWith("http") ? href : `${base}${href.startsWith("/") ? "" : "/"}${href}`;
    }
    if (aboutUrl && pricingUrl) break;
  }

  return { aboutUrl, pricingUrl };
}

function buildEnrichmentPrompt(
  homepage: string,
  aboutPage: string | null,
  pricingPage: string | null,
  companyName?: string,
): string {
  let content = `=== PAGE D'ACCUEIL ===\n${homepage}\n`;
  if (aboutPage) content += `\n=== PAGE A PROPOS ===\n${aboutPage}\n`;
  if (pricingPage) content += `\n=== PAGE TARIFS ===\n${pricingPage}\n`;

  return `Analyse ce site web${companyName ? ` de "${companyName}"` : ""} et extrais les informations suivantes.
Reponds UNIQUEMENT en JSON strict (pas de commentaires, pas de markdown) :

{
  "company": {
    "name": "nom de l'entreprise ou null",
    "description": "description en 1-2 phrases ou null",
    "size": "startup / PME / ETI / grand groupe ou null",
    "location": "localisation si mentionnee ou null"
  },
  "valueProposition": "proposition de valeur principale en 1-2 phrases ou null",
  "offerings": ["produit/service 1", "produit/service 2"],
  "targetAudience": ["segment 1", "segment 2"],
  "socialProof": {
    "testimonials": true/false,
    "caseStudies": true/false,
    "metrics": ["metrique 1 si visible"],
    "logos": true/false
  },
  "contentPresence": {
    "blog": true/false,
    "newsletter": true/false,
    "podcast": true/false,
    "webinars": true/false,
    "resources": true/false
  },
  "pricingModel": "gratuit / freemium / abonnement / one-time / custom / inconnu",
  "messaging": ["mot-cle marketing 1", "mot-cle 2", "mot-cle 3"]
}

Contenu du site :
${content}`;
}

// ============================================================
// Pipeline
// ============================================================

async function runEnrichmentPipeline(
  websiteUrl: string,
  companyName: string | undefined,
  addClientFact: AddClientFactUseCase,
): Promise<void> {
  // 1. Fetch homepage
  const homepageHtml = await fetchPageContent(websiteUrl);
  if (!homepageHtml) {
    console.warn("[website-enrichment] Homepage inaccessible:", websiteUrl);
    return;
  }

  // 2. Parallel deterministic extractions
  const meta = extractMeta(homepageHtml);
  const socialLinks = extractSocialLinks(homepageHtml, websiteUrl, companyName);
  const technicalSignals = detectTechnicalSignals(homepageHtml);
  const { aboutUrl, pricingUrl } = detectSubpages(homepageHtml, websiteUrl);
  const homepageText = extractText(homepageHtml);

  // 3. Fetch about + pricing in parallel (if detected)
  const [aboutHtml, pricingHtml] = await Promise.all([
    aboutUrl ? fetchPageContent(aboutUrl) : Promise.resolve(null),
    pricingUrl ? fetchPageContent(pricingUrl) : Promise.resolve(null),
  ]);
  const aboutText = aboutHtml ? extractText(aboutHtml) : null;
  const pricingText = pricingHtml ? extractText(pricingHtml) : null;

  // 4. Claude Haiku analysis
  let llmInsights: Partial<WebsiteInsights> = {};
  try {
    const prompt = buildEnrichmentPrompt(homepageText, aboutText, pricingText, companyName);
    const responseText = await callClaudeHaiku(prompt, 1024);
    llmInsights = extractJsonFromResponse<Partial<WebsiteInsights>>(responseText);
  } catch (err) {
    console.warn("[website-enrichment] Claude Haiku failed, using deterministic extractions only:", err);
  }

  // 5. Merge LLM insights with deterministic extractions
  const insights: WebsiteInsights = {
    company: llmInsights.company ?? { name: companyName ?? meta.title, description: meta.description, size: null, location: null },
    valueProposition: llmInsights.valueProposition ?? null,
    offerings: llmInsights.offerings ?? [],
    targetAudience: llmInsights.targetAudience ?? [],
    socialProof: llmInsights.socialProof ?? { testimonials: false, caseStudies: false, metrics: [], logos: false },
    contentPresence: llmInsights.contentPresence ?? { blog: false, newsletter: false, podcast: false, webinars: false, resources: false },
    technicalSignals,
    socialLinks,
    pricingModel: llmInsights.pricingModel ?? null,
    messaging: llmInsights.messaging ?? [],
  };

  // 6. Store as ClientFacts
  storeInsightsAsFacts(websiteUrl, insights, addClientFact);
}

function storeInsightsAsFacts(
  websiteUrl: string,
  insights: WebsiteInsights,
  addClientFact: AddClientFactUseCase,
): void {
  const source = "website_enrichment";

  const facts: { category: string; fact: string }[] = [
    { category: "website_url", fact: websiteUrl },
  ];

  if (insights.company.name || insights.company.description) {
    const parts: string[] = [];
    if (insights.company.name) parts.push(`Nom: ${insights.company.name}`);
    if (insights.company.description) parts.push(`Description: ${insights.company.description}`);
    if (insights.company.size) parts.push(`Taille: ${insights.company.size}`);
    if (insights.company.location) parts.push(`Localisation: ${insights.company.location}`);
    facts.push({ category: "company_info", fact: parts.join(" | ") });
  }

  if (insights.valueProposition) {
    facts.push({ category: "value_proposition", fact: insights.valueProposition });
  }

  if (insights.offerings.length > 0) {
    facts.push({ category: "offerings", fact: insights.offerings.join(", ") });
  }

  if (insights.targetAudience.length > 0) {
    facts.push({ category: "target_audience", fact: insights.targetAudience.join(", ") });
  }

  const proofParts: string[] = [];
  if (insights.socialProof.testimonials) proofParts.push("Temoignages presents");
  if (insights.socialProof.caseStudies) proofParts.push("Etudes de cas presentes");
  if (insights.socialProof.logos) proofParts.push("Logos clients visibles");
  if (insights.socialProof.metrics.length > 0) proofParts.push(`Metriques: ${insights.socialProof.metrics.join(", ")}`);
  if (proofParts.length > 0) {
    facts.push({ category: "social_proof", fact: proofParts.join(" | ") });
  }

  const contentParts: string[] = [];
  if (insights.contentPresence.blog) contentParts.push("Blog");
  if (insights.contentPresence.newsletter) contentParts.push("Newsletter");
  if (insights.contentPresence.podcast) contentParts.push("Podcast");
  if (insights.contentPresence.webinars) contentParts.push("Webinaires");
  if (insights.contentPresence.resources) contentParts.push("Ressources");
  if (contentParts.length > 0) {
    facts.push({ category: "content_presence", fact: contentParts.join(", ") });
  }

  const techParts: string[] = [];
  if (insights.technicalSignals.cms) techParts.push(`CMS: ${insights.technicalSignals.cms}`);
  if (insights.technicalSignals.analytics.length > 0) techParts.push(`Analytics: ${insights.technicalSignals.analytics.join(", ")}`);
  if (insights.technicalSignals.chatWidget) techParts.push(`Chat: ${insights.technicalSignals.chatWidget}`);
  if (insights.technicalSignals.leadCapture) techParts.push("Lead capture detecte");
  if (techParts.length > 0) {
    facts.push({ category: "technical_stack", fact: techParts.join(" | ") });
  }

  const socialEntries = Object.entries(insights.socialLinks);
  if (socialEntries.length > 0) {
    facts.push({ category: "social_links", fact: socialEntries.map(([k, v]) => `${k}: ${v.url} (${v.confidence})`).join(" | ") });
  }

  if (insights.pricingModel) {
    facts.push({ category: "pricing_model", fact: insights.pricingModel });
  }

  if (insights.messaging.length > 0) {
    facts.push({ category: "messaging", fact: insights.messaging.join(", ") });
  }

  // Store each fact individually — one failure doesn't block the others
  for (const { category, fact } of facts) {
    try {
      addClientFact.execute({ category, fact, source });
    } catch (err) {
      console.warn(`[website-enrichment] Failed to store fact "${category}":`, err);
    }
  }
}

// ============================================================
// Public API (fire-and-forget)
// ============================================================

export function startEnrichmentInBackground(
  websiteUrl: string,
  companyName: string | undefined,
  addClientFact: AddClientFactUseCase,
): void {
  runEnrichmentPipeline(websiteUrl, companyName, addClientFact).catch((err) => {
    logError("discovery:enrichment", err);
  });
}
