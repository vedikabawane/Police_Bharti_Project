import { useEffect, useState } from "react";
import { getPYQQuestions } from "../../../services/pyqService";
import { getSubjects, getTopicsBySubject } from "../../../services/studyService";

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

const FileIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M6 3h9l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
    <path d="M14 3v6h6M8 13h8M8 17h5" />
  </svg>
);
const FilterIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M3 5h18l-7 9v6l-4-2v-4Z" />
  </svg>
);
const BookIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 0-2 2Z" />
    <path d="M18 3v18" />
  </svg>
);
const FolderIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
  </svg>
);
const CalendarIcon = (p) => (
  <svg {...iconProps} {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M8 3v4M16 3v4M3 10h18" />
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
const ChevronLeftIcon = (p) => (
  <svg {...iconProps} strokeWidth="2.2" {...p}>
    <path d="m15 6-6 6 6 6" />
  </svg>
);
const ChevronRightIcon = (p) => (
  <svg {...iconProps} strokeWidth="2.2" {...p}>
    <path d="m9 6 6 6-6 6" />
  </svg>
);
const TrophyIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M8 3h8v6a4 4 0 0 1-8 0Z" />
    <path d="M8 5H5v2a3 3 0 0 0 3 3M16 5h3v2a3 3 0 0 1-3 3" />
    <path d="M10 13v3h4v-3M8 19h8M9 16h6" />
  </svg>
);
const InboxIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M3 12h5l1.5 3h5L16 12h5" />
    <path d="M5 5h14l2 7v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6Z" />
  </svg>
);
const SparklesIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.3 6.3l2.8 2.8M14.9 14.9l2.8 2.8M17.7 6.3l-2.8 2.8M9.1 14.9l-2.8 2.8" />
  </svg>
);
const TargetIcon = (p) => (
  <svg {...iconProps} {...p}>
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="12" cy="12" r="1" />
  </svg>
);
const InfoIcon = (p) => (
  <svg {...iconProps} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" />
  </svg>
);

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
      .animate-pop-in { animation: popIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) both; }
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

