import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getTopicsBySubject } from "../../../services/studyService";
import { logClientDiagnostic } from "../../../services/apiErrorLogging";

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

const BookIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 0-2 2Z" />
    <path d="M18 3v18" />
  </svg>
);
const BookOpenIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M12 6.5C10.5 5 8 4 5 4v14c3 0 5.5 1 7 2.5 1.5-1.5 4-2.5 7-2.5V4c-3 0-5.5 1-7 2.5Z" />
    <path d="M12 6.5v14" />
  </svg>
);
const LayersIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="m12 3 9 5-9 5-9-5 9-5Z" />
    <path d="m3 13 9 5 9-5M3 17l9 5 9-5" />
  </svg>
);
const ChevronRightIcon = (p) => (
  <svg {...iconProps} strokeWidth="2.2" {...p}>
    <path d="m9 6 6 6-6 6" />
  </svg>
);
const ArrowLeftIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M19 12H5" />
    <path d="m11 18-6-6 6-6" />
  </svg>
);
const HomeIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="m3 11 9-7 9 7v9a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2Z" />
  </svg>
);
const SparklesIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.3 6.3l2.8 2.8M14.9 14.9l2.8 2.8M17.7 6.3l-2.8 2.8M9.1 14.9l-2.8 2.8" />
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
const HashIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18" />
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

