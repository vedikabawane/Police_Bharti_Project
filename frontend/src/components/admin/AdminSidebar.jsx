import { useEffect } from "react";
import { NavLink } from "react-router-dom";

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

const DashboardIcon = (p) => (
  <svg {...iconProps} {...p}>
    <rect x="3" y="3" width="7" height="9" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="12" width="7" height="9" rx="1.5" />
    <rect x="3" y="16" width="7" height="5" rx="1.5" />
  </svg>
);
const UsersIcon = (p) => (
  <svg {...iconProps} {...p}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3 20a6 6 0 0 1 12 0" />
    <path d="M16 5.2a3.2 3.2 0 0 1 0 5.6M18 20a5.6 5.6 0 0 0-2-4.3" />
  </svg>
);
const BookIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 0-2 2Z" />
    <path d="M18 3v18" />
  </svg>
);
const GridIcon = (p) => (
  <svg {...iconProps} {...p}>
    <rect x="3" y="3" width="8" height="8" rx="1.5" />
    <rect x="13" y="3" width="8" height="8" rx="1.5" />
    <rect x="3" y="13" width="8" height="8" rx="1.5" />
    <rect x="13" y="13" width="8" height="8" rx="1.5" />
  </svg>
);
const FolderIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
  </svg>
);
const NoteIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M6 3h9l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
    <path d="M14 3v6h6M8 13h8M8 17h5" />
  </svg>
);
const FileStackIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M8 4h9a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H8Z" />
    <path d="M5 8v10a2 2 0 0 0 2 2" />
    <path d="M11 8h5M11 12h5" />
  </svg>
);
const VideoIcon = (p) => (
  <svg {...iconProps} {...p}>
    <rect x="3" y="6" width="13" height="12" rx="2" />
    <path d="m16 10 4-2v8l-4-2Z" />
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
const CheckSquareIcon = (p) => (
  <svg {...iconProps} {...p}>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path d="m8 12 2.5 2.5L16 9" />
  </svg>
);
const ListIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M8 6h13M8 12h13M8 18h13" />
    <path d="M3 6h.01M3 12h.01M3 18h.01" />
  </svg>
);
const BellIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M6 8a6 6 0 1 1 12 0c0 4 1.5 5.5 2 6H4c.5-.5 2-2 2-6Z" />
    <path d="M10 18a2 2 0 0 0 4 0" />
  </svg>
);
const InfoIcon = (p) => (
  <svg {...iconProps} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" />
  </svg>
);
const PhoneIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M4 6a2 2 0 0 1 2-2h2l2 5-2 1a12 12 0 0 0 6 6l1-2 5 2v2a2 2 0 0 1-2 2A16 16 0 0 1 4 6Z" />
  </svg>
);
const TeamIcon = (p) => (
  <svg {...iconProps} {...p}>
    <circle cx="12" cy="8" r="3" />
    <circle cx="5" cy="10" r="2.2" />
    <circle cx="19" cy="10" r="2.2" />
    <path d="M6 20a6 6 0 0 1 12 0M2 18a4 4 0 0 1 4-4M22 18a4 4 0 0 0-4-4" />
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

const navigationGroups = [
  {
    label: "MAIN",
    items: [{ label: "Dashboard", icon: DashboardIcon, path: "/admin/dashboard" }],
  },
  {
    label: "STUDENTS",
    items: [{ label: "Students", icon: UsersIcon, path: "/admin/students" }],
  },
  {
    label: "CONTENT",
    items: [
      { label: "Study Material", icon: BookIcon, path: "/admin/study-materials" },
      { label: "Subjects", icon: GridIcon, path: "/admin/subjects" },
      { label: "Topics", icon: FolderIcon, path: "/admin/topics" },
      { label: "Notes", icon: NoteIcon, path: "/admin/notes" },
      { label: "Previous Year", icon: FileStackIcon, path: "/admin/previous-year" },
      { label: "Videos", icon: VideoIcon, path: "/admin/videos" },
      { label: "चालू घडामोडी", icon: GlobeIcon, path: "/admin/current-affairs" },
      { label: "भरती सूचना", icon: NewspaperIcon, path: "/admin/recruitment-notices" },
    ],
  },
  {
    label: "TEST MANAGEMENT",
    items: [
      { label: "Tests", icon: CheckSquareIcon, path: "/admin/tests" },
      { label: "Test Attempts", icon: ListIcon, path: "/admin/test-attempts" },
    ],
  },
  {
    label: "COMMUNICATION",
    items: [{ label: "Notifications", icon: BellIcon, path: "/admin/notifications" }],
  },
  {
    label: "SITE CONTENT",
    items: [
      { label: "About Page", icon: InfoIcon, path: "/admin/site-content/about" },
      { label: "Contact", icon: PhoneIcon, path: "/admin/site-content/contact" },
      { label: "Team Members", icon: TeamIcon, path: "/admin/site-content/team-members" },
      { label: "Contact Messages", icon: InboxIcon, path: "/admin/site-content/contact-messages" },
    ],
  },
];

function AdminSidebar({ isOpen, onClose }) {
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
          aria-label="Close admin navigation"
          onClick={onClose}
          className="animate-overlay-in fixed inset-0 z-40 cursor-default bg-slate-950/50 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* ================= SIDEBAR ================= */}
      <aside
        id="admin-sidebar"
        aria-label="Admin navigation sidebar"
        className={`
          pb-admin-sidebar fixed inset-y-0 left-0 z-50 flex h-dvh w-72 max-w-[85vw]
          flex-col overflow-hidden border-r border-pb-border bg-white
          transition-transform duration-300 ease-out
          lg:sticky lg:top-0 lg:z-20 lg:h-dvh lg:w-64 lg:max-w-none lg:translate-x-0
          ${isOpen ? "animate-drawer-in translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Animated right-edge accent */}
        <span
          aria-hidden="true"
          className="animate-gradient pointer-events-none absolute inset-y-0 right-0 w-[2px] bg-gradient-to-b from-pb-green via-pb-khaki to-pb-green opacity-70"
        />

        {/* ================= HEADER ================= */}
        <div className="relative flex min-h-18 shrink-0 items-center justify-between border-b border-pb-border-soft px-5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-pb-green to-[#0f3d2e] text-white shadow-md">
              <span
                aria-hidden="true"
                className="animate-soft-glow pointer-events-none absolute -inset-1 rounded-2xl bg-pb-khaki/30 blur-md"
              />
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="relative h-5 w-5"
              >
                <path d="M12 3 5 6v5c0 4.6 2.8 8.1 7 10 4.2-1.9 7-5.4 7-10V6l-7-3Z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </span>

            <div className="min-w-0">
              <p className="truncate text-sm leading-tight font-extrabold text-pb-green">
                प्रशासक विभाग
              </p>
              <p className="mt-0.5 text-[10px] font-bold tracking-[0.15em] text-pb-khaki uppercase">
                Platform Administration
              </p>
            </div>
          </div>

          {/* Mobile close */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close admin navigation"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-transparent bg-pb-light text-pb-green transition-all duration-200 hover:border-pb-khaki hover:bg-[#ebe7da] focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none active:scale-95 lg:hidden"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        {/* ================= NAVIGATION ================= */}
        <nav
          aria-label="Admin navigation"
          className="min-h-0 flex-1 space-y-6 overflow-y-auto px-3 py-5"
        >
          {navigationGroups.map((group, groupIndex) => (
            <section
              key={group.label}
              className="animate-group-in"
              style={{ animationDelay: `${Math.min(groupIndex * 50, 300)}ms` }}
            >
              {/* Group label with soft rule */}
              <div className="mb-2.5 flex items-center gap-2 px-3">
                <span className="text-[10px] font-extrabold tracking-[0.16em] text-slate-400 uppercase">
                  {group.label}
                </span>
                <span className="h-px flex-1 bg-gradient-to-r from-pb-border to-transparent" />
              </div>

              <ul className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.label}>
                      {item.path ? (
                        <NavLink
                          to={item.path}
                          onClick={onClose}
                          className={({ isActive }) =>
                            [
                              "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-all duration-200",
                              isActive
                                ? "bg-gradient-to-r from-pb-khaki to-[#c9b95f] text-white shadow-md"
                                : "text-pb-green hover:bg-pb-neutral hover:text-pb-green active:scale-[0.99]",
                            ].join(" ")
                          }
                        >
                          {({ isActive }) => (
                            <>
                              {/* Active side accent */}
                              <span
                                aria-hidden="true"
                                className={`absolute top-1/2 -left-1 h-6 w-1 -translate-y-1/2 rounded-full bg-pb-khaki transition-all duration-300 ${
                                  isActive ? "opacity-100" : "opacity-0 group-hover:opacity-40"
                                }`}
                              />

                              <span
                                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all duration-200 ${
                                  isActive
                                    ? "bg-white/20 text-white"
                                    : "bg-pb-light text-pb-green group-hover:bg-white group-hover:text-pb-khaki"
                                }`}
                              >
                                <Icon className="h-4 w-4" />
                              </span>

                              <span className="min-w-0 flex-1 truncate">
                                {item.label}
                              </span>

                              {/* Chevron on hover / active */}
                              <svg
                                aria-hidden="true"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className={`h-3.5 w-3.5 shrink-0 transition-all duration-200 ${
                                  isActive
                                    ? "translate-x-0 opacity-100"
                                    : "-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-70"
                                }`}
                              >
                                <path d="m9 6 6 6-6 6" />
                              </svg>
                            </>
                          )}
                        </NavLink>
                      ) : (
                        <div
                          aria-disabled="true"
                          title="This module will be available in a later phase."
                          className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500"
                        >
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-pb-light text-slate-500">
                            <Icon className="h-4 w-4" />
                          </span>

                          <span className="min-w-0 flex-1 truncate">
                            {item.label}
                          </span>

                          <span className="shrink-0 rounded-full border border-pb-khaki/40 bg-pb-khaki/10 px-2 py-0.5 text-[9px] font-extrabold tracking-wide text-pb-khaki uppercase">
                            Soon
                          </span>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </nav>

        {/* ================= FOOTER ================= */}
        <div className="shrink-0 border-t border-pb-border-soft px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-pb-light text-pb-khaki"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-3.5 w-3.5"
              >
                <path d="M12 3 5 6v5c0 4.6 2.8 8.1 7 10 4.2-1.9 7-5.4 7-10V6l-7-3Z" />
              </svg>
            </span>
            <p className="min-w-0 truncate text-[11px] font-semibold text-slate-500">
              Police Bharti Platform
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}

export default AdminSidebar;