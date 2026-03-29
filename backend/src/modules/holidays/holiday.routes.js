import express from "express";
import { protect } from "../../middleware/authMiddleware.js";
import { authorize } from "../../middleware/roleMiddleware.js";
import {
  createHoliday,
  listHolidays,
  removeHoliday
} from "./holiday.controller.js";

const router = express.Router();

router.use(protect);
router.get(
  "/",
  authorize("superadmin", "admin", "teacher"),
  listHolidays
);
router.post(
  "/",
  authorize("superadmin", "admin", "teacher"),
  createHoliday
);
router.delete(
  "/",
  authorize("superadmin", "admin", "teacher"),
  removeHoliday
);

export default router;
