export const validateAttendance = (data) => {
  if (!data.studentId) {
    throw new Error("Student ID required");
  }

  if (!data.courseId) {
    throw new Error("Course ID required");
  }

  if (!data.date) {
    throw new Error("Date required");
  }

  if (!data.status) {
    throw new Error("Status required");
  }
};