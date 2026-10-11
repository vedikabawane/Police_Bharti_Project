import api from "./api";

export const getSubjects = async () => {
  const response = await api.get("/subjects");

  return response.data;
};

export const getTopicsBySubject = async (subjectId) => {
  const response = await api.get(`/topics/subject/${subjectId}`);

  return response.data;
};
