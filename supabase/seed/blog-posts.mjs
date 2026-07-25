// One-time (and re-runnable) seed for the Qureshi Jewelers blog.
// Usage: node supabase/seed/blog-posts.mjs
// Reads Supabase credentials from .env in the project root. Upserts on slug,
// so running it again after editing this file updates existing posts instead
// of duplicating them.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", "..", ".env");
const env = Object.fromEntries(
  fs.readFileSync(envPath, "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")];
    }),
);

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const AUTHOR = {
  slug: "qureshi-jewelers-editorial-team",
  name: "Qureshi Jewelers Editorial Team",
  title: "In-House Moissanite Specialists",
  bio:
    "Our editorial team is made up of the same people who source, grade, and hand-set every GRA-certified moissanite stone we sell. We write from direct experience running a moissanite-focused jewelry business — inspecting stones, answering customer questions daily, and standing behind every certificate we issue.",
  credentials: "Qureshi Jewelers — GRA-certified moissanite specialists, S925 sterling silver fine jewelry.",
  avatar_url: null,
};

const POSTS = [];

POSTS.push({
  slug: "what-is-moissanite",
  title: "What Is Moissanite? The Complete Guide to This Brilliant Gemstone",
  excerpt:
    "Moissanite is a genuine gemstone — silicon carbide, first discovered in a meteorite crater in 1893 and lab-created today. Here's what it's made of, how it compares to diamond, and how to tell if a stone is real moissanite.",
  category: "education",
  tags: ["moissanite basics", "what is moissanite", "silicon carbide", "gemstone education"],
  cover_image_url: "https://bstyuyzlhrkskeqpypka.supabase.co/storage/v1/object/public/product-images/H18f9030638fd4163a4d612276daa86feC-1783044440840-ot7cr9.avif",
  cover_image_alt: "VVS1 pear-cut moissanite pendant in 18K gold, showing the stone's clarity and brilliance",
  seo_title: "What Is Moissanite? Origin, Properties & Facts Explained (2026)",
  seo_description:
    "Moissanite explained: origin, how it's made, key properties, and how it compares to diamond. A complete guide from GRA-certified specialists.",
  read_time_minutes: 8,
  is_featured: true,
  status: "published",
  faq: [
    {
      question: "Is moissanite a real diamond?",
      answer:
        "No. Moissanite is not a diamond at all — it's a different mineral, silicon carbide (SiC), with its own distinct chemical composition. Diamond is pure crystallized carbon. Moissanite is sometimes confused with lab-grown diamonds, but the two are not the same thing: a lab-grown diamond is chemically identical to a mined diamond, just grown in a lab, while moissanite is an entirely different gemstone that happens to look similar to diamond.",
    },
    {
      question: "Is moissanite considered a 'fake' diamond?",
      answer:
        "No — that label is a common misconception. Moissanite isn't a diamond imitation made of glass or plastic; it's a genuine, naturally occurring mineral (extremely rare in nature) that's cultivated in labs for jewelry use, the same way lab-grown diamonds and lab-grown rubies are cultivated. It has real hardness, real brilliance, and its own certification standards. It's simply a different gemstone than diamond, not a fake version of one.",
    },
    {
      question: "How long does moissanite last?",
      answer:
        "Moissanite is extremely durable and, under normal wear, lasts a lifetime. At 9.25 on the Mohs hardness scale, it resists scratching from everyday activity. It won't cloud, discolor, or lose brilliance over time the way some softer gemstones can — the biggest long-term maintenance concern is with the metal setting (prongs can loosen over years of wear), not the stone itself.",
    },
    {
      question: "Can you tell moissanite apart from diamond with the naked eye?",
      answer:
        "For a well-cut, colorless (D-color) moissanite, most people cannot tell the difference at a glance. The one distinguishing trait some trained eyes notice in bright, direct light is moissanite's stronger 'fire' — it throws more rainbow-colored flashes than diamond, which tends to flash more white/grey light. Jewelers use specialized testers (see below) rather than the naked eye to confirm which gemstone they're looking at.",
    },
    {
      question: "What does GRA certification mean?",
      answer:
        "GRA stands for Gemstone Research Association, an independent lab that grades and certifies moissanite and other lab-created gemstones for clarity, color, and cut. A GRA certificate is issued per stone and verifies what you're buying matches its stated grade. It's a different certifying body than GIA, which primarily grades natural (mined) diamonds — the two aren't interchangeable, but GRA plays a comparable verification role for the moissanite market.",
    },
  ],
  content: `
<p>Moissanite is a naturally occurring gemstone made of <strong>silicon carbide (SiC)</strong> — first identified in 1893 inside a meteorite crater, and grown in laboratories for jewelry use since the late 1990s. It's the second-hardest gemstone on earth after diamond, and it produces more brilliance and "fire" (rainbow-colored light flashes) than diamond does. It is not a diamond, and it is not a diamond imitation — it's its own distinct mineral with a well-documented history and its own grading standards.</p>

<p>If you've landed here because you're trying to figure out whether moissanite is "real," whether it's the same as a lab-grown diamond, or whether it's a good choice for a ring you're about to buy, this guide covers all of it — accurately, without the sales pitch.</p>

<h2>The Origin Story: A Meteorite Discovery</h2>
<p>Moissanite's history starts somewhere unexpected: a meteor crater in Arizona. In 1893, French chemist <strong>Dr. Henri Moissan</strong> was examining rock samples from the Canyon Diablo meteorite site when he found tiny, glittering crystals he initially believed were diamonds. It took years of further analysis to determine they were actually a previously unknown mineral — silicon carbide. In 1905, the mineral was named <em>moissanite</em> in his honor. Moissan went on to win the Nobel Prize in Chemistry in 1906, though for unrelated work on fluorine isolation.</p>
<p>Naturally occurring moissanite is exceptionally rare — so rare that natural specimens large enough to cut into jewelry are essentially never found. Almost every moissanite gemstone sold today, including every stone we sell, is <strong>lab-created</strong>, not mined.</p>

<h2>How Moissanite Is Made Today</h2>
<p>Because natural moissanite is too rare to supply a jewelry market, the moissanite in modern jewelry is grown in controlled laboratory environments using advanced thermal crystal-growing processes that replicate the conditions under which silicon carbide forms. This isn't the same thing as manufacturing a glass or plastic diamond look-alike — the end result is a genuine crystalline silicon carbide gemstone, with the same optical and physical properties as the mineral Henri Moissan identified, just grown intentionally rather than found by chance in a 50,000-year-old meteorite impact.</p>
<p>This lab-created process is also why moissanite carries a meaningful ethical advantage for buyers who care about it: there's no mining involved, which means no mining-related land disruption, and no exposure to the supply-chain concerns that have historically dogged parts of the mined-diamond industry.</p>

<h2>The Physical Properties That Make Moissanite Distinct</h2>

<h3>Hardness</h3>
<p>Moissanite rates <strong>9.25 on the Mohs hardness scale</strong>, where diamond sits at a perfect 10 and common sapphire/ruby sit at 9. That makes moissanite the second-hardest gemstone available for jewelry use — hard enough to resist scratching in an engagement ring worn every day, and hard enough that it will outlast the person wearing it with ordinary care.</p>

<h3>Brilliance and Fire</h3>
<p>This is where moissanite actually <em>exceeds</em> diamond, not just approaches it. "Brilliance" refers to how much white light a stone reflects; "fire" refers to how much it splits light into flashes of spectral color, like a tiny prism. Moissanite has a higher refractive index and significantly higher dispersion than diamond, which is why moissanite jewelry tends to throw more visible rainbow flashes in direct or bright light.</p>

<table>
  <thead>
    <tr><th>Property</th><th>Moissanite</th><th>Diamond</th></tr>
  </thead>
  <tbody>
    <tr><td>Hardness (Mohs scale)</td><td>9.25</td><td>10</td></tr>
    <tr><td>Refractive index (brilliance)</td><td>2.65–2.69</td><td>2.42</td></tr>
    <tr><td>Dispersion (fire)</td><td>0.104</td><td>0.044</td></tr>
    <tr><td>Formed from</td><td>Silicon carbide</td><td>Pure carbon</td></tr>
  </tbody>
</table>

<h3>Durability Over Time</h3>
<p>Moissanite doesn't cloud, discolor, or lose its polish under normal wear. It's chemically stable and resistant to household chemicals in the way most fine jewelry stones are, though — as with any ring — the metal setting around it needs periodic checking, since prongs are the part of a ring most likely to loosen with years of wear, not the stone.</p>

<h2>Moissanite vs. Cubic Zirconia: Not the Same Thing</h2>
<p>Moissanite is frequently, and incorrectly, lumped together with cubic zirconia (CZ). They are not comparable. CZ is a synthetic compound (zirconium dioxide) with a hardness of only 8–8.5, a much lower refractive index, and noticeably less brilliance — it's a genuine diamond <em>simulant</em>, manufactured specifically to visually resemble diamond at low cost, and it tends to show wear (surface scratching, cloudiness) within a few years of regular use. Moissanite is a harder, more brilliant, longer-wearing mineral with its own independent identity, not a diamond stand-in.</p>

<h2>Is Moissanite "Fake"? Addressing the Misconception</h2>
<p>No. This is the single most common misunderstanding about moissanite, so it's worth being direct: moissanite is not a "fake diamond." It's a real, hard, brilliant, chemically distinct gemstone. The confusion usually comes from conflating three different things:</p>
<ul>
  <li><strong>Mined diamond</strong> — natural carbon crystal, extracted from the earth.</li>
  <li><strong>Lab-grown diamond</strong> — chemically identical pure carbon, grown in a lab instead of mined. Still a diamond.</li>
  <li><strong>Moissanite</strong> — a different mineral (silicon carbide) entirely, grown in a lab because natural supply is too rare to use commercially. Not a diamond, not trying to be marketed as one — an alternative gemstone in its own right.</li>
</ul>
<p>None of these are "fake." A cubic zirconia stone or glass rhinestone would be the accurate example of a fake diamond simulant. Moissanite is a legitimate gemstone with its own name, its own mineral classification, and its own grading standards.</p>

<h2>How Jewelers Tell Moissanite From Diamond</h2>
<p>Because moissanite is such a good thermal conductor, older diamond-testing pens (which only measure thermal conductivity) can actually give a false positive and read moissanite as diamond. That's why the trade moved to combined thermal-and-electrical testers, which correctly separate the two based on electrical conductivity — diamond doesn't conduct electricity, moissanite does. Gemologists also look at moissanite's <strong>birefringence</strong> (double refraction) under magnification: because moissanite bends light into two rays as it passes through the stone, a trained eye can sometimes see a subtle "doubling" of the stone's back facets under a loupe — an effect diamond, which is singly refractive, doesn't produce.</p>

<h2>Is Moissanite Right for You?</h2>
<p>Moissanite makes the most sense if what you value is brilliance, durability, and value per dollar spent — a stone that will outshine a diamond of the same size in direct light, at a fraction of the cost, with zero mining impact. It's not the right choice if what you specifically want is a mined diamond for its rarity, resale market, or family tradition — moissanite is a different gemstone, not a diamond substitute, and it shouldn't be sold or bought as one. For everyone else, it's a genuinely excellent, well-understood, independently certified stone.</p>
<p>Every moissanite stone we sell is <a href="/moissanite-guide">VVS clarity, D-color (colorless), and GRA certified</a>, hand-set in solid S925 sterling silver. If you want to see how it actually looks in a finished piece, <a href="/shop">browse the full collection</a> — or keep reading with our <a href="/blog/moissanite-vs-diamond">full moissanite vs. diamond comparison</a>.</p>
`,
});

