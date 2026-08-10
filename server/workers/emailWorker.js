// Processor for the "emails" queue; reuses the Nodemailer helpers in utils/email.js.
const {
  sendOrderConfirmationEmail,
  sendOrderStatusEmail,
  sendPasswordResetEmail,
} = require("../utils/email");

const handlers = {
  "order-confirmation": (job) => sendOrderConfirmationEmail(job.data),
  "order-status": (job) => sendOrderStatusEmail(job.data),
  "password-reset": (job) => sendPasswordResetEmail(job.data),
};

module.exports = async (job) => {
  const handler = handlers[job.name];

  if (!handler) {
    throw new Error(`Unknown email job: ${job.name}`);
  }

  // Throwing lets BullMQ retry with exponential backoff.
  await handler(job);

  return { ok: true };
};
