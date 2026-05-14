import { getEmailFormatError } from "../../utils/emailFormat.js";

export const validateUser = (data) => {
  const firstName = String(data.firstName ?? "").trim();
  const lastName = String(data.lastName ?? "").trim();
  const email = String(data.email ?? "").trim();
  const password = String(data.password ?? "").trim();

  if (!firstName || !lastName) {
    throw new Error("First name and last name are required.");
  }

  if (!email) {
    throw new Error("Email is required.");
  }

  const emailErr = getEmailFormatError(email);
  if (emailErr) {
    throw new Error(emailErr);
  }

  if (!password) {
    throw new Error("Password is required.");
  }
};