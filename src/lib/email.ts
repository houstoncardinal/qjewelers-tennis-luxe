import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM   = process.env.RESEND_FROM_EMAIL ?? "orders@qureshijewelers.com";
const SITE   = (process.env.VITE_SITE_URL ?? "https://qureshijewelers.com").replace(/\/$/, "");

// ─── Shared styles ────────────────────────────────────────────────────────────

const BASE_STYLE = `
  body { margin:0; padding:0; background:#faf9f7; font-family:'Georgia',serif; -webkit-font-smoothing:antialiased; }
  a { color:inherit; }
`;

const GOLD = "#C9A84C";

function wrap(inner: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <style>${BASE_STYLE}</style>
</head>
<body>
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#faf9f7;">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">
        <!-- Header -->
        <tr>
          <td align="center" style="padding:32px 0 24px;border-bottom:1px solid #e8e3dc;">
            <a href="${SITE}" style="text-decoration:none;">
              <img src="${SITE}/QURESHIJEWELERSLOGO.png" alt="Qureshi Jewelers" width="160" height="auto" style="display:block;max-width:160px;" />
            </a>
          </td>
        </tr>
        <!-- Gold line -->
        <tr><td style="height:2px;background:linear-gradient(90deg,transparent,${GOLD},transparent);"></td></tr>
        <!-- Body -->
        <tr>
          <td style="background:#ffffff;padding:40px 48px 48px;">
            ${inner}
          </td>
        </tr>
        <!-- Gold line -->
        <tr><td style="height:1px;background:#e8e3dc;"></td></tr>
        <!-- Footer -->
        <tr>
          <td style="padding:28px 48px;background:#faf9f7;text-align:center;">
            <p style="margin:0 0 12px;font-size:11px;color:#9b9490;letter-spacing:0.18em;text-transform:uppercase;">
              S925 Sterling Silver · VVS Moissanite · GRA Certified
            </p>
            <p style="margin:0;font-size:11px;color:#c4bfb8;">
              <a href="${SITE}/faq" style="color:#9b9490;text-decoration:underline;">FAQ</a> &nbsp;·&nbsp;
              <a href="${SITE}/track-order" style="color:#9b9490;text-decoration:underline;">Track Order</a> &nbsp;·&nbsp;
              <a href="${SITE}/contact" style="color:#9b9490;text-decoration:underline;">Contact Us</a>
            </p>
            <p style="margin:12px 0 0;font-size:10px;color:#c4bfb8;">
              © ${new Date().getFullYear()} Qureshi Jewelers. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function h1(text: string): string {
  return `<h1 style="margin:0 0 8px;font-family:'Georgia',serif;font-size:28px;font-weight:normal;color:#1a1814;letter-spacing:-0.02em;">${text}</h1>`;
}

function eyebrow(text: string): string {
  return `<p style="margin:0 0 16px;font-size:10px;color:${GOLD};letter-spacing:0.32em;text-transform:uppercase;">${text}</p>`;
}

function p(text: string, style = ""): string {
  return `<p style="margin:0 0 16px;font-size:14px;color:#5a5550;line-height:1.75;${style}">${text}</p>`;
}

function divider(): string {
  return `<div style="height:1px;background:#e8e3dc;margin:24px 0;"></div>`;
}

function cta(label: string, href: string): string {
  return `<a href="${href}" style="display:inline-block;margin:8px 0 0;padding:14px 36px;background:#1a1814;color:#ffffff;text-decoration:none;font-size:11px;letter-spacing:0.24em;text-transform:uppercase;">${label}</a>`;
}

function row(label: string, value: string): string {
  return `<tr>
    <td style="padding:8px 0;font-size:11px;color:#9b9490;letter-spacing:0.14em;text-transform:uppercase;width:45%;vertical-align:top;">${label}</td>
    <td style="padding:8px 0;font-size:13px;color:#1a1814;text-align:right;vertical-align:top;">${value}</td>
  </tr>`;
}

function itemRow(name: string, config: string, price: string): string {
  return `<tr>
    <td style="padding:10px 0;border-bottom:1px solid #f0ece6;vertical-align:top;">
      <div style="font-size:13px;color:#1a1814;font-weight:600;">${name}</div>
      <div style="font-size:11px;color:#9b9490;margin-top:3px;">${config}</div>
    </td>
    <td style="padding:10px 0;border-bottom:1px solid #f0ece6;text-align:right;font-size:13px;color:#1a1814;font-weight:600;vertical-align:top;white-space:nowrap;">${price}</td>
  </tr>`;
}

function fmt(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents);
}

// ─── 1. Order Confirmation ────────────────────────────────────────────────────

