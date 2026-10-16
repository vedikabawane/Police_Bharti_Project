import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getTestById, startTestAttempt } from "../../../services/testService";

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
const PlayCircleIcon = (p) => (
  <svg {...iconProps} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m10 8 6 4-6 4Z" />
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
const HelpCircleIcon = (p) => (
  <svg {...iconProps} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7v.5M12 17h.01" />
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
const CheckCircleIcon = (p) => (
  <svg {...iconProps} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m8.5 12 2.5 2.5L16 9.5" />
  </svg>
);
const InfoIcon = (p) => (
  <svg {...iconProps} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" />
  </svg>
);
const ArrowLeftIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M19 12H5" />
    <path d="m11 18-6-6 6-6" />
  </svg>
);
const ChevronRightIcon = (p) => (
  <svg {...iconProps} strokeWidth="2.2" {...p}>
    <path d="m9 6 6 6-6 6" />
  </svg>
);
const HomeIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="m3 11 9-7 9 7v9a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2Z" />
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
const SparklesIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.3 6.3l2.8 2.8M14.9 14.9l2.8 2.8M17.7 6.3l-2.8 2.8M9.1 14.9l-2.8 2.8" />
  </svg>
);

const TEST_TYPE_LABELS = {
  subject: "विषय चाचणी",
  topic: "विषयघटक चाचणी",
  mixed: "मिश्र चाचणी",
  full_mock: "पूर्ण सराव चाचणी",
  daily: "दैनिक चाचणी",
  weekly: "साप्ताहिक चाचणी",
  previous_year: "मागील वर्षाची चाचणी",
};

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

