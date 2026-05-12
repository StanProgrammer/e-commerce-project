import React from "react";

const TimeStep = ({
  step,
  orderDetails,
  isCompleted,
  isCurrent,
  isLastStep,
}) => {
  const statusColors = {
    pending: "bg-red-500",
    processing: "bg-blue-500",
    shipped: "bg-indigo-500",
    completed: "bg-green-600",
  };

  const active = isCompleted || isCurrent;

  return (
    <div className="relative flex-1 flex flex-col items-center">
      
      {/* Top Icon */}
      <div
        className={`
          z-10 w-14 h-14 flex items-center justify-center
          rounded-full shadow-lg transition-all duration-300
          ${active ? statusColors[step.status] : "bg-gray-200"}
          ${isCurrent ? "scale-110 ring-4 ring-blue-100" : ""}
        `}
      >
        <i
          className={`ri-${step.icon.iconName} text-xl ${
            active ? "text-white" : "text-gray-500"
          }`}
        />
      </div>

      {/* Connector */}
      {!isLastStep && (
        <div
          className={`absolute top-7 left-1/2 w-full h-1 z-0 ${
            isCompleted ? "bg-green-500" : "bg-gray-300"
          }`}
        />
      )}

      {/* Card */}
      <div
        className={`
          mt-6 w-64 rounded-xl p-5 transition-all duration-300
          ${active ? "bg-white shadow-md" : "bg-gray-50 shadow-sm"}
        `}
      >
        <div className="flex items-center justify-between">
          <h3
            className={`font-semibold text-lg ${
              active ? "text-gray-900" : "text-gray-400"
            }`}
          >
            {step.label}
          </h3>

          {isCurrent && (
            <span className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-600">
              Current
            </span>
          )}

          {isCompleted && !isCurrent && (
            <span className="text-xs px-3 py-1 rounded-full bg-green-100 text-green-600">
              Done
            </span>
          )}
        </div>

        <time className="block mt-1 text-sm text-gray-400">
          {orderDetails.updatedAt
            ? new Date(orderDetails.updatedAt).toLocaleString()
            : ""}
        </time>

        <p
          className={`mt-2 text-sm ${
            active ? "text-gray-700" : "text-gray-400"
          }`}
        >
          {step.description}
        </p>
      </div>
    </div>
  );
};

export default TimeStep;
