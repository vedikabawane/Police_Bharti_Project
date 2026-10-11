import api from "../api";

export const getQuestions = async (params) => {
  const response = await api.get("/admin/questions", { params });
  return response.data;
};

export const createQuestion = async (subjectId, topicId, payload) => {
  const response = await api.post(
    `/questions/subject/${subjectId}/topic/${topicId}`,
    payload,
  );
  return response.data;
};

export const updateQuestion = async (questionId, payload) => {
  const response = await api.patch(`/questions/${questionId}`, payload);
  return response.data;
};

export const updateQuestionStatus = async (questionId, isActive) => {
  return updateQuestion(questionId, { is_active: isActive });
};

export const deleteQuestion = async (questionId) => {
  const response = await api.delete(`/questions/${questionId}`);
  return response.data;
};
