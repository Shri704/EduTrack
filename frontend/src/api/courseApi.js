import apiClient from "./axios.js";

export const fetchCourses = async () => {
  const { data } = await apiClient.get("/courses");
  return data.data || data;
};

export const createCourse = async (payload) => {
  const { data } = await apiClient.post("/courses", payload);
  return data.data || data;
};

export const updateCourse = async (id, payload) => {
  const { data } = await apiClient.put(`/courses/${id}`, payload);
  return data.data || data;
};

export const deleteCourse = async (id) => {
  const { data } = await apiClient.delete(`/courses/${id}`);
  return data.data || data;
};