export interface OrderEmailData {
  orderNumber:       string;
  customerName:      string;
  customerEmail:     string;
  items:             Array<{ name: string; color: string; size: string; length: string; unitPrice: number; quantity: number }>;
  subtotal:          number;
  discount:          number;
  promoCode:         string | null;
  shipping:          number;
  tax:               number;
  total:             number;
  shippingMethod:    string;
  shippingAddress:   string;
}

export async function sendOrderConfirmation(data: OrderEmailData): Promise<void> {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.startsWith("re_your")) {
    console.warn("[Email] RESEND_API_KEY not configured — skipping order confirmation");
    return;
  }

  const deliveryMap: Record<string, string> = {
    standard:  "5–7 business days",
    express:   "2–3 business days",
    overnight: "Next business day",
  };

  const itemsHtml = data.items.map(it => {
    const config = [it.size, it.length, it.color.replace("_", " ")].filter(Boolean).join(" · ");
    const price  = fmt(it.unitPrice * it.quantity);
    return itemRow(it.name.split("—")[0].trim(), config + (it.quantity > 1 ? ` · Qty ${it.quantity}` : ""), price);
  }).join("");

  const html = wrap(`
    ${eyebrow("Order Confirmed")}
    ${h1(`Thank you, ${data.customerName.split(" ")[0]}.`)}
    ${p(`Your order <strong style="color:#1a1814;">${data.orderNumber}</strong> has been received and is now being processed.`)}

    ${divider()}

    <h2 style="margin:0 0 16px;font-size:13px;letter-spacing:0.18em;text-transform:uppercase;color:#9b9490;font-weight:normal;">Your Order</h2>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #f0ece6;">
      ${itemsHtml}
    </table>

    ${divider()}

    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      ${data.discount > 0 ? row("Subtotal", fmt(data.subtotal)) : ""}
      ${data.discount > 0 ? row(`Discount${data.promoCode ? ` (${data.promoCode})` : ""}`, `−${fmt(data.discount)}`) : ""}
      ${row("Shipping", data.shipping === 0 ? "Free" : fmt(data.shipping))}
      ${data.tax > 0 ? row("Tax", fmt(data.tax)) : ""}
      <tr>
        <td style="padding:14px 0 0;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#1a1814;font-weight:600;border-top:1px solid #e8e3dc;">Total</td>
        <td style="padding:14px 0 0;text-align:right;font-size:18px;color:#1a1814;font-family:'Georgia',serif;border-top:1px solid #e8e3dc;">${fmt(data.total)}</td>
      </tr>
    </table>

    ${divider()}

    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td width="50%" style="vertical-align:top;padding-right:16px;">
          <h3 style="margin:0 0 8px;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#9b9490;font-weight:normal;">Ships To</h3>
          <p style="margin:0;font-size:13px;color:#1a1814;line-height:1.65;">${data.shippingAddress}</p>
        </td>
        <td width="50%" style="vertical-align:top;padding-left:16px;">
          <h3 style="margin:0 0 8px;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#9b9490;font-weight:normal;">Delivery</h3>
          <p style="margin:0;font-size:13px;color:#1a1814;line-height:1.65;">${deliveryMap[data.shippingMethod] ?? "5–7 business days"}</p>
        </td>
      </tr>
    </table>

    ${divider()}

    <div style="text-align:center;padding:8px 0 0;">
      ${cta("Track Your Order", `${SITE}/track-order`)}
      <p style="margin:16px 0 0;font-size:11px;color:#9b9490;">
        Questions? Reply to this email or visit <a href="${SITE}/contact" style="color:#C9A84C;">${SITE.replace("https://", "")}/contact</a>
      </p>
    </div>
  `);

  await resend.emails.send({
    from:    FROM,
    to:      data.customerEmail,
    subject: `Order Confirmed — ${data.orderNumber} | Qureshi Jewelers`,
    html,
  });
}

// ─── 2. Shipping Notification ─────────────────────────────────────────────────

export interface ShippingEmailData {
  orderNumber:     string;
  customerName:    string;
  customerEmail:   string;
  trackingNumber:  string | null;
  trackingCarrier: string | null;
  shippingAddress: string;
}

function getCarrierUrl(carrier: string | null, tracking: string | null): string | null {
  if (!tracking) return null;
  const t = encodeURIComponent(tracking);
  switch ((carrier ?? "").toUpperCase()) {
    case "USPS":   return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${t}`;
    case "UPS":    return `https://www.ups.com/track?tracknum=${t}`;
    case "FEDEX":  return `https://www.fedex.com/fedextrack/?trknbr=${t}`;
    case "DHL":    return `https://www.dhl.com/us-en/home/tracking/tracking-parcel.html?submit=1&tracking-id=${t}`;
    default:       return null;
  }
}

