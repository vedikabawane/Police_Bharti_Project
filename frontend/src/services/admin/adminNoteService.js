import api from "../api";

export const getNotes = async (params) => {
  const response = await api.get("/admin/notes", { params });
  return response.data;
};

export const createNote = async (subjectId, topicId, payload) => {
  const response = await api.post(
    `/notes/subject/${subjectId}/topic/${topicId}`,
    payload,
  );
  return response.data;
};

export const updateNote = async (noteId, payload) => {
  const response = await api.patch(`/notes/${noteId}`, payload);
  return response.data;
};

export const deleteNote = async (noteId) => {
  const response = await api.delete(`/notes/${noteId}`);
  return response.data;
};
