import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

import { getTest } from "../../services/admin/adminTestService";

const TEST_TYPE_LABELS = {
  SUBJECT: "विषय चाचणी",
  TOPIC: "विषयघटक चाचणी",
  MIXED: "मिश्र चाचणी",
  FULL_MOCK: "पूर्ण सराव चाचणी",
  DAILY: "दैनिक चाचणी",
  WEEKLY: "साप्ताहिक चाचणी",
  PREVIOUS_YEAR: "मागील वर्षाची चाचणी",
};

const getErrorMessage = (error, fallback) =>
  error.response?.data?.message || error.message || fallback;

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString("mr-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
}

function AdminTestDetail() {
  const { testId } = useParams();
  const location = useLocation();
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let current = true;
    getTest(testId)
      .then((response) => {
        if (!response?.success || !response?.data || !Array.isArray(response.data.questions)) {
          throw new Error(response?.message || "चाचणीची माहिती अपूर्ण आहे.");
        }
        if (current) setTest(response.data);
      })
      .catch((requestError) => {
        if (current) setError(getErrorMessage(requestError, "चाचणी लोड करता आली नाही."));
      })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [testId, reload]);

  if (loading) {
    return <div role="status" className="mx-auto max-w-7xl px-4 py-12 text-center text-sm font-semibold text-pb-green">चाचणी लोड होत आहे...</div>;
  }

  if (error) {
    return <div className="mx-auto max-w-3xl px-4 py-8"><div role="alert" className="rounded-lg border border-red-200 bg-white p-6"><p className="font-semibold text-red-700">{error}</p><div className="mt-4 flex flex-wrap gap-3"><button type="button" onClick={() => { setLoading(true); setError(""); setReload((value) => value + 1); }} className="rounded-lg bg-pb-green px-4 py-2 text-sm font-bold text-white">पुन्हा प्रयत्न</button><Link to="/admin/tests" className="rounded-lg border border-pb-border px-4 py-2 text-sm font-bold text-pb-green">चाचण्यांकडे परत</Link></div></div></div>;
  }

  const questions = test.questions.slice().sort((a, b) => a.question_order - b.question_order);
  const testType = String(test.test_type || "").toUpperCase();

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-6 border-b border-pb-border pb-5">
        <Link to="/admin/tests" className="text-sm font-bold text-pb-khaki hover:text-pb-khaki">← चाचण्यांकडे परत</Link>
        <p className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-pb-khaki">चाचणी तपशील</p>
        <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0"><h1 className="break-words text-2xl font-extrabold text-pb-green sm:text-3xl">{test.title}</h1><p className="mt-2 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-slate-600">{test.description || "वर्णन उपलब्ध नाही."}</p></div>
          <Link to={`/admin/tests/${testId}/edit`} className="inline-flex shrink-0 items-center justify-center rounded-lg bg-pb-green px-4 py-2.5 text-sm font-bold text-white hover:bg-pb-khaki">चाचणी संपादित करा</Link>
        </div>
      </div>
      {test.instructions && <section className="mb-5 rounded-lg border border-pb-border bg-white p-4 sm:p-5"><h2 className="font-extrabold text-pb-green">विद्यार्थ्यांसाठी सूचना</h2><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{test.instructions}</p></section>}

      <div className="mb-5 flex justify-end">
        <Link to={`/admin/tests/${testId}/analytics`} className="inline-flex items-center justify-center rounded-lg bg-pb-green px-4 py-2.5 text-sm font-bold text-white hover:bg-pb-khaki">Analytics</Link>
      </div>

      {location.state?.feedback && <p role="status" className="mb-5 rounded-lg border border-[#cbd8c1] bg-[#e8eee3] px-4 py-3 text-sm font-semibold text-pb-green">{location.state.feedback}</p>}

      <section className="rounded-lg border border-pb-border bg-white p-4 sm:p-6">
        <h2 className="font-extrabold text-pb-green">माहिती</h2>
        <dl className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div><dt className="text-xs font-bold text-slate-500">चाचणी प्रकार</dt><dd className="mt-1 font-semibold text-pb-green">{TEST_TYPE_LABELS[testType] || test.test_type}</dd></div>
          <div><dt className="text-xs font-bold text-slate-500">विषय</dt><dd className="mt-1 break-words font-semibold text-pb-green">{test.subject?.name || "—"}</dd></div>
          <div><dt className="text-xs font-bold text-slate-500">विषयघटक</dt><dd className="mt-1 break-words font-semibold text-pb-green">{test.topic?.name || "—"}</dd></div>
          <div><dt className="text-xs font-bold text-slate-500">वेळ</dt><dd className="mt-1 font-semibold text-pb-green">{test.duration_minutes} मिनिटे</dd></div>
          <div><dt className="text-xs font-bold text-slate-500">प्रश्न संख्या / एकूण गुण</dt><dd className="mt-1 font-semibold text-pb-green">{test.question_count ?? questions.length} / {test.total_marks}</dd></div>
          <div><dt className="text-xs font-bold text-slate-500">स्थिती</dt><dd className="mt-1"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${test.is_active ? "bg-[#e8eee3] text-pb-green" : "bg-[#f2ecda] text-pb-khaki"}`}>{test.is_active ? "सक्रिय" : "निष्क्रिय"}</span></dd></div>
          <div><dt className="text-xs font-bold text-slate-500">तयार केले</dt><dd className="mt-1 font-semibold text-pb-green">{formatDate(test.created_at)}</dd></div>
          <div><dt className="text-xs font-bold text-slate-500">शेवटचे बदल</dt><dd className="mt-1 font-semibold text-pb-green">{formatDate(test.updated_at)}</dd></div>
        </dl>
      </section>

      <section className="mt-6 min-w-0 overflow-hidden rounded-lg border border-pb-border bg-white">
        <div className="flex flex-col gap-1 border-b border-pb-border-soft px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"><h2 className="font-extrabold text-pb-green">निवडलेले प्रश्न</h2><p className="text-xs font-semibold text-slate-500">क्रम जतन केला आहे · {questions.length} प्रश्न</p></div>
        {questions.length === 0 ? <p className="px-5 py-10 text-sm text-slate-500">या चाचणीत प्रश्न नाहीत.</p> : <ol className="divide-y divide-pb-border-soft">
          {questions.map((row, index) => <li key={`${row.question_id}-${row.question_order}`} className="flex min-w-0 items-start gap-3 px-4 py-4 sm:px-5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pb-green text-sm font-extrabold text-white">{index + 1}</span>
            <div className="min-w-0 flex-1"><p className="break-words text-sm font-semibold leading-6 text-pb-green">{row.question?.question_text || "हा प्रश्न उपलब्ध नाही."}</p><p className="mt-1 break-words text-xs text-slate-500">ID: {row.question_id}{row.question?.subject?.name ? ` · ${row.question.subject.name}` : ""}{row.question?.topic?.name ? ` / ${row.question.topic.name}` : ""}{row.question?.difficulty ? ` · ${row.question.difficulty}` : ""}</p><ul className="mt-2 grid gap-1 sm:grid-cols-2">{row.question?.options?.map((option) => <li key={option.option_label} className={`text-sm ${row.question.correct_option === option.option_label ? "font-bold text-emerald-700" : "text-slate-600"}`}>{option.option_label}. {option.option_text}{row.question.correct_option === option.option_label ? " ✓" : ""}</li>)}</ul>{row.question?.explanation && <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">समजावणी: {row.question.explanation}</p>}</div>
            <span className="shrink-0 text-xs font-bold text-pb-khaki">{row.question?.marks ?? "—"} गुण</span>
          </li>)}
        </ol>}
      </section>
    </div>
  );
}

export default AdminTestDetail;
