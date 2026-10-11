import api from "./api";

export const getStudyMaterialsByTopic = async (topicId) => {
  const response = await api.get(`/student/study-materials/topic/${topicId}`);
  return response.data;
};

export const getStudyMaterialFile = async (materialId) => {
  const response = await api.get(`/student/study-materials/${materialId}/file`, {
    responseType: "blob",
  });
  return response.data;
};

export const downloadStudyMaterialFile = async (materialId) => {
  const response = await api.get(`/student/study-materials/${materialId}/download`, {
    responseType: "blob",
  });
  return response;
};
