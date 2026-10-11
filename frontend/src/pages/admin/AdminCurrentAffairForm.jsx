import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import currentAffairCategories from "../../constants/currentAffairCategories";
import {
  createCurrentAffair,
  getAdminCurrentAffairMedia,
  getCurrentAffair,
  replaceCurrentAffairMedia,
  updateCurrentAffair,
} from "../../services/admin/adminCurrentAffairService";

const fieldClass = "w-full rounded-lg border border-pb-border bg-white px-3.5 py-2.5 text-sm text-pb-green outline-none focus:border-pb-khaki focus:ring-2 focus:ring-pb-khaki/20 disabled:bg-slate-100";
const today = new Date();
const todayDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
const initialForm = {
  title: "",
  summary: "",
  content: "",
  category: currentAffairCategories[0],
  published_date: todayDate,
  source_name: "",
  source_url: "",
};

function AdminCurrentAffairForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(id);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState({ id: null, url: "" });

  useEffect(() => {
    if (!editing) return undefined;
    let current = true;
    getCurrentAffair(id)
      .then((response) => {
        if (!response?.success || !response.data) {
          throw new Error(response?.message || "Current affair could not be loaded.");
        }
        if (current) {
          setForm({
            title: response.data.title || "",
            summary: response.data.summary || "",
            content: response.data.content || "",
            category: response.data.category || currentAffairCategories[0],
            published_date: response.data.published_date || "",
            source_name: response.data.source_name || "",
            source_url: response.data.source_url || "",
            content_type: response.data.content_type || "TEXT",
            original_filename: response.data.original_filename || "",
          });
        }
      })
      .catch((requestError) => {
        if (current) setError(requestError.response?.data?.message || requestError.message);
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => { current = false; };
  }, [editing, id]);

  useEffect(() => {
    if (!editing || !["IMAGE", "PDF"].includes(form.content_type)) return undefined;
    let active = true;
    let objectUrl = "";
    getAdminCurrentAffairMedia(id).then((blob) => {
      if (active) { objectUrl = URL.createObjectURL(blob); setMediaPreview({ id, url: objectUrl }); }
    }).catch(() => {});
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [editing, form.content_type, id]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      ...form,
      summary: form.summary.trim() || null,
      source_name: form.source_name.trim() || null,
      source_url: form.source_url.trim() || null,
    };
    try {
      const response = editing
        ? await updateCurrentAffair(id, payload)
        : await createCurrentAffair(payload);
      if (!response?.success) throw new Error(response?.message || "Could not save current affair.");
      navigate("/admin/current-affairs", { replace: true });
    } catch (requestError) {
      const responseData = requestError.response?.data;
      const fieldErrors = responseData?.errors
        ? Object.values(responseData.errors).flat().join(" ")
        : "";
      setError(fieldErrors || responseData?.message || requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const handleMediaReplacement = async () => {
    if (!mediaFile || saving) return;
    setSaving(true); setError("");
    try {
      const response = await replaceCurrentAffairMedia(id, mediaFile, form.content_type);
      if (!response?.success) throw new Error(response?.message || "Could not replace media.");
      navigate("/admin/current-affairs", { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message);
    } finally { setSaving(false); }
  };

  if (loading) {
    return <div className="mx-auto max-w-4xl p-6 text-sm font-semibold text-slate-600">Loading current affair...</div>;
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-pb-khaki">Content management</p>
          <h1 className="mt-1 text-2xl font-extrabold text-pb-green">{editing ? "Edit Current Affair" : "Add Current Affair"}</h1>
        </div>
        <Link to="/admin/current-affairs" className="rounded-lg border border-pb-border px-4 py-2.5 text-sm font-bold text-pb-green hover:bg-pb-light">Back to list</Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-pb-border bg-white p-5 shadow-sm sm:p-7">
        {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {editing && form.content_type !== "TEXT" ? (
          <section className="space-y-4">
            <div className="rounded-xl bg-pb-light p-4"><p className="text-sm font-bold text-pb-green">{form.content_type} Current Affair</p><p className="mt-1 break-all text-sm text-slate-600">Current file: {form.original_filename || "Unavailable"}</p>{mediaPreview.id === id && mediaPreview.url && (form.content_type === "IMAGE" ? <img src={mediaPreview.url} alt={form.title} className="mt-3 max-h-64 w-full rounded-lg object-contain" /> : <iframe title={`${form.title} PDF preview`} src={mediaPreview.url} className="mt-3 h-64 w-full rounded-lg border border-pb-border" />)}</div>
            <label htmlFor="replace-current-affair-media" className="block text-sm font-bold text-pb-green">Replace {form.content_type === "IMAGE" ? "image" : "PDF"}</label>
            <input id="replace-current-affair-media" type="file" accept={form.content_type === "IMAGE" ? ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" : ".pdf,application/pdf"} disabled={saving} onChange={(event) => setMediaFile(event.target.files?.[0] || null)} className={fieldClass} />
            {mediaFile && <p className="text-sm text-slate-600">Selected: {mediaFile.name} · {(mediaFile.size / (1024 * 1024)).toFixed(2)} MB</p>}
            <button type="button" disabled={!mediaFile || saving} onClick={handleMediaReplacement} className="rounded-lg bg-pb-green px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">{saving ? "Uploading…" : "Replace media"}</button>
          </section>
        ) : <>
        <div>
          <label htmlFor="current-affair-title" className="mb-1.5 block text-sm font-bold text-pb-green">Title <span className="text-red-600">*</span></label>
          <input id="current-affair-title" name="title" required maxLength={200} value={form.title} onChange={handleChange} disabled={saving} className={fieldClass} />
        </div>
        <div>
          <label htmlFor="current-affair-summary" className="mb-1.5 block text-sm font-bold text-pb-green">Summary</label>
          <textarea id="current-affair-summary" name="summary" rows={3} maxLength={1000} value={form.summary} onChange={handleChange} disabled={saving} className={`${fieldClass} resize-y`} />
        </div>
        <div>
          <label htmlFor="current-affair-content" className="mb-1.5 block text-sm font-bold text-pb-green">Content <span className="text-red-600">*</span></label>
          <textarea id="current-affair-content" name="content" required rows={12} maxLength={50000} value={form.content} onChange={handleChange} disabled={saving} className={`${fieldClass} resize-y leading-6`} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="current-affair-category" className="mb-1.5 block text-sm font-bold text-pb-green">Category <span className="text-red-600">*</span></label>
            <select id="current-affair-category" name="category" value={form.category} onChange={handleChange} disabled={saving} className={fieldClass}>
              {currentAffairCategories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="current-affair-date" className="mb-1.5 block text-sm font-bold text-pb-green">Published date <span className="text-red-600">*</span></label>
            <input id="current-affair-date" type="date" name="published_date" required value={form.published_date} onChange={handleChange} disabled={saving} className={fieldClass} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="current-affair-source-name" className="mb-1.5 block text-sm font-bold text-pb-green">Source name</label>
            <input id="current-affair-source-name" name="source_name" maxLength={200} value={form.source_name} onChange={handleChange} disabled={saving} className={fieldClass} />
          </div>
          <div>
            <label htmlFor="current-affair-source-url" className="mb-1.5 block text-sm font-bold text-pb-green">Source URL</label>
            <input id="current-affair-source-url" type="url" name="source_url" maxLength={500} placeholder="https://example.com/article" value={form.source_url} onChange={handleChange} disabled={saving} className={fieldClass} />
          </div>
        </div>
        </>}
        <div className="flex flex-col-reverse gap-3 border-t border-pb-border-soft pt-5 sm:flex-row sm:justify-end">
          <Link to="/admin/current-affairs" className="rounded-lg border border-pb-border px-5 py-2.5 text-center text-sm font-bold text-pb-green hover:bg-pb-light">Cancel</Link>
          {(!editing || form.content_type === "TEXT") && <button type="submit" disabled={saving} className="rounded-lg bg-pb-green px-5 py-2.5 text-sm font-bold text-white hover:bg-pb-khaki disabled:cursor-wait disabled:opacity-60">{saving ? "Saving…" : editing ? "Save changes" : "Publish current affair"}</button>}
        </div>
      </form>
    </div>
  );
}

export default AdminCurrentAffairForm;
