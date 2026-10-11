import { useEffect, useState } from "react";

import { getSubjects } from "../../services/admin/adminSubjectService";
import { getTopics } from "../../services/admin/adminTopicService";
import {
  createAdminVideo,
  deleteAdminVideo,
  getAdminVideos,
  updateAdminVideo,
  updateAdminVideoStatus,
} from "../../services/admin/adminVideoService";

const PER_PAGE = 20;
const EMPTY_FORM = {
  subject_id: "",
  topic_id: "",
  title: "",
  video_url: "",
  description: "",
  duration: "",
};
const fieldClass = "w-full rounded-lg border border-pb-border bg-white px-3.5 py-2.5 text-sm text-pb-green outline-none focus:border-pb-khaki focus:ring-2 focus:ring-pb-khaki/20 disabled:bg-slate-100";
const formatFileSize = (bytes) => bytes < 1024 * 1024 ? (bytes / 1024).toFixed(0) + " KB" : (bytes / (1024 * 1024)).toFixed(1) + " MB";

const getErrorMessage = (error, fallback) =>
  error.response?.data?.message || error.message || fallback;

async function loadAllPages(fetchPage, recordsKey, filters = {}) {
  const first = await fetchPage({ ...filters, page: 1, per_page: 100 });
  const records = first?.data?.[recordsKey];
  const pages = first?.data?.pagination?.pages;
  if (!first?.success || !Array.isArray(records) || !Number.isInteger(pages)) {
    throw new Error(first?.message || "Selection data could not be loaded.");
  }
  if (pages <= 1) return records;
  const remaining = await Promise.all(
    Array.from({ length: pages - 1 }, (_, index) =>
      fetchPage({ ...filters, page: index + 2, per_page: 100 }),
    ),
  );
  return records.concat(...remaining.map((response) => {
    const pageRecords = response?.data?.[recordsKey];
    if (!response?.success || !Array.isArray(pageRecords)) {
      throw new Error(response?.message || "Selection data could not be loaded.");
    }
    return pageRecords;
  }));
}

