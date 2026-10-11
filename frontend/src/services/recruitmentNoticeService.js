import api from "./api";

export const listStudentRecruitmentNotices = async (params) => {
  const response = await api.get("/student/recruitment-notices", { params });
  return response.data;
};

export const getStudentRecruitmentNotice = async (noticeId) => {
  const response = await api.get(`/student/recruitment-notices/${noticeId}`);
  return response.data;
};

export const getStudentRecruitmentNoticePdf = async (noticeId, download = false) => {
  const endpoint = download ? "download" : "file";
  const response = await api.get(`/student/recruitment-notices/${noticeId}/${endpoint}`, {
    responseType: "blob",
    timeout: 120000,
  });
  return response;
};
