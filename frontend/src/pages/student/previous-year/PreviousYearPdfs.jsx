import { useEffect, useRef, useState } from "react";

import {
  downloadPreviousYearPdf,
  getPreviousYearPdfFile,
  getPreviousYearPdfs,
} from "../../../services/previousYearPdfService";

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

const FileIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M6 3h9l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
    <path d="M14 3v6h6M8 13h8M8 17h5" />
  </svg>
);
const SearchIcon = (p) => (
  <svg {...iconProps} {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);
const FilterIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M3 5h18l-7 9v6l-4-2v-4Z" />
  </svg>
);
const XCircleIcon = (p) => (
  <svg {...iconProps} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m9 9 6 6M15 9l-6 6" />
  </svg>
);
const EyeIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const DownloadIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M12 4v11M6 11l6 6 6-6" />
    <path d="M4 20h16" />
  </svg>
);
const CalendarIcon = (p) => (
  <svg {...iconProps} {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M8 3v4M16 3v4M3 10h18" />
  </svg>
);
const WeightIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M6 8h12l2 12H4L6 8Z" />
    <path d="M9 8a3 3 0 1 1 6 0" />
  </svg>
);
const BookIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 0-2 2Z" />
    <path d="M18 3v18" />
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
const ChevronLeftIcon = (p) => (
  <svg {...iconProps} strokeWidth="2.2" {...p}>
    <path d="m15 6-6 6 6 6" />
  </svg>
);
const ChevronRightIcon = (p) => (
  <svg {...iconProps} strokeWidth="2.2" {...p}>
    <path d="m9 6 6 6-6 6" />
  </svg>
);
const CloseIcon = (p) => (
  <svg {...iconProps} strokeWidth="2" {...p}>
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
);
const InboxIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M3 12h5l1.5 3h5L16 12h5" />
    <path d="M5 5h14l2 7v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6Z" />
  </svg>
);

const PER_PAGE = 20;

const getErrorMessage = (error) =>
  error.response?.data?.message || error.message;

async function getApiErrorMessage(error) {
  const responseData = error.response?.data;
  if (responseData instanceof Blob) {
    try {
      const body = JSON.parse(await responseData.text());
      return body.message || error.message;
    } catch {
      return error.message;
    }
  }
  return responseData?.message || error.message;
}

function getPdfUnavailableMessage(message) {
  return message?.toLowerCase().includes("file")
    ? "PDF फाइल सध्या उपलब्ध नाही."
    : "ही प्रश्नपत्रिका सध्या उपलब्ध नाही.";
}

function getSafeDownloadFilename(disposition, fallback) {
  let filename = "";
  const encodedFilename = disposition?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  const standardFilename = disposition?.match(/filename="?([^";]+)"?/i)?.[1];
  if (encodedFilename) {
    try {
      filename = decodeURIComponent(
        encodedFilename.trim().replace(/^"|"$/g, ""),
      );
    } catch {
      filename = "";
    }
  } else {
    filename = standardFilename || "";
  }
  const selected = filename || fallback || "previous-year.pdf";
  const basename = selected.split(/[\\/]/).pop();
  const safeName = Array.from(basename)
    .filter((character) => {
      const codePoint = character.codePointAt(0);
      return codePoint > 31 && (codePoint < 127 || codePoint > 159);
    })
    .join("");
  return safeName || "previous-year.pdf";
}

