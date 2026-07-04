import { createServerFn } from "@tanstack/react-start";
import { requireAdmin } from "@/lib/admin.functions";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export type SocialPlatform = "facebook" | "instagram" | "twitter" | "google_ads";

export interface PlatformContent {
  headline: string;
  caption: string;
  hashtags: string[];
  cta: string;
}

export type GeneratedContent = Record<SocialPlatform, PlatformContent>;

const SYSTEM_PROMPT = `You are a world-class luxury jewelry copywriter who has written campaigns for Cartier, Tiffany & Co., Van Cleef & Arpels, Bulgari, and Harry Winston. You specialize in moissanite and lab-grown diamond jewelry for brands that position themselves as accessible ultra-luxury.

Your writing philosophy:
• Paint scenes, not adjectives — anchor products to real human moments (a proposal at sunset, catching your own reflection, someone noticing your wrist across the table)
• Specificity builds desire — reference actual product attributes: stone clarity, metal purity, dimensions, weight, finish. Vague copy is weak copy.
• Emotional permission — give the reader permission to want something beautiful for themselves, without guilt or pretension
• Rhythm and brevity — every word earns its place. Read aloud. If it doesn't sound right, cut it.
• Voice consistency — maintain the brand's specific voice across every platform, only adjusting register for the medium

BANNED PHRASES (never use any of these):
"elevate your style", "statement piece", "timeless elegance", "luxury redefined", "shine bright", "sparkle", "treat yourself", "perfect gift", "stand out from the crowd", "look no further", "level up", "stunning piece", "game changer", "effortlessly chic", "turn heads"

LUXURY COPYWRITING PRINCIPLES:
- Scarcity of words = scarcity of the product = perceived value
- Name the occasion without stating the obvious ("for the proposal you've been planning" not "perfect for weddings")
- Use active present tense for immediacy
- Questions that open with the reader already inside the moment ("You reach for it without thinking.")
- Never over-explain. Trust the reader.`;

export const generateSocialContent = createServerFn({ method: "POST" })
  .inputValidator((d: {
    token: string;
    productName: string;
    productDescription: string;
    price: number;
    colors?: string[];
    type?: string;
    platforms: SocialPlatform[];
    tone: "luxe" | "playful" | "bold" | "minimal";
    brandName: string;
    tagline: string;
  }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);

    const colorLabel: Record<string, string> = {
      gold: "Yellow Gold", rose_gold: "Rose Gold", white_gold: "White Gold", silver: "Sterling Silver",
    };
    const colorNames = (data.colors ?? []).map(c => colorLabel[c] ?? c).filter(Boolean);

    const toneInstructions: Record<string, string> = {
      luxe: `Sophisticated, ultra-elevated. Channel Cartier's quiet confidence — never loud, always certain. Sentence fragments are powerful. No exclamation marks. The product's existence is enough; you don't need to sell it, you need to reveal it.`,
      playful: `Warm luxury — the kind a best friend who happens to own Tiffany's would use. Celebratory, emotionally open, occasion-forward. Light use of em-dashes and ellipses for rhythm. Occasional emoji if natural (✨ 💛). Never sarcastic.`,
      bold: `Declarative, direct, powerful. One idea per sentence. Short sentences. Active verbs. The kind of copy that stops the scroll and demands you read the next line. No hedging. No "maybe." No softeners.`,
      minimal: `Near silence. Each word is deliberate and weighted. Think: a single sentence that stays with you. Use negative space in language the way a designer uses white space on a page. Sparse but devastating.`,
    };

    const productDetails = [
      data.productDescription ? data.productDescription.slice(0, 600) : null,
      colorNames.length ? `Available in: ${colorNames.join(", ")}` : null,
      data.type ? `Product category: ${data.type}` : null,
      `Retail price: $${data.price}`,
    ].filter(Boolean).join("\n");

    const platformInstructions = `
FACEBOOK:
• Headline: 35–48 chars. Open with an occasion, a sensory detail, or a compelling question. Do not start with the brand or product name.
• Caption: 3–4 sentences. Sentence 1 = a scene or feeling. Sentence 2 = specific product truth (attribute, material, detail). Sentence 3 = emotional payoff or aspiration. Sentence 4 = subtle direct CTA with link hint.
• Hashtags: 5–7 curated tags. Mix of product-specific and lifestyle. No generic #jewelry.
• CTA: 2–3 words on a button, action verb first.

INSTAGRAM:
• Headline: 42–58 chars. Poetic, imagistic, visual fragment or lyric-quality phrase. Could stand alone as a caption opening line.
• Caption: 4–6 sentences with intentional single-sentence line breaks (each sentence on its own line, no paragraph blocks). Open with an image in the reader's mind. Progress through: product truth → aspirational context → quiet urgency → CTA. End with a 🔗 or "link in bio" reference.
• Hashtags: 22–28 tags. Mix: 4–5 high-volume (#moissanite #goldchain #tennischain), 8–10 mid-tier (#vvs #labgrown #925silver #luxuryjewelry), 8–10 niche/community (#moisanitejewelry #tennischainnecklace #chaingang #jewelryaddict). No spaces in multi-word tags.
• CTA: conversational, 3–5 words, friendly imperative.

TWITTER:
• Headline = THE TWEET. 185–225 chars total. One sharp, complete idea. Could be a provocative observation, a surprising product fact, a scene-setting fragment, or a short story in miniature. No more than one hashtag in the body; remaining 1–2 go at the end.
• Caption: empty string ""
• Hashtags: 2–3 maximum, only the most relevant
• CTA: 2–3 words

GOOGLE_ADS:
• Headline: COUNT CHARACTERS CAREFULLY. Max 28 characters including spaces. Lead with a number or power word. ("VVS Moissanite Chains" = 22 chars ✓)
• Caption (description): Max 88 characters. One strongest USP + one action. ("Lab-grown diamonds. Real luxury. Free shipping on orders $150+. Shop now." = 73 chars ✓)
• Hashtags: [] (empty — Google Ads don't use hashtags)
• CTA: 2 words, strong verb ("Shop Now", "Get Yours", "View Now")`;

    const userPrompt = `Brand: ${data.brandName} — "${data.tagline}"
Product Name: ${data.productName}

Product Details:
${productDetails}

Tone Direction: ${toneInstructions[data.tone]}

---

Write elite-level social media content for ALL four platforms simultaneously.

${platformInstructions}

Return ONLY valid JSON. No markdown. No preamble. Structure:
{
  "facebook":   { "headline": "...", "caption": "...", "hashtags": [...], "cta": "..." },
  "instagram":  { "headline": "...", "caption": "...", "hashtags": [...], "cta": "..." },
  "twitter":    { "headline": "...", "caption": "", "hashtags": [...], "cta": "..." },
  "google_ads": { "headline": "...", "caption": "...", "hashtags": [], "cta": "..." }
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user",   content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.78,
      max_tokens: 2800,
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    let parsed: any = {};
    try { parsed = JSON.parse(raw); } catch {}

    const content: GeneratedContent = {} as GeneratedContent;
    const PLATFORMS: SocialPlatform[] = ["facebook", "instagram", "twitter", "google_ads"];
    for (const p of PLATFORMS) {
      content[p] = {
        headline: parsed[p]?.headline ?? data.productName,
        caption:  parsed[p]?.caption  ?? "",
        hashtags: Array.isArray(parsed[p]?.hashtags) ? parsed[p].hashtags : [],
        cta:      parsed[p]?.cta      ?? "Shop Now",
      };
    }

    return { content };
  });