/* ---------- TOPIC CARD ---------- */
function TopicCard({ topic, subjectId, index = 0 }) {
  return (
    <Link
      to={`/student/study/${subjectId}/topic/${topic.id}`}
      state={{ topic }}
      className="animate-fade-up group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-pb-border bg-white/90 shadow-[0_1px_3px_rgba(15,23,42,0.04)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-pb-khaki/40 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:ring-offset-2 focus-visible:outline-none"
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
        {/* Header: icon + chevron */}
        <div className="flex items-start justify-between gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-pb-green to-[#0f3d2e] text-white shadow-md transition-transform duration-300 group-hover:scale-105">
            <BookOpenIcon className="h-6 w-6" />
          </span>

          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-pb-border bg-white text-pb-khaki transition-all duration-300 group-hover:border-pb-khaki group-hover:bg-pb-khaki group-hover:text-white">
            <ChevronRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
          </span>
        </div>

        {/* Body */}
        <div className="mt-4 flex-1">
          <h3 className="text-base leading-snug font-extrabold break-words text-pb-green transition-colors duration-200 group-hover:text-pb-khaki sm:text-lg">
            {topic.name}
          </h3>

          {topic.description && (
            <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500 sm:text-sm sm:leading-6">
              {topic.description}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="mt-5 flex items-center justify-between gap-2 border-t border-pb-border-soft pt-3.5">
          <span className="flex items-center gap-1.5 text-[11px] font-extrabold tracking-wide text-pb-khaki uppercase sm:text-xs">
            <LayersIcon className="h-3.5 w-3.5" />
            अभ्यास साहित्य
          </span>
          <span className="text-[11px] font-bold text-slate-400 transition-all duration-200 group-hover:text-pb-khaki sm:text-xs">
            पहा →
          </span>
        </div>
      </div>
    </Link>
  );
}

function SubjectTopics() {
  const { subjectId } = useParams();
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let isActive = true;

    setTopics([]);
    setError("");
    setLoading(true);

    const fetchTopics = async () => {
      if (!subjectId) {
        if (isActive) {
          setError("विषय सापडला नाही. कृपया पुन्हा प्रयत्न करा.");
          setLoading(false);
        }
        return;
      }

      try {
        const response = await getTopicsBySubject(subjectId);

        if (!response.success || !Array.isArray(response.data)) {
          logClientDiagnostic("API returned an unexpected topics payload.");
          if (isActive) {
            setError(
              "विषयातील टॉपिक्स लोड करताना समस्या आली. कृपया पुन्हा प्रयत्न करा.",
            );
          }
          return;
        }

        if (isActive) {
          setTopics(response.data);
        }
      } catch {
        if (isActive) {
          setError(
            "विषयातील टॉपिक्स लोड करताना समस्या आली. कृपया पुन्हा प्रयत्न करा.",
          );
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    fetchTopics();

    return () => {
      isActive = false;
    };
  }, [subjectId, reload]);

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

          <div className="p-5 sm:p-6">
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
                to="/student/study"
                className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 transition-all duration-200 hover:bg-pb-light hover:text-pb-green focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none"
              >
                अभ्यास साहित्य
              </Link>
              <ChevronRightIcon className="h-3 w-3 text-slate-400" />
              <span className="text-slate-500">विषयाचे Topics</span>
            </nav>

            {/* Title */}
            <div className="mt-4 flex min-w-0 items-center gap-4">
              <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-pb-green to-[#0f3d2e] text-white shadow-md">
                <span
                  aria-hidden="true"
                  className="animate-soft-glow pointer-events-none absolute -inset-1 rounded-3xl bg-pb-khaki/30 blur-md"
                />
                <BookIcon className="relative h-6 w-6" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold tracking-[0.16em] text-pb-khaki uppercase sm:text-xs">
                  Study Material
                </p>
                <h1 className="mt-1 text-xl leading-tight font-extrabold tracking-tight text-pb-green sm:text-2xl lg:text-3xl">
                  विषयाचे Topics
                </h1>
                <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-600 sm:text-sm">
                  निवडलेल्या विषयातील विविध topics मधून अभ्यास सुरू करा.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ================= SUBJECT INFO BANNER ================= */}
        <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
          <div className="animate-gradient relative overflow-hidden rounded-2xl bg-gradient-to-br from-pb-green via-pb-green to-[#0f3d2e] p-5 text-white shadow-lg sm:p-6">
            {/* Decorative circles */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full bg-pb-khaki/15 blur-3xl"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-white/5 blur-2xl"
            />

            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-pb-khaki/20 text-pb-khaki backdrop-blur-sm sm:h-14 sm:w-14">
                  <span
                    aria-hidden="true"
                    className="animate-soft-glow pointer-events-none absolute -inset-1 rounded-3xl bg-pb-khaki/30 blur-md"
                  />
                  <BookIcon className="relative h-6 w-6 sm:h-7 sm:w-7" />
                </span>
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.14em] text-[#d7c56f] uppercase sm:text-xs">
                    <HashIcon className="h-3 w-3" />
                    Subject ID
                  </p>
                  <h2 className="mt-1 text-lg leading-tight font-extrabold tracking-tight sm:text-xl lg:text-2xl">
                    Subject #{subjectId}
                  </h2>
                  <p className="mt-1 text-xs leading-5 text-slate-300 sm:text-sm">
                    या विषयासाठी उपलब्ध असलेले टॉपिक्स खाली दिले आहेत.
                  </p>
                </div>
              </div>

              {/* Count pill */}
              {!loading && !error && topics.length > 0 && (
                <span className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full border border-[#d7c56f]/30 bg-[#d7c56f]/10 px-3 py-1.5 text-xs font-extrabold text-[#d7c56f] backdrop-blur-sm sm:self-auto">
                  <SparklesIcon className="h-3.5 w-3.5" />
                  {topics.length} {topics.length === 1 ? "topic" : "topics"}
                </span>
              )}
            </div>
          </div>
        </section>

        {/* ================= TOPICS ================= */}
        <section className="mx-auto max-w-7xl px-4 py-6 pb-10 sm:px-6 sm:py-8 lg:px-8">
          {/* Section header */}
          <div className="animate-fade-up mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pb-green/10 text-pb-green">
                <LayersIcon className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-base leading-tight font-extrabold tracking-tight text-pb-green sm:text-lg">
                  Topics
                </h2>
                <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
                  Topic निवडा आणि त्यातील अभ्यास साहित्य पहा.
                </p>
              </div>
            </div>
          </div>

          {/* States */}
          {loading ? (
            <div
              role="status"
              aria-live="polite"
              className="animate-fade-up flex flex-col items-center justify-center gap-3 rounded-2xl border border-pb-border bg-white/85 px-5 py-12 text-center backdrop-blur-sm"
            >
              <SpinnerIcon className="animate-spin-soft h-10 w-10 text-pb-khaki" />
              <p className="text-sm font-semibold text-pb-green">
                टॉपिक्स लोड होत आहेत...
              </p>
              <p className="text-xs text-slate-500">Fetching topics.</p>
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
                <p className="max-w-md text-sm font-semibold text-red-700">
                  {error}
                </p>
                <button
                  type="button"
                  onClick={() => setReload((current) => current + 1)}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-pb-green to-[#0f3d2e] px-5 py-2.5 text-sm font-extrabold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:from-pb-khaki hover:to-[#c9b95f] hover:shadow-lg active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  <RefreshIcon className="h-4 w-4" />
                  पुन्हा प्रयत्न करा
                </button>
              </div>
            </div>
          ) : topics.length === 0 ? (
            <div className="animate-fade-up flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#d9d2c3] bg-white/70 px-5 py-14 text-center backdrop-blur-sm">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-pb-light text-pb-khaki">
                <InboxIcon className="h-6 w-6" />
              </span>
              <h3 className="text-base font-extrabold text-pb-green sm:text-lg">
                टॉपिक्स उपलब्ध नाहीत
              </h3>
              <p className="max-w-md text-sm text-slate-500">
                या विषयासाठी सध्या कोणतेही टॉपिक्स उपलब्ध नाहीत.
              </p>
              <Link
                to="/student/study"
                className="mt-1 inline-flex min-h-11 items-center gap-2 rounded-xl border border-pb-border bg-white px-4 py-2.5 text-sm font-bold text-pb-green transition-all duration-200 hover:-translate-y-0.5 hover:border-pb-khaki hover:bg-pb-light hover:shadow-sm active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                सर्व विषय
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {topics.map((topic, index) => (
                <TopicCard
                  key={topic.id}
                  topic={topic}
                  subjectId={subjectId}
                  index={index}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default SubjectTopics;