import { useEffect, useState } from "react";
import { getVideoFile } from "../../../services/studyContentService";

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
      else if (/^\/(embed|shorts)\//.test(url.pathname)) videoId = url.pathname.split("/")[2] || "";
    }
    if (!/^[A-Za-z0-9_-]{11}$/.test(videoId)) return null;
    return `https://www.youtube.com/embed/${videoId}`;
  } catch {
    return null;
  }
}

function StudentVideoViewer({ video, subjectName, topicName, onClose }) {
  const embedUrl = getYoutubeEmbedUrl(video.video_url);
  const externalUrl = getSafeVideoUrl(video.video_url);
  const isUploadedVideo = video.source_type === "UPLOAD";
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState("");
  const [fileError, setFileError] = useState("");

  useEffect(() => {
    if (!isUploadedVideo) return undefined;
    let current = true;
    let objectUrl = "";
    getVideoFile(video.id)
      .then((file) => {
        if (!current) return;
        objectUrl = URL.createObjectURL(file);
        setUploadedVideoUrl(objectUrl);
        setFileError("");
      })
      .catch(() => {
        if (current) setFileError("व्हिडिओ लोड करता आला नाही. कृपया पुन्हा प्रयत्न करा.");
      });
    return () => {
      current = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setUploadedVideoUrl("");
    };
  }, [video.id, isUploadedVideo]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/75 p-2 sm:p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="student-video-title"
        className="my-auto w-full max-w-5xl overflow-hidden rounded-2xl border border-pb-border bg-white shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-pb-border-soft px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <h2 id="student-video-title" className="break-words text-lg font-extrabold text-pb-green">
              {video.title}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {subjectName || "विषय"} <span aria-hidden="true">•</span> {topicName || "प्रकरण"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="व्हिडिओ बंद करा"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xl font-bold text-slate-600 hover:bg-pb-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pb-khaki"
          >
            ×
          </button>
        </header>

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
              <div className="flex h-full items-center justify-center px-5 text-center text-sm text-white">
                {fileError || "व्हिडिओ लोड होत आहे..."}
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
          <div className="flex flex-col items-center justify-center gap-3 bg-pb-light px-5 py-12 text-center sm:py-16">
            <p className="max-w-lg text-sm leading-6 text-slate-600">हा व्हिडिओ नवीन टॅबमध्ये उघडा.</p>
            {externalUrl ? (
              <a
                href={externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex rounded-xl bg-pb-green px-5 py-2.5 text-sm font-bold text-white hover:bg-pb-khaki"
              >
                व्हिडिओ उघडा
              </a>
            ) : (
              <p role="alert" className="text-sm font-semibold text-red-700">व्हिडिओ URL उपलब्ध नाही.</p>
            )}
          </div>
        )}

        <div className="space-y-2 px-4 py-4 sm:px-6">
          <p className="text-sm font-bold text-pb-green">
            {subjectName || "विषय"} <span className="px-1 text-pb-khaki">•</span> {topicName || "प्रकरण"}
          </p>
          {video.description && <p className="break-words text-sm leading-6 text-slate-600">{video.description}</p>}
          {video.duration && <p className="text-xs font-semibold text-pb-khaki">कालावधी: {video.duration}</p>}
          {embedUrl && externalUrl && (
            <a href={externalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex pt-1 text-xs font-bold text-pb-khaki underline">
              नवीन टॅबमध्ये उघडा
            </a>
          )}
        </div>
      </section>
    </div>
  );
}

export default StudentVideoViewer;
