import apiClient from "./axios.js";

export const fetchTeachers = async () => {
  const { data } = await apiClient.get("/teachers");
  return data.data || data;
};

export const createTeacher = async (payload) => {
  const { data } = await apiClient.post("/teachers", payload);
  return data.data || data;
};

export const deleteTeacher = async (teacherId) => {
  const { data } = await apiClient.delete(`/teachers/${teacherId}`);
  return data.data || data;
};

export const assignSubject = async (teacherId, subjectId) => {
  const { data } = await apiClient.put(
    `/teachers/${teacherId}/assign-subject`,
    { subjectId }
  );
  return data.data || data;
};

export const fetchMyTeacherProfile = async () => {
  const { data } = await apiClient.get("/teachers/me");
  return data.data || data;
};

export const updateMyTeacherProfile = async (payload) => {
  const { data } = await apiClient.put("/teachers/me", payload);
  return data.data || data;
};