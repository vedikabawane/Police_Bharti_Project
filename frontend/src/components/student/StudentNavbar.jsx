import { useEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  getUnreadCount,
  UNREAD_NOTIFICATION_EVENT,
} from "../../services/notificationService";

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

const ShieldIcon = (props) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 3 5 6v5c0 4.6 2.8 8.1 7 10 4.2-1.9 7-5.4 7-10V6l-7-3Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const BellIcon = (props) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M6 8a6 6 0 1 1 12 0c0 4 1.5 5.5 2 6H4c.5-.5 2-2 2-6Z" />
    <path d="M10 18a2 2 0 0 0 4 0" />
  </svg>
);

const LogoutIcon = (props) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M15 3h4a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-4" />
    <path d="M10 17l-5-5 5-5" />
    <path d="M5 12h12" />
  </svg>
);

const ChevronIcon = (props) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="m6 9 6 6 6-6" />
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
const UserIcon = (p) => (
  <svg {...iconProps} {...p}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 20a7 7 0 0 1 14 0" />
  </svg>
);

const studentSubNavItems = [
  { label: "Dashboard", icon: DashboardIcon, path: "/student/dashboard", end: true },
  { label: "अभ्यास", icon: BookIcon, path: "/student/study" },
  { label: "सराव चाचण्या", icon: PencilIcon, path: "/student/tests", end: true },
  { label: "चाचणी इतिहास", icon: HistoryIcon, path: "/student/tests/history" },
  { label: "चालू घडामोडी", icon: GlobeIcon, path: "/student/current-affairs" },
  { label: "शारीरिक", icon: RunIcon, path: "/student/physical" },
  { label: "भरती सूचना", icon: NewspaperIcon, path: "/student/recruitment-notices" },
  { label: "मागील प्रश्न", icon: FileStackIcon, path: "/student/previous-year" },
  { label: "कामगिरी", icon: TrendingIcon, path: "/student/performance" },
  { label: "AI सहाय्यक", icon: BotIcon, path: "/student/ai-assistant" },
  { label: "प्रोफाइल", icon: UserIcon, path: "/student/profile" },
];

