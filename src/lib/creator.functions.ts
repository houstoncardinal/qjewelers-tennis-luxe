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

// ─── AI Image Generation ──────────────────────────────────────────────────────

const IMAGE_STYLE_PROMPTS: Record<string, string> = {
  studio_white:  "pure white seamless paper backdrop, professional jewelry photography studio, two large softbox lights creating crisp even illumination, razor-sharp focus, commercial product photography",
  velvet_black:  "plush black velvet jewelry display surface, dramatic chiaroscuro lighting with a single warm key light, deep rich shadows, ultra-luxury jewelry boutique editorial photography",
  marble_white:  "white Carrara marble surface with subtle natural grey veining, soft diffused natural window light raking from the left, architectural editorial fine jewelry photography",
  velvet_navy:   "deep midnight navy velvet display surface, warm accent spot lighting from above, luxury jewelry showcase photography reminiscent of high-end boutiques",
  rose_gold_bg:  "rose gold metallic gradient background surface transitioning from deep copper to soft blush, warm cinematic rim lighting, high-fashion luxury jewelry campaign photography",
  lifestyle_worn:"elegantly worn jewelry on a sophisticated woman, lifestyle photography, natural golden hour sunlight, 85mm portrait lens at f/1.4 creating painterly bokeh, aspirational editorial",
  flatlay_linen: "overhead flat lay on natural undyed Belgian linen fabric, delicate dried white flowers as accents, overhead even natural light, editorial lifestyle photography",
  marble_grey:   "cool charcoal grey slate stone surface, architectural directional lighting, editorial luxury product photography with dramatic shadows",
  bokeh_warm:    "warm golden bokeh background with soft circular light orbs, luxury fine jewelry photography, 105mm macro lens, dreamy romantic atmosphere",
  outdoor_garden:"lush botanical garden setting, dappled golden sunlight filtering through green leaves, lifestyle luxury photography, natural organic aspirational mood",
  dark_wood:     "aged polished dark walnut wood surface with natural grain, warm tungsten studio lighting, artisan atelier product photography",
  champagne_silk:"champagne satin fabric draped as background, soft studio lighting, high-fashion jewelry editorial photography",
};

const IMAGE_ANGLE_PROMPTS: Record<string, string> = {
  front:    "direct front-facing centered view, symmetric composition",
  angle_45: "elegant three-quarter 45-degree perspective",
  closeup:  "extreme close-up macro photography revealing every stone facet with crystalline clarity, highlighting the fire and brilliance of each moissanite",
  overhead: "aerial overhead bird's eye view, perfectly centered flat composition",
  draped:   "naturally draped and arranged in a flowing organic composition showing the full chain or piece",
};

export interface GeneratedImageResult {
  imageUrl: string;
  style: string;
  angle: string;
  prompt: string;
}

// Vision analysis system prompt — used by GPT-4o to study product images
// before building the generation prompt. The goal is surgical accuracy:
// capture every observable detail so the generated image is a faithful
// re-creation of the exact piece, not a generic jewelry photograph.
const VISION_SYSTEM_PROMPT = `You are a master jewelry photographer and certified gemologist with 30 years of experience documenting fine jewelry for auction houses, luxury brands, and editorial campaigns. Your eye misses nothing.

When shown images of a jewelry piece, you produce an exhaustive technical description capturing:

METAL & FINISH
- Metal color (yellow gold / rose gold / white gold / silver / rhodium)
- Surface finish (high-polish mirror / brushed matte / hammered / satin)
- Metal thickness and visual weight
- Any two-tone or mixed-metal elements

STONE CONFIGURATION
- Stone type (moissanite / diamond / gemstone)
- Setting style (prong / bezel / pavé / channel / invisible / tension / micro-pavé)
- Stone arrangement (single row / double row / cluster / graduated / alternating)
- Approximate stone count or density per inch
- Stone shape (round brilliant / princess / oval / emerald / baguette / trillion)
- Stone size relative to the setting (proportion to metal)
- Visible faceting and fire characteristics

PIECE ANATOMY
- Overall silhouette and form (straight / tapered / curved / geometric)
- Link or chain style (if applicable: cable / box / Figaro / tennis / rope / snake)
- Clasp and closure mechanism (lobster / box / toggle / magnetic / invisible)
- Length, width, and visual weight proportions
- Any pendants, charms, or focal elements
- Texture transitions or design breaks along the piece

DESIGN CHARACTER
- Design language (classic / art deco / contemporary / organic / architectural)
- Symmetry and repetition pattern
- Negative space usage
- Overall aesthetic feel in one precise sentence

Output: A single dense paragraph (180–240 words) of pure technical description. No marketing language. No adjectives like "beautiful" or "stunning". Only observable, measurable, replicable facts that a master craftsman or photographer could use to recreate the exact piece.`;

