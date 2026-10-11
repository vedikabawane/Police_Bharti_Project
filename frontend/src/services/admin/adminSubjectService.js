import api from "../api";

export const getSubjects = async (params) => {
  const response = await api.get("/admin/subjects", { params });
  return response.data;
};

export const createSubject = async (payload) => {
  const response = await api.post("/subjects", payload);
  return response.data;
};

export const updateSubject = async (subjectId, payload) => {
  const response = await api.patch(`/subjects/${subjectId}`, payload);
  return response.data;
};

export const deleteSubject = async (subjectId) => {
  const response = await api.delete(`/subjects/${subjectId}`);
  return response.data;
};
