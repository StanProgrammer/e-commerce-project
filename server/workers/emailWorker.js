// Processor for the "emails" queue. Reuses the existing Nodemailer helpers in
// utils/email.js so job handling and inline sending behave identically.
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

  // Throwing makes BullMQ retry the job with exponential backoff.
  await handler(job);

  return { ok: true };
};
