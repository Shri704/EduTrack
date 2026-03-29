import { Routes, Route } from "react-router-dom";

import Home from "../pages/Home.jsx";

import Login from "../pages/auth/Login.jsx";
import Register from "../pages/auth/Register.jsx";
import VerifyOtp from "../pages/auth/VerifyOtp.jsx";
import ForgotPassword from "../pages/auth/ForgotPassword.jsx";

import AdminDashboard from "../pages/admin/Dashboard.jsx";
import AdminStudents from "../pages/admin/Students.jsx";
import AdminTeachers from "../pages/admin/Teachers.jsx";
import AdminBranches from "../pages/admin/Branches.jsx";
import AdminSubjects from "../pages/admin/Subjects.jsx";
import AdminReports from "../pages/admin/Reports.jsx";
import AdminManageUsers from "../pages/admin/ManageUsers.jsx";

import TeacherDashboard from "../pages/teacher/Dashboard.jsx";
import TeacherAttendance from "../pages/teacher/Attendance.jsx";
import TeacherUploadMarks from "../pages/teacher/UploadMarks.jsx";
import TeacherStudents from "../pages/teacher/Students.jsx";
import TeacherProfile from "../pages/teacher/Profile.jsx";
import TeacherHolidays from "../pages/teacher/Holidays.jsx";

import StudentDashboard from "../pages/student/Dashboard.jsx";
import StudentAttendance from "../pages/student/Attendance.jsx";
import StudentMarks from "../pages/student/Marks.jsx";
import StudentReports from "../pages/student/Reports.jsx";
import StudentProfile from "../pages/student/Profile.jsx";

import NotFound from "../pages/NotFound.jsx";
import ProtectedRoute from "../components/common/ProtectedRoute.jsx";

import AdminLayout from "../layouts/AdminLayout.jsx";
import TeacherLayout from "../layouts/TeacherLayout.jsx";
import StudentLayout from "../layouts/StudentLayout.jsx";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />

      <Route path="/auth/login" element={<Login />} />
      <Route path="/auth/register" element={<Register />} />
      <Route path="/auth/verify-otp" element={<VerifyOtp />} />
      <Route path="/auth/forgot-password" element={<ForgotPassword />} />

      {/* Admin */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={["admin"]}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="students" element={<AdminStudents />} />
        <Route path="teachers" element={<AdminTeachers />} />
        <Route path="branches" element={<AdminBranches />} />
        <Route path="subjects" element={<AdminSubjects />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="users" element={<AdminManageUsers />} />
      </Route>

      {/* Teacher */}
      <Route
        path="/teacher"
        element={
          <ProtectedRoute roles={["teacher"]}>
            <TeacherLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<TeacherDashboard />} />
        <Route path="attendance" element={<TeacherAttendance />} />
        <Route path="holidays" element={<TeacherHolidays />} />
        <Route path="upload-marks" element={<TeacherUploadMarks />} />
        <Route path="students" element={<TeacherStudents />} />
        <Route path="profile" element={<TeacherProfile />} />
      </Route>

      {/* Student */}
      <Route
        path="/student"
        element={
          <ProtectedRoute roles={["student"]}>
            <StudentLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<StudentDashboard />} />
        <Route path="profile" element={<StudentProfile />} />
        <Route path="attendance" element={<StudentAttendance />} />
        <Route path="marks" element={<StudentMarks />} />
        <Route path="reports" element={<StudentReports />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;