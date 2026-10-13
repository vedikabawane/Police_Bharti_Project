const SAFE_METHODS = new Set(["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE"]);
const SAFE_ERROR_CODES = /^[A-Z0-9_]{1,32}$/;
const SAFE_REQUEST_ID = /^[0-9a-f]{32}$/;

export function logApiFailure(error) {
  if (!import.meta.env.DEV) return;

  const method = String(error?.config?.method || "").toUpperCase();
  const status = Number.isInteger(error?.response?.status)
    ? error.response.status
    : "network";
  const code = typeof error?.code === "string" && SAFE_ERROR_CODES.test(error.code)
    ? error.code
    : undefined;
  const requestId = error?.response?.headers?.["x-request-id"];

  console.warn("API request failed", {
    method: SAFE_METHODS.has(method) ? method : "UNKNOWN",
    status,
    ...(code ? { code } : {}),
    ...(typeof requestId === "string" && SAFE_REQUEST_ID.test(requestId)
      ? { requestId }
      : {}),
  });
}

export function logClientDiagnostic(message) {
  if (import.meta.env.DEV) {
    console.warn(message);
  }
}