POSTS.push({
  slug: "moissanite-vs-diamond",
  title: "Moissanite vs. Diamond: The Complete, Honest Comparison",
  excerpt:
    "Moissanite has more brilliance and fire than diamond, costs a fraction of the price, and is always lab-created — but diamond still wins on hardness and resale value. Here's an honest, side-by-side breakdown.",
  category: "comparison",
  tags: ["moissanite vs diamond", "diamond alternative", "gemstone comparison"],
  cover_image_url: "https://bstyuyzlhrkskeqpypka.supabase.co/storage/v1/object/public/product-images/H69653c5f7a8c41df9c62e805cb3b89dbH-1783043601076-mha5xm.avif",
  cover_image_alt: "Oval-cut moissanite solitaire ring, the classic diamond-comparison silhouette",
  seo_title: "Moissanite vs. Diamond: Full Comparison Guide (2026)",
  seo_description:
    "An honest, detailed comparison of moissanite and diamond — brilliance, hardness, price, ethics, and resale value — so you can decide which is right for you.",
  read_time_minutes: 9,
  is_featured: false,
  status: "published",
  faq: [
    {
      question: "Is moissanite better than diamond?",
      answer:
        "Neither is objectively 'better' — they're different gemstones with different strengths. Moissanite has more brilliance and fire (more sparkle and rainbow flash), costs far less, and is always lab-created with no mining involved. Diamond is harder, has a more established resale market, and carries a longer cultural tradition, especially for engagement rings. Which one is 'better' depends entirely on what you're optimizing for.",
    },
    {
      question: "Can a jeweler tell if a stone is moissanite instead of diamond?",
      answer:
        "Yes, with the right tools. Standard thermal-only diamond testers can be fooled by moissanite because it's also a strong thermal conductor, but combined thermal-and-electrical testers correctly identify moissanite because — unlike diamond — it conducts electricity. A gemologist can also spot moissanite's double refraction (birefringence) under magnification, which diamond doesn't exhibit.",
    },
    {
      question: "Does moissanite hold its value like diamond?",
      answer:
        "No, and it's worth being upfront about this: moissanite does not have a meaningful resale or investment market the way diamond does. If resale value or diamond's role as a store of value matters to your decision, that's a real point in diamond's favor. Most people buying moissanite are doing so for its beauty, durability, and price relative to diamond — not as a financial asset.",
    },
    {
      question: "Why is moissanite so much cheaper than diamond?",
      answer:
        "Primarily because it's lab-created at scale with a straightforward, well-understood growing process, and because it isn't subject to the mined-diamond supply chain (extraction, sorting, cutting, the traditional diamond distribution system) that adds cost at every stage. A moissanite stone typically costs a small fraction of a diamond of comparable size and visual quality.",
    },
    {
      question: "Does moissanite look 'fake' next to a real diamond?",
      answer:
        "No — a well-cut, colorless, properly graded moissanite stone looks like a bright, brilliant gemstone, not a fake anything. The one visible difference some people notice in direct sunlight is that moissanite throws more rainbow-colored fire than diamond, which reads as more sparkly rather than fake.",
    },
  ],
  content: `
<p>Moissanite and diamond are both hard, brilliant, colorless-when-graded-well gemstones — and that's largely where the similarity ends. Moissanite throws more fire and brilliance and costs a fraction of diamond's price; diamond is harder, has an established resale market, and carries more cultural weight, particularly for engagement rings. Neither one is a strictly "better" choice — they're built for different priorities. Here's the full comparison, without a thumb on the scale.</p>

<h2>At a Glance</h2>
<table>
  <thead>
    <tr><th>Factor</th><th>Moissanite</th><th>Diamond</th></tr>
  </thead>
  <tbody>
    <tr><td>Hardness (Mohs)</td><td>9.25</td><td>10</td></tr>
    <tr><td>Brilliance (refractive index)</td><td>2.65–2.69 — higher</td><td>2.42</td></tr>
    <tr><td>Fire (dispersion)</td><td>0.104 — higher</td><td>0.044</td></tr>
    <tr><td>Typical price per carat</td><td>~$300–600</td><td>$3,000–$15,000+</td></tr>
    <tr><td>Origin</td><td>Always lab-created</td><td>Mined or lab-grown</td></tr>
    <tr><td>Resale market</td><td>Minimal</td><td>Established</td></tr>
    <tr><td>Clarity available</td><td>VVS (eye-clean)</td><td>VVS (eye-clean)</td></tr>
    <tr><td>Best color grade</td><td>D (colorless)</td><td>D (colorless)</td></tr>
  </tbody>
</table>

<h2>Appearance and Brilliance</h2>
<p>This is moissanite's strongest category. Its refractive index (2.65–2.69) is meaningfully higher than diamond's (2.42), which means it bends and reflects more light back to the eye. Its dispersion — the property responsible for "fire," the rainbow-colored flashes you see when light splits inside a stone — is more than double diamond's. In practice, that means moissanite tends to look <em>more</em> sparkly and colorful in direct or bright light than a diamond of the same size and cut. Some people love this effect; a smaller number of traditional diamond buyers find diamond's more restrained, white-light brilliance preferable. It's genuinely a matter of taste at this point, not a case where one stone is objectively more beautiful.</p>

<h2>Hardness and Everyday Durability</h2>
<p>Diamond is the hardest natural material on earth, at a perfect 10 on the Mohs scale. Moissanite comes in just below it at 9.25 — still hard enough to shrug off scratches from daily wear, cooking, typing, exercising, and the general abuse an engagement ring or everyday chain takes. In practical terms, both stones will comfortably outlast the metal setting holding them; the half-point difference in hardness isn't something you'll notice in 10, 20, or 50 years of normal wear.</p>

<h2>Price: The Biggest Practical Difference</h2>
<p>A well-cut, eye-clean, colorless moissanite typically runs somewhere in the neighborhood of $300–$600 per carat. A diamond of comparable size, clarity, and color grade can run anywhere from $3,000 to well over $15,000 per carat, depending on the four Cs and market conditions. This gap is the reason so many buyers choose moissanite: it lets you buy a larger, higher-clarity, better-cut stone for the same budget, or the same visual impact for a fraction of the spend.</p>

<h2>Ethics and Sourcing</h2>
<p>All moissanite sold today is lab-created — there's no mining involved, no land disruption, and none of the sourcing complexity that has historically been a concern in parts of the mined-diamond trade (though the modern diamond industry, particularly through Kimberley Process certification and the rise of lab-grown diamonds, has made significant strides on this front too). If sourcing and environmental impact are a deciding factor for you, moissanite has a straightforward, verifiable advantage: it was grown in a lab, full stop.</p>

<h2>Resale Value: Diamond's Real Advantage</h2>
<p>It would be dishonest to leave this out. Diamond has a long-established secondary market — jewelers, pawn shops, and resale platforms have decades of infrastructure built around buying and reselling diamonds. Moissanite does not have an equivalent resale market; its value is almost entirely in its use as jewelry, not as a resellable asset. If you're weighing this purchase partly as a store of value, that's a legitimate point in diamond's favor, and we'd rather tell you that directly than let you find out later.</p>

<h2>Can People Actually Tell the Difference?</h2>
<p>For a well-cut, colorless moissanite versus a well-cut, colorless diamond, most people — including most casual observers — cannot tell them apart by eye. Jewelers and gemologists can, using tools designed specifically for the job: combined thermal-and-electrical testers (moissanite conducts electricity; diamond doesn't) and magnified inspection for moissanite's characteristic double refraction. Under a loupe or microscope, a trained eye may also notice moissanite's stronger rainbow fire in bright light as a visual tell, even without instruments.</p>

<h2>Which One Should You Choose?</h2>
<p>A simple way to think about it:</p>
<ul>
  <li><strong>Choose moissanite</strong> if you want maximum brilliance and fire, a larger or higher-clarity stone for your budget, a lab-created/zero-mining stone, or you're simply not interested in paying diamond prices for similar visual impact.</li>
  <li><strong>Choose diamond</strong> if resale value matters to you, you want the hardest possible stone, or diamond's traditional role (especially for engagement rings) is important to you personally or culturally.</li>
</ul>
<p>Both are legitimate, durable, beautiful choices — the right one depends on what you're actually optimizing for. If you're specifically weighing moissanite for an engagement ring, we go deeper on that decision in <a href="/blog/moissanite-engagement-ring-guide">our engagement ring guide</a>. Every moissanite piece we sell is VVS clarity, D-color, GRA certified, and hand-set in solid S925 sterling silver — <a href="/shop">see the full collection here</a>.</p>
`,
});

