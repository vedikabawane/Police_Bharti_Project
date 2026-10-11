import api from "./api";

export const getStudentProfile = async () => {
  const response = await api.get("/student/profile");

  return response.data;
};

export const createStudentProfile = async (profileData) => {
  const response = await api.post("/student/profile", profileData);

  return response.data;
};

export const updateStudentProfile = async (profileData) => {
  const response = await api.patch("/student/profile", profileData);

  return response.data;
};

export const uploadStudentProfilePhoto = async (photoFile) => {
  const formData = new FormData();
  formData.append("photo", photoFile);

  const response = await api.post("/student/profile/photo", formData, {
    headers: {
      // Clear the shared JSON default so Axios/browser can set the multipart boundary.
      "Content-Type": null,
    },
  });

  return response.data;
};
