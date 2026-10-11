import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import { getTeamMember, saveTeamMember } from "../../services/admin/adminSiteContentService";

const blank = { name: "", role: "", bio: "", email: "", mobile: "", location: "", display_order: "0" };
const inputClass = "mt-1.5 w-full rounded-lg border border-pb-border bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-pb-khaki";
const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
const maxPhotoSize = 5 * 1024 * 1024;

function AdminTeamMemberForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(id);
  const [form, setForm] = useState(blank);
  const [photo, setPhoto] = useState(null);
  const [currentPhoto, setCurrentPhoto] = useState(null);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const previewUrl = useMemo(() => photo ? URL.createObjectURL(photo) : null, [photo]);
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  useEffect(() => {
    if (!editing) return;
    let alive = true;
    getTeamMember(id).then(({ data }) => { if (alive) { setForm({ name: data.name, role: data.role, bio: data.bio || "", email: data.email || "", mobile: data.mobile || "", location: data.location || "", display_order: String(data.display_order) }); setCurrentPhoto(data.photo_url ? new URL(data.photo_url, api.defaults.baseURL).href : null); } }).catch((requestError) => { if (alive) setError(requestError.response?.data?.message || "Could not load team member."); }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [editing, id]);

  const changePhoto = (event) => {
    const file = event.target.files?.[0] || null;
    setError(""); setNotice("");
    if (file && !allowedTypes.includes(file.type)) { setPhoto(null); setError("Choose a JPG, PNG or WEBP image."); event.target.value = ""; return; }
    if (file && file.size > maxPhotoSize) { setPhoto(null); setError("Photos must be 5 MB or smaller."); event.target.value = ""; return; }
    setPhoto(file);
  };
  const save = async (event) => {
    event.preventDefault(); setSaving(true); setError(""); setNotice("");
    const body = new FormData();
    Object.entries(form).forEach(([key, value]) => body.append(key, value));
    if (photo) body.append("photo", photo);
    try { await saveTeamMember(body, id); setNotice("Team member saved."); navigate("/admin/site-content/team-members"); }
    catch (requestError) {
      const errors = requestError.response?.data?.errors;
      setError(errors ? Object.values(errors).flat().join(" ") : requestError.response?.data?.message || "Could not save team member.");
    } finally { setSaving(false); }
  };

  if (loading) return <div role="status" className="p-8">Loading team member...</div>;
  const imageUrl = previewUrl || currentPhoto;
  return <div className="mx-auto max-w-4xl p-4 sm:p-8"><header className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-bold uppercase tracking-wide text-pb-khaki">Site Content / Team Members</p><h1 className="mt-1 text-3xl font-black text-pb-green">{editing ? "Edit team member" : "Add team member"}</h1></div><Link to="/admin/site-content/team-members" className="rounded-lg border border-pb-border bg-white px-4 py-2 font-bold">Back to list</Link></header>
    {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}{notice && <p role="status" className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">{notice}</p>}
    <form onSubmit={save} className="mt-6 grid gap-5 rounded-2xl border border-pb-border bg-white p-5 sm:grid-cols-2 sm:p-7">
      <label className="text-sm font-bold text-pb-green sm:col-span-2">Photo <span className="font-normal text-slate-500">(optional, JPG/PNG/WEBP, up to 5 MB)</span><div className="mt-3 flex flex-wrap items-center gap-4"><div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-pb-border bg-pb-light">{imageUrl ? <img src={imageUrl} alt="Team member preview" className="h-full w-full object-cover" /> : <span className="text-xs font-semibold text-slate-500">No photo</span>}</div><div className="min-w-0"><input type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={changePhoto} className="block max-w-full text-sm font-normal text-slate-600" />{photo && <p className="mt-2 break-all text-xs font-normal text-slate-600">{photo.name} · {(photo.size / 1024).toFixed(1)} KB</p>}{!photo && currentPhoto && <p className="mt-2 text-xs font-normal text-slate-500">Current photo will be kept unless replaced.</p>}</div></div></label>
      <label className="text-sm font-bold text-pb-green">Name<input required maxLength={120} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={inputClass} /></label>
      <label className="text-sm font-bold text-pb-green">Role<input required maxLength={120} value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} placeholder="Founder, Support team..." className={inputClass} /></label>
      <label className="text-sm font-bold text-pb-green sm:col-span-2">Short introduction / bio<textarea maxLength={1000} rows={4} value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} className={inputClass} /></label>
      <label className="text-sm font-bold text-pb-green">Email<input type="email" maxLength={255} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className={inputClass} /></label>
      <label className="text-sm font-bold text-pb-green">Mobile<input type="tel" maxLength={20} value={form.mobile} onChange={(event) => setForm({ ...form, mobile: event.target.value })} className={inputClass} /></label>
      <label className="text-sm font-bold text-pb-green">Location<input maxLength={255} value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} className={inputClass} /></label>
      <label className="text-sm font-bold text-pb-green">Display order<input type="number" min="0" step="1" required value={form.display_order} onChange={(event) => setForm({ ...form, display_order: event.target.value })} className={inputClass} /></label>
      <div className="sm:col-span-2"><button disabled={saving} className="rounded-lg bg-pb-green px-5 py-3 font-bold text-white disabled:opacity-50">{saving ? "Saving..." : "Save team member"}</button></div>
    </form>
  </div>;
}

export default AdminTeamMemberForm;
