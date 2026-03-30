import AdminStudents from "../admin/Students.jsx";

// Reuse admin students grid for teacher view (read-only would be ideal,
// but this keeps the demo UI consistent and functional).

const TeacherStudents = () => {
  return <AdminStudents hidePromote />;
};

export default TeacherStudents;