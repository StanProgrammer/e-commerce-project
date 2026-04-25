import React from "react";
import { Link } from "react-router-dom";
import insta1 from "../../assets/instagram-1.jpg";
import insta2 from "../../assets/profile.png";
import insta3 from "../../assets/instagram-3.jpg";
import insta4 from "../../assets/instagram-4.jpg";

const teamMembers = [
  {
    name: "Mira Kapoor",
    role: "Creative Director",
    image: insta1,
  },
  {
    name: "Atib Khan",
    role: "Product Development Lead",
    image: insta2,
  },
  {
    name: "Naina Shah",
    role: "UI/UX Designer",
    image: insta3,
  },
  {
    name: "Aisha Khan",
    role: "Customer Experience",
    image: insta4,
  },
];

const Team = () => {
  return (
    <>
      <section className="section__container bg-primary-light">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-4 flex flex-wrap items-center justify-center gap-2 text-xs font-medium text-text-light sm:text-sm">
            <Link to="/" className="transition hover:text-primary">
              Home
            </Link>
            <i className="ri-arrow-right-s-line"></i>
            <span className="text-text-dark">About Us</span>
          </div>

          <h1 className="section__header text-3xl sm:text-4xl">Meet Willow Rue</h1>
          <p className="section__subheader max-w-2xl">
            We are a close-knit fashion team bringing thoughtful edits, everyday polish, and friendly style guidance to
            every customer.
          </p>
        </div>
      </section>

      <section className="section__container pt-8 sm:pt-10">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary">Our Story</p>
            <h2 className="mb-4 text-3xl text-text-dark sm:text-4xl" style={{ fontFamily: "var(--font-header)" }}>
              Style chosen with care
            </h2>
            <p className="mb-5 text-sm leading-7 text-text-light sm:text-base">
              Willow Rue was built for shoppers who want fashion that feels current without feeling complicated. Our
              team studies fit, fabric, color, and seasonality so every collection feels easy to browse and simple to
              wear.
            </p>
            <p className="text-sm leading-7 text-text-light sm:text-base">
              From product selection to order support, we keep the experience warm, practical, and detail-led.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {teamMembers.map((member) => (
              <article
                key={member.name}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_16px_45px_rgba(15,23,42,0.08)]"
              >
                <img src={member.image} alt={member.name} className="h-64 w-full object-cover" />
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-text-dark">{member.name}</h3>
                  <p className="mt-1 text-sm font-medium text-primary">{member.role}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default Team;
