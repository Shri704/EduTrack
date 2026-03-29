import express from "express";
import {
  createSubject,
  getAllSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject
} from "./subject.controller.js";
import { protect } from "../../middleware/authMiddleware.js";
import { authorize } from "../../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect);
router.get("/", getAllSubjects);
router.get("/:id", getSubjectById);
router.post("/", authorize("superadmin", "admin"), createSubject);
router.put("/:id", authorize("superadmin", "admin"), updateSubject);
router.delete("/:id", authorize("superadmin", "admin"), deleteSubject);

export default router;