import api from "./api";

export const getTests = async (params) => {
  const response = await api.get("/student/tests", { params });

  return response.data;
};

export const getStudentTestHistory = async (params) => {
  const response = await api.get("/student/tests/history", { params });
  return response.data;
};

export const getTestById = async (testId) => {
  const response = await api.get(`/student/tests/${testId}`);

  return response.data;
};

export const getTestQuestions = async (testId) => {
  const response = await api.get(`/tests/${testId}/questions`);

  return response.data;
};

export const startTestAttempt = async (testId) => {
  const response = await api.post(`/tests/${testId}/start`);

  return response.data;
};

export const getStudentTestAttempt = async (attemptId) => {
  const response = await api.get(`/tests/attempts/${attemptId}`);
  return response.data;
};

export const saveStudentTestAnswer = async (attemptId, payload) => {
  const response = await api.patch(`/tests/attempts/${attemptId}/answers`, payload);
  return response.data;
};

export const submitTestAttempt = async (attemptId) => {
  const response = await api.post(`/tests/attempts/${attemptId}/submit`);

  return response.data;
};

export const getTestAttemptResult = async (attemptId) => {
  const response = await api.get(`/tests/attempts/${attemptId}/result`);

  return response.data;
};
