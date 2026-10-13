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

function PdfPreviewModal({ material, blobUrl, onClose }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-2 sm:p-4" role="presentation">
      <section role="dialog" aria-modal="true" aria-labelledby="study-material-pdf-title" className="flex h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-pb-border px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <h2 id="study-material-pdf-title" className="truncate text-lg font-extrabold text-pb-green">{material.title}</h2>
            <p className="mt-1 truncate text-xs text-slate-500">{material.original_filename}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <a href={blobUrl} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-pb-border px-3 py-2 text-xs font-bold text-pb-green hover:bg-pb-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pb-khaki">Open in new tab</a>
            <button type="button" onClick={onClose} aria-label="Close PDF preview" className="flex h-9 w-9 items-center justify-center rounded-lg text-xl font-bold text-slate-600 hover:bg-pb-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pb-khaki">×</button>
          </div>
        </header>
        <iframe src={blobUrl} title={`PDF preview: ${material.title}`} className="min-h-0 w-full flex-1 bg-slate-100" />
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
          (response) => !response.success || !Array.isArray(response.data)
        )
      ) {
        throw new Error("Unexpected topic content response.");
      }

      setNotes(notesResponse.data.filter((item) => item.is_active === true));
      setHandwrittenNotes(
        handwrittenNotesResponse.data.filter(
          (item) => item.is_active === true
        )
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

    return () => { isCurrent = false; };
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
        if (isCurrent) setPdfError("अभ्यास साहित्य लोड करता आले नाही. कृपया पुन्हा प्रयत्न करा.");
      })
      .finally(() => {
        if (isCurrent) setPdfLoading(false);
      });
    return () => { isCurrent = false; };
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
      if (!(response?.data instanceof Blob)) throw new Error("Invalid PDF response.");
      const disposition = response.headers?.["content-disposition"]
        || response.headers?.get?.("content-disposition");
      const filename = getSafeDownloadFilename(disposition, material.original_filename);
      blobUrl = URL.createObjectURL(response.data);
      link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
    } catch (requestError) {
      const message = requestError.response?.status === 404
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
    <div className="min-h-screen bg-pb-light">
      <section className="border-b border-pb-border bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Link
            to={`/student/study/${subjectId}`}
            className="inline-flex items-center gap-2 text-sm font-bold text-pb-khaki transition-colors hover:text-pb-khaki"
          >
            ← Back to Topics
          </Link>

          <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-pb-khaki">
                📚 Study Material
              </p>
              <h1 className="mt-2 text-2xl font-extrabold text-pb-green sm:text-3xl">
                {topic?.name || "Topic Details"}
              </h1>
              {topic?.description && (
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  {topic.description}
                </p>
              )}
              {!loading && !error && !videosLoading && (
                <p className="mt-3 text-sm font-medium text-slate-500">
                  {activeContentCount} study resources available
                </p>
              )}
            </div>

            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-pb-green text-3xl shadow-lg">
              📖
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-6 lg:px-8">
        {loading ? (
          <div
            className="rounded-2xl bg-white p-8 text-center text-sm font-medium text-slate-500 shadow-sm"
            role="status"
            aria-live="polite"
          >
            <span className="mx-auto mb-3 block h-8 w-8 animate-spin rounded-full border-4 border-pb-border border-t-pb-khaki" />
            Loading topic content...
          </div>
        ) : error ? (
          <div
            className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm"
            role="alert"
          >
            <p className="text-sm text-red-700">{error}</p>
            <button
              type="button"
              onClick={loadContent}
              className="mt-5 rounded-xl bg-pb-khaki px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-pb-green"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            <section>
              <h2 className="mb-5 text-xl font-extrabold text-pb-green">
                Study Notes
              </h2>
              {notes.length === 0 ? (
                <div className="rounded-2xl bg-white p-6 text-sm text-slate-500 shadow-sm">
                  No study notes available for this topic.
                </div>
              ) : (
                <div className="space-y-5">
                  {notes.map((note) => (
                    <article
                      key={note.id}
                      className="rounded-2xl bg-white p-6 shadow-sm sm:p-8"
                    >
                      <h3 className="text-lg font-extrabold text-pb-green">
                        {note.title}
                      </h3>
                      <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                        {note.content}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="mb-5 text-xl font-extrabold text-pb-green">
                Handwritten Notes
              </h2>
              {handwrittenNotes.length === 0 ? (
                <div className="rounded-2xl bg-white p-6 text-sm text-slate-500 shadow-sm">
                  No handwritten notes available for this topic.
                </div>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {handwrittenNotes.map((note) => (
                    <article
                      key={note.id}
                      className="rounded-2xl bg-white p-6 shadow-sm"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-pb-light text-2xl">
                        📄
                      </div>
                      <h3 className="mt-4 font-extrabold text-pb-green">
                        {note.title}
                      </h3>
                      {note.description && (
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          {note.description}
                        </p>
                      )}
                      {note.file_type && (
                        <p className="mt-3 text-xs font-semibold text-pb-khaki">
                          {note.file_type}
                        </p>
                      )}
                      <a
                        href={note.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-5 inline-flex rounded-xl bg-pb-khaki px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-pb-green"
                      >
                        Open / View
                      </a>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="mb-5 text-xl font-extrabold text-pb-green">
                व्हिडिओ
              </h2>
              {videosLoading ? (
                <div role="status" aria-live="polite" className="rounded-2xl bg-white p-6 text-sm text-slate-500 shadow-sm">
                  {VIDEO_LOADING_MESSAGE}
                </div>
              ) : videosError ? (
                <div role="alert" className="rounded-2xl border border-red-200 bg-white p-6 text-sm text-red-700 shadow-sm">
                  <p>{videosError}</p>
                  <button type="button" onClick={() => setVideosReload((current) => current + 1)} className="mt-3 rounded-xl bg-pb-green px-4 py-2 text-sm font-bold text-white hover:bg-pb-khaki">
                    पुन्हा प्रयत्न करा
                  </button>
                </div>
              ) : videos.length === 0 ? (
                <div className="rounded-2xl bg-white p-6 text-sm text-slate-500 shadow-sm">
                  {VIDEO_EMPTY_MESSAGE}
                </div>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {videos.map((video) => (
                    <article
                      key={video.id}
                      className="min-w-0 rounded-2xl bg-white p-6 shadow-sm"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-pb-light text-2xl">
                        ▶️
                      </div>
                      <h3 className="mt-4 font-extrabold text-pb-green">
                        <span className="break-words">{video.title}</span>
                      </h3>
                      {video.description && (
                        <p className="mt-2 break-words text-sm leading-6 text-slate-500">
                          {video.description}
                        </p>
                      )}
                      {video.duration && (
                        <p className="mt-3 text-xs font-semibold text-pb-khaki">
                          Duration: {video.duration}
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={() => setActiveVideo(video)}
                        className="mt-5 inline-flex max-w-full items-center justify-center rounded-xl bg-pb-green px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-pb-khaki"
                      >
                        ▶ व्हिडिओ पाहा
                      </button>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
        <section aria-labelledby="study-material-pdf-heading">
          <h2 id="study-material-pdf-heading" className="mb-5 text-xl font-extrabold text-pb-green">
            Study Material / अभ्यास साहित्य
          </h2>
          {pdfLoading ? (
            <div role="status" aria-live="polite" className="rounded-2xl bg-white p-6 text-sm font-medium text-slate-500 shadow-sm">
              <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-pb-border border-t-pb-khaki align-middle" />
              PDF उघडत आहे...
            </div>
          ) : pdfError ? (
            <div role="alert" className="rounded-2xl border border-red-200 bg-white p-6 text-sm text-red-700 shadow-sm">
              <p>{pdfError}</p>
              <button type="button" onClick={() => setPdfReload((current) => current + 1)} className="mt-3 rounded-xl bg-pb-khaki px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-pb-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pb-khaki">
                पुन्हा प्रयत्न करा
              </button>
            </div>
          ) : pdfMaterials.length === 0 ? (
            <div className="rounded-2xl bg-white p-6 text-sm text-slate-500 shadow-sm">
              या Topic साठी अभ्यास साहित्य उपलब्ध नाही.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pdfMaterials.map((material) => (
                <article key={material.id} className="flex min-w-0 flex-col rounded-2xl bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-pb-light text-2xl" aria-hidden="true">📄</div>
                  <h3 className="mt-4 break-words font-extrabold text-pb-green">{material.title}</h3>
                  <p className="mt-2 break-all text-sm text-slate-500">{material.original_filename}</p>
                  <p className="mt-3 text-xs font-semibold text-pb-khaki">
                    PDF <span aria-hidden="true">•</span> {formatFileSize(material.file_size_bytes)}
                    {formatDate(material.updated_at || material.created_at) && ` • ${formatDate(material.updated_at || material.created_at)}`}
                  </p>
                  <button type="button" disabled={loadingPdfId !== null} onClick={() => openPdf(material)} className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-pb-green px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-pb-khaki focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pb-khaki disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto">
                    {loadingPdfId === material.id ? "PDF उघडत आहे..." : "PDF पाहा / View PDF"}
                  </button>
                  <button type="button" aria-label={`PDF डाउनलोड करा: ${material.title}`} disabled={downloadingPdfId !== null} onClick={() => downloadPdf(material)} className="mt-2 inline-flex w-full items-center justify-center rounded-xl border border-pb-khaki px-5 py-2.5 text-sm font-bold text-pb-green transition-colors hover:bg-pb-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pb-khaki disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto">
                    {downloadingPdfId === material.id ? "डाउनलोड होत आहे..." : "PDF डाउनलोड करा"}
                  </button>
                </article>
              ))}
            </div>
          )}
          {pdfOpenError && <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-white p-4 text-sm font-semibold text-red-700">{pdfOpenError} <button type="button" disabled={loadingPdfId !== null} onClick={() => pdfFailedMaterial && openPdf(pdfFailedMaterial)} className="ml-1 underline disabled:opacity-50">पुन्हा प्रयत्न करा</button></div>}
          {pdfDownloadError && <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-white p-4 text-sm font-semibold text-red-700">{pdfDownloadError} <button type="button" disabled={downloadingPdfId !== null} onClick={() => failedDownloadMaterial && downloadPdf(failedDownloadMaterial)} className="ml-1 underline disabled:opacity-50">पुन्हा प्रयत्न करा</button></div>}
        </section>
      </main>
      {activeVideo && (
        <StudentVideoViewer
          video={activeVideo}
          topicName={topic?.name}
          onClose={() => setActiveVideo(null)}
        />
      )}
      {preview && <PdfPreviewModal material={preview.material} blobUrl={preview.blobUrl} onClose={closePreview} />}
    </div>
  );
}

export default TopicDetail;
