import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  deleteRecruitmentNotice,
  listRecruitmentNotices,
  updateRecruitmentNoticeStatus,
} from "../../services/admin/adminRecruitmentNoticeService";

const PER_PAGE = 20;
const TYPES = ["RECRUITMENT", "ADVERTISEMENT", "EXAM_DATE", "ANSWER_KEY", "RESULT", "PHYSICAL_TEST", "DOCUMENT_VERIFICATION", "IMPORTANT_UPDATE", "OTHER"];
const inputClass = "w-full rounded-lg border border-pb-border bg-white px-3.5 py-2.5 text-sm text-pb-green outline-none focus:border-pb-khaki focus:ring-2 focus:ring-pb-khaki/20";

function formatDate(value) {
  if (!value) return "—";
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Date(year, month - 1, day).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function errorMessage(error) {
  return error.response?.data?.message || error.message || "Something went wrong.";
}

function Pagination({ page, pages, onChange }) {
  if (pages < 2) return null;
  return <nav aria-label="Recruitment notice pages" className="mt-6 flex flex-wrap items-center justify-center gap-2"><button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)} className="min-h-11 rounded-lg border border-pb-border px-4 py-2 text-sm font-bold disabled:opacity-40">Previous</button><span aria-live="polite" className="px-2 text-sm font-semibold text-slate-600">Page {page} of {pages}</span><button type="button" disabled={page >= pages} onClick={() => onChange(page + 1)} className="min-h-11 rounded-lg border border-pb-border px-4 py-2 text-sm font-bold disabled:opacity-40">Next</button></nav>;
}

