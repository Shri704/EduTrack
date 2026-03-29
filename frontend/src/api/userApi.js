import apiClient from "./axios.js";

export const fetchUsers = async () => {
  const { data } = await apiClient.get("/users");
  return Array.isArray(data) ? data : data?.data ?? [];
};

export const createUser = async (payload) => {
  const { data } = await apiClient.post("/users", payload);
  return data;
};

export const deleteUser = async (userId) => {
  const { data } = await apiClient.delete(`/users/${userId}`);
  return data;
};

