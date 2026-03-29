export const validateStudent = (data) => {

  if (!data.name) {
    throw new Error("Student name required");
  }

  if (!data.email) {
    throw new Error("Student email required");
  }

  if (!data.rollNumber) {
    throw new Error("Roll number required");
  }

  if (!data.courseId) {
    throw new Error("Course ID required");
  }

  if (!data.semester) {
    throw new Error("Semester required");
  }

};