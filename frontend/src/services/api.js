import axios from "axios";
import { logApiFailure } from "./apiErrorLogging";

const DEVELOPMENT_API_BASE_URL = import.meta.env.DEV
  ? typeof window !== "undefined" && window.location.origin
    ? `${window.location.origin}/api`
    : "http://127.0.0.1:5000/api"
  : null;

function resolveApiBaseURL() {
  const configured = import.meta.env.VITE_API_BASE_URL?.trim();
  if (!configured) {
    if (!DEVELOPMENT_API_BASE_URL) {
      throw new Error("VITE_API_BASE_URL must be set for production builds.");
    }
    return DEVELOPMENT_API_BASE_URL;
  }

  let baseURL = configured.replace(/\/+$/, "").replace(/(?:\/api){2,}$/i, "/api");
  if (baseURL.startsWith("//")) {
    throw new Error("VITE_API_BASE_URL must be a path or an absolute HTTP(S) URL.");
  }

  if (!baseURL.startsWith("/")) {
    let parsed;
    try {
      parsed = new URL(baseURL);
    } catch {
      throw new Error("VITE_API_BASE_URL must be a path or an absolute HTTP(S) URL.");
    }
    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("VITE_API_BASE_URL must use HTTP or HTTPS.");
    }
    if (parsed.username || parsed.password || parsed.search || parsed.hash) {
      throw new Error("VITE_API_BASE_URL must not contain credentials, a query, or a fragment.");
    }
    if (
      import.meta.env.PROD &&
      (parsed.protocol !== "https:" ||
        ["localhost", "127.0.0.1", "::1", "0.0.0.0"].includes(parsed.hostname.toLowerCase()))
    ) {
      throw new Error("Production VITE_API_BASE_URL must use HTTPS or a relative /api path.");
    }
  } else if (baseURL !== "/api") {
    throw new Error("Relative VITE_API_BASE_URL must be /api.");
  }

  return /\/api$/i.test(baseURL) ? baseURL : `${baseURL}/api`;
}

const api = axios.create({
  baseURL: resolveApiBaseURL(),
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

let refreshPromise = null;
let authSyncCallback = null;

export function setAuthSyncCallback(callback) {
  authSyncCallback = callback;

  return () => {
    if (authSyncCallback === callback) {
      authSyncCallback = null;
    }
  };
}

function notifyAuthSync(accessToken) {
  if (authSyncCallback) {
    authSyncCallback(accessToken);
  }
}

// ==========================================
// REQUEST INTERCEPTOR
// ==========================================

api.interceptors.request.use(
  (config) => {
    const accessToken =
      localStorage.getItem("access_token");

    if (accessToken) {
      config.headers.Authorization =
        `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => {
    logApiFailure(error);
    return Promise.reject(error);
  }
);

function rejectLoggedApiFailure(error) {
  logApiFailure(error);
  return Promise.reject(error);
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry
    ) {
      return rejectLoggedApiFailure(error);
    }

    originalRequest._retry = true;

    const accessToken = localStorage.getItem("access_token");
    const requestAuthorization = originalRequest.headers?.Authorization;
    const requestToken =
      typeof requestAuthorization === "string"
        ? requestAuthorization.replace(/^Bearer\s+/i, "")
        : null;

    if (accessToken && requestToken && requestToken !== accessToken) {
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return api(originalRequest);
    }

    const refreshToken = localStorage.getItem("refresh_token");

    if (!refreshToken) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
      notifyAuthSync(null);
      return rejectLoggedApiFailure(error);
    }

    if (!refreshPromise) {
      refreshPromise = axios
        .post(
          `${api.defaults.baseURL}/auth/refresh`,
          {},
          {
            headers: {
              Authorization: `Bearer ${refreshToken}`,
            },
            timeout: api.defaults.timeout,
          }
        )
        .then((response) => {
          const newAccessToken = response.data?.data?.access_token;

          if (!newAccessToken) {
            throw new Error("Refresh response did not include an access token");
          }

          localStorage.setItem("access_token", newAccessToken);
          notifyAuthSync(newAccessToken);
          return newAccessToken;
        })
        .finally(() => {
          refreshPromise = null;
        });
    }

    try {
      const newAccessToken = await refreshPromise;
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
      notifyAuthSync(null);
      logApiFailure(refreshError);
      return Promise.reject(error);
    }
  }
);

export default api;
