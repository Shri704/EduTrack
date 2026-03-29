import { getApiBaseURL } from "../config/apiBase.js";

export const API_BASE_URL = getApiBaseURL();

export const ROLES = {
  ADMIN: "admin",
  TEACHER: "teacher",
  STUDENT: "student"
};

export const ATTENDANCE_THRESHOLD = 75;

export const PASSING_SCORE = 40;