import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getPerformance } from "../../services/performanceService";

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

const ChartIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M3 3v18h18" />
    <path d="m7 14 3-3 3 3 5-6" />
  </svg>
);
const TrendingUpIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="m3 17 5-5 4 3 8-8" />
    <path d="M14 7h6v6" />
  </svg>
);
const BookIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 0-2 2Z" />
    <path d="M18 3v18" />
  </svg>
);
const TargetIcon = (p) => (
  <svg {...iconProps} {...p}>
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="12" cy="12" r="1" />
  </svg>
);
const DumbbellIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M6 6v12M3 8v8M18 6v12M21 8v8M6 12h12" />
  </svg>
);
const AlertTriangleIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M10.3 3.9 2.4 17a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9v4M12 17h.01" />
  </svg>
);
const BarChartIcon = (p) => (
  <svg {...iconProps} {...p}>
    <rect x="3" y="12" width="4" height="9" rx="1" />
    <rect x="10" y="6" width="4" height="15" rx="1" />
    <rect x="17" y="3" width="4" height="18" rx="1" />
  </svg>
);
const HistoryIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M3 12a9 9 0 1 0 3-6.7" />
    <path d="M3 4v5h5" />
    <path d="M12 8v4l3 2" />
  </svg>
);
const ActivityIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M3 12h3l2-6 4 12 3-9 2 3h4" />
    <path d="M3 20h18" />
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
const ArrowRightIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M5 12h14" />
    <path d="m13 6 6 6-6 6" />
  </svg>
);

const numberFormat = new Intl.NumberFormat("mr-IN", {
  maximumFractionDigits: 2,
});

const formatValue = (value, suffix = "") => {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue)
    ? `${numberFormat.format(numericValue)}${suffix}`
    : "—";
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

/* ---------- SECTION HEADING ---------- */
function SectionHeading({ title, detail, icon: Icon }) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2.5">
        {Icon && (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pb-green/10 text-pb-green">
            <Icon className="h-4 w-4" />
          </span>
        )}
        <h2 className="text-base leading-tight font-extrabold tracking-tight text-pb-green sm:text-lg">
          {title}
        </h2>
        <span className="h-px flex-1 bg-gradient-to-r from-pb-border to-transparent" />
      </div>
      {detail && <p className="mt-2 text-xs text-slate-500 sm:text-sm">{detail}</p>}
    </div>
  );
}

/* ---------- EMPTY STATE ---------- */
function EmptyState({ icon: Icon = InboxIcon, children }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2.5 rounded-xl border border-dashed border-[#d8d1bf] bg-pb-light/60 px-4 py-8 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-pb-khaki shadow-sm">
        <Icon className="h-5 w-5" />
      </span>
      <p className="text-sm font-semibold text-slate-600">{children}</p>
    </div>
  );
}

/* ---------- METRIC TILE ---------- */
function MetricTile({ label, value, suffix = "", index = 0 }) {
  const display = formatValue(value, suffix);
  const isMissing = display === "—";
  return (
    <article
      className="animate-fade-up rounded-xl border border-pb-border-soft bg-white/70 p-3.5 transition-colors duration-200 hover:bg-white"
      style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
    >
      <p className="text-[10px] font-bold tracking-wide text-slate-500 uppercase sm:text-[11px]">
        {label}
      </p>
      <p
        className={`mt-1.5 text-base leading-tight font-extrabold break-words tabular-nums sm:text-lg ${isMissing ? "text-slate-400" : "text-pb-green"
          }`}
      >
        {display}
      </p>
    </article>
  );
}