POSTS.push({
  slug: "moissanite-engagement-ring-guide",
  title: "Is Moissanite a Good Choice for an Engagement Ring?",
  excerpt:
    "Yes, for most couples — moissanite is hard enough for daily wear, more brilliant than diamond, and lets you afford a larger stone or better setting. Here's what to actually look for when buying one.",
  category: "buying-guide",
  tags: ["moissanite engagement ring", "engagement ring guide", "diamond alternative ring"],
  cover_image_url: "https://bstyuyzlhrkskeqpypka.supabase.co/storage/v1/object/public/product-images/Hdaf199cca494432db7b7da87965d4b5eS-1782778451637-6x52ed.avif",
  cover_image_alt: "Round brilliant moissanite solitaire engagement ring in sterling silver",
  seo_title: "Is Moissanite Good for an Engagement Ring? Full Buying Guide",
  seo_description:
    "Everything to know before buying a moissanite engagement ring: durability for daily wear, what to look for, setting styles, sizing, and budget guidance.",
  read_time_minutes: 8,
  is_featured: false,
  status: "published",
  faq: [
    {
      question: "Is moissanite durable enough to wear every day as an engagement ring?",
      answer:
        "Yes. At 9.25 on the Mohs hardness scale, moissanite comfortably withstands the daily wear an engagement ring goes through — cooking, typing, exercise, and general use. It won't scratch under normal conditions and doesn't cloud, discolor, or lose brilliance over time. The part of the ring most likely to need attention over the years is the metal setting (prongs can loosen with wear), which is true of any engagement ring regardless of stone.",
    },
    {
      question: "Will people be able to tell my engagement ring isn't a diamond?",
      answer:
        "For a well-cut, colorless (D-color), properly graded moissanite, most people cannot tell the difference by eye. The main visual distinction — more rainbow-colored fire in direct light — reads as extra sparkle to most observers rather than as a tell. Jewelers can identify moissanite with specialized testing equipment, but casual observation won't reveal it.",
    },
    {
      question: "What size moissanite should I get for an engagement ring?",
      answer:
        "This comes down to budget and personal taste rather than a hard rule, since moissanite's lower price per carat means the usual diamond-budget math doesn't fully apply — many buyers choose a noticeably larger center stone than they could afford in diamond at the same price point. 1ct to 2ct is a common range for a statement solitaire; smaller stones (0.5ct–1ct) still show strong brilliance given moissanite's high dispersion.",
    },
    {
      question: "Does moissanite work in a halo or vintage-style setting?",
      answer:
        "Yes — moissanite's brilliance and fire hold up well in virtually any setting style, including halo, vintage, and pavé designs. Because it's more affordable than diamond, it's often easier to justify a more elaborate setting (more accent stones, a more detailed band) within the same budget.",
    },
    {
      question: "How much does a moissanite engagement ring typically cost?",
      answer:
        "A complete moissanite engagement ring — center stone, setting, and band — commonly ranges from around $300 to $2,500+ depending on center stone size, metal choice, and setting complexity, compared to several thousand dollars minimum for a comparable diamond ring. See our full pricing breakdown in the moissanite price guide.",
    },
  ],
  content: `
<p>For most couples, yes — moissanite is a genuinely good choice for an engagement ring. It's hard enough for daily wear, it's more brilliant than diamond, and its lower cost typically means you can afford a larger center stone, a better metal, or a more detailed setting for the same budget. The one group it's not ideal for is buyers who specifically want a mined diamond for resale value or tradition — for everyone else, it holds up to real scrutiny. Here's what actually matters when you're deciding.</p>

<h2>Why Couples Choose Moissanite for Engagement Rings</h2>
<ul>
  <li><strong>More brilliance for the money.</strong> Moissanite's higher refractive index and dispersion mean it visibly out-sparkles a diamond of the same size in most lighting.</li>
  <li><strong>Room in the budget.</strong> At roughly a tenth of diamond's price per carat, the same budget stretches to a larger stone, a heavier gold setting, or both.</li>
  <li><strong>No mining involved.</strong> Every moissanite stone is lab-created, which matters to couples who want to avoid mined-gemstone sourcing questions entirely.</li>
  <li><strong>Built for daily wear.</strong> At 9.25 Mohs hardness, it's practically as scratch-resistant as diamond in real-world use.</li>
</ul>

<h2>Is It Actually Durable Enough for Daily Wear?</h2>
<p>Yes. An engagement ring gets more daily abuse than almost any other piece of jewelry — dishwashing, gym sessions, typing, gardening, the occasional accidental knock against a countertop. Moissanite's 9.25 Mohs hardness puts it well above the materials that cause most day-to-day scratching (household dust is mostly quartz, at 7 Mohs), so it holds its polish and edges over years of wear. It's also chemically stable and won't cloud or discolor. The realistic long-term maintenance item on any engagement ring — moissanite or diamond — is the metal setting itself: prongs can loosen or wear thin over 5–10+ years and should be checked periodically, which is simply a fact of ring ownership, not a moissanite-specific concern.</p>

<h2>What to Actually Look For When Buying</h2>
<h3>Clarity and Color</h3>
<p>Look for <strong>VVS clarity</strong> (very, very slightly included — meaning any inclusions are invisible without magnification) and <strong>D-color</strong> (the top, completely colorless grade). Lower grades exist and cost less, but color in particular is where cheaper moissanite can show a yellow or greenish tint, especially in larger stones — it's worth paying for D-color if brilliance and a colorless look are the point of choosing moissanite in the first place.</p>
<h3>Certification</h3>
<p>A legitimate seller should provide independent certification — commonly a <strong>GRA (Gemstone Research Association)</strong> certificate — verifying the stone's clarity, color, and cut match what you're being sold. Don't buy an uncertified center stone for an engagement ring.</p>
<h3>Cut</h3>
<p>Cut quality affects brilliance more than almost any other factor. A poorly cut moissanite will look duller than a well-cut one of the same clarity and color grade — this is true of any faceted gemstone, but it matters more with moissanite specifically because its whole appeal is brilliance and fire.</p>
<h3>Metal and Setting</h3>
<p>Solid <strong>S925 sterling silver</strong> with genuine precious-metal plating (18K gold, rose gold, or white gold/rhodium) is a durable, tarnish-resistant foundation at a fraction of solid gold's price — worth confirming you're getting solid silver underneath the plating, not a hollow or base-metal setting.</p>

<h2>Setting Styles That Work Well With Moissanite</h2>
<p>Moissanite's brilliance holds up in essentially any setting style:</p>
<ul>
  <li><strong>Solitaire</strong> — a single center stone, letting the moissanite's fire do all the work. The most popular choice, and the one that shows off cut quality most directly.</li>
  <li><strong>Halo</strong> — a ring of smaller accent stones surrounding the center stone, which increases apparent size and overall sparkle.</li>
  <li><strong>Pavé and vintage-inspired bands</strong> — small stones set along the band itself; moissanite's affordability makes it easier to justify more accent stones without the cost multiplying the way it would with diamond melee.</li>
</ul>

<h2>Getting the Sizing Right</h2>
<p>Ring sizing matters more for an engagement ring than almost any other jewelry purchase, since it's worn daily and typically isn't a surprise-and-return situation. If you're buying without the recipient present, our <a href="/size-guide">printable size guide</a> walks through measuring an existing ring or finger size accurately before you order.</p>

<h2>Addressing the Common Hesitations</h2>
<p><strong>"Will it look fake?"</strong> No — a well-cut, D-color moissanite reads as a bright, high-quality gemstone, not as costume jewelry. The "too sparkly" comment some diamond traditionalists make is really just moissanite's fire being more visible than diamond's — a difference in character, not a flaw.</p>
<p><strong>"Will people know it's not a diamond?"</strong> Casual observers, generally not. Jewelers, with the right equipment, yes — but that's true of essentially every gemstone alternative, and it's not something that comes up in daily wear.</p>
<p><strong>"Is it 'good enough' for something as important as an engagement ring?"</strong> That's a personal call, but from a pure materials standpoint: it's hard enough, brilliant enough, and certifiable enough to be a legitimate, honest choice for a ring meant to be worn for decades.</p>

<h2>Ready to Look?</h2>
<p>Every engagement ring we sell is VVS clarity, D-color, GRA certified, and hand-set in solid S925 sterling silver with your choice of 18K gold, rose gold, or white gold plating. <a href="/shop?type=ring">Browse our engagement ring collection</a>, or read our <a href="/blog/moissanite-clarity-color-grading-guide">grading guide</a> to understand exactly what those certificate numbers mean before you buy.</p>
`,
});

