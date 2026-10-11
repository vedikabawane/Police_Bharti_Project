import api from "./api";

export const UNREAD_NOTIFICATION_EVENT = "student-notification-unread-count";

function publishUnreadCount(value) {
  if (typeof window !== "undefined" && Number.isFinite(Number(value))) {
    window.dispatchEvent(new CustomEvent(UNREAD_NOTIFICATION_EVENT, {
      detail: { unreadCount: Number(value) },
    }));
  }
}

export const getNotifications = async (params = {}) => {
  const response = await api.get("/student/notifications", { params });
  publishUnreadCount(response.data?.data?.unread_count);
  return response.data;
};

export const getUnreadCount = async () => {
  const response = await api.get("/student/notifications/unread-count");
  publishUnreadCount(response.data?.data?.unread_count);
  return response.data;
};

export const markNotificationRead = async (id) => {
  const response = await api.patch(`/student/notifications/${id}/read`);
  publishUnreadCount(response.data?.data?.unread_count);
  return response.data;
};

export const markAllNotificationsRead = async () => {
  const response = await api.patch("/student/notifications/read-all");
  publishUnreadCount(response.data?.data?.unread_count);
  return response.data;
};

export const getSmsPreference = async () => {
  const response = await api.get("/student/notifications/preferences/sms");
  return response.data;
};

export const updateSmsPreference = async (smsEnabled) => {
  const response = await api.patch("/student/notifications/preferences/sms", {
    sms_enabled: smsEnabled,
  });
  return response.data;
};
