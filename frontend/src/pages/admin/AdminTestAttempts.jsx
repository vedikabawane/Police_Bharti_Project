import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getAdminTestAttempts } from "../../services/admin/adminTestAttemptService";

const PER_PAGE = 20;
const TEST_TYPES = [
  "subject",
  "topic",
  "mixed",
  "full_mock",
  "daily",
  "weekly",
  "previous_year",
];
const fieldClass = "w-full rounded-lg border border-pb-border bg-white px-3.5 py-2.5 text-sm text-pb-green outline-none focus:border-pb-khaki focus:ring-2 focus:ring-pb-khaki/20";

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function statusLabel(status) {
  return status === "submitted" ? "Submitted · पूर्ण" : "In progress · सुरू";
}

function AttemptStatus({ status }) {
  const completed = status === "submitted";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${completed ? "bg-[#e8eee3] text-pb-green" : "bg-[#f2ecda] text-pb-khaki"}`}>{statusLabel(status)}</span>;
}

function AttemptSummary({ attempt }) {
  return (
    <article className="rounded-lg border border-pb-border bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="break-words font-extrabold text-pb-green">{attempt.student_name}</h3>
          <p className="mt-0.5 break-all text-xs text-slate-500">{attempt.student_email}</p>
        </div>
        <AttemptStatus status={attempt.status} />
      </div>
      <p className="mt-4 break-words text-sm font-bold text-pb-green">{attempt.test_title}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-pb-khaki">{attempt.test_type?.replaceAll("_", " ")}</p>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <p><span className="block text-xs text-slate-500">Score</span><strong className="text-pb-green">{attempt.status === "submitted" ? `${attempt.score} / ${attempt.total_marks}` : "Pending"}</strong></p>
        <p><span className="block text-xs text-slate-500">Percentage</span><strong className="text-pb-green">{attempt.status === "submitted" ? `${attempt.percentage}%` : "Pending"}</strong></p>
        <p className="col-span-2 text-xs text-slate-600">{attempt.status === "submitted" ? `Correct ${attempt.correct_count} · Wrong ${attempt.wrong_count} · Skipped ${attempt.skipped_count}` : "Result counts are available after submission."}</p>
        <p className="col-span-2 text-xs text-slate-500">Completed: {formatDate(attempt.completed_at)}</p>
      </div>
      <Link to={`/admin/test-attempts/${attempt.attempt_id}`} className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-pb-green px-4 py-2.5 text-sm font-bold text-white hover:bg-pb-khaki">View attempt</Link>
    </article>
  );
}

function AdminTestAttempts() {
  const [attempts, setAttempts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, per_page: PER_PAGE, total: 0, pages: 0 });
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [testType, setTestType] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    let current = true;
    const load = async () => {
      setLoading(true);
      setError("");
      const params = { page, per_page: PER_PAGE };
      if (debouncedSearch) params.search = debouncedSearch;
      if (status) params.status = status;
      if (testType) params.test_type = testType;
      try {
        const response = await getAdminTestAttempts(params);
        if (!response?.success || !Array.isArray(response.data?.attempts) || !response.data?.pagination) {
          throw new Error(response?.message || "Attempt response is incomplete.");
        }
        if (current) {
          setAttempts(response.data.attempts);
          setPagination(response.data.pagination);
        }
      } catch {
        if (current) {
          setAttempts([]);
          setError("Unable to load test attempts. Please try again.");
        }
      } finally {
        if (current) setLoading(false);
      }
    };
    load();
    return () => { current = false; };
  }, [page, debouncedSearch, status, testType, reload]);

  const hasFilters = Boolean(search || status || testType);
  const resetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setStatus("");
    setTestType("");
    setPage(1);
  };
  const firstResult = pagination.total ? (pagination.page - 1) * pagination.per_page + 1 : 0;
  const lastResult = Math.min(pagination.page * pagination.per_page, pagination.total);

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-7 border-b border-pb-border pb-5">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-pb-khaki">ADMIN MONITORING</p>
        <h1 className="mt-2 text-2xl font-extrabold text-pb-green sm:text-3xl">Test Attempts / टेस्ट प्रयत्न</h1>
        <p className="mt-2 text-sm text-slate-600">Review student test activity and submitted results. This page is read only.</p>
      </div>

      <section className="grid gap-4 rounded-lg border border-pb-border bg-white p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-[minmax(0,1fr)_220px_220px_auto] lg:items-end">
        <div>
          <label htmlFor="attempt-search" className="mb-1.5 block text-sm font-bold text-pb-green">Search student or test</label>
          <input id="attempt-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, email, or test title" className={fieldClass} />
        </div>
        <div>
          <label htmlFor="attempt-status" className="mb-1.5 block text-sm font-bold text-pb-green">Attempt status</label>
          <select id="attempt-status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className={fieldClass}>
            <option value="">All statuses</option>
            <option value="in_progress">In progress</option>
            <option value="submitted">Submitted</option>
          </select>
        </div>
        <div>
          <label htmlFor="attempt-type" className="mb-1.5 block text-sm font-bold text-pb-green">Test type</label>
          <select id="attempt-type" value={testType} onChange={(event) => { setTestType(event.target.value); setPage(1); }} className={fieldClass}>
            <option value="">All types</option>
            {TEST_TYPES.map((type) => <option key={type} value={type}>{type.replaceAll("_", " ").toUpperCase()}</option>)}
          </select>
        </div>
        <button type="button" onClick={resetFilters} disabled={!hasFilters} className="rounded-lg border border-pb-border px-4 py-2.5 text-sm font-bold text-pb-green hover:bg-pb-light disabled:cursor-not-allowed disabled:opacity-50">Reset filters</button>
      </section>

      <section className="mt-6 min-w-0 overflow-hidden rounded-lg border border-pb-border bg-white">
        <div className="flex flex-col gap-1 border-b border-pb-border-soft px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <h2 className="font-extrabold text-pb-green">Student attempts</h2>
          {!loading && !error && <p className="text-xs font-semibold text-slate-500">{firstResult}–{lastResult} of {pagination.total}</p>}
        </div>
        {loading ? (
          <div role="status" className="px-5 py-12 text-center"><span className="mx-auto block h-8 w-8 animate-spin rounded-full border-4 border-pb-border border-t-pb-khaki" /><p className="mt-3 text-sm font-semibold text-pb-green">Loading attempts…</p></div>
        ) : error ? (
          <div role="alert" className="px-5 py-10 text-center"><p className="font-semibold text-red-700">{error}</p><button type="button" onClick={() => setReload((value) => value + 1)} className="mt-4 rounded-lg bg-pb-green px-4 py-2.5 text-sm font-bold text-white hover:bg-pb-khaki">Retry</button></div>
        ) : attempts.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm font-semibold text-slate-600">No test attempts match these filters.</p>
        ) : (
          <>
            <div className="space-y-3 p-3 md:hidden">{attempts.map((attempt) => <AttemptSummary key={attempt.attempt_id} attempt={attempt} />)}</div>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[1050px] border-collapse text-left text-sm">
                <thead className="bg-pb-light text-xs uppercase tracking-wide text-slate-600"><tr>
                  <th className="px-4 py-3">Student</th><th className="px-4 py-3">Test</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Score</th><th className="px-4 py-3">Correct / Wrong / Skipped</th><th className="px-4 py-3">Completed</th><th className="px-4 py-3">Action</th>
                </tr></thead>
                <tbody className="divide-y divide-pb-border-soft">{attempts.map((attempt) => <tr key={attempt.attempt_id} className="align-top">
                  <td className="px-4 py-4"><p className="font-bold text-pb-green">{attempt.student_name}</p><p className="mt-0.5 text-xs text-slate-500">{attempt.student_email}</p></td>
                  <td className="max-w-56 px-4 py-4 font-semibold text-pb-green">{attempt.test_title}</td>
                  <td className="px-4 py-4 text-xs font-bold uppercase text-pb-khaki">{attempt.test_type?.replaceAll("_", " ")}</td>
                  <td className="px-4 py-4"><AttemptStatus status={attempt.status} /></td>
                  <td className="px-4 py-4"><p className="font-bold text-pb-green">{attempt.status === "submitted" ? `${attempt.score} / ${attempt.total_marks}` : "Pending"}</p><p className="text-xs text-slate-500">{attempt.status === "submitted" ? `${attempt.percentage}%` : "—"}</p></td>
                  <td className="px-4 py-4 tabular-nums text-slate-700">{attempt.status === "submitted" ? `${attempt.correct_count} / ${attempt.wrong_count} / ${attempt.skipped_count}` : "—"}</td>
                  <td className="px-4 py-4 text-xs text-slate-600">{formatDate(attempt.completed_at)}</td>
                  <td className="px-4 py-4"><Link to={`/admin/test-attempts/${attempt.attempt_id}`} className="font-bold text-pb-khaki underline underline-offset-2 hover:text-pb-khaki">View details</Link></td>
                </tr>)}</tbody>
              </table>
            </div>
            <div className="flex flex-col gap-3 border-t border-pb-border-soft px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-semibold text-slate-500">Page {pagination.page} of {Math.max(1, pagination.pages)}</p>
              <div className="flex gap-2">
                <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1} className="rounded-lg border border-pb-border px-4 py-2 text-sm font-bold text-pb-green hover:bg-pb-light disabled:cursor-not-allowed disabled:opacity-50">Previous</button>
                <button type="button" onClick={() => setPage((value) => Math.min(pagination.pages, value + 1))} disabled={page >= pagination.pages} className="rounded-lg border border-pb-border px-4 py-2 text-sm font-bold text-pb-green hover:bg-pb-light disabled:cursor-not-allowed disabled:opacity-50">Next</button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

export default AdminTestAttempts;
