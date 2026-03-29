import apiClient from "./axios.js";

export const fetchStudents = async (params) => {
  const { data } = await apiClient.get("/students", {
    params: params || undefined
  });
  return data.data || data;
};

export const fetchMyProfile = async () => {
  const { data } = await apiClient.get("/students/me");
  return data.data || data;
};

export const updateMyProfile = async (payload) => {
  const { data } = await apiClient.put("/students/me", payload);
  return data.data || data;
};

export const updateMyPassword = async (payload) => {
  const { data } = await apiClient.put("/students/me/password", payload);
  return data.data || data;
};

export const createStudent = async (payload) => {
  const { data } = await apiClient.post("/students", payload);
  return data.data || data;
};

export const updateStudent = async (id, payload) => {
  const { data } = await apiClient.put(`/students/${id}`, payload);
  return data.data || data;
};

export const deleteStudent = async (id) => {
  const { data } = await apiClient.delete(`/students/${id}`);
  return data.data || data;
};

/** Promote a cohort (branch + semester) to the next semester; optional roll numbers to exclude. */
export const promoteStudents = async (payload) => {
  const { data } = await apiClient.post("/students/promote", payload);
  return data.data || data;
};