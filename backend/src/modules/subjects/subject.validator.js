export const validateSubject = (data) => {

  if (!data.name) {
    throw new Error("Subject name required");
  }

  if (!data.code) {
    throw new Error("Subject code required");
  }

  if (!data.courseId) {
    throw new Error("Course ID required");
  }

  if (!data.semester) {
    throw new Error("Semester required");
  }

};