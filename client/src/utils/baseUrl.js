const getBaseUrl = () => {
    const API_BASE_URL = import.meta.env.VITE_API_BACKEND_URL || "http://localhost:3000";
    let base = API_BASE_URL;
    base = base.replace(/\/+$/g, "");
    base = base.replace(/\/api$/i, "");
    return base;
};

export default getBaseUrl;
