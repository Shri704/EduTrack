import apiClient from "./axios.js";

export const createHoliday = async (payload) => {
  const { data } = await apiClient.post("/holidays", payload);
  return data.data || data;
};

export const listHolidays = async (courseId, semester, subjectId = null) => {
  const params = { courseId, semester };
  if (subjectId) params.subjectId = subjectId;
  const { data } = await apiClient.get("/holidays", { params });
  return data.data || data;
};

export const removeHoliday = async (payload) => {
  const { data } = await apiClient.delete("/holidays", { data: payload });
  return data.data || data;
};
