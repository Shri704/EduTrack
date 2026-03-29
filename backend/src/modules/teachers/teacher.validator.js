export const validateTeacher = (data) => {

  if (!data.name) {
    throw new Error("Teacher name required");
  }

  if (!data.email) {
    throw new Error("Teacher email required");
  }

  if (!data.department) {
    throw new Error("Department required");
  }

};