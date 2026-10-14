import { useEffect, useState } from "react";

import { getAdminDashboard } from "../../services/admin/adminDashboardService";

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

const UsersIcon = (p) => (
  <svg {...iconProps} {...p}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3 20a6 6 0 0 1 12 0" />
    <path d="M16 5.2a3.2 3.2 0 0 1 0 5.6M18 20a5.6 5.6 0 0 0-2-4.3" />
  </svg>
);
const UserCheckIcon = (p) => (
  <svg {...iconProps} {...p}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3 20a6 6 0 0 1 12 0" />
    <path d="m17 11 2 2 4-4" />
  </svg>
);
const UserMinusIcon = (p) => (
  <svg {...iconProps} {...p}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3 20a6 6 0 0 1 12 0" />
    <path d="M17 13h5" />
  </svg>
);
const UserPlusIcon = (p) => (
  <svg {...iconProps} {...p}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3 20a6 6 0 0 1 12 0" />
    <path d="M17 8h5M19.5 5.5v5" />
  </svg>
);
const GridIcon = (p) => (
  <svg {...iconProps} {...p}>
    <rect x="3" y="3" width="8" height="8" rx="1.5" />
    <rect x="13" y="3" width="8" height="8" rx="1.5" />
    <rect x="3" y="13" width="8" height="8" rx="1.5" />
    <rect x="13" y="13" width="8" height="8" rx="1.5" />
  </svg>
);
const FolderIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
  </svg>
);
const FileTextIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M6 3h9l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
    <path d="M14 3v6h6M8 13h8M8 17h5" />
  </svg>
);
const VideoIcon = (p) => (
  <svg {...iconProps} {...p}>
    <rect x="3" y="6" width="13" height="12" rx="2" />
    <path d="m16 10 4-2v8l-4-2Z" />
  </svg>
);
const CheckSquareIcon = (p) => (
  <svg {...iconProps} {...p}>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path d="m8 12 2.5 2.5L16 9" />
  </svg>
);
const XSquareIcon = (p) => (
  <svg {...iconProps} {...p}>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path d="m9 9 6 6M15 9l-6 6" />
  </svg>
);
const TargetIcon = (p) => (
  <svg {...iconProps} {...p}>
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="12" cy="12" r="1" />
  </svg>
);
const PlayCircleIcon = (p) => (
  <svg {...iconProps} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m10 8 6 4-6 4Z" />
  </svg>
);
const ActivityIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M3 12h3l2-6 4 12 3-9 2 3h4" />
    <path d="M3 20h18" />
  </svg>
);
const BotIcon = (p) => (
  <svg {...iconProps} {...p}>
    <rect x="4" y="8" width="16" height="12" rx="3" />
    <path d="M12 4v4M9 14h.01M15 14h.01" />
    <path d="M2 13v2M22 13v2" />
  </svg>
);
const MessageIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-5 4V5Z" />
    <path d="M8 9h8M8 12h5" />
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
const ShieldIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M12 3 5 6v5c0 4.6 2.8 8.1 7 10 4.2-1.9 7-5.4 7-10V6l-7-3Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const formatCount = (value) =>
  Number.isFinite(value) ? value.toLocaleString("en-IN") : "—";

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

