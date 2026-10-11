import api from "../api";

export const getStudents = async (params) => {
  const response = await api.get("/admin/students", { params });

  return response.data;
};

export const getStudent = async (studentId) => {
  const response = await api.get(`/admin/students/${studentId}`);

  return response.data;
};

export const updateStudentStatus = async (studentId, isActive) => {
  const response = await api.patch(`/admin/students/${studentId}/status`, {
    is_active: isActive,
  });

  return response.data;
};

export const getStudentPerformance = async (studentId) => {
  const response = await api.get(`/admin/students/${studentId}/performance`);

  return response.data;
};
