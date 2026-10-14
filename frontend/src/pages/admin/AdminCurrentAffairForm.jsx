import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import currentAffairCategories from "../../constants/currentAffairCategories";
import {
  createCurrentAffair,
  getAdminCurrentAffairMedia,
  getCurrentAffair,
  replaceCurrentAffairMedia,
  updateCurrentAffair,
} from "../../services/admin/adminCurrentAffairService";

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

const ArrowLeftIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M19 12H5" />
    <path d="m11 18-6-6 6-6" />
  </svg>
);
const NewspaperIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M4 5h13a2 2 0 0 1 2 2v11a2 2 0 0 0 2 2H6a2 2 0 0 1-2-2Z" />
    <path d="M8 9h8M8 13h8M8 17h5" />
  </svg>
);
const AlertIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M10.3 3.9 2.4 17a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9v4M12 17h.01" />
  </svg>
);
const SpinnerIcon = (p) => (
  <svg {...iconProps} strokeWidth="2.4" {...p}>
    <path d="M21 12a9 9 0 1 1-6.2-8.5" />
  </svg>
);
const SaveIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M5 3h11l3 3v15H5z" />
    <path d="M8 3v6h7V3M8 17h8" />
  </svg>
);
const UploadIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M12 17V4M6 10l6-6 6 6" />
    <path d="M4 20h16" />
  </svg>
);
const FileIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M6 3h9l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
    <path d="M14 3v6h6" />
  </svg>
);
const ImageIcon = (p) => (
  <svg {...iconProps} {...p}>
    <rect x="3" y="3" width="18" height="18" rx="2.5" />
    <circle cx="8.5" cy="9" r="1.5" />
    <path d="m4 17 5-5 4 4 3-3 4 4" />
  </svg>
);
const CalendarIcon = (p) => (
  <svg {...iconProps} {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M8 3v4M16 3v4M3 10h18" />
  </svg>
);
const TagIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M3 12V5a2 2 0 0 1 2-2h7l9 9-9 9-9-9Z" />
    <circle cx="8" cy="8" r="1.5" />
  </svg>
);
const LinkIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
    <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
  </svg>
);
const GlobeIcon = (p) => (
  <svg {...iconProps} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.5 3 2.5 15 0 18M12 3c-2.5 3-2.5 15 0 18" />
  </svg>
);
const TextIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M4 7V5h16v2M9 5v14M7 19h4" />
    <path d="M14 12h6M17 9v6" />
  </svg>
);

const fieldClass =
  "w-full rounded-xl border border-pb-border bg-white px-4 py-3 text-sm text-pb-green transition-all duration-200 outline-none placeholder:text-slate-400 focus:border-pb-khaki focus:ring-4 focus:ring-pb-khaki/15 disabled:cursor-not-allowed disabled:bg-slate-100";

const today = new Date();
const todayDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
const initialForm = {
  title: "",
  summary: "",
  content: "",
  category: currentAffairCategories[0],
  published_date: todayDate,
  source_name: "",
  source_url: "",
};

/* ================= FORM FIELD ================= */
function FormField({ id, label, required, icon: Icon, hint, children }) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 flex items-center gap-2 text-sm font-bold text-pb-green"
      >
        {Icon && (
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-pb-green/10 text-pb-green">
            <Icon className="h-3.5 w-3.5" />
          </span>
        )}
        <span>
          {label}
          {required && <span className="ml-1 text-red-600">*</span>}
        </span>
      </label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

function AdminCurrentAffairForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(id);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState({ id: null, url: "" });

  useEffect(() => {
    if (!editing) return undefined;
    let current = true;
    getCurrentAffair(id)
      .then((response) => {
        if (!response?.success || !response.data) {
          throw new Error(response?.message || "Current affair could not be loaded.");
        }
        if (current) {
          setForm({
            title: response.data.title || "",
            summary: response.data.summary || "",
            content: response.data.content || "",
            category: response.data.category || currentAffairCategories[0],
            published_date: response.data.published_date || "",
            source_name: response.data.source_name || "",
            source_url: response.data.source_url || "",
            content_type: response.data.content_type || "TEXT",
            original_filename: response.data.original_filename || "",
          });
        }
      })
      .catch((requestError) => {
        if (current) setError(requestError.response?.data?.message || requestError.message);
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, [editing, id]);

  useEffect(() => {
    if (!editing || !["IMAGE", "PDF"].includes(form.content_type)) return undefined;
    let active = true;
    let objectUrl = "";
    getAdminCurrentAffairMedia(id)
      .then((blob) => {
        if (active) {
          objectUrl = URL.createObjectURL(blob);
          setMediaPreview({ id, url: objectUrl });
        }
      })
      .catch(() => {});
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [editing, form.content_type, id]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      ...form,
      summary: form.summary.trim() || null,
      source_name: form.source_name.trim() || null,
      source_url: form.source_url.trim() || null,
    };
    try {
      const response = editing
        ? await updateCurrentAffair(id, payload)
        : await createCurrentAffair(payload);
      if (!response?.success)
        throw new Error(response?.message || "Could not save current affair.");
      navigate("/admin/current-affairs", { replace: true });
    } catch (requestError) {
      const responseData = requestError.response?.data;
      const fieldErrors = responseData?.errors
        ? Object.values(responseData.errors).flat().join(" ")
        : "";
      setError(fieldErrors || responseData?.message || requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const handleMediaReplacement = async () => {
    if (!mediaFile || saving) return;
    setSaving(true);
    setError("");
    try {
      const response = await replaceCurrentAffairMedia(id, mediaFile, form.content_type);
      if (!response?.success)
        throw new Error(response?.message || "Could not replace media.");
      navigate("/admin/current-affairs", { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const isMediaMode = editing && form.content_type !== "TEXT";

  return (
    <div className="relative min-h-screen overflow-hidden bg-pb-light">
      {/* ---------- ANIMATION KEYFRAMES ---------- */}
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

      {/* ---------- ANIMATED BACKGROUND ---------- */}
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

      {/* ---------- CONTENT ---------- */}
      <div className="relative z-10 mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">

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
                <NewspaperIcon className="relative h-6 w-6" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold tracking-[0.16em] text-pb-khaki uppercase sm:text-xs">
                  Content management
                </p>
                <h1 className="mt-1 text-xl leading-tight font-extrabold tracking-tight text-pb-green sm:text-2xl">
                  {editing ? "Edit Current Affair" : "Add Current Affair"}
                </h1>
              </div>
            </div>
            <Link
              to="/admin/current-affairs"
              className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-pb-border bg-white px-4 py-2.5 text-sm font-bold text-pb-green transition-all duration-200 hover:-translate-y-0.5 hover:border-pb-khaki hover:bg-pb-light hover:shadow-sm active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none"
            >
              <ArrowLeftIcon className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
              Back to list
            </Link>
          </div>
        </div>

        {/* ================= LOADING ================= */}
        {loading ? (
          <div
            role="status"
            className="animate-fade-up flex flex-col items-center justify-center gap-3 rounded-2xl border border-pb-border bg-white/85 px-5 py-12 text-center backdrop-blur-sm"
          >
            <SpinnerIcon className="animate-spin-soft h-10 w-10 text-pb-khaki" />
            <p className="text-sm font-semibold text-pb-green">
              Loading current affair...
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="animate-fade-up space-y-5 overflow-hidden rounded-2xl border border-pb-border bg-white/90 shadow-sm backdrop-blur-sm"
            style={{ animationDelay: "80ms" }}
          >
            <div className="p-5 sm:p-7">

              {/* ---------- ERROR ---------- */}
              {error && (
                <div
                  role="alert"
                  className="animate-fade-up mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
                >
                  <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
                  <span className="min-w-0 break-words">{error}</span>
                </div>
              )}

              {isMediaMode ? (
                /* ==================================================
                    MEDIA REPLACEMENT MODE (IMAGE / PDF)
                ================================================== */
                <section className="space-y-5">
                  {/* Info banner */}
                  <div className="relative overflow-hidden rounded-xl border border-pb-border-soft bg-gradient-to-br from-pb-light via-white to-pb-light/60 p-4">
                    <span
                      aria-hidden="true"
                      className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-pb-green via-pb-khaki to-pb-green"
                    />
                    <div className="flex items-start gap-3 pl-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pb-green/10 text-pb-green">
                        {form.content_type === "IMAGE" ? (
                          <ImageIcon className="h-5 w-5" />
                        ) : (
                          <FileIcon className="h-5 w-5" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-pb-green">
                          {form.content_type} Current Affair
                        </p>
                        <p className="mt-1 text-xs break-all text-slate-600 sm:text-sm">
                          Current file:{" "}
                          <span className="font-semibold">
                            {form.original_filename || "Unavailable"}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Preview */}
                    {mediaPreview.id === id && mediaPreview.url && (
                      <div className="mt-4 overflow-hidden rounded-xl border border-pb-border-soft bg-white p-2">
                        {form.content_type === "IMAGE" ? (
                          <img
                            src={mediaPreview.url}
                            alt={form.title}
                            className="mx-auto max-h-64 w-full rounded-lg object-contain"
                          />
                        ) : (
                          <iframe
                            title={`${form.title} PDF preview`}
                            src={mediaPreview.url}
                            className="h-64 w-full rounded-lg border border-pb-border"
                          />
                        )}
                      </div>
                    )}
                  </div>

                  {/* File input */}
                  <FormField
                    id="replace-current-affair-media"
                    label={`Replace ${form.content_type === "IMAGE" ? "image" : "PDF"}`}
                    icon={UploadIcon}
                  >
                    <input
                      id="replace-current-affair-media"
                      type="file"
                      accept={
                        form.content_type === "IMAGE"
                          ? ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                          : ".pdf,application/pdf"
                      }
                      disabled={saving}
                      onChange={(event) =>
                        setMediaFile(event.target.files?.[0] || null)
                      }
                      className={`${fieldClass} file:mr-3 file:rounded-lg file:border-0 file:bg-pb-light file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-pb-green hover:file:bg-pb-neutral`}
                    />
                    {mediaFile && (
                      <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-pb-light px-2.5 py-1 text-xs font-semibold text-pb-green">
                        <FileIcon className="h-3.5 w-3.5" />
                        Selected: {mediaFile.name} ·{" "}
                        {(mediaFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    )}
                  </FormField>
                </section>
              ) : (
                /* ==================================================
                    TEXT EDIT MODE
                ================================================== */
                <div className="space-y-5">
                  {/* Section: Basic */}
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-pb-green/10 text-pb-green">
                      <TextIcon className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-[11px] font-bold tracking-[0.14em] text-slate-500 uppercase">
                      Basic information
                    </span>
                    <span className="h-px flex-1 bg-gradient-to-r from-pb-border to-transparent" />
                  </div>

                  <FormField
                    id="current-affair-title"
                    label="Title"
                    required
                    icon={NewspaperIcon}
                  >
                    <input
                      id="current-affair-title"
                      name="title"
                      required
                      maxLength={200}
                      value={form.title}
                      onChange={handleChange}
                      disabled={saving}
                      className={fieldClass}
                    />
                  </FormField>

                  <FormField
                    id="current-affair-summary"
                    label="Summary"
                    icon={TextIcon}
                    hint="Optional — a short teaser that appears in listings."
                  >
                    <textarea
                      id="current-affair-summary"
                      name="summary"
                      rows={3}
                      maxLength={1000}
                      value={form.summary}
                      onChange={handleChange}
                      disabled={saving}
                      className={`${fieldClass} resize-y`}
                    />
                  </FormField>

                  <FormField
                    id="current-affair-content"
                    label="Content"
                    required
                    icon={TextIcon}
                  >
                    <textarea
                      id="current-affair-content"
                      name="content"
                      required
                      rows={12}
                      maxLength={50000}
                      value={form.content}
                      onChange={handleChange}
                      disabled={saving}
                      className={`${fieldClass} resize-y leading-6`}
                    />
                  </FormField>

                  {/* Section: Meta */}
                  <div className="flex items-center gap-2.5 pt-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-pb-green/10 text-pb-green">
                      <TagIcon className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-[11px] font-bold tracking-[0.14em] text-slate-500 uppercase">
                      Category &amp; date
                    </span>
                    <span className="h-px flex-1 bg-gradient-to-r from-pb-border to-transparent" />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      id="current-affair-category"
                      label="Category"
                      required
                      icon={TagIcon}
                    >
                      <select
                        id="current-affair-category"
                        name="category"
                        value={form.category}
                        onChange={handleChange}
                        disabled={saving}
                        className={fieldClass}
                      >
                        {currentAffairCategories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </FormField>

                    <FormField
                      id="current-affair-date"
                      label="Published date"
                      required
                      icon={CalendarIcon}
                    >
                      <input
                        id="current-affair-date"
                        type="date"
                        name="published_date"
                        required
                        value={form.published_date}
                        onChange={handleChange}
                        disabled={saving}
                        className={fieldClass}
                      />
                    </FormField>
                  </div>

                  {/* Section: Source */}
                  <div className="flex items-center gap-2.5 pt-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-pb-green/10 text-pb-green">
                      <GlobeIcon className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-[11px] font-bold tracking-[0.14em] text-slate-500 uppercase">
                      Source (optional)
                    </span>
                    <span className="h-px flex-1 bg-gradient-to-r from-pb-border to-transparent" />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      id="current-affair-source-name"
                      label="Source name"
                      icon={GlobeIcon}
                    >
                      <input
                        id="current-affair-source-name"
                        name="source_name"
                        maxLength={200}
                        value={form.source_name}
                        onChange={handleChange}
                        disabled={saving}
                        className={fieldClass}
                      />
                    </FormField>

                    <FormField
                      id="current-affair-source-url"
                      label="Source URL"
                      icon={LinkIcon}
                    >
                      <input
                        id="current-affair-source-url"
                        type="url"
                        name="source_url"
                        maxLength={500}
                        placeholder="https://example.com/article"
                        value={form.source_url}
                        onChange={handleChange}
                        disabled={saving}
                        className={fieldClass}
                      />
                    </FormField>
                  </div>
                </div>
              )}
            </div>

            {/* ================= ACTIONS ================= */}
            <div className="flex flex-col-reverse gap-3 border-t border-pb-border-soft bg-pb-light/50 px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
              <Link
                to="/admin/current-affairs"
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-pb-border bg-white px-5 py-2.5 text-center text-sm font-bold text-pb-green transition-all duration-200 hover:-translate-y-0.5 hover:bg-pb-light hover:shadow-sm active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none"
              >
                Cancel
              </Link>

              {/* Text form → submit button */}
              {!isMediaMode && (
                <button
                  type="submit"
                  disabled={saving}
                  className="group relative inline-flex min-h-11 items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-pb-green to-[#0f3d2e] px-5 py-2.5 text-sm font-extrabold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:from-pb-khaki hover:to-[#c9b95f] hover:shadow-lg active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-wait disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {saving ? (
                    <>
                      <SpinnerIcon className="animate-spin-soft h-4 w-4" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <SaveIcon className="h-4 w-4" />
                      {editing ? "Save changes" : "Publish current affair"}
                    </>
                  )}
                </button>
              )}

              {/* Media mode → replace button */}
              {isMediaMode && (
                <button
                  type="button"
                  disabled={!mediaFile || saving}
                  onClick={handleMediaReplacement}
                  className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pb-green to-[#0f3d2e] px-5 py-2.5 text-sm font-extrabold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:from-pb-khaki hover:to-[#c9b95f] hover:shadow-lg active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  {saving ? (
                    <>
                      <SpinnerIcon className="animate-spin-soft h-4 w-4" />
                      Uploading…
                    </>
                  ) : (
                    <>
                      <UploadIcon className="h-4 w-4" />
                      Replace media
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default AdminCurrentAffairForm;