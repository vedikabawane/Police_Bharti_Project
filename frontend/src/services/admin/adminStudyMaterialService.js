import api from "../api";

export const getStudyMaterials = async (params) => {
  const response = await api.get("/admin/study-materials", { params });
  return response.data;
};

export const uploadStudyMaterial = async (formData, onUploadProgress) => {
  const response = await api.post("/admin/study-materials", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 120000,
    onUploadProgress,
  });
  return response.data;
};

export const updateStudyMaterialStatus = async (materialId, isActive) => {
  const response = await api.patch(`/admin/study-materials/${materialId}/status`, {
    is_active: isActive,
  });
  return response.data;
};

export const deleteStudyMaterial = async (materialId) => {
  const response = await api.delete(`/admin/study-materials/${materialId}`);
  return response.data;
};
