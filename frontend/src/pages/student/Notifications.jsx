import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getNotifications,
  getSmsPreference,
  markAllNotificationsRead,
  markNotificationRead,
  updateSmsPreference,
} from "../../services/notificationService";
import { getTestAttemptResult } from "../../services/testService";

/* ---------- SVG ICON SET ---------- */
const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.8",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": "true",
};

const BellIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M6 8a6 6 0 1 1 12 0c0 4 1.5 5.5 2 6H4c.5-.5 2-2 2-6Z" />
    <path d="M10 18a2 2 0 0 0 4 0" />
  </svg>
);
const CheckCircleIcon = (p) => (
  <svg {...iconProps} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m8.5 12 2.5 2.5L16 9.5" />
  </svg>
);
const CheckCheckIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="m3 13 4 4 8-8" />
    <path d="m11 17 8-8" />
  </svg>
);
const MessageIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-5 4V5Z" />
    <path d="M8 9h8M8 12h5" />
  </svg>
);
const AlertIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M10.3 3.9 2.4 17a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9v4M12 17h.01" />
  </svg>
);
const RefreshIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M21 12a9 9 0 1 1-3-6.7" />
    <path d="M21 4v5h-5" />
  </svg>
);
const SpinnerIcon = (p) => (
  <svg {...iconProps} strokeWidth="2.4" {...p}>
    <path d="M21 12a9 9 0 1 1-6.2-8.5" />
  </svg>
);
const InboxIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M3 12h5l1.5 3h5L16 12h5" />
    <path d="M5 5h14l2 7v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6Z" />
  </svg>
);
const ChevronLeftIcon = (p) => (
  <svg {...iconProps} strokeWidth="2.2" {...p}>
    <path d="m15 6-6 6 6 6" />
  </svg>
);
const ChevronRightIcon = (p) => (
  <svg {...iconProps} strokeWidth="2.2" {...p}>
    <path d="m9 6 6 6-6 6" />
  </svg>
);
const FilterIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M3 5h18l-7 9v6l-4-2v-4Z" />
  </svg>
);
const PhoneIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M4 6a2 2 0 0 1 2-2h2l2 5-2 1a12 12 0 0 0 6 6l1-2 5 2v2a2 2 0 0 1-2 2A16 16 0 0 1 4 6Z" />
  </svg>
);

const PER_PAGE = 20;

function friendlyError(error, fallback) {
  const status = error.response?.status;
  if (status === 401) return "Your session has expired. Please sign in again.";
  if (status === 403)
    return "You do not have permission to access these notifications.";
  if (status === 404) return "This notification is no longer available.";
  if (status === 409) return "This item is not available yet.";
  if (status === 422)
    return (
      error.response?.data?.message || "Some notification details are invalid."
    );
  if (status >= 500)
    return "The notification service is temporarily unavailable. Please try again.";
  if (!error.response)
    return "Could not connect to the server. Check your connection and try again.";
  return error.response?.data?.message || error.message || fallback;
}

function notificationRoute(notification) {
  const id = Number(notification.related_entity_id);
  if (!Number.isInteger(id) || id < 1) return null;
  if (String(notification.related_entity_type || "").toUpperCase() === "TEST") {
    return `/student/tests/${id}`;
  }
  return null;
}

function notificationTypeLabel(type) {
  return String(type || "SYSTEM").replaceAll("_", " ").toLowerCase();
}

/* ---------- ANIMATIONS ---------- */
function AnimationStyles() {
  return (
    <style>{`
      @keyframes blobMove {
        0%, 100% { transform: translate(0px, 0px) scale(1); }
        33% { transform: translate(40px, -60px) scale(1.12); }
        66% { transform: translate(-30px, 30px) scale(0.94); }
      }
      @keyframes fadeUp {
        from { opacity: 0; transform: translateY(12px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes gradientPan {
        0%, 100% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
      }
      @keyframes softGlow {
        0%, 100% { opacity: 0.45; transform: scale(1); }
        50% { opacity: 0.85; transform: scale(1.12); }
      }
      @keyframes spinSoft { to { transform: rotate(360deg); } }
      .animate-blob { animation: blobMove 22s ease-in-out infinite; }
      .delay-2 { animation-delay: 4s; }
      .delay-4 { animation-delay: 8s; }
      .animate-fade-up { animation: fadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }
      .animate-gradient { background-size: 220% 220%; animation: gradientPan 9s ease infinite; }
      .animate-soft-glow { animation: softGlow 4.5s ease-in-out infinite; }
      .animate-spin-soft { animation: spinSoft 0.9s linear infinite; }
      @media (prefers-reduced-motion: reduce) {
        .animate-blob, .animate-fade-up, .animate-gradient,
        .animate-soft-glow, .animate-spin-soft { animation: none !important; }
      }
    `}</style>
  );
}

function AnimatedBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-gradient-to-br from-pb-light via-white to-pb-light" />
      <div
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(15,23,42,0.06) 1px, transparent 0)",
          backgroundSize: "26px 26px",
        }}
      />
      <div className="animate-blob absolute -top-32 -left-28 h-80 w-80 rounded-full bg-pb-khaki/20 blur-3xl" />
      <div className="animate-blob delay-2 absolute top-1/3 -right-28 h-72 w-72 rounded-full bg-pb-green/12 blur-3xl" />
      <div className="animate-blob delay-4 absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-pb-khaki/15 blur-3xl" />
    </div>
  );
}

/* ---------- NOTIFICATION CARD ---------- */
function NotificationCard({ notification, busy, onOpen, index = 0 }) {
  const isRead = Boolean(notification.is_read);

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => onOpen(notification)}
      className={`animate-fade-up group relative flex w-full min-w-0 flex-col gap-3 overflow-hidden rounded-2xl border p-4 text-left transition-all duration-200 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none disabled:cursor-wait disabled:opacity-70 sm:p-5 ${isRead
          ? "border-pb-border bg-white/85 hover:-translate-y-0.5 hover:border-pb-khaki/40 hover:bg-white hover:shadow-md"
          : "border-pb-khaki/40 bg-gradient-to-br from-pb-light/90 via-white to-white hover:-translate-y-0.5 hover:border-pb-khaki hover:shadow-md"
        }`}
      style={{ animationDelay: `${Math.min(index * 40, 400)}ms` }}
    >
      {/* Left accent bar for unread */}
      {!isRead && (
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-pb-green via-pb-khaki to-pb-green"
        />
      )}

      <div className="flex min-w-0 items-start gap-3.5 pl-1.5">
        {/* Icon tile */}
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm transition-transform duration-300 ${isRead
              ? "bg-pb-light text-slate-500"
              : "bg-gradient-to-br from-pb-green to-[#0f3d2e] text-white group-hover:scale-105"
            }`}
        >
          {isRead ? (
            <CheckCircleIcon className="h-5 w-5" />
          ) : (
            <BellIcon className="h-5 w-5" />
          )}
        </span>

        <div className="min-w-0 flex-1">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h2
              className={`min-w-0 text-sm leading-snug break-words text-pb-green sm:text-base ${isRead ? "font-semibold" : "font-extrabold"
                }`}
            >
              {notification.title}
            </h2>
            <span className="inline-flex shrink-0 items-center gap-1.5 text-[10px] font-semibold text-slate-500 sm:text-xs">
              {notification.created_at
                ? new Date(notification.created_at).toLocaleString("mr-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })
                : ""}
            </span>
          </div>

          {/* Message */}
          <p className="mt-2 text-sm leading-6 break-words whitespace-pre-wrap text-slate-600">
            {notification.message}
          </p>

          {/* Footer */}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] sm:text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-pb-green/20 bg-pb-green/5 px-2.5 py-1 font-extrabold tracking-wide text-pb-green uppercase">
              <BellIcon className="h-3 w-3" />
              {notificationTypeLabel(notification.notification_type)}
            </span>

            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-extrabold ${isRead
                  ? "border border-pb-border-soft bg-pb-light text-slate-500"
                  : "bg-pb-khaki/15 text-pb-khaki"
                }`}
            >
              {isRead ? (
                <>
                  <CheckCheckIcon className="h-3 w-3" />
                  Read
                </>
              ) : (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-pb-khaki" />
                  Unread
                </>
              )}
            </span>

            {busy && (
              <span
                role="status"
                className="inline-flex items-center gap-1.5 text-slate-500"
              >
                <SpinnerIcon className="animate-spin-soft h-3 w-3" />
                Opening…
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: PER_PAGE,
    total: 0,
    pages: 0,
  });
  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busyNotificationId, setBusyNotificationId] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [smsPreference, setSmsPreference] = useState(null);
  const [savingSmsPreference, setSavingSmsPreference] = useState(false);
  const [smsPreferenceMessage, setSmsPreferenceMessage] = useState("");

  useEffect(() => {
    getSmsPreference()
      .then((response) => setSmsPreference(Boolean(response?.data?.sms_enabled)))
      .catch(() => setSmsPreference(null));
  }, []);

  const changeSmsPreference = async (enabled) => {
    setSavingSmsPreference(true);
    setSmsPreferenceMessage("");
    try {
      const response = await updateSmsPreference(enabled);
      setSmsPreference(Boolean(response?.data?.sms_enabled));
      setSmsPreferenceMessage("SMS preference saved.");
    } catch {
      setSmsPreferenceMessage(
        "Could not save your SMS preference. Please try again.",
      );
    } finally {
      setSavingSmsPreference(false);
    }
  };

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getNotifications({
        page,
        per_page: PER_PAGE,
        ...(unreadOnly ? { unread_only: true } : {}),
      });
      if (
        !response?.success ||
        !Array.isArray(response.data?.notifications) ||
        !response.data?.pagination
      ) {
        throw new Error(
          response?.message || "The notification response was incomplete.",
        );
      }
      setNotifications(response.data.notifications);
      setUnreadCount(Number(response.data.unread_count) || 0);
      setPagination(response.data.pagination);
    } catch (requestError) {
      setNotifications([]);
      setError(friendlyError(requestError, "Could not load notifications."));
    } finally {
      setLoading(false);
    }
  }, [page, unreadOnly]);

  useEffect(() => {
    Promise.resolve().then(loadNotifications);
  }, [loadNotifications]);

  const openNotification = async (notification) => {
    setBusyNotificationId(notification.id);
    setActionError("");
    try {
      const response = await markNotificationRead(notification.id);
      const readNotification = response?.data?.notification;
      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id
            ? readNotification || { ...item, is_read: true }
            : item,
        ),
      );
      setUnreadCount(Number(response?.data?.unread_count) || 0);

      let target = notificationRoute(notification);
      if (
        String(notification.related_entity_type || "").toUpperCase() === "RESULT"
      ) {
        try {
          const result = await getTestAttemptResult(
            notification.related_entity_id,
          );
          if (result?.success && result.data?.test_id) {
            target = `/student/tests/${result.data.test_id}/result/${notification.related_entity_id}`;
          }
        } catch {
          target = null;
        }
      }
      if (target) navigate(target);
      else if (unreadOnly) {
        const remaining = notifications.filter(
          (item) => item.id !== notification.id,
        );
        setNotifications(remaining);
        if (!remaining.length && page > 1) setPage((current) => current - 1);
      }
    } catch (requestError) {
      setActionError(
        friendlyError(requestError, "Could not update this notification."),
      );
    } finally {
      setBusyNotificationId(null);
    }
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    setActionError("");
    try {
      await markAllNotificationsRead();
      setNotifications((current) =>
        current.map((item) => ({ ...item, is_read: true })),
      );
      setUnreadCount(0);
      if (unreadOnly) {
        setNotifications([]);
        setPage(1);
      }
    } catch (requestError) {
      setActionError(
        friendlyError(requestError, "Could not mark notifications as read."),
      );
    } finally {
      setMarkingAll(false);
    }
  };

  const smsToggleDisabled =
    smsPreference === null || savingSmsPreference;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-pb-light">
      <AnimationStyles />
      <AnimatedBackground />

      <div className="relative z-10 mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">

        {/* ================= PAGE HEADER ================= */}
        <div className="animate-fade-up mb-6 overflow-hidden rounded-2xl border border-pb-border/50 bg-white/85 shadow-sm backdrop-blur-sm">
          <span
            aria-hidden="true"
            className="animate-gradient pointer-events-none block h-1 w-full bg-gradient-to-r from-pb-green via-pb-khaki to-pb-green"
          />

          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex min-w-0 items-center gap-4">
              <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-pb-green to-[#0f3d2e] text-white shadow-md">
                <span
                  aria-hidden="true"
                  className="animate-soft-glow pointer-events-none absolute -inset-1 rounded-3xl bg-pb-khaki/30 blur-md"
                />
                <BellIcon className="relative h-6 w-6" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold tracking-[0.16em] text-pb-khaki uppercase sm:text-xs">
                  Student updates
                </p>
                <h1 className="mt-1 text-xl leading-tight font-extrabold tracking-tight text-pb-green sm:text-2xl lg:text-3xl">
                  Notifications
                </h1>
                <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-600 sm:text-sm">
                  तुमच्या अभ्यासासाठी महत्त्वाच्या सूचना आणि अपडेट्स.
                </p>
              </div>
            </div>

            {/* Unread count pill */}
            <span
              className={`inline-flex shrink-0 items-center gap-2 self-start rounded-full border px-3.5 py-2 text-sm font-extrabold shadow-sm transition-colors duration-300 sm:self-auto ${unreadCount > 0
                  ? "border-pb-khaki/40 bg-pb-khaki/15 text-pb-khaki"
                  : "border-pb-border-soft bg-pb-light text-slate-500"
                }`}
            >
              <BellIcon className="h-3.5 w-3.5" />
              {unreadCount} unread
            </span>
          </div>
        </div>

        {/* ================= SMS PREFERENCE ================= */}
        <section
          aria-labelledby="sms-preference-title"
          className="animate-fade-up mb-5 overflow-hidden rounded-2xl border border-pb-border bg-white/90 shadow-sm backdrop-blur-sm"
          style={{ animationDelay: "60ms" }}
        >
          <span
            aria-hidden="true"
            className="block h-1 w-full bg-gradient-to-r from-pb-khaki via-[#e1d37f] to-pb-khaki"
          />

          <div className="p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pb-khaki/15 text-pb-khaki">
                <PhoneIcon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <h2
                  id="sms-preference-title"
                  className="text-base leading-tight font-extrabold tracking-tight text-pb-green sm:text-lg"
                >
                  SMS notifications
                </h2>
                <p className="mt-1 text-xs leading-5 text-slate-600 sm:text-sm sm:leading-6">
                  Choose whether to receive important test announcements and
                  result updates by SMS. Your consent is off by default.
                </p>

                <label
                  className={`mt-4 flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition-all duration-200 sm:max-w-md ${smsPreference === true
                      ? "border-pb-khaki/40 bg-pb-light"
                      : "border-pb-border bg-white hover:border-pb-khaki hover:bg-pb-light/60"
                    } ${smsToggleDisabled ? "cursor-not-allowed opacity-60" : ""}`}
                >
                  <span className="relative inline-flex h-6 w-11 shrink-0 items-center">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={smsPreference === true}
                      disabled={smsToggleDisabled}
                      onChange={(event) =>
                        changeSmsPreference(event.target.checked)
                      }
                    />
                    <span
                      className={`absolute inset-0 rounded-full transition-colors duration-200 ${smsPreference === true ? "bg-pb-khaki" : "bg-slate-300"
                        }`}
                      aria-hidden="true"
                    />
                    <span
                      className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200 ${smsPreference === true ? "translate-x-5" : ""
                        }`}
                      aria-hidden="true"
                    />
                  </span>
                  <span className="min-w-0 text-sm font-bold text-pb-green">
                    Receive eligible SMS notifications
                  </span>
                  {savingSmsPreference && (
                    <SpinnerIcon className="animate-spin-soft ml-auto h-4 w-4 shrink-0 text-pb-khaki" />
                  )}
                </label>

                <p className="mt-3 flex items-start gap-2 text-[11px] leading-5 text-slate-500 sm:text-xs">
                  <AlertIcon className="mt-0.5 h-3 w-3 shrink-0" />
                  A valid mobile number is required. SMS may be unavailable
                  until a provider is configured.
                </p>

                {smsPreferenceMessage && (
                  <p
                    role="status"
                    className="animate-fade-up mt-3 inline-flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-800 sm:text-sm"
                  >
                    <CheckCircleIcon className="h-3.5 w-3.5 shrink-0" />
                    {smsPreferenceMessage}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ================= NOTIFICATIONS LIST ================= */}
        <section className="animate-fade-up overflow-hidden rounded-2xl border border-pb-border bg-white/90 shadow-sm backdrop-blur-sm" style={{ animationDelay: "120ms" }}>

          {/* Header: filters + mark all */}
          <div className="border-b border-pb-border-soft bg-pb-light/40 px-5 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {/* Filter tabs */}
              <div className="inline-flex items-center gap-1.5 self-start rounded-xl border border-pb-border bg-white p-1">
                <span className="pl-2 pr-1 text-pb-green">
                  <FilterIcon className="h-3.5 w-3.5" />
                </span>
                {[false, true].map((onlyUnread) => {
                  const active = unreadOnly === onlyUnread;
                  return (
                    <button
                      key={String(onlyUnread)}
                      type="button"
                      aria-pressed={active}
                      onClick={() => {
                        setPage(1);
                        setUnreadOnly(onlyUnread);
                      }}
                      className={`inline-flex min-h-9 items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-extrabold transition-all duration-200 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none sm:text-sm ${active
                          ? "bg-gradient-to-r from-pb-green to-[#0f3d2e] text-white shadow-sm"
                          : "text-pb-green hover:bg-pb-light"
                        }`}
                    >
                      {onlyUnread ? "Unread" : "All"}
                      {onlyUnread && unreadCount > 0 && (
                        <span
                          className={`rounded-full px-1.5 text-[10px] font-black tabular-nums ${active
                              ? "bg-white/25"
                              : "bg-pb-khaki/20 text-pb-khaki"
                            }`}
                        >
                          {unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Mark all as read */}
              <button
                type="button"
                disabled={!unreadCount || markingAll}
                onClick={markAllRead}
                className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-pb-khaki bg-white px-4 py-2.5 text-sm font-extrabold text-pb-green shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-pb-light hover:shadow-md active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {markingAll ? (
                  <>
                    <SpinnerIcon className="animate-spin-soft h-4 w-4" />
                    Updating…
                  </>
                ) : (
                  <>
                    <CheckCheckIcon className="h-4 w-4" />
                    Mark all as read
                  </>
                )}
              </button>
            </div>

            {/* Action error */}
            {actionError && (
              <div
                role="alert"
                className="animate-fade-up mt-3 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-semibold text-red-700"
              >
                <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
                <span className="min-w-0 break-words">{actionError}</span>
              </div>
            )}
          </div>

          {/* Content */}
          {loading ? (
            <div
              role="status"
              className="flex flex-col items-center justify-center gap-3 px-5 py-12 text-center"
            >
              <SpinnerIcon className="animate-spin-soft h-10 w-10 text-pb-khaki" />
              <p className="text-sm font-semibold text-pb-green">
                Loading notifications…
              </p>
              <p className="text-xs text-slate-500">
                Fetching your latest updates.
              </p>
            </div>
          ) : error ? (
            <div
              role="alert"
              className="flex flex-col items-center gap-4 px-5 py-10 text-center"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                <AlertIcon className="h-6 w-6" />
              </span>
              <p className="max-w-md text-sm font-semibold text-red-700">
                {error}
              </p>
              <button
                type="button"
                onClick={loadNotifications}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-pb-green to-[#0f3d2e] px-5 py-2.5 text-sm font-extrabold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:from-pb-khaki hover:to-[#c9b95f] hover:shadow-lg active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <RefreshIcon className="h-4 w-4" />
                Try again
              </button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-5 py-14 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-pb-light text-pb-khaki">
                <InboxIcon className="h-6 w-6" />
              </span>
              <p className="text-base font-extrabold text-pb-green">
                {unreadOnly
                  ? "No unread notifications."
                  : "You have no notifications yet."}
              </p>
              <p className="max-w-md text-sm text-slate-500">
                नवीन सूचना येथे दिसतील.
              </p>
            </div>
          ) : (
            <div className="space-y-3 p-4 sm:p-5">
              {notifications.map((notification, index) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  busy={busyNotificationId === notification.id}
                  onOpen={openNotification}
                  index={index}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && !error && pagination.pages > 0 && (
            <div className="flex flex-col gap-3 border-t border-pb-border-soft bg-pb-light/30 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="rounded-full border border-pb-border-soft bg-white/80 px-3 py-1.5 text-xs font-bold tabular-nums text-pb-green shadow-sm sm:text-sm">
                Page {pagination.page} of {pagination.pages} ·{" "}
                {pagination.total} notifications
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-pb-border bg-white px-4 py-2 text-sm font-bold text-pb-green transition-all duration-200 hover:-translate-y-0.5 hover:border-pb-khaki hover:bg-pb-light hover:shadow-sm active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 sm:flex-none"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= pagination.pages}
                  onClick={() =>
                    setPage((current) =>
                      Math.min(pagination.pages, current + 1),
                    )
                  }
                  className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-pb-green to-[#0f3d2e] px-4 py-2 text-sm font-extrabold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:from-pb-khaki hover:to-[#c9b95f] hover:shadow-lg active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 sm:flex-none"
                >
                  Next
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default Notifications;