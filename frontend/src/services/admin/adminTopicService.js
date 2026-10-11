import api from "../api";

export const getTopics = async (params) => {
  const response = await api.get("/admin/topics", { params });
  return response.data;
};

// Topic creation is scoped by the existing backend subject route.
export const createTopic = async (subjectId, payload) => {
  const response = await api.post(`/topics/subject/${subjectId}`, payload);
  return response.data;
};

export const updateTopic = async (topicId, payload) => {
  const response = await api.patch(`/topics/${topicId}`, payload);
  return response.data;
};

export const deleteTopic = async (topicId) => {
  const response = await api.delete(`/topics/${topicId}`);
  return response.data;
};
