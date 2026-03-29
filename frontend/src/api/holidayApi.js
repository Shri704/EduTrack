import apiClient from "./axios.js";

export const createHoliday = async (payload) => {
  const { data } = await apiClient.post("/holidays", payload);
  return data.data || data;
};

export const listHolidays = async (courseId, semester) => {
  const { data } = await apiClient.get("/holidays", {
    params: { courseId, semester }
  });
  return data.data || data;
};

export const removeHoliday = async (payload) => {
  const { data } = await apiClient.delete("/holidays", { data: payload });
  return data.data || data;
};
