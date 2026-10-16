import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import currentAffairCategories from "../../constants/currentAffairCategories";
import {
  getStudentCurrentAffairMedia,
  listStudentCurrentAffairs,
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
const GlobeIcon = (p) => (
  <svg {...iconProps} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.5 3 2.5 15 0 18M12 3c-2.5 3-2.5 15 0 18" />
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
const TagIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M3 12V5a2 2 0 0 1 2-2h7l9 9-9 9-9-9Z" />
    <circle cx="8" cy="8" r="1.5" />
  </svg>
);
const CalendarIcon = (p) => (
  <svg {...iconProps} {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M8 3v4M16 3v4M3 10h18" />
  </svg>
);
const FileIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M6 3h9l5 5v13a1 1 0 1 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
    <path d="M14 3v6h6" />
  </svg>
);
const ImageIcon = (p) => (
  <svg {...iconProps} {...p}>
    <rect x="3" y="3" width="18" height="18" rx="2.5" />
    <circle cx="8.5" cy="9" r="1.5" />
    <path d="m4 17 5-5 4 4 3-3 4 4" />
  </svg>
);
const ArrowRightIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M5 12h14" />
    <path d="m13 6 6 6-6 6" />
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
const InboxIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M3 12h5l1.5 3h5L16 12h5" />
    <path d="M5 5h14l2 7v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6Z" />
  </svg>
);
const SparklesIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.3 6.3l2.8 2.8M14.9 14.9l2.8 2.8M17.7 6.3l-2.8 2.8M9.1 14.9l-2.8 2.8" />
  </svg>
);

const PER_PAGE = 12;
const inputClass =
  "w-full rounded-xl border border-pb-border bg-white px-3.5 py-2.5 text-sm font-medium text-pb-green transition-all duration-200 outline-none placeholder:text-slate-400 focus:border-pb-khaki focus:ring-4 focus:ring-pb-khaki/15";

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

