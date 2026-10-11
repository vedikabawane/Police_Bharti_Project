import api from "./api";

export const sendAIMessage = async (message, sessionId) => {
  const payload = { message };

  if (sessionId) {
    payload.session_id = sessionId;
  }

  const response = await api.post("/student/ai/chat", payload);

  return response.data;
};

export const getAIChatHistory = async (sessionId) => {
  const response = await api.get("/student/ai/history", {
    params: sessionId ? { session_id: sessionId } : undefined,
  });

  return response.data;
};

export const deleteAIChatHistory = async (sessionId) => {
  const response = await api.delete("/student/ai/history", {
    params: sessionId ? { session_id: sessionId } : undefined,
  });

  return response.data;
};
