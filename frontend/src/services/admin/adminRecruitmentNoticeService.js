import api from "../api";

export const listRecruitmentNotices = async (params) => {
  const response = await api.get("/admin/recruitment-notices", { params });
  return response.data;
};

export const getRecruitmentNotice = async (noticeId) => {
  const response = await api.get(`/admin/recruitment-notices/${noticeId}`);
  return response.data;
};

export const createRecruitmentNotice = async (formData) => {
  const response = await api.post("/admin/recruitment-notices", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 120000,
  });
  return response.data;
};

export const updateRecruitmentNotice = async (noticeId, formData) => {
  const response = await api.patch(`/admin/recruitment-notices/${noticeId}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 120000,
  });
  return response.data;
};

export const updateRecruitmentNoticeStatus = async (noticeId, isActive) => {
  const response = await api.patch(`/admin/recruitment-notices/${noticeId}/status`, {
    is_active: isActive,
  });
  return response.data;
};

export const deleteRecruitmentNotice = async (noticeId) => {
  const response = await api.delete(`/admin/recruitment-notices/${noticeId}`);
  return response.data;
};
