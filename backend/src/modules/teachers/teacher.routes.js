import express from "express";
import {
  createTeacher,
  getAllTeachers,
  getTeacherById,
  getMyProfile,
  updateMyProfile,
  updateTeacher,
  assignSubject,
  deleteTeacher
} from "./teacher.controller.js";
import { protect } from "../../middleware/authMiddleware.js";
import { authorize } from "../../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect);
router.get("/me", authorize("teacher"), getMyProfile);
router.put("/me", authorize("teacher"), updateMyProfile);
router.get("/", authorize("superadmin", "admin"), getAllTeachers);
router.get("/:id", authorize("superadmin", "admin", "teacher"), getTeacherById);
router.post("/", authorize("superadmin", "admin"), createTeacher);
router.put("/:id", authorize("superadmin", "admin"), updateTeacher);
router.put("/:id/assign-subject", authorize("superadmin", "admin"), assignSubject);
router.delete("/:id", authorize("superadmin", "admin"), deleteTeacher);

export default router;