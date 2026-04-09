import { Resend } from "resend";

const {
  RESEND_API,
  GMAIL_USER,
  OWNER_EMAIL,
  NOTIFICATION_COPY_EMAILS
} = process.env;

const ADMIN_EMAIL = OWNER_EMAIL || GMAIL_USER;
const FROM_EMAIL = "onboarding@resend.dev";

const canSendEmail = () => Boolean(RESEND_API);

let resendClient = null;

const getResendClient = () => {
  if (!resendClient && RESEND_API) {
    resendClient = new Resend(RESEND_API);
  }
  return resendClient;
};

const getCopyEmails = (primaryTo) => {
  const raw = String(NOTIFICATION_COPY_EMAILS || "");
  const list = raw
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
  return list.filter(
    (email) => email.toLowerCase() !== String(primaryTo || "").toLowerCase()
  );
};

const BRAND = {
  name: "Speedway Anointed Ent",
  supportEmail: GMAIL_USER || "support@speedway.example",
  website: process.env.FRONTEND_URL || "http://localhost:5173"
};

function emailLayout({ title, intro, ctaLabel, ctaLink, body, footer }) {
  return `
    <div style="background:#f8fafc;padding:24px 12px;font-family:Arial,sans-serif;color:#0f172a;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
        <div style="padding:20px 24px;background:#0f172a;color:#ffffff;">
          <div style="font-size:14px;letter-spacing:0.2em;text-transform:uppercase;opacity:0.7;">${BRAND.name}</div>
          <h2 style="margin:8px 0 0;font-size:22px;">${title}</h2>
        </div>
        <div style="padding:24px;">
          <p style="margin:0 0 12px;">${intro}</p>
          ${body || ""}
          ${
            ctaLabel && ctaLink
              ? `<a href="${ctaLink}" style="display:inline-block;margin-top:16px;padding:12px 18px;background:#0f172a;color:#ffffff;text-decoration:none;border-radius:12px;font-weight:600;">${ctaLabel}</a>`
              : ""
          }
          <div style="margin-top:20px;font-size:12px;color:#64748b;">
            ${footer || ""}
          </div>
        </div>
        <div style="padding:16px 24px;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;">
          <div>Need help? <a href="mailto:${BRAND.supportEmail}" style="color:#0f172a;text-decoration:none;">${BRAND.supportEmail}</a></div>
          <div style="margin-top:6px;">
            <a href="${BRAND.website}" style="color:#0f172a;text-decoration:none;">Visit website</a>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function sendEmail({ to, subject, html }) {
  try {
    if (!canSendEmail() || !to) {
      console.warn("[email] Cannot send: missing API key or recipient");
      return false;
    }

    const client = getResendClient();
    if (!client) {
      console.error("[email] Resend client not initialized");
      return false;
    }

    const copyEmails = getCopyEmails(to);
    const bcc = copyEmails.length > 0 ? copyEmails : undefined;

    const { data, error } = await client.emails.send({
      from: `Speedway Anointed Ent <${FROM_EMAIL}>`,
      to: [to],
      bcc: bcc,
      subject,
      html
    });

    if (error) {
      console.error("[email] Resend error:", error);
      return false;
    }

    console.log("[email] Sent successfully to:", to, "ID:", data?.id);
    return true;
  } catch (err) {
    console.error("[email] Failed to send email:", err);
    return false;
  }
}

export async function sendWelcomeEmail(to, name) {
  await sendEmail({
    to,
    subject: "Welcome to Speedway Anointed Ent",
    html: emailLayout({
      title: "Welcome onboard",
      intro: `Hi ${name || ""}, thanks for joining ${BRAND.name}.`,
      ctaLabel: "Browse parts",
      ctaLink: `${BRAND.website}/shop`,
      body:
        "<p style='margin:0;'>Your account is ready. Explore genuine parts, check fitment, and place orders with confidence.</p>",
      footer: "You're receiving this email because you created an account."
    })
  });
}

export async function sendLoginAlert(to) {
  await sendEmail({
    to,
    subject: "Login alert",
    html: emailLayout({
      title: "Login alert",
      intro: "We noticed a new sign-in to your account.",
      ctaLabel: "Reset password",
      ctaLink: `${BRAND.website}/forgot-password`,
      body:
        "<p style='margin:0;'>If this wasn't you, reset your password immediately to secure your account.</p>",
      footer: "If you recognize this activity, no further action is needed."
    })
  });
}

export async function sendOrderConfirmation(to, orderId, total) {
  await sendEmail({
    to,
    subject: `Order #${orderId} confirmation`,
    html: `<p>Thank you for your order #${orderId}.</p><p>Total: ${total}</p>`
  });
}

export async function sendAdminOrderNotification(orderId, total) {
  if (!ADMIN_EMAIL) return;
  await sendEmail({
    to: ADMIN_EMAIL,
    subject: `New order received #${orderId}`,
    html: `<p>A new order has been placed.</p><p>Order ID: <strong>#${orderId}</strong></p><p>Total: <strong>${total}</strong></p>`
  });
}

export async function sendOrderStatusEmail(to, orderId, status) {
  await sendEmail({
    to,
    subject: `Order #${orderId} status updated`,
    html: `<p>Your order <strong>#${orderId}</strong> status has been updated to <strong>${status}</strong>.</p>`
  });
}

export async function sendPasswordResetEmail(to, resetLink) {
  await sendEmail({
    to,
    subject: "Password reset",
    html: emailLayout({
      title: "Reset your password",
      intro:
        "We received a request to reset your password. Click the button below to continue.",
      ctaLabel: "Reset password",
      ctaLink: resetLink,
      footer: "If you didn't request this, you can ignore this email."
    })
  });
}

export async function sendEmailConfirmation(to, confirmLink) {
  await sendEmail({
    to,
    subject: "Confirm your email",
    html: emailLayout({
      title: "Confirm your email",
      intro: "Please confirm your email address to activate your account.",
      ctaLabel: "Confirm email",
      ctaLink: confirmLink,
      footer: "This link expires in 24 hours."
    })
  });
}

export async function sendTestEmail(to) {
  const success = await sendEmail({
    to,
    subject: "Speedway Anointed Ent test email",
    html: emailLayout({
      title: "Test email",
      intro: "This is a test email to confirm email service is working.",
      footer: "If you received this, your email configuration is correct."
    })
  });
  
  if (!success) {
    throw new Error("Failed to send test email. Check server logs for details.");
  }
}

export { canSendEmail };
