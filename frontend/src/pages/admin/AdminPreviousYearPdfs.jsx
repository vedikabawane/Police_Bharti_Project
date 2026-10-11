import { useEffect, useState } from "react";

import {
  deletePreviousYearPdf,
  listPreviousYearPdfs,
  updatePreviousYearPdfStatus,
  uploadPreviousYearPdf,
} from "../../services/admin/adminPreviousYearPdfService";

const PER_PAGE = 20;
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const EMPTY_FORM = { title: "", exam_name: "", exam_year: "", description: "", pdf: null };
const getErrorMessage = (error, fallback) => error.response?.data?.message || error.message || fallback;

function formatFileSize(size) {
  if (size < 1024) return `${size} Bytes`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value) {
  if (!value) return "उपलब्ध नाही";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "उपलब्ध नाही" : date.toLocaleDateString("mr-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function UploadDialog({ onClose, onSuccess }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const chooseFile = (event) => {
    const file = event.target.files?.[0] || null;
    setForm((current) => ({ ...current, pdf: file }));
    setError("");
    if (!file) return;
    const reject = (message) => {
      setError(message);
      setForm((current) => ({ ...current, pdf: null }));
      event.target.value = "";
    };
    if (!file.name.toLowerCase().endsWith(".pdf")) return reject(".pdf extension असलेली फाइल निवडा.");
    if (file.type && file.type.toLowerCase() !== "application/pdf") return reject("निवडलेली फाइल PDF असणे आवश्यक आहे.");
    if (file.size === 0) return reject("निवडलेली PDF रिकामी आहे.");
    if (file.size > MAX_FILE_SIZE) return reject("PDF फाइलचा आकार 20 MB किंवा त्यापेक्षा कमी असावा.");
  };

  const submit = async (event) => {
    event.preventDefault();
    const title = form.title.trim();
    const examName = form.exam_name.trim();
    if (!title || !examName || !form.exam_year || !form.pdf) {
      setError("सर्व आवश्यक माहिती भरा आणि PDF फाइल निवडा.");
      return;
    }
    const formData = new FormData();
    formData.append("title", title);
    formData.append("exam_name", examName);
    formData.append("exam_year", form.exam_year);
    formData.append("description", form.description.trim());
    formData.append("pdf", form.pdf);
    setSaving(true);
    setProgress(0);
    setError("");
    try {
      const response = await uploadPreviousYearPdf(formData, (uploadEvent) => {
        if (uploadEvent.total) setProgress(Math.round((uploadEvent.loaded * 100) / uploadEvent.total));
      });
      if (!response?.success) throw new Error(response?.message || "PDF अपलोड करता आली नाही.");
      onSuccess(response.message || "Previous Year PDF यशस्वीपणे अपलोड झाली.");
    } catch (uploadError) {
      setError(getErrorMessage(uploadError, "PDF अपलोड करताना समस्या आली. पुन्हा प्रयत्न करा."));
    } finally {
      setSaving(false);
    }
  };

  const fieldClass = "w-full rounded-lg border border-pb-border bg-white px-3.5 py-2.5 text-sm text-pb-green outline-none focus:border-pb-khaki focus:ring-2 focus:ring-pb-khaki/20 disabled:bg-slate-100";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-3 sm:p-4" role="presentation">
      <section role="dialog" aria-modal="true" aria-labelledby="previous-year-upload-title" className="my-auto max-h-[95vh] w-full max-w-xl overflow-y-auto rounded-xl border border-pb-border bg-white p-5 shadow-xl sm:p-6">
        <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-pb-khaki">PDF व्यवस्थापन</p><h2 id="previous-year-upload-title" className="mt-1 text-xl font-extrabold text-pb-green">PDF अपलोड करा</h2></div><button type="button" aria-label="बंद करा" disabled={saving} onClick={onClose} className="rounded-lg px-3 py-1 text-xl font-bold text-slate-500 hover:bg-pb-light disabled:opacity-50">×</button></div>
        <form className="mt-5 space-y-4" onSubmit={submit}>
          <div><label htmlFor="previous-year-title" className="mb-1.5 block text-sm font-bold text-pb-green">PDF चे नाव <span className="text-red-600">*</span></label><input id="previous-year-title" required maxLength={200} value={form.title} disabled={saving} onChange={(event) => setForm({ ...form, title: event.target.value })} className={fieldClass} /></div>
          <div className="grid gap-4 sm:grid-cols-2"><div><label htmlFor="previous-year-exam-name" className="mb-1.5 block text-sm font-bold text-pb-green">परीक्षेचे नाव <span className="text-red-600">*</span></label><input id="previous-year-exam-name" required maxLength={200} value={form.exam_name} disabled={saving} onChange={(event) => setForm({ ...form, exam_name: event.target.value })} className={fieldClass} /></div><div><label htmlFor="previous-year-exam-year" className="mb-1.5 block text-sm font-bold text-pb-green">परीक्षा वर्ष <span className="text-red-600">*</span></label><input id="previous-year-exam-year" required type="number" step="1" value={form.exam_year} disabled={saving} onChange={(event) => setForm({ ...form, exam_year: event.target.value })} className={fieldClass} /></div></div>
          <div><label htmlFor="previous-year-description" className="mb-1.5 block text-sm font-bold text-pb-green">वर्णन</label><textarea id="previous-year-description" rows={3} value={form.description} disabled={saving} onChange={(event) => setForm({ ...form, description: event.target.value })} className={`${fieldClass} resize-y`} /></div>
          <div><label htmlFor="previous-year-pdf-file" className="mb-1.5 block text-sm font-bold text-pb-green">PDF फाइल <span className="text-red-600">*</span></label><input id="previous-year-pdf-file" required type="file" accept="application/pdf,.pdf" disabled={saving} onChange={chooseFile} className="block w-full rounded-lg border border-pb-border bg-white px-3 py-2 text-sm text-pb-green file:mr-3 file:rounded-md file:border-0 file:bg-pb-light file:px-3 file:py-1.5 file:text-sm file:font-bold focus:outline-none focus:ring-2 focus:ring-pb-khaki/30 disabled:bg-slate-100" />{form.pdf && <p className="mt-2 break-all text-sm text-slate-600">{form.pdf.name} <span className="whitespace-nowrap">({formatFileSize(form.pdf.size)})</span></p>}<p className="mt-1 text-xs text-slate-500">फक्त PDF, कमाल 20 MB.</p></div>
          {saving && <div role="status" className="rounded-lg bg-pb-light px-3 py-2 text-sm font-semibold text-pb-green">अपलोड सुरू आहे... {progress}%<div className="mt-2 h-2 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-pb-khaki transition-all" style={{ width: `${progress}%` }} /></div></div>}
          {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end"><button type="button" disabled={saving} onClick={onClose} className="rounded-lg border border-pb-border px-4 py-2.5 text-sm font-bold text-pb-green hover:bg-pb-light disabled:opacity-60">रद्द करा</button><button type="submit" disabled={saving} className="rounded-lg bg-pb-green px-4 py-2.5 text-sm font-bold text-white transition hover:bg-pb-khaki disabled:cursor-not-allowed disabled:opacity-60">{saving ? `अपलोड सुरू आहे... ${progress}%` : "PDF अपलोड करा"}</button></div>
        </form>
      </section>
    </div>
  );
}

