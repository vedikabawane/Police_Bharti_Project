import { useEffect, useRef } from "react";

/* ---------- SVG ICON SET ---------- */
const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.9",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": "true",
};

const AlertIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M10.3 3.9 2.4 17a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </svg>
);

const TrashIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M3 6h18" />
    <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
    <path d="M19 6v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <path d="M10 11v5M14 11v5" />
  </svg>
);

const SpinnerIcon = (p) => (
  <svg {...iconProps} strokeWidth="2.4" {...p}>
    <path d="M21 12a9 9 0 1 1-6.2-8.5" />
  </svg>
);

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
  const dialogRef = useRef(null);
  const cancelRef = useRef(null);
  const confirmRef = useRef(null);

  /* Lock body scroll + Escape to close */
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event) => {
      if (event.key === "Escape" && !busy) onCancel?.();
    };
    window.addEventListener("keydown", handleEscape);

    // Autofocus: cancel is safer default for destructive actions
    const focusTarget = error ? confirmRef.current : cancelRef.current;
    focusTarget?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [busy, error, onCancel]);

  /* Focus trap helper (simple) */
  const handleKeyDown = (event) => {
    if (event.key !== "Tab") return;
    const focusables = dialogRef.current?.querySelectorAll(
      'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusables || focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const handleBackdropClick = (event) => {
    if (busy) return;
    if (event.target === event.currentTarget) onCancel?.();
  };

  return (
    <div
      className="animate-overlay-in fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/55 p-4 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      {/* ---------- ANIMATION KEYFRAMES ---------- */}
      <style>{`
        @keyframes overlayIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes dialogIn {
          from { opacity: 0; transform: translateY(10px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes dialogShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        @keyframes spinSoft {
          to { transform: rotate(360deg); }
        }
        @keyframes pulseRing {
          0%, 100% { box-shadow: 0 0 0 0 rgba(185, 28, 28, 0.35); }
          70% { box-shadow: 0 0 0 8px rgba(185, 28, 28, 0); }
        }
        .animate-overlay-in { animation: overlayIn 0.2s ease-out both; }
        .animate-dialog-in { animation: dialogIn 0.28s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .animate-dialog-shake { animation: dialogShake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both; }
        .animate-spin-soft { animation: spinSoft 0.9s linear infinite; }
        .animate-pulse-ring { animation: pulseRing 2s ease-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .animate-overlay-in, .animate-dialog-in, .animate-dialog-shake,
          .animate-spin-soft, .animate-pulse-ring { animation: none !important; }
        }
      `}</style>

      <section
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="admin-confirm-title"
        aria-describedby="admin-confirm-description"
        onKeyDown={handleKeyDown}
        className={`animate-dialog-in relative my-auto w-full max-w-md overflow-hidden rounded-2xl border border-pb-border bg-white shadow-2xl ring-1 ring-slate-950/5 sm:max-w-lg ${
          error ? "animate-dialog-shake" : ""
        }`}
      >
        {/* Top accent bar (danger gradient) */}
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-600 via-red-500 to-red-600"
        />

        {/* Content */}
        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-4">
            {/* Icon tile */}
            <span className="animate-pulse-ring relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-red-600 to-red-700 text-white shadow-md">
              <AlertIcon className="h-6 w-6" />
            </span>

            <div className="min-w-0 flex-1">
              <h2
                id="admin-confirm-title"
                className="text-lg leading-tight font-extrabold tracking-tight text-pb-green"
              >
                {title}
              </h2>
              <p
                id="admin-confirm-description"
                className="mt-2 text-sm leading-6 break-words text-slate-700"
              >
                {message}
              </p>
              {detail && (
                <p className="mt-2 rounded-lg border border-pb-border-soft bg-pb-light/60 px-3 py-2 text-sm leading-6 break-words text-slate-600">
                  {detail}
                </p>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <p
              role="alert"
              className="animate-dialog-in mt-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-semibold text-red-700"
            >
              <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="break-words">{error}</span>
            </p>
          )}

          {/* Actions */}
          <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
            <button
              ref={cancelRef}
              type="button"
              disabled={busy}
              onClick={onCancel}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-pb-border bg-white px-4 text-sm font-bold text-pb-green transition-all duration-200 hover:-translate-y-0.5 hover:bg-pb-light hover:shadow-sm active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none disabled:pointer-events-none disabled:opacity-60"
            >
              रद्द करा
            </button>

            <button
              ref={confirmRef}
              type="button"
              disabled={busy}
              onClick={onConfirm}
              className="group relative inline-flex min-h-11 items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-red-700 to-red-600 px-4 text-sm font-bold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:from-red-800 hover:to-red-700 hover:shadow-lg active:translate-y-0 focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-wait disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {busy ? (
                <>
                  <SpinnerIcon className="animate-spin-soft h-4 w-4" />
                  <span>कृपया थांबा...</span>
                </>
              ) : (
                <>
                  <TrashIcon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{confirmLabel}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default AdminConfirmDialog;