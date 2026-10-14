const numberFormat = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 2,
});

const formatValue = (value, suffix = "") => {
  if (value === null || value === undefined || value === "") return "N/A";
  const numericValue = Number(value);
  return Number.isFinite(numericValue)
    ? `${numberFormat.format(numericValue)}${suffix}`
    : `${value}${suffix}`;
};

const formatDate = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "N/A"
    : date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
};

/* ---------- SHARED ICON SET ---------- */
const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.8",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": "true",
};
const SpinnerIcon = (p) => (
  <svg {...iconProps} strokeWidth="2.4" {...p}>
    <path d="M21 12a9 9 0 1 1-6.2-8.5" />
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
const InboxIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M3 12h5l1.5 3h5L16 12h5" />
    <path d="M5 5h14l2 7v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6Z" />
  </svg>
);
const ChartIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M3 3v18h18" />
    <path d="m7 14 3-3 3 3 5-6" />
  </svg>
);

/* ================= SECTION WRAPPER ================= */
function PerformanceSection({ title, children, detail, icon: Icon }) {
  return (
    <section className="relative min-w-0 overflow-hidden rounded-2xl border border-pb-border bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)] transition-shadow duration-300 hover:shadow-md">
      {/* Top accent */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-pb-green via-pb-khaki to-pb-green opacity-70"
      />
      <div className="p-5 sm:p-6">
        <div className="mb-4 flex items-start gap-3">
          {Icon && (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-pb-green/10 text-pb-green">
              <Icon className="h-4 w-4" />
            </span>
          )}
          <div className="min-w-0">
            <h2 className="text-lg leading-tight font-extrabold tracking-tight text-pb-green sm:text-xl">
              {title}
            </h2>
            {detail && <p className="mt-1 text-sm text-slate-500">{detail}</p>}
          </div>
        </div>
        {children}
      </div>
    </section>
  );
}

/* ================= EMPTY STATE ================= */
function EmptyState({ children }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2.5 rounded-xl border border-dashed border-[#d8d1bf] bg-pb-light/60 px-4 py-8 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-pb-khaki shadow-sm">
        <InboxIcon className="h-5 w-5" />
      </span>
      <p className="text-sm font-semibold text-slate-600">{children}</p>
    </div>
  );
}

/* ================= METRIC CARD ================= */
function MetricCard({ label, value, suffix = "", index = 0 }) {
  const display = formatValue(value, suffix);
  const isMissing = display === "N/A";
  return (
    <article
      className="animate-fade-up group relative min-w-0 overflow-hidden rounded-xl border border-pb-border-soft bg-gradient-to-br from-white via-white to-pb-light/50 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-pb-khaki/40 hover:shadow-md"
      style={{ animationDelay: `${Math.min(index * 40, 400)}ms` }}
    >
      <p className="text-[11px] font-bold tracking-wide text-slate-500 uppercase">
        {label}
      </p>
      <p
        className={`mt-2 text-xl leading-tight font-extrabold tracking-tight break-words sm:text-2xl ${
          isMissing ? "text-slate-400" : "text-pb-green"
        }`}
      >
        {display}
      </p>
    </article>
  );
}

/* ================= RESPONSIVE TABLE ================= */
function PerformanceTable({ rows, columns, emptyText }) {
  if (!rows.length) return <EmptyState>{emptyText}</EmptyState>;

  return (
    <>
      {/* ---- Desktop / tablet table ---- */}
      <div className="hidden max-w-full overflow-x-auto rounded-xl border border-pb-border-soft sm:block">
        <table className="w-full min-w-max border-collapse text-left text-sm">
          <thead className="bg-pb-light text-[11px] font-bold tracking-wide text-slate-600 uppercase">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className="px-4 py-3 font-extrabold whitespace-nowrap"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-pb-border-soft">
            {rows.map((row, index) => (
              <tr
                key={row.id ?? row.attempt_id ?? row.topic_id ?? `${row.date}-${index}`}
                className="bg-white transition-colors duration-200 odd:bg-white even:bg-pb-light/30 hover:bg-pb-light/70"
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="px-4 py-3 font-semibold whitespace-nowrap text-pb-green"
                  >
                    {column.render ? column.render(row) : formatValue(row[column.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ---- Mobile card list ---- */}
      <ul className="space-y-3 sm:hidden">
        {rows.map((row, index) => (
          <li
            key={row.id ?? row.attempt_id ?? row.topic_id ?? `${row.date}-${index}`}
            className="animate-fade-up overflow-hidden rounded-xl border border-pb-border-soft bg-white"
            style={{ animationDelay: `${Math.min(index * 40, 400)}ms` }}
          >
            <dl className="divide-y divide-pb-border-soft">
              {columns.map((column) => (
                <div
                  key={column.key}
                  className="flex items-start justify-between gap-3 px-4 py-2.5"
                >
                  <dt className="shrink-0 text-[11px] font-bold tracking-wide text-slate-500 uppercase">
                    {column.label}
                  </dt>
                  <dd className="min-w-0 text-right text-sm font-semibold break-words text-pb-green">
                    {column.render ? column.render(row) : formatValue(row[column.key])}
                  </dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </>
  );
}

/* ================= TOPIC GROUP ================= */
function TopicGroup({ title, topics, emptyText, tone, accent }) {
  return (
    <section className="relative min-w-0 overflow-hidden rounded-xl border border-pb-border bg-white p-5 shadow-sm transition-shadow duration-300 hover:shadow-md">
      <span
        aria-hidden="true"
        className={`absolute inset-x-0 top-0 h-1 ${accent}`}
      />
      <div className="flex items-center justify-between gap-3">
        <h3 className={`text-base font-extrabold ${tone}`}>{title}</h3>
        <span className="rounded-full bg-pb-light px-2.5 py-0.5 text-[11px] font-extrabold text-slate-600">
          {topics.length}
        </span>
      </div>
      {topics.length ? (
        <ul className="mt-3 space-y-3">
          {topics.map((topic) => (
            <li
              key={topic.topic_id}
              className="rounded-lg border border-pb-border-soft bg-pb-light/40 p-3 transition-colors duration-200 hover:bg-pb-light/70"
            >
              <p className="text-sm font-bold break-words text-pb-green">
                {topic.topic_name || "Topic"}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                <span className="font-semibold text-slate-500">
                  {topic.subject_name || "Subject"}
                </span>
                <span className="mx-1.5 text-slate-300">•</span>
                <span className="font-semibold text-pb-green">
                  {formatValue(topic.accuracy, "%")}
                </span>{" "}
                accuracy
                <span className="mx-1.5 text-slate-300">•</span>
                <span className="font-semibold text-pb-green">
                  {formatValue(topic.questions_attempted)}
                </span>{" "}
                questions
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-3">
          <EmptyState>{emptyText}</EmptyState>
        </div>
      )}
    </section>
  );
}

const hasUsefulPerformance = (performance) => {
  const overview = performance?.overview || {};
  const physical = performance?.physical || {};
  return Number(overview.total_test_attempts) > 0
    || Number(overview.completed_tests) > 0
    || (performance?.progress?.length || 0) > 0
    || (performance?.test_history?.length || 0) > 0
    || Boolean(physical.latest)
    || (performance?.subjects || []).some((row) => Number(row.total_tests) > 0)
    || (performance?.topics || []).some((row) => Number(row.total_tests) > 0);
};

function AdminStudentPerformance({ performance, loading, error, onRetry }) {
  /* ---------- ANIMATION KEYFRAMES ---------- */
  const animations = (
    <style>{`
      @keyframes fadeUp {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes spinSoft { to { transform: rotate(360deg); } }
      .animate-fade-up { animation: fadeUp 0.45s cubic-bezier(0.22, 1, 0.36, 1) both; }
      .animate-spin-soft { animation: spinSoft 0.9s linear infinite; }
      @media (prefers-reduced-motion: reduce) {
        .animate-fade-up, .animate-spin-soft { animation: none !important; }
      }
    `}</style>
  );

  /* ---------- LOADING ---------- */
  if (loading) {
    return (
      <>
        {animations}
        <section
          className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-pb-border bg-white px-5 py-12 text-center"
          role="status"
          aria-live="polite"
        >
          <span className="relative flex h-12 w-12 items-center justify-center">
            <span
              aria-hidden="true"
              className="absolute inset-0 rounded-full border-4 border-pb-light"
            />
            <SpinnerIcon className="animate-spin-soft relative h-12 w-12 text-pb-khaki" />
          </span>
          <p className="mt-4 text-sm font-semibold text-pb-green">
            Loading student performance…
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Gathering test, topic and physical data.
          </p>
        </section>
      </>
    );
  }

  /* ---------- ERROR ---------- */
  if (error) {
    return (
      <>
        {animations}
        <section
          className="animate-fade-up mt-6 overflow-hidden rounded-2xl border border-red-200 bg-white"
          role="alert"
        >
          <span
            aria-hidden="true"
            className="block h-1 w-full bg-gradient-to-r from-red-500 via-red-600 to-red-500"
          />
          <div className="flex flex-col items-center gap-3 p-6 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <AlertIcon className="h-6 w-6" />
            </span>
            <p className="text-sm font-semibold text-red-700">{error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-1 inline-flex min-h-11 items-center gap-2 rounded-xl bg-pb-green px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-pb-khaki hover:shadow-md active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none"
            >
              <RefreshIcon className="h-4 w-4" />
              Retry
            </button>
          </div>
        </section>
      </>
    );
  }

  /* ---------- EMPTY ---------- */
  if (!performance || !hasUsefulPerformance(performance)) {
    return (
      <>
        {animations}
        <section className="mt-6 overflow-hidden rounded-2xl border border-pb-border bg-white p-5 sm:p-6">
          <h2 className="text-lg font-extrabold text-pb-green sm:text-xl">
            Student Performance
          </h2>
          <div className="mt-4">
            <EmptyState>No performance data available.</EmptyState>
          </div>
        </section>
      </>
    );
  }

  const overview = performance.overview || {};
  const subjects = Array.isArray(performance.subjects) ? performance.subjects : [];
  const topics = Array.isArray(performance.topics) ? performance.topics : [];
  const strengths = performance.strengths || {};
  const progress = Array.isArray(performance.progress) ? performance.progress : [];
  const history = Array.isArray(performance.test_history) ? performance.test_history : [];
  const physical = performance.physical || {};
  const latest = physical.latest || null;
  const physicalHistory = Array.isArray(physical.history) ? physical.history : [];

  const overviewMetrics = [
    ["Total Tests", overview.total_tests],
    ["Total Test Attempts", overview.total_test_attempts],
    ["Completed Tests", overview.completed_tests],
    ["Questions Attempted", overview.total_questions_attempted],
    ["Correct", overview.total_correct],
    ["Wrong", overview.total_wrong],
    ["Skipped", overview.total_skipped],
    ["Average Score", overview.average_score],
    ["Average Percentage", overview.average_percentage, "%"],
    ["Best Score", overview.best_score],
    ["Best Percentage", overview.best_percentage, "%"],
    ["Overall Accuracy", overview.overall_accuracy, "%"],
    ["Improvement", overview.improvement_percentage, "%"],
  ];

  const physicalMetrics = [
    ["Latest Weight", physical.latest_weight, " kg"],
    ["Previous Weight", physical.previous_weight, " kg"],
    ["Weight Change", physical.weight_change, " kg"],
    ["Running Distance", latest?.running_distance],
    ["Running Time", latest?.running_time],
    ["100m", latest?.run_100m],
    ["800m", latest?.run_800m],
    ["1600m", latest?.run_1600m],
    ["Shot Put", latest?.shot_put],
    ["Push-ups", latest?.push_ups],
  ];

  const topicRows = (key) =>
    Array.isArray(strengths[key]) ? strengths[key] : [];

  return (
    <>
      {animations}
      <div className="mt-6 min-w-0 space-y-6">
        {/* Heading */}
        <div className="animate-fade-up flex flex-wrap items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-pb-green to-[#0f3d2e] text-white shadow-md">
            <ChartIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-xl leading-tight font-extrabold tracking-tight text-pb-green sm:text-2xl">
              Student Performance
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Detailed test, topic and physical activity insights.
            </p>
          </div>
        </div>

        {/* ---------- OVERVIEW ---------- */}
        <PerformanceSection title="Overview" icon={ChartIcon}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {overviewMetrics.map(([label, value, suffix = ""], index) => (
              <MetricCard
                key={label}
                label={label}
                value={value}
                suffix={suffix}
                index={index}
              />
            ))}
          </div>
        </PerformanceSection>

        {/* ---------- SUBJECTS ---------- */}
        <PerformanceSection title="Subject Performance">
          <PerformanceTable
            rows={subjects}
            emptyText="No subject performance available."
            columns={[
              { key: "subject_name", label: "Subject" },
              { key: "total_tests", label: "Tests" },
              { key: "questions_attempted", label: "Questions Attempted" },
              { key: "correct", label: "Correct" },
              { key: "wrong", label: "Wrong" },
              { key: "skipped", label: "Skipped" },
              { key: "score", label: "Score" },
              { key: "percentage", label: "Percentage", render: (row) => formatValue(row.percentage, "%") },
              { key: "accuracy", label: "Accuracy", render: (row) => formatValue(row.accuracy, "%") },
            ]}
          />
        </PerformanceSection>

        {/* ---------- TOPICS ---------- */}
        <PerformanceSection title="Topic Performance">
          <PerformanceTable
            rows={topics}
            emptyText="No topic performance available."
            columns={[
              { key: "subject_name", label: "Subject" },
              { key: "topic_name", label: "Topic" },
              { key: "total_tests", label: "Tests" },
              { key: "questions_attempted", label: "Questions Attempted" },
              { key: "correct", label: "Correct" },
              { key: "wrong", label: "Wrong" },
              { key: "skipped", label: "Skipped" },
              { key: "score", label: "Score" },
              { key: "percentage", label: "Percentage", render: (row) => formatValue(row.percentage, "%") },
              { key: "accuracy", label: "Accuracy", render: (row) => formatValue(row.accuracy, "%") },
            ]}
          />
        </PerformanceSection>

        {/* ---------- STRENGTHS ---------- */}
        <PerformanceSection title="Strengths and Weak Topics">
          <div className="mb-4 flex flex-wrap gap-2.5">
            <span className="inline-flex items-center gap-2 rounded-full border border-pb-khaki/30 bg-pb-light px-3.5 py-1.5 text-xs font-bold text-pb-green">
              <span className="h-1.5 w-1.5 rounded-full bg-pb-khaki" />
              Accuracy Threshold: {formatValue(strengths.accuracy_threshold, "%")}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-pb-khaki/30 bg-pb-light px-3.5 py-1.5 text-xs font-bold text-pb-green">
              <span className="h-1.5 w-1.5 rounded-full bg-pb-khaki" />
              Minimum Questions: {formatValue(strengths.minimum_questions)}
            </span>
          </div>
          <div className="grid min-w-0 gap-4 lg:grid-cols-3">
            <TopicGroup
              title="Strong Topics"
              topics={topicRows("strong_topics")}
              emptyText="No strong topics available."
              tone="text-pb-green"
              accent="bg-gradient-to-r from-pb-green to-pb-green/40"
            />
            <TopicGroup
              title="Weak Topics"
              topics={topicRows("weak_topics")}
              emptyText="No weak topics available."
              tone="text-pb-khaki"
              accent="bg-gradient-to-r from-pb-khaki to-pb-khaki/40"
            />
            <TopicGroup
              title="Insufficient Data Topics"
              topics={topicRows("insufficient_data_topics")}
              emptyText="No insufficient-data topics."
              tone="text-slate-600"
              accent="bg-gradient-to-r from-slate-400 to-slate-300"
            />
          </div>
        </PerformanceSection>

        {/* ---------- PROGRESS ---------- */}
        <PerformanceSection title="Progress">
          <PerformanceTable
            rows={progress}
            emptyText="No progress data available."
            columns={[
              { key: "test_name", label: "Test Name" },
              { key: "date", label: "Date", render: (row) => formatDate(row.date) },
              { key: "score", label: "Score" },
              { key: "percentage", label: "Percentage", render: (row) => formatValue(row.percentage, "%") },
            ]}
          />
        </PerformanceSection>

        {/* ---------- TEST HISTORY ---------- */}
        <PerformanceSection
          title="Test History"
          detail="Completed tests, newest first."
        >
          <PerformanceTable
            rows={history}
            emptyText="No completed test history available."
            columns={[
              { key: "test_name", label: "Test Name" },
              { key: "test_type", label: "Test Type" },
              { key: "date", label: "Date", render: (row) => formatDate(row.date) },
              { key: "score", label: "Score" },
              { key: "percentage", label: "Percentage", render: (row) => formatValue(row.percentage, "%") },
              { key: "correct", label: "Correct" },
              { key: "wrong", label: "Wrong" },
              { key: "skipped", label: "Skipped" },
              { key: "total_questions", label: "Total Questions" },
              { key: "time_taken_seconds", label: "Time Taken (seconds)" },
            ]}
          />
        </PerformanceSection>

        {/* ---------- PHYSICAL ---------- */}
        <PerformanceSection title="Physical Performance">
          {latest || (physical.latest_weight !== null && physical.latest_weight !== undefined) ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {physicalMetrics.map(([label, value, suffix = ""], index) => (
                <MetricCard
                  key={label}
                  label={label}
                  value={value}
                  suffix={suffix}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <EmptyState>No physical performance data available.</EmptyState>
          )}

          {physicalHistory.length > 0 && (
            <div className="mt-5">
              <h3 className="mb-3 text-sm font-extrabold tracking-wide text-pb-green uppercase">
                Physical History
              </h3>
              <PerformanceTable
                rows={physicalHistory}
                emptyText="No physical history available."
                columns={[
                  { key: "date", label: "Date", render: (row) => formatDate(row.date) },
                  { key: "weight", label: "Weight", render: (row) => formatValue(row.weight, " kg") },
                  { key: "running_distance", label: "Running Distance" },
                  { key: "running_time", label: "Running Time" },
                  { key: "run_100m", label: "100m" },
                  { key: "run_800m", label: "800m" },
                  { key: "run_1600m", label: "1600m" },
                  { key: "shot_put", label: "Shot Put" },
                  { key: "push_ups", label: "Push-ups" },
                ]}
              />
            </div>
          )}
        </PerformanceSection>
      </div>
    </>
  );
}

export default AdminStudentPerformance;