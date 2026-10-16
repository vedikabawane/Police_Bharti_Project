import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getSubjects, getTopicsBySubject } from "../../../services/studyService";
import { getTests } from "../../../services/testService";

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

const ClipboardIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M8 4H5.5A1.5 1.5 0 0 0 4 5.5v14A1.5 1.5 0 0 0 5.5 21h13a1.5 1.5 0 0 0 1.5-1.5v-14A1.5 1.5 0 0 0 18.5 4H16" />
    <path d="M9 3h6v4H9zM8 13l2.5 2.5L16 10" />
  </svg>
);
const SearchIcon = (p) => (
  <svg {...iconProps} {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);
const FilterIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M3 5h18l-7 9v6l-4-2v-4Z" />
  </svg>
);
const HistoryIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M3 12a9 9 0 1 0 3-6.7" />
    <path d="M3 4v5h5" />
    <path d="M12 8v4l3 2" />
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
const ArrowRightIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M5 12h14" />
    <path d="m13 6 6 6-6 6" />
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
const ClockIcon = (p) => (
  <svg {...iconProps} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);
const HelpCircleIcon = (p) => (
  <svg {...iconProps} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7v.5M12 17h.01" />
  </svg>
);
const AwardIcon = (p) => (
  <svg {...iconProps} {...p}>
    <circle cx="12" cy="9" r="5" />
    <path d="m8.5 13.5-2 7 5.5-3 5.5 3-2-7" />
  </svg>
);
const PlayCircleIcon = (p) => (
  <svg {...iconProps} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m10 8 6 4-6 4Z" />
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
  return (
    TEST_TYPES.find(([value]) => value === testType?.toLowerCase())?.[1] ||
    "सराव चाचणी"
  );
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
      .animate-blob { animation: blobMove 22s ease-in-out infinite; }
      .delay-2 { animation-delay: 4s; }
      .delay-4 { animation-delay: 8s; }
      .animate-fade-up { animation: fadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }
      .animate-gradient { background-size: 220% 220%; animation: gradientPan 9s ease infinite; }
      .animate-soft-glow { animation: softGlow 4.5s ease-in-out infinite; }
      .animate-spin-soft { animation: spinSoft 0.9s linear infinite; }
      @media (prefers-reduced-motion: reduce) {
        .animate-blob, .animate-fade-up, .animate-gradient,
        .animate-soft-glow, .animate-spin-soft { animation: none !important; }
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

/* ---------- TEST CARD ---------- */
function TestCard({ test, index = 0 }) {
  const metaItems = [
    { label: "विषय", value: test.subject, icon: BookIcon },
    { label: "विषयघटक", value: test.topic, icon: FolderIcon },
    { label: "कालावधी", value: `${test.duration_minutes} मिनिटे`, icon: ClockIcon },
    { label: "प्रश्न", value: test.question_count, icon: HelpCircleIcon },
    { label: "एकूण गुण", value: test.total_marks, icon: AwardIcon },
  ];

  return (
    <article
      className="animate-fade-up group relative flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-pb-border bg-white/90 shadow-[0_1px_3px_rgba(15,23,42,0.04)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-pb-khaki/40 hover:shadow-lg"
      style={{ animationDelay: `${Math.min(index * 50, 400)}ms` }}
    >
      {/* Top gradient accent */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-pb-green via-pb-khaki to-pb-green opacity-70"
      />

      {/* Decorative corner blob */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-pb-khaki/10 blur-2xl transition-opacity duration-300 group-hover:bg-pb-khaki/20"
      />

      <div className="relative flex flex-1 flex-col p-5 sm:p-6">
        {/* Header: icon + type pill */}
        <div className="flex items-start justify-between gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-pb-green to-[#0f3d2e] text-white shadow-md transition-transform duration-300 group-hover:scale-105">
            <ClipboardIcon className="h-6 w-6" />
          </span>

          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-pb-khaki/30 bg-pb-khaki/10 px-2.5 py-1 text-[10px] font-extrabold tracking-wide text-pb-khaki uppercase sm:text-xs">
            <SparklesIcon className="h-3 w-3" />
            {getTestTypeLabel(test.test_type)}
          </span>
        </div>

        {/* Title + description */}
        <div className="mt-4 flex-1">
          <h3 className="text-base leading-snug font-extrabold break-words text-pb-green transition-colors duration-200 group-hover:text-pb-khaki sm:text-lg">
            {test.title}
          </h3>

          {test.description && (
            <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-500 sm:text-sm sm:leading-6">
              {test.description}
            </p>
          )}
        </div>

        {/* Meta grid */}
        <dl className="mt-5 grid grid-cols-2 gap-2 border-t border-pb-border-soft pt-4">
          {metaItems.map((item, i) => {
            const Icon = item.icon;
            const isWide = i >= metaItems.length - 1 && metaItems.length % 2 !== 0;
            return (
              <div
                key={item.label}
                className={`min-w-0 rounded-xl bg-pb-light/60 p-2.5 ${isWide ? "col-span-2" : ""
                  }`}
              >
                <dt className="flex items-center gap-1.5 text-[10px] font-bold tracking-wide text-slate-500 uppercase">
                  <Icon className="h-3 w-3 shrink-0" />
                  {item.label}
                </dt>
                <dd className="mt-1 text-sm font-extrabold break-words text-pb-green tabular-nums">
                  {item.value || "—"}
                </dd>
              </div>
            );
          })}
        </dl>
      </div>

      {/* Action footer */}
      <div className="mt-auto border-t border-pb-border-soft px-5 py-4 sm:px-6">
        <Link
          to={`/student/tests/${test.id}`}
          className="group/btn inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pb-green to-[#0f3d2e] px-5 py-3 text-sm font-extrabold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:from-pb-khaki hover:to-[#c9b95f] hover:shadow-lg active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <PlayCircleIcon className="h-4 w-4" />
          चाचणी सुरू करा
          <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
        </Link>
      </div>
    </article>
  );
}

function StudentTests() {
  const [tests, setTests] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    test_type: "",
    subject_id: "",
    topic_id: "",
  });
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
        Object.entries({ ...filters, page, per_page: 12 }).filter(
          ([, value]) => value !== "",
        ),
      );
      const response = await getTests(params);
      if (!response.success || !Array.isArray(response.data?.tests)) {
        throw new Error("Unexpected tests response");
      }
      setTests(response.data.tests);
      setPagination(
        response.data.pagination || {
          page,
          pages: 0,
          total: response.data.tests.length,
        },
      );
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
        if (current && response.success && Array.isArray(response.data))
          setSubjects(response.data);
      })
      .catch(() => {
        if (current) setFilterError("विषयांची यादी लोड झाली नाही.");
      });
    return () => {
      current = false;
    };
  }, []);

  useEffect(() => {
    if (!filters.subject_id) {
      return undefined;
    }
    let current = true;
    getTopicsBySubject(filters.subject_id)
      .then((response) => {
        if (current && response.success && Array.isArray(response.data))
          setTopics(response.data);
      })
      .catch(() => {
        if (current) setFilterError("विषयघटकांची यादी लोड झाली नाही.");
      });
    return () => {
      current = false;
    };
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

  const resetFilters = () => {
    setPage(1);
    setFilters({ search: "", test_type: "", subject_id: "", topic_id: "" });
  };

  const hasActiveFilters = Boolean(
    filters.search || filters.test_type || filters.subject_id || filters.topic_id,
  );

  const fieldClass =
    "mt-2 w-full rounded-xl border border-pb-border bg-white px-3.5 py-2.5 text-sm font-medium text-pb-green transition-all duration-200 outline-none placeholder:text-slate-400 focus:border-pb-khaki focus:ring-4 focus:ring-pb-khaki/15 disabled:cursor-not-allowed disabled:bg-slate-50";

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-pb-light">
      <AnimationStyles />
      <AnimatedBackground />

      <div className="relative z-10">

        {/* ================= BREADCRUMB + HEADER ================= */}
        <div className="animate-fade-up mx-auto mt-4 w-[calc(100%-2rem)] max-w-7xl overflow-hidden rounded-2xl border border-pb-border/50 bg-white/85 shadow-sm backdrop-blur-sm sm:mt-6 sm:w-[calc(100%-3rem)] lg:w-[calc(100%-4rem)]">
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
                <span className="text-slate-500">सराव चाचण्या</span>
              </nav>

              {/* Title */}
              <div className="mt-4 flex min-w-0 items-center gap-4">
                <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-pb-green to-[#0f3d2e] text-white shadow-md">
                  <span
                    aria-hidden="true"
                    className="animate-soft-glow pointer-events-none absolute -inset-1 rounded-3xl bg-pb-khaki/30 blur-md"
                  />
                  <ClipboardIcon className="relative h-6 w-6" />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold tracking-[0.16em] text-pb-khaki uppercase sm:text-xs">
                    Practice Tests
                  </p>
                  <h1 className="mt-1 text-xl leading-tight font-extrabold tracking-tight text-pb-green sm:text-2xl lg:text-3xl">
                    उपलब्ध चाचण्या
                  </h1>
                  <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-600 sm:text-sm">
                    चाचणी निवडा आणि परीक्षेची तयारी सुरू करा.
                  </p>
                </div>
              </div>
            </div>

            {/* History link */}
            <Link
              to="/student/tests/history"
              className="group inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-pb-border bg-white px-4 py-2.5 text-sm font-bold text-pb-green shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-pb-khaki hover:bg-pb-light hover:shadow-md active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none"
            >
              <HistoryIcon className="h-4 w-4" />
              माझा इतिहास
              <ChevronRightIcon className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        {/* ================= FILTERS ================= */}
        <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
          <div className="animate-fade-up overflow-hidden rounded-2xl border border-pb-border bg-white/90 shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-2.5 border-b border-pb-border-soft bg-pb-light/50 px-5 py-3.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-pb-green/10 text-pb-green">
                <FilterIcon className="h-3.5 w-3.5" />
              </span>
              <span className="text-[11px] font-extrabold tracking-[0.14em] text-slate-500 uppercase">
                Filters
              </span>
              {hasActiveFilters && (
                <span className="rounded-full bg-pb-khaki/15 px-2.5 py-0.5 text-[11px] font-extrabold text-pb-khaki">
                  active
                </span>
              )}
              <span className="h-px flex-1 bg-gradient-to-r from-pb-border to-transparent" />
            </div>

            <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-4">
              {/* Search */}
              <label className="block text-sm font-bold text-pb-green lg:col-span-2">
                <span className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-pb-green/10 text-pb-green">
                    <SearchIcon className="h-3.5 w-3.5" />
                  </span>
                  चाचणी शोधा
                </span>
                <div className="relative">
                  <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400">
                    <SearchIcon className="h-4 w-4" />
                  </span>
                  <input
                    value={filters.search}
                    onChange={(event) => updateFilter("search", event.target.value)}
                    placeholder="चाचणीचे नाव"
                    className={`${fieldClass} pl-10`}
                  />
                </div>
              </label>

              {/* Test type */}
              <label className="block text-sm font-bold text-pb-green">
                <span className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-pb-green/10 text-pb-green">
                    <ClipboardIcon className="h-3.5 w-3.5" />
                  </span>
                  चाचणी प्रकार
                </span>
                <select
                  value={filters.test_type}
                  onChange={(event) => updateFilter("test_type", event.target.value)}
                  className={fieldClass}
                >
                  <option value="">सर्व प्रकार</option>
                  {TEST_TYPES.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              {/* Subject */}
              <label className="block text-sm font-bold text-pb-green">
                <span className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-pb-green/10 text-pb-green">
                    <BookIcon className="h-3.5 w-3.5" />
                  </span>
                  विषय
                </span>
                <select
                  value={filters.subject_id}
                  onChange={(event) => updateFilter("subject_id", event.target.value)}
                  className={fieldClass}
                >
                  <option value="">सर्व विषय</option>
                  {subjects
                    .filter((subject) => subject.is_active !== false)
                    .map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                </select>
              </label>

              {/* Topic */}
              <label className="block text-sm font-bold text-pb-green">
                <span className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-pb-green/10 text-pb-green">
                    <FolderIcon className="h-3.5 w-3.5" />
                  </span>
                  विषयघटक
                </span>
                <select
                  value={filters.topic_id}
                  onChange={(event) => updateFilter("topic_id", event.target.value)}
                  disabled={!filters.subject_id}
                  className={fieldClass}
                >
                  <option value="">सर्व विषयघटक</option>
                  {topics
                    .filter((topic) => topic.is_active !== false)
                    .map((topic) => (
                      <option key={topic.id} value={topic.id}>
                        {topic.name}
                      </option>
                    ))}
                </select>
              </label>

              {/* Reset */}
              <div className="flex items-end lg:col-span-2">
                <button
                  type="button"
                  onClick={resetFilters}
                  disabled={!hasActiveFilters}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-pb-border bg-white px-4 py-2.5 text-sm font-bold text-pb-green transition-all duration-200 hover:-translate-y-0.5 hover:border-pb-khaki hover:bg-pb-light hover:shadow-sm active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 lg:w-auto"
                >
                  <XCircleIcon className="h-4 w-4" />
                  फिल्टर काढा
                </button>
              </div>

              {filterError && (
                <p
                  role="alert"
                  className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 sm:col-span-2 lg:col-span-4"
                >
                  <AlertIcon className="h-4 w-4 shrink-0" />
                  {filterError}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* ================= RESULTS ================= */}
        <section className="mx-auto max-w-7xl px-4 py-6 pb-10 sm:px-6 lg:px-8">
          {loading ? (
            <div
              role="status"
              aria-live="polite"
              className="animate-fade-up flex flex-col items-center justify-center gap-3 rounded-2xl border border-pb-border bg-white/85 px-5 py-12 text-center backdrop-blur-sm"
            >
              <SpinnerIcon className="animate-spin-soft h-10 w-10 text-pb-khaki" />
              <p className="text-sm font-semibold text-pb-green">
                चाचण्या लोड होत आहेत...
              </p>
              <p className="text-xs text-slate-500">Fetching available tests.</p>
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
                <p className="text-sm font-semibold text-red-700">{error}</p>
                <button
                  type="button"
                  onClick={loadTests}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-pb-green to-[#0f3d2e] px-5 py-2.5 text-sm font-extrabold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:from-pb-khaki hover:to-[#c9b95f] hover:shadow-lg active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  <RefreshIcon className="h-4 w-4" />
                  पुन्हा प्रयत्न करा
                </button>
              </div>
            </div>
          ) : tests.length === 0 ? (
            <div className="animate-fade-up flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#d9d2c3] bg-white/70 px-5 py-14 text-center backdrop-blur-sm">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-pb-light text-pb-khaki">
                <InboxIcon className="h-6 w-6" />
              </span>
              <h2 className="text-base font-extrabold text-pb-green sm:text-lg">
                सध्या चाचण्या उपलब्ध नाहीत.
              </h2>
              <p className="max-w-md text-sm text-slate-500">
                फिल्टर बदलून पुन्हा पाहा.
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-1 inline-flex min-h-11 items-center gap-2 rounded-xl border border-pb-border bg-white px-4 py-2.5 text-sm font-bold text-pb-khaki transition-all duration-200 hover:-translate-y-0.5 hover:border-pb-khaki hover:bg-pb-light hover:shadow-sm active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none"
                >
                  <XCircleIcon className="h-4 w-4" />
                  फिल्टर काढा
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Results header */}
              <div className="animate-fade-up mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pb-green/10 text-pb-green">
                    <ClipboardIcon className="h-4 w-4" />
                  </span>
                  <h2 className="text-base leading-tight font-extrabold tracking-tight text-pb-green sm:text-lg">
                    उपलब्ध चाचण्या
                  </h2>
                </div>
                <span className="rounded-full border border-pb-border-soft bg-white/80 px-3 py-1 text-[11px] font-bold tabular-nums text-pb-green shadow-sm backdrop-blur-sm sm:text-xs">
                  एकूण {pagination.total || 0} चाचण्या
                </span>
              </div>

              {/* Grid */}
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {tests.map((test, index) => (
                  <TestCard key={test.id} test={test} index={index} />
                ))}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <nav
                  aria-label="चाचण्यांची पाने"
                  className="animate-fade-up mt-6 flex flex-col gap-3 rounded-2xl border border-pb-border bg-white/90 p-4 shadow-sm backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:px-5"
                >
                  <p className="rounded-full border border-pb-border-soft bg-pb-light px-3 py-1.5 text-xs font-bold tabular-nums text-pb-green sm:text-sm">
                    पान {page} / {pagination.pages}
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage((current) => current - 1)}
                      className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-pb-border bg-white px-4 py-2 text-sm font-bold text-pb-green transition-all duration-200 hover:-translate-y-0.5 hover:border-pb-khaki hover:bg-pb-light hover:shadow-sm active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 sm:flex-none"
                    >
                      <ChevronLeftIcon className="h-4 w-4" />
                      मागील
                    </button>
                    <button
                      type="button"
                      disabled={page >= pagination.pages}
                      onClick={() => setPage((current) => current + 1)}
                      className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-pb-border bg-white px-4 py-2 text-sm font-bold text-pb-green transition-all duration-200 hover:-translate-y-0.5 hover:border-pb-khaki hover:bg-pb-light hover:shadow-sm active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 sm:flex-none"
                    >
                      पुढील
                      <ChevronRightIcon className="h-4 w-4" />
                    </button>
                  </div>
                </nav>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export default StudentTests;