function ConfirmDialog({ confirmation, busy, error, onCancel, onConfirm }) {
  const deleting = confirmation.action === "delete";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="presentation">
      <section role="dialog" aria-modal="true" aria-labelledby="previous-year-confirm-title" className="w-full max-w-md rounded-xl border border-pb-border bg-white p-6 shadow-xl">
        <h2 id="previous-year-confirm-title" className="text-lg font-extrabold text-pb-green">{deleting ? "PDF कायमची हटवायची?" : "स्थिती बदलायची?"}</h2>
        <p className="mt-3 text-sm leading-6 text-slate-700">{deleting ? `“${confirmation.pdf.title}” ही Previous Year PDF कायमची delete करायची आहे का?` : `“${confirmation.pdf.title}” ही PDF ${confirmation.pdf.is_active ? "निष्क्रिय" : "सक्रिय"} करायची आहे का?`}</p>
        {deleting && <p className="mt-1 text-sm font-semibold leading-6 text-red-700">ही कृती पूर्ववत करता येणार नाही.</p>}{error && <p role="alert" className="mt-3 text-sm font-semibold text-red-700">{error}</p>}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" disabled={busy} onClick={onCancel} className="rounded-lg border border-pb-border px-4 py-2 text-sm font-bold text-pb-green hover:bg-pb-light disabled:opacity-60">रद्द करा</button><button type="button" disabled={busy} onClick={onConfirm} className={`rounded-lg px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60 ${deleting ? "bg-red-700 hover:bg-red-800" : "bg-pb-green hover:bg-pb-khaki"}`}>{busy ? "कृपया थांबा..." : deleting ? "Delete" : "पुष्टी करा"}</button></div>
      </section>
    </div>
  );
}

