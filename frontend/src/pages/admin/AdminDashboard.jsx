import { useEffect, useState } from "react";

import { getAdminDashboard } from "../../services/admin/adminDashboardService";

const formatCount = (value) => (
  Number.isFinite(value) ? value.toLocaleString("en-IN") : "—"
);

const formatValue = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  const number = Number(value);
  return Number.isFinite(number) ? number.toLocaleString("en-IN") : "—";
};

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      });
};

function MetricSection({ title, metrics, columns = 3 }) {
  const columnClass = {
    1: "sm:grid-cols-1",
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-2 xl:grid-cols-3",
    4: "sm:grid-cols-2 xl:grid-cols-4",
  }[columns];

  return (
    <section className="mt-8" aria-label={title}>
      <h2 className="mb-3 text-lg font-extrabold text-pb-green">{title}</h2>
      <div className={`grid min-w-0 gap-3 ${columnClass}`}>
        {metrics.map((metric) => (
          <article
            key={metric.label}
            className="flex min-w-0 items-center gap-3 rounded-lg border border-pb-border bg-white p-4"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-pb-light text-lg text-pb-green">
              {metric.icon}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-600">
                {metric.label}
              </p>
              <p className="mt-1 text-xl font-extrabold tabular-nums text-pb-green">
                {formatCount(metric.value)}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function DataTable({ title, columns, rows, emptyMessage }) {
  return (
    <section className="mt-8 min-w-0" aria-label={title}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold text-pb-green">{title}</h2>
        <span className="text-xs font-semibold text-slate-500">
          {rows.length.toLocaleString("en-IN")} नोंदी
        </span>
      </div>
      <div className="overflow-hidden rounded-lg border border-pb-border bg-white">
        {rows.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-500">
            {emptyMessage}
          </p>
        ) : (
          <>
          <div className="space-y-3 p-3 xl:hidden">
            {rows.map((row, index) => (
              <article key={row.id ?? row.attempt_id ?? index} className="space-y-3 rounded-xl border border-pb-border-soft bg-white p-4">
                {columns.map((column) => <div key={column.key} className="flex min-w-0 flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4"><span className="text-xs font-bold text-slate-500">{column.label}</span><span className="min-w-0 break-words text-sm font-semibold text-pb-green sm:text-right">{column.render ? column.render(row[column.key], row) : row[column.key] ?? "—"}</span></div>)}
              </article>
            ))}
          </div>
          <div className="hidden overflow-x-auto xl:block">
            <table className="w-full min-w-[620px] border-collapse text-left text-sm">
              <thead className="bg-pb-light text-xs uppercase tracking-wide text-pb-green">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      scope="col"
                      className="whitespace-nowrap px-4 py-3 font-bold"
                    >
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-pb-border-soft">
                {rows.map((row, index) => (
                  <tr key={row.id ?? row.attempt_id ?? index}>
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className="max-w-64 break-words px-4 py-3 text-pb-green"
                      >
                        {column.render
                          ? column.render(row[column.key], row)
                          : row[column.key] ?? "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>
    </section>
  );
}

function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let isCurrent = true;

    const loadDashboard = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await getAdminDashboard();
        if (!response?.success || !response?.data?.admin) {
          throw new Error("Admin dashboard response is incomplete.");
        }
        if (isCurrent) setDashboard(response.data);
      } catch {
        if (isCurrent) {
          setError("डॅशबोर्ड लोड करता आला नाही. कृपया पुन्हा प्रयत्न करा.");
        }
      } finally {
        if (isCurrent) setLoading(false);
      }
    };

    loadDashboard();
    return () => {
      isCurrent = false;
    };
  }, [reload]);

  const students = dashboard?.students || {};
  const content = dashboard?.content || {};
  const tests = dashboard?.tests || {};
  const physical = dashboard?.physical || {};
  const ai = dashboard?.ai || {};
  const admin = dashboard?.admin || {};
  const recentStudents = dashboard?.recent_activity?.students || [];
  const recentAttempts = dashboard?.recent_activity?.test_attempts || [];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-7 border-b border-pb-border pb-5">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-pb-khaki">
          प्रशासक डॅशबोर्ड
        </p>
        <h1 className="mt-2 text-2xl font-extrabold text-pb-green sm:text-3xl">
          Admin Dashboard
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          प्लॅटफॉर्मची वास्तविक आकडेवारी आणि अलीकडील विद्यार्थी activity.
        </p>
      </div>

      {loading ? (
        <div
          role="status"
          className="rounded-lg border border-pb-border bg-white px-5 py-8 text-sm font-semibold text-pb-green"
        >
          डॅशबोर्ड लोड होत आहे...
        </div>
      ) : error ? (
        <div
          role="alert"
          className="flex flex-col items-start justify-between gap-4 rounded-lg border border-red-200 bg-white px-5 py-5 text-sm text-red-700 sm:flex-row sm:items-center"
        >
          <p className="font-semibold">{error}</p>
          <button
            type="button"
            onClick={() => setReload((current) => current + 1)}
            className="rounded-md border border-red-200 px-3 py-2 font-bold hover:bg-red-50"
          >
            पुन्हा प्रयत्न करा
          </button>
        </div>
      ) : (
        <>
          <section
            aria-labelledby="admin-welcome-heading"
            className="rounded-lg border border-pb-border border-l-4 border-l-pb-khaki bg-white p-5 sm:p-6"
          >
            <p className="text-xs font-bold uppercase tracking-wide text-pb-khaki">
              Police Bharti Platform · Admin
            </p>
            <h2
              id="admin-welcome-heading"
              className="mt-2 text-xl font-extrabold text-pb-green sm:text-2xl"
            >
              नमस्कार, {admin.name || "Admin"}
            </h2>
            <div className="mt-4 grid gap-3 border-t border-pb-border-soft pt-4 text-sm sm:grid-cols-3">
              <div>
                <p className="text-xs font-semibold text-slate-500">भूमिका</p>
                <p className="mt-1 font-bold capitalize text-pb-green">
                  {admin.role || "—"}
                </p>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-500">ईमेल</p>
                <p className="mt-1 break-all font-semibold text-pb-green">
                  {admin.email || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">Admin ID</p>
                <p className="mt-1 font-semibold text-pb-green">
                  {formatValue(admin.id)}
                </p>
              </div>
            </div>
          </section>

          <MetricSection
            title="विद्यार्थी आढावा"
            columns={4}
            metrics={[
              { label: "Total Students", icon: "♙", value: students.total },
              { label: "Active Students", icon: "✓", value: students.active },
              { label: "Inactive Students", icon: "Ⅱ", value: students.inactive },
              {
                label: `Recently Registered · ${dashboard.meta?.recent_student_window_days ?? "—"} days`,
                icon: "＋",
                value: students.recent_30_days,
              },
            ]}
          />

          <MetricSection
            title="सामग्री आढावा"
            columns={3}
            metrics={[
              { label: "Subjects", icon: "◈", value: content.subjects },
              { label: "Topics", icon: "⌘", value: content.topics },
              { label: "Study Materials", icon: "▤", value: content.study_materials },
              { label: "Videos", icon: "▷", value: content.videos },
              { label: "Questions", icon: "?", value: content.questions },
              { label: "PYQs", icon: "▧", value: content.pyq },
            ]}
          />

          <MetricSection
            title="चाचणी आढावा"
            columns={3}
            metrics={[
              { label: "Total Tests", icon: "☷", value: tests.total },
              { label: "Active Tests", icon: "✓", value: tests.active },
              { label: "Inactive Tests", icon: "Ⅱ", value: tests.inactive },
              { label: "Total Attempts", icon: "◎", value: tests.attempts },
              {
                label: "Completed Attempts",
                icon: "●",
                value: tests.completed_attempts,
              },
            ]}
          />

          <div className="grid gap-8 lg:grid-cols-2">
            <MetricSection
              title="शारीरिक प्रशिक्षण"
              columns={1}
              metrics={[
                {
                  label: "Training Records",
                  icon: "↗",
                  value: physical.training_records,
                },
              ]}
            />
            <MetricSection
              title="AI Assistant"
              columns={2}
              metrics={[
                {
                  label: "Chat Sessions",
                  icon: "✳",
                  value: ai.chat_sessions,
                },
                {
                  label: "Chat Messages",
                  icon: "☷",
                  value: ai.chat_messages,
                },
              ]}
            />
          </div>

          <DataTable
            title="अलीकडे नोंदणी केलेले विद्यार्थी"
            rows={recentStudents}
            emptyMessage="अजून कोणतेही विद्यार्थी उपलब्ध नाहीत."
            columns={[
              { key: "name", label: "विद्यार्थी" },
              { key: "email", label: "ईमेल" },
              {
                key: "created_at",
                label: "नोंदणी तारीख",
                render: formatDate,
              },
              {
                key: "is_active",
                label: "स्थिती",
                render: (active) => (
                  <span className={active ? "font-bold text-pb-green" : "font-bold text-pb-khaki"}>
                    {active ? "Active" : "Inactive"}
                  </span>
                ),
              },
            ]}
          />

          <DataTable
            title="अलीकडील चाचणी प्रयत्न"
            rows={recentAttempts}
            emptyMessage="अद्याप कोणतेही चाचणी प्रयत्न उपलब्ध नाहीत."
            columns={[
              {
                key: "student_name",
                label: "विद्यार्थी",
                render: (name, row) => name || `#${row.student_id}`,
              },
              {
                key: "test_name",
                label: "चाचणी",
                render: (name, row) => name || `#${row.test_id}`,
              },
              { key: "score", label: "Score", render: formatValue },
              {
                key: "percentage",
                label: "Percentage",
                render: (value) => {
                  const formatted = formatValue(value);
                  return formatted === "—" ? formatted : `${formatted}%`;
                },
              },
              {
                key: "attempted_at",
                label: "तारीख",
                render: formatDate,
              },
              {
                key: "status",
                label: "स्थिती",
                render: (value) => value || "—",
              },
            ]}
          />
        </>
      )}
    </div>
  );
}

export default AdminDashboard;
