import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  getStudent,
  getStudentPerformance,
  updateStudentStatus,
} from "../../services/admin/adminStudentService";
import AdminStudentPerformance from "../../components/admin/AdminStudentPerformance";
import api from "../../services/api";

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

const ArrowLeftIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M19 12H5" />
    <path d="m11 18-6-6 6-6" />
  </svg>
);
const UsersIcon = (p) => (
  <svg {...iconProps} {...p}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3 20a6 6 0 0 1 12 0" />
    <path d="M16 5.2a3.2 3.2 0 0 1 0 5.6M18 20a5.6 5.6 0 0 0-2-4.3" />
  </svg>
);
const UserIcon = (p) => (
  <svg {...iconProps} {...p}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 20a7 7 0 0 1 14 0" />
  </svg>
);
const MailIcon = (p) => (
  <svg {...iconProps} {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m4 7 8 6 8-6" />
  </svg>
);
const PhoneIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M4 6a2 2 0 0 1 2-2h2l2 5-2 1a12 12 0 0 0 6 6l1-2 5 2v2a2 2 0 0 1-2 2A16 16 0 0 1 4 6Z" />
  </svg>
);
const PowerIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M12 4v8" />
    <path d="M7.5 7a7 7 0 1 0 9 0" />
  </svg>
);
const CheckCircleIcon = (p) => (
  <svg {...iconProps} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m8.5 12 2.5 2.5L16 9.5" />
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
const InfoIcon = (p) => (
  <svg {...iconProps} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" />
  </svg>
);
const IdCardIcon = (p) => (
  <svg {...iconProps} {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <circle cx="9" cy="12" r="2.2" />
    <path d="M14 10h5M14 14h4" />
  </svg>
);
const CalendarIcon = (p) => (
  <svg {...iconProps} {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M8 3v4M16 3v4M3 10h18" />
  </svg>
);
const ShieldIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M12 3 5 6v5c0 4.6 2.8 8.1 7 10 4.2-1.9 7-5.4 7-10V6l-7-3Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);
const MapPinIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);
const TargetIcon = (p) => (
  <svg {...iconProps} {...p}>
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="12" cy="12" r="1" />
  </svg>
);
const BookIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 0-2 2Z" />
    <path d="M18 3v18" />
  </svg>
);
const ActivityIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M3 12h3l2-6 4 12 3-9 2 3h4" />
    <path d="M3 20h18" />
  </svg>
);
const CloseIcon = (p) => (
  <svg {...iconProps} strokeWidth="2" {...p}>
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
);

const formatValue = (value) =>
  value === null || value === undefined || value === ""
    ? "माहिती उपलब्ध नाही"
    : value;

const formatDate = (value) => {
  if (!value) return "माहिती उपलब्ध नाही";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "माहिती उपलब्ध नाही"
    : date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
};

const getProfilePhotoUrl = (photoPath) => {
  if (!photoPath) return "";
  try {
    return new URL(photoPath, new URL(api.defaults.baseURL).origin).toString();
  } catch {
    return "";
  }
};

