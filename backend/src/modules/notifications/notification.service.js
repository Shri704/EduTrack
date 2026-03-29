import Notification from "./notification.model.js";

export const createNotification = async (data) => {
  return await Notification.create(data);
};

export const getUserNotifications = async (userId) => {
  return await Notification.find({ recipient: userId }).sort({ createdAt: -1 });
};

export const markAsRead = async (id) => {
  return await Notification.findByIdAndUpdate(
    id,
    { isRead: true },
    { new: true }
  );
};

export const deleteNotification = async (id) => {
  return await Notification.findByIdAndDelete(id);
};