function AdminConfirmDialog({
  title,
  message,
  detail,
  busy = false,
  error = "",
  confirmLabel = "हटवा",
  onCancel,
  onConfirm,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-confirm-title"
        aria-describedby="admin-confirm-description"
        className="my-auto w-full max-w-md rounded-xl border border-pb-border bg-white p-5 shadow-xl sm:p-6"
      >
        <h2 id="admin-confirm-title" className="text-lg font-extrabold text-pb-green">
          {title}
        </h2>
        <p id="admin-confirm-description" className="mt-3 break-words text-sm leading-6 text-slate-700">
          {message}
        </p>
        {detail && <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>}
        {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="min-h-11 rounded-lg border border-pb-border px-4 text-sm font-bold text-pb-green hover:bg-pb-light focus-visible:outline-pb-khaki disabled:opacity-60"
          >
            रद्द करा
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className="min-h-11 rounded-lg bg-red-700 px-4 text-sm font-bold text-white hover:bg-red-800 focus-visible:outline-pb-khaki disabled:cursor-wait disabled:opacity-60"
          >
            {busy ? "कृपया थांबा..." : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

export default AdminConfirmDialog;
