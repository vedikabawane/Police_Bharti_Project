import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";

import currentAffairCategories from "../../constants/currentAffairCategories";
import {
  deleteCurrentAffair,
  listCurrentAffairs,
  uploadCurrentAffairMedia,
  updateCurrentAffairStatus,
} from "../../services/admin/adminCurrentAffairService";

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
const PlusIcon = (p) => (
  <svg {...iconProps} strokeWidth="2" {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
const ImageIcon = (p) => (
  <svg {...iconProps} {...p}>
    <rect x="3" y="3" width="18" height="18" rx="2.5" />
    <circle cx="8.5" cy="9" r="1.5" />
    <path d="m4 17 5-5 4 4 3-3 4 4" />
  </svg>
);
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
const EditIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="m4 20 4-1 10-10a2 2 0 0 0-3-3L5 16l-1 4Z" />
    <path d="m14 6 3 3" />
  </svg>
);
const PowerIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M12 4v8" />
    <path d="M7.5 7a7 7 0 1 0 9 0" />
  </svg>
);
const TrashIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M3 6h18" />
    <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
    <path d="M19 6v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <path d="M10 11v5M14 11v5" />
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
const UploadIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M12 17V4M6 10l6-6 6 6" />
    <path d="M4 20h16" />
  </svg>
);
const AlertIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M10.3 3.9 2.4 17a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9v4M12 17h.01" />
  </svg>
);
const CheckCircleIcon = (p) => (
  <svg {...iconProps} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m8.5 12 2.5 2.5L16 9.5" />
  </svg>
);
const InboxIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M3 12h5l1.5 3h5L16 12h5" />
    <path d="M5 5h14l2 7v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6Z" />
  </svg>
);
const SpinnerIcon = (p) => (
  <svg {...iconProps} strokeWidth="2.4" {...p}>
    <path d="M21 12a9 9 0 1 1-6.2-8.5" />
  </svg>
);

const PER_PAGE = 20;
const inputClass =
  "w-full rounded-xl border border-pb-border bg-white px-3.5 py-2.5 text-sm text-pb-green transition-all duration-200 outline-none placeholder:text-slate-400 focus:border-pb-khaki focus:ring-4 focus:ring-pb-khaki/15";

