import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getSubjects, getTopicsBySubject } from "../../../services/studyService";
import { getTests } from "../../../services/testService";

const TEST_TYPES = [
  ["subject", "विषय चाचणी"],
  ["topic", "विषयघटक चाचणी"],
  ["mixed", "मिश्र चाचणी"],
  ["full_mock", "पूर्ण सराव चाचणी"],
  ["daily", "दैनिक चाचणी"],
  ["weekly", "साप्ताहिक चाचणी"],
  ["previous_year", "मागील वर्षाची चाचणी"],
];

function getTestTypeLabel(testType) {
  return TEST_TYPES.find(([value]) => value === testType?.toLowerCase())?.[1] || "सराव चाचणी";
}

function StudentTests() {
  const [tests, setTests] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [filters, setFilters] = useState({ search: "", test_type: "", subject_id: "", topic_id: "" });
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [filterError, setFilterError] = useState("");
  const [error, setError] = useState("");

  const loadTests = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = Object.fromEntries(
        Object.entries({ ...filters, page, per_page: 12 }).filter(([, value]) => value !== ""),
      );
      const response = await getTests(params);
      if (!response.success || !Array.isArray(response.data?.tests)) {
        throw new Error("Unexpected tests response");
      }
      setTests(response.data.tests);
      setPagination(response.data.pagination || { page, pages: 0, total: response.data.tests.length });
    } catch {
      setError("चाचण्या लोड करता आल्या नाहीत. पुन्हा प्रयत्न करा.");
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    Promise.resolve().then(loadTests);
  }, [loadTests]);

  useEffect(() => {
    let current = true;
    getSubjects()
      .then((response) => {
        if (current && response.success && Array.isArray(response.data)) setSubjects(response.data);
      })
      .catch(() => {
        if (current) setFilterError("विषयांची यादी लोड झाली नाही.");
      });
    return () => { current = false; };
  }, []);

  useEffect(() => {
    if (!filters.subject_id) {
      return undefined;
    }
    let current = true;
    getTopicsBySubject(filters.subject_id)
      .then((response) => {
        if (current && response.success && Array.isArray(response.data)) setTopics(response.data);
      })
      .catch(() => {
        if (current) setFilterError("विषयघटकांची यादी लोड झाली नाही.");
      });
    return () => { current = false; };
  }, [filters.subject_id]);

  const updateFilter = (name, value) => {
    setPage(1);
    setFilterError("");
    if (name === "subject") setTopics([]);
    setFilters((current) => ({
      ...current,
      [name]: value,
      ...(name === "subject_id" ? { topic_id: "" } : {}),
    }));
  };

  return (
    <div className="min-h-screen bg-pb-light">
      <header className="border-b border-pb-border/70 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-3.5 py-4 sm:px-6 sm:py-6 lg:px-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-pb-khaki">
              <Link to="/student/dashboard" className="hover:underline">Dashboard</Link>
              <span>/</span>
              <span className="text-slate-500">सराव चाचण्या</span>
            </div>
            <h1 className="mt-1 text-xl font-extrabold text-pb-green sm:text-2xl lg:text-3xl">उपलब्ध चाचण्या</h1>
            <p className="mt-1 max-w-2xl text-xs sm:text-sm text-slate-500">चाचणी निवडा आणि परीक्षेची तयारी सुरू करा.</p>
          </div>
          <Link
            to="/student/tests/history"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-pb-border bg-white px-3.5 py-2 text-xs font-bold text-pb-green shadow-xs transition hover:bg-pb-light active:scale-95 sm:px-4 sm:py-2.5 sm:text-sm"
          >
            <span>माझा इतिहास 📜</span>
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl space-y-6 px-4 py-7 sm:px-6 lg:px-8">
        <div className="grid gap-4 rounded-2xl bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4 sm:p-5">
          <label className="text-sm font-semibold text-slate-700 lg:col-span-2">
            चाचणी शोधा
            <input value={filters.search} onChange={(event) => updateFilter("search", event.target.value)} placeholder="चाचणीचे नाव" className="mt-2 w-full rounded-xl border border-pb-border px-3 py-2.5 font-normal outline-none focus:border-pb-khaki" />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            चाचणी प्रकार
            <select value={filters.test_type} onChange={(event) => updateFilter("test_type", event.target.value)} className="mt-2 w-full rounded-xl border border-pb-border bg-white px-3 py-2.5 font-normal outline-none focus:border-pb-khaki">
              <option value="">सर्व प्रकार</option>
              {TEST_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700">
            विषय
            <select value={filters.subject_id} onChange={(event) => updateFilter("subject_id", event.target.value)} className="mt-2 w-full rounded-xl border border-pb-border bg-white px-3 py-2.5 font-normal outline-none focus:border-pb-khaki">
              <option value="">सर्व विषय</option>
              {subjects.filter((subject) => subject.is_active !== false).map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700">
            विषयघटक
            <select value={filters.topic_id} onChange={(event) => updateFilter("topic_id", event.target.value)} disabled={!filters.subject_id} className="mt-2 w-full rounded-xl border border-pb-border bg-white px-3 py-2.5 font-normal outline-none focus:border-pb-khaki disabled:bg-slate-50">
              <option value="">सर्व विषयघटक</option>
              {topics.filter((topic) => topic.is_active !== false).map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}
            </select>
          </label>
          <div className="flex items-end">
            <button type="button" onClick={() => { setPage(1); setFilters({ search: "", test_type: "", subject_id: "", topic_id: "" }); }} className="w-full rounded-xl border border-[#d8d1bf] px-4 py-2.5 text-sm font-bold text-pb-green hover:bg-pb-light">फिल्टर काढा</button>
          </div>
          {filterError && <p role="alert" className="text-sm text-amber-700 sm:col-span-2 lg:col-span-4">{filterError}</p>}
        </div>

        {loading ? (
          <div role="status" aria-live="polite" className="rounded-2xl bg-white p-10 text-center text-sm font-medium text-slate-600 shadow-sm"><span className="mx-auto mb-3 block h-9 w-9 animate-spin rounded-full border-4 border-pb-border border-t-pb-khaki" />चाचण्या लोड होत आहेत...</div>
        ) : error ? (
          <div role="alert" className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm"><p className="font-bold text-red-700">{error}</p><button type="button" onClick={loadTests} className="mt-4 rounded-xl bg-pb-green px-5 py-3 text-sm font-bold text-white hover:bg-pb-khaki">पुन्हा प्रयत्न करा</button></div>
        ) : tests.length === 0 ? (
          <div className="rounded-2xl bg-white px-6 py-12 text-center shadow-sm"><div aria-hidden="true" className="text-3xl">📭</div><h2 className="mt-4 text-lg font-extrabold text-pb-green">सध्या चाचण्या उपलब्ध नाहीत.</h2><p className="mt-2 text-sm text-slate-500">फिल्टर बदलून पुन्हा पाहा.</p></div>
        ) : (
          <>
            <div className="flex items-end justify-between gap-4"><h2 className="text-xl font-extrabold text-pb-green">उपलब्ध चाचण्या</h2><p className="text-sm text-slate-500">एकूण {pagination.total || 0} चाचण्या</p></div>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {tests.map((test) => (
                <article key={test.id} className="flex h-full min-w-0 flex-col rounded-2xl border border-pb-border-soft bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-6">
                  <div className="flex items-start justify-between gap-3"><span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-pb-light text-2xl">📋</span><span className="rounded-full bg-pb-green/10 px-3 py-1.5 text-xs font-bold text-pb-green">{getTestTypeLabel(test.test_type)}</span></div>
                  <h3 className="mt-5 break-words text-lg font-extrabold text-pb-green">{test.title}</h3>
                  {test.description && <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">{test.description}</p>}
                  <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-pb-border-soft pt-4 text-sm">
                    <div><dt className="text-xs font-semibold text-slate-500">विषय</dt><dd className="mt-1 break-words font-bold text-pb-green">{test.subject || "—"}</dd></div>
                    <div><dt className="text-xs font-semibold text-slate-500">विषयघटक</dt><dd className="mt-1 break-words font-bold text-pb-green">{test.topic || "—"}</dd></div>
                    <div><dt className="text-xs font-semibold text-slate-500">कालावधी</dt><dd className="mt-1 font-bold text-pb-green">{test.duration_minutes} मिनिटे</dd></div>
                    <div><dt className="text-xs font-semibold text-slate-500">प्रश्न</dt><dd className="mt-1 font-bold text-pb-green">{test.question_count}</dd></div>
                    <div><dt className="text-xs font-semibold text-slate-500">एकूण गुण</dt><dd className="mt-1 font-bold text-pb-green">{test.total_marks}</dd></div>
                  </dl>
                  <Link
                    to={`/student/tests/${test.id}`}
                    style={{ color: "#ffffff", backgroundColor: "#26351e" }}
                    className="mt-6 inline-flex items-center justify-center rounded-xl bg-pb-green px-5 py-3 text-sm font-bold text-white shadow-xs transition hover:bg-pb-khaki active:scale-95"
                  >
                    चाचणी सुरू करा <span aria-hidden="true" className="ml-2">→</span>
                  </Link>
                </article>
              ))}
            </div>
            {pagination.pages > 1 && <nav aria-label="चाचण्यांची पाने" className="flex items-center justify-center gap-4"><button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className="rounded-lg border border-[#d8d1bf] bg-white px-4 py-2 text-sm font-bold text-pb-green disabled:opacity-40">मागील</button><span className="text-sm font-semibold text-slate-600">पान {page} / {pagination.pages}</span><button type="button" disabled={page >= pagination.pages} onClick={() => setPage((current) => current + 1)} className="rounded-lg border border-[#d8d1bf] bg-white px-4 py-2 text-sm font-bold text-pb-green disabled:opacity-40">पुढील</button></nav>}
          </>
        )}
      </section>
    </div>
  );
}

export default StudentTests;
