import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function RoleRoute({ allowedRoles }) {
  const {
    user,
    isAuthenticated,
    loading,
  } = useAuth();

  // ------------------------------------------
  // AUTH LOADING
  // ------------------------------------------

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-pb-light">
        <div className="flex flex-col items-center gap-4">

          <div className="flex h-14 w-14 animate-pulse items-center justify-center rounded-2xl bg-pb-green">
            <span className="text-2xl">
              🛡️
            </span>
          </div>

          <p className="text-sm font-semibold text-pb-green">
            Loading...
          </p>

        </div>
      </div>
    );
  }

  // ------------------------------------------
  // NOT AUTHENTICATED
  // ------------------------------------------

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  // ------------------------------------------
  // ROLE CHECK
  // ------------------------------------------

  if (!allowedRoles.includes(user?.role)) {
    return (
      <Navigate
        to="/unauthorized"
        replace
      />
    );
  }

  // ------------------------------------------
  // ROLE ALLOWED
  // ------------------------------------------

  return <Outlet />;
}

export default RoleRoute;