/* ---------- PROGRESS CHART ---------- */
function ProgressChart({ progress }) {
  if (!progress.length) {
    return <EmptyState icon={ChartIcon}>अजून पुरेसा test data उपलब्ध नाही.</EmptyState>;
  }

  const width = 760;
  const height = 250;
  const inset = { left: 42, right: 16, top: 18, bottom: 40 };
  const chartWidth = width - inset.left - inset.right;
  const chartHeight = height - inset.top - inset.bottom;
  const percentages = progress.map((item) => Number(item.percentage));
  const validValues = percentages.filter(Number.isFinite);

  if (!validValues.length) {
    return <EmptyState icon={ChartIcon}>अजून पुरेसा test data उपलब्ध नाही.</EmptyState>;
  }

  const min = Math.min(0, ...validValues);
  const max = Math.max(100, ...validValues);
  const range = max - min || 1;
  const points = progress.map((item, index) => {
    const value = Number(item.percentage);
    const x =
      inset.left +
      (progress.length === 1
        ? chartWidth / 2
        : (index / (progress.length - 1)) * chartWidth);
    const y =
      inset.top +
      ((max - (Number.isFinite(value) ? value : min)) / range) * chartHeight;
    return { x, y, item };
  });
  const zeroY = inset.top + ((max - 0) / range) * chartHeight;

  return (
    <div className="min-w-0">
      <svg
        aria-label="चाचण्यांमधील टक्केवारीची प्रगती"
        className="h-64 w-full min-w-0"
        role="img"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
      >
        <title>चाचण्यांमधील टक्केवारीची प्रगती</title>
        {[0, 25, 50, 75, 100].map((tick) => {
          if (tick < min || tick > max) return null;
          const y = inset.top + ((max - tick) / range) * chartHeight;
          return (
            <g key={tick}>
              <line
                x1={inset.left}
                x2={width - inset.right}
                y1={y}
                y2={y}
                stroke="#e5e0d3"
                strokeDasharray="4 5"
              />
              <text
                x={inset.left - 8}
                y={y + 4}
                textAnchor="end"
                className="fill-slate-500 text-[11px]"
              >
                {tick}%
              </text>
            </g>
          );
        })}
        {min < 0 && (
          <line
            x1={inset.left}
            x2={width - inset.right}
            y1={zeroY}
            y2={zeroY}
            stroke="#7b6f35"
            strokeDasharray="3 4"
          />
        )}
        <polyline
          fill="none"
          stroke="#26351e"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
          points={points.map(({ x, y }) => `${x},${y}`).join(" ")}
        />
        {points.map(({ x, y, item }) => (
          <g key={item.attempt_id}>
            <circle
              cx={x}
              cy={y}
              r="5"
              fill="#7b6f35"
              stroke="white"
              strokeWidth="2"
            >
              <title>
                {item.test_name}: {formatValue(item.percentage, "%")}
              </title>
            </circle>
            <text
              x={x}
              y={height - 12}
              textAnchor="middle"
              className="fill-slate-500 text-[10px]"
            >
              {new Date(item.date).toLocaleDateString("mr-IN", {
                day: "numeric",
                month: "short",
              })}
            </text>
          </g>
        ))}
      </svg>

      {/* Chart legend / list */}
      <div className="mt-4 space-y-2 border-t border-pb-border-soft pt-4">
        {progress.map((item, index) => (
          <div
            key={item.attempt_id}
            className="animate-fade-up flex flex-wrap items-center justify-between gap-2 rounded-lg bg-pb-light/60 px-3 py-2 text-xs sm:text-sm"
            style={{ animationDelay: `${Math.min(index * 40, 400)}ms` }}
          >
            <span className="min-w-0 font-bold break-words text-pb-green">
              {item.test_name || "चाचणी"}
            </span>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 tabular-nums">
              <span className="font-semibold text-slate-600">
                {formatValue(item.score, " गुण")}
              </span>
              <span className="rounded-full bg-pb-khaki/15 px-2.5 py-0.5 font-extrabold text-pb-khaki">
                {formatValue(item.percentage, "%")}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- METRIC TABLE ---------- */
function MetricTable({ rows, columns, emptyText }) {
  if (!rows.length) return <EmptyState>{emptyText}</EmptyState>;

  return (
    <>
      {/* Mobile cards */}
      <div className="divide-y divide-pb-border-soft overflow-hidden rounded-xl border border-pb-border-soft bg-white md:hidden">
        {rows.map((row, index) => (
          <article
            key={row.topic_id || row.subject_id || row.attempt_id || index}
            className="animate-fade-up space-y-2 p-3.5"
            style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
          >
            {columns.map((column) => (
              <div
                key={column.key}
                className="flex min-w-0 justify-between gap-3 text-xs sm:text-sm"
              >
                <span className="shrink-0 font-semibold text-slate-500">
                  {column.label}
                </span>
                <span className="text-right font-extrabold break-words text-pb-green">
                  {column.render ? column.render(row) : row[column.key] ?? "—"}
                </span>
              </div>
            ))}
          </article>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-xl border border-pb-border-soft md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-pb-border-soft text-left text-sm">
            <thead className="bg-pb-light text-[11px] font-extrabold tracking-wide text-pb-green uppercase">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    scope="col"
                    className="font-extrabold whitespace-nowrap px-4 py-3"
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-pb-border-soft bg-white">
              {rows.map((row, index) => (
                <tr
                  key={row.topic_id || row.subject_id || row.attempt_id || index}
                  className="transition-colors duration-200 odd:bg-white even:bg-pb-light/30 hover:bg-pb-light/60"
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="font-medium whitespace-nowrap px-4 py-3 text-slate-700"
                    >
                      {column.render ? column.render(row) : row[column.key] ?? "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

/* ---------- TOPIC GROUP ---------- */
function TopicGroup({ title, icon: Icon, topics, emptyText, accent }) {
  return (
    <section className="animate-fade-up relative overflow-hidden rounded-2xl border border-pb-border bg-white/90 shadow-sm backdrop-blur-sm">
      <span
        aria-hidden="true"
        className={`block h-1 w-full ${accent}`}
      />

      <div className="p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pb-green/10 text-pb-green">
            <Icon className="h-4 w-4" />
          </span>
          <h2 className="text-base leading-tight font-extrabold tracking-tight text-pb-green sm:text-lg">
            {title}
          </h2>
          {topics.length > 0 && (
            <span className="ml-auto rounded-full border border-pb-border-soft bg-pb-light px-2.5 py-0.5 text-[11px] font-bold tabular-nums text-pb-green">
              {topics.length}
            </span>
          )}
        </div>

        {topics.length ? (
          <div className="space-y-3">
            {topics.map((topic, index) => (
              <div
                key={topic.topic_id}
                className="animate-fade-up rounded-xl border border-pb-border-soft bg-white/70 p-4 transition-colors duration-200 hover:bg-white"
                style={{ animationDelay: `${Math.min(index * 40, 300)}ms` }}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm leading-snug font-bold break-words text-pb-green">
                      {topic.topic_name}
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                      <BookIcon className="h-3 w-3 shrink-0" />
                      {topic.subject_name}
                    </p>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-pb-khaki/15 px-2.5 py-1 text-[11px] font-extrabold tabular-nums text-pb-khaki">
                    {formatValue(topic.percentage, "%")}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-semibold text-slate-600 sm:text-xs">
                  <span className="inline-flex items-center gap-1.5">
                    <TargetIcon className="h-3 w-3 text-pb-green" />
                    {formatValue(topic.accuracy, "%")} अचूकता
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <ChartIcon className="h-3 w-3 text-pb-khaki" />
                    {formatValue(topic.questions_attempted)} प्रश्न
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState>{emptyText}</EmptyState>
        )}
      </div>
    </section>
  );
}

function Performance() {
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const mountedRef = useRef(false);
  const initialRequestStartedRef = useRef(false);

  const loadPerformance = useCallback(async () => {
    try {
      const response = await getPerformance();
      if (!response?.success || !response.data) {
        throw new Error("Performance response did not contain data.");
      }
      if (mountedRef.current) {
        setPerformance(response.data);
      }
    } catch {
      if (mountedRef.current) {
        setError(
          "Performance माहिती मिळवताना समस्या आली. कृपया पुन्हा प्रयत्न करा.",
        );
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    if (!initialRequestStartedRef.current) {
      initialRequestStartedRef.current = true;
      loadPerformance();
    }

    return () => {
      mountedRef.current = false;
    };
  }, [loadPerformance]);

  const retryPerformance = () => {
    setLoading(true);
    setError("");
    loadPerformance();
  };

  const overview = performance?.overview || {};
  const subjects = Array.isArray(performance?.subjects) ? performance.subjects : [];
  const topics = Array.isArray(performance?.topics) ? performance.topics : [];
  const strengths = performance?.strengths || {};
  const progress = Array.isArray(performance?.progress) ? performance.progress : [];
  const history = Array.isArray(performance?.test_history)
    ? performance.test_history
    : [];
  const physical = performance?.physical || {};
  const physicalLatest = physical.latest || null;
  const physicalHistory = Array.isArray(physical.history) ? physical.history : [];

  const cards = [
    ["एकूण Tests", overview.total_tests],
    ["पूर्ण Tests", overview.completed_tests],
    ["सरासरी Score", overview.average_score, " गुण"],
    ["सरासरी Percentage", overview.average_percentage, "%"],
    ["Best Score", overview.best_score, " गुण"],
    ["Best Percentage", overview.best_percentage, "%"],
    ["Accuracy", overview.overall_accuracy, "%"],
    ["Attempted Questions", overview.total_questions_attempted],
    ["बरोबर उत्तरे", overview.total_correct],
    ["चुकीची उत्तरे", overview.total_wrong],
    ["Skip केलेले", overview.total_skipped],
  ];

  const overviewHasData = Object.values(overview).some(
    (value) => value !== null && value !== undefined && value !== 0,
  );
  const strengthRows = (key) =>
    Array.isArray(strengths[key]) ? strengths[key] : [];

  const physicalMetrics = [
    ["Latest Weight", physicalLatest?.weight],
    ["Previous Weight", physical.previous_weight],
    ["Weight Change", physical.weight_change],
    ["Running Distance", physicalLatest?.running_distance],
    ["Running Time", physicalLatest?.running_time],
    ["100m", physicalLatest?.run_100m],
    ["800m", physicalLatest?.run_800m],
    ["1600m", physicalLatest?.run_1600m],
    ["Shot Put", physicalLatest?.shot_put],
    ["Push-ups", physicalLatest?.push_ups],
  ];

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
              <ChartIcon className="relative h-6 w-6" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold tracking-[0.16em] text-pb-khaki uppercase sm:text-xs">
                Performance
              </p>
              <h1 className="mt-1 text-xl leading-tight font-extrabold tracking-tight text-pb-green sm:text-2xl lg:text-3xl">
                माझी Performance
              </h1>
              <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-600 sm:text-sm">
                तुमच्या Police Bharti तयारीची संपूर्ण प्रगती येथे पहा.
              </p>
            </div>
          </div>
        </div>

        <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">

          {/* ================= LOADING ================= */}
          {loading ? (
            <div
              role="status"
              aria-live="polite"
              className="animate-fade-up flex flex-col items-center justify-center gap-3 rounded-2xl border border-pb-border bg-white/85 px-5 py-12 text-center backdrop-blur-sm"
            >
              <SpinnerIcon className="animate-spin-soft h-10 w-10 text-pb-khaki" />
              <p className="text-sm font-semibold text-pb-green">
                Performance माहिती लोड होत आहे...
              </p>
              <p className="text-xs text-slate-500">
                Fetching your performance data.
              </p>
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
                <p className="max-w-md text-sm font-semibold text-red-700">
                  {error}
                </p>
                <button
                  type="button"
                  onClick={retryPerformance}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-pb-green to-[#0f3d2e] px-5 py-2.5 text-sm font-extrabold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:from-pb-khaki hover:to-[#c9b95f] hover:shadow-lg active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  <RefreshIcon className="h-4 w-4" />
                  पुन्हा प्रयत्न करा
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* ================= OVERVIEW ================= */}
              <section className="animate-fade-up overflow-hidden rounded-2xl border border-pb-border bg-white/90 shadow-sm backdrop-blur-sm">
                <span
                  aria-hidden="true"
                  className="block h-1 w-full bg-gradient-to-r from-pb-green via-pb-khaki to-pb-green"
                />
                <div className="p-5 sm:p-6">
                  <SectionHeading
                    title="एकूण कामगिरी"
                    detail="तुमच्या पूर्ण केलेल्या चाचण्यांवर आधारित."
                    icon={TrendingUpIcon}
                  />

                  {overviewHasData ? (
                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                      {cards.map(([label, value, suffix], index) => (
                        <MetricTile
                          key={label}
                          label={label}
                          value={value}
                          suffix={suffix}
                          index={index}
                        />
                      ))}
                    </div>
                  ) : (
                    <EmptyState icon={ChartIcon}>
                      अजून performance data उपलब्ध नाही.
                    </EmptyState>
                  )}
                </div>
              </section>

              {/* ================= SCORE PROGRESS ================= */}
              <section className="animate-fade-up overflow-hidden rounded-2xl border border-pb-border bg-white/90 shadow-sm backdrop-blur-sm">
                <span
                  aria-hidden="true"
                  className="block h-1 w-full bg-gradient-to-r from-pb-green via-pb-khaki to-pb-green"
                />
                <div className="p-5 sm:p-6">
                  <SectionHeading
                    title="Score Progress"
                    detail="चाचण्यांचा क्रमवार निकाल."
                    icon={TrendingUpIcon}
                  />
                  <ProgressChart progress={progress} />
                </div>
              </section>

              {/* ================= SUBJECT PERFORMANCE ================= */}
              <section className="animate-fade-up overflow-hidden rounded-2xl border border-pb-border bg-white/90 shadow-sm backdrop-blur-sm">
                <span
                  aria-hidden="true"
                  className="block h-1 w-full bg-gradient-to-r from-pb-green via-pb-khaki to-pb-green"
                />
                <div className="p-5 sm:p-6">
                  <SectionHeading
                    title="विषयानुसार Performance"
                    icon={BookIcon}
                  />
                  <MetricTable
                    rows={subjects}
                    emptyText="अजून subject performance उपलब्ध नाही."
                    columns={[
                      { key: "subject_name", label: "विषय" },
                      { key: "total_tests", label: "Tests" },
                      { key: "questions_attempted", label: "Attempted" },
                      { key: "correct", label: "बरोबर" },
                      { key: "wrong", label: "चुकीचे" },
                      { key: "skipped", label: "Skip" },
                      {
                        key: "score",
                        label: "Score",
                        render: (row) => formatValue(row.score),
                      },
                      {
                        key: "percentage",
                        label: "Percentage",
                        render: (row) => formatValue(row.percentage, "%"),
                      },
                      {
                        key: "accuracy",
                        label: "Accuracy",
                        render: (row) => formatValue(row.accuracy, "%"),
                      },
                    ]}
                  />
                </div>
              </section>

              {/* ================= TOPIC PERFORMANCE ================= */}
              <section className="animate-fade-up overflow-hidden rounded-2xl border border-pb-border bg-white/90 shadow-sm backdrop-blur-sm">
                <span
                  aria-hidden="true"
                  className="block h-1 w-full bg-gradient-to-r from-pb-green via-pb-khaki to-pb-green"
                />
                <div className="p-5 sm:p-6">
                  <SectionHeading title="Topic Performance" icon={TargetIcon} />
                  <MetricTable
                    rows={topics}
                    emptyText="अजून topic performance उपलब्ध नाही."
                    columns={[
                      { key: "subject_name", label: "विषय" },
                      { key: "topic_name", label: "Topic" },
                      { key: "questions_attempted", label: "Attempted" },
                      { key: "correct", label: "बरोबर" },
                      { key: "wrong", label: "चुकीचे" },
                      { key: "skipped", label: "Skip" },
                      {
                        key: "score",
                        label: "Score",
                        render: (row) => formatValue(row.score),
                      },
                      {
                        key: "percentage",
                        label: "Percentage",
                        render: (row) => formatValue(row.percentage, "%"),
                      },
                      {
                        key: "accuracy",
                        label: "Accuracy",
                        render: (row) => formatValue(row.accuracy, "%"),
                      },
                    ]}
                  />
                </div>
              </section>

              {/* ================= STRENGTHS ================= */}
              <div className="grid gap-4 lg:grid-cols-3">
                <TopicGroup
                  title="Strong Topics"
                  icon={DumbbellIcon}
                  topics={strengthRows("strong_topics")}
                  emptyText="अजून strong topics नोंदलेले नाहीत."
                  accent="bg-gradient-to-r from-pb-green via-pb-khaki to-pb-green"
                />
                <TopicGroup
                  title="Weak Topics"
                  icon={AlertTriangleIcon}
                  topics={strengthRows("weak_topics")}
                  emptyText="सध्या weak topics उपलब्ध नाहीत."
                  accent="bg-gradient-to-r from-pb-khaki via-[#e1d37f] to-pb-khaki"
                />
                <TopicGroup
                  title="Insufficient Data"
                  icon={BarChartIcon}
                  topics={strengthRows("insufficient_data_topics")}
                  emptyText="अपुरा डेटा असलेले topics नाहीत."
                  accent="bg-gradient-to-r from-slate-400 via-slate-300 to-slate-400"
                />
              </div>

              {/* ================= TEST HISTORY ================= */}
              <section className="animate-fade-up overflow-hidden rounded-2xl border border-pb-border bg-white/90 shadow-sm backdrop-blur-sm">
                <span
                  aria-hidden="true"
                  className="block h-1 w-full bg-gradient-to-r from-pb-green via-pb-khaki to-pb-green"
                />
                <div className="p-5 sm:p-6">
                  <SectionHeading title="Test History" icon={HistoryIcon} />
                  <MetricTable
                    rows={history}
                    emptyText="अजून पूर्ण केलेल्या Tests उपलब्ध नाहीत."
                    columns={[
                      { key: "test_name", label: "Test" },
                      { key: "test_type", label: "Type" },
                      { key: "date", label: "Date" },
                      {
                        key: "score",
                        label: "Score",
                        render: (row) => formatValue(row.score),
                      },
                      {
                        key: "percentage",
                        label: "Percentage",
                        render: (row) => formatValue(row.percentage, "%"),
                      },
                      { key: "correct", label: "बरोबर" },
                      { key: "wrong", label: "चुकीचे" },
                      { key: "skipped", label: "Skip" },
                      { key: "time_taken_seconds", label: "वेळ (से.)" },
                    ]}
                  />
                </div>
              </section>

              {/* ================= PHYSICAL PERFORMANCE ================= */}
              <section className="animate-fade-up overflow-hidden rounded-2xl border border-pb-border bg-white/90 shadow-sm backdrop-blur-sm">
                <span
                  aria-hidden="true"
                  className="block h-1 w-full bg-gradient-to-r from-pb-green via-pb-khaki to-pb-green"
                />
                <div className="p-5 sm:p-6">
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pb-green/10 text-pb-green">
                        <ActivityIcon className="h-4 w-4" />
                      </span>
                      <div>
                        <h2 className="text-base leading-tight font-extrabold tracking-tight text-pb-green sm:text-lg">
                          Physical Performance
                        </h2>
                        <p className="mt-0.5 text-xs text-slate-500">
                          नोंदवलेल्या शारीरिक प्रशिक्षणावर आधारित.
                        </p>
                      </div>
                    </div>

                    <Link
                      to="/student/physical"
                      className="group inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pb-green to-[#0f3d2e] px-4 py-2.5 text-sm font-extrabold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:from-pb-khaki hover:to-[#c9b95f] hover:shadow-lg active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:ring-offset-2 focus-visible:outline-none"
                    >
                      <ActivityIcon className="h-4 w-4" />
                      Physical Training कडे जा
                      <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </Link>
                  </div>

                  {physicalLatest ? (
                    <>
                      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
                        {physicalMetrics.map(([label, value], index) => (
                          <MetricTile
                            key={label}
                            label={label}
                            value={value}
                            index={index}
                          />
                        ))}
                      </div>

                      {physicalHistory.length > 0 && (
                        <div className="mt-6">
                          <h3 className="mb-3 flex items-center gap-2 text-sm font-extrabold tracking-wide text-pb-green uppercase">
                            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-pb-green/10 text-pb-green">
                              <HistoryIcon className="h-3.5 w-3.5" />
                            </span>
                            Training History
                          </h3>
                          <MetricTable
                            rows={physicalHistory}
                            emptyText="अजून physical training records उपलब्ध नाहीत."
                            columns={[
                              { key: "date", label: "Date" },
                              {
                                key: "weight",
                                label: "Weight",
                                render: (row) => formatValue(row.weight),
                              },
                              {
                                key: "running_distance",
                                label: "Running Distance",
                                render: (row) => formatValue(row.running_distance),
                              },
                              {
                                key: "running_time",
                                label: "Running Time",
                                render: (row) => formatValue(row.running_time),
                              },
                              {
                                key: "run_100m",
                                label: "100m",
                                render: (row) => formatValue(row.run_100m),
                              },
                              {
                                key: "run_800m",
                                label: "800m",
                                render: (row) => formatValue(row.run_800m),
                              },
                              {
                                key: "run_1600m",
                                label: "1600m",
                                render: (row) => formatValue(row.run_1600m),
                              },
                              {
                                key: "shot_put",
                                label: "Shot Put",
                                render: (row) => formatValue(row.shot_put),
                              },
                              {
                                key: "push_ups",
                                label: "Push-ups",
                                render: (row) => formatValue(row.push_ups),
                              },
                            ]}
                          />
                        </div>
                      )}
                    </>
                  ) : (
                    <EmptyState icon={ActivityIcon}>
                      अजून physical training records उपलब्ध नाहीत.
                    </EmptyState>
                  )}
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default Performance;