import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  useGetPolicyQuery,
  useUpdatePolicyMutation,
} from "../../../../store/features/policy/policyApi";
import defaultPolicy from "../../../../data/defaultPolicy";
import getApiErrorMessage from "../../../../utils/getApiErrorMessage";

const emptySection = {
  category: "general",
  title: "",
  content: "",
  order: 0,
};

const ManagePolicy = () => {
  const { data, isLoading, isError } = useGetPolicyQuery();
  const [updatePolicy, { isLoading: isSaving }] = useUpdatePolicyMutation();
  const [policy, setPolicy] = useState({
    title: "",
    introduction: "",
    sections: [],
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const currentPolicy = data?.policy || (isError ? defaultPolicy : null);

    if (currentPolicy) {
      setPolicy({
        title: currentPolicy.title || "",
        introduction: currentPolicy.introduction || "",
        sections: [...(currentPolicy.sections || [])]
          .sort((a, b) => a.order - b.order)
          .map((section, index) => ({
            _id: section._id,
            category: section.category || "general",
            title: section.title || "",
            content: section.content || "",
            order: section.order || index + 1,
          })),
      });
    }
  }, [data, isError]);

  const updateField = (event) => {
    const { name, value } = event.target;
    setPolicy((prev) => ({ ...prev, [name]: value }));
  };

  const updateSection = (index, field, value) => {
    setPolicy((prev) => ({
      ...prev,
      sections: prev.sections.map((section, sectionIndex) =>
        sectionIndex === index ? { ...section, [field]: value } : section
      ),
    }));
  };

  const addSection = () => {
    setPolicy((prev) => ({
      ...prev,
      sections: [...prev.sections, { ...emptySection, order: prev.sections.length + 1 }],
    }));
  };

  const removeSection = (index) => {
    setPolicy((prev) => ({
      ...prev,
      sections: prev.sections
        .filter((_, sectionIndex) => sectionIndex !== index)
        .map((section, sectionIndex) => ({ ...section, order: sectionIndex + 1 })),
    }));
  };

  const validate = () => {
    const nextErrors = {};

    if (policy.title.trim().length < 3) nextErrors.title = "Title is required";
    if (policy.introduction.trim().length < 20) {
      nextErrors.introduction = "Introduction needs at least 20 characters";
    }
    if (!policy.sections.length) nextErrors.sections = "Add at least one policy section";

    policy.sections.forEach((section, index) => {
      if (section.title.trim().length < 3) {
        nextErrors[`section-title-${index}`] = "Section title is required";
      }
      if (section.content.trim().length < 20) {
        nextErrors[`section-content-${index}`] = "Section content needs at least 20 characters";
      }
    });

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    try {
      await updatePolicy({
        title: policy.title,
        introduction: policy.introduction,
        sections: policy.sections.map((section, index) => ({
          _id: section._id,
          category: section.category,
          title: section.title,
          content: section.content,
          order: index + 1,
        })),
      }).unwrap();
      toast.success("Policy updated. The public policy page now uses your latest content.");
    } catch (error) {
      console.error(error);
      toast.error(getApiErrorMessage(error, "Policy could not be updated. Check the form and try again."));
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-60 text-gray-500">Loading policy...</div>;
  }

  return (
    <section className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 border-b pb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Terms & Conditions</h2>
            <p className="mt-1 text-sm text-gray-500">
              Edit buying, selling, and general policies without redeploying the app.
            </p>
          </div>
          <a
            href="/policy"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-blue-50 text-blue-700 text-sm font-medium hover:bg-blue-100"
          >
            Preview
          </a>
        </div>
        {isError && (
          <div className="mt-6 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-800">
            The policy API is unavailable, so this form is showing default content. Saving will work once the backend is connected.
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Page Title</label>
            <input
              name="title"
              value={policy.title}
              onChange={updateField}
              className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
            />
            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Introduction</label>
            <textarea
              name="introduction"
              value={policy.introduction}
              onChange={updateField}
              rows="4"
              className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
            />
            {errors.introduction && (
              <p className="text-red-500 text-sm mt-1">{errors.introduction}</p>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h3 className="text-lg font-semibold text-gray-900">Policy Sections</h3>
              <button
                type="button"
                onClick={addSection}
                className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-gray-900 text-white text-sm font-medium hover:bg-gray-800"
              >
                Add Section
              </button>
            </div>
            {errors.sections && <p className="text-red-500 text-sm">{errors.sections}</p>}

            {policy.sections.map((section, index) => (
              <div key={section._id || index} className="rounded-xl border border-gray-200 p-4 space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="md:w-48">
                    <label className="block mb-1 text-sm font-medium text-gray-700">Category</label>
                    <select
                      value={section.category}
                      onChange={(event) => updateSection(index, "category", event.target.value)}
                      className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="buying">Buying</option>
                      <option value="selling">Selling</option>
                      <option value="general">General</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block mb-1 text-sm font-medium text-gray-700">Section Title</label>
                    <input
                      value={section.title}
                      onChange={(event) => updateSection(index, "title", event.target.value)}
                      className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    {errors[`section-title-${index}`] && (
                      <p className="text-red-500 text-sm mt-1">{errors[`section-title-${index}`]}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">Content</label>
                  <textarea
                    value={section.content}
                    onChange={(event) => updateSection(index, "content", event.target.value)}
                    rows="6"
                    className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  {errors[`section-content-${index}`] && (
                    <p className="text-red-500 text-sm mt-1">{errors[`section-content-${index}`]}</p>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeSection(index)}
                    disabled={policy.sections.length === 1}
                    className="px-3 py-1.5 rounded-md bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-3 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 transition disabled:opacity-60"
          >
            {isSaving ? "Saving..." : "Save Policy"}
          </button>
        </form>
      </div>
    </section>
  );
};

export default ManagePolicy;
