import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getTestById, startTestAttempt } from "../../../services/testService";

const TEST_TYPE_LABELS = {
  subject: "विषय चाचणी",
  topic: "विषयघटक चाचणी",
  mixed: "मिश्र चाचणी",
  full_mock: "पूर्ण सराव चाचणी",
  daily: "दैनिक चाचणी",
  weekly: "साप्ताहिक चाचणी",
  previous_year: "मागील वर्षाची चाचणी",
};

function TestDetails() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [startingAttempt, setStartingAttempt] = useState(false);
  const [startError, setStartError] = useState("");

  const loadTestDetails = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getTestById(testId);
      if (!response.success || !response.data) throw new Error("Unexpected test details response");
      setTest(response.data);
    } catch {
      setError("चाचणीची माहिती लोड करता आली नाही. चाचणी उपलब्ध नसल्यास ती निष्क्रिय असू शकते.");
    } finally {
      setLoading(false);
    }
  }, [testId]);

  useEffect(() => {
    Promise.resolve().then(loadTestDetails);
  }, [loadTestDetails]);

  const handleStartTest = async () => {
    if (startingAttempt) return;
    setStartingAttempt(true);
    setStartError("");
    try {
      const response = await startTestAttempt(testId);
      if (!response.success || !response.data?.id) throw new Error("Unexpected attempt response");
      navigate(`/student/tests/${testId}/start?attempt_id=${response.data.id}`);
    } catch (startRequestError) {
      setStartError(startRequestError.response?.data?.message || "ही चाचणी सुरू करता आली नाही. पुन्हा प्रयत्न करा.");
    } finally {
      setStartingAttempt(false);
    }
  };

  const testType = TEST_TYPE_LABELS[test?.test_type?.toLowerCase()] || "सराव चाचणी";

  return (
    <div className="min-h-screen bg-pb-light">
      <header className="border-b border-pb-border bg-white">
        <div className="mx-auto max-w-5xl px-4 py-7 sm:px-6 lg:px-8">
          <Link to="/student/tests" className="inline-flex items-center gap-2 text-sm font-bold text-pb-khaki transition hover:text-pb-khaki">← सर्व चाचण्या</Link>
          <div className="mt-5 flex items-center gap-4"><div aria-hidden="true" className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-pb-green text-2xl text-white">📝</div><div><p className="text-sm font-bold text-pb-khaki">{testType}</p><h1 className="mt-1 text-2xl font-extrabold text-pb-green sm:text-3xl">चाचणीची माहिती</h1></div></div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {loading ? (
          <div role="status" aria-live="polite" className="rounded-2xl bg-white p-10 text-center text-sm font-medium text-slate-600 shadow-sm"><span className="mx-auto mb-3 block h-9 w-9 animate-spin rounded-full border-4 border-pb-border border-t-pb-khaki" />माहिती लोड होत आहे...</div>
        ) : error ? (
          <div role="alert" className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm"><p className="font-bold text-red-700">{error}</p><button type="button" onClick={loadTestDetails} className="mt-4 rounded-xl bg-pb-green px-5 py-3 text-sm font-bold text-white hover:bg-pb-khaki">पुन्हा प्रयत्न करा</button></div>
        ) : test ? (
          <>
            <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-7">
              <p className="text-sm font-bold text-pb-khaki">{testType}</p>
              <h2 className="mt-2 break-words text-2xl font-extrabold text-pb-green sm:text-3xl">{test.title}</h2>
              {test.description && <p className="mt-3 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-slate-600">{test.description}</p>}
              <dl className="mt-7 grid gap-4 border-t border-pb-border-soft pt-5 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-xl bg-[#fbfaf7] p-4"><dt className="text-xs font-semibold text-slate-500">विषय</dt><dd className="mt-1 break-words font-bold text-pb-green">{test.subject || "—"}</dd></div>
                <div className="rounded-xl bg-[#fbfaf7] p-4"><dt className="text-xs font-semibold text-slate-500">विषयघटक</dt><dd className="mt-1 break-words font-bold text-pb-green">{test.topic || "—"}</dd></div>
                <div className="rounded-xl bg-[#fbfaf7] p-4"><dt className="text-xs font-semibold text-slate-500">प्रश्नसंख्या</dt><dd className="mt-1 font-bold text-pb-green">{test.question_count}</dd></div>
                <div className="rounded-xl bg-[#fbfaf7] p-4"><dt className="text-xs font-semibold text-slate-500">कालावधी</dt><dd className="mt-1 font-bold text-pb-green">{test.duration_minutes} मिनिटे</dd></div>
                <div className="rounded-xl bg-[#fbfaf7] p-4"><dt className="text-xs font-semibold text-slate-500">एकूण गुण</dt><dd className="mt-1 font-bold text-pb-green">{test.total_marks}</dd></div>
                <div className="rounded-xl bg-[#fbfaf7] p-4"><dt className="text-xs font-semibold text-slate-500">स्थिती</dt><dd className="mt-1 font-bold text-pb-green">उपलब्ध</dd></div>
              </dl>
            </section>

            <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
              <p className="text-sm leading-6 text-slate-600">ही चाचणी सुरू करण्यासाठी तयार आहे.</p>
              {startError && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{startError}</p>}
              <button type="button" onClick={handleStartTest} disabled={startingAttempt || test.is_active === false || test.question_count < 1} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-pb-green px-6 py-3 font-bold text-white transition hover:bg-pb-khaki focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pb-khaki disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto">
                {startingAttempt ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />चाचणी सुरू होत आहे...</> : "चाचणी सुरू करा"}
              </button>
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}

export default TestDetails;
