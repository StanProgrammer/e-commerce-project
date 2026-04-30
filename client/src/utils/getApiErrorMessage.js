const getApiErrorMessage = (error, fallback = "Something went wrong. Please try again.") => {
  if (!error) return fallback;

  if (typeof error === "string") return error;

  const validationMessage = error?.data?.details?.[0]?.message;
  const apiMessage = error?.data?.message || error?.error || error?.message;

  return validationMessage || apiMessage || fallback;
};

export default getApiErrorMessage;
