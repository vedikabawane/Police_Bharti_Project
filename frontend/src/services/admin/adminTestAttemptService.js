import api from "../api";

export const getAdminTestAttempts = async (params) => {
  const response = await api.get("/admin/test-attempts", { params });
  return response.data;
};

export const getAdminTestAttempt = async (attemptId) => {
  const response = await api.get(`/admin/test-attempts/${attemptId}`);
  return response.data;
};
