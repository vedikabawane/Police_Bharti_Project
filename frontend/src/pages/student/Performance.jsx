import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getPerformance } from "../../services/performanceService";

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

function SectionHeading({ title, detail }) {
  return (
    <div className="mb-5">
      <h2 className="text-lg font-extrabold text-pb-green sm:text-xl">
        {title}
      </h2>
      {detail && <p className="mt-1 text-sm text-slate-500">{detail}</p>}
    </div>
  );
}

function EmptyState({ children }) {
  return (
    <div className="rounded-xl border border-dashed border-[#d8d1bf] bg-pb-light/70 px-4 py-8 text-center text-sm font-medium text-slate-600">
      {children}
    </div>
  );
}

function ProgressChart({ progress }) {
  if (!progress.length) {
    return <EmptyState>अजून पुरेसा test data उपलब्ध नाही.</EmptyState>;
  }

  const width = 760;
  const height = 250;
  const inset = { left: 42, right: 16, top: 18, bottom: 40 };
  const chartWidth = width - inset.left - inset.right;
  const chartHeight = height - inset.top - inset.bottom;
  const percentages = progress.map((item) => Number(item.percentage));
  const validValues = percentages.filter(Number.isFinite);

  if (!validValues.length) {
    return <EmptyState>अजून पुरेसा test data उपलब्ध नाही.</EmptyState>;
  }

  const min = Math.min(0, ...validValues);
  const max = Math.max(100, ...validValues);
  const range = max - min || 1;
  const points = progress.map((item, index) => {
    const value = Number(item.percentage);
    const x =
      inset.left +
      (progress.length === 1 ? chartWidth / 2 : (index / (progress.length - 1)) * chartWidth);
    const y = inset.top + ((max - (Number.isFinite(value) ? value : min)) / range) * chartHeight;
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
              <circle cx={x} cy={y} r="5" fill="#7b6f35" stroke="white" strokeWidth="2">
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
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
        {progress.map((item) => (
          <div key={item.attempt_id} className="min-w-40 text-xs text-slate-600">
            <span className="font-bold text-pb-green">{item.test_name || "चाचणी"}</span>
            <span className="ml-2">{formatValue(item.score, " गुण")}</span>
            <span className="ml-2">{formatValue(item.percentage, "%")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricTable({ rows, columns, emptyText }) {
  if (!rows.length) return <EmptyState>{emptyText}</EmptyState>;

  return (
    <div className="overflow-hidden rounded-xl border border-pb-border-soft">
      <div className="divide-y divide-pb-border-soft bg-white md:hidden">
        {rows.map((row, index) => (
          <article key={row.topic_id || row.subject_id || row.attempt_id || index} className="space-y-3 p-4">
            {columns.map((column) => (
              <div key={column.key} className="flex min-w-0 flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
                <span className="text-xs font-bold text-slate-500">{column.label}</span>
                <span className="min-w-0 break-words text-sm font-semibold text-pb-green sm:text-right">{column.render ? column.render(row) : row[column.key] ?? "—"}</span>
              </div>
            ))}
          </article>
        ))}
      </div>
      <div className="hidden overflow-x-auto md:block">
      <table className="min-w-full divide-y divide-pb-border-soft text-left text-sm">
        <thead className="bg-pb-light text-xs font-extrabold uppercase tracking-wide text-pb-green">
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col" className="whitespace-nowrap px-4 py-3">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-pb-border-soft bg-white">
          {rows.map((row, index) => (
            <tr key={row.topic_id || row.subject_id || row.attempt_id || index}>
              {columns.map((column) => (
                <td key={column.key} className="whitespace-nowrap px-4 py-3 text-slate-600">
                  {column.render ? column.render(row) : row[column.key] ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}

function TopicGroup({ title, icon, topics, emptyText, tone }) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
      <SectionHeading title={`${icon} ${title}`} />
      {topics.length ? (
        <div className="space-y-3">
          {topics.map((topic) => (
            <div
              key={topic.topic_id}
              className="flex flex-col gap-2 rounded-xl border border-pb-border-soft p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-bold text-pb-green">{topic.topic_name}</p>
                <p className="mt-1 text-xs text-slate-500">{topic.subject_name}</p>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-slate-600">
                <span>{formatValue(topic.accuracy, "%")} अचूकता</span>
                <span>{formatValue(topic.questions_attempted)} प्रश्न</span>
                <span>{formatValue(topic.percentage, "%")} गुण</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState>{emptyText}</EmptyState>
      )}
      <span className={`sr-only ${tone}`} />
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
        setError("Performance माहिती मिळवताना समस्या आली. कृपया पुन्हा प्रयत्न करा.");
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
  const physicalHistory = Array.isArray(physical.history)
    ? physical.history
    : [];

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
    (value) => value !== null && value !== undefined && value !== 0
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
    ["Long Jump", physicalLatest?.long_jump],
    ["Shot Put", physicalLatest?.shot_put],
    ["Push-ups", physicalLatest?.push_ups],
  ];

  return (
    <div className="min-h-screen min-w-0 bg-pb-light">
      <section className="border-b border-pb-border bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div>
            <p className="text-sm font-bold text-pb-khaki">📈 Performance</p>
            <h1 className="mt-2 text-2xl font-extrabold text-pb-green sm:text-3xl">
              माझी Performance
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              तुमच्या Police Bharti तयारीची संपूर्ण प्रगती येथे पहा.
            </p>
          </div>
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-pb-green text-3xl text-white shadow-lg">
            📊
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl space-y-7 px-4 py-7 sm:px-6 lg:px-8">
        {loading ? (
          <div role="status" aria-live="polite" className="rounded-2xl bg-white p-8 text-center text-sm font-semibold text-slate-600 shadow-sm">
            Performance माहिती लोड होत आहे...
          </div>
        ) : error ? (
          <div role="alert" className="rounded-2xl border border-red-200 bg-white p-6 text-center">
            <p className="text-sm font-semibold text-red-700">{error}</p>
            <button
              type="button"
              onClick={retryPerformance}
              className="mt-4 rounded-xl bg-pb-green px-5 py-2.5 text-sm font-bold text-white hover:bg-pb-khaki"
            >
              पुन्हा प्रयत्न करा
            </button>
          </div>
        ) : (
          <>
            <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
              <SectionHeading title="एकूण कामगिरी" detail="तुमच्या पूर्ण केलेल्या चाचण्यांवर आधारित." />
              {overviewHasData ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                  {cards.map(([label, value, suffix]) => (
                    <article key={label} className="rounded-xl border border-pb-border-soft bg-pb-light/60 p-4">
                      <p className="text-xs font-semibold text-slate-500">{label}</p>
                      <p className="mt-2 break-words text-xl font-extrabold text-pb-green">
                        {formatValue(value, suffix)}
                      </p>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState>अजून performance data उपलब्ध नाही.</EmptyState>
              )}
            </section>

            <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
              <SectionHeading title="Score Progress" detail="चाचण्यांचा क्रमवार निकाल." />
              <ProgressChart progress={progress} />
            </section>

            <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
              <SectionHeading title="विषयानुसार Performance" />
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
                  { key: "score", label: "Score", render: (row) => formatValue(row.score) },
                  { key: "percentage", label: "Percentage", render: (row) => formatValue(row.percentage, "%") },
                  { key: "accuracy", label: "Accuracy", render: (row) => formatValue(row.accuracy, "%") },
                ]}
              />
            </section>

            <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
              <SectionHeading title="Topic Performance" />
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
                  { key: "score", label: "Score", render: (row) => formatValue(row.score) },
                  { key: "percentage", label: "Percentage", render: (row) => formatValue(row.percentage, "%") },
                  { key: "accuracy", label: "Accuracy", render: (row) => formatValue(row.accuracy, "%") },
                ]}
              />
            </section>

            <div className="grid gap-5 lg:grid-cols-3">
              <TopicGroup
                title="Strong Topics"
                icon="💪"
                topics={strengthRows("strong_topics")}
                emptyText="अजून strong topics नोंदलेले नाहीत."
                tone="text-pb-green"
              />
              <TopicGroup
                title="Weak Topics"
                icon="⚠️"
                topics={strengthRows("weak_topics")}
                emptyText="सध्या weak topics उपलब्ध नाहीत."
                tone="text-pb-khaki"
              />
              <TopicGroup
                title="Insufficient Data"
                icon="📊"
                topics={strengthRows("insufficient_data_topics")}
                emptyText="अपुरा डेटा असलेले topics नाहीत."
                tone="text-slate-500"
              />
            </div>

            <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
              <SectionHeading title="Test History" />
              <MetricTable
                rows={history}
                emptyText="अजून पूर्ण केलेल्या Tests उपलब्ध नाहीत."
                columns={[
                  { key: "test_name", label: "Test" },
                  { key: "test_type", label: "Type" },
                  { key: "date", label: "Date" },
                  { key: "score", label: "Score", render: (row) => formatValue(row.score) },
                  { key: "percentage", label: "Percentage", render: (row) => formatValue(row.percentage, "%") },
                  { key: "correct", label: "बरोबर" },
                  { key: "wrong", label: "चुकीचे" },
                  { key: "skipped", label: "Skip" },
                  { key: "time_taken_seconds", label: "वेळ (से.)" },
                ]}
              />
            </section>

            <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <SectionHeading title="Physical Performance" detail="नोंदवलेल्या शारीरिक प्रशिक्षणावर आधारित." />
                <Link
                  to="/student/physical"
                  className="inline-flex shrink-0 items-center justify-center rounded-xl bg-pb-green px-4 py-2.5 text-sm font-bold text-white hover:bg-pb-khaki"
                >
                  Physical Training कडे जा
                </Link>
              </div>
              {physicalLatest ? (
                <>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {physicalMetrics.map(([label, value]) => (
                      <div key={label} className="rounded-xl border border-pb-border-soft bg-pb-light/60 p-4">
                        <p className="text-xs font-semibold text-slate-500">{label}</p>
                        <p className="mt-2 text-lg font-extrabold text-pb-green">
                          {formatValue(value)}
                        </p>
                      </div>
                    ))}
                  </div>
                  {physicalHistory.length > 0 && (
                    <div className="mt-6">
                      <h3 className="mb-3 text-sm font-extrabold text-pb-green">Training History</h3>
                      <MetricTable
                        rows={physicalHistory}
                        emptyText="अजून physical training records उपलब्ध नाहीत."
                        columns={[
                          { key: "date", label: "Date" },
                          { key: "weight", label: "Weight", render: (row) => formatValue(row.weight) },
                          { key: "running_distance", label: "Running Distance", render: (row) => formatValue(row.running_distance) },
                          { key: "running_time", label: "Running Time", render: (row) => formatValue(row.running_time) },
                          { key: "run_100m", label: "100m", render: (row) => formatValue(row.run_100m) },
                          { key: "run_800m", label: "800m", render: (row) => formatValue(row.run_800m) },
                          { key: "run_1600m", label: "1600m", render: (row) => formatValue(row.run_1600m) },
                          { key: "long_jump", label: "Long Jump", render: (row) => formatValue(row.long_jump) },
                          { key: "shot_put", label: "Shot Put", render: (row) => formatValue(row.shot_put) },
                          { key: "push_ups", label: "Push-ups", render: (row) => formatValue(row.push_ups) },
                        ]}
                      />
                    </div>
                  )}
                </>
              ) : (
                <EmptyState>
                  अजून physical training records उपलब्ध नाहीत.
                </EmptyState>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default Performance;
