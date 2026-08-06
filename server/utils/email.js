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

const getPasswordResetMessage = ({ to, resetUrl, username, from }) => {
  const displayName = username || "there";
  const safeDisplayName = escapeHtml(displayName);
  const safeResetUrl = escapeHtml(resetUrl);

  return {
    from,
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
  };
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
  const message = getPasswordResetMessage({
    to,
    resetUrl,
    username,
    from: `"Willow & Rue" <${user}>`,
  });

  try {
    await sendMailWithTimeout(transporter, message);
  } finally {
    transporter.close();
  }
};

const formatAmount = (amount) => `$${Number(amount || 0).toFixed(2)}`;

const sendOrderConfirmationEmail = async ({ to, orderId, amount }) => {
  const { user } = getEmailConfig();
  const transporter = createTransporter();
  const from = `"Willow & Rue" <${user}>`;
  const safeOrderId = escapeHtml(orderId || "");
  const safeAmount = formatAmount(amount);

  const message = {
    from,
    to,
    subject: `Your Willow & Rue order is confirmed (${orderId})`,
    text: [
      "Hi there,",
      "",
      `Thank you for your order ${orderId}.`,
      `Total charged: ${safeAmount}`,
      "",
      "We are preparing your items and will email you again when they ship.",
      "",
      "Willow & Rue",
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
        <h2 style="margin-bottom: 12px;">Order confirmed</h2>
        <p>Thank you for your order <strong>${safeOrderId}</strong>.</p>
        <p>Total charged: <strong>${safeAmount}</strong></p>
        <p>We are preparing your items and will email you again when they ship.</p>
      </div>
    `,
  };

  try {
    await sendMailWithTimeout(transporter, message);
  } finally {
    transporter.close();
  }
};

const sendOrderStatusEmail = async ({ to, orderId, status }) => {
  const { user } = getEmailConfig();
  const transporter = createTransporter();
  const from = `"Willow & Rue" <${user}>`;
  const safeOrderId = escapeHtml(orderId || "");
  const statusLabel = String(status || "").charAt(0).toUpperCase() + String(status || "").slice(1);

  const message = {
    from,
    to,
    subject: `Order ${statusLabel.toLowerCase()}: ${orderId}`,
    text: [
      `Hi there,`,
      "",
      `Your order ${orderId} is now ${status}.`,
      "",
      "Track the latest status any time from your account dashboard.",
      "",
      "Willow & Rue",
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
        <h2 style="margin-bottom: 12px;">Order ${statusLabel.toLowerCase()}</h2>
        <p>Your order <strong>${safeOrderId}</strong> is now <strong>${statusLabel}</strong>.</p>
        <p>Track the latest status any time from your account dashboard.</p>
      </div>
    `,
  };

  try {
    await sendMailWithTimeout(transporter, message);
  } finally {
    transporter.close();
  }
};

const sendLowStockAlertEmail = async ({ products }) => {
  const { user } = getEmailConfig();
  const transporter = createTransporter();
  const from = `"Willow & Rue" <${user}>`;
  const to = config.jobs?.lowStockAlertTo || user;
  const list = products || [];

  const rows = list
    .map(
      (product) =>
        `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee;">${escapeHtml(product.name)}</td>` +
        `<td style="padding:6px 12px;border-bottom:1px solid #eee;">${escapeHtml(product.category || "-")}</td>` +
        `<td style="padding:6px 12px;border-bottom:1px solid #eee;">${Number(product.stock)}</td></tr>`
    )
    .join("");

  const message = {
    from,
    to,
    subject: `Low stock alert: ${list.length} product(s) need reordering`,
    text: [
      "Hi,",
      "",
      `${list.length} product(s) are at or below the low-stock threshold:`,
      "",
      ...list.map(
        (product) =>
          `- ${product.name} (${product.category || "uncategorized"}): ${Number(product.stock)} left`
      ),
      "",
      "Willow & Rue",
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
        <h2 style="margin-bottom: 12px;">Low stock alert</h2>
        <p>${list.length} product(s) are at or below the low-stock threshold:</p>
        <table style="border-collapse: collapse; width: 100%; max-width: 520px;">
          <thead>
            <tr style="background: #f1f5f9; text-align: left;">
              <th style="padding: 6px 12px;">Product</th>
              <th style="padding: 6px 12px;">Category</th>
              <th style="padding: 6px 12px;">Stock</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `,
  };

  try {
    await sendMailWithTimeout(transporter, message);
  } finally {
    transporter.close();
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendOrderConfirmationEmail,
  sendOrderStatusEmail,
  sendLowStockAlertEmail,
};
