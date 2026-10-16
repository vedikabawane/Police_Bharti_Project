import { useEffect, useState } from "react";
import { getVideoFile } from "../../../services/studyContentService";

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

const VideoIcon = (p) => (
  <svg {...iconProps} {...p}>
    <rect x="3" y="6" width="13" height="12" rx="2" />
    <path d="m16 10 4-2v8l-4-2Z" />
  </svg>
);
const PlayCircleIcon = (p) => (
  <svg {...iconProps} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m10 8 6 4-6 4Z" />
  </svg>
);
const ClockIcon = (p) => (
  <svg {...iconProps} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);
const BookIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 0-2 2Z" />
    <path d="M18 3v18" />
  </svg>
);
const FolderIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
  </svg>
);
const ExternalLinkIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M14 4h6v6" />
    <path d="M20 4 10 14" />
    <path d="M20 14v6H4V4h6" />
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
const CloseIcon = (p) => (
  <svg {...iconProps} strokeWidth="2" {...p}>
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
);
const InfoIcon = (p) => (
  <svg {...iconProps} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" />
  </svg>
);

export function getSafeVideoUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

export function getYoutubeEmbedUrl(value) {
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    let videoId = "";
    if (host === "youtu.be") {
      videoId = url.pathname.split("/").filter(Boolean)[0] || "";
    } else if (host === "youtube.com" || host === "m.youtube.com") {
      if (url.pathname === "/watch") videoId = url.searchParams.get("v") || "";
      else if (/^\/(embed|shorts)\//.test(url.pathname))
        videoId = url.pathname.split("/")[2] || "";
    }
    if (!/^[A-Za-z0-9_-]{11}$/.test(videoId)) return null;
    return `https://www.youtube.com/embed/${videoId}`;
  } catch {
    return null;
  }
}

/* ---------- ANIMATIONS ---------- */
function AnimationStyles() {
  return (
    <style>{`
      @keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes dialogIn {
        from { opacity: 0; transform: translateY(12px) scale(0.96); }
        to { opacity: 1; transform: translateY(0) scale(1); }
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
      .animate-overlay-in { animation: overlayIn 0.2s ease-out both; }
      .animate-dialog-in { animation: dialogIn 0.3s cubic-bezier(0.22, 1, 0.36, 1) both; }
      .animate-gradient { background-size: 220% 220%; animation: gradientPan 9s ease infinite; }
      .animate-soft-glow { animation: softGlow 4.5s ease-in-out infinite; }
      .animate-spin-soft { animation: spinSoft 0.9s linear infinite; }
      @media (prefers-reduced-motion: reduce) {
        .animate-overlay-in, .animate-dialog-in, .animate-gradient,
        .animate-soft-glow, .animate-spin-soft { animation: none !important; }
      }
    `}</style>
  );
}

