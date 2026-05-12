const getBaseUrl = () => {
  const configuredBaseUrl = import.meta.env.VITE_API_BACKEND_URL;
  const fallbackBaseUrl = import.meta.env.DEV
    ? "http://localhost:5000"
    : window.location.origin;

  const base = (configuredBaseUrl || fallbackBaseUrl)
    .trim()
    .replace(/\/+$/g, "")
    .replace(/\/api$/i, "");

  if (!configuredBaseUrl && import.meta.env.PROD) {
    console.warn(
      "VITE_API_BACKEND_URL is not set. Falling back to the current origin for API requests."
    );
  }

  return base;
};

export default getBaseUrl;