function formatFileSize(size = 0) {
  if (size < 1024) return `${size} Bytes`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value) {
  if (!value) return "उपलब्ध नाही";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "उपलब्ध नाही"
    : date.toLocaleDateString("mr-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
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

/* ---------- PDF CARD ---------- */
function PdfCard({ pdf, onView, loadingPdfId }) {
  const isLoading = loadingPdfId === pdf.id;

  return (
    <article className="animate-fade-up group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-pb-border bg-white/90 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-pb-khaki/40 hover:shadow-md">
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-pb-green via-pb-khaki to-pb-green opacity-70"
      />

      <div className="p-5 sm:p-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-pb-green to-[#0f3d2e] text-white shadow-md transition-transform duration-300 group-hover:scale-105">
            <FileIcon className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-base leading-snug font-extrabold break-words text-pb-green sm:text-lg">
              {pdf.title}
            </h2>
            <p className="mt-1 flex items-center gap-1.5 text-xs font-bold text-pb-khaki sm:text-sm">
              <BookIcon className="h-3.5 w-3.5" />
              <span className="min-w-0 truncate">{pdf.exam_name}</span>
            </p>
          </div>
        </div>

        {/* Description */}
        {pdf.description && (
          <p className="mt-4 text-sm leading-6 break-words text-slate-600">
            {pdf.description}
          </p>
        )}

        {/* Metadata grid */}
        <dl className="mt-5 grid min-w-0 grid-cols-2 gap-2.5 border-t border-pb-border-soft pt-4">
          <div className="min-w-0 rounded-xl bg-pb-light/60 p-3">
            <dt className="flex items-center gap-1.5 text-[10px] font-bold tracking-wide text-slate-500 uppercase">
              <CalendarIcon className="h-3 w-3" />
              परीक्षा वर्ष
            </dt>
            <dd className="mt-1 text-sm font-extrabold text-pb-green">
              {pdf.exam_year}
            </dd>
          </div>

          <div className="min-w-0 rounded-xl bg-pb-light/60 p-3">
            <dt className="flex items-center gap-1.5 text-[10px] font-bold tracking-wide text-slate-500 uppercase">
              <WeightIcon className="h-3 w-3" />
              आकार
            </dt>
            <dd className="mt-1 text-sm font-bold text-slate-700">
              {formatFileSize(pdf.file_size_bytes)}
            </dd>
          </div>

          <div className="min-w-0 rounded-xl bg-pb-light/60 p-3 sm:col-span-2">
            <dt className="flex items-center gap-1.5 text-[10px] font-bold tracking-wide text-slate-500 uppercase">
              <FileIcon className="h-3 w-3" />
              PDF फाइल
            </dt>
            <dd className="mt-1 text-xs font-medium break-all text-slate-700">
              {pdf.original_filename}
            </dd>
          </div>

          <div className="min-w-0 rounded-xl bg-pb-light/60 p-3 sm:col-span-2">
            <dt className="flex items-center gap-1.5 text-[10px] font-bold tracking-wide text-slate-500 uppercase">
              <CalendarIcon className="h-3 w-3" />
              अपलोड तारीख
            </dt>
            <dd className="mt-1 text-xs font-medium text-slate-700">
              {formatDate(pdf.created_at)}
            </dd>
          </div>
        </dl>
      </div>

      {/* Action footer */}
      <div className="mt-auto border-t border-pb-border-soft px-5 py-4 sm:px-6">
        <button
          type="button"
          disabled={loadingPdfId !== null}
          onClick={() => onView(pdf)}
          className="group/btn inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pb-green to-[#0f3d2e] px-4 py-2.5 text-sm font-extrabold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:from-pb-khaki hover:to-[#c9b95f] hover:shadow-lg active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-wait disabled:opacity-60 disabled:hover:translate-y-0"
        >
          {isLoading ? (
            <>
              <SpinnerIcon className="animate-spin-soft h-4 w-4" />
              PDF उघडत आहे...
            </>
          ) : (
            <>
              <EyeIcon className="h-4 w-4" />
              PDF पाहा
            </>
          )}
        </button>
      </div>
    </article>
  );
}

/* ---------- PDF VIEWER ---------- */
function PdfViewer({
  viewer,
  onClose,
  onRetry,
  onDownload,
  downloading,
  onRetryDownload,
}) {
  return (
    <div
      className="animate-overlay-in fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-2 backdrop-blur-sm sm:p-5"
      role="presentation"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="previous-year-viewer-title"
        className="animate-dialog-in relative flex h-[96dvh] max-h-[96dvh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-pb-border bg-white shadow-2xl sm:h-[92vh] sm:max-h-[92vh]"
      >
        {/* Top accent */}
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 z-10 h-1 bg-gradient-to-r from-pb-green via-pb-khaki to-pb-green"
        />

        {/* Header */}
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-pb-border bg-pb-light/40 px-4 py-3 pt-4 sm:items-center sm:px-6 sm:py-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-pb-green to-[#0f3d2e] text-white shadow-sm sm:flex">
              <FileIcon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2
                id="previous-year-viewer-title"
                className="text-sm leading-snug font-extrabold break-words text-pb-green sm:text-lg"
              >
                {viewer.pdf.title}
              </h2>
              <p className="mt-0.5 flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 sm:text-sm">
                <BookIcon className="h-3 w-3 shrink-0" />
                <span className="min-w-0 truncate">
                  {viewer.pdf.exam_name} · {viewer.pdf.exam_year}
                </span>
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              disabled={downloading}
              onClick={() => onDownload(viewer.pdf)}
              className="group/dl inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-gradient-to-r from-pb-green to-[#0f3d2e] px-3 py-2 text-xs font-extrabold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:from-pb-khaki hover:to-[#c9b95f] hover:shadow-md active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-wait disabled:opacity-60 disabled:hover:translate-y-0 sm:px-4 sm:text-sm"
            >
              {downloading ? (
                <>
                  <SpinnerIcon className="animate-spin-soft h-3.5 w-3.5" />
                  <span className="hidden sm:inline">डाउनलोड होत आहे...</span>
                  <span className="sm:hidden">...</span>
                </>
              ) : (
                <>
                  <DownloadIcon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">डाउनलोड करा</span>
                  <span className="sm:hidden">डाउनलोड</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="बंद करा"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-pb-border bg-white text-pb-green transition-all duration-200 hover:border-pb-khaki hover:bg-pb-light focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none active:scale-95"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Download error */}
        {viewer.downloadError && (
          <div
            role="alert"
            className="flex shrink-0 items-center justify-between gap-3 border-b border-red-100 bg-red-50 px-4 py-2 text-xs text-red-700 sm:px-6 sm:text-sm"
          >
            <span className="flex min-w-0 items-center gap-2">
              <AlertIcon className="h-4 w-4 shrink-0" />
              <span className="min-w-0 break-words">{viewer.downloadError}</span>
            </span>
            <button
              type="button"
              disabled={downloading}
              onClick={() => onRetryDownload(viewer.pdf)}
              className="shrink-0 font-bold text-red-700 underline decoration-1 underline-offset-2 transition-colors hover:text-red-900 focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:outline-none disabled:opacity-50"
            >
              पुन्हा प्रयत्न करा
            </button>
          </div>
        )}

        {/* Body */}
        <div className="flex min-h-0 flex-1 items-center justify-center bg-pb-light">
          {viewer.loading ? (
            <div role="status" className="px-5 py-12 text-center">
              <SpinnerIcon className="animate-spin-soft mx-auto h-10 w-10 text-pb-khaki" />
              <p className="mt-4 text-sm font-bold text-pb-green">
                PDF उघडत आहे...
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Fetching the file from the server.
              </p>
            </div>
          ) : viewer.error ? (
            <div
              role="alert"
              className="flex max-w-md flex-col items-center gap-3 px-5 py-10 text-center"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                <AlertIcon className="h-6 w-6" />
              </span>
              <p className="font-bold text-red-700">{viewer.error}</p>
              <button
                type="button"
                onClick={() => onRetry(viewer.pdf)}
                className="mt-1 inline-flex min-h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-pb-green to-[#0f3d2e] px-5 py-2.5 text-sm font-extrabold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:from-pb-khaki hover:to-[#c9b95f] hover:shadow-lg active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <RefreshIcon className="h-4 w-4" />
                पुन्हा प्रयत्न करा
              </button>
            </div>
          ) : (
            <iframe
              title={viewer.pdf.title}
              src={viewer.url}
              className="h-full w-full border-0 bg-white"
            />
          )}
        </div>
      </section>
    </div>
  );
}

/* ---------- LOADING SKELETON ---------- */
function LoadingCards() {
  return (
    <div
      className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
      role="status"
      aria-label="प्रश्नपत्रिका लोड होत आहेत"
    >
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={index}
          className="animate-pulse overflow-hidden rounded-2xl border border-pb-border bg-white p-5 sm:p-6"
          style={{ animationDelay: `${index * 80}ms` }}
        >
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 shrink-0 rounded-xl bg-pb-light" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-3/4 rounded bg-pb-light" />
              <div className="h-3 w-1/2 rounded bg-pb-light" />
            </div>
          </div>
          <div className="mt-6 space-y-2">
            <div className="h-3 rounded bg-pb-light" />
            <div className="h-3 w-2/3 rounded bg-pb-light" />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2.5 border-t border-pb-border-soft pt-4">
            <div className="h-14 rounded-xl bg-pb-light" />
            <div className="h-14 rounded-xl bg-pb-light" />
            <div className="col-span-2 h-14 rounded-xl bg-pb-light" />
          </div>
          <div className="mt-5 h-11 rounded-xl bg-pb-light" />
        </div>
      ))}
    </div>
  );
}

function getPageNumbers(page, pages) {
  if (pages <= 5) return Array.from({ length: pages }, (_, index) => index + 1);
  const start = Math.max(1, Math.min(page - 2, pages - 4));
  return Array.from({ length: 5 }, (_, index) => start + index);
}

function PreviousYearPdfs() {
  const [pdfs, setPdfs] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: PER_PAGE,
    total: 0,
    pages: 0,
  });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [examName, setExamName] = useState("");
  const [examYear, setExamYear] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [viewer, setViewer] = useState(null);
  const [loadingPdfId, setLoadingPdfId] = useState(null);
  const [downloadingPdfId, setDownloadingPdfId] = useState(null);
  const viewerUrlRef = useRef(null);
  const viewerRequestRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      viewerRequestRef.current += 1;
      if (viewerUrlRef.current) {
        URL.revokeObjectURL(viewerUrlRef.current);
        viewerUrlRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(
      () => setDebouncedSearch(search.trim()),
      350,
    );
    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    let isCurrent = true;
    const loadPdfs = async () => {
      setLoading(true);
      setError("");
      const params = { page, per_page: PER_PAGE, search: debouncedSearch };
      if (examName.trim()) params.exam_name = examName.trim();
      if (examYear) params.exam_year = examYear;
      try {
        const response = await getPreviousYearPdfs(params);
        const data = response?.data;
        if (
          !response?.success ||
          !Array.isArray(data?.previous_year_pdfs) ||
          !data?.pagination
        )
          throw new Error(
            response?.message || "Previous Year PDF response was incomplete.",
          );
        if (isCurrent) {
          setPdfs(data.previous_year_pdfs);
          setPagination(data.pagination);
          if (data.pagination.pages > 0 && page > data.pagination.pages)
            setPage(data.pagination.pages);
        }
      } catch (requestError) {
        if (isCurrent) setError(getErrorMessage(requestError));
      } finally {
        if (isCurrent) setLoading(false);
      }
    };
    loadPdfs();
    return () => {
      isCurrent = false;
    };
  }, [page, debouncedSearch, examName, examYear, reload]);

  const hasFilters = Boolean(search || examName || examYear);

  const resetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setExamName("");
    setExamYear("");
    setPage(1);
  };

  const firstResult =
    pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.per_page + 1;
  const lastResult = Math.min(
    pagination.page * pagination.per_page,
    pagination.total,
  );

  const fieldClass =
    "w-full rounded-xl border border-pb-border bg-white px-3.5 py-3 text-sm font-medium text-pb-green transition-all duration-200 outline-none placeholder:text-slate-400 focus:border-pb-khaki focus:ring-4 focus:ring-pb-khaki/15";

  const closeViewer = () => {
    viewerRequestRef.current += 1;
    if (viewerUrlRef.current) {
      URL.revokeObjectURL(viewerUrlRef.current);
      viewerUrlRef.current = null;
    }
    setViewer(null);
    setLoadingPdfId(null);
  };

  const openViewer = async (pdf) => {
    if (loadingPdfId !== null) return;
    const requestId = viewerRequestRef.current + 1;
    viewerRequestRef.current = requestId;
    setLoadingPdfId(pdf.id);
    setViewer({ pdf, url: null, loading: true, error: "", downloadError: "" });
    try {
      const blob = await getPreviousYearPdfFile(pdf.id);
      if (!(blob instanceof Blob)) throw new Error("Invalid PDF response.");
      const url = URL.createObjectURL(blob);
      if (!mountedRef.current || viewerRequestRef.current !== requestId) {
        URL.revokeObjectURL(url);
        return;
      }
      if (viewerUrlRef.current) URL.revokeObjectURL(viewerUrlRef.current);
      viewerUrlRef.current = url;
      setViewer({ pdf, url, loading: false, error: "", downloadError: "" });
    } catch (requestError) {
      const apiMessage = await getApiErrorMessage(requestError);
      if (mountedRef.current && viewerRequestRef.current === requestId) {
        const message =
          requestError.response?.status === 404
            ? getPdfUnavailableMessage(apiMessage)
            : "PDF उघडताना समस्या आली.";
        setViewer({
          pdf,
          url: null,
          loading: false,
          error: message,
          downloadError: "",
        });
      }
    } finally {
      if (mountedRef.current && viewerRequestRef.current === requestId)
        setLoadingPdfId(null);
    }
  };

  const downloadPdf = async (pdf) => {
    if (downloadingPdfId !== null) return;
    setDownloadingPdfId(pdf.id);
    if (viewer?.pdf.id === pdf.id)
      setViewer((current) => ({ ...current, downloadError: "" }));
    let blobUrl = null;
    let link = null;
    let scheduledRevoke = false;
    try {
      const response = await downloadPreviousYearPdf(pdf.id);
      if (!(response?.data instanceof Blob))
        throw new Error("Invalid PDF response.");
      const disposition =
        response.headers?.["content-disposition"] ||
        response.headers?.get?.("content-disposition");
      const filename = getSafeDownloadFilename(
        disposition,
        pdf.original_filename,
      );
      blobUrl = URL.createObjectURL(response.data);
      link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      scheduledRevoke = true;
    } catch (requestError) {
      const apiMessage = await getApiErrorMessage(requestError);
      const message =
        requestError.response?.status === 404
          ? getPdfUnavailableMessage(apiMessage)
          : "PDF डाउनलोड करताना समस्या आली.";
      if (mountedRef.current && viewer?.pdf.id === pdf.id) {
        setViewer((current) =>
          current ? { ...current, downloadError: message } : current,
        );
      }
    } finally {
      link?.remove();
      if (blobUrl && !scheduledRevoke) URL.revokeObjectURL(blobUrl);
      if (mountedRef.current) setDownloadingPdfId(null);
    }
  };

  return (
    <div className="relative min-h-screen min-w-0 overflow-x-hidden bg-pb-light">
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
              <FileIcon className="relative h-6 w-6" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold tracking-[0.16em] text-pb-khaki uppercase sm:text-xs">
                Previous Year PDFs
              </p>
              <h1 className="mt-1 text-xl leading-tight font-extrabold tracking-tight text-pb-green sm:text-2xl lg:text-3xl">
                मागील वर्षांच्या प्रश्नपत्रिका
              </h1>
              <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-600 sm:text-sm">
                महाराष्ट्र पोलीस भरतीच्या मागील वर्षांच्या प्रश्नपत्रिका PDF
                स्वरूपात पाहा.
              </p>
            </div>
          </div>
        </div>

        <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">

          {/* ================= FILTERS ================= */}
          <section
            aria-label="प्रश्नपत्रिका शोधा आणि फिल्टर करा"
            className="animate-fade-up overflow-hidden rounded-2xl border border-pb-border bg-white/90 shadow-sm backdrop-blur-sm"
          >
            <div className="flex items-center gap-2.5 border-b border-pb-border-soft bg-pb-light/50 px-5 py-3.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-pb-green/10 text-pb-green">
                <FilterIcon className="h-3.5 w-3.5" />
              </span>
              <span className="text-[11px] font-extrabold tracking-[0.14em] text-slate-500 uppercase">
                Filters
              </span>
              {hasFilters && (
                <span className="rounded-full bg-pb-khaki/15 px-2.5 py-0.5 text-[11px] font-extrabold text-pb-khaki">
                  active
                </span>
              )}
              <span className="h-px flex-1 bg-gradient-to-r from-pb-border to-transparent" />
            </div>

            <div className="grid min-w-0 gap-4 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(13rem,0.8fr)_10rem_auto] lg:items-end">
              <div className="min-w-0">
                <label
                  htmlFor="previous-year-search"
                  className="mb-2 flex items-center gap-2 text-sm font-bold text-pb-green"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-pb-green/10 text-pb-green">
                    <SearchIcon className="h-3.5 w-3.5" />
                  </span>
                  प्रश्नपत्रिका शोधा...
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400">
                    <SearchIcon className="h-4 w-4" />
                  </span>
                  <input
                    id="previous-year-search"
                    type="search"
                    value={search}
                    onChange={(event) => {
                      setSearch(event.target.value);
                      setPage(1);
                    }}
                    placeholder="प्रश्नपत्रिका शोधा..."
                    className={`${fieldClass} pl-10`}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="previous-year-exam-name"
                  className="mb-2 flex items-center gap-2 text-sm font-bold text-pb-green"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-pb-green/10 text-pb-green">
                    <BookIcon className="h-3.5 w-3.5" />
                  </span>
                  परीक्षेचे नाव
                </label>
                <input
                  id="previous-year-exam-name"
                  type="search"
                  value={examName}
                  onChange={(event) => {
                    setExamName(event.target.value);
                    setPage(1);
                  }}
                  placeholder="सर्व परीक्षा"
                  className={fieldClass}
                />
              </div>

              <div>
                <label
                  htmlFor="previous-year-exam-year"
                  className="mb-2 flex items-center gap-2 text-sm font-bold text-pb-green"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-pb-green/10 text-pb-green">
                    <CalendarIcon className="h-3.5 w-3.5" />
                  </span>
                  परीक्षा वर्ष
                </label>
                <input
                  id="previous-year-exam-year"
                  type="number"
                  step="1"
                  value={examYear}
                  onChange={(event) => {
                    setExamYear(event.target.value);
                    setPage(1);
                  }}
                  placeholder="सर्व वर्षे"
                  className={fieldClass}
                />
              </div>

              <button
                type="button"
                onClick={resetFilters}
                disabled={!hasFilters}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-pb-border bg-white px-4 py-3 text-sm font-bold text-pb-green transition-all duration-200 hover:-translate-y-0.5 hover:border-pb-khaki hover:bg-pb-light hover:shadow-sm active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
              >
                <XCircleIcon className="h-4 w-4" />
                फिल्टर काढा
              </button>
            </div>
          </section>

          {/* ================= RESULTS ================= */}
          <section aria-labelledby="previous-year-list-heading">
            <div className="animate-fade-up mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pb-green/10 text-pb-green">
                  <FileIcon className="h-4 w-4" />
                </span>
                <h2
                  id="previous-year-list-heading"
                  className="text-lg leading-tight font-extrabold tracking-tight text-pb-green"
                >
                  उपलब्ध प्रश्नपत्रिका
                </h2>
              </div>
              {!loading && !error && pagination.total > 0 && (
                <span className="self-start rounded-full border border-pb-border-soft bg-white/80 px-3 py-1 text-xs font-bold tabular-nums text-pb-green shadow-sm backdrop-blur-sm sm:self-auto">
                  {firstResult}–{lastResult} / {pagination.total}
                </span>
              )}
            </div>

            {loading ? (
              <LoadingCards />
            ) : error ? (
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
                  <p className="font-bold text-red-700">
                    मागील वर्षांच्या प्रश्नपत्रिका मिळवताना समस्या आली.
                  </p>
                  <p className="max-w-md text-sm text-slate-600">{error}</p>
                  <button
                    type="button"
                    onClick={() => setReload((current) => current + 1)}
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-pb-green to-[#0f3d2e] px-5 py-2.5 text-sm font-extrabold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:from-pb-khaki hover:to-[#c9b95f] hover:shadow-lg active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:ring-offset-2 focus-visible:outline-none"
                  >
                    <RefreshIcon className="h-4 w-4" />
                    पुन्हा प्रयत्न करा
                  </button>
                </div>
              </div>
            ) : pdfs.length === 0 ? (
              <div className="animate-fade-up flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#d9d2c3] bg-white/70 px-5 py-14 text-center backdrop-blur-sm">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-pb-light text-pb-khaki">
                  <InboxIcon className="h-6 w-6" />
                </span>
                <p className="text-base font-extrabold text-pb-green">
                  {hasFilters
                    ? "तुमच्या शोधासाठी कोणतीही प्रश्नपत्रिका सापडली नाही."
                    : "सध्या कोणतीही मागील वर्षांची प्रश्नपत्रिका उपलब्ध नाही."}
                </p>
                {hasFilters && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="mt-1 inline-flex min-h-11 items-center gap-2 rounded-xl border border-pb-border bg-white px-4 py-2.5 text-sm font-bold text-pb-khaki transition-all duration-200 hover:-translate-y-0.5 hover:border-pb-khaki hover:bg-pb-light hover:shadow-sm active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none"
                  >
                    <XCircleIcon className="h-4 w-4" />
                    फिल्टर काढा
                  </button>
                )}
              </div>
            ) : (
              <div className="grid min-w-0 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {pdfs.map((pdf, index) => (
                  <div
                    key={pdf.id}
                    style={{ animationDelay: `${Math.min(index * 50, 400)}ms` }}
                  >
                    <PdfCard
                      pdf={pdf}
                      onView={openViewer}
                      loadingPdfId={loadingPdfId}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ================= PAGINATION ================= */}
          {!loading && !error && pagination.pages > 1 && (
            <nav
              aria-label="प्रश्नपत्रिका पृष्ठे"
              className="animate-fade-up flex flex-col gap-3 rounded-2xl border border-pb-border bg-white/90 p-4 shadow-sm backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:px-5"
            >
              <p className="rounded-full border border-pb-border-soft bg-pb-light px-3 py-1.5 text-xs font-bold tabular-nums text-pb-green sm:text-sm">
                पृष्ठ {pagination.page} / {pagination.pages}
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={pagination.page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  className="inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-pb-border bg-white px-3 py-2 text-sm font-bold text-pb-green transition-all duration-200 hover:-translate-y-0.5 hover:border-pb-khaki hover:bg-pb-light hover:shadow-sm active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 sm:flex-none"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                  मागील
                </button>

                <div className="flex flex-wrap items-center gap-1.5">
                  {getPageNumbers(pagination.page, pagination.pages).map(
                    (pageNumber) => {
                      const isCurrent = pageNumber === pagination.page;
                      return (
                        <button
                          key={pageNumber}
                          type="button"
                          aria-current={isCurrent ? "page" : undefined}
                          onClick={() => setPage(pageNumber)}
                          className={`h-10 min-w-10 rounded-xl px-3 text-sm font-bold tabular-nums transition-all duration-200 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none ${isCurrent
                              ? "bg-gradient-to-br from-pb-green to-[#0f3d2e] text-white shadow-md"
                              : "border border-pb-border bg-white text-pb-green hover:-translate-y-0.5 hover:border-pb-khaki hover:bg-pb-light hover:shadow-sm active:translate-y-0"
                            }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    },
                  )}
                </div>

                <button
                  type="button"
                  disabled={pagination.page >= pagination.pages}
                  onClick={() =>
                    setPage((current) =>
                      Math.min(pagination.pages, current + 1),
                    )
                  }
                  className="inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-pb-border bg-white px-3 py-2 text-sm font-bold text-pb-green transition-all duration-200 hover:-translate-y-0.5 hover:border-pb-khaki hover:bg-pb-light hover:shadow-sm active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 sm:flex-none"
                >
                  पुढील
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              </div>
            </nav>
          )}
        </main>
      </div>

      {viewer && (
        <PdfViewer
          viewer={viewer}
          onClose={closeViewer}
          onRetry={openViewer}
          onDownload={downloadPdf}
          downloading={downloadingPdfId === viewer.pdf.id}
          onRetryDownload={downloadPdf}
        />
      )}
    </div>
  );
}

export default PreviousYearPdfs;