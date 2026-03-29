import express from "express";

import {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser
} from "./user.controller.js";
import { protect } from "../../middleware/authMiddleware.js";
import { authorize } from "../../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect);

/** Admins and superadmins can list and view users (no passwords returned). */
router.get("/", authorize("superadmin", "admin"), getUsers);
router.get("/:id", authorize("superadmin", "admin"), getUser);

/** Only superadmin can create or update auth users. Superadmin and admin may delete (admins: student/teacher only — enforced in service). */
router.post("/", authorize("superadmin"), createUser);
router.put("/:id", authorize("superadmin"), updateUser);
router.delete("/:id", authorize("superadmin", "admin"), deleteUser);

export default router;