/* ---------- METRIC TILE ---------- */
function MetricTile({ label, value, icon: Icon }) {
  return (
    <div className="min-w-0 rounded-xl border border-pb-border-soft bg-white/70 p-3.5 transition-colors duration-200 hover:bg-white">
      <dt className="flex items-center gap-2 text-[10px] font-bold tracking-wide text-slate-500 uppercase">
        {Icon && (
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-pb-green/10 text-pb-green">
            <Icon className="h-3 w-3" />
          </span>
        )}
        {label}
      </dt>
      <dd className="mt-1.5 text-sm font-extrabold break-words text-pb-green">
        {value || "—"}
      </dd>
    </div>
  );
}

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
      if (!response.success || !response.data)
        throw new Error("Unexpected test details response");
      setTest(response.data);
    } catch {
      setError(
        "चाचणीची माहिती लोड करता आली नाही. चाचणी उपलब्ध नसल्यास ती निष्क्रिय असू शकते.",
      );
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
      if (!response.success || !response.data?.id)
        throw new Error("Unexpected attempt response");
      navigate(`/student/tests/${testId}/start?attempt_id=${response.data.id}`);
    } catch (startRequestError) {
      setStartError(
        startRequestError.response?.data?.message ||
        "ही चाचणी सुरू करता आली नाही. पुन्हा प्रयत्न करा.",
      );
    } finally {
      setStartingAttempt(false);
    }
  };

  const testType =
    TEST_TYPE_LABELS[test?.test_type?.toLowerCase()] || "सराव चाचणी";

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
                to="/student/tests"
                className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 transition-all duration-200 hover:bg-pb-light hover:text-pb-green focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none"
              >
                सराव चाचण्या
              </Link>
              <ChevronRightIcon className="h-3 w-3 text-slate-400" />
              <span className="text-slate-500">चाचणीची माहिती</span>
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
                  {testType}
                </p>
                <h1 className="mt-1 text-xl leading-tight font-extrabold tracking-tight text-pb-green sm:text-2xl lg:text-3xl">
                  चाचणीची माहिती
                </h1>
              </div>
            </div>

            {/* Back link */}
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                to="/student/tests"
                className="group inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-pb-border bg-white px-3 py-2 text-xs font-bold text-pb-green transition-all duration-200 hover:-translate-y-0.5 hover:border-pb-khaki hover:bg-pb-light hover:shadow-sm active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none sm:text-sm"
              >
                <ArrowLeftIcon className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-1" />
                सर्व चाचण्या
              </Link>
            </div>
          </div>
        </div>

        {/* ================= CONTENT ================= */}
        <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">

          {/* ---------- Loading ---------- */}
          {loading ? (
            <div
              role="status"
              aria-live="polite"
              className="animate-fade-up flex flex-col items-center justify-center gap-3 rounded-2xl border border-pb-border bg-white/85 px-5 py-12 text-center backdrop-blur-sm"
            >
              <SpinnerIcon className="animate-spin-soft h-10 w-10 text-pb-khaki" />
              <p className="text-sm font-semibold text-pb-green">
                माहिती लोड होत आहे...
              </p>
              <p className="text-xs text-slate-500">Fetching test details.</p>
            </div>
          ) : error ? (
            /* ---------- Error ---------- */
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
                  onClick={loadTestDetails}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-pb-green to-[#0f3d2e] px-5 py-2.5 text-sm font-extrabold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:from-pb-khaki hover:to-[#c9b95f] hover:shadow-lg active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  <RefreshIcon className="h-4 w-4" />
                  पुन्हा प्रयत्न करा
                </button>
              </div>
            </div>
          ) : test ? (
            <>
              {/* ================= TEST INFO CARD ================= */}
              <section className="animate-fade-up overflow-hidden rounded-2xl border border-pb-border bg-white/90 shadow-sm backdrop-blur-sm">
                <span
                  aria-hidden="true"
                  className="block h-1 w-full bg-gradient-to-r from-pb-green via-pb-khaki to-pb-green"
                />

                <div className="p-5 sm:p-7">
                  {/* Type pill */}
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-pb-khaki/30 bg-pb-khaki/10 px-3 py-1 text-[10px] font-extrabold tracking-wide text-pb-khaki uppercase sm:text-xs">
                    <SparklesIcon className="h-3 w-3" />
                    {testType}
                  </span>

                  {/* Title */}
                  <h2 className="mt-4 text-xl leading-tight font-extrabold tracking-tight break-words text-pb-green sm:text-2xl lg:text-3xl">
                    {test.title}
                  </h2>

                  {/* Description */}
                  {test.description && (
                    <p className="mt-3 max-w-3xl text-sm leading-6 break-words whitespace-pre-wrap text-slate-600">
                      {test.description}
                    </p>
                  )}

                  {/* Instructions */}
                  {test.instructions && (
                    <div className="mt-5 overflow-hidden rounded-xl border border-pb-khaki/20 bg-pb-light/70">
                      <div className="flex items-center gap-2.5 border-b border-pb-khaki/20 bg-pb-khaki/10 px-4 py-2.5">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-pb-khaki/20 text-pb-khaki">
                          <InfoIcon className="h-3.5 w-3.5" />
                        </span>
                        <h3 className="text-xs leading-tight font-extrabold tracking-wide text-pb-green uppercase">
                          चाचणीच्या सूचना
                        </h3>
                      </div>
                      <p className="p-4 text-sm leading-6 break-words whitespace-pre-wrap text-slate-700">
                        {test.instructions}
                      </p>
                    </div>
                  )}

                  {/* Metrics grid */}
                  <dl className="mt-6 grid grid-cols-2 gap-2.5 border-t border-pb-border-soft pt-5 sm:grid-cols-3">
                    <MetricTile
                      label="विषय"
                      value={test.subject}
                      icon={BookIcon}
                    />
                    <MetricTile
                      label="विषयघटक"
                      value={test.topic}
                      icon={FolderIcon}
                    />
                    <MetricTile
                      label="प्रश्नसंख्या"
                      value={test.question_count}
                      icon={HelpCircleIcon}
                    />
                    <MetricTile
                      label="कालावधी"
                      value={`${test.duration_minutes} मिनिटे`}
                      icon={ClockIcon}
                    />
                    <MetricTile
                      label="एकूण गुण"
                      value={test.total_marks}
                      icon={AwardIcon}
                    />
                    <MetricTile
                      label="स्थिती"
                      value="उपलब्ध"
                      icon={CheckCircleIcon}
                    />
                  </dl>
                </div>
              </section>

              {/* ================= START CARD ================= */}
              <section className="animate-fade-up overflow-hidden rounded-2xl border border-pb-border bg-white/90 shadow-sm backdrop-blur-sm">
                <span
                  aria-hidden="true"
                  className="block h-1 w-full bg-gradient-to-r from-pb-green via-pb-khaki to-pb-green"
                />

                <div className="p-5 sm:p-6">
                  <div className="flex items-start gap-3.5">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-pb-green to-[#0f3d2e] text-white shadow-md">
                      <PlayCircleIcon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-base leading-tight font-extrabold tracking-tight text-pb-green sm:text-lg">
                        चाचणी सुरू करण्यासाठी तयार
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        ही चाचणी सुरू करण्यासाठी तयार आहे.
                      </p>
                    </div>
                  </div>

                  {/* Start error */}
                  {startError && (
                    <div
                      role="alert"
                      className="animate-fade-up mt-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
                    >
                      <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
                      <span className="min-w-0 break-words">{startError}</span>
                    </div>
                  )}

                  {/* Start button */}
                  <button
                    type="button"
                    onClick={handleStartTest}
                    disabled={
                      startingAttempt ||
                      test.is_active === false ||
                      test.question_count < 1
                    }
                    className="group mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pb-green to-[#0f3d2e] px-6 py-3 text-sm font-extrabold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:from-pb-khaki hover:to-[#c9b95f] hover:shadow-lg active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 sm:w-auto sm:min-h-11"
                  >
                    {startingAttempt ? (
                      <>
                        <SpinnerIcon className="animate-spin-soft h-4 w-4" />
                        चाचणी सुरू होत आहे...
                      </>
                    ) : (
                      <>
                        <PlayCircleIcon className="h-4 w-4" />
                        चाचणी सुरू करा
                        <ChevronRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                      </>
                    )}
                  </button>

                  {/* Disabled hint */}
                  {(test.is_active === false || test.question_count < 1) && (
                    <p className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800">
                      <AlertIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      {test.is_active === false
                        ? "ही चाचणी सध्या उपलब्ध नाही."
                        : "या चाचणीत प्रश्न उपलब्ध नाहीत."}
                    </p>
                  )}
                </div>
              </section>
            </>
          ) : null}
        </main>
      </div>
    </div>
  );
}

export default TestDetails;