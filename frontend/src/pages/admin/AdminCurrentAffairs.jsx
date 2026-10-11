import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useRef } from "react";

import currentAffairCategories from "../../constants/currentAffairCategories";
import {
  deleteCurrentAffair,
  listCurrentAffairs,
  uploadCurrentAffairMedia,
  updateCurrentAffairStatus,
} from "../../services/admin/adminCurrentAffairService";

const PER_PAGE = 20;
const inputClass = "w-full rounded-lg border border-pb-border bg-white px-3.5 py-2.5 text-sm text-pb-green outline-none focus:border-pb-khaki focus:ring-2 focus:ring-pb-khaki/20";

function formatDate(value) {
  if (!value) return "—";
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function getErrorMessage(error) {
  return error.response?.data?.message || error.message || "Something went wrong.";
}

function Pagination({ page, pages, onChange }) {
  if (pages < 2) return null;
  return (
    <nav aria-label="Current affairs pages" className="mt-6 flex flex-wrap items-center justify-center gap-2">
      <button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)} className="rounded-lg border border-pb-border px-3 py-2 text-sm font-bold text-pb-green disabled:opacity-40">Previous</button>
      <span aria-live="polite" className="px-2 text-sm font-semibold text-slate-600">Page {page} of {pages}</span>
      <button type="button" disabled={page >= pages} onClick={() => onChange(page + 1)} className="rounded-lg border border-pb-border px-3 py-2 text-sm font-bold text-pb-green disabled:opacity-40">Next</button>
    </nav>
  );
}

