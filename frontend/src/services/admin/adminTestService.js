import api from "../api";

export const getTests = async (params) => {
  const response = await api.get("/admin/tests", { params });
  return response.data;
};

export const getTest = async (testId) => {
  const response = await api.get(`/admin/tests/${testId}`);
  return response.data;
};

export const getTestAnalytics = async (testId) => {
  const response = await api.get(`/admin/tests/${testId}/analytics`);
  return response.data;
};

export const createTest = async (payload) => {
  const response = await api.post("/admin/tests", payload);
  return response.data;
};

export const updateTest = async (testId, payload) => {
  const response = await api.patch(`/admin/tests/${testId}`, payload);
  return response.data;
};

export const updateTestStatus = async (testId, isActive) => {
  const response = await api.patch(`/admin/tests/${testId}/status`, {
    is_active: isActive,
  });
  return response.data;
};

export const deleteTest = async (testId) => {
  const response = await api.delete(`/admin/tests/${testId}`);
  return response.data;
};
