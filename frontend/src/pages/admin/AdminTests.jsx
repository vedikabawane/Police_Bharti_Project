import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import AdminConfirmDialog from "../../components/admin/AdminConfirmDialog";
import { deleteTest, getTests, updateTestStatus } from "../../services/admin/adminTestService";
import { getSubjects } from "../../services/admin/adminSubjectService";
import { getTopics } from "../../services/admin/adminTopicService";

const PER_PAGE = 20;
const TEST_TYPES = [
  ["SUBJECT", "विषय चाचणी"],
  ["TOPIC", "विषयघटक चाचणी"],
  ["MIXED", "मिश्र चाचणी"],
  ["FULL_MOCK", "पूर्ण सराव चाचणी"],
  ["DAILY", "दैनिक चाचणी"],
  ["WEEKLY", "साप्ताहिक चाचणी"],
  ["PREVIOUS_YEAR", "मागील वर्षाची चाचणी"],
];

const fieldClass = "w-full rounded-lg border border-pb-border bg-white px-3.5 py-2.5 text-sm text-pb-green outline-none focus:border-pb-khaki focus:ring-2 focus:ring-pb-khaki/20";
const getErrorMessage = (error, fallback) =>
  error.response?.data?.message || error.message || fallback;

async function loadAllPages(fetchPage, recordsKey, filters = {}) {
  const first = await fetchPage({ ...filters, page: 1, per_page: 100 });
  const records = first?.data?.[recordsKey];
  const pages = first?.data?.pagination?.pages;
  if (!first?.success || !Array.isArray(records) || !Number.isInteger(pages)) {
    throw new Error(first?.message || "यादीचा प्रतिसाद अपूर्ण आहे.");
  }
  if (pages <= 1) return records;
  const remaining = await Promise.all(
    Array.from({ length: pages - 1 }, (_, index) =>
      fetchPage({ ...filters, page: index + 2, per_page: 100 }),
    ),
  );
  return records.concat(...remaining.map((response) => {
    const items = response?.data?.[recordsKey];
    if (!response?.success || !Array.isArray(items)) {
      throw new Error(response?.message || "यादीचा प्रतिसाद अपूर्ण आहे.");
    }
    return items;
  }));
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("mr-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}

function testTypeLabel(value) {
  return TEST_TYPES.find(([type]) => type === String(value).toUpperCase())?.[1] || value || "—";
}

function TestStatusDialog({ test, busy, error, onCancel, onConfirm }) {
  if (!test) return null;
  const nextActive = !test.is_active;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="presentation">
      <section role="dialog" aria-modal="true" aria-labelledby="test-status-title" className="w-full max-w-md rounded-xl border border-pb-border bg-white p-6 shadow-xl">
        <h2 id="test-status-title" className="text-lg font-extrabold text-pb-green">चाचणी स्थिती बदला</h2>
        <p className="mt-3 text-sm leading-6 text-slate-700">
          “{test.title}” {nextActive ? "सक्रिय" : "निष्क्रिय"} करायची आहे का? यामुळे विद्यार्थ्यांचे जुने प्रयत्न हटवले जाणार नाहीत.
        </p>
        {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" disabled={busy} onClick={onCancel} className="rounded-lg border border-pb-border px-4 py-2.5 text-sm font-bold text-pb-green hover:bg-pb-light disabled:opacity-60">रद्द करा</button>
          <button type="button" disabled={busy} onClick={onConfirm} className="rounded-lg bg-pb-green px-4 py-2.5 text-sm font-bold text-white hover:bg-pb-khaki disabled:cursor-not-allowed disabled:opacity-60">{busy ? "जतन होत आहे..." : nextActive ? "सक्रिय करा" : "निष्क्रिय करा"}</button>
        </div>
      </section>
    </div>
  );
}

function AdminTests() {
  const location = useLocation();
  const [tests, setTests] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [subjectsError, setSubjectsError] = useState("");
  const [topicsError, setTopicsError] = useState("");
  const [filterReload, setFilterReload] = useState(0);
  const [pagination, setPagination] = useState({ page: 1, per_page: PER_PAGE, total: 0, pages: 0 });
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [testTypeFilter, setTestTypeFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [topicFilter, setTopicFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [reload, setReload] = useState(0);
  const [feedback, setFeedback] = useState(location.state?.feedback || "");
  const [confirmTest, setConfirmTest] = useState(null);
  const [statusBusy, setStatusBusy] = useState(false);
  const [statusError, setStatusError] = useState("");
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    let current = true;
    loadAllPages(getSubjects, "subjects")
      .then((items) => { if (current) setSubjects(items); })
      .catch((error) => { if (current) setSubjectsError(getErrorMessage(error, "विषय लोड करता आले नाहीत.")); });
    return () => { current = false; };
  }, [filterReload]);

  useEffect(() => {
    let current = true;
    const filters = subjectFilter ? { subject_id: subjectFilter } : {};
    loadAllPages(getTopics, "topics", filters)
      .then((items) => { if (current) setTopics(items); })
      .catch((error) => { if (current) setTopicsError(getErrorMessage(error, "विषयघटक लोड करता आले नाहीत.")); });
    return () => { current = false; };
  }, [subjectFilter, filterReload]);

  useEffect(() => {
    let current = true;
    const load = async () => {
      setLoading(true);
      setListError("");
      const params = { page, per_page: PER_PAGE };
      if (debouncedSearch) params.search = debouncedSearch;
      if (testTypeFilter) params.test_type = testTypeFilter;
      if (subjectFilter) params.subject_id = subjectFilter;
      if (topicFilter) params.topic_id = topicFilter;
      if (statusFilter !== "") params.is_active = statusFilter;
      try {
        const response = await getTests(params);
        if (!response?.success || !Array.isArray(response.data?.tests) || !response.data?.pagination) {
          throw new Error(response?.message || "चाचण्यांची माहिती अपूर्ण आहे.");
        }
        if (current) {
          setTests(response.data.tests);
          setPagination(response.data.pagination);
        }
      } catch (error) {
        if (current) {
          setTests([]);
          setListError(getErrorMessage(error, "चाचण्या लोड करताना समस्या आली."));
        }
      } finally {
        if (current) setLoading(false);
      }
    };
    load();
    return () => { current = false; };
  }, [page, debouncedSearch, testTypeFilter, subjectFilter, topicFilter, statusFilter, reload]);

  const updateStatus = async () => {
    if (!confirmTest || statusBusy) return;
    const nextStatus = !confirmTest.is_active;
    setStatusBusy(true);
    setStatusError("");
    setFeedback("");
    try {
      const response = await updateTestStatus(confirmTest.id, nextStatus);
      if (!response?.success) throw new Error(response?.message || "स्थिती बदलता आली नाही.");
      if (statusFilter !== "" && String(nextStatus) !== statusFilter) {
        setReload((value) => value + 1);
      } else {
        setTests((current) => current.map((test) =>
          test.id === confirmTest.id ? { ...test, is_active: nextStatus } : test,
        ));
      }
      setFeedback(nextStatus ? "चाचणी सक्रिय केली." : "चाचणी निष्क्रिय केली.");
      setConfirmTest(null);
    } catch (error) {
      setStatusError(getErrorMessage(error, "स्थिती बदलताना समस्या आली."));
    } finally {
      setStatusBusy(false);
    }
  };

  const removeTest = async () => {
    if (!deleteCandidate || deleteBusy) return;
    setDeleteBusy(true);
    setDeleteError("");
    setFeedback("");
    try {
      const response = await deleteTest(deleteCandidate.id);
      if (!response?.success) throw new Error(response?.message || "Unable to remove the test.");
      setFeedback(response.data?.archived
        ? "Test deactivated; attempt history and linked notifications were preserved."
        : "Test deleted successfully.");
      setDeleteCandidate(null);
      setReload((value) => value + 1);
    } catch (error) {
      setDeleteError(getErrorMessage(error, "Unable to remove the test. Please try again."));
    } finally {
      setDeleteBusy(false);
    }
  };

  const hasFilters = Boolean(search || testTypeFilter || subjectFilter || topicFilter || statusFilter !== "");
  const resetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setTestTypeFilter("");
    setSubjectFilter("");
    setTopicFilter("");
    setStatusFilter("");
    setPage(1);
  };
  const firstResult = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.per_page + 1;
  const lastResult = Math.min(pagination.page * pagination.per_page, pagination.total);

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-7 flex flex-col gap-4 border-b border-pb-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-pb-khaki">प्रशासन</p>
          <h1 className="mt-2 text-2xl font-extrabold text-pb-green sm:text-3xl">चाचणी व्यवस्थापन</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">चाचणी तयार करा, प्रश्न थेट जोडा आणि प्रकाशनापूर्वी संपूर्ण प्रश्नपत्रिका तपासा.</p>
        </div>
        <Link to="/admin/tests/new" className="inline-flex shrink-0 items-center justify-center rounded-lg bg-pb-green px-4 py-2.5 text-sm font-bold text-white transition hover:bg-pb-khaki">＋ नवीन चाचणी</Link>
      </div>

      {feedback && <div role="status" className="mb-5 flex items-start justify-between gap-3 rounded-lg border border-[#cbd8c1] bg-[#e8eee3] px-4 py-3 text-sm font-semibold text-pb-green"><span>{feedback}</span><button type="button" aria-label="संदेश बंद करा" onClick={() => setFeedback("")} className="text-lg leading-none">×</button></div>}

      <section className="rounded-lg border border-pb-border bg-white p-4 sm:p-5">
        <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="sm:col-span-2 lg:col-span-1">
            <label htmlFor="admin-test-search" className="mb-1.5 block text-sm font-bold text-pb-green">शोधा</label>
            <input id="admin-test-search" type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="चाचणीचे नाव" className={fieldClass} />
          </div>
          <div>
            <label htmlFor="admin-test-type" className="mb-1.5 block text-sm font-bold text-pb-green">चाचणी प्रकार</label>
            <select id="admin-test-type" value={testTypeFilter} onChange={(event) => { setTestTypeFilter(event.target.value); setPage(1); }} className={fieldClass}><option value="">सर्व प्रकार</option>{TEST_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
          </div>
          <div>
            <label htmlFor="admin-test-subject" className="mb-1.5 block text-sm font-bold text-pb-green">विषय</label>
            <select id="admin-test-subject" value={subjectFilter} onChange={(event) => { setSubjectFilter(event.target.value); setTopicFilter(""); setPage(1); }} className={fieldClass}><option value="">सर्व विषय</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select>
            {subjectsError && <p role="alert" className="mt-1 text-xs text-red-700">{subjectsError} <button type="button" onClick={() => { setSubjectsError(""); setFilterReload((value) => value + 1); }} className="underline">पुन्हा प्रयत्न</button></p>}
          </div>
          <div>
            <label htmlFor="admin-test-topic" className="mb-1.5 block text-sm font-bold text-pb-green">विषयघटक</label>
            <select id="admin-test-topic" value={topicFilter} onChange={(event) => { setTopicFilter(event.target.value); setPage(1); }} className={fieldClass}><option value="">सर्व विषयघटक</option>{topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}</select>
            {topicsError && <p role="alert" className="mt-1 text-xs text-red-700">{topicsError} <button type="button" onClick={() => { setTopicsError(""); setFilterReload((value) => value + 1); }} className="underline">पुन्हा प्रयत्न</button></p>}
          </div>
          <div>
            <label htmlFor="admin-test-status" className="mb-1.5 block text-sm font-bold text-pb-green">स्थिती</label>
            <select id="admin-test-status" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }} className={fieldClass}><option value="">सर्व</option><option value="true">सक्रिय</option><option value="false">निष्क्रिय</option></select>
          </div>
          <div className="flex items-end"><button type="button" onClick={resetFilters} disabled={!hasFilters} className="w-full rounded-lg border border-pb-border px-4 py-2.5 text-sm font-bold text-pb-green hover:bg-pb-light disabled:cursor-not-allowed disabled:opacity-50">फिल्टर काढा</button></div>
        </div>
      </section>

      <section className="mt-6 min-w-0 overflow-hidden rounded-lg border border-pb-border bg-white">
        <div className="flex flex-col gap-1 border-b border-pb-border-soft px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <h2 className="font-extrabold text-pb-green">चाचण्या</h2>
          {!loading && !listError && <p className="text-xs font-semibold text-slate-500">{firstResult}–{lastResult} पैकी {pagination.total} चाचण्या</p>}
        </div>
        {loading ? (
          <div role="status" className="px-5 py-12 text-center"><span className="mx-auto block h-8 w-8 animate-spin rounded-full border-4 border-pb-border border-t-pb-khaki" /><p className="mt-3 text-sm font-semibold text-pb-green">चाचण्या लोड होत आहेत...</p></div>
        ) : listError ? (
          <div role="alert" className="px-5 py-10 text-center"><p className="text-sm font-semibold text-red-700">चाचण्या लोड करताना समस्या आली.</p><p className="mt-1 text-sm text-slate-600">{listError}</p><button type="button" onClick={() => setReload((value) => value + 1)} className="mt-4 rounded-lg bg-pb-green px-4 py-2 text-sm font-bold text-white hover:bg-pb-khaki">पुन्हा प्रयत्न</button></div>
        ) : tests.length === 0 ? (
          <div className="px-5 py-12 text-center"><p className="font-bold text-pb-green">चाचण्या सापडल्या नाहीत.</p>{hasFilters && <p className="mt-1 text-sm text-slate-500">फिल्टर बदला किंवा काढून टाका.</p>}<Link to="/admin/tests/new" className="mt-4 inline-flex rounded-lg bg-pb-green px-4 py-2.5 text-sm font-bold text-white hover:bg-pb-khaki">नवीन चाचणी तयार करा</Link></div>
        ) : (
          <>
            <div className="space-y-3 p-3 md:hidden">
              {tests.map((test) => (
                <article key={test.id} className="min-w-0 rounded-lg border border-pb-border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0"><h3 className="break-words font-extrabold text-pb-green">{test.title}</h3><p className="mt-1 text-xs font-semibold text-pb-khaki">{testTypeLabel(test.test_type)}</p></div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${test.is_active ? "bg-[#e8eee3] text-pb-green" : "bg-[#f2ecda] text-pb-khaki"}`}>{test.is_active ? "सक्रिय" : "निष्क्रिय"}</span>
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                    <div><dt className="text-slate-500">विषय</dt><dd className="mt-0.5 break-words font-semibold text-pb-green">{test.subject?.name || "—"}</dd></div>
                    <div><dt className="text-slate-500">विषयघटक</dt><dd className="mt-0.5 break-words font-semibold text-pb-green">{test.topic?.name || "—"}</dd></div>
                    <div><dt className="text-slate-500">वेळ</dt><dd className="mt-0.5 font-semibold text-pb-green">{test.duration_minutes} मिनिटे</dd></div>
                    <div><dt className="text-slate-500">प्रश्न / गुण</dt><dd className="mt-0.5 font-semibold text-pb-green">{test.question_count ?? test.total_questions ?? 0} / {test.total_marks}</dd></div>
                    <div className="col-span-2"><dt className="text-slate-500">तयार केले</dt><dd className="mt-0.5 font-semibold text-pb-green">{formatDate(test.created_at)}</dd></div>
                  </dl>
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-pb-border-soft pt-3">
                    <Link to={`/admin/tests/${test.id}`} className="rounded-md border border-pb-khaki px-3 py-1.5 text-xs font-bold text-pb-green hover:bg-pb-light">पहा / संपादित करा</Link>
                    <button type="button" onClick={() => { setStatusError(""); setConfirmTest(test); }} className="rounded-md border border-pb-border px-3 py-1.5 text-xs font-bold text-pb-green hover:bg-[#e8eee3]">{test.is_active ? "निष्क्रिय करा" : "सक्रिय करा"}</button><button type="button" disabled={deleteBusy} onClick={() => { setDeleteError(""); setDeleteCandidate(test); }} className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-50">Delete / Remove</button>
                  </div>
                </article>
              ))}
            </div>
            <div className="hidden max-w-full overflow-x-auto md:block">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-pb-light text-xs uppercase tracking-wide text-pb-green"><tr>{["चाचणी", "प्रकार", "विषय / विषयघटक", "वेळ", "प्रश्न / गुण", "स्थिती", "तयार केले", "कृती"].map((heading) => <th key={heading} scope="col" className="whitespace-nowrap px-3 py-3 font-bold">{heading}</th>)}</tr></thead>
                <tbody className="divide-y divide-pb-border-soft">
                  {tests.map((test) => (
                    <tr key={test.id} className="align-top hover:bg-pb-light/60">
                      <td className="max-w-56 px-3 py-3"><p className="break-words font-bold text-pb-green">{test.title}</p><p className="mt-1 line-clamp-2 text-xs text-slate-500">{test.description || "—"}</p></td>
                      <td className="px-3 py-3 text-slate-700">{testTypeLabel(test.test_type)}</td>
                      <td className="px-3 py-3"><p className="font-semibold text-pb-green">{test.subject?.name || "—"}</p><p className="mt-1 text-xs text-slate-600">{test.topic?.name || "—"}</p></td>
                      <td className="whitespace-nowrap px-3 py-3 text-slate-700">{test.duration_minutes} मिनिटे</td>
                      <td className="whitespace-nowrap px-3 py-3 text-slate-700">{test.question_count ?? test.total_questions ?? 0} / {test.total_marks}</td>
                      <td className="px-3 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${test.is_active ? "bg-[#e8eee3] text-pb-green" : "bg-[#f2ecda] text-pb-khaki"}`}>{test.is_active ? "सक्रिय" : "निष्क्रिय"}</span></td>
                      <td className="whitespace-nowrap px-3 py-3 text-slate-600">{formatDate(test.created_at)}</td>
                      <td className="px-3 py-3"><div className="flex flex-wrap gap-2"><Link to={`/admin/tests/${test.id}`} className="rounded-md border border-pb-khaki px-3 py-1.5 text-xs font-bold text-pb-green hover:bg-pb-light">पहा / संपादित करा</Link><button type="button" onClick={() => { setStatusError(""); setConfirmTest(test); }} className="rounded-md border border-pb-border px-3 py-1.5 text-xs font-bold text-pb-green hover:bg-[#e8eee3]">{test.is_active ? "निष्क्रिय करा" : "सक्रिय करा"}</button><button type="button" disabled={deleteBusy} onClick={() => { setDeleteError(""); setDeleteCandidate(test); }} className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-50">Delete / Remove</button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        {!loading && !listError && pagination.pages > 0 && <div className="flex flex-col gap-3 border-t border-pb-border-soft px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"><p className="text-sm font-semibold text-slate-600">पृष्ठ {pagination.page} / {pagination.pages} · एकूण {pagination.total}</p><div className="flex items-center gap-2"><button type="button" disabled={pagination.page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-md border border-pb-border px-4 py-2 text-sm font-bold text-pb-green hover:bg-pb-light disabled:cursor-not-allowed disabled:opacity-40">मागील</button><button type="button" disabled={pagination.page >= pagination.pages} onClick={() => setPage((value) => Math.min(pagination.pages, value + 1))} className="rounded-md border border-pb-border px-4 py-2 text-sm font-bold text-pb-green hover:bg-pb-light disabled:cursor-not-allowed disabled:opacity-40">पुढील</button></div></div>}
      </section>

      <TestStatusDialog test={confirmTest} busy={statusBusy} error={statusError} onCancel={() => { if (!statusBusy) setConfirmTest(null); }} onConfirm={updateStatus} />
      {deleteCandidate && <AdminConfirmDialog title="Remove test?" message={`Remove “${deleteCandidate.title}”?`} detail="Tests with attempts or linked notifications will be deactivated to preserve student history. An unused test will be permanently deleted." busy={deleteBusy} error={deleteError} onCancel={() => { if (!deleteBusy) setDeleteCandidate(null); }} onConfirm={removeTest} />}
    </div>
  );
}

export default AdminTests;
