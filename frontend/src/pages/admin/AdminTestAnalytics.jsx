import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { getTestAnalytics } from "../../services/admin/adminTestService";

function formatValue(value, suffix = "") {
  if (value === null || value === undefined || value === "") return "—";
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";
  const formatted = Number.isInteger(number)
    ? String(number)
    : number.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  return `${formatted}${suffix}`;
}

function MetricCard({ label, value, note }) {
  return (
    <article className="min-w-0 rounded-xl border border-pb-border bg-white p-4 shadow-sm sm:p-5">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 break-words text-2xl font-extrabold text-pb-green">{value}</p>
      {note && <p className="mt-1 text-xs leading-5 text-slate-500">{note}</p>}
    </article>
  );
}

function Section({ title, children, className = "" }) {
  return (
    <section className={`min-w-0 rounded-xl border border-pb-border bg-white p-4 shadow-sm sm:p-5 ${className}`}>
      <h2 className="text-lg font-extrabold text-pb-green">{title}</h2>
      {children}
    </section>
  );
}

function QuestionCards({ questions }) {
  if (!questions.length) {
    return <p className="mt-4 rounded-lg bg-pb-light p-4 text-sm text-slate-600">No question performance data is available yet.</p>;
  }
  return (
    <div className="mt-4 space-y-3 md:hidden">
      {questions.map((question) => (
        <article key={question.question_id} className="min-w-0 rounded-lg border border-pb-border bg-pb-light p-4">
          <h3 className="break-words font-bold leading-6 text-pb-green">Q{question.question_number}. {question.question_text}</h3>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-xs text-slate-500">Attempts</dt><dd className="mt-1 font-bold text-pb-green">{question.attempts}</dd></div>
            <div><dt className="text-xs text-slate-500">Accuracy</dt><dd className="mt-1 font-bold text-pb-green">{formatValue(question.accuracy, question.accuracy === null ? "" : "%")}</dd></div>
            <div><dt className="text-xs text-slate-500">Correct</dt><dd className="mt-1 font-bold text-pb-green">{question.correct}</dd></div>
            <div><dt className="text-xs text-slate-500">Wrong</dt><dd className="mt-1 font-bold text-red-700">{question.wrong}</dd></div>
            <div><dt className="text-xs text-slate-500">Skipped</dt><dd className="mt-1 font-bold text-pb-khaki">{question.skipped}</dd></div>
          </dl>
        </article>
      ))}
    </div>
  );
}

