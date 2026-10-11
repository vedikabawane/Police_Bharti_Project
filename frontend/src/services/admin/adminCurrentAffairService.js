import api from "../api";

export const listCurrentAffairs = async (params) => {
  const response = await api.get("/admin/current-affairs", { params });
  return response.data;
};

export const getCurrentAffair = async (currentAffairId) => {
  const response = await api.get(`/admin/current-affairs/${currentAffairId}`);
  return response.data;
};

export const createCurrentAffair = async (data) => {
  const response = await api.post("/admin/current-affairs", data);
  return response.data;
};

export const uploadCurrentAffairMedia = async (file, contentType, uploadRequestId) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("content_type", contentType);
  const response = await api.post("/admin/current-affairs/media", formData, {
    headers: {
      "Content-Type": null,
      "X-Upload-Request-ID": uploadRequestId,
    },
  });
  return response.data;
};

export const replaceCurrentAffairMedia = async (id, file, contentType) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("content_type", contentType);
  const response = await api.put(`/admin/current-affairs/${id}/media`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const getAdminCurrentAffairMedia = async (id) => {
  const response = await api.get(`/admin/current-affairs/${id}/media`, { responseType: "blob" });
  return response.data;
};

export const updateCurrentAffair = async (currentAffairId, data) => {
  const response = await api.patch(`/admin/current-affairs/${currentAffairId}`, data);
  return response.data;
};

export const updateCurrentAffairStatus = async (currentAffairId, isActive) => {
  const response = await api.patch(`/admin/current-affairs/${currentAffairId}/status`, {
    is_active: isActive,
  });
  return response.data;
};

export const deleteCurrentAffair = async (currentAffairId) => {
  const response = await api.delete(`/admin/current-affairs/${currentAffairId}`);
  return response.data;
};
