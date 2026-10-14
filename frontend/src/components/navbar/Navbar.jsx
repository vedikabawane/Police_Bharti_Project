import { useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Home", end: true },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

const mobileLinkClass = ({ isActive }) =>
  `flex min-h-11 items-center justify-center rounded-lg border px-3 py-2 text-center text-sm font-bold transition-all duration-200 active:scale-[0.97] ${
    isActive
      ? "border-pb-green bg-pb-light text-pb-green shadow-sm"
      : "border-pb-border text-pb-green hover:border-pb-khaki hover:bg-pb-light"
  }`;

function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuButtonRef = useRef(null);

  const navLinkClass = ({ isActive }) =>
    `group relative flex min-h-11 items-center whitespace-nowrap rounded-lg px-2.5 text-sm font-bold transition-colors duration-200 2xl:px-3 ` +
    `after:pointer-events-none after:absolute after:inset-x-2.5 after:bottom-1.5 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:bg-pb-khaki after:transition-transform after:duration-300 after:content-[''] hover:after:scale-x-100 ` +
    (isActive
      ? "bg-pb-light text-pb-green after:scale-x-100"
      : "text-slate-600 hover:bg-pb-light hover:text-pb-green");

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-pb-border/70 bg-white/85 shadow-[0_1px_0_rgba(15,23,42,0.04),0_10px_30px_-22px_rgba(15,23,42,0.45)] backdrop-blur-xl"
      onKeyDown={(event) => {
        if (event.key === "Escape" && mobileMenuOpen) {
          closeMobileMenu();
          menuButtonRef.current?.focus();
        }
      }}
    >
      {/* ================= ANIMATION KEYFRAMES ================= */}
      <style>{`
        @keyframes navIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes gradientPan {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-130%); }
          100% { transform: translateX(230%); }
        }
        @keyframes softPulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.08); }
        }
        .animate-nav-in { animation: navIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .animate-gradient { background-size: 220% 220%; animation: gradientPan 8s ease infinite; }
        .animate-shimmer { animation: shimmer 3s ease-in-out infinite; }
        .animate-soft-pulse { animation: softPulse 5s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .animate-nav-in, .animate-gradient,
          .animate-shimmer, .animate-soft-pulse { animation: none !important; }
        }
      `}</style>

      {/* Animated accent line */}
      <span
        aria-hidden="true"
        className="animate-gradient pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-pb-green via-pb-khaki to-pb-green opacity-70"
      />

      <div className="relative mx-auto flex h-[68px] w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        {/* ---------- BRAND ---------- */}
        <Link
          to="/"
          aria-label="Police Bharti home"
          className="group flex min-w-0 shrink-0 items-center gap-2.5"
          onClick={closeMobileMenu}
        >
          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-pb-green to-[#0f3d2e] text-white shadow-sm transition-transform duration-300 group-hover:scale-105 sm:h-11 sm:w-11">
            {/* soft glow */}
            <span
              aria-hidden="true"
              className="animate-soft-pulse pointer-events-none absolute -inset-1 rounded-2xl bg-pb-khaki/30 blur-md"
            />
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              className="relative h-6 w-6"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3 5 6v5c0 4.6 2.8 8.1 7 10 4.2-1.9 7-5.4 7-10V6l-7-3Z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm leading-tight font-extrabold tracking-tight text-pb-green transition-colors duration-200 group-hover:text-pb-khaki sm:text-[17px]">
              Police Bharti
            </span>
            <span className="mt-0.5 hidden text-[9px] font-extrabold tracking-[0.15em] text-pb-khaki uppercase sm:block">
              Preparation Platform
            </span>
          </span>
        </Link>

        {/* ---------- DESKTOP NAV ---------- */}
        <nav aria-label="Main navigation" className="hidden items-center gap-1 lg:flex">
          {links.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end} className={navLinkClass}>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* ---------- DESKTOP ACTIONS ---------- */}
        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          <Link
            to="/login"
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-pb-green px-4 text-sm font-bold text-pb-green transition-all duration-200 hover:-translate-y-0.5 hover:bg-pb-light hover:shadow-sm active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="group relative inline-flex min-h-11 items-center justify-center overflow-hidden rounded-lg bg-pb-khaki px-4 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-pb-green hover:shadow-md active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <span
              aria-hidden="true"
              className="animate-shimmer pointer-events-none absolute top-0 left-0 h-full w-1/3 -skew-x-12 bg-white/30"
            />
            <span className="relative">Register</span>
          </Link>
        </div>

        {/* ---------- MOBILE TOGGLE ---------- */}
        <button
          ref={menuButtonRef}
          type="button"
          aria-label={mobileMenuOpen ? "Close main menu" : "Open main menu"}
          aria-expanded={mobileMenuOpen}
          aria-controls="public-mobile-navigation"
          onClick={() => setMobileMenuOpen((open) => !open)}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border bg-white transition-all duration-200 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none active:scale-95 lg:hidden ${
            mobileMenuOpen
              ? "border-pb-khaki bg-pb-light text-pb-khaki"
              : "border-pb-border text-pb-green hover:border-pb-khaki hover:bg-pb-light"
          }`}
        >
          {mobileMenuOpen ? (
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          ) : (
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* ---------- MOBILE MENU ---------- */}
      <div
        id="public-mobile-navigation"
        className={`overflow-hidden border-t border-pb-border/70 bg-white/95 backdrop-blur-xl transition-all duration-300 ease-out lg:hidden ${
          mobileMenuOpen
            ? "max-h-[520px] opacity-100 shadow-lg"
            : "invisible max-h-0 opacity-0"
        }`}
      >
        <nav
          aria-label="Mobile navigation"
          className="mx-auto grid max-w-7xl grid-cols-2 gap-2 px-4 py-4 sm:grid-cols-3 sm:px-6"
        >
          {links.map(({ to, label, end }, index) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={closeMobileMenu}
              className={(props) =>
                `${mobileLinkClass(props)} ${mobileMenuOpen ? "animate-nav-in" : ""}`
              }
              style={{ animationDelay: `${Math.min(index * 55, 220)}ms` }}
            >
              {label}
            </NavLink>
          ))}

          <Link
            to="/login"
            onClick={closeMobileMenu}
            style={{ animationDelay: "175ms" }}
            className={`flex min-h-11 items-center justify-center rounded-lg border border-pb-green px-3 py-2 text-sm font-bold text-pb-green transition-all duration-200 hover:bg-pb-light active:scale-[0.97] ${
              mobileMenuOpen ? "animate-nav-in" : ""
            }`}
          >
            Login
          </Link>

          <Link
            to="/register"
            onClick={closeMobileMenu}
            style={{ animationDelay: "230ms" }}
            className={`flex min-h-11 items-center justify-center rounded-lg bg-pb-khaki px-3 py-2 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-pb-green active:scale-[0.97] ${
              mobileMenuOpen ? "animate-nav-in" : ""
            }`}
          >
            Register
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;