function AdminTestAnalytics() {
  const { testId } = useParams();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getTestAnalytics(testId);
      if (!response?.success || !response.data?.test) {
        throw new Error(response?.message || "Analytics data could not be loaded.");
      }
      setAnalytics(response.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || "Analytics data could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [testId]);

  useEffect(() => {
    Promise.resolve().then(loadAnalytics);
  }, [loadAnalytics]);

  const attempts = analytics?.attempts;
  const score = analytics?.score;
  const answers = analytics?.answers;
  const distribution = analytics?.score_distribution || [];
  const maxDistribution = Math.max(1, ...distribution.map((bucket) => bucket.count || 0));

  return (
    <main className="mx-auto w-full min-w-0 max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link to={`/admin/tests/${testId}`} className="text-sm font-bold text-pb-khaki hover:text-pb-khaki">← Back to test details</Link>
      </div>

      <header className="rounded-xl bg-pb-green p-5 text-white shadow-sm sm:p-7">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#d8c98f]">Read-only test monitoring</p>
        <h1 className="mt-2 break-words text-2xl font-extrabold sm:text-3xl">Test analytics</h1>
        {analytics?.test && <p className="mt-2 break-words text-sm text-white/80">{analytics.test.title}</p>}
      </header>

      {loading ? (
        <div role="status" className="mt-5 rounded-xl bg-white p-10 text-center text-sm font-semibold text-pb-green">
          <span className="mx-auto block h-8 w-8 animate-spin rounded-full border-4 border-pb-border border-t-pb-khaki" />
          <p className="mt-3">Loading analytics…</p>
        </div>
      ) : error ? (
        <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-white p-6 text-center">
          <p className="font-semibold text-red-700">{error}</p>
          <button type="button" onClick={loadAnalytics} className="mt-4 rounded-lg bg-pb-green px-4 py-2.5 text-sm font-bold text-white hover:bg-pb-khaki">Try again</button>
        </div>
      ) : analytics ? (
        <div className="mt-5 space-y-5">
          <Section title="Test summary">
            <dl className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="min-w-0"><dt className="text-xs font-bold text-slate-500">Title</dt><dd className="mt-1 break-words font-semibold text-pb-green">{analytics.test.title}</dd></div>
              <div><dt className="text-xs font-bold text-slate-500">Type</dt><dd className="mt-1 font-semibold capitalize text-pb-green">{String(analytics.test.test_type || "—").replaceAll("_", " ")}</dd></div>
              <div><dt className="text-xs font-bold text-slate-500">Questions / marks</dt><dd className="mt-1 font-semibold text-pb-green">{analytics.test.total_questions} / {formatValue(analytics.test.total_marks)}</dd></div>
              <div><dt className="text-xs font-bold text-slate-500">Status</dt><dd className="mt-1"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${analytics.test.is_active ? "bg-[#e8eee3] text-pb-green" : "bg-[#f2ecda] text-pb-khaki"}`}>{analytics.test.is_active ? "Active" : "Inactive"}</span></dd></div>
            </dl>
          </Section>

          <Section title="Attempt overview">
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <MetricCard label="Total attempts" value={attempts.total} />
              <MetricCard label="Submitted" value={attempts.submitted} />
              <MetricCard label="Expired" value={formatValue(attempts.expired)} note="Expiry is finalized as submitted; the stored status does not distinguish the cause." />
              <MetricCard label="In progress" value={attempts.in_progress} />
              <MetricCard label="Unique students" value={attempts.unique_students} />
            </div>
          </Section>

          <Section title="Score overview">
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <MetricCard label="Average score" value={formatValue(score.average_score)} />
              <MetricCard label="Highest score" value={formatValue(score.highest_score)} />
              <MetricCard label="Lowest score" value={formatValue(score.lowest_score)} />
              <MetricCard label="Average percentage" value={formatValue(score.average_percentage, score.average_percentage === null ? "" : "%")} />
              <MetricCard label="Average accuracy" value={formatValue(score.average_accuracy, score.average_accuracy === null ? "" : "%")} />
            </div>
          </Section>

          <Section title="Answer overview">
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <MetricCard label="Correct" value={answers.correct} />
              <MetricCard label="Wrong" value={answers.wrong} />
              <MetricCard label="Skipped" value={answers.skipped} />
            </div>
          </Section>

          <Section title="Question performance">
            {attempts.submitted === 0 && <p className="mt-3 rounded-lg bg-pb-light p-3 text-sm text-slate-600">No submitted results yet. Question counts will appear after attempts are finalized.</p>}
            <QuestionCards questions={analytics.question_performance || []} />
            {(analytics.question_performance || []).length > 0 && (
              <div className="mt-4 hidden max-w-full overflow-x-auto md:block">
                <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                  <thead className="bg-pb-light text-xs uppercase tracking-wide text-pb-green"><tr>{["Question", "Attempts", "Correct", "Wrong", "Skipped", "Accuracy"].map((label) => <th key={label} scope="col" className="px-3 py-3 font-bold">{label}</th>)}</tr></thead>
                  <tbody className="divide-y divide-pb-border-soft">
                    {analytics.question_performance.map((question) => (
                      <tr key={question.question_id} className="align-top">
                        <td className="max-w-xl px-3 py-3"><p className="break-words font-semibold leading-6 text-pb-green">Q{question.question_number}. {question.question_text}</p></td>
                        <td className="px-3 py-3">{question.attempts}</td><td className="px-3 py-3 font-bold text-pb-green">{question.correct}</td><td className="px-3 py-3 font-bold text-red-700">{question.wrong}</td><td className="px-3 py-3 font-bold text-pb-khaki">{question.skipped}</td><td className="px-3 py-3 font-bold text-pb-green">{formatValue(question.accuracy, question.accuracy === null ? "" : "%")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>

          <Section title="Score distribution">
            <p className="mt-1 text-sm text-slate-600">Submitted attempts grouped by saved percentage.</p>
            <div className="mt-4 space-y-3">
              {distribution.map((bucket) => (
                <div key={bucket.range} className="grid grid-cols-[4.5rem_minmax(0,1fr)_2.5rem] items-center gap-3 text-sm">
                  <span className="font-semibold text-pb-green">{bucket.range}</span>
                  <div className="h-3 overflow-hidden rounded-full bg-pb-light" role="img" aria-label={`${bucket.range}: ${bucket.count} attempts`}>
                    <div className="h-full rounded-full bg-pb-khaki" style={{ width: `${(bucket.count / maxDistribution) * 100}%` }} />
                  </div>
                  <span className="text-right font-bold text-pb-green">{bucket.count}</span>
                </div>
              ))}
            </div>
          </Section>

          {attempts.total === 0 && <p className="rounded-xl border border-pb-border bg-white p-4 text-sm text-slate-600">या चाचणीसाठी अद्याप कोणताही प्रयत्न झालेला नाही.</p>}
        </div>
      ) : null}
    </main>
  );
}

export default AdminTestAnalytics;
