import api from "./api";

export const getPerformance = async () => {
  const response = await api.get("/student/performance");

  return response.data;
};

export const getPerformanceOverview = async () => {
  const response = await api.get("/student/performance/overview");

  return response.data;
};

export const getSubjectPerformance = async () => {
  const response = await api.get("/student/performance/subjects");

  return response.data;
};

export const getTopicPerformance = async () => {
  const response = await api.get("/student/performance/topics");

  return response.data;
};

export const getPerformanceStrengths = async () => {
  const response = await api.get("/student/performance/strengths");

  return response.data;
};

export const getPerformanceProgress = async () => {
  const response = await api.get("/student/performance/progress");

  return response.data;
};

export const getTestHistory = async () => {
  const response = await api.get("/student/performance/test-history");

  return response.data;
};

export const getPhysicalPerformance = async () => {
  const response = await api.get("/student/performance/physical");

  return response.data;
};