function AdminPreviousYearPdfs() {
  const [pdfs, setPdfs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, per_page: PER_PAGE, total: 0, pages: 0 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [examName, setExamName] = useState("");
  const [examYear, setExamYear] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [reload, setReload] = useState(0);
  const [showUpload, setShowUpload] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [confirmation, setConfirmation] = useState(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    let isCurrent = true;
    const loadPdfs = async () => {
      setLoading(true);
      setListError("");
      const params = { page, per_page: PER_PAGE, search: debouncedSearch };
      if (examName.trim()) params.exam_name = examName.trim();
      if (examYear) params.exam_year = examYear;
      if (status !== "") params.is_active = status;
      try {
        const response = await listPreviousYearPdfs(params);
        const data = response?.data;
        if (!response?.success || !Array.isArray(data?.previous_year_pdfs) || !data?.pagination) throw new Error(response?.message || "Previous Year PDF response was incomplete.");
        if (isCurrent) { setPdfs(data.previous_year_pdfs); setPagination(data.pagination); }
      } catch (error) {
        if (isCurrent) setListError(getErrorMessage(error, "Previous Year PDF माहिती मिळवताना समस्या आली."));
      } finally { if (isCurrent) setLoading(false); }
    };
    loadPdfs();
    return () => { isCurrent = false; };
  }, [page, debouncedSearch, examName, examYear, status, reload]);

  const hasFilters = Boolean(search || examName || examYear || status !== "");
  const resetFilters = () => { setSearch(""); setDebouncedSearch(""); setExamName(""); setExamYear(""); setStatus(""); setPage(1); };

  const runConfirmedAction = async () => {
    if (!confirmation || actionBusy) return;
    setActionBusy(true); setActionError(""); setFeedback("");
    try {
      if (confirmation.action === "status") {
        const nextStatus = !confirmation.pdf.is_active;
        await updatePreviousYearPdfStatus(confirmation.pdf.id, nextStatus);
        setPdfs((current) => current.map((pdf) => pdf.id === confirmation.pdf.id ? { ...pdf, is_active: nextStatus } : pdf));
        setFeedback(nextStatus ? "PDF सक्रिय केली." : "PDF निष्क्रिय केली.");
      } else {
        await deletePreviousYearPdf(confirmation.pdf.id);
        setPdfs((current) => current.filter((pdf) => pdf.id !== confirmation.pdf.id));
        setPagination((current) => ({ ...current, total: Math.max(0, current.total - 1) }));
        setFeedback("Previous Year PDF delete केली.");
      }
      const wasLastItem = confirmation.action === "delete" && pdfs.length === 1 && page > 1;
      setConfirmation(null);
      if (wasLastItem) setPage((current) => current - 1);
      else setReload((current) => current + 1);
    } catch (error) {
      const fallback = confirmation.action === "delete" ? "PDF delete करताना समस्या आली. पुन्हा प्रयत्न करा." : "PDF ची स्थिती बदलताना समस्या आली. पुन्हा प्रयत्न करा.";
      setActionError(getErrorMessage(error, fallback));
    } finally { setActionBusy(false); }
  };

  const firstResult = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.per_page + 1;
  const lastResult = Math.min(pagination.page * pagination.per_page, pagination.total);
  const inputClass = "w-full rounded-lg border border-pb-border bg-white px-3.5 py-3 text-sm text-pb-green outline-none focus:border-pb-khaki focus:ring-2 focus:ring-pb-khaki/20";

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-7 flex flex-col gap-4 border-b border-pb-border pb-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-pb-khaki">Content Management</p><h1 className="mt-2 text-2xl font-extrabold text-pb-green sm:text-3xl">Previous Year प्रश्नपत्रिका</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">मागील वर्षांच्या प्रश्नपत्रिका PDF स्वरूपात व्यवस्थापित करा.</p></div><button type="button" onClick={() => setShowUpload(true)} className="inline-flex shrink-0 items-center justify-center rounded-lg bg-pb-green px-4 py-2.5 text-sm font-bold text-white transition hover:bg-pb-khaki focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pb-khaki">+ PDF अपलोड करा</button></div>
      {feedback && <p role="status" className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">{feedback}</p>}

      <section className="rounded-lg border border-pb-border bg-white p-4 sm:p-5"><div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_13rem_10rem_11rem_auto] lg:items-end">
        <div className="min-w-0"><label htmlFor="previous-year-search" className="mb-2 block text-sm font-bold text-pb-green">PDF शोधा...</label><input id="previous-year-search" type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="PDF शोधा..." className={`${inputClass} bg-pb-light`} /></div>
        <div><label htmlFor="previous-year-exam-filter" className="mb-2 block text-sm font-bold text-pb-green">परीक्षेचे नाव</label><input id="previous-year-exam-filter" type="search" value={examName} onChange={(event) => { setExamName(event.target.value); setPage(1); }} placeholder="सर्व परीक्षा" className={inputClass} /></div>
        <div><label htmlFor="previous-year-year-filter" className="mb-2 block text-sm font-bold text-pb-green">परीक्षा वर्ष</label><input id="previous-year-year-filter" type="number" step="1" value={examYear} onChange={(event) => { setExamYear(event.target.value); setPage(1); }} placeholder="सर्व वर्षे" className={inputClass} /></div>
        <div><label htmlFor="previous-year-status-filter" className="mb-2 block text-sm font-bold text-pb-green">स्थिती</label><select id="previous-year-status-filter" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className={inputClass}><option value="">सर्व</option><option value="true">सक्रिय</option><option value="false">निष्क्रिय</option></select></div>
        <button type="button" onClick={resetFilters} disabled={!hasFilters} className="rounded-lg border border-pb-border px-4 py-3 text-sm font-bold text-pb-green hover:bg-pb-light disabled:cursor-not-allowed disabled:opacity-50">रीसेट</button>
      </div></section>

      <section className="mt-6 min-w-0 overflow-hidden rounded-lg border border-pb-border bg-white">
        <div className="flex flex-col gap-1 border-b border-pb-border-soft px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"><h2 className="font-extrabold text-pb-green">Previous Year PDFs</h2>{!loading && !listError && <p className="text-xs font-semibold text-slate-500">एकूण {pagination.total} PDFs · {firstResult}–{lastResult} दाखवत आहोत</p>}</div>
        {loading ? <div role="status" className="px-5 py-12 text-center"><span className="mx-auto block h-8 w-8 animate-spin rounded-full border-4 border-pb-border border-t-pb-khaki" /><p className="mt-3 text-sm font-semibold text-pb-green">PDF माहिती लोड होत आहे...</p></div>
          : listError ? <div role="alert" className="px-5 py-10 text-center"><p className="text-sm font-semibold text-red-700">Previous Year PDF माहिती मिळवताना समस्या आली.</p><p className="mt-1 text-sm text-slate-600">{listError}</p><button type="button" onClick={() => setReload((value) => value + 1)} className="mt-4 rounded-lg bg-pb-green px-4 py-2 text-sm font-bold text-white hover:bg-pb-khaki">पुन्हा प्रयत्न करा</button></div>
            : pdfs.length === 0 ? <div className="px-5 py-12 text-center"><p className="font-bold text-pb-green">{hasFilters ? "तुमच्या शोधासाठी कोणतीही PDF सापडली नाही." : "अजून कोणतीही Previous Year PDF उपलब्ध नाही."}</p>{!hasFilters && <button type="button" onClick={() => setShowUpload(true)} className="mt-4 rounded-lg bg-pb-green px-4 py-2.5 text-sm font-bold text-white hover:bg-pb-khaki">PDF अपलोड करा</button>}</div>
              : <><div className="space-y-3"><div className="grid gap-3 xl:hidden">{pdfs.map((pdf) => <article key={pdf.id} className="rounded-xl border border-pb-border-soft bg-white p-4"><div className="flex items-start justify-between gap-3"><h3 className="break-words font-bold text-pb-green">{pdf.title}</h3><span className="shrink-0 rounded-full bg-pb-light px-2 py-1 text-xs font-bold">{pdf.is_active ? "Active" : "Inactive"}</span></div><p className="mt-2 break-words text-sm text-pb-khaki">{pdf.exam_name} / {pdf.exam_year}</p><p className="mt-3 break-all text-sm text-slate-600">{pdf.original_filename}</p><p className="mt-2 text-sm text-slate-600">{formatFileSize(pdf.file_size_bytes)} / {formatDate(pdf.created_at)}</p><div className="mt-4 flex flex-wrap gap-2"><button type="button" disabled={actionBusy} onClick={() => { setActionError(""); setConfirmation({ action: "status", pdf }); }} className="min-h-11 rounded-md border border-pb-border px-3 text-sm font-bold disabled:opacity-50">{pdf.is_active ? "Deactivate" : "Activate"}</button><button type="button" disabled={actionBusy} onClick={() => { setActionError(""); setConfirmation({ action: "delete", pdf }); }} className="min-h-11 rounded-md border border-red-200 px-3 text-sm font-bold text-red-700 disabled:opacity-50">Delete</button></div></article>)}</div></div><div className="hidden max-w-full overflow-x-auto xl:block"><div className="max-w-full overflow-x-auto"><table className="w-full min-w-[1120px] border-collapse text-left text-sm"><thead className="bg-pb-light text-xs uppercase tracking-wide text-pb-green"><tr>{["#", "PDF चे नाव", "परीक्षा", "वर्ष", "फाइल", "आकार", "स्थिती", "तयार केले", "कृती"].map((heading) => <th key={heading} scope="col" className="whitespace-nowrap px-4 py-3 font-bold">{heading}</th>)}</tr></thead><tbody className="divide-y divide-pb-border-soft">{pdfs.map((pdf, index) => <tr key={pdf.id} className="hover:bg-pb-light/60"><td className="px-4 py-3 text-slate-500">{(pagination.page - 1) * pagination.per_page + index + 1}</td><td className="max-w-64 px-4 py-3 font-bold text-pb-green">{pdf.title}</td><td className="whitespace-nowrap px-4 py-3 text-slate-700">{pdf.exam_name}</td><td className="whitespace-nowrap px-4 py-3 text-slate-700">{pdf.exam_year}</td><td className="max-w-64 break-all px-4 py-3 text-slate-600">{pdf.original_filename}</td><td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatFileSize(pdf.file_size_bytes)}</td><td className="px-4 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${pdf.is_active ? "bg-[#e8eee3] text-pb-green" : "bg-[#f2ecda] text-pb-khaki"}`}>{pdf.is_active ? "सक्रिय" : "निष्क्रिय"}</span></td><td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(pdf.created_at)}</td><td className="px-4 py-3"><div className="flex items-center gap-2"><button type="button" disabled={actionBusy} onClick={() => { setActionError(""); setConfirmation({ action: "status", pdf }); }} className="rounded-md border border-pb-border px-3 py-1.5 text-xs font-bold text-pb-green hover:bg-[#e8eee3] disabled:cursor-not-allowed disabled:opacity-50">{pdf.is_active ? "निष्क्रिय करा" : "सक्रिय करा"}</button><button type="button" disabled={actionBusy} onClick={() => { setActionError(""); setConfirmation({ action: "delete", pdf }); }} className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50">Delete</button></div></td></tr>)}</tbody></table></div></div></>}
        {!loading && !listError && pagination.pages > 0 && <div className="flex flex-col gap-3 border-t border-pb-border-soft px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"><p className="text-sm font-semibold text-slate-600">पृष्ठ {pagination.page} / {pagination.pages}</p><div className="flex items-center gap-2"><button type="button" disabled={pagination.page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-md border border-pb-border px-4 py-2 text-sm font-bold text-pb-green hover:bg-pb-light disabled:cursor-not-allowed disabled:opacity-40">मागील</button><button type="button" disabled={pagination.page >= pagination.pages} onClick={() => setPage((value) => Math.min(pagination.pages, value + 1))} className="rounded-md border border-pb-border px-4 py-2 text-sm font-bold text-pb-green hover:bg-pb-light disabled:cursor-not-allowed disabled:opacity-40">पुढील</button></div></div>}
      </section>
      {showUpload && <UploadDialog onClose={() => setShowUpload(false)} onSuccess={(message) => { setShowUpload(false); setFeedback(message); setPage(1); setReload((value) => value + 1); }} />}
      {confirmation && <ConfirmDialog confirmation={confirmation} busy={actionBusy} error={actionError} onCancel={() => setConfirmation(null)} onConfirm={runConfirmedAction} />}
    </div>
  );
}

export default AdminPreviousYearPdfs;
