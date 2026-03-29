import express from "express";
import authRoutes from "./modules/auth/auth.routes.js";
import userRoutes from "./modules/users/user.routes.js";
import studentRoutes from "./modules/students/student.routes.js";
import teacherRoutes from "./modules/teachers/teacher.routes.js";
import courseRoutes from "./modules/courses/course.routes.js";
import subjectRoutes from "./modules/subjects/subject.routes.js";
import attendanceRoutes from "./modules/attendance/attendance.routes.js";
import performanceRoutes from "./modules/performance/marks.routes.js";
import notificationRoutes from "./modules/notifications/notification.routes.js";
import analyticsRoutes from "./modules/analytics/analytics.routes.js";
import reportRoutes from "./modules/reports/report.routes.js";
import holidayRoutes from "./modules/holidays/holiday.routes.js";
const router = express.Router();


// ----------------------------
// Auth Routes
// ----------------------------

router.use("/auth", authRoutes);


// ----------------------------
// Users Routes
// ----------------------------

router.use("/users", userRoutes);


// ----------------------------
// Students Routes
// ----------------------------

router.use("/students", studentRoutes);


// ----------------------------
// Teachers Routes
// ----------------------------

router.use("/teachers", teacherRoutes);


// ----------------------------
// Branches Routes (collection: branches)
// ----------------------------

router.use("/branches", courseRoutes);
router.use("/courses", courseRoutes); // legacy alias for subjects/students


// ----------------------------
// Subjects Routes
// ----------------------------

router.use("/subjects", subjectRoutes);


// ----------------------------
// Attendance Routes
// ----------------------------

router.use("/attendance", attendanceRoutes);


// ----------------------------
// Performance Routes
// ----------------------------

router.use("/performance", performanceRoutes);


// ----------------------------
// Notifications Routes
// ----------------------------

router.use("/notifications", notificationRoutes);


// ----------------------------
// Analytics Routes
// ----------------------------

router.use("/analytics", analyticsRoutes);


// ----------------------------
// Reports Routes
// ----------------------------

router.use("/reports", reportRoutes);


// ----------------------------
// Holidays (branch-wide attendance as H)
// ----------------------------

router.use("/holidays", holidayRoutes);


export default router;