import React, { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useSendContactMessageMutation } from "../../store/features/contact/contactApi";
import getApiErrorMessage from "../../utils/getApiErrorMessage";

const contactHighlights = [
  {
    icon: "ri-mail-send-line",
    title: "Email Us",
    detail: "support@willowrue.com",
    caption: "Reach out any time for product, order, or account support.",
  },
  {
    icon: "ri-phone-line",
    title: "Call Us",
    detail: "+91 98765 43210",
    caption: "Monday to Saturday, 9:00 AM to 6:00 PM.",
  },
  {
    icon: "ri-map-pin-line",
    title: "Visit Studio",
    detail: "123 Fashion Street, Pune",
    caption: "See curated pieces up close and meet our style team.",
  },
];

const emptyForm = {
  firstName: "",
  lastName: "",
  email: "",
  subject: "",
  message: "",
};

const ContactPage = () => {
  const [form, setForm] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sendContactMessage] = useSendContactMessageMutation();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await sendContactMessage(form).unwrap();

      toast.success("Message sent successfully.");
      setForm(emptyForm);
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Something went wrong while sending the message.")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <section className="section__container bg-primary-light">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-4 flex flex-wrap items-center justify-center gap-2 text-xs font-medium text-text-light sm:text-sm">
            <Link to="/" className="transition hover:text-primary">
              Home
            </Link>
            <i className="ri-arrow-right-s-line"></i>
            <span className="text-text-dark">Contact</span>
          </div>

          <h1 className="section__header text-3xl sm:text-4xl">Contact Willow & Rue</h1>
          <p className="section__subheader max-w-2xl">
            Questions about an order, styling help, or product details? We are here to make the shopping experience
            smooth and personal.
          </p>
        </div>
      </section>

      <section className="section__container pt-8 sm:pt-10">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.07)] sm:rounded-4xl sm:p-8">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary">Get In Touch</p>
            <h2 className="mb-3 text-3xl text-text-dark" style={{ fontFamily: "var(--font-header)" }}>
              We would love to hear from you
            </h2>
            <p className="mb-8 text-sm leading-7 text-text-light sm:text-base">
              Whether you need help choosing the right piece or support with an existing order, our team is ready to
              help with quick and thoughtful guidance.
            </p>

            <div className="space-y-4">
              {contactHighlights.map((item) => (
                <div
                  key={item.title}
                  className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-light text-xl text-primary">
                    <i className={item.icon}></i>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-text-dark">{item.title}</h3>
                    <p className="mt-1 font-medium text-primary">{item.detail}</p>
                    <p className="mt-1 text-sm leading-6 text-text-light">{item.caption}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.07)] sm:rounded-4xl sm:p-8">
            <div className="mb-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary">Send Message</p>
              <h2 className="text-2xl font-semibold text-text-dark sm:text-3xl">Start the conversation</h2>
              <p className="mt-2 text-sm leading-7 text-text-light sm:text-base">
                Share a few details below and we will get back to you as soon as possible.
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-text-dark">First Name</span>
                  <input
                    type="text"
                    name="firstName"
                    placeholder="Aarav"
                    value={form.firstName}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-primary"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-text-dark">Last Name</span>
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Sharma"
                    value={form.lastName}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-primary"
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-text-dark">Email Address</span>
                <input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-primary"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-text-dark">Subject</span>
                <input
                  type="text"
                  name="subject"
                  placeholder="Need help with my order"
                  value={form.subject}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-primary"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-text-dark">Message</span>
                <textarea
                  rows="6"
                  name="message"
                  placeholder="Tell us how we can help..."
                  value={form.message}
                  onChange={handleChange}
                  required
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-primary"
                ></textarea>
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn inline-flex w-full items-center justify-center gap-2 rounded-xl disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
              >
                <i className={isSubmitting ? "ri-loader-4-line animate-spin" : "ri-send-plane-line"}></i>
                {isSubmitting ? "Sending..." : "Send Message"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </>
  );
};

export default ContactPage;
