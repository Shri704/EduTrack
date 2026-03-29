import apiClient from "./axios.js";

/** Normalizes API `{ success, data: [...] }` to a plain array. */
function unwrapBranchList(body) {
  if (Array.isArray(body)) return body;
  if (body && Array.isArray(body.data)) return body.data;
  return [];
}

export const fetchBranches = async () => {
  const { data } = await apiClient.get("/branches");
  return unwrapBranchList(data);
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
