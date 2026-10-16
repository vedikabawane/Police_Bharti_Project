import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  getHandwrittenNotesByTopic,
  getNotesByTopic,
  getVideosByTopic,
} from "../../../services/studyContentService";
import {
  downloadStudyMaterialFile,
  getStudyMaterialFile,
  getStudyMaterialsByTopic,
} from "../../../services/studyMaterialService";
import StudentVideoViewer from "../videos/StudentVideoViewer";

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

const BookIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 0-2 2Z" />
    <path d="M18 3v18" />
  </svg>
);
const BookOpenIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M12 6.5C10.5 5 8 4 5 4v14c3 0 5.5 1 7 2.5 1.5-1.5 4-2.5 7-2.5V4c-3 0-5.5 1-7 2.5Z" />
    <path d="M12 6.5v14" />
  </svg>
);
const NoteIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M6 3h9l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
    <path d="M14 3v6h6M8 13h8M8 17h5" />
  </svg>
);
const PenIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="m4 20 4-1 10-10a2 2 0 0 0-3-3L5 16l-1 4Z" />
    <path d="m14 6 3 3" />
  </svg>
);
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
const FileIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M6 3h9l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
    <path d="M14 3v6h6" />
  </svg>
);
const DownloadIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M12 4v11M6 11l6 6 6-6" />
    <path d="M4 20h16" />
  </svg>
);
const EyeIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const ExternalLinkIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M14 4h6v6" />
    <path d="M20 4 10 14" />
    <path d="M20 14v6H4V4h6" />
  </svg>
);
const ArrowLeftIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M19 12H5" />
    <path d="m11 18-6-6 6-6" />
  </svg>
);
const ChevronRightIcon = (p) => (
  <svg {...iconProps} strokeWidth="2.2" {...p}>
    <path d="m9 6 6 6-6 6" />
  </svg>
);
const HomeIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="m3 11 9-7 9 7v9a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2Z" />
  </svg>
);
const LayersIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="m12 3 9 5-9 5-9-5 9-5Z" />
    <path d="m3 13 9 5 9-5M3 17l9 5 9-5" />
  </svg>
);
const ClockIcon = (p) => (
  <svg {...iconProps} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);