POSTS.push({
  slug: "moissanite-clarity-color-grading-guide",
  title: "Moissanite Clarity and Color Grading Explained: VVS, D-Color & More",
  excerpt:
    "Moissanite grading borrows its language from diamond grading — VVS clarity, D-color — but is issued by specialized labs like GRA rather than GIA. Here's exactly what each grade means and what to prioritize when buying.",
  category: "education",
  tags: ["moissanite clarity", "moissanite color grade", "VVS moissanite", "GRA certification"],
  cover_image_url: "https://bstyuyzlhrkskeqpypka.supabase.co/storage/v1/object/public/product-images/imgi_611_H7b0317c1a18f426dbbb5d4c216a6f2a0X-1781939052082-dt3a1r.jpg",
  cover_image_alt: "VVS1 D-color moissanite stud earrings showing colorless clarity up close",
  seo_title: "Moissanite Grading Explained: Clarity, Color & Cut (VVS, D-Color)",
  seo_description:
    "A clear explanation of moissanite clarity grades (VVS, VS), color grades (D-color and beyond), and what a GRA certificate actually verifies before you buy.",
  read_time_minutes: 7,
  is_featured: false,
  status: "published",
  faq: [
    {
      question: "What does VVS mean for moissanite?",
      answer:
        "VVS stands for 'Very, Very Slightly Included' — a clarity grade meaning any internal or surface characteristics are so minor they're not visible to the naked eye, only under magnification (typically 10x). It's a term borrowed from the diamond clarity scale and applied to moissanite by grading labs. VVS is generally considered eye-clean, meaning the stone looks flawless in normal wear.",
    },
    {
      question: "What is D-color moissanite?",
      answer:
        "D-color is the highest, completely colorless grade on the scale used for both diamonds and moissanite — meaning the stone has no detectable yellow, green, or grey tint, even under close inspection. It's the grade that produces the purest white brilliance and the most visible fire, since color tinting can mute a stone's overall sparkle.",
    },
    {
      question: "Does GIA certify moissanite?",
      answer:
        "No — GIA (the Gemological Institute of America) is best known for grading natural, mined diamonds and does not issue standard grading reports for moissanite. Moissanite is certified by labs that specialize in it, most commonly GRA (Gemstone Research Association), which grades and certifies clarity, color, and cut for lab-created gemstones including moissanite.",
    },
    {
      question: "Is all moissanite the same quality?",
      answer:
        "No. Moissanite quality varies meaningfully by clarity grade, color grade, and cut precision, the same way diamond does. Older or lower-grade moissanite, in particular, can show a noticeable yellow or greenish tint, especially in larger stones — a well-graded, certified D-color stone looks dramatically different from an ungraded or off-color one.",
    },
    {
      question: "Why does color grade matter so much for moissanite specifically?",
      answer:
        "Because moissanite's whole appeal is its brilliance and fire, and body color mutes both — a tinted stone looks duller and less white even if it's still technically eye-clean on clarity. Since moissanite is graded on the same D-to-Z color scale diamonds use, prioritizing D-color (or close to it) is the single biggest factor in getting the bright, colorless look most buyers actually want.",
    },
  ],
  content: `
<p>Moissanite is graded using clarity and color language borrowed directly from the diamond industry — terms like VVS and D-color — but because GIA doesn't issue standard grading reports for moissanite, that grading is done by labs that specialize in lab-created gemstones, most commonly <strong>GRA (Gemstone Research Association)</strong>. Understanding what these grades actually mean is the difference between buying a stone that looks flawless and one that looks visibly tinted or included, even though both might be labeled "moissanite" on a listing.</p>

<h2>Clarity Grades Explained</h2>
<p>Clarity measures how many internal or surface characteristics (inclusions and blemishes) a stone has, and how visible they are. The scale runs, from best to lowest:</p>
<ul>
  <li><strong>FL / IF (Flawless / Internally Flawless)</strong> — no inclusions visible even under magnification. Extremely rare and not typically necessary for a beautiful stone.</li>
  <li><strong>VVS1 / VVS2 (Very, Very Slightly Included)</strong> — inclusions so minor they're invisible to the naked eye and difficult to find even under 10x magnification. This is the grade we use across our collection, and it's considered fully eye-clean.</li>
  <li><strong>VS1 / VS2 (Very Slightly Included)</strong> — minor inclusions, generally still invisible without magnification but easier to locate under a loupe than VVS.</li>
  <li><strong>SI (Slightly Included)</strong> — inclusions may become visible to the naked eye, particularly in larger stones.</li>
</ul>
<p>For virtually all buyers, <strong>VVS is the practical sweet spot</strong>: it looks completely clean to the eye without paying a premium for flawless grades that offer no visible difference in a finished piece of jewelry.</p>

<h2>Color Grades Explained</h2>
<p>Color measures how much yellow, green, or grey tint a stone has — the less, the better, and the more brilliant and "white" the stone looks. The scale (also borrowed from diamond grading) runs from D to Z:</p>
<table>
  <thead><tr><th>Grade</th><th>Description</th></tr></thead>
  <tbody>
    <tr><td>D–F</td><td>Colorless — no detectable tint, the whitest and most brilliant appearance</td></tr>
    <tr><td>G–J</td><td>Near colorless — tint is faint and hard to notice unless compared side-by-side with a colorless stone</td></tr>
    <tr><td>K and below</td><td>Noticeable warm tint, increasingly visible to the naked eye</td></tr>
  </tbody>
</table>
<p>This is the grade to pay closest attention to when buying moissanite specifically. Earlier generations of commercial moissanite were prone to a faint yellow or green cast, especially in larger stones — modern <strong>D-color moissanite</strong> is fully colorless and doesn't have that issue, but not every seller uses D-color stock. If a listing doesn't specify a color grade, ask before buying.</p>

<h2>Cut: The Grade That Affects Brilliance the Most</h2>
<p>Cut quality — how precisely a stone's facets are angled and proportioned — determines how much light gets reflected back to the eye versus lost out the sides or bottom of the stone. A poorly cut stone can look dull even with excellent clarity and color, while a well-cut stone maximizes brilliance and fire. Cut isn't standardized across the industry as tightly as clarity and color are, but reputable sellers grade it (commonly as Excellent, Very Good, or Good) and it's worth confirming before buying, especially for a center stone in an engagement ring.</p>

<h2>What a GRA Certificate Actually Verifies</h2>
<p>A GRA certificate is issued per stone and documents its clarity grade, color grade, cut, carat weight (or millimeter size), and confirms it's genuine lab-created moissanite rather than a lower-grade simulant. It's the paper trail that lets you verify a seller's claims rather than taking a product description at face value — every stone we sell ships with one.</p>

<h2>What to Prioritize When Buying</h2>
<ol>
  <li><strong>Color first.</strong> D-color (colorless) makes the single biggest visible difference in how bright and "white" a stone looks.</li>
  <li><strong>Clarity second.</strong> VVS is eye-clean and indistinguishable from flawless grades to the naked eye — no need to pay more for FL/IF.</li>
  <li><strong>Cut third.</strong> A well-cut VS stone can outshine a poorly cut VVS one — ask about cut grade, not just clarity and color.</li>
  <li><strong>Always ask for certification.</strong> A GRA certificate (or equivalent) confirms the grades match what you're paying for.</li>
</ol>

<p>Every piece in our collection is VVS clarity, D-color, and GRA certified as standard — not an upgrade option. <a href="/shop">See the full collection</a>, or read our <a href="/blog/moissanite-price-guide">price guide</a> to understand how these grades translate into what you'll actually pay.</p>
`,
});

