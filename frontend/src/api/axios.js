import axios from "axios";
import { getApiBaseURL } from "../config/apiBase.js";

const baseURL = getApiBaseURL();

if (
  typeof import.meta !== "undefined" &&
  import.meta.env?.PROD &&
  typeof window !== "undefined" &&
  baseURL === "/api"
) {
  console.warn(
    "[EduTrack] VITE_API_URL is missing. Set it in Vercel → Environment Variables to your Render API URL (e.g. https://your-app.onrender.com/api), then redeploy."
  );
}

const apiClient = axios.create({ baseURL });

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
