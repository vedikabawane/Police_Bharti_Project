import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

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

const ClipboardCheckIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M8 4H5.5A1.5 1.5 0 0 0 4 5.5v14A1.5 1.5 0 0 0 5.5 21h13a1.5 1.5 0 0 0 1.5-1.5v-14A1.5 1.5 0 0 0 18.5 4H16" />
    <path d="M9 3h6v4H9zM8 13l2.5 2.5L16 10" />
  </svg>
);
const BookIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 0-2 2Z" />
    <path d="M18 3v18" />
  </svg>
);
const FileStackIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M8 4h9a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H8Z" />
    <path d="M5 8v10a2 2 0 0 0 2 2" />
    <path d="M11 8h5M11 12h5" />
  </svg>
);
const RunIcon = (p) => (
  <svg {...iconProps} {...p}>
    <circle cx="15" cy="4.5" r="1.8" />
    <path d="m5 20 3-6 3 2 3-1" />
    <path d="m13 10-3 3-3-5" />
    <path d="M14 15l3 5" />
  </svg>
);
const GlobeIcon = (p) => (
  <svg {...iconProps} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.5 3 2.5 15 0 18M12 3c-2.5 3-2.5 15 0 18" />
  </svg>
);
const TrendingUpIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="m3 17 5-5 4 3 8-8" />
    <path d="M14 7h6v6" />
  </svg>
);
const MegaphoneIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1Z" />
    <path d="M14 7a5 5 0 0 1 0 10M17 4a9 9 0 0 1 0 16" />
  </svg>
);
const BotIcon = (p) => (
  <svg {...iconProps} {...p}>
    <rect x="4" y="8" width="16" height="12" rx="3" />
    <path d="M12 4v4M9 14h.01M15 14h.01" />
    <path d="M2 13v2M22 13v2" />
  </svg>
);
const ShieldIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M12 3 5 6v5c0 4.6 2.8 8.1 7 10 4.2-1.9 7-5.4 7-10V6l-7-3Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);
const SparklesIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.3 6.3l2.8 2.8M14.9 14.9l2.8 2.8M17.7 6.3l-2.8 2.8M9.1 14.9l-2.8 2.8" />
  </svg>
);
const PlayCircleIcon = (p) => (
  <svg {...iconProps} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m10 8 6 4-6 4Z" />
  </svg>
);
const ArrowRightIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M5 12h14" />
    <path d="m13 6 6 6-6 6" />
  </svg>
);

