import api from "./api";

export const listStudentCurrentAffairs = async (params) => {
  const response = await api.get("/student/current-affairs", { params });
  return response.data;
};

export const getStudentCurrentAffair = async (currentAffairId) => {
  const response = await api.get(`/student/current-affairs/${currentAffairId}`);
  return response.data;
};

export const getStudentCurrentAffairMedia = async (currentAffairId, download = false) => {
  const suffix = download ? "/download" : "/media";
  const response = await api.get(`/student/current-affairs/${currentAffairId}${suffix}`, {
    responseType: "blob",
  });
  return response.data;
};
