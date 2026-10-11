import api from "./api";

export const getNotesByTopic = async (topicId) => {
  const response = await api.get(`/notes/topic/${topicId}`);

  return response.data;
};

export const getHandwrittenNotesByTopic = async (topicId) => {
  const response = await api.get(`/handwritten-notes/topic/${topicId}`);

  return response.data;
};

export const getVideosByTopic = async (topicId) => {
  const response = await api.get(`/videos/topic/${topicId}`);

  return response.data;
};

export const getVideoFile = async (videoId) => {
  const response = await api.get(`/videos/${videoId}/file`, {
    responseType: "blob",
    timeout: 0,
  });
  return response.data;
};
