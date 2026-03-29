import express from "express";
import {
  studentAnalytics,
  studentDashboardOverview,
  classAnalytics,
  adminOverview,
  teacherOverview,
  attendanceDaily,
  performanceOverview,
  subjectBreakdown
} from "./analytics.controller.js";
import { protect } from "../../middleware/authMiddleware.js";
import { authorize } from "../../middleware/roleMiddleware.js";

const router = express.Router();

router.get(
  "/student/overview",
  protect,
  authorize("student"),
  studentDashboardOverview
);

router.get(
  "/admin/overview",
  protect,
  authorize("admin", "superadmin"),
  adminOverview
);

router.get("/teacher/overview", protect, authorize("teacher"), teacherOverview);

router.get(
  "/attendance/daily",
  protect,
  authorize("admin", "superadmin", "student"),
  attendanceDaily
);

router.get(
  "/performance/overview",
  protect,
  authorize("admin", "superadmin", "student"),
  performanceOverview
);

router.get(
  "/subjects/breakdown",
  protect,
  authorize("admin", "superadmin", "student"),
  subjectBreakdown
);

router.get(
  "/student/:studentId",
  protect,
  authorize("admin", "superadmin", "teacher"),
  studentAnalytics
);

router.get("/class/:courseId", classAnalytics);

export default router;