function getErrorMessage(error) {
  return (
    error.response?.data?.message || error.message || "माहिती लोड करता आली नाही."
  );
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

/* ---------- PAGINATION ---------- */
function Pagination({ page, pages, onChange }) {
  if (pages < 2) return null;
  return (
    <nav
      aria-label="Current affairs pages"
      className="mt-7 flex flex-col gap-3 rounded-2xl border border-pb-border bg-white/90 p-4 shadow-sm backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:px-5"
    >
      <p className="rounded-full border border-pb-border-soft bg-pb-light px-3 py-1.5 text-xs font-bold tabular-nums text-pb-green sm:text-sm">
        Page {page} of {pages}
      </p>

      <div className="flex gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-pb-border bg-white px-4 py-2 text-sm font-bold text-pb-green transition-all duration-200 hover:-translate-y-0.5 hover:border-pb-khaki hover:bg-pb-light hover:shadow-sm active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 sm:flex-none"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          मागील
        </button>
        <button
          type="button"
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-pb-green to-[#0f3d2e] px-4 py-2 text-sm font-extrabold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:from-pb-khaki hover:to-[#c9b95f] hover:shadow-lg active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 sm:flex-none"
        >
          पुढील
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
}

/* ---------- CURRENT AFFAIR IMAGE ---------- */
function CurrentAffairImage({ id, title }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    let active = true;
    let objectUrl = "";
    getStudentCurrentAffairMedia(id)
      .then((blob) => {
        if (active) {
          objectUrl = URL.createObjectURL(blob);
          setSrc(objectUrl);
        }
      })
      .catch(() => {
        if (active) setSrc("");
      });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id]);

  if (src) {
    return (
      <img
        src={src}
        alt={title}
        loading="lazy"
        className="h-48 w-full rounded-xl object-cover transition-transform duration-300 group-hover:scale-[1.02]"
      />
    );
  }

  return (
    <div
      aria-label="Loading image"
      className="flex h-48 w-full items-center justify-center rounded-xl bg-pb-light"
    >
      <SpinnerIcon className="animate-spin-soft h-6 w-6 text-pb-khaki" />
    </div>
  );
}

/* ---------- NEWS CARD ---------- */
function NewsCard({ record, index = 0 }) {
  const isText = record.content_type === "TEXT" || !record.content_type;
  const isImage = record.content_type === "IMAGE";
  const isPdf = record.content_type === "PDF";

  const typeConfig = isPdf
    ? {
      label: "PDF",
      icon: FileIcon,
      pill: "border-red-200 bg-red-50 text-red-700",
    }
    : isImage
      ? {
        label: "IMAGE",
        icon: ImageIcon,
        pill: "border-pb-khaki/30 bg-pb-khaki/10 text-pb-khaki",
      }
      : {
        label: "TEXT",
        icon: NewspaperIcon,
        pill: "border-pb-green/20 bg-pb-green/5 text-pb-green",
      };

  const TypeIcon = typeConfig.icon;
  const ctaLabel = isPdf ? "PDF पाहा" : isImage ? "पहा" : "सविस्तर वाचा";

  return (
    <article
      className="animate-fade-up group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-pb-border bg-white/90 shadow-[0_1px_3px_rgba(15,23,42,0.04)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-pb-khaki/40 hover:shadow-lg"
      style={{ animationDelay: `${Math.min(index * 50, 400)}ms` }}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-1 bg-gradient-to-r from-pb-green via-pb-khaki to-pb-green opacity-70"
      />

      {/* Image preview (only for IMAGE type) */}
      {isImage && (
        <Link
          to={`/student/current-affairs/${record.id}`}
          aria-label={`View ${record.title}`}
          className="block overflow-hidden p-4 pb-0 focus-visible:outline-none"
        >
          <div className="overflow-hidden rounded-xl">
            <CurrentAffairImage id={record.id} title={record.title} />
          </div>
        </Link>
      )}

      {/* PDF preview placeholder */}
      {isPdf && (
        <Link
          to={`/student/current-affairs/${record.id}`}
          aria-label={`View ${record.title}`}
          className="block p-4 pb-0 focus-visible:outline-none"
        >
          <div className="flex h-32 items-center justify-center rounded-xl bg-gradient-to-br from-red-50 to-red-100/60">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-red-600 shadow-md">
              <FileIcon className="h-7 w-7" />
            </span>
          </div>
        </Link>
      )}

      <div className="flex flex-1 flex-col p-5">
        {/* Meta pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-extrabold tracking-wide uppercase ${typeConfig.pill}`}
          >
            <TypeIcon className="h-3 w-3" />
            {typeConfig.label}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-pb-border-soft bg-pb-light px-2.5 py-1 text-[10px] font-bold text-slate-600">
            <TagIcon className="h-3 w-3" />
            {record.category}
          </span>
        </div>

        {/* Date */}
        <time
          dateTime={record.published_date}
          className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 sm:text-xs"
        >
          <CalendarIcon className="h-3 w-3 shrink-0" />
          {formatDate(record.published_date)}
        </time>

        {/* Title */}
        <h2 className="mt-2 text-base leading-snug font-extrabold break-words text-pb-green transition-colors duration-200 group-hover:text-pb-khaki sm:text-lg">
          {record.title}
        </h2>

        {/* Body */}
        {isText ? (
          <p className="mt-2 line-clamp-4 flex-1 text-xs leading-5 break-words whitespace-pre-line text-slate-600 sm:text-sm sm:leading-6">
            {record.summary || record.content}
          </p>
        ) : (
          <p className="mt-2 flex-1 text-[11px] font-medium break-all text-slate-500 sm:text-xs">
            {record.original_filename}
          </p>
        )}

        {/* CTA */}
        <Link
          to={`/student/current-affairs/${record.id}`}
          className="group/btn mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pb-green to-[#0f3d2e] px-4 py-2.5 text-sm font-extrabold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:from-pb-khaki hover:to-[#c9b95f] hover:shadow-lg active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          {ctaLabel}
          <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
        </Link>
      </div>
    </article>
  );
}

function CurrentAffairs() {
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
  const [publishedDate, setPublishedDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

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
      if (publishedDate) params.published_date = publishedDate;
      try {
        const response = await listStudentCurrentAffairs(params);
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
  }, [page, debouncedSearch, category, publishedDate, reload]);

  const updateFilter = (setter, value) => {
    setter(value);
    setPage(1);
  };

  const hasActiveFilters = Boolean(search || category || publishedDate);

  const resetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setCategory("");
    setPublishedDate("");
    setPage(1);
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-pb-light">
      <AnimationStyles />
      <AnimatedBackground />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">

        {/* ================= PAGE HEADER ================= */}
        <div className="animate-fade-up mb-6 overflow-hidden rounded-2xl border border-pb-border/50 bg-white/85 shadow-sm backdrop-blur-sm">
          <span
            aria-hidden="true"
            className="animate-gradient pointer-events-none block h-1 w-full bg-gradient-to-r from-pb-green via-pb-khaki to-pb-green"
          />

          <div className="p-5 sm:p-6">
            <div className="flex min-w-0 items-center gap-4">
              <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-pb-green to-[#0f3d2e] text-white shadow-md">
                <span
                  aria-hidden="true"
                  className="animate-soft-glow pointer-events-none absolute -inset-1 rounded-3xl bg-pb-khaki/30 blur-md"
                />
                <NewspaperIcon className="relative h-6 w-6" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold tracking-[0.16em] text-pb-khaki uppercase sm:text-xs">
                  Police Bharti तयारी
                </p>
                <h1 className="mt-1 text-xl leading-tight font-extrabold tracking-tight text-pb-green sm:text-2xl lg:text-3xl">
                  चालू घडामोडी
                </h1>
                <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-600 sm:text-sm">
                  महत्त्वाच्या बातम्या आणि स्पर्धा परीक्षेसाठी उपयुक्त घडामोडी वाचा.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ================= FILTERS ================= */}
        <section
          aria-label="चालू घडामोडी शोधा"
          className="animate-fade-up overflow-hidden rounded-2xl border border-pb-border bg-white/90 shadow-sm backdrop-blur-sm"
        >
          <div className="flex items-center gap-2.5 border-b border-pb-border-soft bg-pb-light/50 px-5 py-3.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-pb-green/10 text-pb-green">
              <FilterIcon className="h-3.5 w-3.5" />
            </span>
            <span className="text-[11px] font-extrabold tracking-[0.14em] text-slate-500 uppercase">
              Filters
            </span>
            {hasActiveFilters && (
              <span className="rounded-full bg-pb-khaki/15 px-2.5 py-0.5 text-[11px] font-extrabold text-pb-khaki">
                active
              </span>
            )}
            <span className="h-px flex-1 bg-gradient-to-r from-pb-border to-transparent" />
          </div>

          <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">
            <div>
              <label
                htmlFor="student-current-search"
                className="mb-2 flex items-center gap-2 text-sm font-bold text-pb-green"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-pb-green/10 text-pb-green">
                  <SearchIcon className="h-3.5 w-3.5" />
                </span>
                शोधा
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400">
                  <SearchIcon className="h-4 w-4" />
                </span>
                <input
                  id="student-current-search"
                  type="search"
                  value={search}
                  onChange={(event) => updateFilter(setSearch, event.target.value)}
                  placeholder="शीर्षक किंवा मजकूर"
                  className={`${inputClass} pl-10`}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="student-current-category"
                className="mb-2 flex items-center gap-2 text-sm font-bold text-pb-green"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-pb-green/10 text-pb-green">
                  <TagIcon className="h-3.5 w-3.5" />
                </span>
                विभाग
              </label>
              <select
                id="student-current-category"
                value={category}
                onChange={(event) => updateFilter(setCategory, event.target.value)}
                className={inputClass}
              >
                <option value="">सर्व विभाग</option>
                {currentAffairCategories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2 lg:col-span-1">
              <label
                htmlFor="student-current-date"
                className="mb-2 flex items-center gap-2 text-sm font-bold text-pb-green"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-pb-green/10 text-pb-green">
                  <CalendarIcon className="h-3.5 w-3.5" />
                </span>
                तारीखेनुसार पहा
              </label>
              <div className="flex gap-2">
                <input
                  id="student-current-date"
                  type="date"
                  value={publishedDate}
                  onChange={(event) =>
                    updateFilter(setPublishedDate, event.target.value)
                  }
                  className={inputClass}
                />
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    aria-label="फिल्टर काढा"
                    className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-pb-border bg-white px-3.5 py-2.5 text-xs font-bold text-pb-green transition-all duration-200 hover:-translate-y-0.5 hover:border-pb-khaki hover:bg-pb-light hover:shadow-sm active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none sm:text-sm"
                  >
                    <RefreshIcon className="h-3.5 w-3.5" />
                    काढा
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ================= ERROR ================= */}
        {error && (
          <div
            role="alert"
            className="animate-fade-up mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
          >
            <span className="flex min-w-0 items-start gap-2.5">
              <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="min-w-0 break-words">{error}</span>
            </span>
            <button
              type="button"
              onClick={() => setReload((value) => value + 1)}
              className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-extrabold text-red-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-100 hover:shadow-sm active:translate-y-0 focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:outline-none"
            >
              <RefreshIcon className="h-3.5 w-3.5" />
              पुन्हा प्रयत्न करा
            </button>
          </div>
        )}

        {/* ================= RESULTS HEADER ================= */}
        {!loading && !error && (
          <div className="animate-fade-up mt-5 mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pb-green/10 text-pb-green">
                <NewspaperIcon className="h-4 w-4" />
              </span>
              <h2 className="text-base leading-tight font-extrabold tracking-tight text-pb-green sm:text-lg">
                ताज्या घडामोडी
              </h2>
            </div>
            <span className="rounded-full border border-pb-border-soft bg-white/80 px-3 py-1 text-[11px] font-bold tabular-nums text-pb-green shadow-sm backdrop-blur-sm sm:text-xs">
              एकूण {pagination.total}
            </span>
          </div>
        )}

        {/* ================= RESULTS ================= */}
        {loading ? (
          <div
            role="status"
            aria-label="चालू घडामोडी लोड होत आहेत"
            className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
          >
            {Array.from({ length: 6 }, (_, index) => (
              <div
                key={index}
                className="animate-pulse rounded-2xl border border-pb-border bg-white p-5"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className="flex gap-2">
                  <div className="h-6 w-16 rounded-full bg-pb-light" />
                  <div className="h-6 w-20 rounded-full bg-pb-light" />
                </div>
                <div className="mt-3 h-3 w-28 rounded bg-pb-light" />
                <div className="mt-3 space-y-2">
                  <div className="h-4 w-full rounded bg-pb-light" />
                  <div className="h-4 w-3/4 rounded bg-pb-light" />
                </div>
                <div className="mt-3 space-y-2">
                  <div className="h-3 w-full rounded bg-pb-light" />
                  <div className="h-3 w-5/6 rounded bg-pb-light" />
                </div>
                <div className="mt-5 h-11 rounded-xl bg-pb-light" />
              </div>
            ))}
          </div>
        ) : records.length === 0 && !error ? (
          <div className="animate-fade-up mt-4 flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#d9d2c3] bg-white/70 px-5 py-14 text-center backdrop-blur-sm">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-pb-light text-pb-khaki">
              <InboxIcon className="h-6 w-6" />
            </span>
            <h2 className="text-base font-extrabold text-pb-green sm:text-lg">
              घडामोडी उपलब्ध नाहीत
            </h2>
            <p className="max-w-md text-sm text-slate-500">
              शोध किंवा विभाग बदलून पाहा.
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="group mt-1 inline-flex min-h-11 items-center gap-2 rounded-xl border border-pb-border bg-white px-4 py-2.5 text-sm font-bold text-pb-khaki transition-all duration-200 hover:-translate-y-0.5 hover:border-pb-khaki hover:bg-pb-light hover:shadow-sm active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none"
              >
                <RefreshIcon className="h-4 w-4" />
                फिल्टर काढा
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {records.map((record, index) => (
                <NewsCard key={record.id} record={record} index={index} />
              ))}
            </div>
            <Pagination
              page={page}
              pages={pagination.pages}
              onChange={setPage}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default CurrentAffairs;