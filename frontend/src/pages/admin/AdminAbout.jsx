import { useEffect, useState } from "react";
import { getAbout, saveAbout, updateAboutStatus } from "../../services/admin/adminSiteContentService";

const fields = [["hero_title", "Hero title", 200], ["hero_subtitle", "Hero subtitle", 500], ["introduction", "Introduction", 5000], ["purpose", "Purpose", 3000], ["mission", "Mission", 3000], ["vision", "Vision", 3000], ["study_features", "Study features", 3000], ["test_features", "Tests and practice", 3000], ["physical_training_info", "Physical training", 3000], ["current_affairs_info", "Current affairs", 3000], ["recruitment_info", "Recruitment information", 3000], ["ai_assistant_info", "AI assistant", 3000], ["performance_info", "Performance tracking", 3000], ["free_platform_info", "Free platform information", 3000], ["contact_cta", "Contact call to action", 1000]];
const blank = Object.fromEntries(fields.map(([key]) => [key, ""]));

function AdminAbout() {
  const [form, setForm] = useState(blank); const [exists, setExists] = useState(false); const [active, setActive] = useState(true);
  const [busy, setBusy] = useState(true); const [saving, setSaving] = useState(false); const [message, setMessage] = useState("");
  useEffect(() => { getAbout().then(({ data }) => { if (data) { setForm(Object.fromEntries(fields.map(([key]) => [key, data[key] || ""]))); setExists(true); setActive(data.is_active); } }).catch(() => setMessage("माहिती लोड करता आली नाही.")).finally(() => setBusy(false)); }, []);
  const save = async (event) => { event.preventDefault(); setSaving(true); setMessage(""); try { const { data } = await saveAbout(form, exists); setForm(Object.fromEntries(fields.map(([key]) => [key, data[key] || ""]))); setExists(true); setActive(data.is_active); setMessage("About page saved."); } catch (error) { setMessage(error.response?.status === 422 ? "कृपया प्रत्येक मजकूर मर्यादेत भरा." : "सेव्ह करता आले नाही. पुन्हा प्रयत्न करा."); } finally { setSaving(false); } };
  const toggle = async () => { try { const next = !active; await updateAboutStatus(next); setActive(next); setMessage(next ? "About page published." : "About page hidden."); } catch { setMessage("स्थिती बदलता आली नाही."); } };
  if (busy) return <div className="p-8">लोड होत आहे...</div>;
  return <div className="mx-auto max-w-5xl p-4 sm:p-8"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-bold uppercase tracking-wide text-pb-khaki">Site Content</p><h1 className="mt-1 text-3xl font-black text-pb-green">About page</h1></div>{exists && <button onClick={toggle} className="rounded-lg border border-pb-border bg-white px-4 py-2 font-bold">{active ? "Hide page" : "Publish page"}</button>}</div>
    {message && <p role="status" className="mt-4 rounded-lg bg-pb-neutral p-3 text-sm">{message}</p>}
    <form onSubmit={save} className="mt-6 grid gap-4 rounded-2xl border border-pb-border bg-white p-5 sm:grid-cols-2 sm:p-7">{fields.map(([key, label, max]) => <label key={key} className={`text-sm font-bold text-pb-green ${["introduction", "purpose", "mission", "vision", "contact_cta"].includes(key) ? "sm:col-span-2" : ""}`}>{label}<textarea required maxLength={max} rows={key === "hero_title" ? 2 : 4} value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} className="mt-2 w-full rounded-lg border border-pb-border px-3 py-2 font-normal" /></label>)}<button disabled={saving} className="w-fit rounded-lg bg-pb-green px-5 py-3 font-bold text-white">{saving ? "Saving..." : "Save About content"}</button></form>
  </div>;
}
export default AdminAbout;
