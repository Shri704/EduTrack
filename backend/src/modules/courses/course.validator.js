export const validateCourse = (data) => {
  if (!data?.name || !String(data.name).trim()) {
    throw new Error("Branch name required");
  }
  if (!data?.code || !String(data.code).trim()) {
    throw new Error("Branch code required");
  }
};