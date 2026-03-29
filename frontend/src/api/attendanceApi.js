import apiClient from "./axios.js";

export const markAttendance = async (payload) => {
  const { data } = await apiClient.post("/attendance/mark", payload);
  return data.data || data;
};

export const getMyAttendance = async () => {
  const { data } = await apiClient.get("/attendance/me");
  return data.data || data;
};

export const getMyAttendanceFiltered = async (params = {}) => {
  const { data } = await apiClient.get("/attendance/me", { params });
  return data.data || data;
};

export const getStudentAttendance = async (studentId) => {
  const { data } = await apiClient.get(`/attendance/student/${studentId}`);
  return data.data || data;
};

export const getClassAttendance = async (subjectId, { date } = {}) => {
  const { data } = await apiClient.get(`/attendance/class/${subjectId}`, {
    params: date ? { date } : undefined
  });
  return data.data || data;
};