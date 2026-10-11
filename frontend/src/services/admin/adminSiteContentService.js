import api from "../api";

export const getAbout = async () => (await api.get("/admin/about")).data;
export const saveAbout = async (data, exists) => (await api[exists ? "patch" : "post"]("/admin/about", data)).data;
export const updateAboutStatus = async (isActive) => (await api.patch("/admin/about/status", { is_active: isActive })).data;
export const getContactSettings = async () => (await api.get("/admin/contact-settings")).data;
export const saveContactSettings = async (data, exists) => (await api[exists ? "patch" : "post"]("/admin/contact-settings", data)).data;
export const updateContactSettingsStatus = async (isActive) => (await api.patch("/admin/contact-settings/status", { is_active: isActive })).data;
export const listContactMessages = async (params) => (await api.get("/admin/contact-messages", { params })).data;
export const getContactMessage = async (id) => (await api.get(`/admin/contact-messages/${id}`)).data;
export const updateContactMessageStatus = async (id, status) => (await api.patch(`/admin/contact-messages/${id}/status`, { status })).data;
export const updateContactMessageNotes = async (id, admin_notes) => (await api.patch(`/admin/contact-messages/${id}/notes`, { admin_notes })).data;
export const listTeamMembers = async (params) => (await api.get("/admin/site-content/team-members", { params })).data;
export const getTeamMember = async (id) => (await api.get(`/admin/site-content/team-members/${id}`)).data;
export const saveTeamMember = async (data, id) => (await api[id ? "patch" : "post"](id ? `/admin/site-content/team-members/${id}` : "/admin/site-content/team-members", data, { headers: { "Content-Type": "multipart/form-data" } })).data;
export const updateTeamMemberStatus = async (id, is_active) => (await api.patch(`/admin/site-content/team-members/${id}/status`, { is_active })).data;
export const deleteTeamMember = async (id) => (await api.delete(`/admin/site-content/team-members/${id}`)).data;
