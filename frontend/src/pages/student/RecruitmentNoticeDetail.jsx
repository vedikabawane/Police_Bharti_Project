import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  getStudentRecruitmentNotice,
  getStudentRecruitmentNoticePdf,
} from "../../services/recruitmentNoticeService";

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

const NewspaperIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M4 5h13a2 2 0 0 1 2 2v11a2 2 0 0 0 2 2H6a2 2 0 0 1-2-2Z" />
    <path d="M8 9h8M8 13h8M8 17h5" />
  </svg>
);
const CalendarIcon = (p) => (
  <svg {...iconProps} {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M8 3v4M16 3v4M3 10h18" />
  </svg>
);
const TagIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M3 12V5a2 2 0 0 1 2-2h7l9 9-9 9-9-9Z" />
    <circle cx="8" cy="8" r="1.5" />
  </svg>
);
const BriefcaseIcon = (p) => (
  <svg {...iconProps} {...p}>
    <rect x="3" y="7" width="18" height="13" rx="2" />
    <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
    <path d="M3 12h18" />
  </svg>
);
const UsersIcon = (p) => (
  <svg {...iconProps} {...p}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3 20a6 6 0 0 1 12 0" />
    <path d="M16 5.2a3.2 3.2 0 0 1 0 5.6M18 20a5.6 5.6 0 0 0-2-4.3" />
  </svg>
);
const BuildingIcon = (p) => (
  <svg {...iconProps} {...p}>
    <rect x="4" y="3" width="16" height="18" rx="1.5" />
    <path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2" />
    <path d="M10 21v-4h4v4" />
  </svg>
);
const ClockIcon = (p) => (
  <svg {...iconProps} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);
const FileIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M6 3h9l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
    <path d="M14 3v6h6M8 13h8M8 17h5" />
  </svg>
);
const DownloadIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M12 4v11M6 11l6 6 6-6" />
    <path d="M4 20h16" />
  </svg>
);
const EyeIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const ExternalLinkIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M14 4h6v6" />
    <path d="M20 4 10 14" />
    <path d="M20 14v6H4V4h6" />
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
const QuoteIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M7 15h2a4 4 0 0 0 0-8H6a2 2 0 0 0-2 2v6a4 4 0 0 0 3 3.9" />
    <path d="M17 15h2a4 4 0 0 0 0-8h-3a2 2 0 0 0-2 2v6a4 4 0 0 0 3 3.9" />
  </svg>
);
const InfoIcon = (p) => (
  <svg {...iconProps} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" />
  </svg>
);
const GlobeIcon = (p) => (
  <svg {...iconProps} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.5 3 2.5 15 0 18M12 3c-2.5 3-2.5 15 0 18" />
  </svg>
);
const AlertIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M10.3 3.9 2.4 17a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9v4M12 17h.01" />
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
const CloseIcon = (p) => (
  <svg {...iconProps} strokeWidth="2" {...p}>
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
);

function formatDate(value) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Date(year, month - 1, day).toLocaleDateString("mr-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function safeOfficialUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password
    )
      return null;
    return url.href;
  } catch {
    return null;
  }
}