const CalendarIcon = (p) => (
  <svg {...iconProps} {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M8 3v4M16 3v4M3 10h18" />
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
const SparklesIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.3 6.3l2.8 2.8M14.9 14.9l2.8 2.8M17.7 6.3l-2.8 2.8M9.1 14.9l-2.8 2.8" />
  </svg>
);
const CloseIcon = (p) => (
  <svg {...iconProps} strokeWidth="2" {...p}>
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
);

const PDF_OPEN_ERROR = "PDF उघडता आले नाही. कृपया पुन्हा प्रयत्न करा.";
const PDF_DOWNLOAD_ERROR = "PDF डाउनलोड करताना अडचण आली. कृपया पुन्हा प्रयत्न करा.";
const PDF_DOWNLOAD_UNAVAILABLE = "हा PDF सध्या उपलब्ध नाही.";
const VIDEO_LOADING_MESSAGE = "व्हिडिओ लोड होत आहेत...";
const VIDEO_EMPTY_MESSAGE = "या विषयासाठी सध्या कोणतेही व्हिडिओ उपलब्ध नाहीत.";
const VIDEO_ERROR_MESSAGE = "व्हिडिओ लोड करताना समस्या आली.";

const getSafeDownloadFilename = (contentDisposition, fallback) => {
  let filename = "";
  const encodedFilename = contentDisposition?.match(/filename\*\s*=\s*UTF-8''([^;]+)/i)?.[1];
  if (encodedFilename) {
    try {
      filename = decodeURIComponent(encodedFilename.trim().replace(/^"|"$/g, ""));
    } catch {
      filename = "";
    }
  }
  if (!filename) {
    filename = contentDisposition?.match(/filename\s*=\s*(?:"([^"]+)"|([^;]+))/i)?.slice(1).find(Boolean)?.trim() || fallback;
  }
  const safeFilename = String(filename || fallback || "study-material.pdf")
    .split(/[\\/]/)
    .pop()
    .split("")
    .filter((character) => {
      const code = character.charCodeAt(0);
      return code >= 32 && code !== 127;
    })
    .join("")
    .trim();
  return safeFilename || "study-material.pdf";
};

const formatFileSize = (size) => {
  if (size < 1024) return `${size} Bytes`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

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
      @keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes dialogIn {
        from { opacity: 0; transform: translateY(10px) scale(0.98); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      .animate-blob { animation: blobMove 22s ease-in-out infinite; }
      .delay-2 { animation-delay: 4s; }
      .delay-4 { animation-delay: 8s; }
      .animate-fade-up { animation: fadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }
      .animate-gradient { background-size: 220% 220%; animation: gradientPan 9s ease infinite; }
      .animate-soft-glow { animation: softGlow 4.5s ease-in-out infinite; }
      .animate-spin-soft { animation: spinSoft 0.9s linear infinite; }
      .animate-overlay-in { animation: overlayIn 0.2s ease-out both; }
      .animate-dialog-in { animation: dialogIn 0.28s cubic-bezier(0.22, 1, 0.36, 1) both; }
      @media (prefers-reduced-motion: reduce) {
        .animate-blob, .animate-fade-up, .animate-gradient,
        .animate-soft-glow, .animate-spin-soft,
        .animate-overlay-in, .animate-dialog-in { animation: none !important; }
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

/* ---------- SECTION HEADER ---------- */
function SectionHeader({ icon: Icon, title, count, tone = "green" }) {
  const toneMap = {
    green: "bg-pb-green/10 text-pb-green",
    khaki: "bg-pb-khaki/15 text-pb-khaki",
  };
  return (
    <div className="animate-fade-up mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${toneMap[tone]}`}>
          <Icon className="h-4 w-4" />
        </span>
        <h2 className="text-lg leading-tight font-extrabold tracking-tight text-pb-green sm:text-xl">
          {title}
        </h2>
      </div>
      {typeof count === "number" && count > 0 && (
        <span className="rounded-full border border-pb-border-soft bg-white/80 px-3 py-1 text-[11px] font-bold tabular-nums text-pb-green shadow-sm backdrop-blur-sm">
          {count}
        </span>
      )}
    </div>
  );
}

/* ---------- EMPTY STATE ---------- */
function EmptyState({ icon: Icon = InboxIcon, children }) {
  return (
    <div className="animate-fade-up flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#d9d2c3] bg-white/70 px-5 py-10 text-center backdrop-blur-sm">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pb-light text-pb-khaki">
        <Icon className="h-5 w-5" />
      </span>
      <p className="text-sm font-semibold text-slate-500">{children}</p>
    </div>
  );
}

/* ---------- PDF PREVIEW MODAL ---------- */
function PdfPreviewModal({ material, blobUrl, onClose }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="animate-overlay-in fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-2 backdrop-blur-sm sm:p-4"
      role="presentation"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="study-material-pdf-title"
        className="animate-dialog-in relative flex h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-pb-border bg-white shadow-2xl"
      >
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 z-10 h-1 bg-gradient-to-r from-pb-green via-pb-khaki to-pb-green"
        />

        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-pb-border bg-pb-light/40 px-4 py-3 pt-4 sm:items-center sm:px-6 sm:py-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-pb-green to-[#0f3d2e] text-white shadow-sm sm:flex">
              <FileIcon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2
                id="study-material-pdf-title"
                className="truncate text-sm leading-snug font-extrabold text-pb-green sm:text-lg"
              >
                {material.title}
              </h2>
              <p className="mt-0.5 truncate text-[11px] text-slate-500 sm:text-xs">
                {material.original_filename}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <a
              href={blobUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-pb-border bg-white px-3 py-2 text-xs font-bold text-pb-green transition-all duration-200 hover:-translate-y-0.5 hover:border-pb-khaki hover:bg-pb-light hover:shadow-sm active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none sm:text-sm"
            >
              <ExternalLinkIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Open in new tab</span>
              <span className="sm:hidden">Open</span>
            </a>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close PDF preview"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-pb-border bg-white text-pb-green transition-all duration-200 hover:border-pb-khaki hover:bg-pb-light focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none active:scale-95"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>
        </header>

        <iframe
          src={blobUrl}
          title={`PDF preview: ${material.title}`}
          className="min-h-0 w-full flex-1 bg-slate-100"
        />
      </section>
    </div>
  );
}

function TopicDetail() {
  const { subjectId, topicId } = useParams();
  const location = useLocation();
  const topic = location.state?.topic;
  const [notes, setNotes] = useState([]);
  const [handwrittenNotes, setHandwrittenNotes] = useState([]);
  const [videos, setVideos] = useState([]);
  const [videosLoading, setVideosLoading] = useState(true);
  const [videosError, setVideosError] = useState("");
  const [videosReload, setVideosReload] = useState(0);
  const [activeVideo, setActiveVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pdfMaterials, setPdfMaterials] = useState([]);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [pdfError, setPdfError] = useState("");
  const [pdfReload, setPdfReload] = useState(0);
  const [loadingPdfId, setLoadingPdfId] = useState(null);
  const [downloadingPdfId, setDownloadingPdfId] = useState(null);
  const [pdfOpenError, setPdfOpenError] = useState("");
  const [pdfFailedMaterial, setPdfFailedMaterial] = useState(null);
  const [pdfDownloadError, setPdfDownloadError] = useState("");
  const [failedDownloadMaterial, setFailedDownloadMaterial] = useState(null);
  const [preview, setPreview] = useState(null);
  const blobUrlRef = useRef(null);
  const mountedRef = useRef(true);

  const loadContent = useCallback(async () => {
    setLoading(true);
    setError("");
    setNotes([]);
    setHandwrittenNotes([]);

    if (!topicId) {
      setError("Unable to load topic content.");
      setLoading(false);
      return;
    }

    try {
      const [notesResponse, handwrittenNotesResponse] = await Promise.all([
        getNotesByTopic(topicId),
        getHandwrittenNotesByTopic(topicId),
      ]);

      const responses = [notesResponse, handwrittenNotesResponse];

      if (
        responses.some(
          (response) => !response.success || !Array.isArray(response.data),
        )
      ) {
        throw new Error("Unexpected topic content response.");
      }

      setNotes(notesResponse.data.filter((item) => item.is_active === true));
      setHandwrittenNotes(
        handwrittenNotesResponse.data.filter((item) => item.is_active === true),
      );
    } catch {
      setError("Unable to load topic content.");
    } finally {
      setLoading(false);
    }
  }, [topicId]);

  useEffect(() => {
    Promise.resolve().then(loadContent);
  }, [loadContent]);

  useEffect(() => {
    let isCurrent = true;
    Promise.resolve()
      .then(() => {
        if (!isCurrent) return null;
        setVideosLoading(true);
        setVideosError("");
        setVideos([]);
        if (!topicId) throw new Error("Topic is unavailable.");
        return getVideosByTopic(topicId);
      })
      .then((response) => {
        if (!isCurrent || response === null) return;
        if (!response?.success || !Array.isArray(response.data)) {
          throw new Error("Unexpected videos response.");
        }
        if (isCurrent) {
          setVideos(response.data.filter((item) => item.is_active === true));
        }
      })
      .catch(() => {
        if (isCurrent) setVideosError(VIDEO_ERROR_MESSAGE);
      })
      .finally(() => {
        if (isCurrent) setVideosLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [topicId, videosReload]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    let isCurrent = true;
    Promise.resolve()
      .then(() => {
        if (isCurrent) {
          setPdfLoading(true);
          setPdfError("");
          setPdfMaterials([]);
        }
        if (!topicId) throw new Error("Topic is unavailable.");
        return getStudyMaterialsByTopic(topicId);
      })
      .then((response) => {
        if (!response?.success || !Array.isArray(response.data)) {
          throw new Error("Unexpected study material response.");
        }
        if (isCurrent) setPdfMaterials(response.data);
      })
      .catch(() => {
        if (isCurrent)
          setPdfError(
            "अभ्यास साहित्य लोड करता आले नाही. कृपया पुन्हा प्रयत्न करा.",
          );
      })
      .finally(() => {
        if (isCurrent) setPdfLoading(false);
      });
    return () => {
      isCurrent = false;
    };
  }, [topicId, pdfReload]);

  const closePreview = useCallback(() => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setPreview(null);
  }, []);

  const openPdf = async (material) => {
    if (loadingPdfId !== null) return;
    setLoadingPdfId(material.id);
    setPdfOpenError("");
    setPdfFailedMaterial(null);
    try {
      const blob = await getStudyMaterialFile(material.id);
      if (!(blob instanceof Blob)) throw new Error("Invalid PDF response.");
      const blobUrl = URL.createObjectURL(blob);
      if (!mountedRef.current) {
        URL.revokeObjectURL(blobUrl);
        return;
      }
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = blobUrl;
      setPreview({ material, blobUrl });
    } catch {
      if (mountedRef.current) {
        setPdfOpenError(PDF_OPEN_ERROR);
        setPdfFailedMaterial(material);
      }
    } finally {
      if (mountedRef.current) setLoadingPdfId(null);
    }
  };

  const downloadPdf = async (material) => {
    if (downloadingPdfId !== null) return;
    setDownloadingPdfId(material.id);
    setPdfDownloadError("");
    setFailedDownloadMaterial(null);
    let blobUrl = null;
    let link = null;
    try {
      const response = await downloadStudyMaterialFile(material.id);
      if (!(response?.data instanceof Blob))
        throw new Error("Invalid PDF response.");
      const disposition =
        response.headers?.["content-disposition"] ||
        response.headers?.get?.("content-disposition");
      const filename = getSafeDownloadFilename(
        disposition,
        material.original_filename,
      );
      blobUrl = URL.createObjectURL(response.data);
      link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
    } catch (requestError) {
      const message =
        requestError.response?.status === 404
          ? PDF_DOWNLOAD_UNAVAILABLE
          : PDF_DOWNLOAD_ERROR;
      if (mountedRef.current) {
        setPdfDownloadError(message);
        setFailedDownloadMaterial(material);
      }
    } finally {
      link?.remove();
      if (blobUrl) window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      if (mountedRef.current) setDownloadingPdfId(null);
    }
  };

  const activeContentCount =
    notes.length + handwrittenNotes.length + videos.length + pdfMaterials.length;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-pb-light">
      <AnimationStyles />
      <AnimatedBackground />

      <div className="relative z-10">

        {/* ================= BREADCRUMB + HEADER ================= */}
        <div className="animate-fade-up mx-auto mt-4 w-[calc(100%-2rem)] max-w-7xl overflow-hidden rounded-2xl border border-pb-border/50 bg-white/85 shadow-sm backdrop-blur-sm sm:mt-6 sm:w-[calc(100%-3rem)] lg:w-[calc(100%-4rem)]">
          <span
            aria-hidden="true"
            className="animate-gradient pointer-events-none block h-1 w-full bg-gradient-to-r from-pb-green via-pb-khaki to-pb-green"
          />

          <div className="p-5 sm:p-6">
            {/* Breadcrumb */}
            <nav
              aria-label="Breadcrumb"
              className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold text-pb-khaki sm:text-xs"
            >
              <Link
                to="/student/dashboard"
                className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 transition-all duration-200 hover:bg-pb-light hover:text-pb-green focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none"
              >
                <HomeIcon className="h-3.5 w-3.5" />
                Dashboard
              </Link>
              <ChevronRightIcon className="h-3 w-3 text-slate-400" />
              <Link
                to="/student/study"
                className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 transition-all duration-200 hover:bg-pb-light hover:text-pb-green focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none"
              >
                अभ्यास साहित्य
              </Link>
              {subjectId && (
                <>
                  <ChevronRightIcon className="h-3 w-3 text-slate-400" />
                  <Link
                    to={`/student/study/${subjectId}`}
                    className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 transition-all duration-200 hover:bg-pb-light hover:text-pb-green focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none"
                  >
                    Topics
                  </Link>
                </>
              )}
              <ChevronRightIcon className="h-3 w-3 text-slate-400" />
              <span className="text-slate-500">Topic Details</span>
            </nav>

            {/* Title + actions */}
            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 items-start gap-4">
                <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-pb-green to-[#0f3d2e] text-white shadow-md">
                  <span
                    aria-hidden="true"
                    className="animate-soft-glow pointer-events-none absolute -inset-1 rounded-3xl bg-pb-khaki/30 blur-md"
                  />
                  <BookOpenIcon className="relative h-6 w-6" />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold tracking-[0.16em] text-pb-khaki uppercase sm:text-xs">
                    Study Material
                  </p>
                  <h1 className="mt-1 text-xl leading-tight font-extrabold tracking-tight break-words text-pb-green sm:text-2xl lg:text-3xl">
                    {topic?.name || "Topic Details"}
                  </h1>
                  {topic?.description && (
                    <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-600 sm:text-sm">
                      {topic.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Resource count pill */}
              {!loading && !error && !videosLoading && activeContentCount > 0 && (
                <span className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full border border-pb-khaki/30 bg-pb-khaki/10 px-3 py-1.5 text-xs font-extrabold text-pb-khaki backdrop-blur-sm">
                  <SparklesIcon className="h-3.5 w-3.5" />
                  {activeContentCount} resources
                </span>
              )}
            </div>

            {/* Back link */}
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                to={`/student/study/${subjectId}`}
                className="group inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-pb-border bg-white px-3 py-2 text-xs font-bold text-pb-green transition-all duration-200 hover:-translate-y-0.5 hover:border-pb-khaki hover:bg-pb-light hover:shadow-sm active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none sm:text-sm"
              >
                <ArrowLeftIcon className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-1" />
                Back to Topics
              </Link>
            </div>
          </div>
        </div>

        {/* ================= CONTENT ================= */}
        <main className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">

          {/* ---------- Loading / Error ---------- */}
          {loading ? (
            <div
              role="status"
              aria-live="polite"
              className="animate-fade-up flex flex-col items-center justify-center gap-3 rounded-2xl border border-pb-border bg-white/85 px-5 py-12 text-center backdrop-blur-sm"
            >
              <SpinnerIcon className="animate-spin-soft h-10 w-10 text-pb-khaki" />
              <p className="text-sm font-semibold text-pb-green">
                Loading topic content...
              </p>
              <p className="text-xs text-slate-500">
                Fetching notes and study material.
              </p>
            </div>
          ) : error ? (
            <div
              role="alert"
              className="animate-fade-up overflow-hidden rounded-2xl border border-red-200 bg-white/90 backdrop-blur-sm"
            >
              <span
                aria-hidden="true"
                className="block h-1 w-full bg-gradient-to-r from-red-500 via-red-600 to-red-500"
              />
              <div className="flex flex-col items-center gap-4 p-7 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                  <AlertIcon className="h-6 w-6" />
                </span>
                <p className="max-w-md text-sm font-semibold text-red-700">
                  {error}
                </p>
                <button
                  type="button"
                  onClick={loadContent}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-pb-green to-[#0f3d2e] px-5 py-2.5 text-sm font-extrabold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:from-pb-khaki hover:to-[#c9b95f] hover:shadow-lg active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  <RefreshIcon className="h-4 w-4" />
                  Try Again
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* ================= STUDY NOTES ================= */}
              <section>
                <SectionHeader
                  icon={NoteIcon}
                  title="Study Notes"
                  count={notes.length}
                />
                {notes.length === 0 ? (
                  <EmptyState icon={NoteIcon}>
                    No study notes available for this topic.
                  </EmptyState>
                ) : (
                  <div className="space-y-5">
                    {notes.map((note, index) => (
                      <article
                        key={note.id}
                        className="animate-fade-up relative overflow-hidden rounded-2xl border border-pb-border bg-white/90 p-5 shadow-sm backdrop-blur-sm sm:p-7"
                        style={{ animationDelay: `${Math.min(index * 60, 400)}ms` }}
                      >
                        <span
                          aria-hidden="true"
                          className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-pb-green via-pb-khaki to-pb-green"
                        />
                        <div className="pl-3">
                          <h3 className="flex items-center gap-2.5 text-base leading-snug font-extrabold break-words text-pb-green sm:text-lg">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pb-green/10 text-pb-green">
                              <NoteIcon className="h-4 w-4" />
                            </span>
                            {note.title}
                          </h3>
                          <p className="mt-3 text-sm leading-7 break-words whitespace-pre-wrap text-slate-700">
                            {note.content}
                          </p>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              {/* ================= HANDWRITTEN NOTES ================= */}
              <section>
                <SectionHeader
                  icon={PenIcon}
                  title="Handwritten Notes"
                  count={handwrittenNotes.length}
                  tone="khaki"
                />
                {handwrittenNotes.length === 0 ? (
                  <EmptyState icon={PenIcon}>
                    No handwritten notes available for this topic.
                  </EmptyState>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {handwrittenNotes.map((note, index) => (
                      <article
                        key={note.id}
                        className="animate-fade-up group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-pb-border bg-white/90 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-pb-khaki/40 hover:shadow-lg"
                        style={{ animationDelay: `${Math.min(index * 50, 400)}ms` }}
                      >
                        <span
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-pb-khaki via-[#e1d37f] to-pb-khaki opacity-70"
                        />
                        <div className="flex flex-1 flex-col p-5">
                          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-pb-khaki to-[#c9b95f] text-white shadow-md">
                            <PenIcon className="h-5 w-5" />
                          </span>

                          <h3 className="mt-4 text-sm leading-snug font-extrabold break-words text-pb-green sm:text-base">
                            {note.title}
                          </h3>

                          {note.description && (
                            <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-500 sm:text-sm sm:leading-6">
                              {note.description}
                            </p>
                          )}

                          {note.file_type && (
                            <p className="mt-3 inline-flex items-center gap-1.5 self-start rounded-full bg-pb-light px-2.5 py-1 text-[10px] font-extrabold tracking-wide text-pb-khaki uppercase">
                              <FileIcon className="h-3 w-3" />
                              {note.file_type}
                            </p>
                          )}

                          <a
                            href={note.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group/btn mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pb-green to-[#0f3d2e] px-4 py-2.5 text-sm font-extrabold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:from-pb-khaki hover:to-[#c9b95f] hover:shadow-lg active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:ring-offset-2 focus-visible:outline-none"
                          >
                            <EyeIcon className="h-4 w-4" />
                            Open / View
                            <ExternalLinkIcon className="h-3.5 w-3.5 transition-transform duration-300 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                          </a>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              {/* ================= VIDEOS ================= */}
              <section>
                <SectionHeader
                  icon={VideoIcon}
                  title="व्हिडिओ"
                  count={videos.length}
                />

                {videosLoading ? (
                  <div
                    role="status"
                    aria-live="polite"
                    className="animate-fade-up flex flex-col items-center justify-center gap-3 rounded-2xl border border-pb-border bg-white/85 px-5 py-10 text-center backdrop-blur-sm"
                  >
                    <SpinnerIcon className="animate-spin-soft h-8 w-8 text-pb-khaki" />
                    <p className="text-sm font-semibold text-pb-green">
                      {VIDEO_LOADING_MESSAGE}
                    </p>
                  </div>
                ) : videosError ? (
                  <div
                    role="alert"
                    className="animate-fade-up overflow-hidden rounded-2xl border border-red-200 bg-white/90 backdrop-blur-sm"
                  >
                    <span
                      aria-hidden="true"
                      className="block h-1 w-full bg-gradient-to-r from-red-500 via-red-600 to-red-500"
                    />
                    <div className="flex flex-col items-center gap-4 p-6 text-center">
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                        <AlertIcon className="h-5 w-5" />
                      </span>
                      <p className="text-sm font-semibold text-red-700">
                        {videosError}
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          setVideosReload((current) => current + 1)
                        }
                        className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-pb-green to-[#0f3d2e] px-5 py-2.5 text-sm font-extrabold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:from-pb-khaki hover:to-[#c9b95f] hover:shadow-lg active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:ring-offset-2 focus-visible:outline-none"
                      >
                        <RefreshIcon className="h-4 w-4" />
                        पुन्हा प्रयत्न करा
                      </button>
                    </div>
                  </div>
                ) : videos.length === 0 ? (
                  <EmptyState icon={VideoIcon}>
                    {VIDEO_EMPTY_MESSAGE}
                  </EmptyState>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {videos.map((video, index) => (
                      <article
                        key={video.id}
                        className="animate-fade-up group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-pb-border bg-white/90 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-pb-khaki/40 hover:shadow-lg"
                        style={{ animationDelay: `${Math.min(index * 50, 400)}ms` }}
                      >
                        <span
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-pb-green via-pb-khaki to-pb-green opacity-70"
                        />

                        <div className="flex flex-1 flex-col p-5">
                          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-pb-green to-[#0f3d2e] text-white shadow-md transition-transform duration-300 group-hover:scale-105">
                            <PlayCircleIcon className="h-5 w-5" />
                          </span>

                          <h3 className="mt-4 text-sm leading-snug font-extrabold break-words text-pb-green sm:text-base">
                            {video.title}
                          </h3>

                          {video.description && (
                            <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500 sm:text-sm sm:leading-6">
                              {video.description}
                            </p>
                          )}

                          {video.duration && (
                            <p className="mt-3 inline-flex items-center gap-1.5 self-start rounded-full bg-pb-light px-2.5 py-1 text-[10px] font-extrabold tracking-wide text-pb-khaki uppercase">
                              <ClockIcon className="h-3 w-3" />
                              {video.duration}
                            </p>
                          )}

                          <button
                            type="button"
                            onClick={() => setActiveVideo(video)}
                            className="group/btn mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pb-green to-[#0f3d2e] px-4 py-2.5 text-sm font-extrabold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:from-pb-khaki hover:to-[#c9b95f] hover:shadow-lg active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:ring-offset-2 focus-visible:outline-none"
                          >
                            <PlayCircleIcon className="h-4 w-4" />
                            व्हिडिओ पाहा
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              {/* ================= STUDY MATERIAL / PDFs ================= */}
              <section aria-labelledby="study-material-pdf-heading">
                <div className="animate-fade-up mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-pb-khaki/15 text-pb-khaki">
                      <FileIcon className="h-4 w-4" />
                    </span>
                    <h2
                      id="study-material-pdf-heading"
                      className="text-lg leading-tight font-extrabold tracking-tight text-pb-green sm:text-xl"
                    >
                      Study Material / अभ्यास साहित्य
                    </h2>
                  </div>
                  {!pdfLoading && !pdfError && pdfMaterials.length > 0 && (
                    <span className="rounded-full border border-pb-border-soft bg-white/80 px-3 py-1 text-[11px] font-bold tabular-nums text-pb-green shadow-sm backdrop-blur-sm">
                      {pdfMaterials.length}
                    </span>
                  )}
                </div>

                {pdfLoading ? (
                  <div
                    role="status"
                    aria-live="polite"
                    className="animate-fade-up flex flex-col items-center justify-center gap-3 rounded-2xl border border-pb-border bg-white/85 px-5 py-10 text-center backdrop-blur-sm"
                  >
                    <SpinnerIcon className="animate-spin-soft h-8 w-8 text-pb-khaki" />
                    <p className="text-sm font-semibold text-pb-green">
                      अभ्यास साहित्य लोड होत आहे...
                    </p>
                  </div>
                ) : pdfError ? (
                  <div
                    role="alert"
                    className="animate-fade-up overflow-hidden rounded-2xl border border-red-200 bg-white/90 backdrop-blur-sm"
                  >
                    <span
                      aria-hidden="true"
                      className="block h-1 w-full bg-gradient-to-r from-red-500 via-red-600 to-red-500"
                    />
                    <div className="flex flex-col items-center gap-4 p-6 text-center">
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                        <AlertIcon className="h-5 w-5" />
                      </span>
                      <p className="text-sm font-semibold text-red-700">
                        {pdfError}
                      </p>
                      <button
                        type="button"
                        onClick={() => setPdfReload((current) => current + 1)}
                        className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-pb-green to-[#0f3d2e] px-5 py-2.5 text-sm font-extrabold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:from-pb-khaki hover:to-[#c9b95f] hover:shadow-lg active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:ring-offset-2 focus-visible:outline-none"
                      >
                        <RefreshIcon className="h-4 w-4" />
                        पुन्हा प्रयत्न करा
                      </button>
                    </div>
                  </div>
                ) : pdfMaterials.length === 0 ? (
                  <EmptyState icon={FileIcon}>
                    या Topic साठी अभ्यास साहित्य उपलब्ध नाही.
                  </EmptyState>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {pdfMaterials.map((material, index) => {
                      const meta = [
                        "PDF",
                        formatFileSize(material.file_size_bytes),
                        formatDate(material.updated_at || material.created_at),
                      ].filter(Boolean);

                      return (
                        <article
                          key={material.id}
                          className="animate-fade-up group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-pb-border bg-white/90 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-pb-khaki/40 hover:shadow-lg"
                          style={{ animationDelay: `${Math.min(index * 50, 400)}ms` }}
                        >
                          <span
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-500 via-pb-khaki to-red-500 opacity-60"
                          />

                          <div className="flex flex-1 flex-col p-5">
                            {/* Icon + meta pill */}
                            <div className="flex items-start justify-between gap-2">
                              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-red-600 to-red-700 text-white shadow-md">
                                <FileIcon className="h-5 w-5" />
                              </span>
                              <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[10px] font-extrabold tracking-wide text-red-700 uppercase">
                                PDF
                              </span>
                            </div>

                            <h3 className="mt-4 text-sm leading-snug font-extrabold break-words text-pb-green sm:text-base">
                              {material.title}
                            </h3>

                            <p className="mt-2 line-clamp-1 text-[11px] font-medium break-all text-slate-500 sm:text-xs">
                              {material.original_filename}
                            </p>

                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {meta.slice(1).map((item) => (
                                <span
                                  key={item}
                                  className="inline-flex items-center gap-1.5 rounded-full bg-pb-light px-2.5 py-1 text-[10px] font-bold text-slate-600"
                                >
                                  {item}
                                </span>
                              ))}
                            </div>

                            {/* Actions */}
                            <div className="mt-5 flex flex-col gap-2">
                              <button
                                type="button"
                                disabled={loadingPdfId !== null}
                                onClick={() => openPdf(material)}
                                className="group/btn inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pb-green to-[#0f3d2e] px-4 py-2.5 text-sm font-extrabold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:from-pb-khaki hover:to-[#c9b95f] hover:shadow-lg active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-wait disabled:opacity-60 disabled:hover:translate-y-0"
                              >
                                {loadingPdfId === material.id ? (
                                  <>
                                    <SpinnerIcon className="animate-spin-soft h-4 w-4" />
                                    PDF उघडत आहे...
                                  </>
                                ) : (
                                  <>
                                    <EyeIcon className="h-4 w-4" />
                                    PDF पाहा
                                  </>
                                )}
                              </button>

                              <button
                                type="button"
                                aria-label={`PDF डाउनलोड करा: ${material.title}`}
                                disabled={downloadingPdfId !== null}
                                onClick={() => downloadPdf(material)}
                                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-pb-khaki bg-white px-4 py-2.5 text-sm font-extrabold text-pb-green transition-all duration-200 hover:-translate-y-0.5 hover:bg-pb-light hover:shadow-sm active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none disabled:cursor-wait disabled:opacity-60 disabled:hover:translate-y-0"
                              >
                                {downloadingPdfId === material.id ? (
                                  <>
                                    <SpinnerIcon className="animate-spin-soft h-4 w-4" />
                                    डाउनलोड होत आहे...
                                  </>
                                ) : (
                                  <>
                                    <DownloadIcon className="h-4 w-4" />
                                    PDF डाउनलोड करा
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}

                {/* Global PDF errors */}
                {pdfOpenError && (
                  <div
                    role="alert"
                    className="animate-fade-up mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
                  >
                    <AlertIcon className="h-4 w-4 shrink-0" />
                    <span className="min-w-0 flex-1">{pdfOpenError}</span>
                    <button
                      type="button"
                      disabled={loadingPdfId !== null}
                      onClick={() => pdfFailedMaterial && openPdf(pdfFailedMaterial)}
                      className="shrink-0 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-bold text-red-700 transition-colors hover:bg-red-100 focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:outline-none disabled:opacity-50"
                    >
                      पुन्हा प्रयत्न करा
                    </button>
                  </div>
                )}
                {pdfDownloadError && (
                  <div
                    role="alert"
                    className="animate-fade-up mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
                  >
                    <AlertIcon className="h-4 w-4 shrink-0" />
                    <span className="min-w-0 flex-1">{pdfDownloadError}</span>
                    <button
                      type="button"
                      disabled={downloadingPdfId !== null}
                      onClick={() =>
                        failedDownloadMaterial && downloadPdf(failedDownloadMaterial)
                      }
                      className="shrink-0 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-bold text-red-700 transition-colors hover:bg-red-100 focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:outline-none disabled:opacity-50"
                    >
                      पुन्हा प्रयत्न करा
                    </button>
                  </div>
                )}
              </section>
            </>
          )}
        </main>
      </div>

      {/* ================= MODALS ================= */}
      {activeVideo && (
        <StudentVideoViewer
          video={activeVideo}
          topicName={topic?.name}
          onClose={() => setActiveVideo(null)}
        />
      )}
      {preview && (
        <PdfPreviewModal
          material={preview.material}
          blobUrl={preview.blobUrl}
          onClose={closePreview}
        />
      )}
    </div>
  );
}

export default TopicDetail;