POSTS.push({
  slug: "how-to-clean-moissanite-jewelry",
  title: "How to Clean and Care for Your Moissanite Jewelry (Complete Guide)",
  excerpt:
    "Warm water, a drop of mild soap, and a soft brush is really all moissanite needs — done a couple of times a month. Here's the full step-by-step routine, what to avoid, and how to keep the metal setting looking new too.",
  category: "care",
  tags: ["moissanite care", "how to clean moissanite", "jewelry cleaning", "jewelry maintenance"],
  cover_image_url: "https://sc04.alicdn.com/kf/H7f6c1d585c3644b192014815f298148av.jpg",
  cover_image_alt: "VVS moissanite tennis bracelet in 18K gold-plated sterling silver",
  seo_title: "How to Clean Moissanite Jewelry: Step-by-Step Guide",
  seo_description:
    "The complete, step-by-step guide to cleaning and caring for moissanite jewelry — what to use, what to avoid, how often to clean it, and how to store it.",
  read_time_minutes: 6,
  is_featured: false,
  status: "published",
  faq: [
    {
      question: "What's the best way to clean moissanite jewelry at home?",
      answer:
        "Soak the piece for 10–15 minutes in warm (not hot) water with a few drops of mild dish soap, gently brush the stone and setting with a soft-bristled brush (a clean, soft toothbrush works well), rinse thoroughly under running water, and pat dry with a lint-free cloth. This routine is safe for moissanite and for S925 sterling silver settings.",
    },
    {
      question: "Can you use an ultrasonic cleaner on moissanite jewelry?",
      answer:
        "Moissanite itself is hard and chemically stable enough to generally tolerate ultrasonic cleaning, but we'd still recommend caution or a professional jeweler's opinion first — ultrasonic vibration can occasionally loosen prongs on older or delicate settings regardless of what stone is set in them. The at-home soap-and-soft-brush method is safer for regular maintenance and works just as well for keeping the stone brilliant.",
    },
    {
      question: "How often should I clean my moissanite jewelry?",
      answer:
        "Every 2–4 weeks for pieces worn regularly, like a moissanite tennis bracelet or stud earrings worn daily. Pieces worn less often, like an occasional-wear necklace, can be cleaned before and after wear or roughly once a month. Body oils, lotion, and everyday dust build up on the underside of a stone and dull its brilliance faster than most people expect.",
    },
    {
      question: "What should I never use to clean moissanite jewelry?",
      answer:
        "Avoid chlorine and bleach (both can damage sterling silver and gold plating over time), abrasive powders or toothpaste (they can scratch metal finishes even though they won't scratch the stone), and harsh commercial jewelry dips not specifically rated for plated metal, which can strip plating with repeated use.",
    },
    {
      question: "Does the metal setting need different care than the stone?",
      answer:
        "Yes. Moissanite itself is extremely hardy, but plated finishes (18K gold, rose gold, or rhodium/white gold over S925 sterling silver) are more delicate than the stone and benefit from gentler handling — avoid abrasive cloths and polish only with products safe for plated jewelry, not raw-metal polishing compounds meant for solid gold.",
    },
  ],
  content: `
<p>Moissanite jewelry is genuinely low-maintenance: warm water, a drop of mild dish soap, and a soft brush, done every couple of weeks, is enough to keep it looking as brilliant as the day it arrived. The stone itself is extremely hard and chemically stable — most of the care that actually matters is protecting the metal setting around it. Here's the full routine.</p>

<h2>What You'll Need</h2>
<ul>
  <li>A small bowl of warm (not hot) water</li>
  <li>A few drops of mild, fragrance-free dish soap</li>
  <li>A soft-bristled brush (a clean, unused soft toothbrush works well)</li>
  <li>A lint-free cloth</li>
</ul>

<h2>Step-by-Step Cleaning Instructions</h2>
<ol>
  <li><strong>Mix the solution.</strong> Add a few drops of mild dish soap to a bowl of warm water and stir gently until slightly sudsy.</li>
  <li><strong>Soak the piece.</strong> Submerge your moissanite jewelry for 10–15 minutes. This loosens body oil, lotion, and everyday dust buildup, which dulls brilliance more than most people expect.</li>
  <li><strong>Brush gently.</strong> Using the soft-bristled brush, gently clean around the stone, the setting, and any hard-to-reach areas like under prongs or in bracelet links, where residue tends to collect.</li>
  <li><strong>Rinse thoroughly.</strong> Rinse under running water, making sure all soap residue is removed. If you're doing this over a sink, close the drain first or use a bowl — small pieces can slip away easily.</li>
  <li><strong>Dry and buff.</strong> Pat dry with a lint-free cloth, then gently buff the stone to restore its shine.</li>
</ol>

<h2>What to Avoid</h2>
<ul>
  <li><strong>Chlorine and bleach.</strong> Both can degrade sterling silver and plated finishes over repeated exposure — remove jewelry before swimming in a pool or cleaning with bleach-based products.</li>
  <li><strong>Abrasive powders or toothpaste.</strong> A popular myth is that toothpaste is a safe jewelry polish — it's mildly abrasive and can dull plated metal finishes over time, even though it won't scratch the moissanite itself.</li>
  <li><strong>Harsh commercial jewelry dips.</strong> Many are formulated for solid gold or platinum and aren't gentle on plated finishes; repeated use can wear plating thin.</li>
  <li><strong>Ultrasonic cleaners, with caution.</strong> Moissanite generally tolerates ultrasonic cleaning well given its hardness, but the vibration can loosen prongs over time regardless of the stone — check with a jeweler before making it a routine habit, especially on delicate or antique-style settings.</li>
</ul>

<h2>How Often Should You Clean It</h2>
<p>As a general guide: pieces worn daily (tennis bracelets, stud earrings, a chain you rarely take off) benefit from cleaning every 2–4 weeks. Occasional-wear pieces can be cleaned before and after each wear, or roughly once a month if worn regularly for events. If a piece suddenly looks noticeably duller than usual, that's a sign it's overdue, not a sign of stone quality — brilliance loss from buildup is completely reversible with a proper clean.</p>

<h2>Storing Moissanite Jewelry Between Wears</h2>
<ul>
  <li>Store pieces separately, not tangled together in a drawer — metal-on-metal contact and other jewelry can scratch plated finishes over time (moissanite is far too hard to be scratched by most other jewelry, but the setting isn't).</li>
  <li>A soft-lined jewelry box, individual pouches, or the original box are all good options.</li>
  <li>Keep pieces away from direct humidity (like a bathroom counter) to slow natural metal tarnishing.</li>
</ul>

<h2>Caring for Different Metal Finishes</h2>
<p>All of our pieces are built on a solid S925 sterling silver base with a 5x precious-metal e-coating in 18K yellow gold, rose gold, or rhodium (white gold). The moissanite itself is cared for identically across finishes; the plating benefits from slightly gentler handling than raw gold jewelry would need, since it's a coating rather than the piece being solid gold throughout:</p>
<ul>
  <li><strong>Yellow and rose gold plating</strong> — avoid abrasive polishing cloths designed for solid gold; the gentle soap-and-water method is sufficient and won't wear down the coating.</li>
  <li><strong>Rhodium (white gold) plating</strong> — the most common finish to show wear over years of heavy use; if it starts to look warmer or duller, that's the coating naturally thinning, not a defect, and it can be professionally re-plated.</li>
</ul>

<h2>When to See a Professional</h2>
<p>Bring any piece to a jeweler for inspection roughly once a year, or sooner if you notice a loose-feeling stone, a bent prong, or a clasp that doesn't close as securely as it used to. This is standard advice for any fine jewelry, not something specific to moissanite — the stone itself rarely needs professional attention, but the metal setting holding it does benefit from a periodic check.</p>

<p>Questions about a specific piece? <a href="/contact">Reach out to our team</a> — or browse our <a href="/shop">full collection</a> if you're shopping for something new to add to the routine.</p>
`,
});

