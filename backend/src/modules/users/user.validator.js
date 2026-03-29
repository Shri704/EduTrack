export const validateUser = (data) => {

  if (!data.firstName || !data.lastName) {
    throw new Error("First name and last name required");
  }

  if (!data.email) {
    throw new Error("Email required");
  }

  if (!data.password) {
    throw new Error("Password required");
  }

};