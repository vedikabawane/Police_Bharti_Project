import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getContactMessage,
  updateContactMessageNotes,
  updateContactMessageStatus,
} from "../../services/admin/adminSiteContentService";

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
const EyeIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const ReplyIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M9 17H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-6l-4 4v-4Z" />
  </svg>
);
const MessageIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-5 4V5Z" />
    <path d="M8 9h8M8 12h5" />
  </svg>
);
const NoteIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M6 3h9l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
    <path d="M14 3v6h6M8 13h8M8 17h5" />
  </svg>
);
const CheckCircleIcon = (p) => (
  <svg {...iconProps} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m8.5 12 2.5 2.5L16 9.5" />
  </svg>
);
const ClockIcon = (p) => (
  <svg {...iconProps} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);
const ArchiveIcon = (p) => (
  <svg {...iconProps} {...p}>
    <rect x="3" y="4" width="18" height="4" rx="1" />
    <path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8M10 12h4" />
  </svg>
);
const SaveIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M5 3h11l3 3v15H5z" />
    <path d="M8 3v6h7V3M8 17h8" />
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

const statuses = ["READ", "IN_PROGRESS", "REPLIED", "ARCHIVED"];

const statusConfig = {
  READ: {
    label: "Mark Read",
    icon: EyeIcon,
    pillClass: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  },
  IN_PROGRESS: {
    label: "Mark In Progress",
    icon: ClockIcon,
    pillClass: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  },
  REPLIED: {
    label: "Mark Replied",
    icon: ReplyIcon,
    pillClass: "bg-green-50 text-green-700 ring-1 ring-green-200",
  },
  ARCHIVED: {
    label: "Archive",
    icon: ArchiveIcon,
    pillClass: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
  },
};

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

/* ---------- FIELD ROW ---------- */
function FieldRow({ label, value, icon: Icon, isLink, href, wide }) {
  return (
    <div className={`min-w-0 rounded-xl border border-pb-border-soft bg-white/60 p-3.5 transition-colors duration-200 hover:bg-white ${wide ? "sm:col-span-2" : ""}`}>
      <dt className="flex items-center gap-2 text-[10px] font-bold tracking-wide text-slate-500 uppercase">
        {Icon && (
          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-pb-green/10 text-pb-green">
            <Icon className="h-3 w-3" />
          </span>
        )}
        {label}
      </dt>
      <dd className="mt-1.5 text-sm font-semibold break-words text-pb-green">
        {isLink && value ? (
          <a
            href={href}
            className="underline decoration-pb-khaki decoration-1 underline-offset-2 transition-colors hover:text-pb-khaki"
          >
            {value}
          </a>
        ) : (
          value || "—"
        )}
      </dd>
    </div>
  );
}

function AdminContactMessageDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    getContactMessage(id)
      .then(({ data }) => {
        if (alive) {
          setItem(data);
          setNotes(data.admin_notes || "");
        }
      })
      .catch(() => {
        if (alive) setError("संदेश उघडता आला नाही.");
      });
    return () => {
      alive = false;
    };
  }, [id]);

  const changeStatus = async (status) => {
    setSaving(true);
    setError("");
    try {
      const { data } = await updateContactMessageStatus(id, status);
      setItem(data);
    } catch {
      setError("स्थिती बदलता आली नाही.");
    } finally {
      setSaving(false);
    }
  };

  const saveNotes = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const { data } = await updateContactMessageNotes(id, notes);
      setItem(data);
    } catch {
      setError("टीप सेव्ह करता आली नाही.");
    } finally {
      setSaving(false);
    }
  };

  /* ---------- LOADING / ERROR ---------- */
  if (!item) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-pb-light">
        <AnimationStyles />
        <AnimatedBackground />
        <div className="relative z-10 mx-auto flex min-h-screen max-w-4xl items-center justify-center px-4 sm:px-6 lg:px-8">
          {error ? (
            <div
              role="alert"
              className="animate-fade-up flex w-full max-w-md flex-col items-center gap-3 rounded-2xl border border-red-200 bg-white/90 p-6 text-center backdrop-blur-sm"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                <AlertIcon className="h-6 w-6" />
              </span>
              <p className="text-sm font-semibold text-red-700">{error}</p>
              <Link
                to="/admin/site-content/contact-messages"
                className="mt-1 inline-flex min-h-11 items-center gap-2 rounded-xl border border-pb-border bg-white px-5 py-2.5 text-sm font-bold text-pb-green transition-all duration-200 hover:-translate-y-0.5 hover:border-pb-khaki hover:bg-pb-light hover:shadow-sm active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                All messages
              </Link>
            </div>
          ) : (
            <div
              role="status"
              className="animate-fade-up flex flex-col items-center gap-3 rounded-2xl border border-pb-border bg-white/85 px-8 py-10 text-center backdrop-blur-sm"
            >
              <SpinnerIcon className="animate-spin-soft h-10 w-10 text-pb-khaki" />
              <p className="text-sm font-semibold text-pb-green">लोड होत आहे...</p>
              <p className="text-xs text-slate-500">Opening contact message.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const currentStatus = statusConfig[item.status] || statusConfig.READ;
  const CurrentStatusIcon = currentStatus.icon;

  return (
    <div className="relative min-h-screen overflow-hidden bg-pb-light">
      <AnimationStyles />
      <AnimatedBackground />

      <div className="relative z-10 mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">

        {/* ================= BACK LINK ================= */}
        <Link
          to="/admin/site-content/contact-messages"
          className="group animate-fade-up inline-flex min-h-11 items-center gap-2 rounded-xl border border-pb-border bg-white/85 px-4 py-2.5 text-sm font-bold text-pb-green shadow-sm backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-pb-khaki hover:bg-pb-light hover:shadow-md active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none"
        >
          <ArrowLeftIcon className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
          All messages
        </Link>

        {/* ================= PAGE HEADER ================= */}
        <div
          className="animate-fade-up mt-4 overflow-hidden rounded-2xl border border-pb-border/50 bg-white/85 shadow-sm backdrop-blur-sm"
          style={{ animationDelay: "60ms" }}
        >
          <span
            aria-hidden="true"
            className="animate-gradient pointer-events-none block h-1 w-full bg-gradient-to-r from-pb-green via-pb-khaki to-pb-green"
          />
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
            <div className="flex min-w-0 items-start gap-4">
              <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-pb-green to-[#0f3d2e] text-white shadow-md">
                <span
                  aria-hidden="true"
                  className="animate-soft-glow pointer-events-none absolute -inset-1 rounded-3xl bg-pb-khaki/30 blur-md"
                />
                <InboxIcon className="relative h-6 w-6" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold tracking-[0.16em] text-pb-khaki uppercase sm:text-xs">
                  Contact message
                </p>
                <h1 className="mt-1 text-xl leading-tight font-extrabold tracking-tight break-words text-pb-green sm:text-2xl lg:text-3xl">
                  {item.subject}
                </h1>
              </div>
            </div>

            {/* Current status pill */}
            <span
              className={`inline-flex shrink-0 items-center gap-1.5 self-start rounded-full px-3 py-1.5 text-xs font-extrabold ${currentStatus.pillClass}`}
            >
              <CurrentStatusIcon className="h-3.5 w-3.5" />
              {item.status}
            </span>
          </div>
        </div>

        {/* ================= ERROR ================= */}
        {error && (
          <div
            role="alert"
            className="animate-fade-up mt-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
          >
            <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="min-w-0 break-words">{error}</span>
          </div>
        )}

        {/* ================= INFO CARD ================= */}
        <dl className="animate-fade-up mt-5 grid gap-3 rounded-2xl border border-pb-border bg-white/90 p-5 shadow-sm backdrop-blur-sm sm:grid-cols-2 sm:p-6" style={{ animationDelay: "120ms" }}>
          <FieldRow label="Name" value={item.name} icon={UserIcon} />
          <FieldRow
            label="Email"
            value={item.email}
            icon={MailIcon}
            isLink
            href={`mailto:${item.email}`}
          />
          <FieldRow label="Mobile" value={item.mobile} icon={PhoneIcon} />
          <FieldRow
            label="Created"
            value={new Date(item.created_at).toLocaleString()}
            icon={CalendarIcon}
          />
          <FieldRow
            label="Read"
            value={item.read_at ? new Date(item.read_at).toLocaleString() : "—"}
            icon={EyeIcon}
          />
          <FieldRow
            label="Replied"
            value={item.replied_at ? new Date(item.replied_at).toLocaleString() : "—"}
            icon={ReplyIcon}
          />

          {/* Message */}
          <div className="min-w-0 rounded-xl border border-pb-border-soft bg-white/60 p-3.5 sm:col-span-2">
            <dt className="flex items-center gap-2 text-[10px] font-bold tracking-wide text-slate-500 uppercase">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-pb-green/10 text-pb-green">
                <MessageIcon className="h-3 w-3" />
              </span>
              Message
            </dt>
            <dd className="mt-2 rounded-lg bg-pb-light/70 p-4 text-sm leading-7 break-words whitespace-pre-wrap text-pb-green">
              {item.message}
            </dd>
          </div>
        </dl>

        {/* ================= STATUS UPDATE ================= */}
        <section
          className="animate-fade-up mt-5 overflow-hidden rounded-2xl border border-pb-border bg-white/90 shadow-sm backdrop-blur-sm"
          style={{ animationDelay: "180ms" }}
        >
          <div className="flex items-center gap-2.5 border-b border-pb-border-soft bg-pb-light/50 px-5 py-4 sm:px-6">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pb-green/10 text-pb-green">
              <CheckCircleIcon className="h-4 w-4" />
            </span>
            <h2 className="text-base leading-tight font-extrabold tracking-tight text-pb-green sm:text-lg">
              Update status
            </h2>
          </div>

          <div className="p-5 sm:p-6">
            <div className="flex flex-wrap gap-2.5">
              {statuses.map((status) => {
                const cfg = statusConfig[status];
                const Icon = cfg.icon;
                const isCurrent = item.status === status;
                return (
                  <button
                    key={status}
                    type="button"
                    disabled={saving || isCurrent}
                    onClick={() => changeStatus(status)}
                    aria-pressed={isCurrent}
                    className={`group inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition-all duration-200 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:hover:translate-y-0 ${
                      isCurrent
                        ? "border-pb-green bg-pb-green/10 text-pb-green"
                        : "border-pb-border bg-white text-pb-green hover:-translate-y-0.5 hover:border-pb-khaki hover:bg-pb-light hover:shadow-sm active:translate-y-0 disabled:opacity-50"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{cfg.label}</span>
                    {isCurrent && (
                      <span className="ml-0.5 inline-flex items-center gap-1 rounded-full bg-pb-green/15 px-2 py-0.5 text-[10px] font-extrabold text-pb-green uppercase">
                        Current
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* ================= NOTES FORM ================= */}
        <form
          onSubmit={saveNotes}
          className="animate-fade-up mt-5 overflow-hidden rounded-2xl border border-pb-border bg-white/90 shadow-sm backdrop-blur-sm"
          style={{ animationDelay: "240ms" }}
        >
          <div className="flex items-center gap-2.5 border-b border-pb-border-soft bg-pb-light/50 px-5 py-4 sm:px-6">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pb-khaki/15 text-pb-khaki">
              <NoteIcon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h2 className="text-base leading-tight font-extrabold tracking-tight text-pb-green sm:text-lg">
                Private admin notes
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Only visible to admins — not shown to the sender.
              </p>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <label
              htmlFor="admin-notes"
              className="sr-only"
            >
              Private admin notes
            </label>
            <textarea
              id="admin-notes"
              maxLength={5000}
              rows={4}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Add an internal note about this message…"
              className="w-full resize-y rounded-xl border border-pb-border bg-white px-4 py-3 text-sm text-pb-green transition-all duration-200 outline-none placeholder:text-slate-400 focus:border-pb-khaki focus:ring-4 focus:ring-pb-khaki/15"
            />

            <div className="mt-3 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500 tabular-nums">
                {notes.length} / 5000 characters
              </p>
              <button
                type="submit"
                disabled={saving}
                className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pb-green to-[#0f3d2e] px-5 py-2.5 text-sm font-extrabold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:from-pb-khaki hover:to-[#c9b95f] hover:shadow-lg active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-wait disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {saving ? (
                  <>
                    <SpinnerIcon className="animate-spin-soft h-4 w-4" />
                    Saving…
                  </>
                ) : (
                  <>
                    <SaveIcon className="h-4 w-4" />
                    Save notes
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminContactMessageDetail;