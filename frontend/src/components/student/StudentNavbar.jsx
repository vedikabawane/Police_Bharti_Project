import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  getUnreadCount,
  UNREAD_NOTIFICATION_EVENT,
} from "../../services/notificationService";

function StudentNavbar({ onMenuClick, isSidebarOpen }) {
  const { user, logout } = useAuth();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

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

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  return (
    <header className="sticky top-0 z-40 border-b border-pb-border bg-white/95 shadow-sm backdrop-blur-md">
      
      <div className="flex h-18 items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* LEFT */}
        <div className="flex items-center gap-3">

          {/* Mobile Menu */}
          <button
            type="button"
            onClick={onMenuClick}
            aria-expanded={isSidebarOpen}
            aria-controls="student-sidebar"
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-pb-light text-xl text-pb-green transition-all hover:bg-[#ebe7da] lg:hidden"
            aria-label="Open sidebar"
          >
            ☰
          </button>

          {/* Logo */}
          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-pb-green shadow-md">
              <span className="text-xl">
                🛡️
              </span>
            </div>

            <div className="hidden sm:block">
              <h1 className="text-base font-extrabold text-pb-green">
                Police Bharti
              </h1>

              <p className="text-[10px] font-bold uppercase tracking-wider text-pb-khaki">
                Student Panel
              </p>
            </div>

          </div>

        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-3">

          {/* Notification */}
          <Link
            to="/student/notifications"
            className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-pb-light text-lg transition-all hover:bg-[#ebe7da]"
            aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"}
          >
            🔔

            {unreadCount > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-pb-khaki px-1 text-[10px] font-extrabold text-white">{unreadCount > 9 ? "9+" : unreadCount}</span>}
          </Link>

          {/* Profile */}
          <div className="relative">

            <button
              type="button"
              aria-expanded={showProfileMenu}
              aria-controls="student-profile-menu"
              aria-label={`Open profile menu for ${user?.name || "student"}`}
              onClick={() =>
                setShowProfileMenu(!showProfileMenu)
              }
              className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition-all hover:bg-pb-light"
            >

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pb-khaki font-extrabold text-white">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>

              <div className="hidden text-left md:block">

                <p className="text-sm font-extrabold text-pb-green">
                  {user?.name || "Student"}
                </p>

                <p className="text-xs font-medium text-slate-500">
                  Student
                </p>

              </div>

              <span className="hidden text-xs text-slate-500 md:block">
                ▼
              </span>

            </button>

            {/* Profile Dropdown */}
            {showProfileMenu && (
              <div id="student-profile-menu" className="absolute right-0 mt-3 w-64 overflow-hidden rounded-2xl border border-pb-border bg-white shadow-xl">

                <div className="border-b border-pb-border-soft bg-pb-light p-4">

                  <p className="text-sm font-extrabold text-pb-green">
                    {user?.name}
                  </p>

                  <p className="mt-1 break-all text-xs text-slate-500">
                    {user?.email}
                  </p>

                </div>

                <div className="p-2">

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold text-red-600 transition-all hover:bg-red-50"
                  >
                    🚪
                    Logout
                  </button>

                </div>

              </div>
            )}

          </div>

        </div>

      </div>

    </header>
  );
}

export default StudentNavbar;
