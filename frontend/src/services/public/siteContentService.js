import api from "../api";

export const getAbout = async () => (await api.get("/public/about")).data;
export const getContact = async () => (await api.get("/public/contact")).data;
export const getTeamMembers = async () => (await api.get("/public/contact/team-members")).data;
export const submitContact = async (data) => (await api.post("/public/contact", data)).data;
