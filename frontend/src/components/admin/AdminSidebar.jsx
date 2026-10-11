import { useEffect } from "react";
import { NavLink } from "react-router-dom";

const navigationGroups = [
  {
    label: "MAIN",
    items: [{ label: "Dashboard", icon: "\u25a3", path: "/admin/dashboard" }],
  },
  {
    label: "STUDENTS",
    items: [{ label: "Students", icon: "\u265f", path: "/admin/students" }],
  },
  {
    label: "CONTENT",
    items: [
      { label: "Study Material", icon: "\u25f0", path: "/admin/study-materials" },
      { label: "Subjects", icon: "\u25c8", path: "/admin/subjects" },
      { label: "Topics", icon: "\u2318", path: "/admin/topics" },
      { label: "Notes", icon: "\u25a4", path: "/admin/notes" },
      { label: "Previous Year", icon: "PDF", path: "/admin/previous-year" },
      { label: "Videos", icon: "\u25b6", path: "/admin/videos" },
      { label: "\u091a\u093e\u0932\u0942 \u0918\u0921\u093e\u092e\u094b\u0921\u0940", icon: "\u25c9", path: "/admin/current-affairs" },
      { label: "\u092d\u0930\u0924\u0940 \u0938\u0942\u091a\u0928\u093e", icon: "\u25a3", path: "/admin/recruitment-notices" },
    ],
  },
  {
    label: "QUESTIONS & TESTS",
    items: [
      { label: "Question Bank", icon: "\u2667", path: "/admin/questions" },
      { label: "Tests", icon: "\u2713", path: "/admin/tests" },
      { label: "Test Attempts", icon: "R", path: "/admin/test-attempts" },
    ],
  },
  {
    label: "COMMUNICATION",
    items: [{ label: "Notifications", path: "/admin/notifications", icon: "?" }],
  },
  {
    label: "SITE CONTENT",
    items: [
      { label: "About Page", icon: "A", path: "/admin/site-content/about" },
      { label: "Contact", icon: "C", path: "/admin/site-content/contact" },
      { label: "Team Members", icon: "T", path: "/admin/site-content/team-members" },
      { label: "Contact Messages", icon: "M", path: "/admin/site-content/contact-messages" },
    ],
  },
];

function AdminSidebar({ isOpen, onClose }) {
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

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <button
          type="button"
          aria-label="Close admin navigation"
          onClick={onClose}
          className="fixed inset-0 z-40 cursor-default bg-black/40 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        id="admin-sidebar"
        aria-label="Admin navigation sidebar"
        className={`pb-admin-sidebar fixed inset-y-0 left-0 z-50 flex h-dvh w-72 max-w-[85vw] flex-col overflow-hidden border-r border-pb-border bg-white transition-transform lg:sticky lg:top-0 lg:z-20 lg:h-dvh lg:w-64 lg:max-w-none lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex min-h-18 shrink-0 items-center justify-between border-b border-pb-border-soft px-5">
          <div>
            <p className="text-sm font-extrabold text-pb-green">
              प्रशासक विभाग
            </p>

            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-pb-khaki">
              Platform Administration
            </p>
          </div>

          {/* Mobile Close */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close admin navigation"
            className="flex h-11 w-11 items-center justify-center rounded-lg text-lg text-slate-500 hover:bg-pb-light lg:hidden"
          >
            ×
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav
          aria-label="Admin navigation"
          className="min-h-0 flex-1 space-y-6 overflow-y-auto px-3 py-5"
        >
          {navigationGroups.map((group) => (
            <section key={group.label}>
              <h2 className="mb-2 px-3 text-[10px] font-extrabold tracking-[0.16em] text-slate-500">
                {group.label}
              </h2>

              <ul className="space-y-1">
                {group.items.map((item) => (
                  <li key={item.label}>
                    {item.path ? (
                      <NavLink
                        to={item.path}
                        onClick={onClose}
                        className={({ isActive }) =>
                          `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold ${
                            isActive
                              ? "bg-pb-khaki text-white"
                              : "text-pb-green hover:bg-pb-neutral hover:text-pb-green"
                          }`
                        }
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-pb-light text-sm text-pb-green">
                          {item.icon}
                        </span>

                        <span className="min-w-0 truncate">
                          {item.label}
                        </span>
                      </NavLink>
                    ) : (
                      <div
                        aria-disabled="true"
                        title="This module will be available in a later phase."
                        className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-500"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-pb-light text-sm text-slate-500">
                          {item.icon}
                        </span>

                        <span className="min-w-0 flex-1 truncate">
                          {item.label}
                        </span>

                        <span className="shrink-0 text-[9px] font-bold uppercase tracking-wide text-pb-khaki">
                          Soon
                        </span>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="shrink-0 border-t border-pb-border-soft px-5 py-3">
          <p className="text-[11px] font-medium text-slate-500">
            Police Bharti Platform
          </p>
        </div>
      </aside>
    </>
  );
}

export default AdminSidebar;
