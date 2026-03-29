export const validateNotification = (data) => {
  if (!data.userId) {
    throw new Error("User ID required");
  }

  if (!data.title) {
    throw new Error("Title required");
  }

  if (!data.message) {
    throw new Error("Message required");
  }
};