function StudentNavbar() {
  const { user, logout } = useAuth();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const profileMenuRef = useRef(null);

  useEffect(() => {
    let current = true;
    getUnreadCount()
      .then((response) => {
        if (current) setUnreadCount(Number(response?.data?.unread_count) || 0);
      })
      .catch(() => { if (current) setUnreadCount(0); });
    const handleUnreadCount = (event) => setUnreadCount(event.detail?.unreadCount || 0);
    window.addEventListener(UNREAD_NOTIFICATION_EVENT, handleUnreadCount);
    return () => {
      current = false;
      window.removeEventListener(UNREAD_NOTIFICATION_EVENT, handleUnreadCount);
    };
  }, []);

  /* Close profile menu on outside click / Escape */
  useEffect(() => {
    if (!showProfileMenu) return;
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    const handleEscape = (event) => {
      if (event.key === "Escape") setShowProfileMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showProfileMenu]);

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  const initial = user?.name?.charAt(0)?.toUpperCase() || "U";

  return (
    <header className="sticky top-0 z-40 border-b border-pb-border/70 bg-white/85 shadow-[0_1px_0_rgba(15,23,42,0.04),0_10px_30px_-22px_rgba(15,23,42,0.45)] backdrop-blur-xl">

      {/* ---------- ANIMATION KEYFRAMES ---------- */}
      <style>{`
        @keyframes navItemIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes gradientPan {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes badgePulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(201, 185, 95, 0.55); }
          70% { box-shadow: 0 0 0 6px rgba(201, 185, 95, 0); }
        }
        @keyframes softGlow {
          0%, 100% { opacity: 0.45; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.1); }
        }
        @keyframes dropdownIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-nav-item { animation: navItemIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .animate-gradient { background-size: 220% 220%; animation: gradientPan 8s ease infinite; }
        .animate-badge-pulse { animation: badgePulse 2.4s ease-out infinite; }
        .animate-soft-glow { animation: softGlow 4.5s ease-in-out infinite; }
        .animate-dropdown { animation: dropdownIn 0.2s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @media (prefers-reduced-motion: reduce) {
          .animate-nav-item, .animate-gradient, .animate-badge-pulse,
          .animate-soft-glow, .animate-dropdown { animation: none !important; }
        }
      `}</style>

      {/* Animated accent line */}
      <span
        aria-hidden="true"
        className="animate-gradient pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-pb-green via-pb-khaki to-pb-green opacity-70"
      />

      <div className="relative flex h-16 sm:h-18 items-center justify-between gap-2.5 sm:gap-3 px-3.5 sm:px-6 lg:px-8">

        {/* ================= LEFT ================= */}
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          {/* Brand */}
          <Link
            to="/student/dashboard"
            aria-label="Police Bharti student dashboard"
            className="group flex min-w-0 shrink-0 items-center gap-2 sm:gap-3"
          >
            <span className="relative flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-pb-green to-[#0f3d2e] text-white shadow-md transition-transform duration-300 group-hover:scale-105">
              <span
                aria-hidden="true"
                className="animate-soft-glow pointer-events-none absolute -inset-1 rounded-2xl bg-pb-khaki/30 blur-md"
              />
              <ShieldIcon className="relative h-5 w-5 sm:h-6 sm:w-6" />
            </span>

            <div className="min-w-0">
              <h1 className="truncate text-sm sm:text-base leading-tight font-extrabold text-pb-green transition-colors duration-200 group-hover:text-pb-khaki">
                Police Bharti
              </h1>
              <p className="mt-0.5 hidden text-[10px] font-bold tracking-[0.15em] text-pb-khaki uppercase sm:block">
                Student Panel
              </p>
            </div>
          </Link>
        </div>

        {/* ================= RIGHT ================= */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">

          {/* Notification Bell */}
          <Link
            to="/student/notifications"
            aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"}
            className="group relative flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-pb-light text-pb-green transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#ebe7da] hover:shadow-sm focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none active:translate-y-0"
          >
            <BellIcon className="h-5 w-5 transition-transform duration-300 group-hover:rotate-[12deg]" />

            {unreadCount > 0 && (
              <span className="animate-badge-pulse absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-pb-khaki px-1 text-[10px] font-extrabold text-white shadow-sm">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>

          {/* Profile */}
          <div className="relative" ref={profileMenuRef}>

            <button
              type="button"
              aria-expanded={showProfileMenu}
              aria-controls="student-profile-menu"
              aria-haspopup="menu"
              aria-label={`Open profile menu for ${user?.name || "student"}`}
              onClick={() => setShowProfileMenu((open) => !open)}
              className={`flex items-center gap-2 rounded-xl border px-1.5 py-1 sm:px-2.5 sm:py-1.5 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none active:scale-[0.98] ${
                showProfileMenu
                  ? "border-pb-khaki bg-pb-light"
                  : "border-transparent hover:bg-pb-light"
              }`}
            >
              <span className="relative flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-pb-khaki to-[#c9b95f] text-sm font-extrabold text-white shadow-sm">
                {initial}
                <span
                  aria-hidden="true"
                  className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full border-2 border-white bg-green-500"
                />
              </span>

              <div className="hidden min-w-0 text-left md:block">
                <p className="max-w-[140px] truncate text-sm font-extrabold text-pb-green">
                  {user?.name || "Student"}
                </p>
                <p className="text-xs font-medium text-slate-500">Student</p>
              </div>

              <ChevronIcon
                className={`hidden h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200 md:block ${
                  showProfileMenu ? "rotate-180 text-pb-khaki" : ""
                }`}
              />
            </button>

            {/* Profile Dropdown */}
            {showProfileMenu && (
              <div
                id="student-profile-menu"
                role="menu"
                className="animate-dropdown absolute right-0 mt-3 w-64 origin-top-right overflow-hidden rounded-2xl border border-pb-border bg-white/95 shadow-2xl backdrop-blur-xl"
              >
                {/* Header */}
                <div className="relative border-b border-pb-border-soft bg-gradient-to-br from-pb-light via-white to-pb-light/60 p-4">
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-pb-green via-pb-khaki to-pb-green"
                  />
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-pb-khaki to-[#c9b95f] text-base font-extrabold text-white shadow-sm">
                      {initial}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-extrabold text-pb-green">
                        {user?.name || "Student"}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-2">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold text-red-600 transition-all duration-200 hover:bg-red-50 hover:text-red-700 active:scale-[0.98]"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 transition-colors group-hover:bg-red-100">
                      <LogoutIcon className="h-4 w-4" />
                    </span>
                    Logout
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ---------- MOBILE SUB-BAR (Directly below navbar, always fixed & visible, no 3-dot) ---------- */}
      <div className="border-t border-pb-border/80 bg-white/95 px-2 py-2 shadow-xs backdrop-blur-xl lg:hidden">
        <nav
          aria-label="Student mobile quick navigation"
          className="no-scrollbar flex items-center gap-1.5 overflow-x-auto px-1 py-0.5"
        >
          {studentSubNavItems.map(({ label, icon: Icon, path, end }) => (
            <NavLink
              key={path}
              to={path}
              end={end}
              style={({ isActive }) => ({
                color: isActive ? "#26351e" : "#334155",
                backgroundColor: isActive ? "#f5f3ed" : "#ffffff",
                borderColor: isActive ? "#26351e" : "#e5e0d3",
              })}
              className={({ isActive }) =>
                `flex shrink-0 min-h-[36px] items-center gap-1.5 rounded-lg border px-3 py-1.5 text-center text-xs font-bold transition-all duration-200 active:scale-95 ${
                  isActive
                    ? "border-pb-green bg-pb-light text-pb-green shadow-xs font-extrabold"
                    : "border-pb-border bg-white text-slate-700 hover:border-pb-khaki hover:bg-pb-light hover:text-pb-green"
                }`
              }
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="whitespace-nowrap">{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}

export default StudentNavbar;