function AdminRecruitmentNotices() {
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, per_page: PER_PAGE, total: 0, pages: 0 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [noticeType, setNoticeType] = useState("");
  const [year, setYear] = useState("");
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState("");
  const [publishedDate, setPublishedDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reload, setReload] = useState(0);

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
      if (noticeType) params.notice_type = noticeType;
      if (year) params.recruitment_year = year;
      if (department.trim()) params.department = department.trim();
      if (status) params.is_active = status;
      if (publishedDate) params.published_date = publishedDate;
      try {
        const response = await listRecruitmentNotices(params);
        const data = response?.data;
        if (!response?.success || !Array.isArray(data?.recruitment_notices) || !data?.pagination) {
          throw new Error(response?.message || "Recruitment notice response was incomplete.");
        }
        if (active) {
          setRecords(data.recruitment_notices);
          setPagination(data.pagination);
          if (data.pagination.pages > 0 && page > data.pagination.pages) setPage(data.pagination.pages);
        }
      } catch (requestError) {
        if (active) setError(errorMessage(requestError));
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [page, debouncedSearch, noticeType, year, department, status, publishedDate, reload]);

  const updateFilter = (setter, value) => {
    setter(value);
    setPage(1);
    setNotice("");
  };

  const toggleStatus = async (record) => {
    setBusyId(record.id);
    setError("");
    setNotice("");
    try {
      const response = await updateRecruitmentNoticeStatus(record.id, !record.is_active);
      if (!response?.success) throw new Error(response?.message || "Could not update notice status.");
      setNotice(`“${record.title}” is now ${record.is_active ? "inactive" : "active"}.`);
      setReload((value) => value + 1);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusyId(null);
    }
  };

  const removeNotice = async (record) => {
    if (!window.confirm(`Delete “${record.title}” and its stored PDF permanently? This cannot be undone.`)) return;
    setBusyId(record.id);
    setError("");
    setNotice("");
    try {
      const response = await deleteRecruitmentNotice(record.id);
      if (!response?.success) throw new Error(response?.message || "Could not delete notice.");
      setNotice("Recruitment notice deleted.");
      setReload((value) => value + 1);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusyId(null);
    }
  };

  const actions = (record) => <div className="flex flex-wrap gap-2"><Link to={`/admin/recruitment-notices/${record.id}/edit`} className="rounded-md border border-pb-border px-3 py-1.5 text-xs font-bold text-pb-green hover:bg-pb-light">Edit</Link><button type="button" disabled={busyId === record.id} onClick={() => toggleStatus(record)} className="rounded-md bg-pb-green px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50">{record.is_active ? "Deactivate" : "Activate"}</button><button type="button" disabled={busyId === record.id} onClick={() => removeNotice(record)} className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-50">Delete</button></div>;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-pb-khaki">Recruitment updates</p><h1 className="mt-1 text-2xl font-extrabold text-pb-green sm:text-3xl">Recruitment Notices</h1><p className="mt-2 text-sm leading-6 text-slate-600">Manage official advertisements, dates, results, and Police Bharti updates.</p></div><Link to="/admin/recruitment-notices/new" className="inline-flex items-center justify-center rounded-lg bg-pb-green px-4 py-2.5 text-sm font-bold text-white hover:bg-pb-khaki">+ Add notice</Link></header>

      <section aria-label="Recruitment notice filters" className="mt-6 grid gap-3 rounded-xl border border-pb-border bg-white p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <div className="xl:col-span-2"><label htmlFor="admin-notice-search" className="mb-1.5 block text-xs font-bold text-pb-green">Search</label><input id="admin-notice-search" type="search" value={search} onChange={(event) => updateFilter(setSearch, event.target.value)} placeholder="Title, post or department" className={inputClass} /></div>
        <div><label htmlFor="admin-notice-type" className="mb-1.5 block text-xs font-bold text-pb-green">Notice type</label><select id="admin-notice-type" value={noticeType} onChange={(event) => updateFilter(setNoticeType, event.target.value)} className={inputClass}><option value="">All types</option>{TYPES.map((type) => <option key={type} value={type}>{type.replaceAll("_", " ")}</option>)}</select></div>
        <div><label htmlFor="admin-notice-year" className="mb-1.5 block text-xs font-bold text-pb-green">Recruitment year</label><input id="admin-notice-year" type="number" min="1900" max="2200" value={year} onChange={(event) => updateFilter(setYear, event.target.value)} placeholder="All years" className={inputClass} /></div>
        <div><label htmlFor="admin-notice-department" className="mb-1.5 block text-xs font-bold text-pb-green">Department</label><input id="admin-notice-department" value={department} onChange={(event) => updateFilter(setDepartment, event.target.value)} placeholder="All departments" className={inputClass} /></div>
        <div><label htmlFor="admin-notice-status" className="mb-1.5 block text-xs font-bold text-pb-green">Status</label><select id="admin-notice-status" value={status} onChange={(event) => updateFilter(setStatus, event.target.value)} className={inputClass}><option value="">All statuses</option><option value="true">Active</option><option value="false">Inactive</option></select></div>
        <div><label htmlFor="admin-notice-date" className="mb-1.5 block text-xs font-bold text-pb-green">Published date</label><input id="admin-notice-date" type="date" value={publishedDate} onChange={(event) => updateFilter(setPublishedDate, event.target.value)} className={inputClass} /></div>
      </section>
      {error && <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {notice && <div role="status" className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{notice}</div>}
      {!loading && <p className="mt-5 text-sm font-semibold text-slate-500">{pagination.total} notice{pagination.total === 1 ? "" : "s"}</p>}

      {loading ? <div role="status" className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <div key={index} className="h-48 animate-pulse rounded-xl bg-white ring-1 ring-pb-border" />)}</div>
        : records.length === 0 ? <div className="mt-4 rounded-xl border border-dashed border-[#d9d2c3] bg-white px-5 py-12 text-center"><p className="font-bold text-pb-green">No notices found</p><p className="mt-1 text-sm text-slate-500">Try changing filters or add a notice.</p></div>
          : <>
            <div className="mt-4 hidden overflow-hidden rounded-xl border border-pb-border bg-white xl:block"><div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left text-sm"><thead className="bg-pb-light text-xs uppercase tracking-wide text-slate-600"><tr><th className="px-4 py-3">Notice</th><th className="px-4 py-3">Type / year</th><th className="px-4 py-3">Published</th><th className="px-4 py-3">Deadline</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-pb-border-soft">{records.map((record) => <tr key={record.id}><td className="max-w-md px-4 py-3"><p className="truncate font-bold text-pb-green">{record.title}</p><p className="mt-1 text-xs text-slate-500">{record.department || "—"} · {record.post_name || "—"} · {record.vacancies ?? "—"} vacancies</p></td><td className="px-4 py-3 text-slate-700">{record.notice_type.replaceAll("_", " ")}<p className="mt-1 text-xs text-slate-500">{record.recruitment_year || "—"}</p></td><td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(record.published_date)}</td><td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(record.application_end_date)}</td><td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${record.is_active ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-600"}`}>{record.is_active ? "Active" : "Inactive"}</span>{record.pdf_available && <span className="ml-2 rounded-full bg-pb-light px-2 py-1 text-[10px] font-bold text-pb-green">PDF</span>}</td><td className="px-4 py-3"><div className="flex justify-end">{actions(record)}</div></td></tr>)}</tbody></table></div></div>
            <div className="mt-4 grid gap-3 xl:hidden">{records.map((record) => <article key={record.id} className="rounded-xl border border-pb-border bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="break-words font-extrabold text-pb-green">{record.title}</p><p className="mt-1 text-xs font-semibold text-pb-khaki">{record.notice_type.replaceAll("_", " ")} · {formatDate(record.published_date)}</p></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${record.is_active ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-600"}`}>{record.is_active ? "Active" : "Inactive"}</span></div><p className="mt-3 text-sm leading-6 text-slate-600">{record.department || "—"} · {record.post_name || "—"} · {record.vacancies ?? "—"} vacancies</p><p className="mt-1 text-xs text-slate-500">Year {record.recruitment_year || "—"} · Deadline {formatDate(record.application_end_date)}</p><p className="mt-1 text-xs text-slate-500">Exam date {formatDate(record.exam_date)}</p>{record.pdf_available && <p className="mt-2 text-xs font-bold text-pb-green">Official PDF attached</p>}<div className="mt-4">{actions(record)}</div></article>)}</div>
            <Pagination page={page} pages={pagination.pages} onChange={setPage} />
          </>}
    </div>
  );
}

export default AdminRecruitmentNotices;