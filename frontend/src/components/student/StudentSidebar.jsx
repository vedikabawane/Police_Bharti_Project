import { useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";

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

const ShieldIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M12 3 5 6v5c0 4.6 2.8 8.1 7 10 4.2-1.9 7-5.4 7-10V6l-7-3Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);
const DashboardIcon = (p) => (
  <svg {...iconProps} {...p}>
    <rect x="3" y="3" width="7" height="9" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="12" width="7" height="9" rx="1.5" />
    <rect x="3" y="16" width="7" height="5" rx="1.5" />
  </svg>
);
const BookIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 0-2 2Z" />
    <path d="M18 3v18" />
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
const FileStackIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M8 4h9a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H8Z" />
    <path d="M5 8v10a2 2 0 0 0 2 2" />
    <path d="M11 8h5M11 12h5" />
  </svg>
);
const PencilIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="m4 20 4-1 10-10a2 2 0 0 0-3-3L5 16l-1 4Z" />
    <path d="m14 6 3 3" />
  </svg>
);
const HistoryIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M3 12a9 9 0 1 0 3-6.7" />
    <path d="M3 4v5h5" />
    <path d="M12 8v4l3 2" />
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
const TrendingIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="m3 17 5-5 4 3 8-8" />
    <path d="M14 7h6v6" />
  </svg>
);
const BotIcon = (p) => (
  <svg {...iconProps} {...p}>
    <rect x="4" y="8" width="16" height="12" rx="3" />
    <path d="M12 4v4M9 14h.01M15 14h.01" />
    <path d="M2 13v2M22 13v2" />
  </svg>
);
const BellIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M6 8a6 6 0 1 1 12 0c0 4 1.5 5.5 2 6H4c.5-.5 2-2 2-6Z" />
    <path d="M10 18a2 2 0 0 0 4 0" />
  </svg>
);
const UserIcon = (p) => (
  <svg {...iconProps} {...p}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 20a7 7 0 0 1 14 0" />
  </svg>
);
const TargetIcon = (p) => (
  <svg {...iconProps} {...p}>
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="12" cy="12" r="1" />
  </svg>
);
const CloseIcon = (p) => (
  <svg {...iconProps} strokeWidth="2" {...p}>
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
);

