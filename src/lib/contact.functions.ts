import { createServerFn } from "@tanstack/react-start";
import { sendContactNotification } from "@/lib/email";
import { checkHoneypot, checkRateLimit } from "@/lib/rate-limit";

export const submitContactMessage = createServerFn({ method: "POST" })
  .inputValidator((d: { name: string; email: string; message: string; _hp?: string }) => d)
  .handler(async ({ data }) => {
    checkHoneypot(data._hp);
    checkRateLimit("contact-form", { windowMs: 10 * 60 * 1000, max: 6 });

    const name = data.name.trim();
    const email = data.email.trim().toLowerCase();
    const message = data.message.trim();

    if (!name || !email || !email.includes("@") || message.length < 5) {
      throw new Error("Please fill in all fields correctly");
    }

    await sendContactNotification({ name, email, message }).catch((e) =>
      console.warn("[Email] Contact notification failed:", e),
    );

    return { success: true };
  });
