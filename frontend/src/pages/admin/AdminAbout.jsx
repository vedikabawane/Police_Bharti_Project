import { useEffect, useState } from "react";
import {
  getAbout,
  saveAbout,
  updateAboutStatus,
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

const InfoIcon = (p) => (
  <svg {...iconProps} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" />
  </svg>
);
const ShieldIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M12 3 5 6v5c0 4.6 2.8 8.1 7 10 4.2-1.9 7-5.4 7-10V6l-7-3Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);
const EyeIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const EyeOffIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M3 3l18 18" />
    <path d="M10.6 6.2A10.9 10.9 0 0 1 12 6c6.5 0 10 7 10 7a17.6 17.6 0 0 1-3 4" />
    <path d="M6.6 6.6A17.5 17.5 0 0 0 2 12s3.5 7 10 7a10.4 10.4 0 0 0 4.4-.9" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
  </svg>
);
const SaveIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M5 3h11l3 3v15H5z" />
    <path d="M8 3v6h7V3M8 17h8" />
  </svg>
);
const SpinnerIcon = (p) => (
  <svg {...iconProps} strokeWidth="2.4" {...p}>
    <path d="M21 12a9 9 0 1 1-6.2-8.5" />
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
const SparklesIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.3 6.3l2.8 2.8M14.9 14.9l2.8 2.8M17.7 6.3l-2.8 2.8M9.1 14.9l-2.8 2.8" />
  </svg>
);
const TargetIcon = (p) => (
  <svg {...iconProps} {...p}>
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="12" cy="12" r="1" />
  </svg>
);
const CompassIcon = (p) => (
  <svg {...iconProps} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" />
  </svg>
);
const BookIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 0-2 2Z" />
    <path d="M18 3v18" />
  </svg>
);
const ClipboardIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M8 4H5.5A1.5 1.5 0 0 0 4 5.5v14A1.5 1.5 0 0 0 5.5 21h13a1.5 1.5 0 0 0 1.5-1.5v-14A1.5 1.5 0 0 0 18.5 4H16" />
    <path d="M9 3h6v4H9zM8 13l2.5 2.5L16 10" />
  </svg>
);
const ActivityIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M3 12h3l2-6 4 12 3-9 2 3h4" />
    <path d="M3 20h18" />
  </svg>
);
const GlobeIcon = (p) => (
  <svg {...iconProps} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.5 3 2.5 15 0 18M12 3c-2.5 3-2.5 15 0 18" />
  </svg>
);
const NewspaperIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M4 5h13a2 2 0 0 1 2 2v11a2 2 0 0 0 2 2H6a2 2 0 0 1-2-2Z" />
    <path d="M8 9h8M8 13h8M8 17h5" />
  </svg>
);
const BotIcon = (p) => (
  <svg {...iconProps} {...p}>
    <rect x="4" y="8" width="16" height="12" rx="3" />
    <path d="M12 4v4M9 14h.01M15 14h.01" />
    <path d="M2 13v2M22 13v2" />
  </svg>
);
const ChartIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M3 3v18h18" />
    <path d="m7 14 3-3 3 3 5-6" />
  </svg>
);
const GiftIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M4 10h16v10H4zM2 7h20v3H2zM12 7v13" />
    <path d="M8 7a2 2 0 1 1 2-2c0 1.5 1 2 2 2M16 7a2 2 0 1 0-2-2c0 1.5-1 2-2 2" />
  </svg>
);
const PhoneIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M4 6a2 2 0 0 1 2-2h2l2 5-2 1a12 12 0 0 0 6 6l1-2 5 2v2a2 2 0 0 1-2 2A16 16 0 0 1 4 6Z" />
  </svg>
);
const TextIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M4 7V5h16v2M9 5v14M7 19h4" />
    <path d="M14 12h6M17 9v6" />
  </svg>
);

/* ---------- FIELD CONFIG WITH SECTIONS ---------- */
const fields = [
  ["hero_title", "Hero title", 200, "hero", TextIcon],
  ["hero_subtitle", "Hero subtitle", 500, "hero", TextIcon],
  ["introduction", "Introduction", 5000, "story", InfoIcon],
  ["purpose", "Purpose", 3000, "story", TargetIcon],
  ["mission", "Mission", 3000, "story", ShieldIcon],
  ["vision", "Vision", 3000, "story", CompassIcon],
  ["study_features", "Study features", 3000, "features", BookIcon],
  ["test_features", "Tests and practice", 3000, "features", ClipboardIcon],
  ["physical_training_info", "Physical training", 3000, "features", ActivityIcon],
  ["current_affairs_info", "Current affairs", 3000, "features", GlobeIcon],
  ["recruitment_info", "Recruitment information", 3000, "features", NewspaperIcon],
  ["ai_assistant_info", "AI assistant", 3000, "features", BotIcon],
  ["performance_info", "Performance tracking", 3000, "features", ChartIcon],
  ["free_platform_info", "Free platform information", 3000, "features", GiftIcon],
  ["contact_cta", "Contact call to action", 1000, "cta", PhoneIcon],
];

