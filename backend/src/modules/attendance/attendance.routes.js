import express from "express";
import {
  markAttendance,
  getStudentAttendance,
  getMyAttendance,
  getClassAttendance,
  getLowAttendance
} from "./attendance.controller.js";
import { protect } from "../../middleware/authMiddleware.js";
import { authorize } from "../../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect);
router.get("/me", authorize("student"), getMyAttendance);
router.get("/low", authorize("admin", "teacher"), getLowAttendance);
router.get(
  "/student/:studentId",
  authorize("admin", "teacher"),
  getStudentAttendance
);
router.get(
  "/class/:subjectId",
  authorize("admin", "teacher"),
  getClassAttendance
);
router.post(
  "/mark",
  authorize("admin", "teacher"),
  markAttendance
);

export default router;