POSTS.push({
  slug: "moissanite-price-guide",
  title: "Moissanite Price Guide: How Much Should You Pay?",
  excerpt:
    "Moissanite typically runs $150–$900+ depending on size, clarity, color grade, and setting — a fraction of comparable diamond pricing. Here's exactly what drives the price up or down, and how to spot a bad deal.",
  category: "buying-guide",
  tags: ["moissanite price", "how much does moissanite cost", "moissanite pricing guide"],
  cover_image_url: "https://bstyuyzlhrkskeqpypka.supabase.co/storage/v1/object/public/product-images/cubanchainwhitegold-1782905534182-hh9jgv.avif",
  cover_image_alt: "Miami Cuban link moissanite chain necklace in sterling silver",
  seo_title: "Moissanite Price Guide: How Much Should You Pay? (2026)",
  seo_description:
    "What determines moissanite pricing, typical cost ranges by carat size, and how to avoid overpaying — a practical guide before you buy.",
  read_time_minutes: 7,
  is_featured: false,
  status: "published",
  faq: [
    {
      question: "How much does a 1 carat moissanite cost?",
      answer:
        "A well-cut, VVS clarity, D-color 1-carat moissanite stone typically runs somewhere between $150 and $400 depending on cut precision and the seller, with a complete piece of jewelry (a ring with setting, for example) often landing higher once the metal and craftsmanship are factored in. This is dramatically less than a comparable 1-carat diamond, which commonly starts in the thousands.",
    },
    {
      question: "Why is moissanite so much cheaper than diamond?",
      answer:
        "Mainly because it's lab-created through a well-understood, scalable process, and it isn't subject to the extraction, sorting, and traditional distribution costs baked into mined-diamond pricing. Supply and demand economics are simply different for a lab-grown mineral than for a geologically rare, mined one.",
    },
    {
      question: "Is cheap, uncertified moissanite a good deal?",
      answer:
        "Usually not. Uncertified stones sold well below typical market range are often lower clarity or color grade than advertised, cut poorly (which reduces brilliance regardless of clarity/color), or not genuine moissanite at all. A GRA certificate or equivalent independent grading is the way to confirm you're actually getting what you're paying for.",
    },
    {
      question: "Does the metal setting affect the total price significantly?",
      answer:
        "Yes, often as much as the stone itself. Solid gold settings cost significantly more than solid sterling silver with precious-metal plating, which is why S925 sterling silver with 18K gold, rose gold, or rhodium plating has become a popular middle ground — it delivers the look and durability of precious metal at a fraction of solid gold's price.",
    },
    {
      question: "What's a reasonable budget for a moissanite engagement ring?",
      answer:
        "A complete moissanite engagement ring — center stone plus setting — commonly falls between $300 and $1,500 for a well-graded 1–2 carat stone in a sterling silver setting with precious-metal plating, and higher for larger stones or solid gold settings. That range typically buys meaningfully more visual size and brilliance than the same budget would in diamond.",
    },
  ],
  content: `
<p>Moissanite typically costs between $150 and $900+ per piece depending primarily on stone size, clarity and color grade, cut quality, and the metal setting — with the biggest single factor being carat size. A well-graded, GRA-certified 1-carat moissanite runs roughly $150–$400 for the stone alone; a complete ring or piece of jewelry costs more once the setting and craftsmanship are included. Here's exactly what moves that number up or down.</p>

<h2>What Determines Moissanite Price</h2>
<ul>
  <li><strong>Carat size / stone diameter</strong> — the single biggest price driver. Larger stones cost more, and the increase isn't perfectly linear — price tends to climb faster per carat as stones get larger.</li>
  <li><strong>Clarity grade</strong> — VVS (eye-clean) stones cost more than lower clarity grades, though the price gap here is smaller than color's impact.</li>
  <li><strong>Color grade</strong> — D-color (colorless) commands a premium over lower, more tinted grades, and is generally worth paying for since it's the biggest factor in overall brilliance.</li>
  <li><strong>Cut quality</strong> — a precisely cut stone costs more to produce and delivers meaningfully more brilliance and fire than a poorly cut one of the same clarity and color.</li>
  <li><strong>Metal and setting</strong> — solid gold costs substantially more than sterling silver with precious-metal plating; more elaborate settings (halo, pavé accents) add labor and material cost.</li>
  <li><strong>Certification</strong> — independently graded, certified stones (GRA or equivalent) typically cost more than uncertified stock, because the certification itself is a verified quality guarantee, not just a marketing label.</li>
</ul>

<h2>Typical Price Ranges by Carat Size</h2>
<p>These are general market ranges for well-cut, VVS clarity, D-color moissanite — actual pricing varies by retailer, setting, and metal choice.</p>
<table>
  <thead><tr><th>Carat Size</th><th>Typical Stone Price Range</th></tr></thead>
  <tbody>
    <tr><td>0.5ct</td><td>$80 – $200</td></tr>
    <tr><td>1ct</td><td>$150 – $400</td></tr>
    <tr><td>1.5ct</td><td>$250 – $600</td></tr>
    <tr><td>2ct</td><td>$350 – $900</td></tr>
    <tr><td>3ct</td><td>$600 – $1,500+</td></tr>
  </tbody>
</table>
<p>A complete piece of jewelry — a ring with a setting, a pair of earrings, a chain — costs more than the stone-only figures above once metal, labor, and design are factored in.</p>

<h2>Moissanite Price vs. Diamond Price</h2>
<p>For direct context: a comparable 1-carat diamond of similar clarity and color commonly starts around $3,000–$5,000 and climbs quickly from there depending on grade. That gap — often 10x or more — is the core reason moissanite has become such a popular diamond alternative. For a full breakdown of how the two stones compare beyond price, see our <a href="/blog/moissanite-vs-diamond">moissanite vs. diamond guide</a>.</p>

<h2>Why Prices Vary Between Retailers</h2>
<p>The same "1 carat VVS moissanite" listing can be priced very differently across sellers, usually because of what's actually behind the label:</p>
<ul>
  <li><strong>Grading honesty.</strong> Some listings use "VVS" or "D-color" loosely without independent certification to back it up.</li>
  <li><strong>Metal quality.</strong> Hollow or base-metal settings cost far less to produce than solid sterling silver with genuine precious-metal plating — and won't hold up nearly as well over time.</li>
  <li><strong>Whether certification is included.</strong> A GRA certificate adds verified value; sellers who skip it can price lower, but you lose the ability to confirm what you actually bought.</li>
  <li><strong>Markup and positioning.</strong> Like any product category, pricing reflects brand positioning as much as raw materials cost.</li>
</ul>

<h2>Red Flags: Signs You Might Be Overpaying (or Getting a Bad Deal)</h2>
<ul>
  <li>No independent certification (GRA or equivalent) offered or available on request.</li>
  <li>Vague or missing clarity/color grade information in the listing.</li>
  <li>"Solid gold" claims with no karat specified, or pricing that's implausibly low for genuine solid gold.</li>
  <li>Prices dramatically below the typical ranges above with no explanation — often a sign of lower actual grade than advertised, poor cut quality, or a stone that isn't genuine moissanite at all.</li>
</ul>

<h2>Budget Guidance by Piece Type</h2>
<ul>
  <li><strong>Stud earrings</strong> — generally the most affordable entry point, commonly $60–$300 depending on stone size.</li>
  <li><strong>Tennis bracelets</strong> — priced by total carat weight across many small stones; typically $100–$400 depending on width and length.</li>
  <li><strong>Tennis chains/necklaces</strong> — similarly priced by total stone weight and chain length; ranges widen more with width and length than any single factor.</li>
  <li><strong>Engagement rings</strong> — the widest range, driven mainly by center stone size; see our <a href="/blog/moissanite-engagement-ring-guide">engagement ring guide</a> for a full breakdown.</li>
</ul>

<p>Every piece we sell lists its exact price with no hidden grading surprises — VVS clarity and D-color as standard, GRA certified, solid S925 sterling silver base. <a href="/shop">See current pricing across the full collection</a>.</p>
`,
});

async function run() {
  const { data: author, error: authorErr } = await supabase
    .from("blog_authors")
    .upsert(AUTHOR, { onConflict: "slug" })
    .select()
    .single();
  if (authorErr) throw authorErr;
  console.log("Author ready:", author.name, author.id);

  for (const post of POSTS) {
    const { title } = post;
    const { error } = await supabase
      .from("blog_posts")
      .upsert(
        {
          ...post,
          author_id: author.id,
          published_at: post.status === "published" ? new Date().toISOString() : null,
        },
        { onConflict: "slug" },
      );
    if (error) {
      console.error(`FAILED: ${title}`, error.message);
    } else {
      console.log(`Seeded: ${title}`);
    }
  }
}

run().then(() => {
  console.log("Done.");
});
