import api from "./api";

export const getPhysicalTrainingRecords = async () => {
  const response = await api.get("/student/physical-training");

  return response.data;
};

export const getLatestPhysicalTraining = async () => {
  const response = await api.get("/student/physical-training/latest");

  return response.data;
};

export const getPhysicalTrainingRecord = async (recordId) => {
  const response = await api.get(`/student/physical-training/${recordId}`);

  return response.data;
};

export const createPhysicalTrainingRecord = async (payload) => {
  const response = await api.post("/student/physical-training", payload);

  return response.data;
};

export const updatePhysicalTrainingRecord = async (recordId, payload) => {
  const response = await api.patch(
    `/student/physical-training/${recordId}`,
    payload,
  );

  return response.data;
};

export const deletePhysicalTrainingRecord = async (recordId) => {
  const response = await api.delete(`/student/physical-training/${recordId}`);

  return response.data;
};
