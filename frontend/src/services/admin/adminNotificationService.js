import api from "../api";

export const sendNotification = async (payload, idempotencyKey) => {
  const response = await api.post("/admin/notifications", payload, {
    headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
  });
  return response.data;
};
