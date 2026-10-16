import { Link, NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Home", end: true },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

function Navbar() {
  const navLinkClass = ({ isActive }) =>
    `group relative flex min-h-10 md:min-h-11 items-center whitespace-nowrap rounded-lg px-2.5 md:px-3 text-xs md:text-sm font-bold transition-colors duration-200 ` +
    `after:pointer-events-none after:absolute after:inset-x-2 md:after:inset-x-2.5 after:bottom-1.5 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:bg-pb-khaki after:transition-transform after:duration-300 after:content-[''] hover:after:scale-x-100 ` +
    (isActive
      ? "bg-pb-light text-pb-green after:scale-x-100"
      : "text-slate-600 hover:bg-pb-light hover:text-pb-green");

  return (
    <header className="sticky top-0 z-50 w-full border-b border-pb-border/70 bg-white/90 shadow-[0_1px_0_rgba(15,23,42,0.04),0_10px_30px_-22px_rgba(15,23,42,0.45)] backdrop-blur-xl">
      {/* ================= ANIMATION KEYFRAMES ================= */}
      <style>{`
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
        .animate-gradient { background-size: 220% 220%; animation: gradientPan 8s ease infinite; }
        .animate-shimmer { animation: shimmer 3s ease-in-out infinite; }
        .animate-soft-pulse { animation: softPulse 5s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .animate-gradient, .animate-shimmer, .animate-soft-pulse { animation: none !important; }
        }
      `}</style>

      {/* Animated accent line */}
      <span
        aria-hidden="true"
        className="animate-gradient pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-pb-green via-pb-khaki to-pb-green opacity-70"
      />

      {/* ---------- MAIN TOP NAVBAR ---------- */}
      <div className="relative mx-auto flex h-[58px] sm:h-[64px] md:h-[68px] w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        {/* ---------- BRAND ---------- */}
        <Link
          to="/"
          aria-label="Police Bharti home"
          className="group flex min-w-0 shrink-0 items-center gap-2.5"
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

        {/* ---------- DESKTOP / TABLET NAV ---------- */}
        <nav aria-label="Main navigation" className="hidden items-center gap-1 md:flex">
          {links.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end} className={navLinkClass}>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* ---------- DESKTOP / TABLET ACTIONS ---------- */}
        <div className="hidden shrink-0 items-center gap-2 md:flex">
          <Link
            to="/login"
            className="inline-flex min-h-10 md:min-h-11 items-center justify-center rounded-lg border border-pb-green px-3 md:px-4 text-xs md:text-sm font-bold text-pb-green transition-all duration-200 hover:-translate-y-0.5 hover:bg-pb-light hover:shadow-sm active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="group relative inline-flex min-h-10 md:min-h-11 items-center justify-center overflow-hidden rounded-lg bg-pb-khaki px-3.5 md:px-4 text-xs md:text-sm font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-pb-green hover:shadow-md active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <span
              aria-hidden="true"
              className="animate-shimmer pointer-events-none absolute top-0 left-0 h-full w-1/3 -skew-x-12 bg-white/30"
            />
            <span className="relative">Register</span>
          </Link>
        </div>

        {/* Mobile top badge - shows subtle platform tag on mobile right */}
        <div className="flex items-center md:hidden">
          <span className="inline-flex items-center gap-1 rounded-full border border-pb-border bg-pb-light/80 px-2.5 py-1 text-[10px] font-extrabold tracking-wide text-pb-green">
            <span className="h-1.5 w-1.5 rounded-full bg-green-600 animate-pulse" />
            पोलीस भरती मंच
          </span>
        </div>
      </div>

      {/* ---------- MOBILE SUB-BAR (Directly below navbar, always fixed & visible, no 3-bot) ---------- */}
      <div className="border-t border-pb-border/80 bg-white/95 px-2 py-1.5 shadow-xs backdrop-blur-xl md:hidden">
        <nav
          aria-label="Mobile quick navigation"
          className="mx-auto flex w-full max-w-lg items-center justify-between gap-1"
        >
          {links.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              style={({ isActive }) => ({
                color: isActive ? "#26351e" : "#334155",
                backgroundColor: isActive ? "#f5f3ed" : "#ffffff",
                borderColor: isActive ? "#26351e" : "#e5e0d3",
              })}
              className={({ isActive }) =>
                `flex min-h-[38px] flex-1 items-center justify-center rounded-lg border text-center text-xs font-bold transition-all duration-200 active:scale-95 ${
                  isActive
                    ? "border-pb-green bg-pb-light text-pb-green shadow-xs font-extrabold"
                    : "border-pb-border bg-white text-slate-700 hover:border-pb-khaki hover:bg-pb-light hover:text-pb-green"
                }`
              }
            >
              {label}
            </NavLink>
          ))}

          <Link
            to="/login"
            style={{ color: "#26351e", backgroundColor: "#ffffff", borderColor: "#26351e" }}
            className="flex min-h-[38px] flex-1 items-center justify-center rounded-lg border border-pb-green bg-white px-1 text-center text-xs font-extrabold text-pb-green shadow-xs transition-all duration-200 hover:bg-pb-light active:scale-95"
          >
            Login
          </Link>

          <Link
            to="/register"
            style={{ color: "#ffffff", backgroundColor: "#7b6f35", borderColor: "#7b6f35" }}
            className="flex min-h-[38px] flex-1 items-center justify-center rounded-lg border border-pb-khaki bg-pb-khaki px-1 text-center text-xs font-extrabold text-white shadow-xs transition-all duration-200 hover:bg-pb-green hover:border-pb-green active:scale-95"
          >
            Register
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;