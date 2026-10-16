import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getTestAttemptResult } from "../../../services/testService";

/* ---------- SVG ICON SET ---------- */
const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.8",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": "true",
};

const TrophyIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M8 3h8v6a4 4 0 0 1-8 0Z" />
    <path d="M8 5H5v2a3 3 0 0 0 3 3M16 5h3v2a3 3 0 0 1-3 3" />
    <path d="M10 13v3h4v-3M8 19h8M9 16h6" />
  </svg>
);
const TargetIcon = (p) => (
  <svg {...iconProps} {...p}>
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="12" cy="12" r="1" />
  </svg>
);
const CheckCircleIcon = (p) => (
  <svg {...iconProps} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m8.5 12 2.5 2.5L16 9.5" />
  </svg>
);
const XCircleIcon = (p) => (
  <svg {...iconProps} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m9 9 6 6M15 9l-6 6" />
  </svg>
);
const SkipIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="m5 4 10 8-10 8Z" />
    <path d="M19 4v16" />
  </svg>
);
const FileTextIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M6 3h9l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
    <path d="M14 3v6h6M8 13h8M8 17h5" />
  </svg>
);
const ClockIcon = (p) => (
  <svg {...iconProps} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);
const AwardIcon = (p) => (
  <svg {...iconProps} {...p}>
    <circle cx="12" cy="9" r="5" />
    <path d="m8.5 13.5-2 7 5.5-3 5.5 3-2-7" />
  </svg>
);
const TrendingUpIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="m3 17 5-5 4 3 8-8" />
    <path d="M14 7h6v6" />
  </svg>
);
const DumbbellIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M6 6v12M3 8v8M18 6v12M21 8v8M6 12h12" />
  </svg>
);
const SparklesIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.3 6.3l2.8 2.8M14.9 14.9l2.8 2.8M17.7 6.3l-2.8 2.8M9.1 14.9l-2.8 2.8" />
  </svg>
);
const LightbulbIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M9 18h6M10 21h4" />
    <path d="M12 3a6 6 0 0 0-4 10.5c.6.6 1 1.4 1 2.5h6c0-1.1.4-1.9 1-2.5A6 6 0 0 0 12 3Z" />
  </svg>
);
const HomeIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="m3 11 9-7 9 7v9a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2Z" />
  </svg>
);
const ChevronRightIcon = (p) => (
  <svg {...iconProps} strokeWidth="2.2" {...p}>
    <path d="m9 6 6 6-6 6" />
  </svg>
);
const ChevronLeftIcon = (p) => (
  <svg {...iconProps} strokeWidth="2.2" {...p}>
    <path d="m15 6-6 6 6 6" />
  </svg>
);
const ArrowLeftIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M19 12H5" />
    <path d="m11 18-6-6 6-6" />
  </svg>
);
const ArrowUpIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M12 19V5" />
    <path d="m6 11 6-6 6 6" />
  </svg>
);
const PlusIcon = (p) => (
  <svg {...iconProps} strokeWidth="2" {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
const AlertIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M10.3 3.9 2.4 17a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9v4M12 17h.01" />
  </svg>
);
const RefreshIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M21 12a9 9 0 1 1-3-6.7" />
    <path d="M21 4v5h-5" />
  </svg>
);
const SpinnerIcon = (p) => (
  <svg {...iconProps} strokeWidth="2.4" {...p}>
    <path d="M21 12a9 9 0 1 1-6.2-8.5" />
  </svg>
);
const ClipboardIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M8 4H5.5A1.5 1.5 0 0 0 4 5.5v14A1.5 1.5 0 0 0 5.5 21h13a1.5 1.5 0 0 0 1.5-1.5v-14A1.5 1.5 0 0 0 18.5 4H16" />
    <path d="M9 3h6v4H9zM8 13l2.5 2.5L16 10" />
  </svg>
);
const BookIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 0-2 2Z" />
    <path d="M18 3v18" />
  </svg>
);

/* ---------- UTILITIES (unchanged) ---------- */
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

