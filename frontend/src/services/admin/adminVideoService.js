import api from "../api";

export const getAdminVideos = async (params) => {
  const response = await api.get("/admin/videos", { params });
  return response.data;
};

function prepareVideoPayload(data) {
  if (!data.video_file) return { payload: data, config: undefined };
  const payload = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      payload.append(key, value);
    }
  });
  return {
    payload,
    config: { headers: { "Content-Type": undefined }, timeout: 0 },
  };
}

export const createAdminVideo = async (data, onUploadProgress) => {
  const { payload, config } = prepareVideoPayload(data);
  const response = await api.post("/admin/videos", payload, {
    ...config,
    onUploadProgress,
  });
  return response.data;
};

export const updateAdminVideo = async (videoId, data, onUploadProgress) => {
  const { payload, config } = prepareVideoPayload(data);
  const response = await api.patch(`/admin/videos/${videoId}`, payload, {
    ...config,
    onUploadProgress,
  });
  return response.data;
};

export const updateAdminVideoStatus = async (videoId, isActive) => {
  const response = await api.patch(`/admin/videos/${videoId}/status`, {
    is_active: isActive,
  });
  return response.data;
};

export const deleteAdminVideo = async (videoId) => {
  const response = await api.delete(`/admin/videos/${videoId}`);
  return response.data;
};
