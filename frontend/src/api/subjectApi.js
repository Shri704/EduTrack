import apiClient from "./axios.js";

export const fetchSubjects = async (params = {}) => {
  const { data } = await apiClient.get("/subjects", { params });
  return data.data || data;
};

export const createSubject = async (payload) => {
  const { data } = await apiClient.post("/subjects", payload);
  return data.data || data;
};

export const deleteSubject = async (id) => {
  const { data } = await apiClient.delete(`/subjects/${id}`);
  return data;
};