function formatDate(value) {
  if (!value) return "उपलब्ध नाही";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "उपलब्ध नाही"
    : date.toLocaleDateString("mr-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}

function canPreview(value) {
  try {
    const protocol = new URL(value).protocol;
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

function VideoForm({ video, subjects, onClose, onSuccess }) {
  const isEditing = Boolean(video);
  const [form, setForm] = useState(video ? {
    subject_id: String(video.subject_id),
    topic_id: String(video.topic_id),
    title: video.title || "",
    video_url: video.video_url || "",
    description: video.description || "",
    duration: video.duration || "",
  } : EMPTY_FORM);
  const [topics, setTopics] = useState([]);
  const [topicsLoading, setTopicsLoading] = useState(Boolean(video?.subject_id));
  const [topicsError, setTopicsError] = useState("");
  const [topicsReload, setTopicsReload] = useState(0);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [sourceType, setSourceType] = useState(
    video?.source_type || (video?.video_url ? "URL" : "UPLOAD"),
  );
  const [videoFile, setVideoFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (!form.subject_id) {
      return undefined;
    }
    let current = true;
    loadAllPages(getTopics, "topics", { subject_id: form.subject_id })
      .then((items) => { if (current) setTopics(items); })
      .catch((error) => {
        if (current) setTopicsError(getErrorMessage(error, "विषयाची प्रकरणे लोड करता आली नाहीत."));
      })
      .finally(() => { if (current) setTopicsLoading(false); });
    return () => { current = false; };
  }, [form.subject_id, topicsReload]);

  const changeField = (event) => {
    const { name, value } = event.target;
    if (name === "subject_id") {
      setTopicsLoading(Boolean(value));
      setTopics([]);
      setTopicsError("");
    }
    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === "subject_id" ? { topic_id: "" } : {}),
    }));
    setFormError("");
  };

  const retryTopics = () => {
    setTopicsLoading(Boolean(form.subject_id));
    setTopicsError("");
    setTopicsReload((value) => value + 1);
  };

  const submit = async (event) => {
    event.preventDefault();
    const title = form.title.trim();
    const videoUrl = form.video_url.trim();
    if (!form.subject_id || !form.topic_id || !title) {
      setFormError("\u0935\u093f\u0937\u092f, \u092a\u094d\u0930\u0915\u0930\u0923 \u0906\u0923\u093f \u0936\u0940\u0930\u094d\u0937\u0915 \u092d\u0930\u0923\u0947 \u0906\u0935\u0936\u094d\u092f\u0915 \u0906\u0939\u0947.");
      return;
    }
    if (title.length > 200) {
      setFormError("\u0936\u0940\u0930\u094d\u0937\u0915 ??? \u0905\u0915\u094d\u0937\u0930\u093e\u0902\u092a\u0947\u0915\u094d\u0937\u093e \u092e\u094b\u0920\u0947 \u0905\u0938\u0942 \u0936\u0915\u0924 \u0928\u093e\u0939\u0940.");
      return;
    }

    if (sourceType === "URL") {
      try {
        const parsedUrl = new URL(videoUrl);
        if (!["http:", "https:"].includes(parsedUrl.protocol)) throw new Error("Invalid URL");
      } catch {
        setFormError("\u0935\u0948\u0927 http:// \u0915\u093f\u0902\u0935\u093e https:// \u0935\u094d\u0939\u093f\u0921\u093f\u0913 URL \u092d\u0930\u093e.");
        return;
      }
    } else if (!videoFile && !(isEditing && video?.source_type === "UPLOAD")) {
      setFormError("\u0935\u094d\u0939\u093f\u0921\u093f\u0913 \u092b\u093e\u0907\u0932 \u0928\u093f\u0935\u0921\u093e.");
      return;
    }

    const payload = {
      title,
      description: form.description.trim() || null,
      duration: form.duration.trim() || null,
    };
    if (sourceType === "URL") payload.video_url = videoUrl;
    if (videoFile) payload.video_file = videoFile;
    if (!isEditing) {
      payload.subject_id = Number(form.subject_id);
      payload.topic_id = Number(form.topic_id);
    }

    setSaving(true);
    setFormError("");
    setUploadProgress(0);
    const onUploadProgress = (event) => {
      if (event.total) setUploadProgress(Math.round((event.loaded * 100) / event.total));
    };
    try {
      const response = isEditing
        ? await updateAdminVideo(video.id, payload, onUploadProgress)
        : await createAdminVideo(payload, onUploadProgress);
      if (!response?.success) throw new Error(response?.message || "\u0935\u094d\u0939\u093f\u0921\u093f\u0913 \u091c\u0924\u0928 \u0915\u0930\u0924\u093e \u0906\u0932\u093e \u0928\u093e\u0939\u0940.");
      onSuccess(isEditing ? "\u0935\u094d\u0939\u093f\u0921\u093f\u0913\u091a\u0940 \u092e\u093e\u0939\u093f\u0924\u0940 \u0905\u0926\u094d\u092f\u092f\u093e\u0935\u0924 \u0915\u0947\u0932\u0940." : "\u0928\u0935\u0940\u0928 \u0935\u094d\u0939\u093f\u0921\u093f\u0913 \u091c\u094b\u0921\u0932\u093e.");
    } catch (error) {
      const validationErrors = error.response?.data?.errors;
      const firstValidationError = validationErrors
        ? Object.values(validationErrors).flat()[0]
        : null;
      setFormError(firstValidationError || getErrorMessage(error, "\u0935\u094d\u0939\u093f\u0921\u093f\u0913 \u091c\u0924\u0928 \u0915\u0930\u0924\u093e\u0928\u093e \u0938\u092e\u0938\u094d\u092f\u093e \u0906\u0932\u0940."));
    } finally {
      setSaving(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-3 sm:p-4" role="presentation">
      <section role="dialog" aria-modal="true" aria-labelledby="video-form-title" className="my-auto max-h-[95vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-pb-border bg-white p-5 shadow-xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-pb-khaki">व्हिडिओ व्यवस्थापन</p>
            <h2 id="video-form-title" className="mt-1 text-xl font-extrabold text-pb-green">{isEditing ? "व्हिडिओ संपादित करा" : "नवीन व्हिडिओ जोडा"}</h2>
          </div>
          <button type="button" aria-label="बंद करा" disabled={saving} onClick={onClose} className="rounded-lg px-3 py-1 text-xl font-bold text-slate-500 hover:bg-pb-light disabled:opacity-50">×</button>
        </div>
        <form className="mt-5 space-y-4" onSubmit={submit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="video-subject" className="mb-1.5 block text-sm font-bold text-pb-green">विषय <span className="text-red-600">*</span></label>
              <select id="video-subject" required name="subject_id" value={form.subject_id} onChange={changeField} disabled={saving || isEditing} className={fieldClass}>
                <option value="">विषय निवडा</option>
                {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="video-topic" className="mb-1.5 block text-sm font-bold text-pb-green">प्रकरण <span className="text-red-600">*</span></label>
              <select id="video-topic" required name="topic_id" value={form.topic_id} onChange={changeField} disabled={!form.subject_id || topicsLoading || saving || isEditing} className={fieldClass}>
                <option value="">प्रकरण निवडा</option>
                {topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}
              </select>
              {isEditing && <p className="mt-1 text-xs text-slate-500">सध्याच्या API मध्ये विषय किंवा प्रकरण बदलण्याची सुविधा नाही.</p>}
              {topicsLoading && <p role="status" className="mt-1 text-xs text-slate-500">प्रकरणे लोड होत आहेत...</p>}
              {topicsError && <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-red-700"><span>{topicsError}</span><button type="button" onClick={retryTopics} className="font-bold underline">पुन्हा प्रयत्न</button></div>}
            </div>
          </div>
          <div>
            <label htmlFor="video-title" className="mb-1.5 block text-sm font-bold text-pb-green">व्हिडिओचे शीर्षक <span className="text-red-600">*</span></label>
            <input id="video-title" required maxLength={200} value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} disabled={saving} className={fieldClass} />
          </div>
          <fieldset className="space-y-3">
            <legend className="mb-2 text-sm font-bold text-pb-green">SOURCE TYPE</legend>
            <div className="flex flex-wrap gap-3">
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-pb-border px-4 py-3 text-sm font-semibold">
                <input type="radio" name="video-source" value="URL" checked={sourceType === "URL"} disabled={saving}
                  onChange={() => { setSourceType("URL"); setVideoFile(null); setFormError(""); }} />
                Video Link
              </label>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-pb-border px-4 py-3 text-sm font-semibold">
                <input type="radio" name="video-source" value="UPLOAD" checked={sourceType === "UPLOAD"} disabled={saving}
                  onChange={() => { setSourceType("UPLOAD"); setVideoFile(null); setFormError(""); }} />
                Upload Video
              </label>
            </div>
            {isEditing && (
              <div className="rounded-lg bg-pb-light p-3 text-xs text-slate-600">
                <span className="font-bold">Current source: </span>
                {video.source_type === "UPLOAD"
                  ? "Uploaded video" + (video.original_filename ? " ? " + video.original_filename : "")
                  : video.video_url || "External URL"}
              </div>
            )}
            {sourceType === "URL" ? (
              <div>
                <label htmlFor="video-url" className="mb-1.5 block text-sm font-bold text-pb-green">
                  Video URL <span className="text-red-600">*</span>
                </label>
                <input id="video-url" required type="url" inputMode="url"
                  placeholder="https://www.youtube.com/watch?v=xxxx"
                  value={form.video_url}
                  onChange={(event) => { setForm((current) => ({ ...current, video_url: event.target.value })); setFormError(""); }}
                  disabled={saving} className={fieldClass} />
              </div>
            ) : (
              <div>
                <label htmlFor="video-file" className="mb-1.5 block text-sm font-bold text-pb-green">
                  Video file <span className="text-red-600">*</span>
                </label>
                <input id="video-file" type="file" accept=".mp4,.webm,.mov,video/mp4,video/webm,video/quicktime"
                  disabled={saving}
                  onChange={(event) => {
                    const selected = event.target.files?.[0] || null;
                    if (!selected) { setVideoFile(null); return; }
                    const extension = selected.name.toLowerCase().slice(selected.name.lastIndexOf("."));
                    const mimeTypes = { ".mp4": "video/mp4", ".webm": "video/webm", ".mov": "video/quicktime" };
                    if (mimeTypes[extension] !== selected.type) {
                      setVideoFile(null);
                      setFormError("Select a valid MP4, WebM, or MOV video file.");
                      event.target.value = "";
                      return;
                    }
                    setVideoFile(selected);
                    setFormError("");
                  }}
                  className={fieldClass} />
                {videoFile ? (
                  <p className="mt-2 text-xs font-semibold text-slate-600">
                    {videoFile.name} ? {formatFileSize(videoFile.size)}
                  </p>
                ) : isEditing && video.source_type === "UPLOAD" ? (
                  <p className="mt-2 text-xs font-semibold text-slate-600">
                    Current uploaded video: {video.original_filename || "file saved"}
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-slate-500">MP4, WebM, MOV ? Maximum size is configured by the server.</p>
                )}
              </div>
            )}
          </fieldset>
          <div>
            <label htmlFor="video-description" className="mb-1.5 block text-sm font-bold text-pb-green">वर्णन</label>
            <textarea id="video-description" rows={3} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} disabled={saving} className={`${fieldClass} resize-y`} />
          </div>
          <div>
            <label htmlFor="video-duration" className="mb-1.5 block text-sm font-bold text-pb-green">कालावधी</label>
            <input id="video-duration" maxLength={20} placeholder="15:30" value={form.duration} onChange={(event) => setForm((current) => ({ ...current, duration: event.target.value }))} disabled={saving} className={fieldClass} />
          </div>
          {videoFile && saving && <p role="status" className="text-xs font-semibold text-slate-600">Uploading video: {uploadProgress}%</p>}
          {formError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{formError}</p>}
          <div className="flex flex-col-reverse gap-2 border-t border-pb-border-soft pt-4 sm:flex-row sm:justify-end">
            <button type="button" disabled={saving} onClick={onClose} className="rounded-lg border border-pb-border px-4 py-2.5 text-sm font-bold text-pb-green hover:bg-pb-light disabled:opacity-60">रद्द करा</button>
            <button type="submit" disabled={saving || (isEditing ? false : !subjects.length)} className="rounded-lg bg-pb-green px-4 py-2.5 text-sm font-bold text-white hover:bg-pb-khaki disabled:cursor-not-allowed disabled:opacity-60">{saving ? "जतन होत आहे..." : isEditing ? "बदल जतन करा" : "व्हिडिओ जोडा"}</button>
          </div>
        </form>
      </section>
    </div>
  );
}

function ConfirmDialog({ confirmation, busy, error, onCancel, onConfirm }) {
  const deleting = confirmation.action === "delete";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="presentation">
      <section role="dialog" aria-modal="true" aria-labelledby="video-confirm-title" className="w-full max-w-md rounded-xl border border-pb-border bg-white p-6 shadow-xl">
        <h2 id="video-confirm-title" className="text-lg font-extrabold text-pb-green">{deleting ? "व्हिडिओ हटवायचा आहे का?" : "स्थिती बदलायची आहे का?"}</h2>
        <p className="mt-3 break-words text-sm leading-6 text-slate-700">{deleting ? "हा व्हिडिओ हटवायचा आहे का?" : `“${confirmation.video.title}” व्हिडिओ ${confirmation.video.is_active ? "निष्क्रिय" : "सक्रिय"} करायचा आहे का?`}</p>
        {error && <p role="alert" className="mt-3 text-sm font-semibold text-red-700">{error}</p>}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" disabled={busy} onClick={onCancel} className="rounded-lg border border-pb-border px-4 py-2 text-sm font-bold text-pb-green hover:bg-pb-light disabled:opacity-60">रद्द करा</button>
          <button type="button" disabled={busy} onClick={onConfirm} className={`rounded-lg px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60 ${deleting ? "bg-red-700 hover:bg-red-800" : "bg-pb-green hover:bg-pb-khaki"}`}>{busy ? "कृपया थांबा..." : deleting ? "व्हिडिओ हटवा" : "पुष्टी करा"}</button>
        </div>
      </section>
    </div>
  );
}

function AdminVideos() {
  const [videos, setVideos] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [filterTopics, setFilterTopics] = useState([]);
  const [subjectsError, setSubjectsError] = useState("");
  const [topicsError, setTopicsError] = useState("");
  const [filtersReload, setFiltersReload] = useState(0);
  const [pagination, setPagination] = useState({ page: 1, per_page: PER_PAGE, total: 0, pages: 0 });
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [topicFilter, setTopicFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [reload, setReload] = useState(0);
  const [formVideo, setFormVideo] = useState(undefined);
  const [feedback, setFeedback] = useState("");
  const [confirmation, setConfirmation] = useState(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    let current = true;
    loadAllPages(getSubjects, "subjects")
      .then((items) => { if (current) setSubjects(items); })
      .catch((error) => { if (current) setSubjectsError(getErrorMessage(error, "विषय लोड करता आले नाहीत.")); });
    return () => { current = false; };
  }, [filtersReload]);

  useEffect(() => {
    let current = true;
    const filters = subjectFilter ? { subject_id: subjectFilter } : {};
    loadAllPages(getTopics, "topics", filters)
      .then((items) => { if (current) setFilterTopics(items); })
      .catch((error) => { if (current) setTopicsError(getErrorMessage(error, "प्रकरणे लोड करता आली नाहीत.")); });
    return () => { current = false; };
  }, [subjectFilter, filtersReload]);

  useEffect(() => {
    let current = true;
    const loadVideos = async () => {
      setLoading(true);
      setListError("");
      const params = { page, per_page: PER_PAGE, search: debouncedSearch };
      if (subjectFilter) params.subject_id = subjectFilter;
      if (topicFilter) params.topic_id = topicFilter;
      if (statusFilter !== "") params.is_active = statusFilter;
      try {
        const response = await getAdminVideos(params);
        const data = response?.data;
        if (!response?.success || !Array.isArray(data?.videos) || !data?.pagination) {
          throw new Error(response?.message || "व्हिडिओ प्रतिसाद अपूर्ण आहे.");
        }
        if (current) { setVideos(data.videos); setPagination(data.pagination); }
      } catch (error) {
        if (current) {
          setListError(getErrorMessage(error, "व्हिडिओ लोड करताना समस्या आली."));
          setVideos([]);
        }
      } finally {
        if (current) setLoading(false);
      }
    };
    loadVideos();
    return () => { current = false; };
  }, [page, debouncedSearch, subjectFilter, topicFilter, statusFilter, reload]);

  const showFormSuccess = (message) => {
    setFormVideo(undefined);
    setFeedback(message);
    setReload((value) => value + 1);
  };

  const runConfirmedAction = async () => {
    if (!confirmation || actionBusy) return;
    setActionBusy(true);
    setActionError("");
    setFeedback("");
    try {
      if (confirmation.action === "status") {
        const nextStatus = !confirmation.video.is_active;
        await updateAdminVideoStatus(confirmation.video.id, nextStatus);
        setFeedback(nextStatus ? "व्हिडिओ सक्रिय केला." : "व्हिडिओ निष्क्रिय केला.");
      } else {
        await deleteAdminVideo(confirmation.video.id);
        setFeedback("व्हिडिओ हटवला.");
        if (videos.length === 1 && page > 1) setPage((value) => value - 1);
      }
      setConfirmation(null);
      setReload((value) => value + 1);
    } catch (error) {
      setActionError(getErrorMessage(error, confirmation.action === "delete" ? "व्हिडिओ हटवताना समस्या आली." : "स्थिती बदलताना समस्या आली."));
    } finally {
      setActionBusy(false);
    }
  };

  const firstResult = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.per_page + 1;
  const lastResult = Math.min(pagination.page * pagination.per_page, pagination.total);
  const hasFilters = Boolean(search || subjectFilter || topicFilter || statusFilter !== "");
  const resetFilters = () => {
    setSearch(""); setDebouncedSearch(""); setSubjectFilter(""); setTopicFilter(""); setStatusFilter(""); setPage(1);
  };
  const selectClass = "w-full rounded-lg border border-pb-border bg-white px-3.5 py-2.5 text-sm text-pb-green outline-none focus:border-pb-khaki focus:ring-2 focus:ring-pb-khaki/20";

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-7 border-b border-pb-border pb-5">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-pb-khaki">सामग्री व्यवस्थापन</p>
        <h1 className="mt-2 text-2xl font-extrabold text-pb-green sm:text-3xl">व्हिडिओ व्यवस्थापन</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">विद्यार्थ्यांसाठी अभ्यासाचे व्हिडिओ व्यवस्थापित करा</p>
      </div>

      {feedback && <div role="status" className="mb-5 flex items-center justify-between gap-3 rounded-lg border border-[#cbd8c1] bg-[#e8eee3] px-4 py-3 text-sm font-semibold text-pb-green"><span>{feedback}</span><button type="button" aria-label="संदेश बंद करा" onClick={() => setFeedback("")} className="text-lg">×</button></div>}

      <section className="rounded-lg border border-pb-border bg-white p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-extrabold text-pb-green">व्हिडिओ</h2>
            {!loading && !listError && <p className="mt-1 text-xs font-semibold text-slate-500">{firstResult}–{lastResult} पैकी {pagination.total} व्हिडिओ</p>}
          </div>
          <button type="button" onClick={() => setFormVideo(null)} className="rounded-lg bg-pb-green px-4 py-2.5 text-sm font-bold text-white transition hover:bg-pb-khaki">＋ नवीन व्हिडिओ जोडा</button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <label htmlFor="admin-video-search" className="mb-1.5 block text-sm font-bold text-pb-green">शोधा</label>
            <input id="admin-video-search" type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="व्हिडिओ शोधा..." className={selectClass} />
          </div>
          <div>
            <label htmlFor="admin-video-subject" className="mb-1.5 block text-sm font-bold text-pb-green">विषय</label>
            <select id="admin-video-subject" value={subjectFilter} onChange={(event) => { setSubjectFilter(event.target.value); setTopicFilter(""); setFilterTopics([]); setPage(1); }} className={selectClass}>
              <option value="">सर्व विषय</option>
              {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
            </select>
            {subjectsError && <p className="mt-1 text-xs text-red-700">{subjectsError} <button type="button" onClick={() => setFiltersReload((value) => value + 1)} className="font-bold underline">पुन्हा प्रयत्न</button></p>}
          </div>
          <div>
            <label htmlFor="admin-video-topic" className="mb-1.5 block text-sm font-bold text-pb-green">प्रकरण</label>
            <select id="admin-video-topic" value={topicFilter} onChange={(event) => { setTopicFilter(event.target.value); setPage(1); }} className={selectClass}>
              <option value="">सर्व प्रकरणे</option>
              {filterTopics.map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}
            </select>
            {topicsError && <p className="mt-1 text-xs text-red-700">{topicsError} <button type="button" onClick={() => { setTopicsError(""); setFiltersReload((value) => value + 1); }} className="font-bold underline">पुन्हा प्रयत्न</button></p>}
          </div>
          <div>
            <label htmlFor="admin-video-status" className="mb-1.5 block text-sm font-bold text-pb-green">स्थिती</label>
            <select id="admin-video-status" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }} className={selectClass}>
              <option value="">सर्व</option><option value="true">सक्रिय</option><option value="false">निष्क्रिय</option>
            </select>
          </div>
          {hasFilters && <div className="flex items-end"><button type="button" onClick={resetFilters} className="rounded-lg border border-pb-border px-4 py-2.5 text-sm font-bold text-pb-green hover:bg-pb-light">फिल्टर काढा</button></div>}
        </div>
      </section>

      <section className="mt-6 overflow-hidden rounded-lg border border-pb-border bg-white">
        {loading ? (
          <div role="status" className="px-5 py-12 text-center"><span className="mx-auto block h-8 w-8 animate-spin rounded-full border-4 border-pb-border border-t-pb-khaki" /><p className="mt-3 text-sm font-semibold text-pb-green">व्हिडिओ लोड होत आहेत...</p></div>
        ) : listError ? (
          <div role="alert" className="px-5 py-10 text-center"><p className="text-sm font-semibold text-red-700">व्हिडिओ लोड करताना समस्या आली.</p><p className="mt-1 text-sm text-slate-600">{listError}</p><button type="button" onClick={() => setReload((value) => value + 1)} className="mt-4 rounded-lg bg-pb-green px-4 py-2 text-sm font-bold text-white hover:bg-pb-khaki">पुन्हा प्रयत्न</button></div>
        ) : videos.length === 0 ? (
          <div className="px-5 py-12 text-center"><p className="font-bold text-pb-green">अद्याप कोणतेही व्हिडिओ उपलब्ध नाहीत.</p>{hasFilters && <button type="button" onClick={resetFilters} className="mt-3 text-sm font-bold text-pb-khaki underline">फिल्टर काढा</button>}</div>
        ) : (
          <div className="space-y-3"><div className="grid gap-3 xl:hidden">{videos.map((video) => <article key={video.id} className="rounded-xl border border-pb-border-soft bg-white p-4"><h3 className="break-words font-bold text-pb-green">{video.title}</h3><p className="mt-2 break-words text-sm text-pb-khaki">{video.subject?.name || "N/A"} / {video.topic?.name || "N/A"}</p>{video.source_type === "UPLOAD" ? <p className="mt-2 break-all text-xs text-slate-500">Uploaded video - {video.original_filename || "file saved"}{video.file_size_bytes ? ` / ${formatFileSize(video.file_size_bytes)}` : ""}</p> : <><p className="mt-2 break-all text-xs text-slate-500">{video.video_url}</p>{canPreview(video.video_url) && <a href={video.video_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-11 items-center font-bold text-pb-khaki underline">Watch video</a>}</>}<p className="mt-3 break-words text-sm leading-6 text-slate-600">{video.description || "No description"}</p><p className="mt-2 text-sm text-slate-600">Duration: {video.duration || "N/A"} / {video.is_active ? "Active" : "Inactive"}</p><div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => setFormVideo(video)} className="min-h-11 rounded-md border border-pb-khaki px-3 text-sm font-bold">Edit</button><button type="button" disabled={actionBusy} onClick={() => { setActionError(""); setConfirmation({ action: "status", video }); }} className="min-h-11 rounded-md border border-pb-border px-3 text-sm font-bold disabled:opacity-50">{video.is_active ? "Deactivate" : "Activate"}</button><button type="button" disabled={actionBusy} onClick={() => { setActionError(""); setConfirmation({ action: "delete", video }); }} className="min-h-11 rounded-md border border-red-200 px-3 text-sm font-bold text-red-700 disabled:opacity-50">Delete</button></div></article>)}</div><div className="hidden max-w-full overflow-x-auto xl:block"><table className="w-full min-w-[1120px] border-collapse text-left text-sm">
              <thead className="bg-pb-light text-xs uppercase tracking-wide text-pb-green"><tr>{["व्हिडिओ", "विषय / प्रकरण", "वर्णन", "कालावधी", "स्थिती", "तयार केले", "कृती"].map((heading) => <th key={heading} scope="col" className="whitespace-nowrap px-4 py-3 font-bold">{heading}</th>)}</tr></thead>
              <tbody className="divide-y divide-pb-border-soft">
                {videos.map((video) => (
                  <tr key={video.id} className="align-top hover:bg-pb-light/60">
                    <td className="max-w-72 px-4 py-3">
                      <p title={video.title} className="line-clamp-2 font-bold text-pb-green">{video.title}</p>
                      {video.source_type === "UPLOAD" ? (
                        <p className="mt-1 break-all text-xs text-slate-500">
                          Uploaded video - {video.original_filename || "file saved"}
                          {video.file_size_bytes ? " ? " + formatFileSize(video.file_size_bytes) : ""}
                        </p>
                      ) : (
                        <>
                          <p title={video.video_url || ""} className="mt-1 max-w-64 break-all text-xs text-slate-500">{video.video_url}</p>
                          {canPreview(video.video_url) && <a href={video.video_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex text-xs font-bold text-pb-khaki underline">Watch video</a>}
                        </>
                      )}
                    </td>
                    <td className="px-4 py-3"><p className="font-semibold text-pb-green">{video.subject?.name || "—"}</p><p className="mt-1 text-slate-600">{video.topic?.name || "—"}</p></td>
                    <td className="max-w-64 px-4 py-3"><p title={video.description || ""} className="line-clamp-3 text-slate-600">{video.description || "—"}</p></td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{video.duration || "—"}</td>
                    <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${video.is_active ? "bg-[#e8eee3] text-pb-green" : "bg-[#f2ecda] text-pb-khaki"}`}>{video.is_active ? "सक्रिय" : "निष्क्रिय"}</span></td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(video.created_at)}</td>
                    <td className="px-4 py-3"><div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => setFormVideo(video)} className="rounded-md border border-pb-khaki px-3 py-1.5 text-xs font-bold text-pb-green hover:bg-pb-light">संपादित करा</button>
                      <button type="button" disabled={actionBusy} onClick={() => { setActionError(""); setConfirmation({ action: "status", video }); }} className="rounded-md border border-pb-border px-3 py-1.5 text-xs font-bold text-pb-green hover:bg-[#e8eee3] disabled:opacity-50">{video.is_active ? "निष्क्रिय करा" : "सक्रिय करा"}</button>
                      <button type="button" disabled={actionBusy} onClick={() => { setActionError(""); setConfirmation({ action: "delete", video }); }} className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-50">हटवा</button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div></div>
        )}
        {!loading && !listError && pagination.pages > 0 && <div className="flex flex-col gap-3 border-t border-pb-border-soft px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"><p className="text-sm font-semibold text-slate-600">पृष्ठ {pagination.page} / {pagination.pages} · एकूण {pagination.total}</p><div className="flex items-center gap-2"><button type="button" disabled={pagination.page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-md border border-pb-border px-4 py-2 text-sm font-bold text-pb-green hover:bg-pb-light disabled:cursor-not-allowed disabled:opacity-40">मागील</button><button type="button" disabled={pagination.page >= pagination.pages} onClick={() => setPage((value) => Math.min(pagination.pages, value + 1))} className="rounded-md border border-pb-border px-4 py-2 text-sm font-bold text-pb-green hover:bg-pb-light disabled:cursor-not-allowed disabled:opacity-40">पुढील</button></div></div>}
      </section>

      {formVideo !== undefined && <VideoForm key={formVideo?.id || "create-video"} video={formVideo} subjects={subjects} onClose={() => setFormVideo(undefined)} onSuccess={showFormSuccess} />}
      {confirmation && <ConfirmDialog confirmation={confirmation} busy={actionBusy} error={actionError} onCancel={() => setConfirmation(null)} onConfirm={runConfirmedAction} />}
    </div>
  );
}

export default AdminVideos;
