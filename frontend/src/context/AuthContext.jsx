import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
} from "react";
import { setAuthSyncCallback } from "../services/api";

import {
  loginStudent,
  registerStudent,
  getCurrentUser,
} from "../services/authService";

const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // ==========================================
  // INITIALIZE AUTHENTICATION
  // ==========================================

  useEffect(() => {
    const storedAccessToken = localStorage.getItem("access_token");
    const storedRefreshToken = localStorage.getItem("refresh_token");
    const storedUser = localStorage.getItem("user");

    if (storedAccessToken) {
      setAccessToken(storedAccessToken);
    }

    if (storedRefreshToken) {
      setRefreshToken(storedRefreshToken);
    }

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse stored user:", error);

        localStorage.removeItem("user");
      }
    }

    setLoading(false);
  }, []);

  // ==========================================
  // LOGIN
  // ==========================================

  const login = async (loginData) => {
    const response = await loginStudent(loginData);

    const {
      user: loggedInUser,
      access_token,
      refresh_token,
    } = response.data;

    localStorage.setItem(
      "access_token",
      access_token
    );

    localStorage.setItem(
      "refresh_token",
      refresh_token
    );

    localStorage.setItem(
      "user",
      JSON.stringify(loggedInUser)
    );

    setUser(loggedInUser);
    setAccessToken(access_token);
    setRefreshToken(refresh_token);

    return response;
  };

  // ==========================================
  // REGISTER
  // ==========================================

  const register = async (registerData) => {
    const response = await registerStudent(registerData);

    return response;
  };

  // ==========================================
  // GET CURRENT USER
  // ==========================================

  const fetchCurrentUser = async () => {
    try {
      const response = await getCurrentUser();

      return response;
    } catch (error) {
      console.error(
        "Failed to fetch current user:",
        error
      );

      return null;
    }
  };

  // ==========================================
  // LOGOUT
  // ==========================================

  const logout = useCallback(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");

    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
  }, []);

  useEffect(
    () =>
      setAuthSyncCallback((newAccessToken) => {
        if (newAccessToken) {
          setAccessToken(newAccessToken);
          return;
        }

        logout();
      }),
    [logout]
  );

  // ==========================================
  // AUTH STATUS
  // ==========================================

  const isAuthenticated = Boolean(
    accessToken && user
  );

  // ==========================================
  // CONTEXT VALUE
  // ==========================================

  const value = {
    user,
    accessToken,
    refreshToken,

    isAuthenticated,
    loading,

    login,
    register,
    logout,
    fetchCurrentUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ==========================================
// CUSTOM HOOK
// ==========================================

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}

export default AuthContext;

export { AuthProvider };