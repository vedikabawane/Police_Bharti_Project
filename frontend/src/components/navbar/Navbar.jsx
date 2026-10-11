import { useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Home", end: true },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

const mobileLinkClass = ({ isActive }) =>
  `flex min-h-11 items-center justify-center rounded-lg border px-3 py-2 text-center text-sm font-bold transition-colors ${
    isActive
      ? "border-pb-green bg-pb-light text-pb-green"
      : "border-pb-border text-pb-green hover:bg-pb-light"
  }`;

function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuButtonRef = useRef(null);

  const navLinkClass = ({ isActive }) =>
    `flex min-h-11 items-center whitespace-nowrap rounded-lg px-2.5 text-sm font-bold transition-colors 2xl:px-3 ${
      isActive
        ? "bg-pb-light text-pb-green"
        : "text-slate-600 hover:bg-pb-light hover:text-pb-green"
    }`;

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-pb-border bg-white shadow-sm"
      onKeyDown={(event) => {
        if (event.key === "Escape" && mobileMenuOpen) {
          closeMobileMenu();
          menuButtonRef.current?.focus();
        }
      }}
    >
      <div className="mx-auto flex h-[68px] w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          aria-label="Police Bharti home"
          className="group flex min-w-0 shrink-0 items-center gap-2.5"
          onClick={closeMobileMenu}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pb-green text-white shadow-sm sm:h-11 sm:w-11">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3 5 6v5c0 4.6 2.8 8.1 7 10 4.2-1.9 7-5.4 7-10V6l-7-3Z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-extrabold leading-tight tracking-tight text-pb-green sm:text-[17px]">
              Police Bharti
            </span>
            <span className="mt-0.5 hidden text-[9px] font-extrabold uppercase tracking-[0.15em] text-pb-khaki sm:block">
              Preparation Platform
            </span>
          </span>
        </Link>

        <nav aria-label="Main navigation" className="hidden items-center gap-1 lg:flex">
          {links.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end} className={navLinkClass}>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          <Link
            to="/login"
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-pb-green px-4 text-sm font-bold text-pb-green transition-colors hover:bg-pb-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pb-khaki"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-pb-khaki px-4 text-sm font-bold text-white transition-colors hover:bg-pb-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:ring-offset-2"
          >
            Register
          </Link>
        </div>

        <button
          ref={menuButtonRef}
          type="button"
          aria-label={mobileMenuOpen ? "Close main menu" : "Open main menu"}
          aria-expanded={mobileMenuOpen}
          aria-controls="public-mobile-navigation"
          onClick={() => setMobileMenuOpen((open) => !open)}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-pb-border bg-white text-pb-green hover:bg-pb-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pb-khaki lg:hidden"
        >
          {mobileMenuOpen ? (
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          ) : (
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      <div
        id="public-mobile-navigation"
        className={`${mobileMenuOpen ? "block" : "hidden"} border-t border-pb-border bg-white px-4 py-4 shadow-lg lg:hidden sm:px-6`}
      >
        <nav aria-label="Mobile navigation" className="mx-auto grid max-w-7xl grid-cols-2 gap-2 sm:grid-cols-3">
          {links.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end} onClick={closeMobileMenu} className={mobileLinkClass}>
              {label}
            </NavLink>
          ))}
          <Link to="/login" onClick={closeMobileMenu} className="flex min-h-11 items-center justify-center rounded-lg border border-pb-green px-3 py-2 text-sm font-bold text-pb-green transition-colors hover:bg-pb-light">
            Login
          </Link>
          <Link to="/register" onClick={closeMobileMenu} className="flex min-h-11 items-center justify-center rounded-lg bg-pb-khaki px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-pb-green">
            Register
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
