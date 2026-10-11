import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

function AdminNavbar({ onMenuClick, isSidebarOpen }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const initial = user?.name?.trim()?.charAt(0)?.toUpperCase() || "A";

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 border-b border-pb-border-soft bg-white/95 shadow-sm backdrop-blur-sm">
      <div className="flex min-h-18 items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            aria-expanded={isSidebarOpen}
            aria-controls="admin-sidebar"
            aria-label="Open admin navigation"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-pb-border text-lg text-pb-green hover:bg-pb-light lg:hidden"
          >
            ☰
          </button>

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-pb-green text-xl text-white">
            🛡️
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold text-pb-green sm:text-base">
              Police Bharti
            </p>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-pb-khaki">
              Admin Panel
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="hidden text-right sm:block">
            <p className="max-w-48 truncate text-sm font-bold text-pb-green">
              {user?.name || "Admin"}
            </p>
            <p className="text-xs capitalize text-slate-500">
              {user?.role || "admin"}
            </p>
          </div>
          <div
            role="img"
            aria-label={`Admin ${user?.name || ""}`}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-pb-khaki font-extrabold text-white"
          >
            {initial}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="min-h-11 rounded-lg border border-pb-border px-3 py-2 text-xs font-bold text-pb-green hover:bg-pb-light sm:text-sm"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

export default AdminNavbar;
