import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="relative overflow-hidden bg-pb-green text-white selection:bg-[#d7c56f]/30">
      {/* Top Gold Accent Line */}
      <div className="h-1 w-full bg-gradient-to-r from-pb-green via-[#d7c56f]/70 to-pb-green" />

      {/* =========================
          BACKGROUND DECORATION
      ========================= */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-28 -top-28 h-80 w-80 rounded-full bg-[#d7c56f]/10 blur-3xl" />
        <div className="absolute -bottom-36 -left-20 h-96 w-96 rounded-full bg-white/5 blur-3xl" />

        <div className="absolute right-[15%] top-[20%] hidden text-8xl opacity-[0.03] sm:block">
          🚔
        </div>

        <div className="absolute bottom-[12%] left-[42%] hidden text-7xl opacity-[0.03] sm:block">
          👮
        </div>
      </div>

      {/* =========================
          MAIN FOOTER
      ========================= */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pt-12 pb-10 sm:px-6 sm:pt-16 sm:pb-14 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-5">
            <Link
              to="/"
              className="group inline-flex items-center gap-3.5 rounded-2xl focus:outline-none active:scale-[0.98]"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#d7c56f]/50 bg-pb-khaki text-3xl shadow-lg transition-all duration-300 group-hover:-translate-y-1 group-hover:rotate-3 group-hover:border-[#d7c56f] group-hover:shadow-xl">
                👮
              </div>

              <div>
                <p className="text-xl font-black tracking-tight text-white transition-colors group-hover:text-[#d7c56f] sm:text-2xl">
                  Police Bharti
                </p>

                <p className="mt-0.5 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#d7c56f] sm:text-xs">
                  Preparation Platform
                </p>
              </div>
            </Link>

            <p className="mt-5 max-w-lg text-sm leading-7 text-slate-200/90 sm:mt-6 sm:text-base sm:leading-8">
              महाराष्ट्र पोलीस भरतीची तयारी करणाऱ्या विद्यार्थ्यांसाठी अभ्यास
              साहित्य, PYQ, Mock Tests, Performance Analysis आणि Physical
              Preparation एकाच platform वर उपलब्ध करून देणारे free platform.
            </p>

            {/* Icons - 2x2 grid on mobile for clean alignment, flex on tablet+ */}
            <div className="mt-6 grid grid-cols-2 gap-2.5 sm:mt-7 sm:flex sm:flex-wrap sm:gap-3">
              <div className="flex items-center justify-center gap-2 rounded-xl border border-pb-khaki bg-pb-khaki/90 px-3.5 py-2.5 text-xs font-bold text-white shadow-sm backdrop-blur-sm transition hover:-translate-y-0.5 sm:justify-start sm:px-4 sm:py-2.5 sm:text-sm">
                <span>📚</span>
                <span>Study</span>
              </div>

              <div className="flex items-center justify-center gap-2 rounded-xl border border-pb-khaki bg-pb-khaki/90 px-3.5 py-2.5 text-xs font-bold text-white shadow-sm backdrop-blur-sm transition hover:-translate-y-0.5 sm:justify-start sm:px-4 sm:py-2.5 sm:text-sm">
                <span>🚔</span>
                <span>Mock Tests</span>
              </div>

              <div className="flex items-center justify-center gap-2 rounded-xl border border-pb-khaki bg-pb-khaki/90 px-3.5 py-2.5 text-xs font-bold text-white shadow-sm backdrop-blur-sm transition hover:-translate-y-0.5 sm:justify-start sm:px-4 sm:py-2.5 sm:text-sm">
                <span>🏃</span>
                <span>Physical</span>
              </div>

              <div className="flex items-center justify-center gap-2 rounded-xl border border-pb-khaki bg-pb-khaki/90 px-3.5 py-2.5 text-xs font-bold text-white shadow-sm backdrop-blur-sm transition hover:-translate-y-0.5 sm:justify-start sm:px-4 sm:py-2.5 sm:text-sm">
                <span>🛡️</span>
                <span>Secure</span>
              </div>
            </div>
          </div>

          {/* Quick Links - 2-column touch-friendly pills on mobile */}
          <div className="lg:col-span-3 lg:pl-4">
            <h3 className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.18em] text-[#d7c56f] sm:text-sm">
              <span className="h-2 w-2 rounded-full bg-[#d7c56f]" />
              Quick Links
            </h3>

            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:mt-5 sm:grid-cols-1 sm:gap-2.5">
              <Link
                to="/"
                className="group flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm font-semibold text-slate-200 transition-all duration-200 hover:border-[#d7c56f]/40 hover:bg-white/10 hover:text-white active:scale-[0.98] sm:border-transparent sm:bg-transparent sm:px-0 sm:py-1.5 sm:hover:translate-x-1.5 sm:hover:border-transparent sm:hover:bg-transparent"
              >
                <span className="text-base transition-transform duration-200 group-hover:scale-110">
                  🏠
                </span>
                <span>Home</span>
              </Link>

              <Link
                to="/about"
                className="group flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm font-semibold text-slate-200 transition-all duration-200 hover:border-[#d7c56f]/40 hover:bg-white/10 hover:text-white active:scale-[0.98] sm:border-transparent sm:bg-transparent sm:px-0 sm:py-1.5 sm:hover:translate-x-1.5 sm:hover:border-transparent sm:hover:bg-transparent"
              >
                <span className="text-base transition-transform duration-200 group-hover:scale-110">
                  👮
                </span>
                <span>About</span>
              </Link>

              <Link
                to="/contact"
                className="group flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm font-semibold text-slate-200 transition-all duration-200 hover:border-[#d7c56f]/40 hover:bg-white/10 hover:text-white active:scale-[0.98] sm:border-transparent sm:bg-transparent sm:px-0 sm:py-1.5 sm:hover:translate-x-1.5 sm:hover:border-transparent sm:hover:bg-transparent"
              >
                <span className="text-base transition-transform duration-200 group-hover:scale-110">
                  📞
                </span>
                <span>Contact</span>
              </Link>

              <Link
                to="/login"
                className="group flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm font-semibold text-slate-200 transition-all duration-200 hover:border-[#d7c56f]/40 hover:bg-white/10 hover:text-white active:scale-[0.98] sm:border-transparent sm:bg-transparent sm:px-0 sm:py-1.5 sm:hover:translate-x-1.5 sm:hover:border-transparent sm:hover:bg-transparent"
              >
                <span className="text-base transition-transform duration-200 group-hover:scale-110">
                  🔐
                </span>
                <span>Login</span>
              </Link>

              <Link
                to="/register"
                className="group col-span-2 flex items-center justify-center gap-2.5 rounded-xl border border-[#d7c56f]/40 bg-[#d7c56f]/15 px-3.5 py-2.5 text-sm font-bold text-[#d7c56f] transition-all duration-200 hover:bg-[#d7c56f]/25 hover:text-white active:scale-[0.98] sm:col-span-1 sm:justify-start sm:border-transparent sm:bg-transparent sm:px-0 sm:py-1.5 sm:font-semibold sm:text-slate-200 sm:hover:translate-x-1.5 sm:hover:bg-transparent sm:hover:text-white"
              >
                <span className="text-base transition-transform duration-200 group-hover:scale-110">
                  🪪
                </span>
                <span>Register</span>
              </Link>
            </div>
          </div>

          {/* Platform */}
          <div className="lg:col-span-4">
            <h3 className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.18em] text-[#d7c56f] sm:text-sm">
              <span className="h-2 w-2 rounded-full bg-[#d7c56f]" />
              Platform
            </h3>

            <div className="mt-4 space-y-3 sm:mt-5">
              <div className="flex items-center gap-3.5 rounded-2xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-sm transition duration-200 hover:border-white/20 hover:bg-white/10">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xl">
                  📖
                </span>

                <div className="min-w-0">
                  <p className="text-sm font-bold text-white">Study Material</p>
                  <p className="mt-0.5 text-xs text-slate-300/80">
                    Subject-wise preparation
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 rounded-2xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-sm transition duration-200 hover:border-white/20 hover:bg-white/10">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xl">
                  📝
                </span>

                <div className="min-w-0">
                  <p className="text-sm font-bold text-white">PYQ & Tests</p>
                  <p className="mt-0.5 text-xs text-slate-300/80">
                    Exam practice
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 rounded-2xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-sm transition duration-200 hover:border-white/20 hover:bg-white/10">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xl">
                  🏃
                </span>

                <div className="min-w-0">
                  <p className="text-sm font-bold text-white">
                    Physical Tracking
                  </p>
                  <p className="mt-0.5 text-xs text-slate-300/80">
                    Fitness progress
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="my-8 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent sm:my-10" />

        {/* Bottom */}
        <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-bold tracking-wide text-[#d7c56f]">
              🇮🇳 Jai Hind • Jai Maharashtra
            </p>

            <p className="mt-1 text-xs text-slate-300/75">
              © 2026 Police Bharti Preparation Platform
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
            <span className="flex items-center gap-1.5 rounded-full border border-pb-khaki bg-pb-khaki/90 px-3.5 py-1.5 text-[11px] font-bold text-white shadow-sm sm:px-4 sm:py-2 sm:text-xs">
              🆓 Completely Free
            </span>

            <span className="flex items-center gap-1.5 rounded-full border border-pb-khaki bg-pb-khaki/90 px-3.5 py-1.5 text-[11px] font-bold text-white shadow-sm sm:px-4 sm:py-2 sm:text-xs">
              🛡️ Secure
            </span>

            <span className="flex items-center gap-1.5 rounded-full border border-pb-khaki bg-pb-khaki/90 px-3.5 py-1.5 text-[11px] font-bold text-white shadow-sm sm:px-4 sm:py-2 sm:text-xs">
              🚔 Police Prep
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;