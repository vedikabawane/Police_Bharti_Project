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

function PerformanceSection({ title, children, detail }) {
  return (
    <section className="min-w-0 rounded-lg border border-pb-border bg-white p-5 sm:p-6">
      <div className="mb-4">
        <h2 className="text-lg font-extrabold text-pb-green">{title}</h2>
        {detail && <p className="mt-1 text-sm text-slate-500">{detail}</p>}
      </div>
      {children}
    </section>
  );
}

function EmptyState({ children }) {
  return (
    <p className="rounded-lg border border-dashed border-[#d8d1bf] bg-pb-light/70 px-4 py-6 text-center text-sm font-medium text-slate-600">
      {children}
    </p>
  );
}

function PerformanceTable({ rows, columns, emptyText }) {
  if (!rows.length) return <EmptyState>{emptyText}</EmptyState>;

  return (
    <div className="max-w-full overflow-x-auto rounded-lg border border-pb-border-soft">
      <table className="w-full min-w-max border-collapse text-left text-sm">
        <thead className="bg-pb-light text-xs uppercase tracking-wide text-slate-600">
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col" className="whitespace-nowrap px-4 py-3 font-bold">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-pb-border-soft">
          {rows.map((row, index) => (
            <tr key={row.id ?? row.attempt_id ?? row.topic_id ?? `${row.date}-${index}`} className="bg-white">
              {columns.map((column) => (
                <td key={column.key} className="whitespace-nowrap px-4 py-3 font-medium text-pb-green">
                  {column.render ? column.render(row) : formatValue(row[column.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TopicGroup({ title, topics, emptyText, tone }) {
  return (
    <section className="min-w-0 rounded-lg border border-pb-border bg-white p-5">
      <h3 className={`text-base font-extrabold ${tone}`}>{title}</h3>
      {topics.length ? (
        <ul className="mt-3 space-y-3">
          {topics.map((topic) => (
            <li key={topic.topic_id} className="border-b border-pb-border-soft pb-3 last:border-0 last:pb-0">
              <p className="break-words text-sm font-bold text-pb-green">
                {topic.topic_name || "Topic"}
              </p>
              <p className="mt-1 text-xs text-slate-600">
                {topic.subject_name || "Subject"} · {formatValue(topic.accuracy, "%")} accuracy · {formatValue(topic.questions_attempted)} questions
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-3"><EmptyState>{emptyText}</EmptyState></div>
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
  if (loading) {
    return (
      <section className="mt-6 rounded-lg border border-pb-border bg-white px-5 py-10 text-center" role="status" aria-live="polite">
        <span className="mx-auto block h-8 w-8 animate-spin rounded-full border-4 border-pb-border border-t-pb-khaki" />
        <p className="mt-3 text-sm font-semibold text-pb-green">Loading student performance…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mt-6 rounded-lg border border-red-200 bg-white p-6 text-center" role="alert">
        <p className="text-sm font-semibold text-red-700">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-lg bg-pb-green px-4 py-2.5 text-sm font-bold text-white transition hover:bg-pb-khaki"
        >
          Retry
        </button>
      </section>
    );
  }

  if (!performance || !hasUsefulPerformance(performance)) {
    return (
      <section className="mt-6 rounded-lg border border-pb-border bg-white p-5 sm:p-6">
        <h2 className="text-lg font-extrabold text-pb-green">Student Performance</h2>
        <p className="mt-4 rounded-lg bg-pb-light px-4 py-6 text-center text-sm font-semibold text-slate-600">
          No performance data available.
        </p>
      </section>
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

  const topicRows = (key) => Array.isArray(strengths[key]) ? strengths[key] : [];

  return (
    <div className="mt-6 min-w-0 space-y-6">
      <h2 className="text-xl font-extrabold text-pb-green">Student Performance</h2>

      <PerformanceSection title="Overview">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {overviewMetrics.map(([label, value, suffix = ""]) => (
            <article key={label} className="min-w-0 rounded-lg border border-pb-border-soft bg-pb-light/60 p-4">
              <p className="text-xs font-semibold text-slate-500">{label}</p>
              <p className="mt-2 break-words text-xl font-extrabold text-pb-green">
                {formatValue(value, suffix)}
              </p>
            </article>
          ))}
        </div>
      </PerformanceSection>

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

      <PerformanceSection title="Strengths and Weak Topics">
        <div className="mb-4 flex flex-wrap gap-3">
          <span className="rounded-full bg-pb-light px-3 py-1.5 text-xs font-bold text-pb-green">
            Accuracy Threshold: {formatValue(strengths.accuracy_threshold, "%")}
          </span>
          <span className="rounded-full bg-pb-light px-3 py-1.5 text-xs font-bold text-pb-green">
            Minimum Questions: {formatValue(strengths.minimum_questions)}
          </span>
        </div>
        <div className="grid min-w-0 gap-4 lg:grid-cols-3">
          <TopicGroup title="Strong Topics" topics={topicRows("strong_topics")} emptyText="No strong topics available." tone="text-pb-green" />
          <TopicGroup title="Weak Topics" topics={topicRows("weak_topics")} emptyText="No weak topics available." tone="text-pb-khaki" />
          <TopicGroup title="Insufficient Data Topics" topics={topicRows("insufficient_data_topics")} emptyText="No insufficient-data topics." tone="text-slate-600" />
        </div>
      </PerformanceSection>

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

      <PerformanceSection title="Test History" detail="Completed tests, newest first.">
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

      <PerformanceSection title="Physical Performance">
        {latest || physical.latest_weight !== null && physical.latest_weight !== undefined ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {physicalMetrics.map(([label, value, suffix = ""]) => (
              <article key={label} className="min-w-0 rounded-lg border border-pb-border-soft bg-pb-light/60 p-4">
                <p className="text-xs font-semibold text-slate-500">{label}</p>
                <p className="mt-2 break-words text-lg font-extrabold text-pb-green">
                  {formatValue(value, suffix)}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState>No physical performance data available.</EmptyState>
        )}
        {physicalHistory.length > 0 && (
          <div className="mt-5">
            <h3 className="mb-3 text-sm font-extrabold text-pb-green">Physical History</h3>
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
  );
}

export default AdminStudentPerformance;
