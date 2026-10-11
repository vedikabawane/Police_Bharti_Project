import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { listStudentRecruitmentNotices } from "../../services/recruitmentNoticeService";

const PER_PAGE = 12;
const NOTICE_TYPES = ["RECRUITMENT", "ADVERTISEMENT", "EXAM_DATE", "ANSWER_KEY", "RESULT", "PHYSICAL_TEST", "DOCUMENT_VERIFICATION", "IMPORTANT_UPDATE", "OTHER"];
const inputClass = "w-full rounded-lg border border-pb-border bg-white px-3.5 py-2.5 text-sm text-pb-green outline-none focus:border-pb-khaki focus:ring-2 focus:ring-pb-khaki/20";

function formatDate(value) {
  if (!value) return "";
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Date(year, month - 1, day).toLocaleDateString("mr-IN", { day: "numeric", month: "short", year: "numeric" });
}

function display(value) {
  return value === null || value === undefined || value === "" ? "माहिती उपलब्ध नाही" : value;
}

function errorMessage(error) {
  return error.response?.data?.message || error.message || "सूचना लोड करता आली नाही.";
}

function Pagination({ page, pages, onChange }) {
  if (pages < 2) return null;
  return <nav aria-label="Recruitment notice pages" className="mt-7 flex flex-wrap items-center justify-center gap-2"><button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)} className="min-h-11 rounded-lg border border-pb-border px-4 py-2 text-sm font-bold disabled:opacity-40">मागील</button><span aria-live="polite" className="px-2 text-sm font-semibold text-slate-600">Page {page} of {pages}</span><button type="button" disabled={page >= pages} onClick={() => onChange(page + 1)} className="min-h-11 rounded-lg border border-pb-border px-4 py-2 text-sm font-bold disabled:opacity-40">पुढील</button></nav>;
}

function RecruitmentNotices() {
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, per_page: PER_PAGE, total: 0, pages: 0 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [noticeType, setNoticeType] = useState("");
  const [year, setYear] = useState("");
  const [department, setDepartment] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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
      try {
        const response = await listStudentRecruitmentNotices(params);
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
  }, [page, debouncedSearch, noticeType, year, department, reload]);

  const updateFilter = (setter, value) => {
    setter(value);
    setPage(1);
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="rounded-2xl bg-pb-green p-5 text-white shadow-sm sm:p-7"><p className="text-xs font-bold uppercase tracking-[0.15em] text-[#d7c56f]">Maharashtra Police Bharti</p><h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">भरती सूचना</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-200">भरती जाहिराती, महत्त्वाच्या तारखा आणि अधिकृत अपडेट्स येथे पहा.</p></header>
      <section aria-label="भरती सूचना शोधा" className="mt-5 grid gap-3 rounded-xl border border-pb-border bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2"><label htmlFor="student-notice-search" className="mb-1.5 block text-xs font-bold text-pb-green">शोधा</label><input id="student-notice-search" type="search" value={search} onChange={(event) => updateFilter(setSearch, event.target.value)} placeholder="सूचना, पद किंवा विभाग" className={inputClass} /></div>
        <div><label htmlFor="student-notice-type" className="mb-1.5 block text-xs font-bold text-pb-green">सूचनेचा प्रकार</label><select id="student-notice-type" value={noticeType} onChange={(event) => updateFilter(setNoticeType, event.target.value)} className={inputClass}><option value="">सर्व प्रकार</option>{NOTICE_TYPES.map((type) => <option key={type} value={type}>{type.replaceAll("_", " ")}</option>)}</select></div>
        <div><label htmlFor="student-notice-year" className="mb-1.5 block text-xs font-bold text-pb-green">भरती वर्ष</label><input id="student-notice-year" type="number" min="1900" max="2200" value={year} onChange={(event) => updateFilter(setYear, event.target.value)} placeholder="सर्व वर्षे" className={inputClass} /></div>
        <div className="sm:col-span-2 lg:col-span-4"><label htmlFor="student-notice-department" className="mb-1.5 block text-xs font-bold text-pb-green">विभाग</label><input id="student-notice-department" value={department} onChange={(event) => updateFilter(setDepartment, event.target.value)} placeholder="सर्व विभाग" className={inputClass} /></div>
      </section>

      {error && <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><div className="flex flex-wrap items-center justify-between gap-3"><span>{error}</span><button type="button" onClick={() => setReload((value) => value + 1)} className="font-bold underline">पुन्हा प्रयत्न करा</button></div></div>}
      {!loading && !error && <p className="mt-5 text-sm font-semibold text-slate-500">एकूण {pagination.total} सूचना</p>}
      {loading ? <div role="status" aria-label="भरती सूचना लोड होत आहेत" className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <div key={index} className="h-56 animate-pulse rounded-xl bg-white ring-1 ring-pb-border" />)}</div>
        : records.length === 0 && !error ? <div className="mt-4 rounded-xl border border-dashed border-[#d9d2c3] bg-white px-5 py-12 text-center"><p className="font-bold text-pb-green">सूचना उपलब्ध नाही</p><p className="mt-1 text-sm text-slate-500">शोध किंवा फिल्टर बदलून पाहा.</p></div>
          : <>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{records.map((record) => <article key={record.id} className="flex min-w-0 flex-col rounded-xl border border-pb-border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><div className="flex items-center justify-between gap-3"><span className="rounded-full bg-pb-light px-3 py-1 text-xs font-bold text-pb-green">{record.notice_type.replaceAll("_", " ")}</span><time dateTime={record.published_date} className="shrink-0 text-xs font-semibold text-slate-500">{formatDate(record.published_date)}</time></div><h2 className="mt-4 break-words text-lg font-extrabold leading-7 text-pb-green">{record.title}</h2><p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{record.summary || ""}</p><dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-xs"><div><dt className="font-semibold text-slate-500">भरती वर्ष</dt><dd className="mt-0.5 font-bold text-pb-green">{display(record.recruitment_year)}</dd></div><div><dt className="font-semibold text-slate-500">पद</dt><dd className="mt-0.5 break-words font-bold text-pb-green">{display(record.post_name)}</dd></div><div><dt className="font-semibold text-slate-500">जागा</dt><dd className="mt-0.5 font-bold text-pb-green">{display(record.vacancies)}</dd></div><div><dt className="font-semibold text-slate-500">अर्जाची अंतिम तारीख</dt><dd className="mt-0.5 font-bold text-pb-green">{display(formatDate(record.application_end_date))}</dd></div><div><dt className="font-semibold text-slate-500">Exam date</dt><dd className="mt-0.5 font-bold text-pb-green">{display(formatDate(record.exam_date))}</dd></div></dl>{record.pdf_available && <p className="mt-3 text-xs font-bold text-pb-green">अधिकृत PDF उपलब्ध</p>}<Link to={`/student/recruitment-notices/${record.id}`} className="mt-5 inline-flex w-fit items-center rounded-lg bg-pb-green px-4 py-2.5 text-sm font-bold text-white hover:bg-pb-khaki">तपशील पहा</Link></article>)}</div>
            <Pagination page={page} pages={pagination.pages} onChange={setPage} />
          </>}
    </div>
  );
}

export default RecruitmentNotices;