import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  getStudentCurrentAffair,
  getStudentCurrentAffairMedia,
} from "../../services/currentAffairService";

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
const HomeIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="m3 11 9-7 9 7v9a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2Z" />
  </svg>
);
const ChevronRightIcon = (p) => (
  <svg {...iconProps} strokeWidth="2.2" {...p}>
    <path d="m9 6 6 6-6 6" />
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
const GlobeIcon = (p) => (
  <svg {...iconProps} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.5 3 2.5 15 0 18M12 3c-2.5 3-2.5 15 0 18" />
  </svg>
);

function formatDate(value) {
  if (!value) return "";
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Date(year, month - 1, day).toLocaleDateString("mr-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function safeSourceUrl(value) {
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

function CurrentAffairDetail() {
  const { id } = useParams();
  const [result, setResult] = useState({ id: null, record: null, error: "" });
  const [media, setMedia] = useState({ id: null, url: "" });

  useEffect(() => {
    let active = true;
    getStudentCurrentAffair(id)
      .then((response) => {
        if (!response?.success || !response.data) {
          throw new Error(response?.message || "ही घडामोड उपलब्ध नाही.");
        }
        if (active) setResult({ id, record: response.data, error: "" });
      })
      .catch((requestError) => {
        if (active) {
          setResult({
            id,
            record: null,
            error:
              requestError.response?.data?.message ||
              requestError.message ||
              "ही घडामोड उपलब्ध नाही.",
          });
        }
      });
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    let active = true;
    let objectUrl = "";
    const record = result.id === id ? result.record : null;
    if (!record || !["IMAGE", "PDF"].includes(record.content_type))
      return undefined;
    getStudentCurrentAffairMedia(id)
      .then((blob) => {
        if (active) {
          objectUrl = URL.createObjectURL(blob);
          setMedia({ id, url: objectUrl });
        }
      })
      .catch(() => { });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id, result]);

  const loading = result.id !== id;
  const record = loading ? null : result.record;
  const mediaUrl = media.id === id ? media.url : "";
  const error = loading ? "" : result.error;

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
              घडामोड लोड होत आहे…
            </p>
            <p className="text-xs text-slate-500">Fetching current affair.</p>
          </div>
        </div>
      </div>
    );
  }

  /* ================= ERROR / NOT FOUND ================= */
  if (error || !record) {
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
                {error || "ही घडामोड उपलब्ध नाही."}
              </p>
              <Link
                to="/student/current-affairs"
                className="group inline-flex min-h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-pb-green to-[#0f3d2e] px-5 py-2.5 text-sm font-extrabold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:from-pb-khaki hover:to-[#c9b95f] hover:shadow-lg active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <ArrowLeftIcon className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
                सर्व घडामोडी
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const sourceUrl = safeSourceUrl(record.source_url);
  const isText = record.content_type === "TEXT" || !record.content_type;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-pb-light">
      <AnimationStyles />
      <AnimatedBackground />

      <div className="relative z-10">
        <article className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">

          {/* ================= BREADCRUMB + HEADER ================= */}
          <div className="animate-fade-up mb-6 overflow-hidden rounded-2xl border border-pb-border/50 bg-white/85 shadow-sm backdrop-blur-sm">
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
                  to="/student/current-affairs"
                  className="rounded-md px-1.5 py-0.5 transition-all duration-200 hover:bg-pb-light hover:text-pb-green focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none"
                >
                  चालू घडामोडी
                </Link>
                <ChevronRightIcon className="h-3 w-3 text-slate-400" />
                <span className="min-w-0 truncate text-slate-500">
                  तपशील
                </span>
              </nav>

              {/* Meta pills */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-pb-khaki/30 bg-pb-khaki/10 px-2.5 py-1 text-[10px] font-extrabold tracking-wide text-pb-khaki uppercase sm:text-xs">
                  <TagIcon className="h-3 w-3" />
                  {record.category}
                </span>
                <time
                  dateTime={record.published_date}
                  className="inline-flex items-center gap-1.5 rounded-full border border-pb-border-soft bg-pb-light px-2.5 py-1 text-[10px] font-bold text-slate-600 sm:text-xs"
                >
                  <CalendarIcon className="h-3 w-3" />
                  {formatDate(record.published_date)}
                </time>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-pb-border-soft bg-pb-light px-2.5 py-1 text-[10px] font-bold text-slate-600 sm:text-xs">
                  <NewspaperIcon className="h-3 w-3" />
                  {record.content_type || "TEXT"}
                </span>
              </div>

              {/* Title */}
              <h1 className="mt-3 text-xl leading-snug font-extrabold tracking-tight break-words text-pb-green sm:text-2xl lg:text-3xl">
                {record.title}
              </h1>
            </div>
          </div>

          {/* ================= SUMMARY ================= */}
          {record.summary && (
            <div className="animate-fade-up relative mb-6 overflow-hidden rounded-2xl border border-pb-khaki/20 bg-pb-khaki/5 px-4 py-4 pl-5 sm:px-6 sm:py-5 sm:pl-6">
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
                  <p className="mt-1 text-sm leading-7 font-semibold break-words text-slate-700 sm:text-base sm:leading-8">
                    {record.summary}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ================= TEXT CONTENT ================= */}
          {isText && record.content && (
            <section className="animate-fade-up overflow-hidden rounded-2xl border border-pb-border bg-white/90 shadow-sm backdrop-blur-sm">
              <span
                aria-hidden="true"
                className="block h-1 w-full bg-gradient-to-r from-pb-green via-pb-khaki to-pb-green"
              />
              <div className="p-5 sm:p-7">
                <div className="mb-4 flex items-center gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pb-green/10 text-pb-green">
                    <NewspaperIcon className="h-4 w-4" />
                  </span>
                  <span className="text-[10px] font-bold tracking-[0.14em] text-slate-500 uppercase">
                    पूर्ण मजकूर
                  </span>
                  <span className="h-px flex-1 bg-gradient-to-r from-pb-border to-transparent" />
                </div>
                <p className="text-[15px] leading-8 break-words whitespace-pre-wrap text-slate-700">
                  {record.content}
                </p>
              </div>
            </section>
          )}

          {/* ================= IMAGE CONTENT ================= */}
          {record.content_type === "IMAGE" && (
            <section className="animate-fade-up overflow-hidden rounded-2xl border border-pb-border bg-white/90 shadow-sm backdrop-blur-sm">
              <span
                aria-hidden="true"
                className="block h-1 w-full bg-gradient-to-r from-pb-green via-pb-khaki to-pb-green"
              />
              <div className="p-4 sm:p-6">
                {mediaUrl ? (
                  <img
                    src={mediaUrl}
                    alt={record.title}
                    className="max-h-[75vh] w-full rounded-xl bg-pb-light object-contain"
                  />
                ) : (
                  <div
                    role="status"
                    className="flex h-64 flex-col items-center justify-center gap-3 rounded-xl bg-pb-light/70"
                  >
                    <SpinnerIcon className="animate-spin-soft h-8 w-8 text-pb-khaki" />
                    <p className="text-xs font-semibold text-slate-500">
                      प्रतिमा लोड होत आहे...
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ================= PDF CONTENT ================= */}
          {record.content_type === "PDF" && (
            <section className="animate-fade-up overflow-hidden rounded-2xl border border-pb-border bg-white/90 shadow-sm backdrop-blur-sm">
              <span
                aria-hidden="true"
                className="block h-1 w-full bg-gradient-to-r from-pb-green via-pb-khaki to-pb-green"
              />

              {/* PDF header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-pb-border-soft bg-pb-light/40 px-5 py-3.5 sm:px-6">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
                    <FileIcon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold tracking-[0.14em] text-slate-500 uppercase">
                      PDF दस्तऐवज
                    </p>
                    <p className="mt-0.5 text-xs font-semibold break-all text-slate-700 sm:text-sm">
                      {record.original_filename || "—"}
                    </p>
                  </div>
                </div>

                <a
                  href={mediaUrl || undefined}
                  download={
                    record.original_filename || `${record.title}.pdf`
                  }
                  aria-disabled={!mediaUrl}
                  className="group inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-pb-green to-[#0f3d2e] px-4 py-2.5 text-xs font-extrabold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:from-pb-khaki hover:to-[#c9b95f] hover:shadow-lg active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:ring-offset-2 focus-visible:outline-none aria-disabled:cursor-not-allowed aria-disabled:opacity-50 aria-disabled:hover:translate-y-0 sm:text-sm"
                >
                  <DownloadIcon className="h-4 w-4" />
                  PDF डाउनलोड करा
                </a>
              </div>

              {/* PDF viewer */}
              <div className="p-4 sm:p-6">
                {mediaUrl ? (
                  <iframe
                    title={record.title}
                    src={mediaUrl}
                    className="h-[75vh] min-h-[480px] w-full rounded-xl border border-pb-border"
                  />
                ) : (
                  <div
                    role="status"
                    className="flex h-64 flex-col items-center justify-center gap-3 rounded-xl bg-pb-light/70"
                  >
                    <SpinnerIcon className="animate-spin-soft h-8 w-8 text-pb-khaki" />
                    <p className="text-xs font-semibold text-slate-500">
                      PDF लोड होत आहे...
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ================= SOURCE FOOTER ================= */}
          {(record.source_name || sourceUrl) && (
            <footer className="animate-fade-up mt-6 overflow-hidden rounded-2xl border border-pb-border bg-white/90 shadow-sm backdrop-blur-sm">
              <span
                aria-hidden="true"
                className="block h-1 w-full bg-gradient-to-r from-pb-khaki via-[#e1d37f] to-pb-khaki"
              />
              <div className="p-5 sm:p-6">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pb-khaki/15 text-pb-khaki">
                    <GlobeIcon className="h-4 w-4" />
                  </span>
                  <span className="text-[10px] font-bold tracking-[0.14em] text-slate-500 uppercase">
                    स्रोत
                  </span>
                  <span className="h-px flex-1 bg-gradient-to-r from-pb-border to-transparent" />
                </div>

                <div className="mt-3 space-y-3">
                  {record.source_name && (
                    <p className="flex items-start gap-2.5 text-sm font-semibold break-words text-pb-green">
                      <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-pb-khaki" />
                      <span className="min-w-0">{record.source_name}</span>
                    </p>
                  )}

                  {sourceUrl && (
                    <a
                      href={sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex min-h-11 items-center gap-2 rounded-xl border border-pb-border bg-white px-4 py-2.5 text-sm font-bold text-pb-green transition-all duration-200 hover:-translate-y-0.5 hover:border-pb-khaki hover:bg-pb-light hover:shadow-sm active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none"
                    >
                      <ExternalLinkIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      मूळ स्रोत उघडा
                    </a>
                  )}
                </div>
              </div>
            </footer>
          )}

          {/* ================= BOTTOM ACTIONS ================= */}
          <nav className="animate-fade-up mt-6 flex flex-col gap-2.5 sm:flex-row">
            <Link
              to="/student/current-affairs"
              className="group inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pb-green to-[#0f3d2e] px-5 py-3 text-sm font-extrabold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:from-pb-khaki hover:to-[#c9b95f] hover:shadow-lg active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <ArrowLeftIcon className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
              सर्व चालू घडामोडी
            </Link>
          </nav>
        </article>
      </div>
    </div>
  );
}

export default CurrentAffairDetail;