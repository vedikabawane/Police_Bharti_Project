import { useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";

function StudentSidebar({ isOpen, onClose }) {
  const { pathname } = useLocation();

  useEffect(() => {
    if (!isOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event) => { if (event.key === "Escape") onClose(); };
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
        { label: "Dashboard", icon: "\u{1F4CA}", path: "/student/dashboard" },
      ],
    },
    {
      label: "STUDY",
      items: [
        { label: "\u0905\u092d\u094d\u092f\u093e\u0938 \u0938\u093e\u0939\u093f\u0924\u094d\u092f", icon: "\u{1F4DA}", path: "/student/study" },
        { label: "\u091a\u093e\u0932\u0942 \u0918\u0921\u093e\u092e\u094b\u0921\u0940", icon: "\u25c9", path: "/student/current-affairs" },
        { label: "\u092d\u0930\u0924\u0940 \u0938\u0942\u091a\u0928\u093e", icon: "\u25a4", path: "/student/recruitment-notices" },
        { label: "\u092e\u093e\u0917\u0940\u0932 \u0935\u0930\u094d\u0937\u093e\u0902\u091a\u094d\u092f\u093e \u092a\u094d\u0930\u0936\u094d\u0928\u092a\u0924\u094d\u0930\u093f\u0915\u093e", icon: "\u{1F4C4}", path: "/student/previous-year" },
      ],
    },
    {
      label: "PRACTICE",
      items: [
        { label: "\u0938\u0930\u093e\u0935 \u091a\u093e\u091a\u0923\u094d\u092f\u093e", icon: "\u{1F4DD}", path: "/student/tests" },
        { label: "\u091a\u093e\u091a\u0923\u0940 \u0907\u0924\u093f\u0939\u093e\u0938", icon: "\u25f7", path: "/student/tests/history", isSubItem: true },
      ],
    },
    {
      label: "PROGRESS",
      items: [
        { label: "\u0936\u093e\u0930\u0940\u0930\u093f\u0915 \u092a\u094d\u0930\u0936\u093f\u0915\u094d\u0937\u0923", icon: "\u{1F3C3}", path: "/student/physical" },
        { label: "\u0915\u093e\u092e\u0917\u093f\u0930\u0940", icon: "\u{1F4C8}", path: "/student/performance" },
      ],
    },
    {
      label: "TOOLS",
      items: [
        { label: "AI \u0938\u0939\u093e\u092f\u094d\u092f\u0915", icon: "\u{1F916}", path: "/student/ai-assistant" },
        { label: "\u0938\u0942\u091a\u0928\u093e", icon: "\u{1F514}", path: "/student/notifications" },
      ],
    },
    {
      label: "ACCOUNT",
      items: [
        { label: "\u092a\u094d\u0930\u094b\u092b\u093e\u0907\u0932", icon: "\u{1F464}", path: "/student/profile" },
      ],
    },
  ];

  const navLinkClass = ({ isActive }) =>
    `group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all duration-300 ${
      isActive
        ? "bg-pb-khaki text-white shadow-md"
        : "text-pb-green hover:bg-pb-neutral hover:text-pb-green"
    }`;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <button
          type="button"
          aria-label="Close student navigation"
          className="fixed inset-0 z-40 cursor-default bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        id="student-sidebar"
        aria-label="Student navigation sidebar"
        className={`
          pb-student-sidebar fixed left-0 top-0 z-50 flex h-dvh w-72 max-w-[85vw]
          flex-col overflow-hidden border-r border-pb-border bg-white
          transition-transform duration-300
          lg:sticky lg:top-0 lg:z-30 lg:max-w-none
          ${
            isOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          }
        `}
      >

        {/* Logo */}
        <div className="flex h-18 shrink-0 items-center justify-between border-b border-pb-border-soft px-5">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-pb-green">
              <span className="text-xl">
                🛡️
              </span>
            </div>

            <div>
              <h2 className="text-sm font-extrabold text-pb-green">
                Police Bharti
              </h2>

              <p className="text-[10px] font-bold uppercase tracking-wider text-pb-khaki">
                Student Panel
              </p>
            </div>

          </div>

          {/* Mobile Close */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close student navigation"
            className="flex h-11 w-11 items-center justify-center rounded-lg bg-pb-light text-lg lg:hidden"
          >
            ✕
          </button>

        </div>

        {/* Navigation */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6">
          <nav aria-label="Student navigation" className="space-y-5">
            {navigationGroups.map((group) => (
              <section key={group.label}>
                <p className="mb-2 px-3 text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-500">
                  {group.label}
                </p>
                <div className="space-y-1.5">
                  {group.items.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === "/student/tests" && pathname === "/student/tests/history"}
                      onClick={onClose}
                      className={({ isActive }) => navLinkClass({ isActive }) + (item.isSubItem ? " ml-9 !w-[calc(100%-2.25rem)] !px-3 !py-2 text-xs" : "")}
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-pb-light text-base transition-all">
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              </section>
            ))}
          </nav>
        </div>

        {/* Bottom Info */}
        <div className="shrink-0 border-t border-pb-border-soft p-4">

          <div className="rounded-2xl bg-pb-light p-4">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pb-khaki text-lg">
                🎯
              </div>

              <div>
                <p className="text-xs font-extrabold text-pb-green">
                  तुमचे लक्ष्य
                </p>

                <p className="mt-1 text-[11px] text-slate-500">
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
