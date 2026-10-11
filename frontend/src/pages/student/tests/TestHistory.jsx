import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getTopicsBySubject, getSubjects } from "../../../services/studyService";
import { getStudentTestHistory } from "../../../services/testService";

const PER_PAGE = 10;
const TEST_TYPES = [
  ["subject", "विषय चाचणी"],
  ["topic", "घटक चाचणी"],
  ["mixed", "मिश्र चाचणी"],
  ["full_mock", "पूर्ण सराव चाचणी"],
  ["daily", "दैनिक चाचणी"],
  ["weekly", "साप्ताहिक चाचणी"],
  ["previous_year", "मागील वर्षाची चाचणी"],
];

function formatNumber(value) {
  if (value === null || value === undefined || value === "") return "—";
  const number = Number(value);
  return Number.isInteger(number)
    ? String(number)
    : number.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("mr-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getTypeLabel(type) {
  return TEST_TYPES.find(([value]) => value === type?.toLowerCase())?.[1] || type || "चाचणी";
}

function HistoryMetric({ label, value }) {
  return (
    <div className="rounded-xl bg-pb-light px-3 py-3">
      <p className="text-[11px] font-bold text-slate-500 sm:text-xs">{label}</p>
      <p className="mt-1 break-words text-sm font-extrabold text-pb-green sm:text-base">{value}</p>
    </div>
  );
}

function TestHistory() {
  const [history, setHistory] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [filters, setFilters] = useState({ type: "", subject_id: "", topic_id: "" });
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterError, setFilterError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let active = true;
    getSubjects()
      .then((response) => {
        if (active && response.success && Array.isArray(response.data)) {
          setSubjects(response.data);
        }
      })
      .catch(() => {
        if (active) setFilterError("विषयांची यादी लोड करता आली नाही.");
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!filters.subject_id) return undefined;
    let active = true;
    getTopicsBySubject(filters.subject_id)
      .then((response) => {
        if (active && response.success && Array.isArray(response.data)) {
          setTopics(response.data);
        }
      })
      .catch(() => {
        if (active) setFilterError("घटकांची यादी लोड करता आली नाही.");
      });
    return () => { active = false; };
  }, [filters.subject_id]);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = Object.fromEntries(
        Object.entries({ ...filters, search, page, per_page: PER_PAGE })
          .filter(([, value]) => value !== ""),
      );
      const response = await getStudentTestHistory(params);
      if (!response?.success || !Array.isArray(response.data?.history)) {
        throw new Error(response?.message || "इतिहास लोड करता आला नाही.");
      }
      setHistory(response.data.history);
      setPagination(response.data.pagination || { page, pages: 0, total: response.data.history.length });
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || "इतिहास लोड करताना समस्या आली.");
    } finally {
      setLoading(false);
    }
  }, [filters, page, search]);

  useEffect(() => {
    Promise.resolve().then(loadHistory);
  }, [loadHistory]);

  const updateFilter = (name, value) => {
    setPage(1);
    setFilterError("");
    if (name === "subject_id") {
      setTopics([]);
      setFilters((current) => ({ ...current, subject_id: value, topic_id: "" }));
      return;
    }
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const updateSearch = (value) => {
    setPage(1);
    setSearchInput(value);
  };

  return (
    <main className="min-h-screen bg-pb-light">
      <header className="border-b border-pb-border bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-4 py-8 sm:px-6 lg:px-8">
          <div>
            <p className="text-sm font-bold text-pb-khaki">सराव चाचण्या</p>
            <h1 className="mt-2 text-2xl font-extrabold text-pb-green sm:text-3xl">माझ्या चाचण्यांचा इतिहास</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">पूर्ण केलेल्या चाचण्या आणि तुमची कामगिरी येथे पहा.</p>
          </div>
          <Link to="/student/tests" className="hidden shrink-0 rounded-xl bg-pb-green px-4 py-3 text-sm font-bold text-white transition hover:bg-pb-khaki sm:inline-flex">चाचण्यांकडे परत</Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-4 rounded-2xl bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4 sm:p-5">
          <label className="text-sm font-semibold text-slate-700 lg:col-span-2">
            चाचणी शोधा
            <input
              type="search"
              value={searchInput}
              onChange={(event) => updateSearch(event.target.value)}
              placeholder="चाचणीचे नाव"
              className="mt-2 w-full rounded-xl border border-pb-border px-3 py-2.5 font-normal outline-none focus:border-pb-khaki"
            />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            चाचणीचा प्रकार
            <select value={filters.type} onChange={(event) => updateFilter("type", event.target.value)} className="mt-2 w-full rounded-xl border border-pb-border bg-white px-3 py-2.5 font-normal outline-none focus:border-pb-khaki">
              <option value="">सर्व प्रकार</option>
              {TEST_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700">
            विषय
            <select value={filters.subject_id} onChange={(event) => updateFilter("subject_id", event.target.value)} className="mt-2 w-full rounded-xl border border-pb-border bg-white px-3 py-2.5 font-normal outline-none focus:border-pb-khaki">
              <option value="">सर्व विषय</option>
              {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
            </select>
          </label>
          {filters.subject_id && (
            <label className="text-sm font-semibold text-slate-700 sm:col-span-2 lg:col-span-2">
              घटक
              <select value={filters.topic_id} onChange={(event) => updateFilter("topic_id", event.target.value)} className="mt-2 w-full rounded-xl border border-pb-border bg-white px-3 py-2.5 font-normal outline-none focus:border-pb-khaki">
                <option value="">सर्व घटक</option>
                {topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}
              </select>
            </label>
          )}
        </div>
        {filterError && <p role="status" className="text-sm font-semibold text-pb-khaki">{filterError}</p>}

        {loading ? (
          <div role="status" aria-live="polite" className="rounded-2xl bg-white p-10 text-center text-sm font-semibold text-slate-600 shadow-sm">
            <span className="mx-auto mb-3 block h-9 w-9 animate-spin rounded-full border-4 border-pb-border border-t-pb-khaki" />
            चाचण्यांचा इतिहास लोड होत आहे...
          </div>
        ) : error ? (
          <div role="alert" className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
            <p className="font-bold text-red-700">{error}</p>
            <button type="button" onClick={loadHistory} className="mt-4 rounded-xl bg-pb-green px-5 py-3 text-sm font-bold text-white hover:bg-pb-khaki">पुन्हा प्रयत्न करा</button>
          </div>
        ) : history.length === 0 ? (
          <div className="rounded-2xl border border-[#e7e2d6] bg-white px-5 py-12 text-center shadow-sm">
            <p className="text-lg font-extrabold text-pb-green">तुम्ही अजून कोणतीही चाचणी पूर्ण केलेली नाही.</p>
            <Link to="/student/tests" className="mt-5 inline-flex rounded-xl bg-pb-green px-5 py-3 text-sm font-bold text-white hover:bg-pb-khaki">चाचणी सुरू करा</Link>
          </div>
        ) : (
          <>
            <p className="text-sm font-semibold text-slate-600">एकूण पूर्ण चाचण्या: {pagination.total}</p>
            <div className="space-y-4">
              {history.map((attempt) => {
                const improvement = attempt.improvement_percentage_points;
                const improvementText = improvement === null || improvement === undefined
                  ? "मागील प्रयत्न नाही"
                  : `${improvement > 0 ? "+" : ""}${formatNumber(improvement)} टक्के गुण`;
                return (
                  <article key={attempt.attempt_id} className="rounded-2xl border border-[#e7e2d6] bg-white p-4 shadow-sm sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="break-words text-lg font-extrabold text-pb-green sm:text-xl">{attempt.test_title}</h2>
                          <span className="rounded-full bg-[#f2ecda] px-3 py-1 text-xs font-bold text-pb-khaki">{getTypeLabel(attempt.test_type)}</span>
                        </div>
                        {(attempt.subject_name || attempt.topic_name) && (
                          <p className="mt-2 text-sm text-slate-600">
                            {[attempt.subject_name, attempt.topic_name].filter(Boolean).join(" · ")}
                          </p>
                        )}
                        <p className="mt-2 text-xs font-medium text-slate-500">पूर्ण केले: {formatDate(attempt.completed_at)}</p>
                      </div>
                      <Link to={`/student/tests/${attempt.test_id}/result/${attempt.attempt_id}`} className="inline-flex shrink-0 justify-center rounded-xl bg-pb-green px-4 py-3 text-sm font-bold text-white transition hover:bg-pb-khaki">निकाल पहा</Link>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
                      <HistoryMetric label="गुण" value={`${formatNumber(attempt.score)} / ${formatNumber(attempt.total_marks)}`} />
                      <HistoryMetric label="टक्केवारी" value={`${formatNumber(attempt.percentage)}%`} />
                      <HistoryMetric label="अचूकता" value={`${formatNumber(attempt.accuracy)}%`} />
                      <HistoryMetric label="बरोबर" value={attempt.correct} />
                      <HistoryMetric label="चुकीची" value={attempt.wrong} />
                      <HistoryMetric label="वगळलेली" value={attempt.skipped} />
                      <HistoryMetric label="प्रयत्न" value={attempt.attempted} />
                      <HistoryMetric label="क्रमांक" value={attempt.rank ? `#${attempt.rank}` : "—"} />
                      <HistoryMetric label="मागील प्रयत्नापासून सुधारणा" value={improvementText} />
                      <HistoryMetric label="वेळ" value={`${Math.floor((attempt.time_taken_seconds || 0) / 60)} मि.`} />
                    </div>
                  </article>
                );
              })}
            </div>

            <nav aria-label="इतिहास पृष्ठे" className="flex flex-col items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm sm:flex-row">
              <p className="text-sm font-medium text-slate-600">पृष्ठ {pagination.page} / {pagination.pages || 1}</p>
              <div className="flex gap-2">
                <button type="button" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="rounded-lg border border-pb-border px-4 py-2 text-sm font-bold text-pb-green disabled:cursor-not-allowed disabled:opacity-40">मागील</button>
                <button type="button" disabled={page >= pagination.pages} onClick={() => setPage((current) => current + 1)} className="rounded-lg bg-pb-green px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">पुढील</button>
              </div>
            </nav>
          </>
        )}
      </section>
    </main>
  );
}

export default TestHistory;