function StudentVideoViewer({ video, subjectName, topicName, onClose }) {
  const embedUrl = getYoutubeEmbedUrl(video.video_url);
  const externalUrl = getSafeVideoUrl(video.video_url);
  const isUploadedVideo = video.source_type === "UPLOAD";
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState("");
  const [fileError, setFileError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!isUploadedVideo) return undefined;
    let current = true;
    let objectUrl = "";
    setFileError("");
    setUploadedVideoUrl("");
    getVideoFile(video.id)
      .then((file) => {
        if (!current) return;
        objectUrl = URL.createObjectURL(file);
        setUploadedVideoUrl(objectUrl);
        setFileError("");
      })
      .catch(() => {
        if (current)
          setFileError("व्हिडिओ लोड करता आला नाही. कृपया पुन्हा प्रयत्न करा.");
      });
    return () => {
      current = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setUploadedVideoUrl("");
    };
  }, [video.id, isUploadedVideo, retryKey]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const retryUpload = () => {
    if (isUploadedVideo) setRetryKey((k) => k + 1);
  };

  return (
    <div
      className="animate-overlay-in fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/75 p-2 backdrop-blur-sm sm:p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <AnimationStyles />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="student-video-title"
        className="animate-dialog-in relative my-auto w-full max-w-5xl overflow-hidden rounded-2xl border border-pb-border bg-white shadow-2xl"
      >
        {/* Top gradient accent */}
        <span
          aria-hidden="true"
          className="animate-gradient pointer-events-none absolute inset-x-0 top-0 z-10 h-1 bg-gradient-to-r from-pb-green via-pb-khaki to-pb-green"
        />

        {/* ================= HEADER ================= */}
        <header className="flex items-start justify-between gap-3 border-b border-pb-border-soft bg-pb-light/40 px-4 pt-4 pb-3 sm:px-6 sm:pt-5 sm:pb-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="relative hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-pb-green to-[#0f3d2e] text-white shadow-md sm:flex">
              <span
                aria-hidden="true"
                className="animate-soft-glow pointer-events-none absolute -inset-1 rounded-2xl bg-pb-khaki/30 blur-md"
              />
              <VideoIcon className="relative h-5 w-5" />
            </span>

            <div className="min-w-0">
              <p className="text-[10px] font-bold tracking-[0.16em] text-pb-khaki uppercase sm:text-xs">
                व्हिडिओ
              </p>
              <h2
                id="student-video-title"
                className="mt-0.5 text-base leading-snug font-extrabold break-words text-pb-green sm:text-lg"
              >
                {video.title}
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold text-slate-500 sm:text-xs">
                <span className="inline-flex items-center gap-1.5">
                  <BookIcon className="h-3 w-3 shrink-0" />
                  {subjectName || "विषय"}
                </span>
                <span className="text-slate-300">•</span>
                <span className="inline-flex items-center gap-1.5">
                  <FolderIcon className="h-3 w-3 shrink-0" />
                  {topicName || "प्रकरण"}
                </span>
                {video.duration && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="inline-flex items-center gap-1.5">
                      <ClockIcon className="h-3 w-3 shrink-0" />
                      {video.duration}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="व्हिडिओ बंद करा"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-pb-border bg-white text-pb-green transition-all duration-200 hover:border-pb-khaki hover:bg-pb-light focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none active:scale-95"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </header>

        {/* ================= VIDEO PLAYER ================= */}
        {isUploadedVideo ? (
          <div className="aspect-video w-full bg-black">
            {uploadedVideoUrl ? (
              <video
                src={uploadedVideoUrl}
                controls
                playsInline
                preload="metadata"
                className="h-full w-full"
                aria-label={video.title}
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 px-5 text-center">
                {fileError ? (
                  <>
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/15 text-red-400">
                      <AlertIcon className="h-6 w-6" />
                    </span>
                    <p
                      role="alert"
                      className="max-w-md text-sm font-semibold text-white/90"
                    >
                      {fileError}
                    </p>
                    <button
                      type="button"
                      onClick={retryUpload}
                      className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-pb-green to-[#0f3d2e] px-5 py-2.5 text-sm font-extrabold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:from-pb-khaki hover:to-[#c9b95f] hover:shadow-lg active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 focus-visible:outline-none"
                    >
                      <RefreshIcon className="h-4 w-4" />
                      पुन्हा प्रयत्न करा
                    </button>
                  </>
                ) : (
                  <>
                    <SpinnerIcon className="animate-spin-soft h-10 w-10 text-pb-khaki" />
                    <p className="text-sm font-semibold text-white/90">
                      व्हिडिओ लोड होत आहे...
                    </p>
                    <p className="text-xs text-white/60">
                      Fetching the video file.
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        ) : embedUrl ? (
          <div className="aspect-video w-full bg-black">
            <iframe
              src={embedUrl}
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="h-full w-full border-0"
            />
          </div>
        ) : (
          /* ================= FALLBACK ================= */
          <div className="flex flex-col items-center justify-center gap-4 bg-pb-light px-5 py-12 text-center sm:py-16">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-pb-green to-[#0f3d2e] text-white shadow-lg">
              <PlayCircleIcon className="h-6 w-6" />
            </span>
            <p className="max-w-md text-sm leading-6 font-semibold text-slate-700">
              हा व्हिडिओ नवीन टॅबमध्ये उघडा.
            </p>

            {externalUrl ? (
              <a
                href={externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex min-h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-pb-green to-[#0f3d2e] px-5 py-2.5 text-sm font-extrabold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:from-pb-khaki hover:to-[#c9b95f] hover:shadow-lg active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <ExternalLinkIcon className="h-4 w-4" />
                व्हिडिओ उघडा
              </a>
            ) : (
              <p
                role="alert"
                className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700"
              >
                <AlertIcon className="h-4 w-4 shrink-0" />
                व्हिडिओ URL उपलब्ध नाही.
              </p>
            )}
          </div>
        )}

        {/* ================= DESCRIPTION ================= */}
        <div className="space-y-3 px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-pb-green/10 text-pb-green">
              <InfoIcon className="h-3.5 w-3.5" />
            </span>
            <p className="text-xs font-extrabold tracking-wide text-pb-green uppercase">
              व्हिडिओ माहिती
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-pb-border-soft bg-pb-light px-2.5 py-1 text-[11px] font-bold text-slate-600">
              <BookIcon className="h-3 w-3" />
              {subjectName || "विषय"}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-pb-border-soft bg-pb-light px-2.5 py-1 text-[11px] font-bold text-slate-600">
              <FolderIcon className="h-3 w-3" />
              {topicName || "प्रकरण"}
            </span>
            {video.duration && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-pb-khaki/30 bg-pb-khaki/10 px-2.5 py-1 text-[11px] font-bold text-pb-khaki">
                <ClockIcon className="h-3 w-3" />
                {video.duration}
              </span>
            )}
          </div>

          {video.description && (
            <p className="text-sm leading-6 break-words text-slate-600">
              {video.description}
            </p>
          )}

          {embedUrl && externalUrl && (
            <a
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-1.5 text-xs font-bold text-pb-khaki transition-colors duration-200 hover:text-pb-green focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none"
            >
              <ExternalLinkIcon className="h-3.5 w-3.5" />
              <span className="underline decoration-pb-khaki/40 decoration-1 underline-offset-2 transition-colors group-hover:decoration-pb-green">
                नवीन टॅबमध्ये उघडा
              </span>
            </a>
          )}
        </div>
      </section>
    </div>
  );
}

export default StudentVideoViewer;