const getBaseUrl = () => {
    const API_BASE_URL = import.meta.env.VITE_API_BACKEND_URL;
    let base = API_BASE_URL || "http://localhost:5000";
    base = base.replace(/\/+$/g, "");
    base = base.replace(/\/api$/i, "");
    return base;
};

export default getBaseUrl;