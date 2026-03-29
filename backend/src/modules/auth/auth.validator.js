export const validateRegister = (data) => {
  const name = data.fullName || data.name;
  if (!name || !String(name).trim()) {
    throw new Error("Full name is required");
  }
  if (!data.email || !String(data.email).trim()) {
    throw new Error("Email is required");
  }
  if (!data.password) {
    throw new Error("Password is required");
  }
  if (!data.rollNumber || !String(data.rollNumber).trim()) {
    throw new Error("Roll number is required");
  }
  const sem = data.semester ?? data.sem;
  if (sem === undefined || sem === null || String(sem).trim() === "") {
    throw new Error("Semester is required");
  }
  if (!data.branch || !String(data.branch).trim()) {
    throw new Error("Branch is required");
  }
};

export const validateLogin = (data) => {
  if (!data.email) {
    throw new Error("Email required");
  }

  if (!data.password) {
    throw new Error("Password required");
  }
};