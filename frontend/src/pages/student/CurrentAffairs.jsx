import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import currentAffairCategories from "../../constants/currentAffairCategories";
import { getStudentCurrentAffairMedia, listStudentCurrentAffairs } from "../../services/currentAffairService";

const PER_PAGE = 12;
const inputClass = "w-full rounded-lg border border-pb-border bg-white px-3.5 py-2.5 text-sm text-pb-green outline-none focus:border-pb-khaki focus:ring-2 focus:ring-pb-khaki/20";

function formatDate(value) {
  if (!value) return "";
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Date(year, month - 1, day).toLocaleDateString("mr-IN", {
    day: "numeric", month: "long", year: "numeric",
  });
}

function getErrorMessage(error) {
  return error.response?.data?.message || error.message || "माहिती लोड करता आली नाही.";
}

function Pagination({ page, pages, onChange }) {
  if (pages < 2) return null;
  return (
    <nav aria-label="Current affairs pages" className="mt-7 flex flex-wrap items-center justify-center gap-2">
      <button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)} className="rounded-lg border border-pb-border px-3 py-2 text-sm font-bold text-pb-green disabled:opacity-40">मागील</button>
      <span aria-live="polite" className="px-2 text-sm font-semibold text-slate-600">Page {page} of {pages}</span>
      <button type="button" disabled={page >= pages} onClick={() => onChange(page + 1)} className="rounded-lg border border-pb-border px-3 py-2 text-sm font-bold text-pb-green disabled:opacity-40">पुढील</button>
    </nav>
  );
}

function CurrentAffairImage({ id, title }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    let active = true;
    let objectUrl = "";
    getStudentCurrentAffairMedia(id).then((blob) => {
      if (active) { objectUrl = URL.createObjectURL(blob); setSrc(objectUrl); }
    }).catch(() => { if (active) setSrc(""); });
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [id]);
  return src ? <img src={src} alt={title} loading="lazy" className="h-48 w-full rounded-lg object-cover" /> : <div aria-label="Loading image" className="h-48 w-full animate-pulse rounded-lg bg-pb-light" />;
}

function CurrentAffairs() {
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, per_page: PER_PAGE, total: 0, pages: 0 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("");
  const [publishedDate, setPublishedDate] = useState("");
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
      if (category) params.category = category;
      if (publishedDate) params.published_date = publishedDate;
      try {
        const response = await listStudentCurrentAffairs(params);
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
  }, [page, debouncedSearch, category, publishedDate, reload]);

  const updateFilter = (setter, value) => {
    setter(value);
    setPage(1);
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="rounded-2xl bg-pb-green p-5 text-white shadow-sm sm:p-7">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#d7c56f]">Police Bharti तयारी</p>
        <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">चालू घडामोडी</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-200">महत्त्वाच्या बातम्या आणि स्पर्धा परीक्षेसाठी उपयुक्त घडामोडी वाचा.</p>
      </header>

      <section aria-label="चालू घडामोडी शोधा" className="mt-5 grid gap-3 rounded-xl border border-pb-border bg-white p-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label htmlFor="student-current-search" className="mb-1.5 block text-xs font-bold text-pb-green">शोधा</label>
          <input id="student-current-search" type="search" value={search} onChange={(event) => updateFilter(setSearch, event.target.value)} placeholder="शीर्षक किंवा मजकूर" className={inputClass} />
        </div>
        <div>
          <label htmlFor="student-current-category" className="mb-1.5 block text-xs font-bold text-pb-green">विभाग</label>
          <select id="student-current-category" value={category} onChange={(event) => updateFilter(setCategory, event.target.value)} className={inputClass}>
            <option value="">सर्व विभाग</option>
            {currentAffairCategories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="student-current-date" className="mb-1.5 block text-xs font-bold text-pb-green">तारीखेनुसार पहा</label>
          <input id="student-current-date" type="date" value={publishedDate} onChange={(event) => updateFilter(setPublishedDate, event.target.value)} className={inputClass} />
        </div>
      </section>

      {error && <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><div className="flex flex-wrap items-center justify-between gap-3"><span>{error}</span><button type="button" onClick={() => setReload((value) => value + 1)} className="font-bold underline">पुन्हा प्रयत्न करा</button></div></div>}
      {!loading && !error && <p className="mt-5 text-sm font-semibold text-slate-500">एकूण {pagination.total} घडामोडी</p>}

      {loading ? (
        <div role="status" aria-label="चालू घडामोडी लोड होत आहेत" className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <div key={index} className="h-52 animate-pulse rounded-xl bg-white ring-1 ring-pb-border" />)}</div>
      ) : records.length === 0 && !error ? (
        <div className="mt-4 rounded-xl border border-dashed border-[#d9d2c3] bg-white px-5 py-12 text-center"><p className="font-bold text-pb-green">घडामोडी उपलब्ध नाहीत</p><p className="mt-1 text-sm text-slate-500">शोध किंवा विभाग बदलून पाहा.</p></div>
      ) : (
        <>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {records.map((record) => (
              <article key={record.id} className="flex min-w-0 flex-col rounded-xl border border-pb-border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-center justify-between gap-3"><span className="rounded-full bg-pb-light px-3 py-1 text-xs font-bold text-pb-green">{record.content_type || "TEXT"} · {record.category}</span><time dateTime={record.published_date} className="shrink-0 text-xs font-semibold text-slate-500">{formatDate(record.published_date)}</time></div>
                {record.content_type === "IMAGE" && <Link to={`/student/current-affairs/${record.id}`} aria-label={`View ${record.title}`} className="mt-4 block"><CurrentAffairImage id={record.id} title={record.title} /></Link>}
                {record.content_type === "PDF" && <div className="mt-4 flex h-32 items-center justify-center rounded-lg bg-pb-light"><span className="rounded-xl bg-white px-5 py-4 text-2xl font-black text-pb-khaki shadow-sm">PDF</span></div>}
                <h2 className="mt-4 break-words text-lg font-extrabold leading-7 text-pb-green">{record.title}</h2>
                {record.content_type === "TEXT" || !record.content_type ? <p className="mt-2 line-clamp-4 flex-1 whitespace-pre-line text-sm leading-6 text-slate-600">{record.summary || record.content}</p> : <p className="mt-2 flex-1 break-all text-sm text-slate-500">{record.original_filename}</p>}
                <Link to={`/student/current-affairs/${record.id}`} className="mt-5 inline-flex w-fit items-center rounded-lg bg-pb-green px-4 py-2.5 text-sm font-bold text-white hover:bg-pb-khaki">{record.content_type === "PDF" ? "PDF पाहा" : record.content_type === "IMAGE" ? "पहा" : "सविस्तर वाचा"}</Link>
              </article>
            ))}
          </div>
          <Pagination page={page} pages={pagination.pages} onChange={setPage} />
        </>
      )}
    </div>
  );
}

export default CurrentAffairs;