export const generateProductImage = createServerFn({ method: "POST" })
  .inputValidator((d: {
    token: string;
    productName: string;
    productType?: string;
    productImageUrls?: string[];
    style: string;
    angle: string;
    customPrompt?: string;
    count?: number;
  }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const styleDesc = IMAGE_STYLE_PROMPTS[data.style] ?? data.style;
    const angleDesc = IMAGE_ANGLE_PROMPTS[data.angle] ?? data.angle;

    let prompt: string;

    if (data.customPrompt) {
      prompt = data.customPrompt;
    } else {
      // Step 1: Use GPT-4o vision to analyze the actual product images
      // and extract a precise anatomical description of the piece.
      let anatomyDescription = "";
      const imageUrls = (data.productImageUrls ?? []).filter(Boolean).slice(0, 6);

      if (imageUrls.length > 0) {
        const visionMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
          { role: "system", content: VISION_SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Study every image of this jewelry piece carefully. Product name: "${data.productName}"${data.productType ? ` (${data.productType})` : ""}. Analyze all provided angles and produce your complete technical description.`,
              },
              ...imageUrls.map(url => ({
                type: "image_url" as const,
                image_url: { url, detail: "high" as const },
              })),
            ],
          },
        ];

        const visionRes = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: visionMessages,
          max_tokens: 500,
          temperature: 0.2,
        });
        anatomyDescription = visionRes.choices[0]?.message?.content?.trim() ?? "";
      }

      // Step 2: Build the generation prompt from the anatomy + style + angle.
      // The anatomy description is the load-bearing part — style and angle
      // are compositional instructions layered on top.
      const baseDescription = anatomyDescription
        ? `The exact jewelry piece to photograph: ${anatomyDescription}`
        : `A fine jewelry piece: ${data.productName}${data.productType ? `, a ${data.productType}` : ""}, crafted in sterling silver with precious metal plating and brilliant-cut VVS moissanite stones.`;

      prompt = `Photorealistic luxury jewelry product photograph. ${baseDescription}

Setting & environment: ${styleDesc}.
Composition: ${angleDesc}.

Photographic requirements: The piece must be rendered with absolute fidelity to its actual design — every stone, every prong, every link, every surface finish exactly as it appears in real life. The stones show exceptional fire, brilliance, and scintillation under the studio lighting. Shot on a Hasselblad medium format camera with a 120mm macro lens. Tack-sharp focus across the entire piece. Professional color grading. The image is indistinguishable from a photograph taken in a world-class jewelry photography studio.

No text, watermarks, props, hands, or additional jewelry. Only the piece itself and its environment.`;
    }

    const n = Math.min(data.count ?? 1, 4);
    const responses = await Promise.all(
      Array.from({ length: n }, () =>
        openai.images.generate({
          model: "gpt-image-1",
          prompt,
          n: 1,
          size: "1024x1024",
          quality: "high",
        })
      )
    );

    const results: GeneratedImageResult[] = [];
    for (const res of responses) {
      const b64 = res.data?.[0]?.b64_json;
      if (!b64) continue;
      const buf  = Buffer.from(b64, "base64");
      const path = `ai-gen/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;
      const { error } = await (supabaseAdmin as any).storage
        .from("product-images")
        .upload(path, buf, { contentType: "image/png", upsert: false });
      if (error) throw new Error(`Storage upload failed: ${error.message}`);
      const { data: pub } = (supabaseAdmin as any).storage
        .from("product-images").getPublicUrl(path);
      results.push({ imageUrl: pub.publicUrl, style: data.style, angle: data.angle, prompt });
    }

    return { images: results };
  });
