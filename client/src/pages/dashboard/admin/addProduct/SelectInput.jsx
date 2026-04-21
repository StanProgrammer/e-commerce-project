import React from "react";

const SelectInput = ({ name, label, value, onChange, options, error }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>

      <select
        name={name}
        value={value}
        onChange={onChange}
        className={`w-full rounded-lg border px-3 py-2 outline-none transition
        ${error ? "border-red-500" : "border-gray-300"}
        focus:ring-2 focus:ring-blue-500`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default SelectInput;