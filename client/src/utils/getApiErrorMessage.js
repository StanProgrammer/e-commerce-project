const getApiErrorMessage = (error, fallback = "Something went wrong. Please try again.") => {
  if (!error) return fallback;

  if (typeof error === "string") return error;

  const validationMessage = error?.data?.details?.[0]?.message;
  const timeoutMessage =
    error?.status === "TIMEOUT_ERROR"
      ? "The server is taking too long to respond. Please try again in a minute."
      : "";
  const apiMessage = error?.data?.message || error?.error || error?.message;

  return validationMessage || timeoutMessage || apiMessage || fallback;
};

export default getApiErrorMessage;