/* ================= METRIC CARD ================= */
function MetricCard({ label, value, icon: Icon, index = 0, tone = "green" }) {
  const toneStyles = {
    green: "text-pb-green bg-pb-green/10",
    khaki: "text-pb-khaki bg-pb-khaki/15",
    slate: "text-slate-600 bg-slate-100",
  };
  const tone_ = toneStyles[tone] || toneStyles.green;

  return (
    <article
      className="animate-fade-up group relative min-w-0 overflow-hidden rounded-2xl border border-pb-border bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:border-pb-khaki/40 hover:shadow-md"
      style={{ animationDelay: `${Math.min(index * 45, 400)}ms` }}
    >
      <div className="flex min-w-0 items-center gap-3.5">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105 ${tone_}`}
        >
          {Icon ? <Icon className="h-5 w-5" /> : null}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-bold tracking-wide text-slate-500 uppercase">
            {label}
          </p>
          <p className="mt-1 text-xl leading-tight font-extrabold tabular-nums text-pb-green sm:text-2xl">
            {formatCount(value)}
          </p>
        </div>
      </div>
    </article>
  );
}

/* ================= METRIC SECTION ================= */
function MetricSection({ title, metrics, columns = 3, icon: SectionIcon }) {
  const columnClass = {
    1: "sm:grid-cols-1",
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-2 xl:grid-cols-3",
    4: "sm:grid-cols-2 xl:grid-cols-4",
  }[columns];

  return (
    <section className="mt-8" aria-label={title}>
      <div className="mb-3.5 flex items-center gap-2.5">
        {SectionIcon && (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pb-green/10 text-pb-green">
            <SectionIcon className="h-4 w-4" />
          </span>
        )}
        <h2 className="text-lg leading-tight font-extrabold tracking-tight text-pb-green">
          {title}
        </h2>
        <span className="h-px flex-1 bg-gradient-to-r from-pb-border to-transparent" />
      </div>
      <div className={`grid min-w-0 gap-3 ${columnClass}`}>
        {metrics.map((metric, index) => (
          <MetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            icon={metric.icon}
            tone={metric.tone}
            index={index}
          />
        ))}
      </div>
    </section>
  );
}

/* ================= DATA TABLE ================= */
function DataTable({ title, columns, rows, emptyMessage, icon: SectionIcon }) {
  return (
    <section className="mt-8 min-w-0" aria-label={title}>
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {SectionIcon && (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pb-khaki/15 text-pb-khaki">
              <SectionIcon className="h-4 w-4" />
            </span>
          )}
          <h2 className="text-lg leading-tight font-extrabold tracking-tight text-pb-green">
            {title}
          </h2>
        </div>
        <span className="rounded-full border border-pb-border-soft bg-pb-light px-3 py-1 text-[11px] font-bold text-pb-green">
          {rows.length.toLocaleString("en-IN")} नोंदी
        </span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-pb-border bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2.5 px-5 py-10 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-pb-light text-pb-khaki">
              <InboxIcon className="h-5 w-5" />
            </span>
            <p className="text-sm font-semibold text-slate-500">{emptyMessage}</p>
          </div>
        ) : (
          <>
            {/* ---------- Mobile cards ---------- */}
            <div className="space-y-3 p-3 xl:hidden">
              {rows.map((row, index) => (
                <article
                  key={row.id ?? row.attempt_id ?? index}
                  className="animate-fade-up space-y-3 rounded-xl border border-pb-border-soft bg-white p-4 transition-shadow duration-300 hover:shadow-sm"
                  style={{ animationDelay: `${Math.min(index * 40, 400)}ms` }}
                >
                  {columns.map((column) => (
                    <div
                      key={column.key}
                      className="flex min-w-0 flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4"
                    >
                      <span className="text-[11px] font-bold tracking-wide text-slate-500 uppercase">
                        {column.label}
                      </span>
                      <span className="min-w-0 text-sm font-semibold break-words text-pb-green sm:text-right">
                        {column.render
                          ? column.render(row[column.key], row)
                          : row[column.key] ?? "—"}
                      </span>
                    </div>
                  ))}
                </article>
              ))}
            </div>

            {/* ---------- Desktop table ---------- */}
            <div className="hidden overflow-x-auto xl:block">
              <table className="w-full min-w-[620px] border-collapse text-left text-sm">
                <thead className="bg-pb-light text-[11px] tracking-wide text-pb-green uppercase">
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
                <tbody className="divide-y divide-pb-border-soft">
                  {rows.map((row, index) => (
                    <tr
                      key={row.id ?? row.attempt_id ?? index}
                      className="bg-white transition-colors duration-200 odd:bg-white even:bg-pb-light/40 hover:bg-pb-light/70"
                    >
                      {columns.map((column) => (
                        <td
                          key={column.key}
                          className="max-w-64 font-semibold break-words px-4 py-3 text-pb-green"
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
    <div className="relative min-h-screen overflow-hidden bg-pb-light">
      {/* ---------- ANIMATION KEYFRAMES ---------- */}
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

      {/* ---------- ANIMATED BACKGROUND ---------- */}
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

      {/* ---------- CONTENT ---------- */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">

        {/* ================= PAGE HEADER ================= */}
        <div className="animate-fade-up mb-7 overflow-hidden rounded-2xl border border-pb-border/50 bg-white/80 shadow-sm backdrop-blur-sm">
          <span
            aria-hidden="true"
            className="animate-gradient pointer-events-none block h-1 w-full bg-gradient-to-r from-pb-green via-pb-khaki to-pb-green"
          />
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex min-w-0 items-center gap-4">
              <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-pb-green to-[#0f3d2e] text-white shadow-md">
                <span
                  aria-hidden="true"
                  className="animate-soft-glow pointer-events-none absolute -inset-1 rounded-3xl bg-pb-khaki/30 blur-md"
                />
                <ShieldIcon className="relative h-6 w-6" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold tracking-[0.16em] text-pb-khaki uppercase sm:text-xs">
                  प्रशासक डॅशबोर्ड
                </p>
                <h1 className="mt-1 text-xl leading-tight font-extrabold tracking-tight text-pb-green sm:text-2xl lg:text-3xl">
                  Admin Dashboard
                </h1>
                <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-600 sm:text-sm">
                  प्लॅटफॉर्मची वास्तविक आकडेवारी आणि अलीकडील विद्यार्थी activity.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ================= LOADING ================= */}
        {loading ? (
          <div
            role="status"
            className="animate-fade-up flex flex-col items-center justify-center gap-3 rounded-2xl border border-pb-border bg-white/85 px-5 py-12 text-center backdrop-blur-sm"
          >
            <span className="relative flex h-12 w-12 items-center justify-center">
              <span
                aria-hidden="true"
                className="absolute inset-0 rounded-full border-4 border-pb-light"
              />
              <svg
                className="animate-spin-soft relative h-12 w-12 text-pb-khaki"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M21 12a9 9 0 1 1-6.2-8.5" />
              </svg>
            </span>
            <p className="text-sm font-semibold text-pb-green">
              डॅशबोर्ड लोड होत आहे...
            </p>
            <p className="text-xs text-slate-500">
              Fetching the latest platform metrics.
            </p>
          </div>
        ) : error ? (
          /* ================= ERROR ================= */
          <div
            role="alert"
            className="animate-fade-up overflow-hidden rounded-2xl border border-red-200 bg-white"
          >
            <span
              aria-hidden="true"
              className="block h-1 w-full bg-gradient-to-r from-red-500 via-red-600 to-red-500"
            />
            <div className="flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:text-left">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                <AlertIcon className="h-6 w-6" />
              </span>
              <p className="min-w-0 flex-1 text-sm font-semibold text-red-700">
                {error}
              </p>
              <button
                type="button"
                onClick={() => setReload((current) => current + 1)}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-pb-green px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-pb-khaki hover:shadow-md active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none"
              >
                <RefreshIcon className="h-4 w-4" />
                पुन्हा प्रयत्न करा
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* ================= WELCOME CARD ================= */}
            <section
              aria-labelledby="admin-welcome-heading"
              className="animate-fade-up relative overflow-hidden rounded-2xl border border-pb-border bg-gradient-to-br from-white via-white to-pb-light/60 p-5 shadow-sm sm:p-6"
            >
              <span
                aria-hidden="true"
                className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-pb-green via-pb-khaki to-pb-green"
              />
              <div className="flex items-start gap-4 pl-3">
                <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-pb-khaki/15 text-pb-khaki sm:flex">
                  <UsersIcon className="h-6 w-6" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold tracking-[0.16em] text-pb-khaki uppercase sm:text-xs">
                    Police Bharti Platform · Admin
                  </p>
                  <h2
                    id="admin-welcome-heading"
                    className="mt-1.5 text-xl leading-tight font-extrabold tracking-tight text-pb-green sm:text-2xl"
                  >
                    नमस्कार, {admin.name || "Admin"}
                  </h2>

                  <div className="mt-4 grid gap-4 border-t border-pb-border-soft pt-4 text-sm sm:grid-cols-3">
                    <div className="rounded-xl bg-white/60 p-3 ring-1 ring-pb-border-soft">
                      <p className="text-[10px] font-bold tracking-wide text-slate-500 uppercase">
                        भूमिका
                      </p>
                      <p className="mt-1 font-bold text-pb-green capitalize">
                        {admin.role || "—"}
                      </p>
                    </div>
                    <div className="min-w-0 rounded-xl bg-white/60 p-3 ring-1 ring-pb-border-soft">
                      <p className="text-[10px] font-bold tracking-wide text-slate-500 uppercase">
                        ईमेल
                      </p>
                      <p className="mt-1 font-semibold break-all text-pb-green">
                        {admin.email || "—"}
                      </p>
                    </div>
                    <div className="rounded-xl bg-white/60 p-3 ring-1 ring-pb-border-soft">
                      <p className="text-[10px] font-bold tracking-wide text-slate-500 uppercase">
                        Admin ID
                      </p>
                      <p className="mt-1 font-semibold tabular-nums text-pb-green">
                        {formatValue(admin.id)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ================= STUDENTS ================= */}
            <MetricSection
              title="विद्यार्थी आढावा"
              columns={4}
              icon={UsersIcon}
              metrics={[
                { label: "Total Students", icon: UsersIcon, value: students.total },
                { label: "Active Students", icon: UserCheckIcon, value: students.active },
                { label: "Inactive Students", icon: UserMinusIcon, value: students.inactive, tone: "khaki" },
                {
                  label: `Recently Registered · ${dashboard.meta?.recent_student_window_days ?? "—"} days`,
                  icon: UserPlusIcon,
                  value: students.recent_30_days,
                },
              ]}
            />

            {/* ================= CONTENT ================= */}
            <MetricSection
              title="सामग्री आढावा"
              columns={2}
              icon={GridIcon}
              metrics={[
                { label: "Subjects", icon: GridIcon, value: content.subjects },
                { label: "Topics", icon: FolderIcon, value: content.topics },
                { label: "Study Materials", icon: FileTextIcon, value: content.study_materials },
                { label: "Videos", icon: VideoIcon, value: content.videos },
              ]}
            />

            {/* ================= TESTS ================= */}
            <MetricSection
              title="चाचणी आढावा"
              columns={3}
              icon={CheckSquareIcon}
              metrics={[
                { label: "Total Tests", icon: CheckSquareIcon, value: tests.total },
                { label: "Active Tests", icon: CheckSquareIcon, value: tests.active },
                { label: "Inactive Tests", icon: XSquareIcon, value: tests.inactive, tone: "khaki" },
                { label: "Total Attempts", icon: TargetIcon, value: tests.attempts },
                { label: "Completed Attempts", icon: PlayCircleIcon, value: tests.completed_attempts },
              ]}
            />

            {/* ================= PHYSICAL + AI ================= */}
            <div className="grid gap-8 lg:grid-cols-2">
              <MetricSection
                title="शारीरिक प्रशिक्षण"
                columns={1}
                icon={ActivityIcon}
                metrics={[
                  {
                    label: "Training Records",
                    icon: ActivityIcon,
                    value: physical.training_records,
                  },
                ]}
              />
              <MetricSection
                title="AI Assistant"
                columns={2}
                icon={BotIcon}
                metrics={[
                  {
                    label: "Chat Sessions",
                    icon: BotIcon,
                    value: ai.chat_sessions,
                  },
                  {
                    label: "Chat Messages",
                    icon: MessageIcon,
                    value: ai.chat_messages,
                  },
                ]}
              />
            </div>

            {/* ================= RECENT STUDENTS ================= */}
            <DataTable
              title="अलीकडे नोंदणी केलेले विद्यार्थी"
              rows={recentStudents}
              emptyMessage="अजून कोणतेही विद्यार्थी उपलब्ध नाहीत."
              icon={UsersIcon}
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
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        active
                          ? "bg-green-50 text-green-700 ring-1 ring-green-200"
                          : "bg-pb-khaki/15 text-pb-khaki ring-1 ring-pb-khaki/30"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          active ? "bg-green-500" : "bg-pb-khaki"
                        }`}
                      />
                      {active ? "Active" : "Inactive"}
                    </span>
                  ),
                },
              ]}
            />

            {/* ================= RECENT ATTEMPTS ================= */}
            <DataTable
              title="अलीकडील चाचणी प्रयत्न"
              rows={recentAttempts}
              emptyMessage="अद्याप कोणतेही चाचणी प्रयत्न उपलब्ध नाहीत."
              icon={TargetIcon}
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
    </div>
  );
}

export default AdminDashboard;