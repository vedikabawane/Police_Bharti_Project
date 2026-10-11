import api from "../api";

export const listPreviousYearPdfs = async (params) => {
  const response = await api.get("/admin/previous-year-pdfs", { params });
  return response.data;
};

export const uploadPreviousYearPdf = async (formData, onUploadProgress) => {
  const response = await api.post("/admin/previous-year-pdfs", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 120000,
    onUploadProgress,
  });
  return response.data;
};

export const updatePreviousYearPdfStatus = async (pdfId, isActive) => {
  const response = await api.patch(`/admin/previous-year-pdfs/${pdfId}/status`, {
    is_active: isActive,
  });
  return response.data;
};

export const deletePreviousYearPdf = async (pdfId) => {
  const response = await api.delete(`/admin/previous-year-pdfs/${pdfId}`);
  return response.data;
};