function formatDate(value) {
  if (!value) return "—";
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getErrorMessage(error) {
  return error.response?.data?.message || error.message || "Something went wrong.";
}

/* ================= PAGINATION ================= */
function Pagination({ page, pages, onChange }) {
  if (pages < 2) return null;
  return (
    <nav
      aria-label="Current affairs pages"
      className="mt-6 flex flex-wrap items-center justify-center gap-2"
    >
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-pb-border bg-white px-4 py-2 text-sm font-bold text-pb-green transition-all duration-200 hover:-translate-y-0.5 hover:bg-pb-light hover:shadow-sm active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Previous
      </button>
      <span
        aria-live="polite"
        className="rounded-full border border-pb-border-soft bg-pb-light px-4 py-2 text-sm font-bold text-pb-green tabular-nums"
      >
        Page {page} of {pages}
      </span>
      <button
        type="button"
        disabled={page >= pages}
        onClick={() => onChange(page + 1)}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-pb-border bg-white px-4 py-2 text-sm font-bold text-pb-green transition-all duration-200 hover:-translate-y-0.5 hover:bg-pb-light hover:shadow-sm active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none"
      >
        Next
        <ChevronRightIcon className="h-4 w-4" />
      </button>
    </nav>
  );
}

/* ================= QUICK MEDIA UPLOAD ================= */
function QuickMediaUpload({ type, onClose, onUploaded }) {
  const uploadRequestId = useRef(crypto.randomUUID());
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const submit = async (event) => {
    event.preventDefault();
    if (!file || busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await uploadCurrentAffairMedia(
        file,
        type,
        uploadRequestId.current,
      );
      if (!response?.success)
        throw new Error(response?.message || "Upload failed.");
      onUploaded();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  };

  const accept =
    type === "IMAGE"
      ? ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
      : ".pdf,application/pdf";

  return (
    <div
      className="animate-overlay-in fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <style>{`
        @keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes dialogIn { from { opacity: 0; transform: translateY(10px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes spinSoft { to { transform: rotate(360deg); } }
        .animate-overlay-in { animation: overlayIn 0.2s ease-out both; }
        .animate-dialog-in { animation: dialogIn 0.28s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .animate-spin-soft { animation: spinSoft 0.9s linear infinite; }
        @media (prefers-reduced-motion: reduce) {
          .animate-overlay-in, .animate-dialog-in, .animate-spin-soft { animation: none !important; }
        }
      `}</style>

      <form
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-upload-title"
        className="animate-dialog-in relative w-full max-w-lg overflow-hidden rounded-2xl border border-pb-border bg-white shadow-2xl"
      >
        {/* Top accent */}
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-pb-green via-pb-khaki to-pb-green"
        />

        <div className="p-5 sm:p-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-pb-khaki/15 text-pb-khaki">
              {type === "IMAGE" ? (
                <ImageIcon className="h-5 w-5" />
              ) : (
                <FileIcon className="h-5 w-5" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold tracking-[0.14em] text-pb-khaki uppercase">
                Current Affairs
              </p>
              <h2
                id="quick-upload-title"
                className="mt-0.5 text-lg leading-tight font-extrabold tracking-tight text-pb-green sm:text-xl"
              >
                Upload {type === "IMAGE" ? "Image" : "PDF"}
              </h2>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={onClose}
              aria-label="Close upload"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-transparent text-pb-green transition-all duration-200 hover:border-pb-khaki hover:bg-pb-light focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none active:scale-95 disabled:opacity-50"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Error */}
          {error && (
            <p
              role="alert"
              className="mt-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-semibold text-red-700"
            >
              <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="min-w-0 break-words">{error}</span>
            </p>
          )}

          {/* File input */}
          <label
            htmlFor="current-affair-media-file"
            className="mt-5 block text-sm font-bold text-pb-green"
          >
            Choose {type === "IMAGE" ? "image" : "PDF"}
          </label>
          <input
            id="current-affair-media-file"
            type="file"
            required
            accept={accept}
            disabled={busy}
            onChange={(event) => {
              const nextFile = event.target.files?.[0] || null;
              setFile(nextFile);
              setPreview(
                type === "IMAGE" && nextFile
                  ? URL.createObjectURL(nextFile)
                  : "",
              );
            }}
            className="mt-2 block w-full cursor-pointer rounded-xl border border-pb-border bg-white p-2 text-sm text-slate-700 transition-colors file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-pb-light file:px-3 file:py-2 file:text-xs file:font-bold file:text-pb-green hover:file:bg-pb-neutral disabled:opacity-60"
          />

          {/* Preview */}
          {file && (
            <div className="mt-4 rounded-xl border border-pb-border bg-pb-light/60 p-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-pb-green shadow-sm">
                  {type === "IMAGE" ? (
                    <ImageIcon className="h-4 w-4" />
                  ) : (
                    <FileIcon className="h-4 w-4" />
                  )}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-pb-green">
                    {file.name}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>

              {preview && (
                <img
                  src={preview}
                  alt="Selected image preview"
                  className="mt-3 max-h-56 w-full rounded-lg object-contain"
                />
              )}
            </div>
          )}

          {/* Actions */}
          <div className="mt-5 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={busy}
              onClick={onClose}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-pb-border bg-white px-4 py-2.5 text-sm font-bold text-pb-green transition-all duration-200 hover:-translate-y-0.5 hover:bg-pb-light hover:shadow-sm active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!file || busy}
              className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pb-green to-[#0f3d2e] px-5 py-2.5 text-sm font-extrabold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:from-pb-khaki hover:to-[#c9b95f] hover:shadow-lg active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {busy ? (
                <>
                  <SpinnerIcon className="animate-spin-soft h-4 w-4" />
                  Uploading…
                </>
              ) : (
                <>
                  <UploadIcon className="h-4 w-4" />
                  Upload
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function AdminCurrentAffairs() {
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: PER_PAGE,
    total: 0,
    pages: 0,
  });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("");
  const [contentType, setContentType] = useState("");
  const [status, setStatus] = useState("");
  const [publishedDate, setPublishedDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reload, setReload] = useState(0);
  const [uploadType, setUploadType] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError("");
      const params = { page, per_page: PER_PAGE };
      if (debouncedSearch) params.search = debouncedSearch;
      if (category) params.category = category;
      if (contentType) params.content_type = contentType;
      if (status) params.is_active = status;
      if (publishedDate) params.published_date = publishedDate;
      try {
        const response = await listCurrentAffairs(params);
        const data = response?.data;
        if (
          !response?.success ||
          !Array.isArray(data?.current_affairs) ||
          !data?.pagination
        ) {
          throw new Error(
            response?.message || "Current affairs response was incomplete.",
          );
        }
        if (active) {
          setRecords(data.current_affairs);
          setPagination(data.pagination);
          if (data.pagination.pages > 0 && page > data.pagination.pages)
            setPage(data.pagination.pages);
        }
      } catch (requestError) {
        if (active) setError(getErrorMessage(requestError));
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [page, debouncedSearch, category, contentType, status, publishedDate, reload]);

  const changeFilter = (setter, value) => {
    setter(value);
    setPage(1);
    setNotice("");
  };

  const toggleStatus = async (record) => {
    setBusyId(record.id);
    setError("");
    setNotice("");
    try {
      const response = await updateCurrentAffairStatus(record.id, !record.is_active);
      if (!response?.success)
        throw new Error(response?.message || "Could not update status.");
      setNotice(
        `“${record.title}” is now ${record.is_active ? "inactive" : "active"}.`,
      );
      setReload((value) => value + 1);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusyId(null);
    }
  };

  const removeRecord = async (record) => {
    if (
      !window.confirm(
        `Delete “${record.title}” permanently? This cannot be undone.`,
      )
    )
      return;
    setBusyId(record.id);
    setError("");
    setNotice("");
    try {
      const response = await deleteCurrentAffair(record.id);
      if (!response?.success)
        throw new Error(response?.message || "Could not delete current affair.");
      setNotice("Current affair deleted.");
      setReload((value) => value + 1);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusyId(null);
    }
  };

  const activeFilterCount = [contentType, category, status, publishedDate].filter(
    Boolean,
  ).length;

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
                <NewspaperIcon className="relative h-6 w-6" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold tracking-[0.14em] text-pb-khaki uppercase sm:text-xs">
                  Content management
                </p>
                <h1 className="mt-1 text-xl leading-tight font-extrabold tracking-tight text-pb-green sm:text-2xl lg:text-3xl">
                  Current Affairs
                </h1>
                <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-600 sm:text-sm">
                  Publish date-wise updates for Maharashtra Police Bharti preparation.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <Link
                to="/admin/current-affairs/new"
                className="group inline-flex min-h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-pb-green to-[#0f3d2e] px-4 py-2.5 text-sm font-extrabold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:from-pb-khaki hover:to-[#c9b95f] hover:shadow-lg active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <PlusIcon className="h-4 w-4" />
                Add current affair
              </Link>
              <button
                type="button"
                onClick={() => setUploadType("IMAGE")}
                className="group inline-flex min-h-11 items-center gap-2 rounded-xl border border-pb-khaki bg-white px-4 py-2.5 text-sm font-bold text-pb-green transition-all duration-200 hover:-translate-y-0.5 hover:bg-pb-light hover:shadow-sm active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none"
              >
                <ImageIcon className="h-4 w-4" />
                Upload Image
              </button>
              <button
                type="button"
                onClick={() => setUploadType("PDF")}
                className="group inline-flex min-h-11 items-center gap-2 rounded-xl border border-pb-khaki bg-white px-4 py-2.5 text-sm font-bold text-pb-khaki transition-all duration-200 hover:-translate-y-0.5 hover:bg-pb-light hover:shadow-sm active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none"
              >
                <FileIcon className="h-4 w-4" />
                Upload PDF
              </button>
            </div>
          </div>
        </div>

        {/* ================= FILTERS ================= */}
        <section
          aria-label="Current affairs filters"
          className="animate-fade-up mt-6 overflow-hidden rounded-2xl border border-pb-border bg-white/90 shadow-sm backdrop-blur-sm"
          style={{ animationDelay: "60ms" }}
        >
          <div className="flex items-center gap-2.5 border-b border-pb-border-soft bg-pb-light/50 px-5 py-3.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-pb-green/10 text-pb-green">
              <FilterIcon className="h-3.5 w-3.5" />
            </span>
            <span className="text-[11px] font-extrabold tracking-[0.14em] text-slate-500 uppercase">
              Filters
            </span>
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-pb-khaki/15 px-2.5 py-0.5 text-[11px] font-extrabold text-pb-khaki">
                {activeFilterCount} active
              </span>
            )}
            <span className="h-px flex-1 bg-gradient-to-r from-pb-border to-transparent" />
          </div>

          <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label
                htmlFor="admin-current-type"
                className="mb-1.5 block text-xs font-bold text-pb-green"
              >
                Content type
              </label>
              <select
                id="admin-current-type"
                value={contentType}
                onChange={(event) => changeFilter(setContentType, event.target.value)}
                className={inputClass}
              >
                <option value="">All types</option>
                <option value="TEXT">Text</option>
                <option value="IMAGE">Image</option>
                <option value="PDF">PDF</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="admin-current-search"
                className="mb-1.5 block text-xs font-bold text-pb-green"
              >
                Search
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400">
                  <SearchIcon className="h-4 w-4" />
                </span>
                <input
                  id="admin-current-search"
                  type="search"
                  value={search}
                  onChange={(event) => changeFilter(setSearch, event.target.value)}
                  placeholder="Title, summary or content"
                  className={`${inputClass} pl-10`}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="admin-current-category"
                className="mb-1.5 block text-xs font-bold text-pb-green"
              >
                Category
              </label>
              <select
                id="admin-current-category"
                value={category}
                onChange={(event) => changeFilter(setCategory, event.target.value)}
                className={inputClass}
              >
                <option value="">All categories</option>
                {currentAffairCategories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="admin-current-status"
                className="mb-1.5 block text-xs font-bold text-pb-green"
              >
                Status
              </label>
              <select
                id="admin-current-status"
                value={status}
                onChange={(event) => changeFilter(setStatus, event.target.value)}
                className={inputClass}
              >
                <option value="">All statuses</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="admin-current-date"
                className="mb-1.5 block text-xs font-bold text-pb-green"
              >
                Published date
              </label>
              <input
                id="admin-current-date"
                type="date"
                value={publishedDate}
                onChange={(event) =>
                  changeFilter(setPublishedDate, event.target.value)
                }
                className={inputClass}
              />
            </div>
          </div>
        </section>

        {/* ================= ALERTS ================= */}
        {error && (
          <div
            role="alert"
            className="animate-fade-up mt-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
          >
            <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="min-w-0 break-words">{error}</span>
          </div>
        )}
        {notice && (
          <div
            role="status"
            className="animate-fade-up mt-4 flex items-start gap-2.5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800"
          >
            <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="min-w-0 break-words">{notice}</span>
          </div>
        )}

        {/* ================= RESULTS HEADER ================= */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg leading-tight font-extrabold tracking-tight text-pb-green">
              Current affairs
            </h2>
            {!loading && (
              <span className="rounded-full border border-pb-border-soft bg-pb-light px-2.5 py-0.5 text-[11px] font-bold tabular-nums text-pb-green">
                {pagination.total} item{pagination.total === 1 ? "" : "s"}
              </span>
            )}
          </div>
        </div>

        {/* ================= RESULTS ================= */}
        {loading ? (
          <div
            role="status"
            className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          >
            {Array.from({ length: 6 }, (_, index) => (
              <div
                key={index}
                className="animate-pulse rounded-2xl border border-pb-border bg-white p-5"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className="flex items-start gap-3">
                  <span className="h-11 w-11 shrink-0 rounded-xl bg-pb-light" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="h-4 w-3/4 rounded bg-pb-light" />
                    <div className="h-3 w-1/2 rounded bg-pb-light" />
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="h-3 w-full rounded bg-pb-light" />
                  <div className="h-3 w-5/6 rounded bg-pb-light" />
                </div>
                <div className="mt-4 flex gap-2">
                  <div className="h-8 w-16 rounded bg-pb-light" />
                  <div className="h-8 w-20 rounded bg-pb-light" />
                </div>
              </div>
            ))}
          </div>
        ) : records.length === 0 ? (
          <div className="animate-fade-up mt-4 flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#d9d2c3] bg-white/70 px-5 py-14 text-center backdrop-blur-sm">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-pb-light text-pb-khaki">
              <InboxIcon className="h-6 w-6" />
            </span>
            <p className="text-base font-extrabold text-pb-green">
              No current affairs found
            </p>
            <p className="max-w-md text-sm text-slate-500">
              Try changing the filters or add a new article.
            </p>
          </div>
        ) : (
          <>
            {/* ---------- Desktop table ---------- */}
            <div className="animate-fade-up mt-4 hidden overflow-hidden rounded-2xl border border-pb-border bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)] xl:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-left text-sm">
                  <thead className="bg-pb-light text-[11px] tracking-wide text-slate-600 uppercase">
                    <tr>
                      <th scope="col" className="px-4 py-3 font-extrabold">
                        Current affair
                      </th>
                      <th scope="col" className="px-4 py-3 font-extrabold">
                        Type
                      </th>
                      <th scope="col" className="px-4 py-3 font-extrabold">
                        Category
                      </th>
                      <th scope="col" className="px-4 py-3 font-extrabold">
                        Published
                      </th>
                      <th scope="col" className="px-4 py-3 font-extrabold">
                        Status
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-right font-extrabold"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-pb-border-soft">
                    {records.map((record) => (
                      <tr
                        key={record.id}
                        className="bg-white transition-colors duration-200 odd:bg-white even:bg-pb-light/30 hover:bg-pb-light/60"
                      >
                        <td className="max-w-md px-4 py-3.5">
                          <p className="truncate font-bold text-pb-green">
                            {record.title}
                          </p>
                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                            {record.original_filename ||
                              record.summary ||
                              record.content ||
                              "—"}
                          </p>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-pb-light px-2 py-1 text-xs font-bold text-pb-green">
                            {record.content_type === "IMAGE" ? (
                              <ImageIcon className="h-3.5 w-3.5" />
                            ) : record.content_type === "PDF" ? (
                              <FileIcon className="h-3.5 w-3.5" />
                            ) : (
                              <NewspaperIcon className="h-3.5 w-3.5" />
                            )}
                            {record.content_type || "TEXT"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-slate-700">
                          {record.category}
                        </td>
                        <td className="font-medium whitespace-nowrap px-4 py-3.5 text-slate-600">
                          {formatDate(record.published_date)}
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
                              record.is_active
                                ? "bg-green-50 text-green-700 ring-1 ring-green-200"
                                : "bg-slate-100 text-slate-600 ring-1 ring-slate-200"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                record.is_active ? "bg-green-500" : "bg-slate-400"
                              }`}
                            />
                            {record.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex justify-end gap-2">
                            <Link
                              to={`/admin/current-affairs/${record.id}/edit`}
                              aria-label={`Edit ${record.title}`}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-pb-border bg-white px-2.5 py-1.5 text-xs font-bold text-pb-green transition-all duration-200 hover:-translate-y-0.5 hover:border-pb-khaki hover:bg-pb-light hover:shadow-sm active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none"
                            >
                              <EditIcon className="h-3.5 w-3.5" />
                              Edit
                            </Link>
                            <button
                              type="button"
                              disabled={busyId === record.id}
                              onClick={() => toggleStatus(record)}
                              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none disabled:cursor-wait disabled:opacity-50 disabled:hover:translate-y-0 ${
                                record.is_active
                                  ? "bg-slate-500 hover:bg-slate-600"
                                  : "bg-pb-green hover:bg-pb-khaki"
                              }`}
                            >
                              {busyId === record.id ? (
                                <SpinnerIcon className="animate-spin-soft h-3.5 w-3.5" />
                              ) : (
                                <PowerIcon className="h-3.5 w-3.5" />
                              )}
                              {record.is_active ? "Deactivate" : "Activate"}
                            </button>
                            <button
                              type="button"
                              disabled={busyId === record.id}
                              onClick={() => removeRecord(record)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-bold text-red-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-50 hover:shadow-sm active:translate-y-0 focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:outline-none disabled:cursor-wait disabled:opacity-50 disabled:hover:translate-y-0"
                            >
                              {busyId === record.id ? (
                                <SpinnerIcon className="animate-spin-soft h-3.5 w-3.5" />
                              ) : (
                                <TrashIcon className="h-3.5 w-3.5" />
                              )}
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ---------- Mobile / tablet cards ---------- */}
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:hidden">
              {records.map((record, index) => (
                <article
                  key={record.id}
                  className="animate-fade-up group relative overflow-hidden rounded-2xl border border-pb-border bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:border-pb-khaki/40 hover:shadow-md"
                  style={{ animationDelay: `${Math.min(index * 40, 400)}ms` }}
                >
                  {/* Left accent based on status */}
                  <span
                    aria-hidden="true"
                    className={`absolute inset-y-0 left-0 w-1 ${
                      record.is_active
                        ? "bg-gradient-to-b from-pb-green via-pb-khaki to-pb-green"
                        : "bg-slate-200"
                    }`}
                  />

                  <div className="flex items-start gap-3 pl-2">
                    {/* Type icon */}
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105 ${
                        record.content_type === "IMAGE"
                          ? "bg-pb-khaki/15 text-pb-khaki"
                          : record.content_type === "PDF"
                            ? "bg-red-50 text-red-600"
                            : "bg-pb-green/10 text-pb-green"
                      }`}
                    >
                      {record.content_type === "IMAGE" ? (
                        <ImageIcon className="h-5 w-5" />
                      ) : record.content_type === "PDF" ? (
                        <FileIcon className="h-5 w-5" />
                      ) : (
                        <NewspaperIcon className="h-5 w-5" />
                      )}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] leading-snug font-extrabold break-words text-pb-green">
                        {record.title}
                      </p>
                      <p className="mt-1 text-[11px] font-semibold tracking-wide text-pb-khaki">
                        {record.category} · {formatDate(record.published_date)}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-extrabold tracking-wide uppercase ${
                        record.is_active
                          ? "bg-green-50 text-green-700 ring-1 ring-green-200"
                          : "bg-slate-100 text-slate-600 ring-1 ring-slate-200"
                      }`}
                    >
                      {record.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <p className="mt-3 line-clamp-3 pl-2 text-sm leading-6 text-slate-600">
                    {record.content_type === "TEXT"
                      ? record.summary || record.content || "—"
                      : `${record.content_type} · ${record.original_filename || "—"}`}
                  </p>

                  {/* Actions */}
                  <div className="mt-4 flex flex-wrap gap-2 pl-2">
                    <Link
                      to={`/admin/current-affairs/${record.id}/edit`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-pb-border bg-white px-3 py-2 text-xs font-bold text-pb-green transition-all duration-200 hover:-translate-y-0.5 hover:border-pb-khaki hover:bg-pb-light hover:shadow-sm active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none"
                    >
                      <EditIcon className="h-3.5 w-3.5" />
                      Edit
                    </Link>
                    <button
                      type="button"
                      disabled={busyId === record.id}
                      onClick={() => toggleStatus(record)}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none disabled:cursor-wait disabled:opacity-50 disabled:hover:translate-y-0 ${
                        record.is_active
                          ? "bg-slate-500 hover:bg-slate-600"
                          : "bg-pb-green hover:bg-pb-khaki"
                      }`}
                    >
                      {busyId === record.id ? (
                        <SpinnerIcon className="animate-spin-soft h-3.5 w-3.5" />
                      ) : (
                        <PowerIcon className="h-3.5 w-3.5" />
                      )}
                      {record.is_active ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      type="button"
                      disabled={busyId === record.id}
                      onClick={() => removeRecord(record)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-50 hover:shadow-sm active:translate-y-0 focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:outline-none disabled:cursor-wait disabled:opacity-50 disabled:hover:translate-y-0"
                    >
                      {busyId === record.id ? (
                        <SpinnerIcon className="animate-spin-soft h-3.5 w-3.5" />
                      ) : (
                        <TrashIcon className="h-3.5 w-3.5" />
                      )}
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <Pagination page={page} pages={pagination.pages} onChange={setPage} />
          </>
        )}
      </div>

      {uploadType && (
        <QuickMediaUpload
          type={uploadType}
          onClose={() => setUploadType("")}
          onUploaded={() => {
            setUploadType("");
            setNotice("Current affair media uploaded and published.");
            setReload((value) => value + 1);
          }}
        />
      )}
    </div>
  );
}

export default AdminCurrentAffairs;