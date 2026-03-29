import express from "express";

import {
  createNotification,
  getNotifications,
  markNotificationRead,
  deleteNotification
} from "./notification.controller.js";

const router = express.Router();

router.post("/", createNotification);

router.get("/user/:userId", getNotifications);

router.put("/read/:id", markNotificationRead);

router.delete("/:id", deleteNotification);

export default router;