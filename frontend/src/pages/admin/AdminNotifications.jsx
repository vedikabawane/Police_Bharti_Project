import { useRef, useState } from "react";
import { sendNotification } from "../../services/admin/adminNotificationService";

const fieldClass = "mt-2 w-full rounded-lg border border-pb-border bg-white px-3.5 py-3 text-sm text-pb-green outline-none focus:border-pb-khaki focus:ring-2 focus:ring-pb-khaki/20";

function sendError(error) {
  const status = error.response?.status;
  if (status === 401) return "Your session has expired. Please sign in again.";
  if (status === 403) return "You do not have permission to send announcements.";
  if (status === 404) return "The notification service could not be found.";
  if (status === 409) return "This announcement could not be sent in its current state.";
  if (status === 422) return error.response?.data?.message || "Check the title, message, and recipient selection.";
  if (status >= 500) return "The server could not send the announcement. Please try again.";
  if (!error.response) return "Could not connect to the server. Check your connection and try again.";
  return error.response?.data?.message || error.message || "Could not send the announcement.";
}

function AdminNotifications() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [recipientType, setRecipientType] = useState("ALL_STUDENTS");
  const [sendSms, setSendSms] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const smsIdempotencyKey = useRef(null);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!title.trim() || !message.trim()) {
      setError("Enter a title and message before sending.");
      return;
    }
    setSending(true);
    try {
      if (sendSms && !smsIdempotencyKey.current) {
        smsIdempotencyKey.current = crypto.randomUUID();
      }
      const response = await sendNotification({
        title: title.trim(),
        message: message.trim(),
        recipient_type: recipientType,
        send_sms: sendSms,
      }, sendSms ? smsIdempotencyKey.current : undefined);
      if (!response?.success) throw new Error(response?.message || "Could not send the announcement.");
      setSuccess(`Announcement sent to ${response.data?.recipient_count ?? 0} active students.`);
      setTitle("");
      setMessage("");
      setSendSms(false);
      smsIdempotencyKey.current = null;
    } catch (requestError) {
      setError(sendError(requestError));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <header className="rounded-2xl bg-pb-green p-5 text-white shadow-sm sm:p-7">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#d8c98f]">Student communication</p>
        <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">Send notification</h1>
        <p className="mt-2 text-sm leading-6 text-white/80">Send an in-app announcement to active student accounts.</p>
      </header>

      <form onSubmit={submit} className="mt-5 space-y-5 rounded-2xl border border-pb-border bg-white p-5 shadow-sm sm:p-7">
        <div>
          <label htmlFor="notification-title" className="text-sm font-bold text-pb-green">Title</label>
          <input id="notification-title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={200} required className={fieldClass} placeholder="Announcement title" />
          <p className="mt-1 text-right text-xs text-slate-500">{title.length}/200</p>
        </div>
        <div>
          <label htmlFor="notification-message" className="text-sm font-bold text-pb-green">Message</label>
          <textarea id="notification-message" value={message} onChange={(event) => setMessage(event.target.value)} maxLength={2000} required rows={7} className={`${fieldClass} resize-y leading-6`} placeholder="Write the announcement for students…" />
          <p className="mt-1 text-right text-xs text-slate-500">{message.length}/2000</p>
        </div>
        <div>
          <label htmlFor="notification-recipients" className="text-sm font-bold text-pb-green">Recipients</label>
          <select id="notification-recipients" value={recipientType} onChange={(event) => setRecipientType(event.target.value)} className={fieldClass}>
            <option value="ALL_STUDENTS">All active students</option>
          </select>
          <p className="mt-1 text-xs leading-5 text-slate-500">Administrators are excluded. Each active student receives one in-app notification.</p>
        </div>
        <div className="rounded-lg border border-pb-border-soft bg-pb-light p-4">
          <label htmlFor="notification-send-sms" className="flex items-start gap-3 text-sm font-bold text-pb-green">
            <input id="notification-send-sms" type="checkbox" checked={sendSms} onChange={(event) => setSendSms(event.target.checked)} className="mt-0.5 h-4 w-4 accent-pb-green" />
            <span>Also send this important announcement by SMS to students who opted in.</span>
          </label>
          <p className="mt-2 pl-7 text-xs leading-5 text-slate-600">Only active students with a valid mobile number and SMS consent are eligible. SMS requires an enabled provider.</p>
        </div>
        {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
        {success && <p role="status" className="rounded-lg border border-[#cbd8c1] bg-[#e8eee3] p-3 text-sm font-semibold text-pb-green">{success}</p>}
        <div className="flex flex-col-reverse gap-3 border-t border-pb-border-soft pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">Notifications are saved in the platform and can be marked read by each student.</p>
          <button type="submit" disabled={sending} className="inline-flex items-center justify-center rounded-lg bg-pb-green px-5 py-3 text-sm font-bold text-white hover:bg-pb-khaki disabled:cursor-not-allowed disabled:opacity-60">{sending ? "Sending…" : "Send announcement"}</button>
        </div>
      </form>
    </div>
  );
}

export default AdminNotifications;
