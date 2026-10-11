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

const PER_PAGE = 20;

function friendlyError(error, fallback) {
  const status = error.response?.status;
  if (status === 401) return "Your session has expired. Please sign in again.";
  if (status === 403) return "You do not have permission to access these notifications.";
  if (status === 404) return "This notification is no longer available.";
  if (status === 409) return "This item is not available yet.";
  if (status === 422) return error.response?.data?.message || "Some notification details are invalid.";
  if (status >= 500) return "The notification service is temporarily unavailable. Please try again.";
  if (!error.response) return "Could not connect to the server. Check your connection and try again.";
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

function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pagination, setPagination] = useState({ page: 1, per_page: PER_PAGE, total: 0, pages: 0 });
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
      setSmsPreferenceMessage("Could not save your SMS preference. Please try again.");
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
      if (!response?.success || !Array.isArray(response.data?.notifications) || !response.data?.pagination) {
        throw new Error(response?.message || "The notification response was incomplete.");
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
      setNotifications((current) => current.map((item) => (
        item.id === notification.id ? (readNotification || { ...item, is_read: true }) : item
      )));
      setUnreadCount(Number(response?.data?.unread_count) || 0);

      let target = notificationRoute(notification);
      if (String(notification.related_entity_type || "").toUpperCase() === "RESULT") {
        try {
          const result = await getTestAttemptResult(notification.related_entity_id);
          if (result?.success && result.data?.test_id) {
            target = `/student/tests/${result.data.test_id}/result/${notification.related_entity_id}`;
          }
        } catch {
          target = null;
        }
      }
      if (target) navigate(target);
      else if (unreadOnly) {
        const remaining = notifications.filter((item) => item.id !== notification.id);
        setNotifications(remaining);
        if (!remaining.length && page > 1) setPage((current) => current - 1);
      }
    } catch (requestError) {
      setActionError(friendlyError(requestError, "Could not update this notification."));
    } finally {
      setBusyNotificationId(null);
    }
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    setActionError("");
    try {
      await markAllNotificationsRead();
      setNotifications((current) => current.map((item) => ({ ...item, is_read: true })));
      setUnreadCount(0);
      if (unreadOnly) {
        setNotifications([]);
        setPage(1);
      }
    } catch (requestError) {
      setActionError(friendlyError(requestError, "Could not mark notifications as read."));
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div className="min-h-full bg-pb-light">
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <header className="rounded-2xl bg-pb-green p-5 text-white shadow-sm sm:p-7">
          <p className="text-sm font-bold text-[#d8c98f]">Student updates</p>
          <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
            <div><h1 className="text-2xl font-extrabold sm:text-3xl">Notifications</h1><p className="mt-2 text-sm text-white/80">तुमच्या अभ्यासासाठी महत्त्वाच्या सूचना आणि अपडेट्स.</p></div>
            <span className="rounded-full bg-white/10 px-3 py-1.5 text-sm font-bold">{unreadCount} unread</span>
          </div>
        </header>

        <section className="mt-5 rounded-2xl border border-pb-border bg-white p-4 shadow-sm sm:p-5" aria-labelledby="sms-preference-title">
          <h2 id="sms-preference-title" className="font-extrabold text-pb-green">SMS notifications</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">Choose whether to receive important test announcements and result updates by SMS. Your consent is off by default.</p>
          <label className="mt-4 flex items-center gap-3 text-sm font-bold text-pb-green">
            <input type="checkbox" checked={smsPreference === true} disabled={smsPreference === null || savingSmsPreference} onChange={(event) => changeSmsPreference(event.target.checked)} className="h-4 w-4 accent-pb-green" />
            Receive eligible SMS notifications
          </label>
          <p className="mt-2 text-xs text-slate-500">A valid mobile number is required. SMS may be unavailable until a provider is configured.</p>
          {smsPreferenceMessage && <p role="status" className="mt-2 text-sm text-pb-green">{smsPreferenceMessage}</p>}
        </section>

        <section className="mt-5 overflow-hidden rounded-2xl border border-pb-border bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-pb-border-soft p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex flex-wrap gap-2">
              {[false, true].map((onlyUnread) => (
                <button key={String(onlyUnread)} type="button" aria-pressed={unreadOnly === onlyUnread} onClick={() => { setPage(1); setUnreadOnly(onlyUnread); }} className={`rounded-full px-3 py-2 text-sm font-bold ${unreadOnly === onlyUnread ? "bg-pb-green text-white" : "border border-pb-border bg-pb-light text-pb-green"}`}>
                  {onlyUnread ? "Unread" : "All notifications"}
                </button>
              ))}
            </div>
            <button type="button" disabled={!unreadCount || markingAll} onClick={markAllRead} className="rounded-lg border border-pb-khaki px-4 py-2.5 text-sm font-bold text-pb-green hover:bg-pb-light disabled:cursor-not-allowed disabled:opacity-50">{markingAll ? "Updating…" : "Mark all as read"}</button>
          </div>

          {actionError && <p role="alert" className="mx-4 mt-4 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700 sm:mx-5">{actionError}</p>}
          {loading ? (
            <div role="status" className="p-10 text-center text-sm font-semibold text-slate-600"><span className="mx-auto block h-8 w-8 animate-spin rounded-full border-4 border-pb-border border-t-pb-khaki" /><p className="mt-3">Loading notifications…</p></div>
          ) : error ? (
            <div role="alert" className="p-8 text-center"><p className="font-semibold text-red-700">{error}</p><button type="button" onClick={loadNotifications} className="mt-4 rounded-lg bg-pb-green px-4 py-2.5 text-sm font-bold text-white">Try again</button></div>
          ) : notifications.length === 0 ? (
            <div className="p-10 text-center"><p className="font-bold text-pb-green">{unreadOnly ? "No unread notifications." : "You have no notifications yet."}</p><p className="mt-1 text-sm text-slate-500">नवीन सूचना येथे दिसतील.</p></div>
          ) : (
            <div className="divide-y divide-pb-border-soft">
              {notifications.map((notification) => (
                <button key={notification.id} type="button" disabled={busyNotificationId === notification.id} onClick={() => openNotification(notification)} className={`block w-full p-4 text-left transition hover:bg-pb-light sm:px-5 ${notification.is_read ? "bg-white" : "bg-pb-light/70"}`}>
                  <div className="flex min-w-0 items-start gap-3">
                    <span aria-hidden="true" className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${notification.is_read ? "bg-slate-300" : "bg-pb-khaki"}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <h2 className={`break-words text-sm ${notification.is_read ? "font-semibold text-pb-green" : "font-extrabold text-pb-green"}`}>{notification.title}</h2>
                        <span className="shrink-0 text-xs text-slate-500">{notification.created_at ? new Date(notification.created_at).toLocaleString("mr-IN", { dateStyle: "medium", timeStyle: "short" }) : ""}</span>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">{notification.message}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                        <span className="rounded-full bg-[#e8eee3] px-2.5 py-1 font-bold uppercase text-pb-green">{notificationTypeLabel(notification.notification_type)}</span>
                        <span className={`font-bold ${notification.is_read ? "text-slate-500" : "text-pb-khaki"}`}>{notification.is_read ? "Read" : "Unread"}</span>
                        {busyNotificationId === notification.id && <span role="status" className="text-slate-500">Opening…</span>}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {!loading && !error && pagination.pages > 0 && <div className="flex flex-col gap-3 border-t border-pb-border-soft px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"><p className="text-sm font-semibold text-slate-600">Page {pagination.page} of {pagination.pages} · {pagination.total} notifications</p><div className="flex gap-2"><button type="button" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="rounded-lg border border-pb-border px-4 py-2 text-sm font-bold text-pb-green disabled:opacity-40">Previous</button><button type="button" disabled={page >= pagination.pages} onClick={() => setPage((current) => Math.min(pagination.pages, current + 1))} className="rounded-lg border border-pb-border px-4 py-2 text-sm font-bold text-pb-green disabled:opacity-40">Next</button></div></div>}
        </section>
      </div>
    </div>
  );
}

export default Notifications;