/* ---------- ANIMATIONS ---------- */
function AnimationStyles() {
  return (
    <style>{`
      @keyframes blobMove {
        0%, 100% { transform: translate(0px, 0px) scale(1); }
        33% { transform: translate(40px, -60px) scale(1.12); }
        66% { transform: translate(-30px, 30px) scale(0.94); }
      }
      @keyframes fadeUp {
        from { opacity: 0; transform: translateY(12px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes gradientPan {
        0%, 100% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
      }
      @keyframes softGlow {
        0%, 100% { opacity: 0.45; transform: scale(1); }
        50% { opacity: 0.85; transform: scale(1.12); }
      }
      @keyframes spinSoft { to { transform: rotate(360deg); } }
      @keyframes popIn {
        0% { opacity: 0; transform: scale(0.85); }
        60% { opacity: 1; transform: scale(1.03); }
        100% { opacity: 1; transform: scale(1); }
      }
      .animate-blob { animation: blobMove 22s ease-in-out infinite; }
      .delay-2 { animation-delay: 4s; }
      .delay-4 { animation-delay: 8s; }
      .animate-fade-up { animation: fadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }
      .animate-gradient { background-size: 220% 220%; animation: gradientPan 9s ease infinite; }
      .animate-soft-glow { animation: softGlow 4.5s ease-in-out infinite; }
      .animate-spin-soft { animation: spinSoft 0.9s linear infinite; }
      .animate-pop-in { animation: popIn 0.45s cubic-bezier(0.22, 1, 0.36, 1) both; }
      @media (prefers-reduced-motion: reduce) {
        .animate-blob, .animate-fade-up, .animate-gradient,
        .animate-soft-glow, .animate-spin-soft, .animate-pop-in { animation: none !important; }
      }
    `}</style>
  );
}

function AnimatedBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-gradient-to-br from-pb-light via-white to-pb-light" />
      <div
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(15,23,42,0.06) 1px, transparent 0)",
          backgroundSize: "26px 26px",
        }}
      />
      <div className="animate-blob absolute -top-32 -left-28 h-80 w-80 rounded-full bg-pb-khaki/20 blur-3xl" />
      <div className="animate-blob delay-2 absolute top-1/3 -right-28 h-72 w-72 rounded-full bg-pb-green/12 blur-3xl" />
      <div className="animate-blob delay-4 absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-pb-khaki/15 blur-3xl" />
    </div>
  );
}

/* ---------- METRIC CARD ---------- */
function MetricCard({ label, value, prominent = false, color = "text-pb-green" }) {
  return (
    <article
      className={`rounded-xl border border-pb-border-soft bg-white/70 p-3.5 transition-colors duration-200 hover:bg-white sm:rounded-2xl sm:p-5 ${prominent ? "col-span-2 sm:col-span-1" : ""
        }`}
    >
      <p className="text-[10px] font-bold tracking-wide text-slate-500 uppercase sm:text-xs">
        {label}
      </p>
      <p
        className={`mt-1 break-words font-black tabular-nums ${color} ${prominent ? "text-2xl sm:text-3xl" : "text-lg sm:text-2xl"
          }`}
      >
        {value}
      </p>
    </article>
  );
}

