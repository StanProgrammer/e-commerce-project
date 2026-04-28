import React from "react";
import { useGetPolicyQuery } from "../../store/features/policy/policyApi";
import defaultPolicy from "../../data/defaultPolicy";

const categoryLabels = {
  buying: "Buying",
  selling: "Selling",
  general: "General",
};

const PolicyPage = () => {
  const { data, isLoading, isError } = useGetPolicyQuery();
  const policy = data?.policy || defaultPolicy;
  const sections = [...(policy?.sections || [])].sort((a, b) => a.order - b.order);

  if (isLoading) {
    return (
      <section className="section__container max-w-4xl py-16">
        <div className="h-10 w-2/3 bg-gray-100 rounded animate-pulse" />
        <div className="mt-6 h-24 bg-gray-100 rounded animate-pulse" />
        <div className="mt-8 space-y-4">
          <div className="h-32 bg-gray-100 rounded animate-pulse" />
          <div className="h-32 bg-gray-100 rounded animate-pulse" />
        </div>
      </section>
    );
  }

  return (
    <main className="section__container max-w-4xl py-16">
      <header className="border-b border-gray-200 pb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          Willow & Rue Policy
        </p>
        <h1 className="mt-3 font-header text-4xl md:text-5xl font-bold text-text-dark">
          {policy.title}
        </h1>
        <p className="mt-5 text-base md:text-lg leading-8 text-text-light">
          {policy.introduction}
        </p>
        {policy.updatedAt && (
          <p className="mt-4 text-sm text-gray-500">
            Last updated {new Date(policy.updatedAt).toLocaleDateString()}
          </p>
        )}
        {isError && (
          <p className="mt-4 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Showing default policy content while the policy service is unavailable.
          </p>
        )}
      </header>

      <div className="mt-10 space-y-8">
        {sections.map((section) => (
          <section
            key={section._id || `${section.category}-${section.title}`}
            className="border-b border-gray-100 pb-8 last:border-0"
          >
            <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
              {categoryLabels[section.category] || "Policy"}
            </span>
            <h2 className="mt-4 text-2xl font-semibold text-gray-900">{section.title}</h2>
            <div className="mt-4 space-y-4 text-gray-700 leading-8">
              {section.content.split(/\n+/).map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
};

export default PolicyPage;
