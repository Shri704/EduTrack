import express from "express";
import multer from "multer";
import path from "path";
import {
  createStudent,
  getAllStudents,
  getStudentById,
  getMyProfile,
  updateMyPassword,
  updateMyProfile,
  updateStudent,
  deleteStudent,
  bulkImportStudents,
  promoteStudents
} from "./student.controller.js";
import { protect } from "../../middleware/authMiddleware.js";
import { authorize } from "../../middleware/roleMiddleware.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, `csv_${Date.now()}${path.extname(file.originalname)}`)
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === "text/csv" ||
      file.originalname.endsWith(".csv")
    )
      return cb(null, true);
    cb(new Error("Only CSV files allowed"));
  }
});

router.use(protect);

router.get("/me", authorize("student"), getMyProfile);
router.put("/me", authorize("student"), updateMyProfile);
router.put("/me/password", authorize("student"), updateMyPassword);
router.get("/", authorize("superadmin", "admin", "teacher"), getAllStudents);
router.post(
  "/promote",
  authorize("superadmin", "admin"),
  promoteStudents
);
router.get("/:id", authorize("superadmin", "admin", "teacher"), getStudentById);
router.post("/", authorize("superadmin", "admin"), createStudent);
router.put("/:id", authorize("superadmin", "admin", "teacher"), updateStudent);
router.delete("/:id", authorize("superadmin", "admin"), deleteStudent);
router.post(
  "/bulk-import",
  authorize("admin"),
  upload.single("file"),
  bulkImportStudents
);

export default router;