/* ---------- TOPIC LIST ---------- */
function TopicList({ title, topics, kind }) {
  const strong = kind === "strong";
  const HeaderIcon = strong ? DumbbellIcon : TargetIcon;
  const headerTone = strong
    ? "bg-pb-green/10 text-pb-green"
    : "bg-pb-khaki/15 text-pb-khaki";

  return (
    <section className="animate-fade-up relative overflow-hidden rounded-2xl border border-pb-border bg-white/90 shadow-sm backdrop-blur-sm">
      <span
        aria-hidden="true"
        className={`block h-1 w-full ${strong
            ? "bg-gradient-to-r from-pb-green via-pb-khaki to-pb-green"
            : "bg-gradient-to-r from-pb-khaki via-[#e1d37f] to-pb-khaki"
          }`}
      />
      <div className="p-5 sm:p-6">
        <div className="flex items-center gap-2.5">
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${headerTone}`}
          >
            <HeaderIcon className="h-4 w-4" />
          </span>
          <h2 className="text-base leading-tight font-extrabold tracking-tight text-pb-green sm:text-lg">
            {title}
          </h2>
        </div>

        {topics?.length ? (
          <ul className="mt-3.5 grid gap-2.5 sm:grid-cols-2">
            {topics.map((topic) => (
              <li
                key={topic.topic_id}
                className="group min-w-0 rounded-xl border border-pb-border-soft bg-white/70 p-3.5 transition-colors duration-200 hover:bg-white"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="min-w-0 text-xs leading-snug font-extrabold break-words text-pb-green sm:text-sm">
                    {topic.topic_name}
                  </h3>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold tabular-nums text-white shadow-sm sm:text-xs ${strong ? "bg-pb-green" : "bg-pb-khaki"
                      }`}
                  >
                    {formatNumber(topic.percentage)}%
                  </span>
                </div>
                <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold text-slate-600 sm:text-xs">
                  <span className="inline-flex items-center gap-1">
                    <CheckCircleIcon className="h-3 w-3 text-emerald-600" />
                    {topic.correct} बरोबर
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="inline-flex items-center gap-1">
                    <XCircleIcon className="h-3 w-3 text-rose-600" />
                    {topic.wrong} चुकीचे
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="tabular-nums">
                    {topic.attempted}/{topic.total_questions} सोडवले
                  </span>
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 rounded-lg border border-dashed border-[#d9d2c3] bg-pb-light/70 p-3 text-xs text-slate-600 sm:text-sm">
            या चाचणीसाठी कोणतेही {strong ? "मजबूत" : "कमकुवत"} घटक आढळले नाहीत.
          </p>
        )}
      </div>
    </section>
  );
}