export async function sendShippingNotification(data: ShippingEmailData): Promise<void> {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.startsWith("re_your")) {
    console.warn("[Email] RESEND_API_KEY not configured — skipping shipping notification");
    return;
  }

  const trackingUrl = getCarrierUrl(data.trackingCarrier, data.trackingNumber);

  const html = wrap(`
    ${eyebrow("Your Order Has Shipped")}
    ${h1(`It's on the way, ${data.customerName.split(" ")[0]}.`)}
    ${p("Your Qureshi Jewelers order is now in transit. Expect brilliance to arrive soon.")}

    ${divider()}

    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      ${row("Order Number", data.orderNumber)}
      ${data.trackingCarrier ? row("Carrier", data.trackingCarrier) : ""}
      ${data.trackingNumber  ? row("Tracking #", `<strong style="color:#1a1814;font-family:monospace;">${data.trackingNumber}</strong>`) : ""}
      ${row("Ships To", data.shippingAddress)}
    </table>

    ${divider()}

    <div style="text-align:center;padding:8px 0 0;">
      ${trackingUrl
        ? cta("Track Shipment", trackingUrl)
        : cta("Track Your Order", `${SITE}/track-order`)
      }
      <p style="margin:20px 0 0;font-size:13px;color:#5a5550;line-height:1.75;">
        Your GRA certificate and care card are included with your package.<br/>
        Wear it with confidence.
      </p>
    </div>
  `);

  await resend.emails.send({
    from:    FROM,
    to:      data.customerEmail,
    subject: `Your Order Has Shipped — ${data.orderNumber} | Qureshi Jewelers`,
    html,
  });
}

// ─── 3. Return Confirmation ───────────────────────────────────────────────────

export interface ReturnEmailData {
  orderNumber:   string;
  customerName:  string;
  customerEmail: string;
  reason:        string;
}

export async function sendReturnConfirmation(data: ReturnEmailData): Promise<void> {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.startsWith("re_your")) {
    console.warn("[Email] RESEND_API_KEY not configured — skipping return confirmation");
    return;
  }

  const html = wrap(`
    ${eyebrow("Return Request Received")}
    ${h1(`We've got it, ${data.customerName.split(" ")[0]}.`)}
    ${p(`Your return request for order <strong style="color:#1a1814;">${data.orderNumber}</strong> has been received and is being reviewed by our team.`)}

    ${divider()}

    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      ${row("Order Number", data.orderNumber)}
      ${row("Reason", data.reason.length > 80 ? data.reason.substring(0, 80) + "…" : data.reason)}
      ${row("Status", "Under Review")}
      ${row("Response Time", "Within 1–2 business days")}
    </table>

    ${divider()}

    ${p("Our team will reach out to this email with next steps including a prepaid return label if your request is approved.")}
    ${p(`Please do not ship your item until you receive our confirmation — returns sent without authorization cannot be tracked or processed.`)}

    <div style="text-align:center;padding:8px 0 0;">
      ${cta("Contact Us", `${SITE}/contact`)}
    </div>
  `);

  await resend.emails.send({
    from:    FROM,
    to:      data.customerEmail,
    subject: `Return Request Received — ${data.orderNumber} | Qureshi Jewelers`,
    html,
  });
}

// ─── 4. Review Request (sent after delivery) ─────────────────────────────────

export interface ReviewRequestEmailData {
  orderNumber:  string;
  customerName: string;
  customerEmail: string;
  productSlug:  string;
  productName:  string;
}

export async function sendReviewRequest(data: ReviewRequestEmailData): Promise<void> {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.startsWith("re_your")) return;

  const html = wrap(`
    ${eyebrow("How Are You Enjoying It?")}
    ${h1(`A quick note, ${data.customerName.split(" ")[0]}.`)}
    ${p(`We hope you're loving your <strong style="color:#1a1814;">${data.productName.split("—")[0].trim()}</strong>. Your experience matters to us — and to future customers who rely on honest reviews to make their choice.`)}
    ${p("If you have a moment, we'd love to hear what you think.")}

    <div style="text-align:center;padding:8px 0 0;">
      ${cta("Leave a Review", `${SITE}/product/${data.productSlug}?review=1`)}
      <p style="margin:16px 0 0;font-size:11px;color:#9b9490;">
        You can also <a href="${SITE}/track-order" style="color:#C9A84C;">track your order</a> or <a href="${SITE}/contact" style="color:#C9A84C;">contact support</a>.
      </p>
    </div>
  `);

  await resend.emails.send({
    from:    FROM,
    to:      data.customerEmail,
    subject: `How's your ${data.productName.split("—")[0].trim()}? | Qureshi Jewelers`,
    html,
  });
}