function PYQPage() {
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [subjectId, setSubjectId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [examYear, setExamYear] = useState("");
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState("");
  const [answerChecked, setAnswerChecked] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [subjectError, setSubjectError] = useState("");
  const [topicError, setTopicError] = useState("");

  useEffect(() => {
    let isActive = true;

    const loadSubjects = async () => {
      try {
        const response = await getSubjects();
        if (!response.success || !Array.isArray(response.data)) {
          throw new Error("Unexpected subjects response");
        }
        if (isActive) {
          setSubjects(response.data);
        }
      } catch {
        if (isActive) {
          setSubjectError("Unable to load subjects.");
        }
      }
    };

    loadSubjects();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    setTopics([]);
    setTopicId("");
    setTopicError("");

    if (!subjectId) {
      return () => {
        isActive = false;
      };
    }

    const loadTopics = async () => {
      try {
        const response = await getTopicsBySubject(subjectId);
        if (!response.success || !Array.isArray(response.data)) {
          throw new Error("Unexpected topics response");
        }
        if (isActive) {
          setTopics(response.data);
        }
      } catch {
        if (isActive) {
          setTopicError("Unable to load topics for this subject.");
        }
      }
    };

    loadTopics();

    return () => {
      isActive = false;
    };
  }, [subjectId]);

  const loadQuestions = async (filters = {}) => {
    setLoading(true);
    setError("");
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setSelectedOption("");
    setAnswerChecked(false);
    setCompleted(false);

    try {
      const response = await getPYQQuestions(filters);
      if (!response.success || !Array.isArray(response.data)) {
        throw new Error("Unexpected PYQ response");
      }

      setQuestions(
        response.data.filter(
          (question) => question.is_pyq === true && question.is_active === true,
        ),
      );
    } catch {
      setError("Unable to load previous year questions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, []);

  const currentQuestion = questions[currentQuestionIndex];
  const availableYears = [
    ...new Set(
      questions
        .map((question) => question.exam_year)
        .filter((year) => year !== null && year !== undefined && year !== ""),
    ),
  ].sort((first, second) => Number(second) - Number(first));
  const progress = questions.length
    ? ((currentQuestionIndex + 1) / questions.length) * 100
    : 0;

  const applyFilters = () => {
    const filters = {};
    if (subjectId) filters.subject_id = subjectId;
    if (topicId) filters.topic_id = topicId;
    if (examYear) filters.exam_year = examYear;
    loadQuestions(filters);
  };

  const resetFilters = () => {
    setSubjectId("");
    setTopicId("");
    setExamYear("");
    setTopics([]);
    loadQuestions();
  };

  const moveToQuestion = (nextIndex) => {
    setCurrentQuestionIndex(nextIndex);
    setSelectedOption("");
    setAnswerChecked(false);
    setCompleted(false);
  };

  const checkAnswer = () => {
    if (selectedOption) {
      setAnswerChecked(true);
    }
  };

  const retryQuestion = () => {
    setSelectedOption("");
    setAnswerChecked(false);
  };

  const fieldClass =
    "mt-2 w-full rounded-xl border border-pb-border bg-white px-3.5 py-3 text-sm font-medium text-pb-green transition-all duration-200 outline-none focus:border-pb-khaki focus:ring-4 focus:ring-pb-khaki/15 disabled:cursor-not-allowed disabled:bg-slate-50";

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-pb-light">
      <AnimationStyles />
      <AnimatedBackground />

      <div className="relative z-10">

        {/* ================= PAGE HEADER ================= */}
        <div className="animate-fade-up mx-auto mt-4 w-[calc(100%-2rem)] max-w-7xl overflow-hidden rounded-2xl border border-pb-border/50 bg-white/85 shadow-sm backdrop-blur-sm sm:mt-6 sm:w-[calc(100%-3rem)] lg:w-[calc(100%-4rem)]">
          <span
            aria-hidden="true"
            className="animate-gradient pointer-events-none block h-1 w-full bg-gradient-to-r from-pb-green via-pb-khaki to-pb-green"
          />
          <div className="flex min-w-0 items-center gap-4 p-5 sm:p-6">
            <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-pb-green to-[#0f3d2e] text-white shadow-md">
              <span
                aria-hidden="true"
                className="animate-soft-glow pointer-events-none absolute -inset-1 rounded-3xl bg-pb-khaki/30 blur-md"
              />
              <FileIcon className="relative h-6 w-6" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold tracking-[0.16em] text-pb-khaki uppercase sm:text-xs">
                Previous Questions
              </p>
              <h1 className="mt-1 text-xl leading-tight font-extrabold tracking-tight text-pb-green sm:text-2xl lg:text-3xl">
                मागील वर्षांचे प्रश्न
              </h1>
              <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-600 sm:text-sm">
                विषय, टॉपिक आणि परीक्षेच्या वर्षानुसार प्रश्नांचा सराव करा.
              </p>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">

          {/* ================= FILTERS ================= */}
          <section className="animate-fade-up overflow-hidden rounded-2xl border border-pb-border bg-white/90 shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-2.5 border-b border-pb-border-soft bg-pb-light/50 px-5 py-3.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-pb-green/10 text-pb-green">
                <FilterIcon className="h-3.5 w-3.5" />
              </span>
              <span className="text-[11px] font-extrabold tracking-[0.14em] text-slate-500 uppercase">
                Filters
              </span>
              <span className="h-px flex-1 bg-gradient-to-r from-pb-border to-transparent" />
            </div>

            <div className="p-5 sm:p-6">
              <div className="mb-4">
                <h2 className="text-base leading-tight font-extrabold tracking-tight text-pb-green sm:text-lg">
                  प्रश्न फिल्टर करा
                </h2>
                <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                  फिल्टर निवडून उपलब्ध PYQ प्रश्न पहा.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <label className="block text-sm font-bold text-pb-green">
                  <span className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-pb-green/10 text-pb-green">
                      <BookIcon className="h-3.5 w-3.5" />
                    </span>
                    Subject
                  </span>
                  <select
                    value={subjectId}
                    onChange={(event) => setSubjectId(event.target.value)}
                    className={fieldClass}
                  >
                    <option value="">All subjects</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                  {subjectError && (
                    <span className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600">
                      <AlertIcon className="h-3 w-3" />
                      {subjectError}
                    </span>
                  )}
                </label>

                <label className="block text-sm font-bold text-pb-green">
                  <span className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-pb-green/10 text-pb-green">
                      <FolderIcon className="h-3.5 w-3.5" />
                    </span>
                    Topic
                  </span>
                  <select
                    value={topicId}
                    onChange={(event) => setTopicId(event.target.value)}
                    disabled={!subjectId || Boolean(topicError)}
                    className={fieldClass}
                  >
                    <option value="">All topics</option>
                    {topics.map((topic) => (
                      <option key={topic.id} value={topic.id}>
                        {topic.name}
                      </option>
                    ))}
                  </select>
                  {topicError && (
                    <span className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600">
                      <AlertIcon className="h-3 w-3" />
                      {topicError}
                    </span>
                  )}
                </label>

                <label className="block text-sm font-bold text-pb-green">
                  <span className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-pb-green/10 text-pb-green">
                      <CalendarIcon className="h-3.5 w-3.5" />
                    </span>
                    Exam year
                  </span>
                  <select
                    value={examYear}
                    onChange={(event) => setExamYear(event.target.value)}
                    className={fieldClass}
                  >
                    <option value="">All years</option>
                    {availableYears.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={applyFilters}
                  className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pb-green to-[#0f3d2e] px-5 py-3 text-sm font-extrabold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:from-pb-khaki hover:to-[#c9b95f] hover:shadow-lg active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  <FilterIcon className="h-4 w-4" />
                  Apply Filters
                </button>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-pb-border bg-white px-5 py-3 text-sm font-bold text-pb-green transition-all duration-200 hover:-translate-y-0.5 hover:border-pb-khaki hover:bg-pb-light hover:shadow-sm active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none"
                >
                  <RefreshIcon className="h-4 w-4" />
                  Reset Filters
                </button>
              </div>
            </div>
          </section>

          {/* ================= RESULTS ================= */}
          {loading ? (
            <div
              role="status"
              aria-live="polite"
              className="animate-fade-up flex flex-col items-center justify-center gap-3 rounded-2xl border border-pb-border bg-white/85 px-5 py-12 text-center backdrop-blur-sm"
            >
              <SpinnerIcon className="animate-spin-soft h-10 w-10 text-pb-khaki" />
              <p className="text-sm font-semibold text-pb-green">
                प्रश्न लोड होत आहेत...
              </p>
              <p className="text-xs text-slate-500">Fetching previous year questions.</p>
            </div>
          ) : error ? (
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
                <p className="font-bold text-red-700">{error}</p>
                <button
                  type="button"
                  onClick={() => {
                    const filters = {};
                    if (subjectId) filters.subject_id = subjectId;
                    if (topicId) filters.topic_id = topicId;
                    if (examYear) filters.exam_year = examYear;
                    loadQuestions(filters);
                  }}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-pb-green to-[#0f3d2e] px-5 py-2.5 text-sm font-extrabold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:from-pb-khaki hover:to-[#c9b95f] hover:shadow-lg active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  <RefreshIcon className="h-4 w-4" />
                  Try Again
                </button>
              </div>
            </div>
          ) : questions.length === 0 ? (
            <div className="animate-fade-up flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#d9d2c3] bg-white/70 px-5 py-14 text-center backdrop-blur-sm">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-pb-light text-pb-khaki">
                <InboxIcon className="h-6 w-6" />
              </span>
              <h2 className="text-base font-extrabold text-pb-green sm:text-lg">
                No previous year questions found.
              </h2>
              <p className="max-w-md text-sm text-slate-500">
                Try changing the filters.
              </p>
            </div>
          ) : completed ? (
            /* ================= COMPLETED ================= */
            <section className="animate-pop-in overflow-hidden rounded-2xl border border-pb-border bg-white/90 shadow-sm backdrop-blur-sm">
              <span
                aria-hidden="true"
                className="animate-gradient pointer-events-none block h-1 w-full bg-gradient-to-r from-pb-green via-pb-khaki to-pb-green"
              />
              <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
                <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-pb-green to-[#0f3d2e] text-white shadow-lg">
                  <span
                    aria-hidden="true"
                    className="animate-soft-glow pointer-events-none absolute -inset-1.5 rounded-3xl bg-pb-khaki/40 blur-lg"
                  />
                  <TrophyIcon className="relative h-8 w-8" />
                </span>
                <h2 className="text-xl font-extrabold tracking-tight text-pb-green sm:text-2xl">
                  सराव पूर्ण झाला!
                </h2>
                <p className="max-w-md text-sm text-slate-500">
                  तुम्ही {questions.length} प्रश्न पाहिले आहेत.
                </p>
                <button
                  type="button"
                  onClick={() => moveToQuestion(0)}
                  className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-pb-green to-[#0f3d2e] px-5 py-2.5 text-sm font-extrabold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:from-pb-khaki hover:to-[#c9b95f] hover:shadow-lg active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  <RefreshIcon className="h-4 w-4" />
                  Review Questions
                </button>
              </div>
            </section>
          ) : currentQuestion ? (
            /* ================= QUESTION CARD ================= */
            <section className="animate-fade-up overflow-hidden rounded-2xl border border-pb-border bg-white/90 shadow-sm backdrop-blur-sm">

              {/* ---------- Header ---------- */}
              <div className="border-b border-pb-border-soft bg-pb-light/40 p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-pb-green to-[#0f3d2e] text-sm font-extrabold text-white shadow-sm">
                      {currentQuestionIndex + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold tracking-[0.14em] text-pb-khaki uppercase sm:text-xs">
                        Question {currentQuestionIndex + 1} of {questions.length}
                      </p>
                      <h2 className="mt-1 text-base leading-snug font-extrabold break-words text-pb-green sm:text-lg">
                        {currentQuestion.exam_name || "Previous Year Question"}
                        {currentQuestion.exam_year
                          ? ` · ${currentQuestion.exam_year}`
                          : ""}
                      </h2>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[11px] font-bold">
                    {currentQuestion.difficulty && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-pb-khaki/30 bg-pb-khaki/10 px-2.5 py-1 text-pb-khaki">
                        <SparklesIcon className="h-3 w-3" />
                        {currentQuestion.difficulty}
                      </span>
                    )}
                    {currentQuestion.marks !== undefined &&
                      currentQuestion.marks !== null && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-pb-green/20 bg-pb-green/5 px-2.5 py-1 text-pb-green">
                          <TargetIcon className="h-3 w-3" />
                          {currentQuestion.marks} marks
                        </span>
                      )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                  <div
                    className="h-2 overflow-hidden rounded-full bg-pb-border-soft"
                    role="progressbar"
                    aria-label="Question progress"
                    aria-valuemin={0}
                    aria-valuemax={questions.length}
                    aria-valuenow={currentQuestionIndex + 1}
                  >
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-pb-green via-pb-khaki to-pb-green transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="mt-2 text-right text-[10px] font-bold tracking-wide text-slate-500 tabular-nums">
                    {Math.round(progress)}%
                  </p>
                </div>
              </div>

              {/* ---------- Body ---------- */}
              <div className="p-5 sm:p-8">
                <h3 className="text-base leading-7 font-bold break-words whitespace-pre-wrap text-slate-800 sm:text-lg sm:leading-8">
                  {currentQuestion.question_text}
                </h3>

                <div className="mt-6 space-y-3">
                  {(Array.isArray(currentQuestion.options)
                    ? currentQuestion.options
                    : []
                  ).map((option) => {
                    const isSelected = selectedOption === option.option_label;
                    const isCorrectOption =
                      answerChecked &&
                      option.option_label === currentQuestion.correct_option;
                    const isIncorrectSelection =
                      answerChecked &&
                      isSelected &&
                      option.option_label !== currentQuestion.correct_option;

                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setSelectedOption(option.option_label)}
                        disabled={answerChecked}
                        aria-pressed={isSelected}
                        className={`group flex w-full items-start gap-3 rounded-xl border-2 p-4 text-left transition-all duration-200 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-default ${isCorrectOption
                            ? "border-green-600 bg-green-50 text-green-900"
                            : isIncorrectSelection
                              ? "border-red-500 bg-red-50 text-red-900"
                              : isSelected
                                ? "border-pb-khaki bg-pb-light text-pb-green"
                                : "border-pb-border bg-white hover:-translate-y-0.5 hover:border-pb-khaki hover:bg-[#fbfaf7] hover:shadow-sm"
                          }`}
                      >
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-extrabold transition-colors duration-200 ${isCorrectOption
                              ? "bg-green-600 text-white"
                              : isIncorrectSelection
                                ? "bg-red-500 text-white"
                                : isSelected
                                  ? "bg-pb-khaki text-white"
                                  : "bg-pb-green text-white group-hover:bg-pb-khaki"
                            }`}
                        >
                          {isCorrectOption ? (
                            <CheckCircleIcon className="h-4 w-4" />
                          ) : isIncorrectSelection ? (
                            <XCircleIcon className="h-4 w-4" />
                          ) : (
                            option.option_label
                          )}
                        </span>
                        <span className="min-w-0 pt-1 text-sm leading-6 break-words whitespace-pre-wrap sm:text-base">
                          {option.option_text}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* ---------- Answer check / result ---------- */}
                {!answerChecked ? (
                  <button
                    type="button"
                    onClick={checkAnswer}
                    disabled={!selectedOption}
                    className="group mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pb-green to-[#0f3d2e] px-5 py-3 font-extrabold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:from-pb-khaki hover:to-[#c9b95f] hover:shadow-lg active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 sm:w-auto"
                  >
                    <CheckCircleIcon className="h-4 w-4" />
                    Check Answer
                  </button>
                ) : (
                  <div
                    className={`animate-pop-in mt-6 overflow-hidden rounded-2xl border-2 ${selectedOption === currentQuestion.correct_option
                        ? "border-green-200 bg-green-50"
                        : "border-red-200 bg-red-50"
                      }`}
                    role="status"
                  >
                    <div className="flex items-start gap-3 p-5">
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm ${selectedOption === currentQuestion.correct_option
                            ? "bg-green-600"
                            : "bg-red-500"
                          }`}
                      >
                        {selectedOption === currentQuestion.correct_option ? (
                          <CheckCircleIcon className="h-5 w-5" />
                        ) : (
                          <XCircleIcon className="h-5 w-5" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-base font-extrabold ${selectedOption === currentQuestion.correct_option
                              ? "text-green-800"
                              : "text-red-800"
                            }`}
                        >
                          {selectedOption === currentQuestion.correct_option
                            ? "Correct Answer"
                            : "Incorrect Answer"}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-800">
                          Correct Answer: {currentQuestion.correct_option}
                        </p>

                        {currentQuestion.explanation && (
                          <div className="mt-3 rounded-xl border border-pb-border-soft bg-white/70 p-3.5">
                            <p className="flex items-center gap-1.5 text-xs font-extrabold tracking-wide text-pb-green uppercase">
                              <InfoIcon className="h-3.5 w-3.5" />
                              Explanation
                            </p>
                            <p className="mt-1.5 text-sm leading-6 break-words whitespace-pre-wrap text-slate-700">
                              {currentQuestion.explanation}
                            </p>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={retryQuestion}
                          className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl border border-pb-border bg-white px-4 py-2 text-sm font-bold text-pb-green transition-all duration-200 hover:-translate-y-0.5 hover:border-pb-khaki hover:bg-pb-light hover:shadow-sm active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none"
                        >
                          <RefreshIcon className="h-3.5 w-3.5" />
                          Try Again
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ---------- Navigation ---------- */}
                <div className="mt-8 flex flex-col gap-3 border-t border-pb-border-soft pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={() => moveToQuestion(currentQuestionIndex - 1)}
                    disabled={currentQuestionIndex === 0}
                    className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-pb-border bg-white px-5 py-3 text-sm font-bold text-pb-green transition-all duration-200 hover:-translate-y-0.5 hover:border-pb-khaki hover:bg-pb-light hover:shadow-sm active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                    Previous
                  </button>

                  <p className="order-first text-center text-xs font-bold tracking-wide text-slate-500 uppercase tabular-nums sm:order-none sm:text-sm">
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </p>

                  {currentQuestionIndex < questions.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => moveToQuestion(currentQuestionIndex + 1)}
                      className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-pb-green to-[#0f3d2e] px-5 py-3 text-sm font-extrabold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:from-pb-khaki hover:to-[#c9b95f] hover:shadow-lg active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:ring-offset-2 focus-visible:outline-none"
                    >
                      Next
                      <ChevronRightIcon className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setCompleted(true)}
                      className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-pb-khaki to-[#c9b95f] px-5 py-3 text-sm font-extrabold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:from-pb-green hover:to-[#0f3d2e] hover:shadow-lg active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:ring-offset-2 focus-visible:outline-none"
                    >
                      <TrophyIcon className="h-4 w-4" />
                      Finish
                    </button>
                  )}
                </div>
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default PYQPage;