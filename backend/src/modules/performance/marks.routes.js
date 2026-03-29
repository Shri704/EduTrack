import express from "express";

import {
  uploadMarks,
  getStudentMarks,
  getMyMarks,
  getClassMarks
} from "./marks.controller.js";
import { protect } from "../../middleware/authMiddleware.js";
import { authorize } from "../../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect);

// Teachers/Admins upload marks for a subject & exam
router.post("/marks", authorize("superadmin", "admin", "teacher"), uploadMarks);

// Student views own marks
router.get("/me", authorize("student"), getMyMarks);

// Admin/Teacher views a student's marks
router.get(
  "/student/:studentId",
  authorize("superadmin", "admin", "teacher"),
  getStudentMarks
);

// Admin/Teacher views marks for a subject (class)
router.get(
  "/class/:subjectId",
  authorize("superadmin", "admin", "teacher"),
  getClassMarks
);

export default router;