const blank = Object.fromEntries(fields.map(([key]) => [key, ""]));

const SECTIONS = [
  {
    id: "hero",
    label: "Hero section",
    description: "The main title and subtitle shown at the top of the About page.",
    icon: SparklesIcon,
  },
  {
    id: "story",
    label: "Story & vision",
    description: "Your introduction, purpose, mission, and vision for the platform.",
    icon: InfoIcon,
  },
  {
    id: "features",
    label: "Platform features",
    description: "What the platform offers — study, tests, physical, AI, and more.",
    icon: BookIcon,
  },
  {
    id: "cta",
    label: "Contact call to action",
    description: "The closing message that invites visitors to get in touch.",
    icon: PhoneIcon,
  },
];

const inputClass =
  "mt-2 w-full rounded-xl border border-pb-border bg-white px-4 py-3 text-sm font-normal text-pb-green transition-all duration-200 outline-none placeholder:text-slate-400 focus:border-pb-khaki focus:ring-4 focus:ring-pb-khaki/15 disabled:cursor-not-allowed disabled:bg-slate-100";

function AdminAbout() {
  const [form, setForm] = useState(blank);
  const [exists, setExists] = useState(false);
  const [active, setActive] = useState(true);
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

  useEffect(() => {
    getAbout()
      .then(({ data }) => {
        if (data) {
          setForm(
            Object.fromEntries(fields.map(([key]) => [key, data[key] || ""])),
          );
          setExists(true);
          setActive(data.is_active);
        }
      })
      .catch(() => {
        setMessage("माहिती लोड करता आली नाही.");
        setMessageType("error");
      })
      .finally(() => setBusy(false));
  }, []);

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const { data } = await saveAbout(form, exists);
      setForm(
        Object.fromEntries(fields.map(([key]) => [key, data[key] || ""])),
      );
      setExists(true);
      setActive(data.is_active);
      setMessage("About page saved.");
      setMessageType("success");
    } catch (error) {
      setMessage(
        error.response?.status === 422
          ? "कृपया प्रत्येक मजकूर मर्यादेत भरा."
          : "सेव्ह करता आले नाही. पुन्हा प्रयत्न करा.",
      );
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async () => {
    try {
      const next = !active;
      await updateAboutStatus(next);
      setActive(next);
      setMessage(next ? "About page published." : "About page hidden.");
      setMessageType("success");
    } catch {
      setMessage("स्थिती बदलता आली नाही.");
      setMessageType("error");
    }
  };

  /* ---------- ANIMATION KEYFRAMES ---------- */
  const animations = (
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

  /* ---------- LOADING ---------- */
  if (busy) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-pb-light">
        {animations}
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
        </div>
        <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl items-center justify-center px-4 sm:px-6 lg:px-8">
          <div
            role="status"
            className="animate-fade-up flex flex-col items-center gap-3 rounded-2xl border border-pb-border bg-white/85 px-8 py-10 text-center backdrop-blur-sm"
          >
            <SpinnerIcon className="animate-spin-soft h-10 w-10 text-pb-khaki" />
            <p className="text-sm font-semibold text-pb-green">लोड होत आहे...</p>
            <p className="text-xs text-slate-500">Fetching About page content.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-pb-light">
      {animations}

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
      <div className="relative z-10 mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">

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
                <InfoIcon className="relative h-6 w-6" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold tracking-[0.16em] text-pb-khaki uppercase sm:text-xs">
                  Site Content
                </p>
                <h1 className="mt-1 text-xl leading-tight font-extrabold tracking-tight text-pb-green sm:text-2xl lg:text-3xl">
                  About page
                </h1>
                <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-600 sm:text-sm">
                  Manage every section of the public About page.
                </p>
              </div>
            </div>

            {/* Visibility toggle */}
            {exists && (
              <button
                type="button"
                onClick={toggle}
                aria-pressed={active}
                className={`group inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none sm:w-auto ${
                  active
                    ? "border-pb-border bg-white text-pb-green hover:border-pb-khaki hover:bg-pb-light"
                    : "border-pb-khaki bg-pb-khaki text-white hover:bg-pb-green"
                }`}
              >
                {active ? (
                  <EyeOffIcon className="h-4 w-4" />
                ) : (
                  <EyeIcon className="h-4 w-4" />
                )}
                {active ? "Hide page" : "Publish page"}
              </button>
            )}
          </div>
        </div>

        {/* ================= MESSAGE ================= */}
        {message && (
          <div
            role={messageType === "error" ? "alert" : "status"}
            className={`animate-fade-up mb-5 flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm font-semibold ${
              messageType === "error"
                ? "border-red-200 bg-red-50 text-red-700"
                : messageType === "success"
                  ? "border-green-200 bg-green-50 text-green-800"
                  : "border-pb-border bg-pb-light text-pb-green"
            }`}
          >
            {messageType === "error" ? (
              <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <span className="min-w-0 break-words">{message}</span>
          </div>
        )}

        {/* ================= STATUS STRIP ================= */}
        {exists && (
          <div className="animate-fade-up mb-5 flex items-center justify-between gap-3 rounded-2xl border border-pb-border bg-white/80 px-4 py-3 backdrop-blur-sm sm:px-5">
            <div className="flex items-center gap-3">
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                  active
                    ? "bg-green-50 text-green-600"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                <ShieldIcon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold tracking-[0.14em] text-slate-500 uppercase">
                  Visibility
                </p>
                <p className="mt-0.5 text-sm font-bold text-pb-green">
                  {active ? "About page is live" : "About page is hidden"}
                </p>
              </div>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-extrabold ${
                active
                  ? "bg-green-50 text-green-700 ring-1 ring-green-200"
                  : "bg-slate-100 text-slate-600 ring-1 ring-slate-200"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  active ? "bg-green-500" : "bg-slate-400"
                }`}
              />
              {active ? "Active" : "Inactive"}
            </span>
          </div>
        )}

        {/* ================= FORM ================= */}
        <form
          onSubmit={save}
          className="animate-fade-up space-y-5"
          style={{ animationDelay: "80ms" }}
        >
          {SECTIONS.map((section, sectionIndex) => {
            const sectionFields = fields.filter(
              ([, , , sectionId]) => sectionId === section.id,
            );
            if (sectionFields.length === 0) return null;
            const SectionIcon = section.icon;

            return (
              <section
                key={section.id}
                className="animate-fade-up overflow-hidden rounded-2xl border border-pb-border bg-white/90 shadow-sm backdrop-blur-sm"
                style={{ animationDelay: `${120 + sectionIndex * 60}ms` }}
              >
                {/* Section header */}
                <div className="flex items-start gap-3 border-b border-pb-border-soft bg-pb-light/50 px-5 py-4 sm:px-6">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-pb-green/10 text-pb-green">
                    <SectionIcon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-sm leading-tight font-extrabold tracking-tight text-pb-green sm:text-base">
                      {section.label}
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {section.description}
                    </p>
                  </div>
                </div>

                {/* Fields */}
                <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
                  {sectionFields.map(([key, label, max, , FieldIcon]) => {
                    const isWide = [
                      "introduction",
                      "purpose",
                      "mission",
                      "vision",
                      "contact_cta",
                    ].includes(key);
                    const rows = key === "hero_title" ? 2 : 4;
                    return (
                      <label
                        key={key}
                        htmlFor={`about-field-${key}`}
                        className={`block text-sm font-bold text-pb-green ${
                          isWide ? "sm:col-span-2" : ""
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-pb-green/10 text-pb-green">
                            <FieldIcon className="h-3.5 w-3.5" />
                          </span>
                          <span className="min-w-0">{label}</span>
                          <span className="ml-auto shrink-0 text-[10px] font-semibold text-slate-400">
                            {max}
                          </span>
                        </span>
                        <textarea
                          id={`about-field-${key}`}
                          required
                          maxLength={max}
                          rows={rows}
                          value={form[key]}
                          onChange={(event) =>
                            setForm({ ...form, [key]: event.target.value })
                          }
                          className={`${inputClass} resize-y`}
                        />
                      </label>
                    );
                  })}
                </div>
              </section>
            );
          })}

          {/* ================= ACTIONS ================= */}
          <div className="animate-fade-up flex flex-col-reverse gap-3 overflow-hidden rounded-2xl border border-pb-border bg-white/90 p-4 shadow-sm backdrop-blur-sm sm:flex-row sm:items-center sm:justify-end sm:p-5">
            <button
              type="submit"
              disabled={saving}
              className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pb-green to-[#0f3d2e] px-5 py-2.5 text-sm font-extrabold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:from-pb-khaki hover:to-[#c9b95f] hover:shadow-lg active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-wait disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {saving ? (
                <>
                  <SpinnerIcon className="animate-spin-soft h-4 w-4" />
                  Saving...
                </>
              ) : (
                <>
                  <SaveIcon className="h-4 w-4" />
                  Save About content
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminAbout;