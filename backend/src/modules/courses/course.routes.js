import express from "express";
import {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse
} from "./course.controller.js";
import { protect } from "../../middleware/authMiddleware.js";
import { authorize } from "../../middleware/roleMiddleware.js";

const router = express.Router();

// Public read access (needed for student registration branch dropdown)
router.get("/", getAllCourses);
router.get("/:id", getCourseById);

// Protected write access
router.post("/", protect, authorize("superadmin", "admin"), createCourse);
router.put("/:id", protect, authorize("superadmin", "admin"), updateCourse);
router.delete("/:id", protect, authorize("superadmin", "admin"), deleteCourse);

export default router;