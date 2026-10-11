import api from "./api";

export const getPreviousYearPdfs = async (params) => {
  const response = await api.get("/student/previous-year-pdfs", { params });
  return response.data;
};

export const getPreviousYearPdfFile = async (pdfId) => {
  const response = await api.get(`/student/previous-year-pdfs/${pdfId}/file`, {
    responseType: "blob",
  });
  return response.data;
};

export const downloadPreviousYearPdf = async (pdfId) => {
  const response = await api.get(`/student/previous-year-pdfs/${pdfId}/download`, {
    responseType: "blob",
  });
  return response;
};