function StudentSidebar({ isOpen, onClose }) {
  const { pathname } = useLocation();

  useEffect(() => {
    if (!isOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen, onClose]);

  const navigationGroups = [
    {
      label: "MAIN",
      items: [
        { label: "Dashboard", icon: DashboardIcon, path: "/student/dashboard" },
      ],
    },
    {
      label: "STUDY",
      items: [
        { label: "अभ्यास साहित्य", icon: BookIcon, path: "/student/study" },
        { label: "चालू घडामोडी", icon: GlobeIcon, path: "/student/current-affairs" },
        { label: "भरती सूचना", icon: NewspaperIcon, path: "/student/recruitment-notices" },
        { label: "मागील वर्षांच्या प्रश्नपत्रिका", icon: FileStackIcon, path: "/student/previous-year" },
      ],
    },
    {
      label: "PRACTICE",
      items: [
        { label: "सराव चाचण्या", icon: PencilIcon, path: "/student/tests" },
        { label: "चाचणी इतिहास", icon: HistoryIcon, path: "/student/tests/history", isSubItem: true },
      ],
    },
    {
      label: "PROGRESS",
      items: [
        { label: "शारीरिक प्रशिक्षण", icon: RunIcon, path: "/student/physical" },
        { label: "कामगिरी", icon: TrendingIcon, path: "/student/performance" },
      ],
    },
    {
      label: "TOOLS",
      items: [
        { label: "AI सहाय्यक", icon: BotIcon, path: "/student/ai-assistant" },
        { label: "सूचना", icon: BellIcon, path: "/student/notifications" },
      ],
    },
    {
      label: "ACCOUNT",
      items: [
        { label: "प्रोफाइल", icon: UserIcon, path: "/student/profile" },
      ],
    },
  ];

  return (
    <>
      {/* ---------- ANIMATION KEYFRAMES ---------- */}
      <style>{`
        @keyframes overlayIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes drawerIn {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        @keyframes groupIn {
          from { opacity: 0; transform: translateY(8px); }
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
        .animate-overlay-in { animation: overlayIn 0.25s ease-out both; }
        .animate-drawer-in { animation: drawerIn 0.32s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .animate-group-in { animation: groupIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .animate-gradient { background-size: 220% 220%; animation: gradientPan 8s ease infinite; }
        .animate-soft-glow { animation: softGlow 4.5s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .animate-overlay-in, .animate-drawer-in, .animate-group-in,
          .animate-gradient, .animate-soft-glow { animation: none !important; }
        }
      `}</style>

      {/* ================= MOBILE OVERLAY ================= */}
      {isOpen && (
        <button
          type="button"
          aria-label="Close student navigation"
          className="animate-overlay-in fixed inset-0 z-40 cursor-default bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* ================= SIDEBAR (Desktop) ================= */}
      <aside
        id="student-sidebar"
        aria-label="Student navigation sidebar"
        className="pb-student-sidebar hidden lg:sticky lg:top-0 lg:z-30 lg:flex lg:h-dvh lg:w-72 lg:shrink-0 lg:flex-col lg:overflow-hidden lg:border-r lg:border-pb-border lg:bg-white"
      >
        {/* Animated accent line */}
        <span
          aria-hidden="true"
          className="animate-gradient pointer-events-none absolute inset-y-0 right-0 w-[2px] bg-gradient-to-b from-pb-green via-pb-khaki to-pb-green opacity-70"
        />

        {/* ================= LOGO ================= */}
        <div className="relative flex h-16 sm:h-18 shrink-0 items-center justify-between border-b border-pb-border-soft px-4 sm:px-5">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <span className="relative flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-gradient-to-br from-pb-green to-[#0f3d2e] text-white shadow-md">
              <span
                aria-hidden="true"
                className="animate-soft-glow pointer-events-none absolute -inset-1 rounded-2xl bg-pb-khaki/30 blur-md"
              />
              <ShieldIcon className="relative h-5 w-5 sm:h-6 sm:w-6" />
            </span>
            <div>
              <h2 className="text-xs sm:text-sm leading-tight font-extrabold text-pb-green">
                Police Bharti
              </h2>
              <p className="mt-0.5 text-[9px] sm:text-[10px] font-bold tracking-[0.15em] text-pb-khaki uppercase">
                Student Panel
              </p>
            </div>
          </div>

          {/* Mobile close */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close student navigation"
            className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg border border-pb-border bg-pb-light text-pb-green transition-all duration-200 hover:border-pb-khaki hover:bg-[#ebe7da] focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none active:scale-95 lg:hidden"
          >
            <CloseIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>

        {/* ================= NAVIGATION ================= */}
        <div className="min-h-0 flex-1 overflow-y-auto px-3 sm:px-4 py-4 sm:py-6">
          <nav aria-label="Student navigation" className="space-y-4 sm:space-y-6">
            {navigationGroups.map((group, groupIndex) => (
              <section
                key={group.label}
                className="animate-group-in"
                style={{ animationDelay: `${Math.min(groupIndex * 40, 240)}ms` }}
              >
                {/* Group label with soft rule */}
                <div className="mb-2 sm:mb-3 flex items-center gap-2 px-2.5 sm:px-3">
                  <span className="text-[9px] sm:text-[10px] font-extrabold tracking-[0.18em] text-slate-400 uppercase">
                    {group.label}
                  </span>
                  <span className="h-px flex-1 bg-gradient-to-r from-pb-border to-transparent" />
                </div>

                <div className="space-y-1 sm:space-y-1.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isSub = item.isSubItem;
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        end={
                          item.path === "/student/tests" &&
                          pathname === "/student/tests/history"
                        }
                        onClick={onClose}
                        style={({ isActive }) => ({
                          color: isActive ? "#ffffff" : undefined,
                        })}
                        className={({ isActive }) =>
                          [
                            "group relative flex items-center gap-2.5 sm:gap-3 rounded-xl font-bold transition-all duration-200",
                            isSub
                              ? "ml-7 sm:ml-9 w-[calc(100%-1.75rem)] sm:w-[calc(100%-2.25rem)] px-2.5 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs"
                              : "px-2.5 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm",
                            isActive
                              ? "bg-gradient-to-r from-pb-khaki to-[#b8a64e] !text-white shadow-sm"
                              : "text-pb-green hover:bg-pb-neutral/70 hover:text-pb-green active:scale-[0.99]",
                          ].join(" ")
                        }
                      >
                        {({ isActive }) => (
                          <>
                            {/* Active side accent */}
                            <span
                              aria-hidden="true"
                              className={`absolute top-1/2 -left-1 h-5 sm:h-6 w-1 -translate-y-1/2 rounded-full bg-pb-khaki transition-all duration-300 ${
                                isActive ? "opacity-100" : "opacity-0 group-hover:opacity-40"
                              }`}
                            />

                            <span
                              className={`flex shrink-0 items-center justify-center rounded-lg transition-all duration-200 ${
                                isSub ? "h-5 w-5 sm:h-6 sm:w-6" : "h-7 w-7 sm:h-8 sm:w-8"
                              } ${
                                isActive
                                  ? "bg-white/20 text-white"
                                  : "bg-pb-light text-pb-green group-hover:bg-white group-hover:text-pb-khaki"
                              }`}
                            >
                              <Icon className={isSub ? "h-3 w-3 sm:h-3.5 sm:w-3.5" : "h-3.5 w-3.5 sm:h-4 sm:w-4"} />
                            </span>

                            <span className="min-w-0 flex-1 truncate">
                              {item.label}
                            </span>

                            {/* Small chevron indicator on hover for non-sub items */}
                            {!isSub && (
                              <svg
                                aria-hidden="true"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className={`h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0 transition-all duration-200 ${
                                  isActive
                                    ? "translate-x-0 opacity-100"
                                    : "-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-70"
                                }`}
                              >
                                <path d="m9 6 6 6-6 6" />
                              </svg>
                            )}
                          </>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              </section>
            ))}
          </nav>
        </div>

        {/* ================= BOTTOM GOAL CARD ================= */}
        <div className="shrink-0 border-t border-pb-border-soft p-3 sm:p-4">
          <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-pb-light via-white to-pb-light p-3 sm:p-4 shadow-xs">
            {/* Accent bar */}
            <span
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-pb-green via-pb-khaki to-pb-green"
            />
            <div className="flex items-center gap-2.5 sm:gap-3">
              <span className="relative flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br from-pb-khaki to-[#c9b95f] text-white shadow-xs">
                <TargetIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] sm:text-xs font-extrabold text-pb-green">
                  तुमचे लक्ष्य
                </p>
                <p className="mt-0.5 text-[10px] sm:text-[11px] leading-snug text-slate-500">
                  सातत्याने अभ्यास करा
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export default StudentSidebar;