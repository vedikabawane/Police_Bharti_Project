import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

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

const ShieldIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M12 3 5 6v5c0 4.6 2.8 8.1 7 10 4.2-1.9 7-5.4 7-10V6l-7-3Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const MenuIcon = (p) => (
  <svg {...iconProps} strokeWidth="2" {...p}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const CloseIcon = (p) => (
  <svg {...iconProps} strokeWidth="2" {...p}>
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
);

const LogoutIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M15 3h4a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-4" />
    <path d="M10 17l-5-5 5-5" />
    <path d="M5 12h12" />
  </svg>
);

const ChevronIcon = (p) => (
  <svg {...iconProps} strokeWidth="2.2" {...p}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const UserIcon = (p) => (
  <svg {...iconProps} {...p}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 20a7 7 0 0 1 14 0" />
  </svg>
);

function AdminNavbar({ onMenuClick, isSidebarOpen }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);

  const initial = user?.name?.trim()?.charAt(0)?.toUpperCase() || "A";

  /* Close dropdown on outside click / Escape */
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
    navigate("/login", { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 border-b border-pb-border/70 bg-white/85 shadow-[0_1px_0_rgba(15,23,42,0.04),0_10px_30px_-22px_rgba(15,23,42,0.45)] backdrop-blur-xl">

      {/* ---------- ANIMATION KEYFRAMES ---------- */}
      <style>{`
        @keyframes gradientPan {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes softGlow {
          0%, 100% { opacity: 0.45; transform: scale(1); }
          50% { opacity: 0.85; transform: scale(1.12); }
        }
        @keyframes dropdownIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-gradient { background-size: 220% 220%; animation: gradientPan 8s ease infinite; }
        .animate-soft-glow { animation: softGlow 4.5s ease-in-out infinite; }
        .animate-dropdown { animation: dropdownIn 0.2s cubic-bezier(0.22, 1, 0.36, 1) both; }
        @media (prefers-reduced-motion: reduce) {
          .animate-gradient, .animate-soft-glow, .animate-dropdown { animation: none !important; }
        }
      `}</style>

      {/* Animated accent line */}
      <span
        aria-hidden="true"
        className="animate-gradient pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-pb-green via-pb-khaki to-pb-green opacity-70"
      />

      <div className="relative flex min-h-18 items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">

        {/* ================= LEFT ================= */}
        <div className="flex min-w-0 items-center gap-3">

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={onMenuClick}
            aria-expanded={isSidebarOpen}
            aria-controls="admin-sidebar"
            aria-label={isSidebarOpen ? "Close admin navigation" : "Open admin navigation"}
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border transition-all duration-200 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none active:scale-95 lg:hidden ${
              isSidebarOpen
                ? "border-pb-khaki bg-pb-light text-pb-khaki"
                : "border-pb-border text-pb-green hover:border-pb-khaki hover:bg-pb-light"
            }`}
          >
            {isSidebarOpen ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>

          {/* Brand */}
          <div className="flex min-w-0 items-center gap-3">
            <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-pb-green to-[#0f3d2e] text-white shadow-md">
              <span
                aria-hidden="true"
                className="animate-soft-glow pointer-events-none absolute -inset-1 rounded-2xl bg-pb-khaki/30 blur-md"
              />
              <ShieldIcon className="relative h-6 w-6" />
            </span>

            <div className="min-w-0">
              <p className="truncate text-sm leading-tight font-extrabold text-pb-green sm:text-base">
                Police Bharti
              </p>
              <p className="mt-0.5 text-[10px] font-bold tracking-[0.14em] text-pb-khaki uppercase">
                Admin Panel
              </p>
            </div>
          </div>
        </div>

        {/* ================= RIGHT ================= */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">

          {/* Name + role (desktop only) */}
          <div className="hidden text-right sm:block">
            <p className="max-w-48 truncate text-sm font-bold text-pb-green">
              {user?.name || "Admin"}
            </p>
            <p className="text-xs text-slate-500 capitalize">
              {user?.role || "admin"}
            </p>
          </div>

          {/* Profile dropdown */}
          <div className="relative" ref={profileMenuRef}>
            <button
              type="button"
              aria-expanded={showProfileMenu}
              aria-controls="admin-profile-menu"
              aria-haspopup="menu"
              aria-label={`Open profile menu for ${user?.name || "admin"}`}
              onClick={() => setShowProfileMenu((open) => !open)}
              className={`flex items-center gap-2 rounded-xl border px-1.5 py-1 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none active:scale-[0.97] ${
                showProfileMenu
                  ? "border-pb-khaki bg-pb-light"
                  : "border-transparent hover:bg-pb-light"
              }`}
            >
              <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-pb-khaki to-[#c9b95f] text-sm font-extrabold text-white shadow-sm">
                {initial}
                <span
                  aria-hidden="true"
                  className="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 border-white bg-green-500"
                />
              </span>
              <ChevronIcon
                className={`hidden h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200 sm:block ${
                  showProfileMenu ? "rotate-180 text-pb-khaki" : ""
                }`}
              />
            </button>

            {showProfileMenu && (
              <div
                id="admin-profile-menu"
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
                        {user?.name || "Admin"}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-slate-500 capitalize">
                        {user?.role || "admin"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Info row */}
                {user?.email && (
                  <div className="border-b border-pb-border-soft px-4 py-3">
                    <p className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
                      Email
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-600">
                      {user.email}
                    </p>
                  </div>
                )}

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

          {/* Inline logout (mobile only — keeps quick access) */}
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Logout"
            className="flex h-11 items-center gap-2 rounded-lg border border-pb-border px-3 text-xs font-bold text-pb-green transition-all duration-200 hover:border-pb-khaki hover:bg-pb-light focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none active:scale-95 sm:hidden"
          >
            <LogoutIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

export default AdminNavbar;