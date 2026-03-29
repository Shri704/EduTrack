import apiClient from "./axios.js";

export const uploadMarks = async (payload) => {
  const { data } = await apiClient.post("/performance/marks", payload);
  return data.data || data;
};

export const getStudentMarks = async (studentId) => {
  const { data } = await apiClient.get(`/performance/student/${studentId}`);
  return data.data || data;
};

export const getClassPerformance = async (courseId) => {
  // Backed by marks; frontend uses subjectId for class view now
  const { data } = await apiClient.get(`/performance/class/${courseId}`);
  return data.data || data;
};

export const getMyMarks = async () => {
  const { data } = await apiClient.get("/performance/me");
  return data.data || data;
};