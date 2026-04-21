import React from "react";

const TextInput = ({
  name,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  error,
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full rounded-lg border px-3 py-2 outline-none transition
        ${error ? "border-red-500" : "border-gray-300"}
        focus:ring-2 focus:ring-blue-500`}
      />

      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default TextInput;