function display(value) {
  return value === null || value === undefined || value === ""
    ? "माहिती उपलब्ध नाही"
    : value;
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
      @keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes dialogIn {
        from { opacity: 0; transform: translateY(10px) scale(0.98); }
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

/* ---------- DETAIL TILE ---------- */
function DetailTile({ label, value, icon: Icon, wide = false }) {
  const missing =
    value === "माहिती उपलब्ध नाही" || value === null || value === undefined;
  return (
    <div
      className={`min-w-0 rounded-xl border border-pb-border-soft bg-white/70 p-3.5 transition-colors duration-200 hover:bg-white ${wide ? "sm:col-span-2 lg:col-span-3" : ""
        }`}
    >
      <dt className="flex items-center gap-2 text-[10px] font-bold tracking-wide text-slate-500 uppercase sm:text-[11px]">
        {Icon && (
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-pb-green/10 text-pb-green">
            <Icon className="h-3 w-3" />
          </span>
        )}
        {label}
      </dt>
      <dd
        className={`mt-1.5 text-sm font-extrabold break-words ${missing ? "text-slate-400" : "text-pb-green"
          }`}
      >
        {value}
      </dd>
    </div>
  );
}

function RecruitmentNoticeDetail() {
  const { id } = useParams();
  const [result, setResult] = useState({ id: null, notice: null, error: "" });
  const [pdfUrl, setPdfUrl] = useState("");
  const [pdfBusy, setPdfBusy] = useState("");
  const [pdfError, setPdfError] = useState("");

  useEffect(() => {
    let active = true;
    getStudentRecruitmentNotice(id)
      .then((response) => {
        if (!response?.success || !response.data)
          throw new Error(response?.message || "भरती सूचना उपलब्ध नाही.");
        if (active) setResult({ id, notice: response.data, error: "" });
      })
      .catch((error) => {
        if (active)
          setResult({
            id,
            notice: null,
            error:
              error.response?.data?.message ||
              error.message ||
              "भरती सूचना उपलब्ध नाही.",
          });
      });
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(
    () => () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    },
    [pdfUrl],
  );

  const loading = result.id !== id;
  const notice = loading ? null : result.notice;
  const error = loading ? "" : result.error;

  const fetchPdf = async (download) => {
    setPdfBusy(download ? "download" : "view");
    setPdfError("");
    try {
      const response = await getStudentRecruitmentNoticePdf(id, download);
      const blobUrl = URL.createObjectURL(response.data);
      if (download) {
        const anchor = document.createElement("a");
        anchor.href = blobUrl;
        anchor.download =
          notice.pdf_original_filename || "recruitment-notice.pdf";
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      } else {
        setPdfUrl(blobUrl);
      }
    } catch (requestError) {
      setPdfError(
        requestError.response?.status === 404
          ? "ही सूचना किंवा PDF आता उपलब्ध नाही."
          : "PDF उघडता आली नाही. पुन्हा प्रयत्न करा.",
      );
    } finally {
      setPdfBusy("");
    }
  };

  /* ================= LOADING ================= */
  if (loading) {
    return (
      <div className="relative min-h-screen overflow-x-hidden bg-pb-light">
        <AnimationStyles />
        <AnimatedBackground />
        <div className="relative z-10 mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <div
            role="status"
            className="animate-fade-up flex flex-col items-center justify-center gap-3 rounded-2xl border border-pb-border bg-white/85 px-5 py-12 text-center backdrop-blur-sm"
          >
            <SpinnerIcon className="animate-spin-soft h-10 w-10 text-pb-khaki" />
            <p className="text-sm font-semibold text-pb-green">
              सूचना लोड होत आहे…
            </p>
            <p className="text-xs text-slate-500">Fetching recruitment notice.</p>
          </div>
        </div>
      </div>
    );
  }

  /* ================= ERROR ================= */
  if (error || !notice) {
    return (
      <div className="relative min-h-screen overflow-x-hidden bg-pb-light">
        <AnimationStyles />
        <AnimatedBackground />
        <div className="relative z-10 mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          <div
            role="alert"
            className="animate-fade-up overflow-hidden rounded-2xl border border-pb-border bg-white/90 shadow-sm backdrop-blur-sm"
          >
            <span
              aria-hidden="true"
              className="block h-1 w-full bg-gradient-to-r from-pb-khaki via-[#e1d37f] to-pb-khaki"
            />
            <div className="flex flex-col items-center gap-4 p-7 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-pb-light text-pb-khaki">
                <InboxIcon className="h-6 w-6" />
              </span>
              <p className="max-w-md text-sm font-bold text-pb-green">
                {error || "भरती सूचना उपलब्ध नाही."}
              </p>
              <Link
                to="/student/recruitment-notices"
                className="group inline-flex min-h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-pb-green to-[#0f3d2e] px-5 py-2.5 text-sm font-extrabold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:from-pb-khaki hover:to-[#c9b95f] hover:shadow-lg active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <ArrowLeftIcon className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
                सर्व भरती सूचना
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const sourceUrl = safeOfficialUrl(notice.official_source_url);
  const details = [
    ["भरती वर्ष", notice.recruitment_year, CalendarIcon],
    ["विभाग", notice.department, BuildingIcon],
    ["पद", notice.post_name, BriefcaseIcon],
    ["एकूण जागा", notice.vacancies, UsersIcon],
    ["अर्ज सुरू", formatDate(notice.application_start_date), ClockIcon],
    [
      "अर्जाची अंतिम तारीख",
      formatDate(notice.application_end_date),
      ClockIcon,
    ],
    ["परीक्षा तारीख", formatDate(notice.exam_date), CalendarIcon],
  ];

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-pb-light">
      <AnimationStyles />
      <AnimatedBackground />

      <div className="relative z-10">
        <article className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">

          {/* ================= BREADCRUMB ================= */}
          <nav
            aria-label="Breadcrumb"
            className="animate-fade-up flex flex-wrap items-center gap-1.5 text-[11px] font-bold text-pb-khaki sm:text-xs"
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
              to="/student/recruitment-notices"
              className="rounded-md px-1.5 py-0.5 transition-all duration-200 hover:bg-pb-light hover:text-pb-green focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none"
            >
              भरती सूचना
            </Link>
            <ChevronRightIcon className="h-3 w-3 text-slate-400" />
            <span className="min-w-0 truncate text-slate-500">तपशील</span>
          </nav>

          {/* ================= HERO CARD ================= */}
          <div className="animate-fade-up mt-4 overflow-hidden rounded-2xl border border-pb-border/50 bg-white/85 shadow-sm backdrop-blur-sm">
            <span
              aria-hidden="true"
              className="animate-gradient pointer-events-none block h-1 w-full bg-gradient-to-r from-pb-green via-pb-khaki to-pb-green"
            />

            <div className="p-5 sm:p-7">
              {/* Meta pills */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-pb-khaki/30 bg-pb-khaki/10 px-2.5 py-1 text-[10px] font-extrabold tracking-wide text-pb-khaki uppercase sm:text-xs">
                  <TagIcon className="h-3 w-3" />
                  {notice.notice_type.replaceAll("_", " ")}
                </span>
                <time
                  dateTime={notice.published_date}
                  className="inline-flex items-center gap-1.5 rounded-full border border-pb-border-soft bg-pb-light px-2.5 py-1 text-[10px] font-bold text-slate-600 sm:text-xs"
                >
                  <CalendarIcon className="h-3 w-3" />
                  प्रकाशित: {formatDate(notice.published_date)}
                </time>
              </div>

              {/* Title */}
              <h1 className="mt-3 text-xl leading-snug font-extrabold tracking-tight break-words text-pb-green sm:text-2xl lg:text-3xl">
                {notice.title}
              </h1>

              {/* Summary */}
              {notice.summary && (
                <div className="relative mt-5 overflow-hidden rounded-2xl border border-pb-khaki/20 bg-pb-khaki/5 px-4 py-4 pl-5 sm:px-5 sm:py-5 sm:pl-6">
                  <span
                    aria-hidden="true"
                    className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-pb-khaki via-[#e1d37f] to-pb-khaki"
                  />
                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pb-khaki/15 text-pb-khaki">
                      <QuoteIcon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold tracking-[0.14em] text-pb-khaki uppercase">
                        सारांश
                      </p>
                      <p className="mt-1 text-sm leading-7 font-semibold break-words text-slate-700 sm:text-base">
                        {notice.summary}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Details grid */}
              <div className="mt-6">
                <div className="mb-3 flex items-center gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pb-green/10 text-pb-green">
                    <InfoIcon className="h-4 w-4" />
                  </span>
                  <span className="text-[10px] font-bold tracking-[0.14em] text-slate-500 uppercase">
                    भरती तपशील
                  </span>
                  <span className="h-px flex-1 bg-gradient-to-r from-pb-border to-transparent" />
                </div>
                <dl className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {details.map(([label, value, Icon]) => (
                    <DetailTile
                      key={label}
                      label={label}
                      value={display(value)}
                      icon={Icon}
                    />
                  ))}
                </dl>
              </div>
            </div>
          </div>

          {/* ================= CONTENT ================= */}
          <section className="animate-fade-up mt-5 overflow-hidden rounded-2xl border border-pb-border bg-white/90 shadow-sm backdrop-blur-sm">
            <span
              aria-hidden="true"
              className="block h-1 w-full bg-gradient-to-r from-pb-green via-pb-khaki to-pb-green"
            />
            <div className="p-5 sm:p-7">
              <div className="mb-4 flex items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pb-green/10 text-pb-green">
                  <NewspaperIcon className="h-4 w-4" />
                </span>
                <h2 className="text-base leading-tight font-extrabold tracking-tight text-pb-green sm:text-lg">
                  सूचना तपशील
                </h2>
                <span className="h-px flex-1 bg-gradient-to-r from-pb-border to-transparent" />
              </div>

              {notice.content ? (
                <p className="text-[15px] leading-8 break-words whitespace-pre-wrap text-slate-700">
                  {notice.content}
                </p>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2.5 rounded-xl border border-dashed border-[#d8d1bf] bg-pb-light/60 px-4 py-8 text-center">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-pb-khaki shadow-sm">
                    <InboxIcon className="h-5 w-5" />
                  </span>
                  <p className="text-sm font-semibold text-slate-600">
                    माहिती उपलब्ध नाही
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* ================= SOURCE ================= */}
          <section className="animate-fade-up mt-5 overflow-hidden rounded-2xl border border-pb-border bg-white/90 shadow-sm backdrop-blur-sm">
            <span
              aria-hidden="true"
              className="block h-1 w-full bg-gradient-to-r from-pb-khaki via-[#e1d37f] to-pb-khaki"
            />
            <div className="p-5 sm:p-7">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pb-khaki/15 text-pb-khaki">
                  <GlobeIcon className="h-4 w-4" />
                </span>
                <h2 className="text-base leading-tight font-extrabold tracking-tight text-pb-green sm:text-lg">
                  अधिकृत स्रोत
                </h2>
                <span className="h-px flex-1 bg-gradient-to-r from-pb-border to-transparent" />
              </div>

              <div className="mt-4 space-y-3">
                {notice.official_source_name ? (
                  <p className="flex items-start gap-2.5 text-sm font-semibold break-words text-slate-700">
                    <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-pb-khaki" />
                    <span className="min-w-0">{notice.official_source_name}</span>
                  </p>
                ) : (
                  <p className="text-sm text-slate-500">
                    माहिती उपलब्ध नाही
                  </p>
                )}

                {sourceUrl ? (
                  <a
                    href={sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex min-h-11 items-center gap-2 rounded-xl border border-pb-border bg-white px-4 py-2.5 text-sm font-bold text-pb-green transition-all duration-200 hover:-translate-y-0.5 hover:border-pb-khaki hover:bg-pb-light hover:shadow-sm active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none"
                  >
                    <ExternalLinkIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    अधिकृत स्रोत उघडा
                  </a>
                ) : (
                  <p className="text-sm text-slate-500">माहिती उपलब्ध नाही</p>
                )}
              </div>
            </div>
          </section>

          {/* ================= PDF SECTION ================= */}
          {notice.pdf_available && (
            <section className="animate-fade-up mt-5 overflow-hidden rounded-2xl border border-pb-border bg-white/90 shadow-sm backdrop-blur-sm">
              <span
                aria-hidden="true"
                className="block h-1 w-full bg-gradient-to-r from-red-500 via-pb-khaki to-red-500"
              />
              <div className="p-5 sm:p-7">
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 shadow-sm">
                    <FileIcon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold tracking-[0.14em] text-slate-500 uppercase">
                      अधिकृत PDF
                    </p>
                    <p className="mt-1 text-sm font-bold break-all text-pb-green sm:text-base">
                      {notice.pdf_original_filename || "Recruitment notice PDF"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
                  <button
                    type="button"
                    disabled={Boolean(pdfBusy)}
                    onClick={() => fetchPdf(false)}
                    className="group inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pb-green to-[#0f3d2e] px-5 py-2.5 text-sm font-extrabold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:from-pb-khaki hover:to-[#c9b95f] hover:shadow-lg active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-wait disabled:opacity-60 disabled:hover:translate-y-0"
                  >
                    {pdfBusy === "view" ? (
                      <>
                        <SpinnerIcon className="animate-spin-soft h-4 w-4" />
                        PDF उघडत आहे…
                      </>
                    ) : (
                      <>
                        <EyeIcon className="h-4 w-4" />
                        PDF पहा
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={Boolean(pdfBusy)}
                    onClick={() => fetchPdf(true)}
                    className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-pb-khaki bg-white px-5 py-2.5 text-sm font-extrabold text-pb-green transition-all duration-200 hover:-translate-y-0.5 hover:bg-pb-light hover:shadow-sm active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none disabled:cursor-wait disabled:opacity-60 disabled:hover:translate-y-0"
                  >
                    {pdfBusy === "download" ? (
                      <>
                        <SpinnerIcon className="animate-spin-soft h-4 w-4" />
                        डाउनलोड होत आहे…
                      </>
                    ) : (
                      <>
                        <DownloadIcon className="h-4 w-4" />
                        PDF डाउनलोड करा
                      </>
                    )}
                  </button>
                </div>

                {pdfError && (
                  <div
                    role="alert"
                    className="animate-fade-up mt-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
                  >
                    <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
                    <span className="min-w-0 break-words">{pdfError}</span>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ================= BOTTOM ACTIONS ================= */}
          <nav className="animate-fade-up mt-6 flex flex-col gap-2.5 sm:flex-row">
            <Link
              to="/student/recruitment-notices"
              className="group inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pb-green to-[#0f3d2e] px-5 py-3 text-sm font-extrabold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:from-pb-khaki hover:to-[#c9b95f] hover:shadow-lg active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <ArrowLeftIcon className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
              सर्व भरती सूचना
            </Link>
          </nav>
        </article>
      </div>

      {/* ================= PDF VIEWER MODAL ================= */}
      {pdfUrl && (
        <div
          className="animate-overlay-in fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-2 backdrop-blur-sm sm:p-5"
          role="presentation"
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="recruitment-pdf-title"
            className="animate-dialog-in relative flex h-[96dvh] max-h-[96dvh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-pb-border bg-white shadow-2xl sm:h-[92vh] sm:max-h-[92vh]"
          >
            <span
              aria-hidden="true"
              className="absolute inset-x-0 top-0 z-10 h-1 bg-gradient-to-r from-pb-green via-pb-khaki to-pb-green"
            />

            <header className="flex shrink-0 items-start justify-between gap-3 border-b border-pb-border bg-pb-light/40 px-4 pt-4 pb-3 sm:items-center sm:px-6 sm:pt-5 sm:pb-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-pb-green to-[#0f3d2e] text-white shadow-sm sm:flex">
                  <FileIcon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold tracking-[0.14em] text-pb-khaki uppercase">
                    अधिकृत PDF
                  </p>
                  <h2
                    id="recruitment-pdf-title"
                    className="mt-0.5 text-sm leading-snug font-extrabold break-words text-pb-green sm:text-base"
                  >
                    {notice.title}
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPdfUrl("")}
                aria-label="PDF viewer बंद करा"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-pb-border bg-white text-pb-green transition-all duration-200 hover:border-pb-khaki hover:bg-pb-light focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none active:scale-95"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </header>

            <iframe
              title={notice.title}
              src={pdfUrl}
              className="h-full w-full flex-1 border-0 bg-pb-light"
            />
          </section>
        </div>
      )}
    </div>
  );
}

export default RecruitmentNoticeDetail;