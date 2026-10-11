import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getTestAttemptResult } from "../../../services/testService";

function formatNumber(value) {
  if (value === null || value === undefined || value === "") return "—";
  const number = Number(value);
  return Number.isInteger(number)
    ? String(number)
    : number.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function formatDuration(seconds) {
  const totalSeconds = Math.max(0, Number(seconds) || 0);
  const minutes = Math.floor(totalSeconds / 60);
  const remainder = totalSeconds % 60;
  return minutes ? `${minutes} min ${remainder} sec` : `${remainder} sec`;
}

function MetricCard({ label, value, prominent = false }) {
  return (
    <article className={`rounded-2xl border border-[#e7e2d6] bg-white p-4 shadow-sm sm:p-5 ${prominent ? "sm:col-span-2" : ""}`}>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500 sm:text-sm">{label}</p>
      <p className={`mt-2 break-words font-extrabold text-pb-green ${prominent ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl"}`}>{value}</p>
    </article>
  );
}

function TopicList({ title, topics, kind }) {
  const strong = kind === "strong";
  return (
    <section className="rounded-2xl border border-[#e7e2d6] bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-extrabold text-pb-green">{title}</h2>
      {topics?.length ? (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {topics.map((topic) => (
            <li key={topic.topic_id} className="rounded-xl bg-pb-light p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="font-bold text-pb-green">{topic.topic_name}</h3>
                <span className={`rounded-full px-2.5 py-1 text-sm font-extrabold ${strong ? "bg-pb-green text-white" : "bg-pb-khaki text-white"}`}>
                  {formatNumber(topic.percentage)}%
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                {topic.correct} correct · {topic.wrong} wrong · {topic.attempted} attempted of {topic.total_questions}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-slate-600">No {strong ? "strong" : "weak"} topics meet the minimum question threshold for this test.</p>
      )}
    </section>
  );
}

const REVIEW_FILTERS = ["all", "correct", "wrong", "skipped"];

const REVIEW_LABELS = {
  all: "सर्व प्रश्न",
  correct: "बरोबर",
  wrong: "चुकीचे",
  skipped: "अनुत्तरित",
};

const STATUS_LABELS = {
  correct: "बरोबर उत्तर",
  wrong: "चुकीचे उत्तर",
  skipped: "अनुत्तरित",
};

function QuestionReview({ questions }) {
  const [filter, setFilter] = useState("all");
  const [activeIndex, setActiveIndex] = useState(0);
  const counts = useMemo(() => ({
    all: questions.length,
    correct: questions.filter((question) => question.result_status === "correct").length,
    wrong: questions.filter((question) => question.result_status === "wrong").length,
    skipped: questions.filter((question) => question.result_status === "skipped").length,
  }), [questions]);
  const filteredQuestions = useMemo(
    () => filter === "all"
      ? questions
      : questions.filter((question) => question.result_status === filter),
    [filter, questions],
  );
  const currentQuestion = filteredQuestions[activeIndex];

  if (!questions.length) return null;

  return (
    <section id="question-review" aria-label="Question-wise answer review" className="scroll-mt-6 rounded-2xl border border-[#e7e2d6] bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold text-pb-khaki">प्रश्नांचे पुनरावलोकन</p>
          <h2 className="mt-1 text-xl font-extrabold text-pb-green">उत्तरे तपासा</h2>
        </div>
        <a href="#result-summary" className="text-sm font-bold text-pb-green underline decoration-pb-khaki underline-offset-4">निकालाच्या सारांशाकडे जा</a>
      </div>

      <div className="mt-5 flex flex-wrap gap-2" aria-label="Filter reviewed questions">
        {REVIEW_FILTERS.map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={filter === value}
            onClick={() => { setFilter(value); setActiveIndex(0); }}
            className={`rounded-full border px-3 py-2 text-sm font-bold transition ${filter === value ? "border-pb-khaki bg-pb-green text-white" : "border-[#d8d1bf] bg-pb-light text-pb-green hover:border-pb-khaki"}`}
          >
            {REVIEW_LABELS[value]} <span className="ml-1 opacity-80">({counts[value]})</span>
          </button>
        ))}
      </div>

      {currentQuestion ? (
        <article className="mt-5 min-w-0 rounded-xl border border-[#e7e2d6] bg-pb-light p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-extrabold text-pb-green">प्रश्न {currentQuestion.question_number} <span className="font-semibold text-slate-500">· {activeIndex + 1} / {filteredQuestions.length}</span></p>
            <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${currentQuestion.result_status === "correct" ? "bg-pb-green text-white" : currentQuestion.result_status === "wrong" ? "bg-red-100 text-red-800" : "bg-pb-khaki text-white"}`}>
              {STATUS_LABELS[currentQuestion.result_status] || "उत्तर"}
            </span>
          </div>

          <p className="mt-4 break-words [overflow-wrap:anywhere] text-base font-bold leading-7 text-slate-800">{currentQuestion.question_text}</p>
          {(currentQuestion.subject || currentQuestion.topic) && (
            <p className="mt-2 break-words text-xs font-semibold text-slate-500">
              {[currentQuestion.subject, currentQuestion.topic].filter(Boolean).join(" · ")}
            </p>
          )}

          <ol className="mt-4 space-y-2">
            {(currentQuestion.options || []).map((option) => {
              const isCorrect = option.option_label === currentQuestion.correct_option;
              const isSelected = option.option_label === currentQuestion.selected_option;
              const colorClass = isCorrect
                ? "border-green-300 bg-green-50 text-pb-green"
                : isSelected
                  ? "border-red-200 bg-red-50 text-red-900"
                  : "border-[#e7e2d6] bg-white text-slate-700";
              return (
                <li key={option.option_label} className={`flex min-w-0 flex-wrap items-start justify-between gap-2 rounded-xl border p-3 ${colorClass}`}>
                  <span className="min-w-0 break-words [overflow-wrap:anywhere] text-sm leading-6"><strong className="mr-2">{option.option_label}.</strong>{option.option_text}</span>
                  <span className="flex shrink-0 flex-wrap gap-1">
                    {isSelected && <span className="rounded-full bg-pb-green px-2 py-1 text-[11px] font-bold text-white">तुमचे उत्तर</span>}
                    {isCorrect && <span className="rounded-full bg-pb-green px-2 py-1 text-[11px] font-bold text-white">योग्य उत्तर</span>}
                  </span>
                </li>
              );
            })}
          </ol>

          <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            <p className="break-words rounded-lg bg-white p-3 text-slate-700">
              तुमचे उत्तर: <strong>{currentQuestion.selected_option_text || "उत्तर दिले नाही"}</strong>
            </p>
            <p className="break-words rounded-lg bg-white p-3 text-slate-700">
              योग्य उत्तर: <strong>{currentQuestion.correct_option_text || currentQuestion.correct_option}</strong>
            </p>
            <p className="rounded-lg bg-white p-3 text-slate-700 sm:col-span-2">
              मिळालेले गुण: <strong>{formatNumber(currentQuestion.marks_earned)} / {formatNumber(currentQuestion.marks)}</strong>
            </p>
          </div>

          <div className="mt-4 rounded-xl border border-[#e7e2d6] bg-white p-4">
            <h3 className="text-sm font-extrabold text-pb-green">स्पष्टीकरण</h3>
            <p className="mt-2 break-words [overflow-wrap:anywhere] text-sm leading-6 text-slate-700">
              {currentQuestion.explanation || "या प्रश्नासाठी स्पष्टीकरण उपलब्ध नाही."}
            </p>
          </div>

          <div className="mt-5 flex items-center justify-between gap-3">
            <button type="button" disabled={activeIndex === 0} onClick={() => setActiveIndex((index) => Math.max(0, index - 1))} className="rounded-xl border border-[#d8d1bf] bg-white px-4 py-3 text-sm font-bold text-pb-green disabled:cursor-not-allowed disabled:opacity-40">मागील प्रश्न</button>
            <button type="button" disabled={activeIndex >= filteredQuestions.length - 1} onClick={() => setActiveIndex((index) => Math.min(filteredQuestions.length - 1, index + 1))} className="rounded-xl bg-pb-green px-4 py-3 text-sm font-bold text-white hover:bg-pb-khaki disabled:cursor-not-allowed disabled:opacity-40">पुढील प्रश्न</button>
          </div>
        </article>
      ) : (
        <p className="mt-5 rounded-xl bg-pb-light p-5 text-sm text-slate-600">या प्रकारचे प्रश्न उपलब्ध नाहीत.</p>
      )}
    </section>
  );
}

function TestResult() {
  const { testId, attemptId } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadResult = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getTestAttemptResult(attemptId);
      if (!response?.success || !response.data) {
        throw new Error(response?.message || "Result is not available.");
      }
      if (String(response.data.test_id) !== String(testId)) {
        throw new Error("The result does not belong to this test.");
      }
      setResult(response.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || "Could not load the result. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [attemptId, testId]);

  useEffect(() => {
    Promise.resolve().then(loadResult);
  }, [loadResult]);

  const previousAvailable = result?.previous_percentage !== null && result?.previous_percentage !== undefined;
  const improvement = result?.improvement_percentage_points;
  const improvementLabel = improvement === null || improvement === undefined
    ? "—"
    : `${improvement > 0 ? "+" : ""}${formatNumber(improvement)} percentage points`;

  return (
    <main className="min-h-screen bg-pb-light px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-5xl">
        <header className="rounded-2xl bg-pb-green p-6 text-white shadow-sm sm:p-8">
          <p className="text-sm font-bold text-[#d8c98f]">Student test</p>
          <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">Test result</h1>
          {result && <p className="mt-2 break-words text-sm text-white/80">{result.test_title}</p>}
        </header>

        {loading ? (
          <div role="status" aria-live="polite" className="mt-6 rounded-2xl bg-white p-8 text-center text-sm font-medium text-slate-600 shadow-sm">
            <span className="mx-auto mb-3 block h-9 w-9 animate-spin rounded-full border-4 border-pb-border border-t-pb-khaki" />
            Loading result…
          </div>
        ) : error ? (
          <div role="alert" className="mt-6 rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
            <p className="font-bold text-red-700">{error}</p>
            <button type="button" onClick={loadResult} className="mt-4 rounded-xl bg-pb-green px-5 py-3 text-sm font-bold text-white hover:bg-pb-khaki">Try again</button>
          </div>
        ) : result ? (
          <div className="mt-6 space-y-5">
            <section id="result-summary" aria-label="Score summary" className="scroll-mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <MetricCard label="Score" value={`${formatNumber(result.score)} / ${formatNumber(result.total_marks)}`} prominent />
              <MetricCard label="Percentage" value={`${formatNumber(result.percentage)}%`} />
              <MetricCard label="Accuracy" value={`${formatNumber(result.accuracy)}%`} />
              <MetricCard label="Your rank" value={result.rank ? `#${result.rank}` : "—"} />
              <MetricCard label="Time taken" value={formatDuration(result.time_taken_seconds)} />
            </section>

            <section aria-label="Question summary" className="rounded-2xl border border-[#e7e2d6] bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-lg font-extrabold text-pb-green">Question summary</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <MetricCard label="Correct" value={result.correct_answers} />
                <MetricCard label="Wrong" value={result.wrong_answers} />
                <MetricCard label="Skipped" value={result.skipped_questions} />
                <MetricCard label="Attempted" value={result.attempted_questions} />
              </div>
            </section>

            <section aria-label="Previous performance" className="rounded-2xl border border-[#e7e2d6] bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-lg font-extrabold text-pb-green">Previous performance</h2>
              {previousAvailable ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <MetricCard label="Previous score" value={`${formatNumber(result.previous_percentage)}% (${formatNumber(result.previous_score)} marks)`} />
                  <MetricCard label="Current score" value={`${formatNumber(result.percentage)}% (${formatNumber(result.score)} marks)`} />
                  <MetricCard label="Improvement" value={improvementLabel} />
                </div>
              ) : (
                <p className="mt-3 rounded-xl bg-pb-light px-4 py-3 text-sm text-slate-700">Previous Attempt: Not available</p>
              )}
            </section>

            <div className="grid gap-5 md:grid-cols-2">
              <TopicList title="Strong topics" topics={result.strong_topics} kind="strong" />
              <TopicList title="Weak topics" topics={result.weak_topics} kind="weak" />
            </div>
            <p className="rounded-xl bg-white px-4 py-3 text-sm text-slate-500">This result is calculated from answers saved on the server.</p>
            <QuestionReview questions={result.question_review || []} />
          </div>
        ) : null}

        <nav className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link to="/student/tests" className="inline-flex justify-center rounded-xl bg-pb-green px-5 py-3 text-sm font-bold text-white transition hover:bg-pb-khaki">Back to tests</Link>
          <Link to={`/student/tests/${testId}`} className="inline-flex justify-center rounded-xl border border-[#d8d1bf] bg-white px-5 py-3 text-sm font-bold text-pb-green transition hover:bg-pb-light">Test details</Link>
        </nav>
      </section>
    </main>
  );
}

export default TestResult;
