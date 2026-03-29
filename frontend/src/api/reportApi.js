import apiClient from "./axios.js";

export const getStudentReport = async (studentId) => {
  const { data } = await apiClient.get(`/reports/student/${studentId}`);
  return data.data || data;
};

export const getMyStudentReport = async () => {
  const { data } = await apiClient.get("/reports/student/me");
  return data.data || data;
};

export const getClassReport = async (courseId) => {
  const { data } = await apiClient.get(`/reports/class/${courseId}`);
  return data.data || data;
};

export const getAttendanceReport = async (params) => {
  const { data } = await apiClient.get("/reports/attendance", { params });
  return data.data || data;
};

export const getAttendanceReportTeacher = async (params) => {
  const { data } = await apiClient.get("/reports/attendance/teacher", { params });
  return data.data || data;
};
