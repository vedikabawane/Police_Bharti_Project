import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const modules = [
  {
    to: "/student/tests",
    icon: "📝",
    title: "सराव चाचण्या",
    subtitle: "Practice Tests",
    description: "Subject, topic आणि mock tests सोडवा.",
    badge: "सराव",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    to: "/student/study",
    icon: "📚",
    title: "अभ्यास साहित्य",
    subtitle: "Study Material",
    description: "विषयानुसार notes आणि learning material.",
    badge: "अभ्यास",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    to: "/student/previous-year",
    icon: "📄",
    title: "मागील प्रश्नपत्रिका",
    subtitle: "PYQ Papers",
    description: "मागील वर्षांचे प्रश्न आणि explanations.",
    badge: "PYQ",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    to: "/student/physical",
    icon: "🏃",
    title: "शारीरिक चाचणी",
    subtitle: "Physical Tracking",
    description: "Running, Shot put आणि physical तयारी track करा.",
    badge: "ग्राउंड",
    badgeColor: "bg-red-50 text-red-700 border-red-200",
  },
  {
    to: "/student/current-affairs",
    icon: "🌐",
    title: "चालू घडामोडी",
    subtitle: "Current Affairs",
    description: "दैनिक आणि मासिक महत्त्वाच्या घडामोडी.",
    badge: "अपडेट",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
  },
  {
    to: "/student/performance",
    icon: "📈",
    title: "कामगिरी विश्लेषण",
    subtitle: "Performance",
    description: "Score, अचूकता आणि प्रगतीचा आलेख.",
    badge: "प्रगती",
    badgeColor: "bg-teal-50 text-teal-700 border-teal-200",
  },
  {
    to: "/student/recruitment-notices",
    icon: "📢",
    title: "भरती सूचना",
    subtitle: "Notices",
    description: "अधिकृत जाहिराती आणि परीक्षा अपडेट्स.",
    badge: "GR/सूचना",
    badgeColor: "bg-orange-50 text-orange-700 border-orange-200",
  },
  {
    to: "/student/ai-assistant",
    icon: "🤖",
    title: "AI सहाय्यक",
    subtitle: "Marathi AI",
    description: "पोलीस भरती संशय व प्रश्नांची उत्तरे मिळवा.",
    badge: "मराठी AI",
    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
];

function StudentDashboard() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-pb-light pb-12">
      <div className="mx-auto w-full max-w-7xl px-3.5 py-4 sm:px-6 sm:py-8 lg:px-8">
        {/* ======================================
            HERO GREETING BANNER
        ====================================== */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-pb-green via-[#1f2b18] to-[#141d10] p-5 text-white shadow-md sm:rounded-3xl sm:p-8">
          {/* Subtle decorative glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-pb-khaki/20 blur-2xl sm:h-64 sm:w-64"
          />

          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-pb-khaki/40 bg-pb-khaki/20 px-3 py-1 text-[11px] font-bold text-[#d7c56f] backdrop-blur-sm sm:text-xs">
                <span>🚔</span>
                <span>पोलीस भरती २०२६ तयारी</span>
              </div>

              <h1 className="mt-3 truncate text-xl font-extrabold tracking-tight sm:text-3xl">
                नमस्कार, {user?.name || "विद्यार्थी"} 👋
              </h1>

              <p className="mt-1.5 max-w-2xl text-xs leading-5 text-slate-300 sm:text-sm sm:leading-6">
                वर्दीचे स्वप्न पूर्ण करण्यासाठी दररोज सातत्याने सराव आणि अभ्यास करत राहा.
              </p>

              {/* Quick Action Buttons */}
              <div className="mt-4 flex flex-wrap items-center gap-2 sm:gap-3">
                <Link
                  to="/student/tests"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-pb-khaki px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-all duration-200 hover:bg-[#6c612c] hover:shadow-md active:scale-95 sm:px-4 sm:py-2.5 sm:text-sm"
                >
                  <span>📝 चाचणी सुरू करा</span>
                </Link>
                <Link
                  to="/student/study"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/25 bg-white/10 px-3.5 py-2 text-xs font-bold text-white backdrop-blur-xs transition-all duration-200 hover:bg-white/20 active:scale-95 sm:px-4 sm:py-2.5 sm:text-sm"
                >
                  <span>📚 अभ्यास साहित्य</span>
                </Link>
              </div>
            </div>

            <div className="hidden shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 p-4 text-4xl shadow-inner backdrop-blur-xs sm:flex sm:h-20 sm:w-20">
              🛡️
            </div>
          </div>
        </div>

        {/* ======================================
            MODULES GRID (Mobile 2-column, Desktop 4-column)
        ====================================== */}
        <div className="mt-6 sm:mt-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-pb-green sm:text-xl">
                तुमची तयारी Modules
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
                अभ्यास, सराव आणि शारीरिक तयारीचे सर्व विभाग
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            {modules.map((m) => (
              <Link
                key={m.to}
                to={m.to}
                className="group relative flex flex-col justify-between rounded-xl border border-pb-border/80 bg-white p-3.5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-pb-khaki/60 hover:shadow-md active:scale-[0.98] sm:rounded-2xl sm:p-5"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-pb-light text-xl transition-transform duration-200 group-hover:scale-110 sm:h-12 sm:w-12 sm:text-2xl">
                      {m.icon}
                    </span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[9px] font-extrabold sm:text-[10px] ${m.badgeColor}`}
                    >
                      {m.badge}
                    </span>
                  </div>

                  <h3 className="mt-3 truncate text-xs font-extrabold text-pb-green group-hover:text-pb-khaki sm:text-base">
                    {m.title}
                  </h3>
                  <p className="hidden text-[10px] font-semibold text-slate-400 sm:block sm:text-xs">
                    {m.subtitle}
                  </p>

                  <p className="mt-1 hidden text-xs leading-snug text-slate-500 sm:line-clamp-2">
                    {m.description}
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-pb-border/50 pt-2 text-[10px] font-bold text-pb-khaki sm:mt-4 sm:text-xs">
                  <span>सुरू करा</span>
                  <span className="transition-transform duration-200 group-hover:translate-x-1">
                    →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;