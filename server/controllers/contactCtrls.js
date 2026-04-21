const asyncHandler = require("../middlewares/asyncHandler");

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const sendContactMessage = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, subject, message } = req.body;
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL || "atibkhan392@outlook.com";
  const from = process.env.CONTACT_FROM_EMAIL || "onboarding@resend.dev";
  const name = `${firstName} ${lastName}`.trim();

  if (!apiKey) {
    return res.status(500).json({
      message: "Email service is not configured yet.",
    });
  }

  const html = `
    <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
      <h2 style="margin-bottom: 16px;">New contact form submission</h2>
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
      <div style="margin-top: 20px; padding: 16px; background: #f8fafc; border-radius: 12px;">
        <p style="margin: 0 0 8px;"><strong>Message</strong></p>
        <p style="margin: 0; white-space: pre-wrap;">${escapeHtml(message)}</p>
      </div>
    </div>
  `;

  const text = [
    "New contact form submission",
    `Name: ${name}`,
    `Email: ${email}`,
    `Subject: ${subject}`,
    "",
    "Message:",
    message,
  ].join("\n");

  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: email,
      subject: `Contact Form: ${subject}`,
      html,
      text,
    }),
  });

  const result = await resendResponse.json();

  if (!resendResponse.ok) {
    return res.status(resendResponse.status).json({
      message: result?.message || "Failed to send your message.",
      details: result,
    });
  }

  return res.status(200).json({
    message: "Message sent successfully.",
    id: result?.id,
  });
});

module.exports = {
  sendContactMessage,
};
