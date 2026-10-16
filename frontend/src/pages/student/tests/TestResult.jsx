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

function MetricCard({ label, value, prominent = false, color = "text-pb-green" }) {
  return (
    <article className={`rounded-xl border border-pb-border/80 bg-white p-3.5 shadow-xs transition-all sm:rounded-2xl sm:p-5 ${prominent ? "col-span-2 sm:col-span-1" : ""}`}>
      <p className="text-[11px] font-bold tracking-wide text-slate-500 sm:text-xs">{label}</p>
      <p className={`mt-1 break-words font-black ${color} ${prominent ? "text-2xl sm:text-3xl" : "text-lg sm:text-2xl"}`}>{value}</p>
    </article>
  );
}

function TopicList({ title, topics, kind }) {
  const strong = kind === "strong";
  return (
    <section className="rounded-xl border border-pb-border/80 bg-white p-4 shadow-xs sm:rounded-2xl sm:p-6">
      <div className="flex items-center gap-2">
        <span className="text-lg">{strong ? "💪" : "🎯"}</span>
        <h2 className="text-base font-extrabold text-pb-green sm:text-lg">{title}</h2>
      </div>
      {topics?.length ? (
        <ul className="mt-3.5 grid gap-2.5 sm:grid-cols-2">
          {topics.map((topic) => (
            <li key={topic.topic_id} className="rounded-xl border border-pb-border/50 bg-pb-light/60 p-3.5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="text-xs sm:text-sm font-extrabold text-pb-green">{topic.topic_name}</h3>
                <span
                  style={{ color: "#ffffff", backgroundColor: strong ? "#26351e" : "#7b6f35" }}
                  className="rounded-full px-2.5 py-0.5 text-xs font-black shadow-xs"
                >
                  {formatNumber(topic.percentage)}%
                </span>
              </div>
              <p className="mt-1.5 text-xs text-slate-600">
                ✅ {topic.correct} बरोबर · ❌ {topic.wrong} चुकीचे · {topic.attempted}/{topic.total_questions} सोडवले
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 rounded-lg bg-pb-light/70 p-3 text-xs sm:text-sm text-slate-600">
          या चाचणीसाठी कोणतेही {strong ? "मजबूत" : "कमकुवत"} घटक आढळले नाहीत.
        </p>
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
    <section id="question-review" aria-label="Question-wise answer review" className="scroll-mt-6 rounded-xl border border-pb-border/80 bg-white p-4 shadow-xs sm:rounded-2xl sm:p-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold text-pb-khaki">प्रश्नांचे पुनरावलोकन</p>
          <h2 className="mt-0.5 text-lg font-extrabold text-pb-green sm:text-xl">प्रत्येक प्रश्नाचे उत्तर तपासा</h2>
        </div>
        <a href="#result-summary" className="text-xs font-bold text-pb-khaki hover:underline">
          ↑ निकालाच्या सारांशाकडे जा
        </a>
      </div>

      {/* Filter Tabs */}
      <div className="mt-4 flex flex-wrap gap-1.5" aria-label="Filter reviewed questions">
        {REVIEW_FILTERS.map((value) => {
          const isActive = filter === value;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={isActive}
              onClick={() => { setFilter(value); setActiveIndex(0); }}
              style={isActive ? { color: "#ffffff", backgroundColor: "#26351e", borderColor: "#26351e" } : { color: "#26351e", backgroundColor: "#f5f3ed" }}
              className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition-all active:scale-95 ${
                isActive
                  ? "border-pb-green bg-pb-green text-white shadow-xs"
                  : "border-pb-border bg-pb-light text-pb-green hover:border-pb-khaki"
              }`}
            >
              {REVIEW_LABELS[value]} <span className="ml-1 opacity-80 font-extrabold">({counts[value]})</span>
            </button>
          );
        })}
      </div>

      {currentQuestion ? (
        <article className="mt-4 min-w-0 rounded-xl border border-pb-border/80 bg-pb-light/40 p-3.5 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-pb-border/60 pb-3">
            <p className="font-extrabold text-xs sm:text-sm text-pb-green">
              प्रश्न {currentQuestion.question_number} <span className="font-semibold text-slate-500">· {activeIndex + 1} / {filteredQuestions.length}</span>
            </p>
            <span
              style={{
                color: currentQuestion.result_status === "correct" ? "#065f46" : currentQuestion.result_status === "wrong" ? "#991b1b" : "#7b6f35",
                backgroundColor: currentQuestion.result_status === "correct" ? "#d1fae5" : currentQuestion.result_status === "wrong" ? "#fee2e2" : "#fef3c7"
              }}
              className="rounded-full px-2.5 py-0.5 text-xs font-extrabold"
            >
              {STATUS_LABELS[currentQuestion.result_status] || "उत्तर"}
            </span>
          </div>

          <p className="mt-3.5 break-words [overflow-wrap:anywhere] text-sm sm:text-base font-bold leading-6 sm:leading-7 text-slate-900">
            {currentQuestion.question_text}
          </p>
          {(currentQuestion.subject || currentQuestion.topic) && (
            <p className="mt-1.5 break-words text-xs font-semibold text-slate-500">
              {[currentQuestion.subject, currentQuestion.topic].filter(Boolean).join(" · ")}
            </p>
          )}

          {/* Options */}
          <ol className="mt-4 space-y-2">
            {(currentQuestion.options || []).map((option) => {
              const isCorrect = option.option_label === currentQuestion.correct_option;
              const isSelected = option.option_label === currentQuestion.selected_option;
              const colorClass = isCorrect
                ? "border-emerald-400 bg-emerald-50/90 text-emerald-950 font-bold"
                : isSelected
                  ? "border-rose-300 bg-rose-50/90 text-rose-950 font-semibold"
                  : "border-pb-border bg-white text-slate-700";
              return (
                <li key={option.option_label} className={`flex min-w-0 flex-wrap items-start justify-between gap-2 rounded-xl border p-2.5 sm:p-3 transition-all ${colorClass}`}>
                  <span className="min-w-0 break-words [overflow-wrap:anywhere] text-xs sm:text-sm leading-snug">
                    <strong className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-xs font-black text-slate-700">{option.option_label}</strong>
                    {option.option_text}
                  </span>
                  <span className="flex shrink-0 flex-wrap gap-1">
                    {isSelected && (
                      <span style={{ color: "#ffffff", backgroundColor: "#7b6f35" }} className="rounded-full px-2 py-0.5 text-[10px] font-black">
                        तुमचे उत्तर
                      </span>
                    )}
                    {isCorrect && (
                      <span style={{ color: "#ffffff", backgroundColor: "#15803d" }} className="rounded-full px-2 py-0.5 text-[10px] font-black">
                        योग्य उत्तर
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ol>

          {/* Summary Strip */}
          <div className="mt-3.5 grid grid-cols-2 gap-2 text-xs sm:text-sm">
            <div className="rounded-lg border border-pb-border/60 bg-white p-2.5">
              <span className="text-[11px] text-slate-500 block">तुमचे उत्तर:</span>
              <strong className="text-pb-green">{currentQuestion.selected_option_text || "उत्तर दिले नाही"}</strong>
            </div>
            <div className="rounded-lg border border-pb-border/60 bg-white p-2.5">
              <span className="text-[11px] text-slate-500 block">योग्य उत्तर:</span>
              <strong className="text-emerald-700">{currentQuestion.correct_option_text || currentQuestion.correct_option}</strong>
            </div>
            <div className="col-span-2 rounded-lg border border-pb-border/60 bg-white p-2.5 text-xs text-slate-700">
              मिळालेले गुण: <strong className="text-pb-green">{formatNumber(currentQuestion.marks_earned)} / {formatNumber(currentQuestion.marks)}</strong>
            </div>
          </div>

          {/* Explanation */}
          <div className="mt-3.5 rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 sm:p-4">
            <h3 className="flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-amber-900">
              <span>💡</span>
              <span>स्पष्टीकरण (Explanation)</span>
            </h3>
            <p className="mt-1.5 break-words [overflow-wrap:anywhere] text-xs sm:text-sm leading-6 text-slate-700">
              {currentQuestion.explanation || "या प्रश्नासाठी स्पष्टीकरण उपलब्ध नाही."}
            </p>
          </div>

          {/* Previous / Next question controls */}
          <div className="mt-4 flex items-center justify-between gap-2.5">
            <button
              type="button"
              disabled={activeIndex === 0}
              onClick={() => setActiveIndex((index) => Math.max(0, index - 1))}
              className="flex-1 rounded-xl border border-pb-border bg-white px-3 py-2.5 text-xs sm:text-sm font-bold text-pb-green shadow-xs transition hover:bg-pb-light active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ← मागील प्रश्न
            </button>
            <button
              type="button"
              disabled={activeIndex >= filteredQuestions.length - 1}
              onClick={() => setActiveIndex((index) => Math.min(filteredQuestions.length - 1, index + 1))}
              style={{ color: "#ffffff", backgroundColor: "#26351e" }}
              className="flex-1 rounded-xl bg-pb-green px-3 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs transition hover:bg-pb-khaki active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              पुढील प्रश्न →
            </button>
          </div>
        </article>
      ) : (
        <p className="mt-4 rounded-xl bg-pb-light p-4 text-xs sm:text-sm text-slate-600">
          या प्रकारचे प्रश्न उपलब्ध नाहीत.
        </p>
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
    : `${improvement > 0 ? "+" : ""}${formatNumber(improvement)}% गुण`;

  const percentageNum = Number(result?.percentage) || 0;
  const motivationalMessage =
    percentageNum >= 75
      ? { text: "उत्कृष्ट कामगिरी! 🏆 वर्दीचे स्वप्न नक्कीच पूर्ण होईल.", color: "bg-emerald-50 text-emerald-800 border-emerald-200" }
      : percentageNum >= 50
        ? { text: "चांगला प्रयत्न! 👏 आणखी थोडा सराव करून गुण वाढवा.", color: "bg-amber-50 text-amber-800 border-amber-200" }
        : { text: "पुन्हा सराव करा! 💪 सातत्याने अभ्यास केल्यास नक्की सुधारणा होईल.", color: "bg-blue-50 text-blue-800 border-blue-200" };

  return (
    <main className="min-h-screen bg-pb-light pb-12">
      {/* Top Banner */}
      <header className="border-b border-pb-border/70 bg-white">
        <div className="mx-auto max-w-5xl px-3.5 py-4 sm:px-6 sm:py-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs font-bold text-pb-khaki">
            <Link to="/student/dashboard" className="hover:underline">Dashboard</Link>
            <span>/</span>
            <Link to="/student/tests" className="hover:underline">सराव चाचण्या</Link>
            <span>/</span>
            <Link to="/student/tests/history" className="hover:underline">इतिहास</Link>
            <span>/</span>
            <span className="text-slate-500">निकाल</span>
          </div>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-extrabold text-pb-green sm:text-2xl lg:text-3xl">
                चाचणी निकाल (Test Result)
              </h1>
              {result && (
                <p className="mt-1 break-words text-xs sm:text-sm font-semibold text-slate-600">
                  {result.test_title}
                </p>
              )}
            </div>
            <Link
              to="/student/tests"
              style={{ color: "#ffffff", backgroundColor: "#26351e" }}
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-pb-green px-3.5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-pb-khaki active:scale-95 sm:px-4 sm:py-2.5 sm:text-sm"
            >
              <span>+ नवी चाचणी</span>
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-3.5 py-4 sm:px-6 sm:py-6 lg:px-8">
        {loading ? (
          <div role="status" aria-live="polite" className="rounded-2xl border border-pb-border/80 bg-white p-10 text-center text-sm font-semibold text-slate-600 shadow-xs">
            <span className="mx-auto mb-3 block h-9 w-9 animate-spin rounded-full border-4 border-pb-border border-t-pb-khaki" />
            निकाल लोड होत आहे...
          </div>
        ) : error ? (
          <div role="alert" className="rounded-2xl border border-red-200 bg-white p-6 sm:p-8 text-center shadow-xs">
            <p className="font-bold text-red-700">{error}</p>
            <button
              type="button"
              onClick={loadResult}
              style={{ color: "#ffffff", backgroundColor: "#26351e" }}
              className="mt-4 rounded-xl bg-pb-green px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-pb-khaki"
            >
              पुन्हा प्रयत्न करा
            </button>
          </div>
        ) : result ? (
          <div className="space-y-4 sm:space-y-5">
            {/* Motivational message badge */}
            <div className={`rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm font-bold ${motivationalMessage.color}`}>
              {motivationalMessage.text}
            </div>

            {/* Scorecard Hero Card */}
            <section
              id="result-summary"
              aria-label="Score summary"
              className="scroll-mt-6 rounded-xl border border-pb-border/80 bg-white p-4 shadow-xs sm:rounded-2xl sm:p-6"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-pb-border/60 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-pb-green to-[#1b2615] text-white shadow-md">
                    <span className="text-xl sm:text-2xl font-black">{formatNumber(result.percentage)}%</span>
                  </div>
                  <div>
                    <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wide">प्राप्त गुण</p>
                    <p className="text-xl sm:text-2xl font-black text-pb-green">
                      {formatNumber(result.score)} <span className="text-xs sm:text-sm font-semibold text-slate-500">/ {formatNumber(result.total_marks)}</span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-lg border border-pb-border/70 bg-pb-light px-3 py-1.5 text-xs font-bold text-slate-700">
                    अचूकता: <strong className="text-pb-green">{formatNumber(result.accuracy)}%</strong>
                  </span>
                  <span className="rounded-lg border border-pb-border/70 bg-pb-light px-3 py-1.5 text-xs font-bold text-slate-700">
                    वेळ: <strong className="text-pb-green">{formatDuration(result.time_taken_seconds)}</strong>
                  </span>
                  {result.rank && (
                    <span className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-900">
                      क्रमांक: <strong>#{result.rank}</strong>
                    </span>
                  )}
                </div>
              </div>

              {/* Question Breakdown Pills */}
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-2.5 sm:p-3 text-center">
                  <p className="text-[11px] font-bold text-emerald-800">✅ बरोबर</p>
                  <p className="mt-0.5 text-lg sm:text-xl font-black text-emerald-900">{result.correct_answers}</p>
                </div>
                <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-2.5 sm:p-3 text-center">
                  <p className="text-[11px] font-bold text-rose-800">❌ चुकीचे</p>
                  <p className="mt-0.5 text-lg sm:text-xl font-black text-rose-900">{result.wrong_answers}</p>
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-2.5 sm:p-3 text-center">
                  <p className="text-[11px] font-bold text-amber-800">⏭️ अनुत्तरित</p>
                  <p className="mt-0.5 text-lg sm:text-xl font-black text-amber-900">{result.skipped_questions}</p>
                </div>
                <div className="rounded-xl border border-pb-border bg-pb-light p-2.5 sm:p-3 text-center">
                  <p className="text-[11px] font-bold text-slate-600">📝 एकूण प्रश्न</p>
                  <p className="mt-0.5 text-lg sm:text-xl font-black text-pb-green">{result.attempted_questions}</p>
                </div>
              </div>

              {/* Previous attempt comparison if available */}
              {previousAvailable && (
                <div className="mt-3.5 rounded-xl border border-pb-border/60 bg-pb-light/60 p-3 text-xs text-slate-700">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <span>मागील प्रयत्न: <strong>{formatNumber(result.previous_percentage)}% ({formatNumber(result.previous_score)} गुण)</strong></span>
                    <span className="font-bold text-pb-green">सुधारणा: {improvementLabel}</span>
                  </div>
                </div>
              )}
            </section>

            {/* Topics Review (Strong & Weak Topics) */}
            <div className="grid gap-3.5 sm:grid-cols-2">
              <TopicList title="मजबूत घटक (Strong Topics)" topics={result.strong_topics} kind="strong" />
              <TopicList title="सुधारणा आवश्यक (Weak Topics)" topics={result.weak_topics} kind="weak" />
            </div>

            {/* Questions Review */}
            <QuestionReview questions={result.question_review || []} />

            {/* Action Buttons */}
            <nav className="mt-6 flex flex-col gap-2.5 sm:flex-row">
              <Link
                to="/student/tests"
                style={{ color: "#ffffff", backgroundColor: "#26351e" }}
                className="inline-flex flex-1 justify-center rounded-xl bg-pb-green px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-xs transition hover:bg-pb-khaki active:scale-95 text-center"
              >
                ← सर्व चाचण्या पहा
              </Link>
              <Link
                to="/student/tests/history"
                className="inline-flex flex-1 justify-center rounded-xl border border-pb-border bg-white px-5 py-3 text-xs sm:text-sm font-bold text-pb-green shadow-xs transition hover:bg-pb-light active:scale-95 text-center"
              >
                माझा चाचणी इतिहास 📜
              </Link>
              <Link
                to={`/student/tests/${testId}`}
                className="inline-flex flex-1 justify-center rounded-xl border border-pb-border bg-white px-5 py-3 text-xs sm:text-sm font-bold text-pb-khaki shadow-xs transition hover:bg-pb-light active:scale-95 text-center"
              >
                चाचणी तपशील ℹ️
              </Link>
            </nav>
          </div>
        ) : null}
      </section>
    </main>
  );
}

export default TestResult;
