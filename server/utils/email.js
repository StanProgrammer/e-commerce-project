const nodemailer = require("nodemailer");
const { config } = require("../config/env");

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const getEmailConfig = () => {
  const user = config.gmailUser?.trim();
  const pass = (config.gmailAppPassword || "").replace(/\s/g, "");

  if (!user || !pass) {
    throw new Error("Gmail email credentials are not configured.");
  }

  return { user, pass };
};

const createTransporter = () => {
  const { user, pass } = getEmailConfig();
  const timeout = config.smtpTimeoutMs;

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass,
    },
    connectionTimeout: timeout,
    greetingTimeout: timeout,
    socketTimeout: timeout,
  });
};

const sendMailWithTimeout = async (transporter, message) => {
  let timeoutId;
  const timeoutMs = config.smtpTimeoutMs;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Password reset email timed out after ${timeoutMs}ms.`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([transporter.sendMail(message), timeoutPromise]);
  } finally {
    clearTimeout(timeoutId);
  }
};

const sendPasswordResetEmail = async ({ to, resetUrl, username }) => {
  const { user } = getEmailConfig();
  const transporter = createTransporter();
  const displayName = username || "there";
  const safeDisplayName = escapeHtml(displayName);
  const safeResetUrl = escapeHtml(resetUrl);

  try {
    await sendMailWithTimeout(transporter, {
      from: `"Willow & Rue" <${user}>`,
      to,
      subject: "Reset your Willow & Rue password",
      text: [
        `Hi ${displayName},`,
        "",
        "We received a request to reset your Willow & Rue password.",
        "Open this secure link to choose a new password:",
        resetUrl,
        "",
        "This link expires in 15 minutes. If you did not request a reset, you can ignore this email.",
        "",
        "Willow & Rue",
      ].join("\n"),
      html: `
        <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
          <h2 style="margin-bottom: 12px;">Reset your password</h2>
          <p>Hi ${safeDisplayName},</p>
          <p>We received a request to reset your Willow &amp; Rue password.</p>
          <p>
            <a href="${safeResetUrl}" style="display: inline-block; padding: 12px 18px; background: #2563eb; color: #ffffff; text-decoration: none; border-radius: 8px;">
              Choose a new password
            </a>
          </p>
          <p>This link expires in 15 minutes. If you did not request a reset, you can ignore this email.</p>
        </div>
      `,
    });
  } finally {
    transporter.close();
  }
};

module.exports = {
  sendPasswordResetEmail,
};
