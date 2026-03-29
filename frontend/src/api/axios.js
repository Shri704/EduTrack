import axios from "axios";

function resolveApiBaseURL() {
  const raw =
    typeof import.meta !== "undefined"
      ? import.meta.env?.VITE_API_URL
      : undefined;
  const trimmed = raw != null ? String(raw).trim() : "";
  if (trimmed) {
    return trimmed.replace(/\/$/, "");
  }
  if (typeof window !== "undefined") {
    return "/api";
  }
  return "http://127.0.0.1:5000/api";
}

const apiClient = axios.create({ baseURL: resolveApiBaseURL() });

apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem("edutrack_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

export default apiClient;