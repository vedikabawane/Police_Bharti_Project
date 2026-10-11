import api from "./api";

export const getPYQQuestions = async (filters = {}) => {
  const params = {};

  if (filters.subject_id !== undefined && filters.subject_id !== null && filters.subject_id !== "") {
    params.subject_id = filters.subject_id;
  }

  if (filters.topic_id !== undefined && filters.topic_id !== null && filters.topic_id !== "") {
    params.topic_id = filters.topic_id;
  }

  if (filters.exam_year !== undefined && filters.exam_year !== null && filters.exam_year !== "") {
    params.exam_year = filters.exam_year;
  }

  const response = await api.get("/questions/pyq", {
    params,
  });

  return response.data;
};