const modules = [
  {
    to: "/student/tests",
    icon: ClipboardCheckIcon,
    title: "सराव चाचण्या",
    subtitle: "Practice Tests",
    description: "Subject, topic आणि mock tests सोडवा.",
    badge: "सराव",
    badgeColor:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
    iconBg: "from-emerald-500 to-emerald-700",
  },
  {
    to: "/student/study",
    icon: BookIcon,
    title: "अभ्यास साहित्य",
    subtitle: "Study Material",
    description: "विषयानुसार notes आणि learning material.",
    badge: "अभ्यास",
    badgeColor: "border-amber-200 bg-amber-50 text-amber-700",
    iconBg: "from-amber-500 to-amber-700",
  },
  {
    to: "/student/previous-year",
    icon: FileStackIcon,
    title: "मागील प्रश्नपत्रिका",
    subtitle: "PYQ Papers",
    description: "मागील वर्षांचे प्रश्न आणि explanations.",
    badge: "PYQ",
    badgeColor: "border-blue-200 bg-blue-50 text-blue-700",
    iconBg: "from-blue-500 to-blue-700",
  },
  {
    to: "/student/physical",
    icon: RunIcon,
    title: "शारीरिक चाचणी",
    subtitle: "Physical Tracking",
    description: "Running, Shot put आणि physical तयारी track करा.",
    badge: "ग्राउंड",
    badgeColor: "border-red-200 bg-red-50 text-red-700",
    iconBg: "from-red-500 to-red-700",
  },
  {
    to: "/student/current-affairs",
    icon: GlobeIcon,
    title: "चालू घडामोडी",
    subtitle: "Current Affairs",
    description: "दैनिक आणि मासिक महत्त्वाच्या घडामोडी.",
    badge: "अपडेट",
    badgeColor: "border-purple-200 bg-purple-50 text-purple-700",
    iconBg: "from-purple-500 to-purple-700",
  },
  {
    to: "/student/performance",
    icon: TrendingUpIcon,
    title: "कामगिरी विश्लेषण",
    subtitle: "Performance",
    description: "Score, अचूकता आणि प्रगतीचा आलेख.",
    badge: "प्रगती",
    badgeColor: "border-teal-200 bg-teal-50 text-teal-700",
    iconBg: "from-teal-500 to-teal-700",
  },
  {
    to: "/student/recruitment-notices",
    icon: MegaphoneIcon,
    title: "भरती सूचना",
    subtitle: "Notices",
    description: "अधिकृत जाहिराती आणि परीक्षा अपडेट्स.",
    badge: "GR/सूचना",
    badgeColor: "border-orange-200 bg-orange-50 text-orange-700",
    iconBg: "from-orange-500 to-orange-700",
  },
  {
    to: "/student/ai-assistant",
    icon: BotIcon,
    title: "AI सहाय्यक",
    subtitle: "Marathi AI",
    description: "पोलीस भरती संशय व प्रश्नांची उत्तरे मिळवा.",
    badge: "मराठी AI",
    badgeColor: "border-indigo-200 bg-indigo-50 text-indigo-700",
    iconBg: "from-indigo-500 to-indigo-700",
  },
];

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
      @keyframes shimmer {
        0% { transform: translateX(-120%); }
        100% { transform: translateX(220%); }
      }
      .animate-blob { animation: blobMove 22s ease-in-out infinite; }
      .delay-2 { animation-delay: 4s; }
      .delay-4 { animation-delay: 8s; }
      .animate-fade-up { animation: fadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }
      .animate-gradient { background-size: 220% 220%; animation: gradientPan 9s ease infinite; }
      .animate-soft-glow { animation: softGlow 4.5s ease-in-out infinite; }
      .animate-shimmer { animation: shimmer 3.2s ease-in-out infinite; }
      @media (prefers-reduced-motion: reduce) {
        .animate-blob, .animate-fade-up, .animate-gradient,
        .animate-soft-glow, .animate-shimmer { animation: none !important; }
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

/* ---------- MODULE CARD ---------- */
function ModuleCard({ module, index = 0 }) {
  const Icon = module.icon;

  return (
    <Link
      to={module.to}
      className="animate-fade-up group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-pb-border bg-white/90 shadow-[0_1px_3px_rgba(15,23,42,0.04)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-pb-khaki/40 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:ring-offset-2 focus-visible:outline-none"
      style={{ animationDelay: `${Math.min(index * 50, 400)}ms` }}
    >
      {/* Top gradient accent */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-pb-green via-pb-khaki to-pb-green opacity-70"
      />

      {/* Decorative blob */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-pb-khaki/10 blur-2xl transition-opacity duration-300 group-hover:bg-pb-khaki/20"
      />

      <div className="relative flex flex-1 flex-col p-4 sm:p-5">
        {/* Header: icon + badge */}
        <div className="flex items-start justify-between gap-2">
          <span
            className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${module.iconBg} text-white shadow-md transition-transform duration-300 group-hover:scale-105 sm:h-12 sm:w-12`}
          >
            <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
          </span>

          <span
            className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-extrabold tracking-wide uppercase sm:text-[10px] ${module.badgeColor}`}
          >
            {module.badge}
          </span>
        </div>

        {/* Body */}
        <div className="mt-3.5 flex-1">
          <h3 className="text-sm leading-snug font-extrabold break-words text-pb-green transition-colors duration-200 group-hover:text-pb-khaki sm:text-base">
            {module.title}
          </h3>
          <p className="mt-0.5 text-[10px] font-semibold tracking-wide text-slate-400 uppercase sm:text-xs">
            {module.subtitle}
          </p>
          <p className="mt-2 hidden text-xs leading-5 text-slate-500 sm:line-clamp-2">
            {module.description}
          </p>
        </div>

        {/* Footer */}
        <div className="mt-3 flex items-center justify-between border-t border-pb-border-soft pt-3 text-[10px] font-extrabold tracking-wide text-pb-khaki uppercase sm:mt-4 sm:text-xs">
          <span className="inline-flex items-center gap-1.5">
            <PlayCircleIcon className="h-3 w-3 shrink-0" />
            सुरू करा
          </span>
          <ArrowRightIcon className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}

function StudentDashboard() {
  const { user } = useAuth();

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-pb-light pb-12">
      <AnimationStyles />
      <AnimatedBackground />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">

        {/* ======================================
            HERO GREETING BANNER
        ====================================== */}
        <div className="animate-fade-up relative overflow-hidden rounded-2xl bg-gradient-to-br from-pb-green via-[#1f2b18] to-[#141d10] p-5 text-white shadow-lg sm:rounded-3xl sm:p-8">
          {/* Animated top accent */}
          <span
            aria-hidden="true"
            className="animate-gradient pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-pb-khaki via-[#e1d37f] to-pb-khaki"
          />

          {/* Decorative glows */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-12 -right-12 h-48 w-48 rounded-full bg-pb-khaki/20 blur-2xl sm:h-64 sm:w-64"
          />
          <div
            aria-hidden="true"
            className="animate-blob pointer-events-none absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-pb-green/20 blur-3xl"
          />

          {/* Shimmer sweep */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="animate-shimmer absolute top-0 left-0 h-full w-1/4 -skew-x-12 bg-gradient-to-r from-transparent via-white/8 to-transparent" />
          </div>

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              {/* Badge */}
              <div className="inline-flex items-center gap-1.5 rounded-full border border-pb-khaki/40 bg-pb-khaki/20 px-3 py-1 text-[10px] font-bold tracking-wide text-[#d7c56f] backdrop-blur-sm sm:text-xs">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#d7c56f] opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#d7c56f]" />
                </span>
                <span className="uppercase">पोलीस भरती २०२६ तयारी</span>
              </div>

              {/* Greeting */}
              <h1 className="mt-3 text-xl leading-tight font-extrabold tracking-tight break-words sm:text-3xl">
                नमस्कार, {user?.name || "विद्यार्थी"} 👋
              </h1>

              <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-300 sm:text-sm sm:leading-6">
                वर्दीचे स्वप्न पूर्ण करण्यासाठी दररोज सातत्याने सराव आणि अभ्यास करत
                राहा.
              </p>

              {/* Quick Action Buttons */}
              <div className="mt-5 flex flex-wrap items-center gap-2 sm:gap-3">
                <Link
                  to="/student/tests"
                  className="group inline-flex min-h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-pb-khaki to-[#c9b95f] px-4 py-2.5 text-xs font-extrabold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 focus-visible:ring-2 focus-visible:ring-[#e1d37f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1f2b18] focus-visible:outline-none sm:text-sm"
                >
                  <ClipboardCheckIcon className="h-4 w-4" />
                  चाचणी सुरू करा
                </Link>
                <Link
                  to="/student/study"
                  className="group inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-xs font-bold text-white backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/20 hover:shadow-md active:translate-y-0 focus-visible:ring-2 focus-visible:ring-[#e1d37f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1f2b18] focus-visible:outline-none sm:text-sm"
                >
                  <BookIcon className="h-4 w-4" />
                  अभ्यास साहित्य
                </Link>
              </div>
            </div>

            {/* Shield icon block */}
            <div className="relative hidden shrink-0 items-center justify-center sm:flex">
              <span className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white shadow-inner backdrop-blur-sm">
                <span
                  aria-hidden="true"
                  className="animate-soft-glow pointer-events-none absolute -inset-1.5 rounded-3xl bg-pb-khaki/30 blur-lg"
                />
                <ShieldIcon className="relative h-10 w-10" />
              </span>
            </div>
          </div>
        </div>

        {/* ======================================
            MODULES GRID
        ====================================== */}
        <div className="mt-6 sm:mt-8">
          <div className="animate-fade-up flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pb-green/10 text-pb-green">
                <SparklesIcon className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-base leading-tight font-extrabold tracking-tight text-pb-green sm:text-xl">
                  तुमची तयारी Modules
                </h2>
                <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
                  अभ्यास, सराव आणि शारीरिक तयारीचे सर्व विभाग
                </p>
              </div>
            </div>

            <span className="rounded-full border border-pb-border-soft bg-white/80 px-3 py-1 text-[11px] font-bold tabular-nums text-pb-green shadow-sm backdrop-blur-sm sm:text-xs">
              {modules.length} modules
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {modules.map((module, index) => (
              <ModuleCard key={module.to} module={module} index={index} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;