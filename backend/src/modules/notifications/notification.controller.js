import * as notificationService from "./notification.service.js";

export const createNotification = async (req, res) => {
  try {
    const notification =
      await notificationService.createNotification(req.body);

    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getNotifications = async (req, res) => {
  try {
    const notifications =
      await notificationService.getUserNotifications(
        req.params.userId
      );

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    const notification =
      await notificationService.markAsRead(req.params.id);

    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    await notificationService.deleteNotification(req.params.id);

    res.json({ message: "Notification deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};