function QuickMediaUpload({ type, onClose, onUploaded }) {
  const uploadRequestId = useRef(crypto.randomUUID());
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview); };
  }, [preview]);
  const submit = async (event) => {
    event.preventDefault();
    if (!file || busy) return;
    setBusy(true); setError("");
    try {
      const response = await uploadCurrentAffairMedia(file, type, uploadRequestId.current);
      if (!response?.success) throw new Error(response?.message || "Upload failed.");
      onUploaded();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally { setBusy(false); }
  };
  const accept = type === "IMAGE" ? ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" : ".pdf,application/pdf";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
      <form onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="quick-upload-title" className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl sm:p-6">
        <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wide text-pb-khaki">Current Affairs</p><h2 id="quick-upload-title" className="mt-1 text-xl font-extrabold text-pb-green">Upload {type === "IMAGE" ? "Image" : "PDF"}</h2></div><button type="button" disabled={busy} onClick={onClose} aria-label="Close upload" className="rounded-lg px-2 py-1 text-lg text-slate-500 hover:bg-pb-light">×</button></div>
        {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <label htmlFor="current-affair-media-file" className="mt-5 block text-sm font-bold text-pb-green">Choose {type === "IMAGE" ? "image" : "PDF"}</label>
        <input id="current-affair-media-file" type="file" required accept={accept} disabled={busy} onChange={(event) => { const nextFile = event.target.files?.[0] || null; setFile(nextFile); setPreview(type === "IMAGE" && nextFile ? URL.createObjectURL(nextFile) : ""); }} className="mt-2 block w-full rounded-lg border border-pb-border p-2 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-pb-light file:px-3 file:py-2 file:font-bold file:text-pb-green" />
        {file && <div className="mt-4 rounded-xl border border-pb-border bg-pb-light p-3"><p className="break-all text-sm font-bold text-pb-green">{file.name}</p><p className="mt-1 text-xs text-slate-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>{preview && <img src={preview} alt="Selected image preview" className="mt-3 max-h-56 w-full rounded-lg object-contain" />}</div>}
        <div className="mt-5 flex justify-end gap-2"><button type="button" disabled={busy} onClick={onClose} className="rounded-lg border border-pb-border px-4 py-2.5 text-sm font-bold text-pb-green">Cancel</button><button type="submit" disabled={!file || busy} className="rounded-lg bg-pb-green px-5 py-2.5 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-60">{busy ? "Uploading…" : "Upload"}</button></div>
      </form>
    </div>
  );
}

function AdminCurrentAffairs() {
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, per_page: PER_PAGE, total: 0, pages: 0 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("");
  const [contentType, setContentType] = useState("");
  const [status, setStatus] = useState("");
  const [publishedDate, setPublishedDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reload, setReload] = useState(0);
  const [uploadType, setUploadType] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError("");
      const params = { page, per_page: PER_PAGE };
      if (debouncedSearch) params.search = debouncedSearch;
      if (category) params.category = category;
      if (contentType) params.content_type = contentType;
      if (status) params.is_active = status;
      if (publishedDate) params.published_date = publishedDate;
      try {
        const response = await listCurrentAffairs(params);
        const data = response?.data;
        if (!response?.success || !Array.isArray(data?.current_affairs) || !data?.pagination) {
          throw new Error(response?.message || "Current affairs response was incomplete.");
        }
        if (active) {
          setRecords(data.current_affairs);
          setPagination(data.pagination);
          if (data.pagination.pages > 0 && page > data.pagination.pages) setPage(data.pagination.pages);
        }
      } catch (requestError) {
        if (active) setError(getErrorMessage(requestError));
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [page, debouncedSearch, category, contentType, status, publishedDate, reload]);

  const changeFilter = (setter, value) => {
    setter(value);
    setPage(1);
    setNotice("");
  };

  const toggleStatus = async (record) => {
    setBusyId(record.id);
    setError("");
    setNotice("");
    try {
      const response = await updateCurrentAffairStatus(record.id, !record.is_active);
      if (!response?.success) throw new Error(response?.message || "Could not update status.");
      setNotice(`“${record.title}” is now ${record.is_active ? "inactive" : "active"}.`);
      setReload((value) => value + 1);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusyId(null);
    }
  };

  const removeRecord = async (record) => {
    if (!window.confirm(`Delete “${record.title}” permanently? This cannot be undone.`)) return;
    setBusyId(record.id);
    setError("");
    setNotice("");
    try {
      const response = await deleteCurrentAffair(record.id);
      if (!response?.success) throw new Error(response?.message || "Could not delete current affair.");
      setNotice("Current affair deleted.");
      setReload((value) => value + 1);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-pb-khaki">Content management</p>
          <h1 className="mt-1 text-2xl font-extrabold text-pb-green sm:text-3xl">Current Affairs</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Publish date-wise updates for Maharashtra Police Bharti preparation.</p>
        </div>
        <div className="flex flex-wrap gap-2"><Link to="/admin/current-affairs/new" className="inline-flex items-center justify-center rounded-lg bg-pb-khaki px-4 py-2.5 text-sm font-bold text-white ">+ Add current affair</Link><button type="button" onClick={() => setUploadType("IMAGE")} className="rounded-lg bg-pb-khaki px-4 py-2.5 text-sm font-bold text-white">Upload Image</button><button type="button" onClick={() => setUploadType("PDF")} className="rounded-lg border border-pb-khaki bg-white px-4 py-2.5 text-sm font-bold text-pb-khaki">Upload PDF</button></div>
      </header>

      <section aria-label="Current affairs filters" className="mt-6 grid gap-3 rounded-xl border border-pb-border bg-white p-4 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <label htmlFor="admin-current-type" className="mb-1.5 block text-xs font-bold text-pb-green">Content type</label>
          <select id="admin-current-type" value={contentType} onChange={(event) => changeFilter(setContentType, event.target.value)} className={inputClass}><option value="">All types</option><option value="TEXT">Text</option><option value="IMAGE">Image</option><option value="PDF">PDF</option></select>
        </div>
        <div>
          <label htmlFor="admin-current-search" className="mb-1.5 block text-xs font-bold text-pb-green">Search</label>
          <input id="admin-current-search" type="search" value={search} onChange={(event) => changeFilter(setSearch, event.target.value)} placeholder="Title, summary or content" className={inputClass} />
        </div>
        <div>
          <label htmlFor="admin-current-category" className="mb-1.5 block text-xs font-bold text-pb-green">Category</label>
          <select id="admin-current-category" value={category} onChange={(event) => changeFilter(setCategory, event.target.value)} className={inputClass}>
            <option value="">All categories</option>
            {currentAffairCategories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="admin-current-status" className="mb-1.5 block text-xs font-bold text-pb-green">Status</label>
          <select id="admin-current-status" value={status} onChange={(event) => changeFilter(setStatus, event.target.value)} className={inputClass}>
            <option value="">All statuses</option><option value="true">Active</option><option value="false">Inactive</option>
          </select>
        </div>
        <div>
          <label htmlFor="admin-current-date" className="mb-1.5 block text-xs font-bold text-pb-green">Published date</label>
          <input id="admin-current-date" type="date" value={publishedDate} onChange={(event) => changeFilter(setPublishedDate, event.target.value)} className={inputClass} />
        </div>
      </section>

      {error && <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {notice && <div role="status" className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{notice}</div>}
      <div className="mt-5 flex items-center justify-between gap-3">
        <h2 className="font-extrabold text-pb-green">Current affairs</h2>
        {!loading && <p className="text-xs font-semibold text-slate-500">{pagination.total} item{pagination.total === 1 ? "" : "s"}</p>}
      </div>

      {loading ? (
        <div role="status" className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <div key={index} className="h-44 animate-pulse rounded-xl bg-white ring-1 ring-pb-border" />)}</div>
      ) : records.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-[#d9d2c3] bg-white px-5 py-12 text-center"><p className="font-bold text-pb-green">No current affairs found</p><p className="mt-1 text-sm text-slate-500">Try changing the filters or add a new article.</p></div>
      ) : (
        <>
          <div className="mt-4 hidden overflow-hidden rounded-xl border border-pb-border bg-white xl:block">
            <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-pb-light text-xs uppercase tracking-wide text-slate-600"><tr><th className="px-4 py-3">Current affair</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Published</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th></tr></thead>
              <tbody className="divide-y divide-pb-border-soft">{records.map((record) => (
                <tr key={record.id}>
                  <td className="max-w-md px-4 py-3"><p className="truncate font-bold text-pb-green">{record.title}</p><p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{record.original_filename || record.summary || record.content || "—"}</p></td>
                  <td className="px-4 py-3 text-slate-700">{record.content_type || "TEXT"}</td>
                  <td className="px-4 py-3 text-slate-700">{record.category}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(record.published_date)}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${record.is_active ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-600"}`}>{record.is_active ? "Active" : "Inactive"}</span></td>
                  <td className="px-4 py-3"><div className="flex justify-end gap-2"><Link to={`/admin/current-affairs/${record.id}/edit`} className="rounded-md border border-pb-border px-3 py-1.5 text-xs font-bold text-pb-green hover:bg-pb-light">Edit</Link><button type="button" disabled={busyId === record.id} onClick={() => toggleStatus(record)} className="rounded-md bg-pb-green px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50">{record.is_active ? "Deactivate" : "Activate"}</button><button type="button" disabled={busyId === record.id} onClick={() => removeRecord(record)} className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-50">Delete</button></div></td>
                </tr>
              ))}</tbody>
            </table></div>
          </div>
          <div className="mt-4 grid gap-3 xl:hidden">{records.map((record) => (
            <article key={record.id} className="rounded-xl border border-pb-border bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="break-words font-extrabold text-pb-green">{record.title}</p><p className="mt-1 text-xs font-semibold text-pb-khaki">{record.category} · {formatDate(record.published_date)}</p></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${record.is_active ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-600"}`}>{record.is_active ? "Active" : "Inactive"}</span></div>
              <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{record.content_type === "TEXT" ? (record.summary || record.content) : `${record.content_type} · ${record.original_filename || ""}`}</p>
              <div className="mt-4 flex flex-wrap gap-2"><Link to={`/admin/current-affairs/${record.id}/edit`} className="rounded-md border border-pb-border px-3 py-2 text-xs font-bold text-pb-green">Edit</Link><button type="button" disabled={busyId === record.id} onClick={() => toggleStatus(record)} className="rounded-md bg-pb-green px-3 py-2 text-xs font-bold text-white disabled:opacity-50">{record.is_active ? "Deactivate" : "Activate"}</button><button type="button" disabled={busyId === record.id} onClick={() => removeRecord(record)} className="rounded-md border border-red-200 px-3 py-2 text-xs font-bold text-red-700 disabled:opacity-50">Delete</button></div>
            </article>
          ))}</div>
          <Pagination page={page} pages={pagination.pages} onChange={setPage} />
        </>
      )}
      {uploadType && <QuickMediaUpload type={uploadType} onClose={() => setUploadType("")} onUploaded={() => { setUploadType(""); setNotice("Current affair media uploaded and published."); setReload((value) => value + 1); }} />}
    </div>
  );
}

export default AdminCurrentAffairs;