/* ================= ANIMATION STYLES ================= */
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
      @keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes dialogIn {
        from { opacity: 0; transform: translateY(10px) scale(0.96); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      .animate-blob { animation: blobMove 22s ease-in-out infinite; }
      .delay-2 { animation-delay: 4s; }
      .delay-4 { animation-delay: 8s; }
      .animate-fade-up { animation: fadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }
      .animate-gradient { background-size: 220% 220%; animation: gradientPan 9s ease infinite; }
      .animate-soft-glow { animation: softGlow 4.5s ease-in-out infinite; }
      .animate-spin-soft { animation: spinSoft 0.9s linear infinite; }
      .animate-overlay-in { animation: overlayIn 0.2s ease-out both; }
      .animate-dialog-in { animation: dialogIn 0.28s cubic-bezier(0.22, 1, 0.36, 1) both; }
      @media (prefers-reduced-motion: reduce) {
        .animate-blob, .animate-fade-up, .animate-gradient,
        .animate-soft-glow, .animate-spin-soft,
        .animate-overlay-in, .animate-dialog-in { animation: none !important; }
      }
    `}</style>
  );
}

/* ================= ANIMATED BACKGROUND ================= */
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

/* ================= FIELD ROW ================= */
function FieldRow({ label, value, icon: Icon }) {
  return (
    <div className="min-w-0 rounded-xl border border-pb-border-soft bg-white/60 p-3.5 transition-colors duration-200 hover:bg-white">
      <dt className="flex items-center gap-2 text-[10px] font-bold tracking-wide text-slate-500 uppercase">
        {Icon && (
          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-pb-green/10 text-pb-green">
            <Icon className="h-3 w-3" />
          </span>
        )}
        {label}
      </dt>
      <dd className="mt-1.5 text-sm font-semibold break-words text-pb-green">
        {formatValue(value)}
      </dd>
    </div>
  );
}

/* ================= INFORMATION CARD ================= */
function InformationCard({ title, icon: SectionIcon, fields }) {
  return (
    <section className="relative min-w-0 overflow-hidden rounded-2xl border border-pb-border bg-white/90 shadow-sm backdrop-blur-sm">
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-pb-green via-pb-khaki to-pb-green opacity-70"
      />
      <div className="p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2.5">
          {SectionIcon && (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pb-green/10 text-pb-green">
              <SectionIcon className="h-4 w-4" />
            </span>
          )}
          <h2 className="text-base leading-tight font-extrabold tracking-tight text-pb-green sm:text-lg">
            {title}
          </h2>
        </div>
        <dl className="grid gap-3 sm:grid-cols-2">
          {fields.map(([label, value, FieldIcon]) => (
            <FieldRow key={label} label={label} value={value} icon={FieldIcon} />
          ))}
        </dl>
      </div>
    </section>
  );
}

function AdminStudentDetail() {
  const { studentId } = useParams();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [reload, setReload] = useState(0);
  const [confirmStatus, setConfirmStatus] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusError, setStatusError] = useState("");
  const [performance, setPerformance] = useState(null);
  const [performanceLoading, setPerformanceLoading] = useState(true);
  const [performanceError, setPerformanceError] = useState("");
  const [performanceReload, setPerformanceReload] = useState(0);

  const confirmStatusChange = async () => {
    if (typeof confirmStatus !== "boolean" || updatingStatus) return;
    setUpdatingStatus(true);
    setStatusError("");
    setStatusMessage("");
    try {
      const response = await updateStudentStatus(studentId, confirmStatus);
      if (!response?.success || !response?.data?.student) {
        throw new Error("Status update response is incomplete.");
      }
      setStudent(response.data.student);
      setStatusMessage(
        `Student ${confirmStatus ? "activated" : "deactivated"} successfully.`,
      );
      setConfirmStatus(null);
    } catch {
      setStatusError("Unable to update student status. Please try again.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  useEffect(() => {
    let isCurrent = true;

    const loadStudent = async () => {
      setLoading(true);
      setStudent(null);
      setError("");
      setNotFound(false);

      try {
        const response = await getStudent(studentId);
        if (!response?.success || !response?.data?.student) {
          throw new Error("Student response is incomplete.");
        }
        if (isCurrent) setStudent(response.data.student);
      } catch (requestError) {
        if (isCurrent) {
          if (requestError.response?.status === 404) {
            setNotFound(true);
          } else {
            setError("विद्यार्थ्याची माहिती लोड करता आली नाही.");
          }
        }
      } finally {
        if (isCurrent) setLoading(false);
      }
    };

    loadStudent();
    return () => {
      isCurrent = false;
    };
  }, [studentId, reload]);

  useEffect(() => {
    if (!student?.id) return undefined;

    let isCurrent = true;
    const loadPerformance = async () => {
      setPerformanceLoading(true);
      setPerformanceError("");
      setPerformance(null);
      try {
        const response = await getStudentPerformance(studentId);
        if (!response?.success || !response?.data) {
          throw new Error("Student performance response is incomplete.");
        }
        if (isCurrent) setPerformance(response.data);
      } catch {
        if (isCurrent) {
          setPerformanceError(
            "Unable to load this student's performance. Please try again.",
          );
        }
      } finally {
        if (isCurrent) setPerformanceLoading(false);
      }
    };

    loadPerformance();
    return () => {
      isCurrent = false;
    };
  }, [student?.id, studentId, performanceReload]);

  const pageLink = (
    <Link
      to="/admin/students"
      className="group inline-flex min-h-11 items-center gap-2 rounded-xl border border-pb-border bg-white/85 px-4 py-2.5 text-sm font-bold text-pb-green shadow-sm backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-pb-khaki hover:bg-pb-light hover:shadow-md active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none"
    >
      <ArrowLeftIcon className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
      विद्यार्थ्यांच्या यादीकडे परत जा
    </Link>
  );

  /* ================= LOADING ================= */
  if (loading) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-pb-light">
        <AnimationStyles />
        <AnimatedBackground />
        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="animate-fade-up mb-6">{pageLink}</div>
          <div
            role="status"
            className="animate-fade-up flex flex-col items-center justify-center gap-3 rounded-2xl border border-pb-border bg-white/85 px-5 py-14 text-center backdrop-blur-sm"
          >
            <SpinnerIcon className="animate-spin-soft h-10 w-10 text-pb-khaki" />
            <p className="text-sm font-semibold text-pb-green">
              विद्यार्थ्याची माहिती लोड होत आहे...
            </p>
            <p className="text-xs text-slate-500">
              Fetching student profile and performance.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ================= NOT FOUND ================= */
  if (notFound) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-pb-light">
        <AnimationStyles />
        <AnimatedBackground />
        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="animate-fade-up mb-6">{pageLink}</div>
          <div
            role="alert"
            className="animate-fade-up flex flex-col items-center justify-center gap-3 rounded-2xl border border-pb-border bg-white/85 px-5 py-14 text-center backdrop-blur-sm"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-pb-light text-pb-khaki">
              <InfoIcon className="h-6 w-6" />
            </span>
            <p className="text-lg font-extrabold text-pb-green">
              विद्यार्थी सापडला नाही.
            </p>
            <p className="max-w-md text-sm text-slate-600">
              दिलेल्या माहितीसाठी विद्यार्थी नोंद उपलब्ध नाही.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ================= ERROR ================= */
  if (error) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-pb-light">
        <AnimationStyles />
        <AnimatedBackground />
        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="animate-fade-up mb-6">{pageLink}</div>
          <div
            role="alert"
            className="animate-fade-up overflow-hidden rounded-2xl border border-red-200 bg-white/90 backdrop-blur-sm"
          >
            <span
              aria-hidden="true"
              className="block h-1 w-full bg-gradient-to-r from-red-500 via-red-600 to-red-500"
            />
            <div className="flex flex-col items-center gap-4 p-6 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                <AlertIcon className="h-6 w-6" />
              </span>
              <p className="text-sm font-semibold text-red-700">{error}</p>
              <button
                type="button"
                onClick={() => setReload((current) => current + 1)}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-pb-green to-[#0f3d2e] px-5 py-2.5 text-sm font-extrabold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:from-pb-khaki hover:to-[#c9b95f] hover:shadow-lg active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <RefreshIcon className="h-4 w-4" />
                पुन्हा प्रयत्न करा / Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const profile = student.profile;
  const name = student.name || "Student";
  const photoUrl = getProfilePhotoUrl(profile?.profile_photo);
  const initial = name.trim().charAt(0).toUpperCase() || "S";

  return (
    <div className="relative min-h-screen overflow-hidden bg-pb-light">
      <AnimationStyles />
      <AnimatedBackground />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">

        {/* ================= PAGE HEADER ================= */}
        <div className="animate-fade-up mb-6 overflow-hidden rounded-2xl border border-pb-border/50 bg-white/85 shadow-sm backdrop-blur-sm">
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
                <UsersIcon className="relative h-6 w-6" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold tracking-[0.16em] text-pb-khaki uppercase sm:text-xs">
                  विद्यार्थी माहिती
                </p>
                <h1 className="mt-1 text-xl leading-tight font-extrabold tracking-tight text-pb-green sm:text-2xl lg:text-3xl">
                  Student Details
                </h1>
              </div>
            </div>
            {pageLink}
          </div>
        </div>

        {/* ================= HERO CARD ================= */}
        <section className="animate-fade-up relative overflow-hidden rounded-2xl border border-pb-border bg-white/90 shadow-sm backdrop-blur-sm">
          <span
            aria-hidden="true"
            className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-pb-green via-pb-khaki to-pb-green"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-pb-khaki/10 blur-3xl"
          />

          <div className="flex flex-col gap-5 p-5 pl-6 sm:flex-row sm:items-center sm:p-6 sm:pl-7">
            {/* Avatar */}
            {photoUrl ? (
              <div className="relative shrink-0">
                <img
                  src={photoUrl}
                  alt=""
                  className="h-24 w-24 rounded-2xl border-4 border-white object-cover shadow-md ring-2 ring-pb-khaki/30 sm:h-28 sm:w-28"
                />
                <span
                  aria-hidden="true"
                  className={`absolute -right-1 -bottom-1 h-5 w-5 rounded-full border-4 border-white ${
                    student.is_active ? "bg-green-500" : "bg-slate-400"
                  }`}
                />
              </div>
            ) : (
              <div className="relative shrink-0">
                <span className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-pb-green to-[#0f3d2e] text-3xl font-extrabold text-white shadow-md sm:h-28 sm:w-28 sm:text-4xl">
                  {initial}
                </span>
                <span
                  aria-hidden="true"
                  className={`absolute -right-1 -bottom-1 h-5 w-5 rounded-full border-4 border-white ${
                    student.is_active ? "bg-green-500" : "bg-slate-400"
                  }`}
                />
              </div>
            )}

            {/* Info */}
            <div className="min-w-0 flex-1">
              <h2 className="text-xl leading-tight font-extrabold break-words text-pb-green sm:text-2xl">
                {name}
              </h2>

              <div className="mt-3 space-y-1.5">
                <p className="flex items-center gap-2 text-sm text-slate-600">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-pb-green/10 text-pb-green">
                    <MailIcon className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0 break-all">
                    {formatValue(student.email)}
                  </span>
                </p>
                <p className="flex items-center gap-2 text-sm text-slate-600">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-pb-green/10 text-pb-green">
                    <PhoneIcon className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0 break-words">
                    {formatValue(student.mobile)}
                  </span>
                </p>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-extrabold ${
                    student.is_active
                      ? "bg-green-50 text-green-700 ring-1 ring-green-200"
                      : "bg-pb-khaki/15 text-pb-khaki ring-1 ring-pb-khaki/30"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      student.is_active ? "bg-green-500" : "bg-pb-khaki"
                    }`}
                  />
                  {student.is_active ? "Active" : "Inactive"}
                </span>

                <button
                  type="button"
                  disabled={updatingStatus}
                  onClick={() => {
                    setStatusError("");
                    setStatusMessage("");
                    setConfirmStatus(!student.is_active);
                  }}
                  className={`group inline-flex min-h-11 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-extrabold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-wait disabled:opacity-60 disabled:hover:translate-y-0 ${
                    student.is_active
                      ? "bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700"
                      : "bg-gradient-to-r from-pb-green to-[#0f3d2e] hover:from-pb-khaki hover:to-[#c9b95f]"
                  }`}
                >
                  {updatingStatus ? (
                    <SpinnerIcon className="animate-spin-soft h-4 w-4" />
                  ) : (
                    <PowerIcon className="h-4 w-4" />
                  )}
                  {updatingStatus
                    ? "Updating…"
                    : student.is_active
                      ? "Deactivate Student"
                      : "Activate Student"}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ================= STATUS MESSAGES ================= */}
        {statusMessage && (
          <div
            role="status"
            className="animate-fade-up mt-4 flex items-start gap-2.5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800"
          >
            <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="min-w-0 break-words">{statusMessage}</span>
          </div>
        )}
        {statusError && (
          <div
            role="alert"
            className="animate-fade-up mt-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
          >
            <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="min-w-0 break-words">{statusError}</span>
          </div>
        )}

        {/* ================= CONFIRM DIALOG ================= */}
        {confirmStatus !== null && (
          <div
            className="animate-overlay-in fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
            role="presentation"
          >
            <section
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="student-status-confirm-title"
              className="animate-dialog-in relative w-full max-w-md overflow-hidden rounded-2xl border border-pb-border bg-white shadow-2xl"
            >
              <span
                aria-hidden="true"
                className={`absolute inset-x-0 top-0 h-1 ${
                  confirmStatus
                    ? "bg-gradient-to-r from-pb-green via-pb-khaki to-pb-green"
                    : "bg-gradient-to-r from-red-500 via-red-600 to-red-500"
                }`}
              />

              <div className="p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  <span
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-md ${
                      confirmStatus
                        ? "bg-gradient-to-br from-pb-green to-[#0f3d2e]"
                        : "bg-gradient-to-br from-red-600 to-red-700"
                    }`}
                  >
                    <PowerIcon className="h-6 w-6" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2
                      id="student-status-confirm-title"
                      className="text-lg leading-tight font-extrabold tracking-tight text-pb-green"
                    >
                      Confirm student status change
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      {confirmStatus
                        ? "Are you sure you want to activate this student?"
                        : "Are you sure you want to deactivate this student?"}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={updatingStatus}
                    onClick={() => setConfirmStatus(null)}
                    aria-label="Close confirmation"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-transparent text-pb-green transition-all duration-200 hover:border-pb-khaki hover:bg-pb-light focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none active:scale-95 disabled:opacity-50"
                  >
                    <CloseIcon className="h-5 w-5" />
                  </button>
                </div>

                {statusError && (
                  <p
                    role="alert"
                    className="mt-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-semibold text-red-700"
                  >
                    <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
                    <span className="min-w-0 break-words">{statusError}</span>
                  </p>
                )}

                <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    disabled={updatingStatus}
                    onClick={() => setConfirmStatus(null)}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-pb-border bg-white px-4 py-2.5 text-sm font-bold text-pb-green transition-all duration-200 hover:-translate-y-0.5 hover:bg-pb-light hover:shadow-sm active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none disabled:pointer-events-none disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={updatingStatus}
                    onClick={confirmStatusChange}
                    className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-extrabold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-wait disabled:opacity-60 disabled:hover:translate-y-0 ${
                      confirmStatus
                        ? "bg-gradient-to-r from-pb-green to-[#0f3d2e] hover:from-pb-khaki hover:to-[#c9b95f] focus-visible:ring-pb-khaki"
                        : "bg-gradient-to-r from-red-700 to-red-600 hover:from-red-800 hover:to-red-700 focus-visible:ring-red-400"
                    }`}
                  >
                    {updatingStatus ? (
                      <>
                        <SpinnerIcon className="animate-spin-soft h-4 w-4" />
                        Updating…
                      </>
                    ) : (
                      "Confirm"
                    )}
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ================= INFORMATION CARDS ================= */}
        <div className="mt-6 grid min-w-0 gap-6 lg:grid-cols-2">
          <InformationCard
            title="मूलभूत माहिती · Basic Information"
            icon={IdCardIcon}
            fields={[
              ["Name", student.name, UserIcon],
              ["Email", student.email, MailIcon],
              ["Mobile", student.mobile, PhoneIcon],
              [
                "Account Status",
                student.is_active ? "Active" : "Inactive",
                ShieldIcon,
              ],
              [
                "Email Verified",
                student.email_verified ? "Verified" : "Not verified",
                CheckCircleIcon,
              ],
              ["Joined Date", formatDate(student.created_at), CalendarIcon],
            ]}
          />

          <section className="relative min-w-0 overflow-hidden rounded-2xl border border-pb-border bg-white/90 shadow-sm backdrop-blur-sm">
            <span
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-pb-green via-pb-khaki to-pb-green opacity-70"
            />
            <div className="p-5 sm:p-6">
              <div className="mb-4 flex items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pb-green/10 text-pb-green">
                  <UserIcon className="h-4 w-4" />
                </span>
                <h2 className="text-base leading-tight font-extrabold tracking-tight text-pb-green sm:text-lg">
                  विद्यार्थी प्रोफाइल · Student Profile
                </h2>
              </div>

              {profile ? (
                <dl className="grid gap-3 sm:grid-cols-2">
                  {[
                    ["District", profile.district, MapPinIcon],
                    ["Target Exam", profile.target_exam, TargetIcon],
                    ["Study Goal", profile.study_goal, BookIcon],
                    ["Physical Goal", profile.physical_goal, ActivityIcon],
                    ["Education", profile.education, BookIcon],
                    ["Qualification", profile.qualification, BookIcon],
                    ["Category", profile.category, IdCardIcon],
                    ["Date of Birth", formatDate(profile.date_of_birth), CalendarIcon],
                    ["Height", profile.height, ActivityIcon],
                    ["Chest", profile.chest, ActivityIcon],
                    ["Weight", profile.weight, ActivityIcon],
                  ].map(([label, value, Icon]) => (
                    <FieldRow key={label} label={label} value={value} icon={Icon} />
                  ))}
                </dl>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2.5 rounded-xl border border-dashed border-[#d8d1bf] bg-pb-light/60 px-4 py-8 text-center">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-pb-khaki shadow-sm">
                    <InfoIcon className="h-5 w-5" />
                  </span>
                  <p className="text-sm font-semibold text-slate-600">
                    प्रोफाइल माहिती उपलब्ध नाही.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* ================= PERFORMANCE ================= */}
        <AdminStudentPerformance
          performance={performance}
          loading={performanceLoading}
          error={performanceError}
          onRetry={() => setPerformanceReload((current) => current + 1)}
        />
      </div>
    </div>
  );
}

export default AdminStudentDetail;