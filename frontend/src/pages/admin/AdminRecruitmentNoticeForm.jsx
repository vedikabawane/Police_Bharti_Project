import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  createRecruitmentNotice,
  getRecruitmentNotice,
  updateRecruitmentNotice,
} from "../../services/admin/adminRecruitmentNoticeService";

const NOTICE_TYPES = [
  ["RECRUITMENT", "Recruitment"],
  ["ADVERTISEMENT", "Advertisement"],
  ["EXAM_DATE", "Exam date"],
  ["ANSWER_KEY", "Answer key"],
  ["RESULT", "Result"],
  ["PHYSICAL_TEST", "Physical test"],
  ["DOCUMENT_VERIFICATION", "Document verification"],
  ["IMPORTANT_UPDATE", "Important update"],
  ["OTHER", "Other"],
];
const fieldClass = "w-full rounded-lg border border-pb-border bg-white px-3.5 py-2.5 text-sm text-pb-green outline-none focus:border-pb-khaki focus:ring-2 focus:ring-pb-khaki/20 disabled:bg-slate-100";
const emptyForm = {
  title: "", summary: "", content: "", notice_type: "RECRUITMENT",
  recruitment_year: "", department: "", post_name: "", vacancies: "",
  application_start_date: "", application_end_date: "", exam_date: "",
  published_date: "", official_source_name: "", official_source_url: "",
};

function getErrorMessage(error) {
  const data = error.response?.data;
  const fieldErrors = data?.errors ? Object.values(data.errors).flat().join(" ") : "";
  return fieldErrors || data?.message || error.message || "Could not save recruitment notice.";
}

function AdminRecruitmentNoticeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(id);
  const [form, setForm] = useState(emptyForm);
  const [pdf, setPdf] = useState(null);
  const [existingPdf, setExistingPdf] = useState(null);
  const [removePdf, setRemovePdf] = useState(false);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!editing) return undefined;
    let active = true;
    getRecruitmentNotice(id)
      .then((response) => {
        if (!response?.success || !response.data) {
          throw new Error(response?.message || "Recruitment notice could not be loaded.");
        }
        if (active) {
          const data = response.data;
          setForm({
            title: data.title || "", summary: data.summary || "", content: data.content || "",
            notice_type: data.notice_type || "RECRUITMENT",
            recruitment_year: data.recruitment_year ?? "", department: data.department || "",
            post_name: data.post_name || "", vacancies: data.vacancies ?? "",
            application_start_date: data.application_start_date || "",
            application_end_date: data.application_end_date || "", exam_date: data.exam_date || "",
            published_date: data.published_date || "", official_source_name: data.official_source_name || "",
            official_source_url: data.official_source_url || "",
          });
          setExistingPdf(data.pdf_available ? {
            filename: data.pdf_original_filename,
            fileSize: data.pdf_file_size_bytes,
          } : null);
        }
      })
      .catch((requestError) => {
        if (active) setError(getErrorMessage(requestError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [editing, id]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    const hasPdf = Boolean(pdf) || (Boolean(existingPdf) && !removePdf);
    if (!form.official_source_url.trim() && !hasPdf) {
      setError("Add an official source URL or attach an official PDF notice.");
      return;
    }
    if (form.application_start_date && form.application_end_date
      && form.application_start_date > form.application_end_date) {
      setError("Application end date must be on or after the start date.");
      return;
    }

    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => formData.append(key, value));
    if (editing) formData.append("remove_pdf", String(removePdf));
    if (pdf) formData.append("pdf", pdf);

    setSaving(true);
    try {
      const response = editing
        ? await updateRecruitmentNotice(id, formData)
        : await createRecruitmentNotice(formData);
      if (!response?.success) throw new Error(response?.message || "Could not save recruitment notice.");
      navigate("/admin/recruitment-notices", { replace: true });
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="mx-auto max-w-5xl p-6 text-sm font-semibold text-slate-600">Loading recruitment notice…</div>;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-pb-khaki">Recruitment content</p><h1 className="mt-1 text-2xl font-extrabold text-pb-green">{editing ? "Edit Recruitment Notice" : "Add Recruitment Notice"}</h1></div>
        <Link to="/admin/recruitment-notices" className="rounded-lg border border-pb-border px-4 py-2.5 text-sm font-bold text-pb-green hover:bg-pb-light">Back to list</Link>
      </header>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-pb-border bg-white p-5 shadow-sm sm:p-7">
        {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><label htmlFor="recruitment-title" className="mb-1.5 block text-sm font-bold text-pb-green">Notice title <span className="text-red-600">*</span></label><input id="recruitment-title" name="title" required maxLength={200} value={form.title} onChange={handleChange} disabled={saving} className={fieldClass} /></div>
          <div><label htmlFor="recruitment-type" className="mb-1.5 block text-sm font-bold text-pb-green">Notice type <span className="text-red-600">*</span></label><select id="recruitment-type" name="notice_type" value={form.notice_type} onChange={handleChange} disabled={saving} className={fieldClass}>{NOTICE_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
          <div><label htmlFor="recruitment-published-date" className="mb-1.5 block text-sm font-bold text-pb-green">Published date <span className="text-red-600">*</span></label><input id="recruitment-published-date" type="date" name="published_date" required value={form.published_date} onChange={handleChange} disabled={saving} className={fieldClass} /></div>
          <div><label htmlFor="recruitment-year" className="mb-1.5 block text-sm font-bold text-pb-green">Recruitment year</label><input id="recruitment-year" type="number" min="1900" max="2200" step="1" name="recruitment_year" value={form.recruitment_year} onChange={handleChange} disabled={saving} className={fieldClass} /></div>
          <div><label htmlFor="recruitment-department" className="mb-1.5 block text-sm font-bold text-pb-green">Department</label><input id="recruitment-department" name="department" maxLength={200} value={form.department} onChange={handleChange} disabled={saving} className={fieldClass} /></div>
          <div><label htmlFor="recruitment-post" className="mb-1.5 block text-sm font-bold text-pb-green">Post name</label><input id="recruitment-post" name="post_name" maxLength={200} value={form.post_name} onChange={handleChange} disabled={saving} className={fieldClass} /></div>
          <div><label htmlFor="recruitment-vacancies" className="mb-1.5 block text-sm font-bold text-pb-green">Vacancies</label><input id="recruitment-vacancies" type="number" min="0" step="1" name="vacancies" value={form.vacancies} onChange={handleChange} disabled={saving} className={fieldClass} /></div>
          <div><label htmlFor="recruitment-start-date" className="mb-1.5 block text-sm font-bold text-pb-green">Application start date</label><input id="recruitment-start-date" type="date" name="application_start_date" value={form.application_start_date} onChange={handleChange} disabled={saving} className={fieldClass} /></div>
          <div><label htmlFor="recruitment-end-date" className="mb-1.5 block text-sm font-bold text-pb-green">Application end date</label><input id="recruitment-end-date" type="date" name="application_end_date" value={form.application_end_date} onChange={handleChange} disabled={saving} className={fieldClass} /></div>
          <div><label htmlFor="recruitment-exam-date" className="mb-1.5 block text-sm font-bold text-pb-green">Exam date</label><input id="recruitment-exam-date" type="date" name="exam_date" value={form.exam_date} onChange={handleChange} disabled={saving} className={fieldClass} /></div>
          <div><label htmlFor="recruitment-source-name" className="mb-1.5 block text-sm font-bold text-pb-green">Official source name</label><input id="recruitment-source-name" name="official_source_name" maxLength={200} value={form.official_source_name} onChange={handleChange} disabled={saving} className={fieldClass} /></div>
          <div className="sm:col-span-2"><label htmlFor="recruitment-summary" className="mb-1.5 block text-sm font-bold text-pb-green">Summary</label><textarea id="recruitment-summary" name="summary" rows={3} maxLength={1000} value={form.summary} onChange={handleChange} disabled={saving} className={`${fieldClass} resize-y`} /></div>
          <div className="sm:col-span-2"><label htmlFor="recruitment-content" className="mb-1.5 block text-sm font-bold text-pb-green">Notice content</label><textarea id="recruitment-content" name="content" rows={8} maxLength={50000} value={form.content} onChange={handleChange} disabled={saving} className={`${fieldClass} resize-y leading-6`} /></div>
          <div className="sm:col-span-2"><label htmlFor="recruitment-source-url" className="mb-1.5 block text-sm font-bold text-pb-green">Official source URL</label><input id="recruitment-source-url" type="url" name="official_source_url" maxLength={500} placeholder="https://official.gov.in/notice" value={form.official_source_url} onChange={handleChange} disabled={saving} className={fieldClass} /></div>
          <div className="sm:col-span-2"><label htmlFor="recruitment-pdf" className="mb-1.5 block text-sm font-bold text-pb-green">Official notice PDF</label><input id="recruitment-pdf" type="file" accept="application/pdf,.pdf" onChange={(event) => { setPdf(event.target.files?.[0] || null); setRemovePdf(false); }} disabled={saving} className="block w-full rounded-lg border border-pb-border bg-white px-3 py-2 text-sm text-pb-green file:mr-3 file:rounded-md file:border-0 file:bg-pb-light file:px-3 file:py-1.5 file:text-sm file:font-bold" /><p className="mt-1 text-xs text-slate-500">PDF only, subject to the configured upload size limit. An official URL or PDF is required.</p>
            {existingPdf && <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-pb-light px-3 py-2 text-sm"><span className="break-all text-slate-700">Current PDF: {existingPdf.filename || "Official notice PDF"}</span><label className="inline-flex items-center gap-2 font-semibold text-slate-700"><input type="checkbox" checked={removePdf} onChange={(event) => setRemovePdf(event.target.checked)} disabled={saving || Boolean(pdf)} />Remove current PDF</label></div>}
            {pdf && <p className="mt-2 break-all text-xs text-slate-600">Replacement selected: {pdf.name}</p>}
          </div>
        </div>
        <div className="flex flex-col-reverse gap-3 border-t border-pb-border-soft pt-5 sm:flex-row sm:justify-end"><Link to="/admin/recruitment-notices" className="rounded-lg border border-pb-border px-5 py-2.5 text-center text-sm font-bold text-pb-green hover:bg-pb-light">Cancel</Link><button type="submit" disabled={saving} className="rounded-lg bg-pb-green px-5 py-2.5 text-sm font-bold text-white hover:bg-pb-khaki disabled:opacity-60">{saving ? "Saving…" : editing ? "Save notice" : "Publish notice"}</button></div>
      </form>
    </div>
  );
}

export default AdminRecruitmentNoticeForm;
