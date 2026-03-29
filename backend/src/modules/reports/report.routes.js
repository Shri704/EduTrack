import express from "express";

import {
  studentReport,
  myStudentReport,
  classReport,
  attendanceReport,
  attendanceReportTeacher
} from "./report.controller.js";
import { protect } from "../../middleware/authMiddleware.js";
import { authorize } from "../../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/attendance", protect, authorize("superadmin", "admin"), attendanceReport);
router.get("/attendance/teacher", protect, authorize("teacher"), attendanceReportTeacher);

router.get("/student/me", protect, authorize("student"), myStudentReport);

router.get("/student/:studentId", studentReport);

router.get("/class/:courseId", classReport);

export default router;