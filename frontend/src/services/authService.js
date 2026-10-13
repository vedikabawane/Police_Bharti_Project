import api from "./api";

export const registerStudent = async (userData) => {
  const response = await api.post("/auth/register", userData);

  return response.data;
};

export const loginStudent = async (loginData) => {
  const response = await api.post("/auth/login", loginData);

  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get("/auth/me");

  return response.data;
};
