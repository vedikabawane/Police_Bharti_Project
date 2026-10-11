import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="relative overflow-hidden bg-pb-green text-white">

      {/* =========================
          BACKGROUND DECORATION
      ========================= */}

      <div className="pointer-events-none absolute inset-0 hidden overflow-hidden">

        <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full border-[35px] border-[#d7c56f]/10" />

        <div className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full border-[45px] border-white/5" />

        <div className="absolute right-[20%] top-[30%] text-8xl opacity-[0.025]">
          🚔
        </div>

        <div className="absolute bottom-[10%] left-[45%] text-7xl opacity-[0.025]">
          👮
        </div>

      </div>

      {/* =========================
          MAIN FOOTER
      ========================= */}

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">

        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">

          {/* Brand */}

          <div className="lg:col-span-2">

            <Link
              to="/"
              className="group inline-flex items-center gap-3"
            >

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-pb-khaki bg-pb-khaki text-3xl transition duration-300 group-hover:-translate-y-1 group-hover:rotate-3">
                👮
              </div>

              <div>

                <p className="text-xl font-black">
                  Police Bharti
                </p>

                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#d7c56f]">
                  Preparation Platform
                </p>

              </div>

            </Link>

            <p className="mt-6 max-w-lg text-sm leading-7 text-slate-300">
              महाराष्ट्र पोलीस भरतीची तयारी करणाऱ्या विद्यार्थ्यांसाठी
              अभ्यास साहित्य, PYQ, Mock Tests, Performance Analysis
              आणि Physical Preparation एकाच platform वर उपलब्ध करून
              देणारे free platform.
            </p>

            {/* Icons */}

            <div className="mt-7 flex flex-wrap gap-3">

              <div className="rounded-xl border border-pb-khaki bg-pb-khaki px-4 py-3 text-sm">
                📚 Study
              </div>

              <div className="rounded-xl border border-pb-khaki bg-pb-khaki px-4 py-3 text-sm">
                🚔 Mock Tests
              </div>

              <div className="rounded-xl border border-pb-khaki bg-pb-khaki px-4 py-3 text-sm">
                🏃 Physical
              </div>

              <div className="rounded-xl border border-pb-khaki bg-pb-khaki px-4 py-3 text-sm">
                🛡️ Secure
              </div>

            </div>

          </div>

          {/* Quick Links */}

          <div>

            <h3 className="text-sm font-extrabold uppercase tracking-[0.15em] text-[#d7c56f]">
              Quick Links
            </h3>

            <div className="mt-5 space-y-3">

              <Link
                to="/"
                className="flex items-center gap-2 text-sm text-slate-300 transition hover:translate-x-1 hover:text-white"
              >
                🏠 Home
              </Link>

              <Link
                to="/about"
                className="flex items-center gap-2 text-sm text-slate-300 transition hover:translate-x-1 hover:text-white"
              >
                👮 About
              </Link>

              <Link
                to="/contact"
                className="flex items-center gap-2 text-sm text-slate-300 transition hover:translate-x-1 hover:text-white"
              >
                📞 Contact
              </Link>

              <Link
                to="/login"
                className="flex items-center gap-2 text-sm text-slate-300 transition hover:translate-x-1 hover:text-white"
              >
                🔐 Login
              </Link>

              <Link
                to="/register"
                className="flex items-center gap-2 text-sm text-slate-300 transition hover:translate-x-1 hover:text-white"
              >
                🪪 Register
              </Link>

            </div>

          </div>

          {/* Platform */}

          <div>

            <h3 className="text-sm font-extrabold uppercase tracking-[0.15em] text-[#d7c56f]">
              Platform
            </h3>

            <div className="mt-5 space-y-4">

              <div className="flex items-center gap-3">

                <span className="text-xl">
                  📖
                </span>

                <div>
                  <p className="text-sm font-bold text-white">
                    Study Material
                  </p>

                  <p className="text-xs text-slate-500">
                    Subject-wise preparation
                  </p>
                </div>

              </div>

              <div className="flex items-center gap-3">

                <span className="text-xl">
                  📝
                </span>

                <div>
                  <p className="text-sm font-bold text-white">
                    PYQ & Tests
                  </p>

                  <p className="text-xs text-slate-500">
                    Exam practice
                  </p>
                </div>

              </div>

              <div className="flex items-center gap-3">

                <span className="text-xl">
                  🏃
                </span>

                <div>
                  <p className="text-sm font-bold text-white">
                    Physical Tracking
                  </p>

                  <p className="text-xs text-slate-500">
                    Fitness progress
                  </p>
                </div>

              </div>

            </div>

          </div>

        </div>

        {/* Divider */}

        <div className="my-10 h-px bg-white/10" />

        {/* Bottom */}

        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <p className="text-sm font-semibold text-slate-300">
              🇮🇳 Jai Hind • Jai Maharashtra
            </p>

            <p className="mt-1 text-xs text-slate-500">
              © 2026 Police Bharti Preparation Platform
            </p>

          </div>

          <div className="flex flex-wrap items-center gap-3">

            <span className="flex items-center gap-2 rounded-full border border-pb-khaki bg-pb-khaki px-4 py-2 text-xs font-bold text-white">
              🆓 Completely Free
            </span>

            <span className="flex items-center gap-2 rounded-full border border-pb-khaki bg-pb-khaki px-4 py-2 text-xs font-bold text-white">
              🛡️ Secure
            </span>

            <span className="flex items-center gap-2 rounded-full border border-pb-khaki bg-pb-khaki px-4 py-2 text-xs font-bold text-white">
              🚔 Police Prep
            </span>

          </div>

        </div>

      </div>

    </footer>
  );
}

export default Footer;
