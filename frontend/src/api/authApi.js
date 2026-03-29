import apiClient from "./axios.js";

// All auth endpoints use the common responseFormatter:
// { success, message, data }
// These helpers return only the .data part to the UI.

export const login = async (email, password) => {
  const { data } = await apiClient.post("/auth/login", {
    email,
    password
  });

  return data.data; // { token, user }
};

export const register = async (payload) => {
  const { data } = await apiClient.post("/auth/register", payload);

  return data.data; // e.g. { email, message? }
};

export const verifyOtp = async (payload) => {
  const body = typeof payload === "object" && payload !== null
    ? payload
    : { email: payload, otp: arguments[1] };
  const { data } = await apiClient.post("/auth/verify-otp", body);
  return data.data; // { token, user }
};

export const forgotPassword = async (email) => {
  const { data } = await apiClient.post("/auth/forgot-password", { email });
  return data.data || data;
};

export const resetPassword = async (payload) => {
  const { data } = await apiClient.post("/auth/reset-password", payload);
  return data.data || data;
};