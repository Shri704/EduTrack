import apiClient from "./axios.js";

export const fetchBranches = async () => {
  const { data } = await apiClient.get("/branches");
  return data.data || data;
};

export const createBranch = async (payload) => {
  const { data } = await apiClient.post("/branches", payload);
  return data.data || data;
};

export const updateBranch = async (id, payload) => {
  const { data } = await apiClient.put(`/branches/${id}`, payload);
  return data.data || data;
};

export const deleteBranch = async (id) => {
  const { data } = await apiClient.delete(`/branches/${id}`);
  return data.data || data;
};
