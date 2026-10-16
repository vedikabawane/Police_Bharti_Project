import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listContactMessages } from "../../services/admin/adminSiteContentService";

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

const InboxIcon = (p) => (
    <svg {...iconProps} {...p}>
        <path d="M3 12h5l1.5 3h5L16 12h5" />
        <path d="M5 5h14l2 7v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6Z" />
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
const EyeIcon = (p) => (
    <svg {...iconProps} {...p}>
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);
const MailIcon = (p) => (
    <svg {...iconProps} {...p}>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m4 7 8 6 8-6" />
    </svg>
);
const UserIcon = (p) => (
    <svg {...iconProps} {...p}>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 20a7 7 0 0 1 14 0" />
    </svg>
);
const PhoneIcon = (p) => (
    <svg {...iconProps} {...p}>
        <path d="M4 6a2 2 0 0 1 2-2h2l2 5-2 1a12 12 0 0 0 6 6l1-2 5 2v2a2 2 0 0 1-2 2A16 16 0 0 1 4 6Z" />
    </svg>
);
const CalendarIcon = (p) => (
    <svg {...iconProps} {...p}>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
);
const MessageIcon = (p) => (
    <svg {...iconProps} {...p}>
        <path d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-5 4V5Z" />
        <path d="M8 9h8M8 12h5" />
    </svg>
);
const ClockIcon = (p) => (
    <svg {...iconProps} {...p}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
    </svg>
);
const ReplyIcon = (p) => (
    <svg {...iconProps} {...p}>
        <path d="M9 17H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-6l-4 4v-4Z" />
    </svg>
);
const ArchiveIcon = (p) => (
    <svg {...iconProps} {...p}>
        <rect x="3" y="4" width="18" height="4" rx="1" />
        <path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8M10 12h4" />
    </svg>
);
const SparklesIcon = (p) => (
    <svg {...iconProps} {...p}>
        <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.3 6.3l2.8 2.8M14.9 14.9l2.8 2.8M17.7 6.3l-2.8 2.8M9.1 14.9l-2.8 2.8" />
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
const ArrowRightIcon = (p) => (
    <svg {...iconProps} {...p}>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
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

const statuses = ["NEW", "READ", "IN_PROGRESS", "REPLIED", "ARCHIVED"];

/* ---------- STATUS CONFIG ---------- */
const statusConfig = {
    NEW: {
        icon: SparklesIcon,
        pillClass: "bg-pb-khaki/15 text-pb-khaki ring-1 ring-pb-khaki/30",
    },
    READ: {
        icon: EyeIcon,
        pillClass: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
    },
    IN_PROGRESS: {
        icon: ClockIcon,
        pillClass: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    },
    REPLIED: {
        icon: ReplyIcon,
        pillClass: "bg-green-50 text-green-700 ring-1 ring-green-200",
    },
    ARCHIVED: {
        icon: ArchiveIcon,
        pillClass: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
    },
};

function StatusPill({ status }) {
    const cfg = statusConfig[status] || statusConfig.NEW;
    const Icon = cfg.icon;
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold tracking-wide uppercase ${cfg.pillClass}`}
        >
            <Icon className="h-3 w-3" />
            {status}
        </span>
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

function AdminContactMessages() {
    const [search, setSearch] = useState("");
    const [query, setQuery] = useState("");
    const [status, setStatus] = useState("");
    const [page, setPage] = useState(1);
    const [data, setData] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        let alive = true;
        listContactMessages({ search: query, status, page, per_page: 20 })
            .then((result) => {
                if (alive) setData(result.data);
            })
            .catch(() => {
                if (alive) setError("संदेश लोड करता आले नाहीत.");
            });
        return () => {
            alive = false;
        };
    }, [query, status, page]);

    const filter = (event) => {
        event.preventDefault();
        setPage(1);
        setQuery(search);
    };

    return (
        <div className="relative min-h-screen overflow-hidden bg-pb-light">
            <AnimationStyles />
            <AnimatedBackground />

            <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">

                {/* ================= PAGE HEADER ================= */}
                <div className="animate-fade-up mb-6 overflow-hidden rounded-2xl border border-pb-border/50 bg-white/85 shadow-sm backdrop-blur-sm">
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
                            <InboxIcon className="relative h-6 w-6" />
                        </span>
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold tracking-[0.16em] text-pb-khaki uppercase sm:text-xs">
                                Site Content
                            </p>
                            <h1 className="mt-1 text-xl leading-tight font-extrabold tracking-tight text-pb-green sm:text-2xl lg:text-3xl">
                                Contact messages
                            </h1>
                            <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-600 sm:text-sm">
                                View and manage messages sent through the contact form.
                            </p>
                        </div>
                    </div>
                </div>

                {/* ================= FILTER FORM ================= */}
                <form
                    onSubmit={filter}
                    className="animate-fade-up overflow-hidden rounded-2xl border border-pb-border bg-white/90 shadow-sm backdrop-blur-sm"
                    style={{ animationDelay: "60ms" }}
                >
                    <div className="flex items-center gap-2.5 border-b border-pb-border-soft bg-pb-light/50 px-5 py-3.5">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-pb-green/10 text-pb-green">
                            <FilterIcon className="h-3.5 w-3.5" />
                        </span>
                        <span className="text-[11px] font-extrabold tracking-[0.14em] text-slate-500 uppercase">
                            Filters
                        </span>
                        <span className="h-px flex-1 bg-gradient-to-r from-pb-border to-transparent" />
                    </div>

                    <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:p-6">
                        <div className="relative min-w-0 flex-1">
                            <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400">
                                <SearchIcon className="h-4 w-4" />
                            </span>
                            <input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search name, email, phone, subject or message"
                                className="w-full rounded-xl border border-pb-border bg-white py-3 pr-4 pl-10 text-sm text-pb-green transition-all duration-200 outline-none placeholder:text-slate-400 focus:border-pb-khaki focus:ring-4 focus:ring-pb-khaki/15"
                            />
                        </div>

                        <select
                            value={status}
                            onChange={(event) => {
                                setStatus(event.target.value);
                                setPage(1);
                            }}
                            className="rounded-xl border border-pb-border bg-white px-4 py-3 text-sm font-semibold text-pb-green transition-all duration-200 outline-none focus:border-pb-khaki focus:ring-4 focus:ring-pb-khaki/15 sm:w-48"
                        >
                            <option value="">All statuses</option>
                            {statuses.map((value) => (
                                <option key={value}>{value}</option>
                            ))}
                        </select>

                        <button
                            type="submit"
                            className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pb-green to-[#0f3d2e] px-5 py-2.5 text-sm font-extrabold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:from-pb-khaki hover:to-[#c9b95f] hover:shadow-lg active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:ring-offset-2 focus-visible:outline-none"
                        >
                            <SearchIcon className="h-4 w-4" />
                            Search
                        </button>
                    </div>
                </form>

                {/* ================= ERROR ================= */}
                {error && (
                    <div
                        role="alert"
                        className="animate-fade-up mt-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
                    >
                        <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
                        <span className="min-w-0 break-words">{error}</span>
                    </div>
                )}

                {/* ================= LOADING / LIST ================= */}
                {!data ? (
                    <div
                        role="status"
                        className="animate-fade-up mt-6 flex flex-col items-center justify-center gap-3 rounded-2xl border border-pb-border bg-white/85 px-5 py-12 text-center backdrop-blur-sm"
                    >
                        <SpinnerIcon className="animate-spin-soft h-10 w-10 text-pb-khaki" />
                        <p className="text-sm font-semibold text-pb-green">
                            Loading messages...
                        </p>
                        <p className="text-xs text-slate-500">Fetching contact inbox.</p>
                    </div>
                ) : (
                    <>
                        {/* ---------- Mobile cards ---------- */}
                        <div className="mt-5 grid gap-3 lg:hidden">
                            {data.items.length ? (
                                data.items.map((row, index) => (
                                    <article
                                        key={row.id}
                                        className="animate-fade-up group relative min-w-0 overflow-hidden rounded-2xl border border-pb-border bg-white/90 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-pb-khaki/40 hover:shadow-md"
                                        style={{ animationDelay: `${Math.min(index * 40, 400)}ms` }}
                                    >
                                        <span
                                            aria-hidden="true"
                                            className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-pb-green via-pb-khaki to-pb-green opacity-70"
                                        />

                                        <div className="p-4">
                                            {/* Header: name + status pill */}
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex min-w-0 items-center gap-2.5">
                                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-pb-green to-[#0f3d2e] text-sm font-extrabold text-white shadow-sm">
                                                        {row.name?.trim()?.charAt(0)?.toUpperCase() || "?"}
                                                    </span>
                                                    <div className="min-w-0">
                                                        <h2 className="text-sm leading-tight font-extrabold break-words text-pb-green">
                                                            {row.name}
                                                        </h2>
                                                        <a
                                                            href={`mailto:${row.email}`}
                                                            className="mt-0.5 block text-xs break-all text-slate-500 underline decoration-pb-khaki decoration-1 underline-offset-2 transition-colors hover:text-pb-khaki"
                                                        >
                                                            {row.email}
                                                        </a>
                                                    </div>
                                                </div>
                                                <StatusPill status={row.status} />
                                            </div>

                                            {/* Info rows */}
                                            <dl className="mt-3.5 grid gap-2">
                                                <div className="flex items-start gap-2.5 rounded-lg bg-pb-light/60 px-3 py-2">
                                                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-pb-green/10 text-pb-green">
                                                        <PhoneIcon className="h-3 w-3" />
                                                    </span>
                                                    <div className="min-w-0">
                                                        <dt className="text-[10px] font-bold tracking-wide text-slate-500 uppercase">
                                                            Mobile
                                                        </dt>
                                                        <dd className="mt-0.5 text-sm font-semibold break-words text-pb-green">
                                                            {row.mobile || "—"}
                                                        </dd>
                                                    </div>
                                                </div>

                                                <div className="flex items-start gap-2.5 rounded-lg bg-pb-light/60 px-3 py-2">
                                                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-pb-green/10 text-pb-green">
                                                        <MessageIcon className="h-3 w-3" />
                                                    </span>
                                                    <div className="min-w-0">
                                                        <dt className="text-[10px] font-bold tracking-wide text-slate-500 uppercase">
                                                            Subject
                                                        </dt>
                                                        <dd className="mt-0.5 text-sm font-semibold break-words text-pb-green">
                                                            {row.subject}
                                                        </dd>
                                                    </div>
                                                </div>

                                                <div className="flex items-start gap-2.5 rounded-lg bg-pb-light/60 px-3 py-2">
                                                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-pb-green/10 text-pb-green">
                                                        <CalendarIcon className="h-3 w-3" />
                                                    </span>
                                                    <div className="min-w-0">
                                                        <dt className="text-[10px] font-bold tracking-wide text-slate-500 uppercase">
                                                            Received
                                                        </dt>
                                                        <dd className="mt-0.5 text-sm font-semibold text-pb-green">
                                                            {new Date(row.created_at).toLocaleString()}
                                                        </dd>
                                                    </div>
                                                </div>
                                            </dl>

                                            {/* View link */}
                                            <Link
                                                to={`/admin/site-content/contact-messages/${row.id}`}
                                                className="group/link mt-4 inline-flex min-h-11 w-full items-center justify-between gap-2 rounded-xl border border-pb-border bg-white px-4 py-2.5 text-sm font-bold text-pb-green transition-all duration-200 hover:-translate-y-0.5 hover:border-pb-khaki hover:bg-pb-light hover:shadow-sm active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none"
                                            >
                                                View message
                                                <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 group-hover/link:translate-x-1" />
                                            </Link>
                                        </div>
                                    </article>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#d9d2c3] bg-white/70 px-5 py-14 text-center backdrop-blur-sm">
                                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-pb-light text-pb-khaki">
                                        <InboxIcon className="h-6 w-6" />
                                    </span>
                                    <p className="text-base font-extrabold text-pb-green">
                                        No contact messages found.
                                    </p>
                                    <p className="max-w-md text-sm text-slate-500">
                                        Try changing the filters above.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* ---------- Desktop table ---------- */}
                        <div className="animate-fade-up mt-5 hidden overflow-hidden rounded-2xl border border-pb-border bg-white/90 shadow-sm backdrop-blur-sm lg:block">
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[760px] text-left text-sm">
                                    <thead className="bg-pb-light text-[11px] tracking-wide text-pb-green uppercase">
                                        <tr>
                                            {[
                                                "Name",
                                                "Email",
                                                "Mobile",
                                                "Subject",
                                                "Status",
                                                "Received",
                                                "Action",
                                            ].map((heading) => (
                                                <th
                                                    key={heading}
                                                    scope="col"
                                                    className="px-4 py-3 font-extrabold"
                                                >
                                                    {heading}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-pb-border-soft">
                                        {data.items.length ? (
                                            data.items.map((row) => (
                                                <tr
                                                    key={row.id}
                                                    className="bg-white transition-colors duration-200 odd:bg-white even:bg-pb-light/30 hover:bg-pb-light/60"
                                                >
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2.5">
                                                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-pb-green to-[#0f3d2e] text-xs font-extrabold text-white shadow-sm">
                                                                {row.name?.trim()?.charAt(0)?.toUpperCase() || "?"}
                                                            </span>
                                                            <span className="font-bold text-pb-green">
                                                                {row.name}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <a
                                                            href={`mailto:${row.email}`}
                                                            className="break-all text-slate-600 underline decoration-pb-khaki decoration-1 underline-offset-2 transition-colors hover:text-pb-khaki"
                                                        >
                                                            {row.email}
                                                        </a>
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-600">
                                                        {row.mobile || "—"}
                                                    </td>
                                                    <td className="max-w-56 px-4 py-3">
                                                        <span className="line-clamp-2 font-semibold break-words text-pb-green">
                                                            {row.subject}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <StatusPill status={row.status} />
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                                                        {new Date(row.created_at).toLocaleString()}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <Link
                                                            to={`/admin/site-content/contact-messages/${row.id}`}
                                                            className="group/link inline-flex items-center gap-1.5 rounded-lg border border-pb-border bg-white px-3 py-2 text-xs font-bold text-pb-green transition-all duration-200 hover:-translate-y-0.5 hover:border-pb-khaki hover:bg-pb-light hover:shadow-sm active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none"
                                                        >
                                                            View
                                                            <ArrowRightIcon className="h-3.5 w-3.5 transition-transform duration-300 group-hover/link:translate-x-1" />
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="7" className="px-4 py-12 text-center">
                                                    <div className="flex flex-col items-center justify-center gap-2.5">
                                                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-pb-light text-pb-khaki">
                                                            <InboxIcon className="h-5 w-5" />
                                                        </span>
                                                        <p className="text-sm font-semibold text-slate-500">
                                                            No contact messages found.
                                                        </p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* ---------- Pagination ---------- */}
                        <div className="animate-fade-up mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <span className="rounded-full border border-pb-border-soft bg-white/80 px-4 py-2 text-xs font-bold tabular-nums text-pb-green shadow-sm backdrop-blur-sm sm:text-sm">
                                {data.pagination.total} messages · Page {page} of{" "}
                                {Math.max(data.pagination.pages, 1)}
                            </span>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    disabled={page <= 1}
                                    onClick={() => setPage(page - 1)}
                                    className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-pb-border bg-white px-4 py-2 text-sm font-bold text-pb-green transition-all duration-200 hover:-translate-y-0.5 hover:border-pb-khaki hover:bg-pb-light hover:shadow-sm active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 sm:flex-none"
                                >
                                    <ChevronLeftIcon className="h-4 w-4" />
                                    Previous
                                </button>
                                <button
                                    type="button"
                                    disabled={page >= data.pagination.pages}
                                    onClick={() => setPage(page + 1)}
                                    className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-pb-border bg-white px-4 py-2 text-sm font-bold text-pb-green transition-all duration-200 hover:-translate-y-0.5 hover:border-pb-khaki hover:bg-pb-light hover:shadow-sm active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 sm:flex-none"
                                >
                                    Next
                                    <ChevronRightIcon className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default AdminContactMessages;