/* ---------- QUESTION REVIEW ---------- */
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

  const counts = useMemo(
    () => ({
      all: questions.length,
      correct: questions.filter((q) => q.result_status === "correct").length,
      wrong: questions.filter((q) => q.result_status === "wrong").length,
      skipped: questions.filter((q) => q.result_status === "skipped").length,
    }),
    [questions],
  );

  const filteredQuestions = useMemo(
    () =>
      filter === "all"
        ? questions
        : questions.filter((q) => q.result_status === filter),
    [filter, questions],
  );

  const currentQuestion = filteredQuestions[activeIndex];

  if (!questions.length) return null;

  const statusStyle = (status) => {
    if (status === "correct")
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    if (status === "wrong")
      return "border-rose-200 bg-rose-50 text-rose-700";
    return "border-amber-200 bg-amber-50 text-amber-700";
  };

  return (
    <section
      id="question-review"
      aria-label="Question-wise answer review"
      className="animate-fade-up scroll-mt-6 overflow-hidden rounded-2xl border border-pb-border bg-white/90 shadow-sm backdrop-blur-sm"
    >
      <span
        aria-hidden="true"
        className="block h-1 w-full bg-gradient-to-r from-pb-green via-pb-khaki to-pb-green"
      />

      <div className="p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-pb-green/10 text-pb-green">
              <ClipboardIcon className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[10px] font-bold tracking-[0.14em] text-pb-khaki uppercase sm:text-xs">
                प्रश्नांचे पुनरावलोकन
              </p>
              <h2 className="mt-0.5 text-base leading-tight font-extrabold tracking-tight text-pb-green sm:text-lg">
                प्रत्येक प्रश्नाचे उत्तर तपासा
              </h2>
            </div>
          </div>
          <a
            href="#result-summary"
            className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-lg border border-pb-border bg-white px-3 py-1.5 text-xs font-bold text-pb-khaki transition-all duration-200 hover:-translate-y-0.5 hover:border-pb-khaki hover:bg-pb-light hover:shadow-sm active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none"
          >
            <ArrowUpIcon className="h-3.5 w-3.5" />
            निकालाच्या सारांशाकडे जा
          </a>
        </div>

        {/* Filter tabs */}
        <div
          className="mt-4 flex flex-wrap gap-1.5"
          aria-label="Filter reviewed questions"
        >
          {REVIEW_FILTERS.map((value) => {
            const isActive = filter === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={isActive}
                onClick={() => {
                  setFilter(value);
                  setActiveIndex(0);
                }}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all duration-200 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none ${isActive
                    ? "border-transparent bg-gradient-to-r from-pb-green to-[#0f3d2e] text-white shadow-sm"
                    : "border-pb-border bg-white text-pb-green hover:-translate-y-0.5 hover:border-pb-khaki hover:bg-pb-light hover:shadow-sm active:translate-y-0"
                  }`}
              >
                {REVIEW_LABELS[value]}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-extrabold tabular-nums ${isActive ? "bg-white/20" : "bg-pb-light"
                    }`}
                >
                  {counts[value]}
                </span>
              </button>
            );
          })}
        </div>

        {currentQuestion ? (
          <article className="animate-pop-in mt-4 min-w-0 overflow-hidden rounded-2xl border border-pb-border-soft bg-pb-light/40">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-pb-border-soft bg-white/60 px-4 py-3">
              <p className="text-xs font-extrabold text-pb-green sm:text-sm">
                प्रश्न {currentQuestion.question_number}{" "}
                <span className="font-semibold tabular-nums text-slate-500">
                  · {activeIndex + 1} / {filteredQuestions.length}
                </span>
              </p>
              <span
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-extrabold tracking-wide uppercase sm:text-xs ${statusStyle(
                  currentQuestion.result_status,
                )}`}
              >
                {currentQuestion.result_status === "correct" ? (
                  <CheckCircleIcon className="h-3 w-3" />
                ) : currentQuestion.result_status === "wrong" ? (
                  <XCircleIcon className="h-3 w-3" />
                ) : (
                  <SkipIcon className="h-3 w-3" />
                )}
                {STATUS_LABELS[currentQuestion.result_status] || "उत्तर"}
              </span>
            </div>

            <div className="p-4 sm:p-5">
              {/* Question text */}
              <p className="text-sm leading-6 font-bold break-words [overflow-wrap:anywhere] text-slate-900 sm:text-base sm:leading-7">
                {currentQuestion.question_text}
              </p>
              {(currentQuestion.subject || currentQuestion.topic) && (
                <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs font-semibold text-slate-500">
                  {currentQuestion.subject && (
                    <span className="inline-flex items-center gap-1.5">
                      <BookIcon className="h-3 w-3 shrink-0" />
                      {currentQuestion.subject}
                    </span>
                  )}
                  {currentQuestion.subject && currentQuestion.topic && (
                    <span className="text-slate-300">·</span>
                  )}
                  {currentQuestion.topic && (
                    <span className="inline-flex items-center gap-1.5">
                      <TargetIcon className="h-3 w-3 shrink-0" />
                      {currentQuestion.topic}
                    </span>
                  )}
                </p>
              )}

              {/* Options */}
              <ol className="mt-4 space-y-2">
                {(currentQuestion.options || []).map((option) => {
                  const isCorrect =
                    option.option_label === currentQuestion.correct_option;
                  const isSelected =
                    option.option_label === currentQuestion.selected_option;
                  const optionClass = isCorrect
                    ? "border-emerald-300 bg-emerald-50/90"
                    : isSelected
                      ? "border-rose-300 bg-rose-50/90"
                      : "border-pb-border-soft bg-white";

                  return (
                    <li
                      key={option.option_label}
                      className={`flex min-w-0 flex-wrap items-start justify-between gap-2 rounded-xl border p-2.5 transition-colors sm:p-3 ${optionClass}`}
                    >
                      <span className="min-w-0 text-xs leading-snug break-words [overflow-wrap:anywhere] sm:text-sm">
                        <strong
                          className={`mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black text-white ${isCorrect
                              ? "bg-emerald-600"
                              : isSelected
                                ? "bg-rose-500"
                                : "bg-slate-400"
                            }`}
                        >
                          {option.option_label}
                        </strong>
                        {option.option_text}
                      </span>
                      <span className="flex shrink-0 flex-wrap gap-1">
                        {isSelected && (
                          <span className="rounded-full bg-pb-khaki px-2 py-0.5 text-[10px] font-extrabold text-white">
                            तुमचे उत्तर
                          </span>
                        )}
                        {isCorrect && (
                          <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-extrabold text-white">
                            योग्य उत्तर
                          </span>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ol>

              {/* Summary strip */}
              <div className="mt-3.5 grid grid-cols-2 gap-2 text-xs sm:text-sm">
                <div className="rounded-xl border border-pb-border-soft bg-white p-3">
                  <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-wide text-slate-500 uppercase">
                    <TargetIcon className="h-3 w-3" />
                    तुमचे उत्तर
                  </span>
                  <strong className="mt-1 block break-words text-pb-green">
                    {currentQuestion.selected_option_text || "उत्तर दिले नाही"}
                  </strong>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
                  <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-wide text-emerald-700 uppercase">
                    <CheckCircleIcon className="h-3 w-3" />
                    योग्य उत्तर
                  </span>
                  <strong className="mt-1 block break-words text-emerald-800">
                    {currentQuestion.correct_option_text ||
                      currentQuestion.correct_option}
                  </strong>
                </div>
                <div className="col-span-2 rounded-xl border border-pb-border-soft bg-white p-3">
                  <span className="text-[10px] font-bold tracking-wide text-slate-500 uppercase">
                    मिळालेले गुण
                  </span>
                  <p className="mt-1 text-sm font-extrabold tabular-nums text-pb-green">
                    {formatNumber(currentQuestion.marks_earned)} /{" "}
                    {formatNumber(currentQuestion.marks)}
                  </p>
                </div>
              </div>

              {/* Explanation */}
              <div className="mt-3.5 overflow-hidden rounded-xl border border-amber-200 bg-amber-50/70">
                <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-100/60 px-3.5 py-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-amber-200 text-amber-900">
                    <LightbulbIcon className="h-3 w-3" />
                  </span>
                  <h3 className="text-xs font-extrabold tracking-wide text-amber-900 uppercase sm:text-sm">
                    स्पष्टीकरण
                  </h3>
                </div>
                <p className="p-3.5 text-xs leading-6 break-words [overflow-wrap:anywhere] text-slate-700 sm:text-sm">
                  {currentQuestion.explanation ||
                    "या प्रश्नासाठी स्पष्टीकरण उपलब्ध नाही."}
                </p>
              </div>

              {/* Nav */}
              <div className="mt-4 flex items-center justify-between gap-2.5">
                <button
                  type="button"
                  disabled={activeIndex === 0}
                  onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
                  className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-pb-border bg-white px-3 py-2.5 text-xs font-bold text-pb-green shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-pb-khaki hover:bg-pb-light hover:shadow-md active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 sm:text-sm"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                  मागील प्रश्न
                </button>
                <button
                  type="button"
                  disabled={activeIndex >= filteredQuestions.length - 1}
                  onClick={() =>
                    setActiveIndex((i) =>
                      Math.min(filteredQuestions.length - 1, i + 1),
                    )
                  }
                  className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-pb-green to-[#0f3d2e] px-3 py-2.5 text-xs font-extrabold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:from-pb-khaki hover:to-[#c9b95f] hover:shadow-lg active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 sm:text-sm"
                >
                  पुढील प्रश्न
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </article>
        ) : (
          <p className="mt-4 rounded-xl border border-dashed border-[#d9d2c3] bg-pb-light/70 p-4 text-xs text-slate-600 sm:text-sm">
            या प्रकारचे प्रश्न उपलब्ध नाहीत.
          </p>
        )}
      </div>
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
      setError(
        requestError.response?.data?.message ||
        requestError.message ||
        "Could not load the result. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [attemptId, testId]);

  useEffect(() => {
    Promise.resolve().then(loadResult);
  }, [loadResult]);

  const previousAvailable =
    result?.previous_percentage !== null &&
    result?.previous_percentage !== undefined;
  const improvement = result?.improvement_percentage_points;
  const improvementLabel =
    improvement === null || improvement === undefined
      ? "—"
      : `${improvement > 0 ? "+" : ""}${formatNumber(improvement)}% गुण`;

  const percentageNum = Number(result?.percentage) || 0;
  const motivationalMessage =
    percentageNum >= 75
      ? {
        text: "उत्कृष्ट कामगिरी! वर्दीचे स्वप्न नक्कीच पूर्ण होईल.",
        tone: "border-emerald-200 bg-emerald-50 text-emerald-800",
        icon: TrophyIcon,
      }
      : percentageNum >= 50
        ? {
          text: "चांगला प्रयत्न! आणखी थोडा सराव करून गुण वाढवा.",
          tone: "border-amber-200 bg-amber-50 text-amber-800",
          icon: TrendingUpIcon,
        }
        : {
          text: "पुन्हा सराव करा! सातत्याने अभ्यास केल्यास नक्की सुधारणा होईल.",
          tone: "border-pb-khaki/30 bg-pb-khaki/10 text-pb-khaki",
          icon: SparklesIcon,
        };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-pb-light">
      <AnimationStyles />
      <AnimatedBackground />

      <div className="relative z-10">

        {/* ================= BREADCRUMB + HEADER ================= */}
        <div className="animate-fade-up mx-auto mt-4 w-[calc(100%-2rem)] max-w-5xl overflow-hidden rounded-2xl border border-pb-border/50 bg-white/85 shadow-sm backdrop-blur-sm sm:mt-6 sm:w-[calc(100%-3rem)] lg:w-[calc(100%-4rem)]">
          <span
            aria-hidden="true"
            className="animate-gradient pointer-events-none block h-1 w-full bg-gradient-to-r from-pb-green via-pb-khaki to-pb-green"
          />

          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="min-w-0">
              {/* Breadcrumb */}
              <nav
                aria-label="Breadcrumb"
                className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold text-pb-khaki sm:text-xs"
              >
                <Link
                  to="/student/dashboard"
                  className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 transition-all duration-200 hover:bg-pb-light hover:text-pb-green focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none"
                >
                  <HomeIcon className="h-3.5 w-3.5" />
                  Dashboard
                </Link>
                <ChevronRightIcon className="h-3 w-3 text-slate-400" />
                <Link
                  to="/student/tests"
                  className="rounded-md px-1.5 py-0.5 transition-all duration-200 hover:bg-pb-light hover:text-pb-green focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none"
                >
                  सराव चाचण्या
                </Link>
                <ChevronRightIcon className="h-3 w-3 text-slate-400" />
                <Link
                  to="/student/tests/history"
                  className="rounded-md px-1.5 py-0.5 transition-all duration-200 hover:bg-pb-light hover:text-pb-green focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none"
                >
                  इतिहास
                </Link>
                <ChevronRightIcon className="h-3 w-3 text-slate-400" />
                <span className="text-slate-500">निकाल</span>
              </nav>

              {/* Title */}
              <div className="mt-4 flex min-w-0 items-center gap-4">
                <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-pb-green to-[#0f3d2e] text-white shadow-md">
                  <span
                    aria-hidden="true"
                    className="animate-soft-glow pointer-events-none absolute -inset-1 rounded-3xl bg-pb-khaki/30 blur-md"
                  />
                  <TrophyIcon className="relative h-6 w-6" />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold tracking-[0.16em] text-pb-khaki uppercase sm:text-xs">
                    Test Result
                  </p>
                  <h1 className="mt-1 text-xl leading-tight font-extrabold tracking-tight text-pb-green sm:text-2xl lg:text-3xl">
                    चाचणी निकाल
                  </h1>
                  {result && (
                    <p className="mt-1 max-w-2xl text-xs leading-5 font-semibold break-words text-slate-600 sm:text-sm">
                      {result.test_title}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <Link
              to="/student/tests"
              className="group inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pb-green to-[#0f3d2e] px-5 py-2.5 text-sm font-extrabold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:from-pb-khaki hover:to-[#c9b95f] hover:shadow-lg active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <PlusIcon className="h-4 w-4" />
              नवी चाचणी
            </Link>
          </div>
        </div>

        <section className="mx-auto max-w-5xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">

          {/* ================= LOADING ================= */}
          {loading ? (
            <div
              role="status"
              aria-live="polite"
              className="animate-fade-up flex flex-col items-center justify-center gap-3 rounded-2xl border border-pb-border bg-white/85 px-5 py-12 text-center backdrop-blur-sm"
            >
              <SpinnerIcon className="animate-spin-soft h-10 w-10 text-pb-khaki" />
              <p className="text-sm font-semibold text-pb-green">
                निकाल लोड होत आहे...
              </p>
              <p className="text-xs text-slate-500">Fetching your result.</p>
            </div>
          ) : error ? (
            /* ================= ERROR ================= */
            <div
              role="alert"
              className="animate-fade-up overflow-hidden rounded-2xl border border-red-200 bg-white/90 backdrop-blur-sm"
            >
              <span
                aria-hidden="true"
                className="block h-1 w-full bg-gradient-to-r from-red-500 via-red-600 to-red-500"
              />
              <div className="flex flex-col items-center gap-4 p-7 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                  <AlertIcon className="h-6 w-6" />
                </span>
                <p className="max-w-md text-sm font-semibold text-red-700">{error}</p>
                <button
                  type="button"
                  onClick={loadResult}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-pb-green to-[#0f3d2e] px-5 py-2.5 text-sm font-extrabold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:from-pb-khaki hover:to-[#c9b95f] hover:shadow-lg active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  <RefreshIcon className="h-4 w-4" />
                  पुन्हा प्रयत्न करा
                </button>
              </div>
            </div>
          ) : result ? (
            <div className="space-y-5">

              {/* ================= MOTIVATION BANNER ================= */}
              {(() => {
                const Icon = motivationalMessage.icon;
                return (
                  <div
                    className={`animate-fade-up flex items-start gap-3 overflow-hidden rounded-2xl border px-4 py-3.5 text-sm font-bold backdrop-blur-sm ${motivationalMessage.tone}`}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/70 shadow-sm">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 self-center">{motivationalMessage.text}</span>
                  </div>
                );
              })()}

              {/* ================= SCORECARD HERO ================= */}
              <section
                id="result-summary"
                aria-label="Score summary"
                className="animate-fade-up relative scroll-mt-6 overflow-hidden rounded-2xl border border-pb-border bg-white/90 shadow-sm backdrop-blur-sm"
              >
                <span
                  aria-hidden="true"
                  className="animate-gradient pointer-events-none block h-1 w-full bg-gradient-to-r from-pb-green via-pb-khaki to-pb-green"
                />

                <div className="p-5 sm:p-6">
                  {/* Hero row */}
                  <div className="flex flex-col gap-5 border-b border-pb-border-soft pb-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      {/* Big percentage tile */}
                      <span className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-pb-green to-[#0f3d2e] text-white shadow-lg sm:h-20 sm:w-20">
                        <span
                          aria-hidden="true"
                          className="animate-soft-glow pointer-events-none absolute -inset-1.5 rounded-3xl bg-pb-khaki/30 blur-lg"
                        />
                        <span className="relative text-lg font-black tabular-nums sm:text-2xl">
                          {formatNumber(result.percentage)}%
                        </span>
                      </span>

                      <div className="min-w-0">
                        <p className="text-[10px] font-bold tracking-[0.14em] text-slate-500 uppercase sm:text-xs">
                          प्राप्त गुण
                        </p>
                        <p className="mt-1 text-xl leading-tight font-black text-pb-green tabular-nums sm:text-2xl">
                          {formatNumber(result.score)}{" "}
                          <span className="text-xs font-semibold text-slate-500 sm:text-sm">
                            / {formatNumber(result.total_marks)}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Inline chips */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-xl border border-pb-border bg-pb-light px-3 py-1.5 text-xs font-bold text-slate-700">
                        <TargetIcon className="h-3.5 w-3.5 text-pb-green" />
                        अचूकता:
                        <strong className="text-pb-green">
                          {formatNumber(result.accuracy)}%
                        </strong>
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-xl border border-pb-border bg-pb-light px-3 py-1.5 text-xs font-bold text-slate-700">
                        <ClockIcon className="h-3.5 w-3.5 text-pb-green" />
                        वेळ:
                        <strong className="text-pb-green">
                          {formatDuration(result.time_taken_seconds)}
                        </strong>
                      </span>
                      {result.rank && (
                        <span className="inline-flex items-center gap-1.5 rounded-xl border border-pb-khaki/30 bg-pb-khaki/10 px-3 py-1.5 text-xs font-bold text-pb-khaki">
                          <AwardIcon className="h-3.5 w-3.5" />
                          क्रमांक:
                          <strong>#{result.rank}</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Question breakdown */}
                  <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-center">
                      <p className="flex items-center justify-center gap-1.5 text-[10px] font-extrabold tracking-wide text-emerald-800 uppercase">
                        <CheckCircleIcon className="h-3.5 w-3.5" />
                        बरोबर
                      </p>
                      <p className="mt-1 text-xl font-black tabular-nums text-emerald-900 sm:text-2xl">
                        {result.correct_answers}
                      </p>
                    </div>

                    <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-center">
                      <p className="flex items-center justify-center gap-1.5 text-[10px] font-extrabold tracking-wide text-rose-800 uppercase">
                        <XCircleIcon className="h-3.5 w-3.5" />
                        चुकीचे
                      </p>
                      <p className="mt-1 text-xl font-black tabular-nums text-rose-900 sm:text-2xl">
                        {result.wrong_answers}
                      </p>
                    </div>

                    <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-center">
                      <p className="flex items-center justify-center gap-1.5 text-[10px] font-extrabold tracking-wide text-amber-800 uppercase">
                        <SkipIcon className="h-3.5 w-3.5" />
                        अनुत्तरित
                      </p>
                      <p className="mt-1 text-xl font-black tabular-nums text-amber-900 sm:text-2xl">
                        {result.skipped_questions}
                      </p>
                    </div>

                    <div className="rounded-xl border border-pb-border bg-pb-light p-3 text-center">
                      <p className="flex items-center justify-center gap-1.5 text-[10px] font-extrabold tracking-wide text-slate-600 uppercase">
                        <FileTextIcon className="h-3.5 w-3.5" />
                        एकूण प्रश्न
                      </p>
                      <p className="mt-1 text-xl font-black tabular-nums text-pb-green sm:text-2xl">
                        {result.attempted_questions}
                      </p>
                    </div>
                  </div>

                  {/* Previous comparison */}
                  {previousAvailable && (
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-pb-border-soft bg-pb-light/60 px-4 py-3 text-xs text-slate-700 sm:text-sm">
                      <span className="flex items-center gap-1.5">
                        <TrendingUpIcon className="h-3.5 w-3.5 text-slate-500" />
                        मागील प्रयत्न:{" "}
                        <strong className="text-pb-green">
                          {formatNumber(result.previous_percentage)}% (
                          {formatNumber(result.previous_score)} गुण)
                        </strong>
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-pb-khaki/30 bg-pb-khaki/10 px-3 py-1 font-extrabold text-pb-khaki">
                        सुधारणा: {improvementLabel}
                      </span>
                    </div>
                  )}
                </div>
              </section>

              {/* ================= TOPIC LISTS ================= */}
              <div className="grid gap-4 sm:grid-cols-2">
                <TopicList
                  title="मजबूत घटक"
                  topics={result.strong_topics}
                  kind="strong"
                />
                <TopicList
                  title="सुधारणा आवश्यक"
                  topics={result.weak_topics}
                  kind="weak"
                />
              </div>

              {/* ================= QUESTION REVIEW ================= */}
              <QuestionReview questions={result.question_review || []} />

              {/* ================= ACTION BUTTONS ================= */}
              <nav className="animate-fade-up flex flex-col gap-2.5 sm:flex-row">
                <Link
                  to="/student/tests"
                  className="group inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pb-green to-[#0f3d2e] px-5 py-3 text-sm font-extrabold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:from-pb-khaki hover:to-[#c9b95f] hover:shadow-lg active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  <ArrowLeftIcon className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
                  सर्व चाचण्या पहा
                </Link>

                <Link
                  to="/student/tests/history"
                  className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-pb-border bg-white px-5 py-3 text-sm font-bold text-pb-green shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-pb-khaki hover:bg-pb-light hover:shadow-md active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none"
                >
                  <ClipboardIcon className="h-4 w-4" />
                  माझा चाचणी इतिहास
                </Link>

                <Link
                  to={`/student/tests/${testId}`}
                  className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-pb-border bg-white px-5 py-3 text-sm font-bold text-pb-khaki shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-pb-khaki hover:bg-pb-light hover:shadow-md active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none"
                >
                  <BookIcon className="h-4 w-4" />
                  चाचणी तपशील
                </Link>
              </nav>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}

export default TestResult;