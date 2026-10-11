import { useEffect, useState } from "react";

import { getSubjects } from "../../services/admin/adminSubjectService";
import { getTopics } from "../../services/admin/adminTopicService";
import {
  deleteStudyMaterial,
  getStudyMaterials,
  updateStudyMaterialStatus,
  uploadStudyMaterial,
} from "../../services/admin/adminStudyMaterialService";

const PER_PAGE = 20;
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const emptyForm = { subject_id: "", topic_id: "", title: "", file: null };

async function loadAllPages(fetchPage, recordsKey, filters = {}) {
  const first = await fetchPage({ ...filters, page: 1, per_page: 100 });
  const records = first?.data?.[recordsKey];
  const pages = first?.data?.pagination?.pages;
  if (!first?.success || !Array.isArray(records) || !Number.isInteger(pages)) {
    throw new Error(first?.message || "The selection list response was incomplete.");
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
      throw new Error(response?.message || "The selection list response was incomplete.");
    }
    return pageRecords;
  }));
}

const getErrorMessage = (error, fallback) =>
  error.response?.data?.message || fallback;

const formatDate = (value) => {
  if (!value) return "Not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not available"
    : date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
};

const formatFileSize = (size) => {
  if (size < 1024) return `${size} Bytes`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

function UploadModal({ subjects, onClose, onSuccess }) {
  const [form, setForm] = useState(emptyForm);
  const [topics, setTopics] = useState([]);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [topicsError, setTopicsError] = useState("");
  const [topicsReload, setTopicsReload] = useState(0);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!form.subject_id) {
      return undefined;
    }
    let isCurrent = true;
    loadAllPages(getTopics, "topics", { subject_id: form.subject_id })
      .then((items) => { if (isCurrent) setTopics(items); })
      .catch((error) => {
        if (isCurrent) setTopicsError(getErrorMessage(error, "Unable to load topics."));
      })
      .finally(() => { if (isCurrent) setTopicsLoading(false); });
    return () => { isCurrent = false; };
  }, [form.subject_id, topicsReload]);

  const changeField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === "subject_id" ? { topic_id: "" } : {}),
    }));
    if (name === "subject_id") {
      setTopics([]);
      setTopicsError("");
      setTopicsLoading(Boolean(value));
    }
    setFormError("");
  };

  const retryTopics = () => {
    setTopicsError("");
    setTopicsLoading(true);
    setTopicsReload((current) => current + 1);
  };

  const chooseFile = async (event) => {
    const file = event.target.files?.[0] || null;
    setForm((current) => ({ ...current, file }));
    setFormError("");
    if (!file) return;
    const rejectFile = (message) => {
      setFormError(message);
      setForm((current) => ({ ...current, file: null }));
      event.target.value = "";
    };
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      rejectFile("Choose a file with a .pdf extension.");
      return;
    }
    if (file.type && file.type.toLowerCase() !== "application/pdf") {
      rejectFile("The selected file must be a PDF.");
      return;
    }
    if (file.size === 0) {
      rejectFile("The selected PDF is empty.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      rejectFile("PDF files must be 20 MB or smaller.");
      return;
    }
    try {
      const signature = new Uint8Array(await file.slice(0, 5).arrayBuffer());
      if (String.fromCharCode(...signature) !== "%PDF-") {
        rejectFile("The selected file does not appear to be a valid PDF.");
      }
    } catch {
      rejectFile("Unable to validate the selected file. Please choose it again.");
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    const title = form.title.trim();
    if (!form.subject_id || !form.topic_id || !title || title.length > 200 || !form.file) {
      setFormError("Select a subject and topic, enter a title (up to 200 characters), and choose a PDF.");
      return;
    }
    const formData = new FormData();
    formData.append("subject_id", form.subject_id);
    formData.append("topic_id", form.topic_id);
    formData.append("title", title);
    formData.append("file", form.file);
    setSaving(true);
    setProgress(0);
    setFormError("");
    try {
      const response = await uploadStudyMaterial(formData, (uploadEvent) => {
        if (uploadEvent.total) setProgress(Math.round((uploadEvent.loaded * 100) / uploadEvent.total));
      });
      if (!response?.success) throw new Error(response?.message || "Unable to upload the PDF.");
      onSuccess(response.message || "Study material uploaded successfully.");
    } catch (error) {
      setFormError(getErrorMessage(error, error.message || "Unable to upload the PDF. Please try again."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-3 sm:p-4" role="presentation">
      <section role="dialog" aria-modal="true" aria-labelledby="upload-study-material-title" className="my-auto max-h-[95vh] w-full max-w-xl overflow-y-auto rounded-xl border border-pb-border bg-white p-5 shadow-xl sm:p-6">
        <h2 id="upload-study-material-title" className="text-xl font-extrabold text-pb-green">Upload PDF</h2>
        <form className="mt-5 space-y-4" onSubmit={submit}>
          <div>
            <label htmlFor="study-material-subject" className="mb-1.5 block text-sm font-bold text-pb-green">Subject <span className="text-red-600">*</span></label>
            <select id="study-material-subject" name="subject_id" required disabled={saving} value={form.subject_id} onChange={changeField} className="w-full rounded-lg border border-pb-border bg-white px-3.5 py-2.5 text-sm text-pb-green outline-none focus:border-pb-khaki focus:ring-2 focus:ring-pb-khaki/20 disabled:bg-slate-100">
              <option value="">Select a subject</option>
              {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="study-material-topic" className="mb-1.5 block text-sm font-bold text-pb-green">Topic <span className="text-red-600">*</span></label>
            <select id="study-material-topic" name="topic_id" required disabled={!form.subject_id || topicsLoading || saving} value={form.topic_id} onChange={changeField} className="w-full rounded-lg border border-pb-border bg-white px-3.5 py-2.5 text-sm text-pb-green outline-none focus:border-pb-khaki focus:ring-2 focus:ring-pb-khaki/20 disabled:bg-slate-100">
              <option value="">{topicsLoading ? "Loading topics..." : "Select a topic"}</option>
              {topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}
            </select>
            {topicsError && <p role="alert" className="mt-2 text-sm font-semibold text-red-700">{topicsError} <button type="button" onClick={retryTopics} className="underline">Retry</button></p>}
          </div>
          <div>
            <label htmlFor="study-material-title" className="mb-1.5 block text-sm font-bold text-pb-green">PDF Title <span className="text-red-600">*</span></label>
            <input id="study-material-title" name="title" type="text" required maxLength={200} disabled={saving} value={form.title} onChange={changeField} className="w-full rounded-lg border border-pb-border bg-white px-3.5 py-2.5 text-sm text-pb-green outline-none focus:border-pb-khaki focus:ring-2 focus:ring-pb-khaki/20 disabled:bg-slate-100" />
            <p className="mt-1 text-right text-xs text-slate-500">{form.title.length}/200</p>
          </div>
          <div>
            <label htmlFor="study-material-file" className="mb-1.5 block text-sm font-bold text-pb-green">PDF File <span className="text-red-600">*</span></label>
            <input id="study-material-file" type="file" accept=".pdf,application/pdf" disabled={saving} onChange={chooseFile} className="block w-full rounded-lg border border-pb-border bg-white px-3 py-2 text-sm text-pb-green file:mr-3 file:rounded-md file:border-0 file:bg-pb-light file:px-3 file:py-1.5 file:text-sm file:font-bold focus:outline-none focus:ring-2 focus:ring-pb-khaki/30 disabled:bg-slate-100" />
            {form.file && <p className="mt-2 break-all text-sm text-slate-600">{form.file.name} <span className="whitespace-nowrap">({formatFileSize(form.file.size)})</span></p>}
            <p className="mt-1 text-xs text-slate-500">PDF only, maximum 20 MB.</p>
          </div>
          {saving && <div role="status" className="rounded-lg bg-pb-light px-3 py-2 text-sm font-semibold text-pb-green">Uploading... {progress}%<div className="mt-2 h-2 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-pb-khaki transition-all" style={{ width: `${progress}%` }} /></div></div>}
          {formError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{formError}</p>}
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <button type="button" disabled={saving} onClick={onClose} className="rounded-lg border border-pb-border px-4 py-2.5 text-sm font-bold text-pb-green hover:bg-pb-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pb-khaki disabled:opacity-60">Cancel</button>
            <button type="submit" disabled={saving || topicsLoading || Boolean(topicsError)} className="rounded-lg bg-pb-green px-4 py-2.5 text-sm font-bold text-white transition hover:bg-pb-khaki focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pb-khaki disabled:cursor-not-allowed disabled:opacity-60">{saving ? "Uploading..." : "Upload PDF"}</button>
          </div>
        </form>
      </section>
    </div>
  );
}

function ConfirmDialog({ title, message, detail, busy, error, onCancel, onConfirm, confirmLabel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="presentation">
      <section role="dialog" aria-modal="true" aria-labelledby="study-material-confirm-title" className="w-full max-w-md rounded-xl border border-pb-border bg-white p-6 shadow-xl">
        <h2 id="study-material-confirm-title" className="text-lg font-extrabold text-pb-green">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-slate-700">{message}</p>
        {detail && <p className="mt-1 text-sm leading-6 text-slate-600">{detail}</p>}
        {error && <p role="alert" className="mt-3 text-sm font-semibold text-red-700">{error}</p>}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" disabled={busy} onClick={onCancel} className="rounded-lg border border-pb-border px-4 py-2 text-sm font-bold text-pb-green hover:bg-pb-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pb-khaki disabled:opacity-60">Cancel</button>
          <button type="button" disabled={busy} onClick={onConfirm} className="rounded-lg bg-pb-green px-4 py-2 text-sm font-bold text-white hover:bg-pb-khaki focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pb-khaki disabled:cursor-not-allowed disabled:opacity-60">{busy ? "Please wait..." : confirmLabel}</button>
        </div>
      </section>
    </div>
  );
}

function AdminStudyMaterials() {
  const [materials, setMaterials] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [filterTopics, setFilterTopics] = useState([]);
  const [filterTopicsLoading, setFilterTopicsLoading] = useState(false);
  const [filterTopicsReload, setFilterTopicsReload] = useState(0);
  const [subjectsError, setSubjectsError] = useState("");
  const [filterTopicsError, setFilterTopicsError] = useState("");
  const [selectionReload, setSelectionReload] = useState(0);
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
  const [showUpload, setShowUpload] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [confirmation, setConfirmation] = useState(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    let isCurrent = true;
    loadAllPages(getSubjects, "subjects")
      .then((items) => { if (isCurrent) { setSubjects(items); setSubjectsError(""); } })
      .catch((error) => { if (isCurrent) setSubjectsError(getErrorMessage(error, "Unable to load subjects.")); });
    return () => { isCurrent = false; };
  }, [selectionReload]);

  useEffect(() => {
    if (!subjectFilter) return undefined;
    let isCurrent = true;
    loadAllPages(getTopics, "topics", { subject_id: subjectFilter })
      .then((items) => { if (isCurrent) { setFilterTopics(items); setFilterTopicsError(""); } })
      .catch((error) => { if (isCurrent) setFilterTopicsError(getErrorMessage(error, "Unable to load topics.")); })
      .finally(() => { if (isCurrent) setFilterTopicsLoading(false); });
    return () => { isCurrent = false; };
  }, [subjectFilter, filterTopicsReload]);

  useEffect(() => {
    let isCurrent = true;
    const loadMaterials = async () => {
      try {
        const params = { page, per_page: PER_PAGE, search: debouncedSearch };
        if (subjectFilter) params.subject_id = subjectFilter;
        if (topicFilter) params.topic_id = topicFilter;
        if (statusFilter !== "") params.is_active = statusFilter;
        const response = await Promise.resolve().then(() => {
          if (isCurrent) {
            setLoading(true);
            setListError("");
          }
          return getStudyMaterials(params);
        });
        const data = response?.data;
        if (!response?.success || !Array.isArray(data?.study_materials) || !data?.pagination) {
          throw new Error(response?.message || "Study material response was incomplete.");
        }
        if (isCurrent) { setMaterials(data.study_materials); setPagination(data.pagination); }
      } catch (error) {
        if (isCurrent) setListError(getErrorMessage(error, "Unable to load study material. Please try again."));
      } finally {
        if (isCurrent) setLoading(false);
      }
    };
    loadMaterials();
    return () => { isCurrent = false; };
  }, [page, debouncedSearch, subjectFilter, topicFilter, statusFilter, reload]);

  const resetFilters = () => {
    setSearch(""); setDebouncedSearch(""); setSubjectFilter("");
    setTopicFilter(""); setStatusFilter(""); setPage(1);
    setFilterTopics([]); setFilterTopicsError(""); setFilterTopicsLoading(false);
  };

  const changeSubjectFilter = (value) => {
    setSubjectFilter(value);
    setTopicFilter("");
    setFilterTopics([]);
    setFilterTopicsError("");
    setFilterTopicsLoading(Boolean(value));
    setPage(1);
  };

  const retryFilterTopics = () => {
    setFilterTopicsError("");
    setFilterTopicsLoading(true);
    setFilterTopicsReload((current) => current + 1);
  };

  const confirmAction = async () => {
    if (!confirmation || actionBusy) return;
    setActionBusy(true); setActionError(""); setFeedback("");
    try {
      if (confirmation.action === "status") {
        await updateStudyMaterialStatus(confirmation.material.id, !confirmation.material.is_active);
        setFeedback(`Study material ${confirmation.material.is_active ? "deactivated" : "activated"} successfully.`);
      } else {
        await deleteStudyMaterial(confirmation.material.id);
        setFeedback("Study material deleted successfully.");
      }
      setConfirmation(null);
      setReload((current) => current + 1);
    } catch (error) {
      setActionError(getErrorMessage(error, "Unable to complete this action. Please try again."));
    } finally {
      setActionBusy(false);
    }
  };

  const firstResult = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.per_page + 1;
  const lastResult = Math.min(pagination.page * pagination.per_page, pagination.total);
  const hasFilters = Boolean(search || subjectFilter || topicFilter || statusFilter);

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-7 flex flex-col gap-4 border-b border-pb-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-pb-khaki">Content Management</p><h1 className="mt-2 text-2xl font-extrabold text-pb-green sm:text-3xl">Study Material</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Manage PDF study material for students.</p></div>
        <button type="button" onClick={() => setShowUpload(true)} disabled={Boolean(subjectsError) || subjects.length === 0} className="inline-flex shrink-0 items-center justify-center rounded-lg bg-pb-green px-4 py-2.5 text-sm font-bold text-white transition hover:bg-pb-khaki focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pb-khaki disabled:cursor-not-allowed disabled:opacity-50">+ Upload PDF</button>
      </div>
      {feedback && <p role="status" className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">{feedback}</p>}
      {subjectsError && <p role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{subjectsError} <button type="button" onClick={() => setSelectionReload((value) => value + 1)} className="ml-2 underline">Retry</button></p>}

      <section className="rounded-lg border border-pb-border bg-white p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_13rem_13rem_13rem_auto] lg:items-end">
          <div className="min-w-0"><label htmlFor="study-material-search" className="mb-2 block text-sm font-bold text-pb-green">Search study material</label><input id="study-material-search" type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search title or filename" className="w-full rounded-lg border border-pb-border bg-pb-light px-4 py-3 text-sm text-pb-green outline-none transition focus:border-pb-khaki focus:ring-2 focus:ring-pb-khaki/20" /></div>
          <div><label htmlFor="study-material-subject-filter" className="mb-2 block text-sm font-bold text-pb-green">Subject</label><select id="study-material-subject-filter" value={subjectFilter} onChange={(event) => changeSubjectFilter(event.target.value)} className="w-full rounded-lg border border-pb-border bg-white px-3.5 py-3 text-sm text-pb-green outline-none focus:border-pb-khaki focus:ring-2 focus:ring-pb-khaki/20"><option value="">All Subjects</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select></div>
          <div><label htmlFor="study-material-topic-filter" className="mb-2 block text-sm font-bold text-pb-green">Topic</label><select id="study-material-topic-filter" value={topicFilter} disabled={!subjectFilter || filterTopicsLoading || Boolean(filterTopicsError)} onChange={(event) => { setTopicFilter(event.target.value); setPage(1); }} className="w-full rounded-lg border border-pb-border bg-white px-3.5 py-3 text-sm text-pb-green outline-none focus:border-pb-khaki focus:ring-2 focus:ring-pb-khaki/20 disabled:bg-slate-100"><option value="">{filterTopicsError ? "Topics unavailable" : filterTopicsLoading ? "Loading topics..." : subjectFilter ? "All Topics" : "Select a subject first"}</option>{filterTopics.map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}</select>{filterTopicsError && <p role="alert" className="mt-1 text-xs text-red-700">{filterTopicsError} <button type="button" onClick={retryFilterTopics} className="ml-1 underline">Retry</button></p>}</div>
          <div><label htmlFor="study-material-status-filter" className="mb-2 block text-sm font-bold text-pb-green">Status</label><select id="study-material-status-filter" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }} className="w-full rounded-lg border border-pb-border bg-white px-3.5 py-3 text-sm text-pb-green outline-none focus:border-pb-khaki focus:ring-2 focus:ring-pb-khaki/20"><option value="">All</option><option value="true">Active</option><option value="false">Inactive</option></select></div>
          <button type="button" onClick={resetFilters} disabled={!hasFilters} className="rounded-lg border border-pb-border px-4 py-3 text-sm font-bold text-pb-green hover:bg-pb-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pb-khaki disabled:cursor-not-allowed disabled:opacity-50">Reset</button>
        </div>
      </section>

      <section className="mt-6 min-w-0 overflow-hidden rounded-lg border border-pb-border bg-white">
        <div className="flex flex-col gap-1 border-b border-pb-border-soft px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"><h2 className="font-extrabold text-pb-green">PDF Study Material</h2>{!loading && !listError && <p className="text-xs font-semibold text-slate-500">Showing {firstResult}–{lastResult} of {pagination.total} files</p>}</div>
        {loading ? <div role="status" className="px-5 py-12 text-center"><span className="mx-auto block h-8 w-8 animate-spin rounded-full border-4 border-pb-border border-t-pb-khaki" /><p className="mt-3 text-sm font-semibold text-pb-green">Loading study material...</p></div>
          : listError ? <div role="alert" className="px-5 py-10 text-center"><p className="text-sm font-semibold text-red-700">{listError}</p><button type="button" onClick={() => setReload((value) => value + 1)} className="mt-4 rounded-lg bg-pb-green px-4 py-2 text-sm font-bold text-white hover:bg-pb-khaki focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pb-khaki">Retry</button></div>
            : materials.length === 0 ? <div className="px-5 py-12 text-center"><p className="font-bold text-pb-green">{debouncedSearch ? "No study material matches your search." : "No PDF study material found."}</p>{hasFilters && <p className="mt-1 text-sm text-slate-500">Try changing or resetting your search and filters.</p>}</div>
              : <><div className="space-y-3"><div className="grid gap-3 xl:hidden">{materials.map((material) => <article key={material.id} className="rounded-xl border border-pb-border-soft bg-white p-4"><h3 className="break-words font-bold text-pb-green">{material.title}</h3><p className="mt-2 break-words text-sm text-pb-khaki">{material.subject_name} / {material.topic_name}</p><p className="mt-3 break-all text-sm text-slate-600">{material.original_filename}</p><dl className="mt-3 grid grid-cols-2 gap-2 text-sm"><div><dt className="text-xs font-bold text-slate-500">File size</dt><dd>{formatFileSize(material.file_size_bytes)}</dd></div><div><dt className="text-xs font-bold text-slate-500">Status</dt><dd>{material.is_active ? "Active" : "Inactive"}</dd></div><div className="col-span-2"><dt className="text-xs font-bold text-slate-500">Created</dt><dd>{formatDate(material.created_at)}</dd></div></dl><div className="mt-4 flex flex-wrap gap-2"><button type="button" disabled={actionBusy} onClick={() => { setActionError(""); setConfirmation({ action: "status", material }); }} className="min-h-11 rounded-md border border-pb-border px-3 text-sm font-bold disabled:opacity-50">{material.is_active ? "Deactivate" : "Activate"}</button><button type="button" disabled={actionBusy} onClick={() => { setActionError(""); setConfirmation({ action: "delete", material }); }} className="min-h-11 rounded-md border border-red-200 px-3 text-sm font-bold text-red-700 disabled:opacity-50">Delete</button></div></article>)}</div></div><div className="hidden max-w-full overflow-x-auto xl:block"><div className="max-w-full overflow-x-auto"><table className="w-full min-w-[1160px] border-collapse text-left text-sm"><thead className="bg-pb-light text-xs uppercase tracking-wide text-pb-green"><tr>{["#", "Title", "Subject", "Topic", "Original Filename", "File Size", "Status", "Created Date", "Actions"].map((heading) => <th key={heading} scope="col" className="whitespace-nowrap px-4 py-3 font-bold">{heading}</th>)}</tr></thead><tbody className="divide-y divide-pb-border-soft">{materials.map((material, index) => <tr key={material.id} className="hover:bg-pb-light/60"><td className="px-4 py-3 text-slate-500">{(pagination.page - 1) * pagination.per_page + index + 1}</td><td className="max-w-64 px-4 py-3 font-bold text-pb-green">{material.title}</td><td className="whitespace-nowrap px-4 py-3 text-slate-700">{material.subject_name}</td><td className="whitespace-nowrap px-4 py-3 text-slate-700">{material.topic_name}</td><td className="max-w-64 break-all px-4 py-3 text-slate-600">{material.original_filename}</td><td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatFileSize(material.file_size_bytes)}</td><td className="px-4 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${material.is_active ? "bg-[#e8eee3] text-pb-green" : "bg-[#f2ecda] text-pb-khaki"}`}>{material.is_active ? "Active" : "Inactive"}</span></td><td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(material.created_at)}</td><td className="px-4 py-3"><div className="flex items-center gap-2"><button type="button" disabled={actionBusy} onClick={() => { setActionError(""); setConfirmation({ action: "status", material }); }} className="rounded-md border border-pb-border px-3 py-1.5 text-xs font-bold text-pb-green transition hover:bg-[#e8eee3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pb-khaki disabled:cursor-not-allowed disabled:opacity-50">{material.is_active ? "Deactivate" : "Activate"}</button><button type="button" disabled={actionBusy} onClick={() => { setActionError(""); setConfirmation({ action: "delete", material }); }} className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:cursor-not-allowed disabled:opacity-50">Delete</button></div></td></tr>)}</tbody></table></div></div></>}
        {!loading && !listError && pagination.pages > 0 && <div className="flex flex-col gap-3 border-t border-pb-border-soft px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"><p className="text-sm font-semibold text-slate-600">Page {pagination.page} of {pagination.pages}</p><div className="flex items-center gap-2"><button type="button" disabled={pagination.page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-md border border-pb-border px-4 py-2 text-sm font-bold text-pb-green hover:bg-pb-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pb-khaki disabled:cursor-not-allowed disabled:opacity-40">Previous</button><button type="button" disabled={pagination.page >= pagination.pages} onClick={() => setPage((value) => Math.min(pagination.pages, value + 1))} className="rounded-md border border-pb-border px-4 py-2 text-sm font-bold text-pb-green hover:bg-pb-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pb-khaki disabled:cursor-not-allowed disabled:opacity-40">Next</button></div></div>}
      </section>

      {showUpload && <UploadModal subjects={subjects} onClose={() => setShowUpload(false)} onSuccess={(message) => { setShowUpload(false); setFeedback(message); setPage(1); setReload((value) => value + 1); }} />}
      {confirmation && <ConfirmDialog title={confirmation.action === "status" ? "Confirm status change" : "Delete PDF study material?"} message={confirmation.action === "status" ? `Are you sure you want to ${confirmation.material.is_active ? "deactivate" : "activate"} “${confirmation.material.title}”?` : "Are you sure you want to permanently delete this PDF?"} detail={confirmation.action === "delete" ? "This will remove the PDF and its record." : "The PDF file itself will not be changed."} busy={actionBusy} error={actionError} onCancel={() => setConfirmation(null)} onConfirm={confirmAction} confirmLabel={confirmation.action === "status" ? "Confirm" : "Delete PDF"} />}
    </div>
  );
}

export default AdminStudyMaterials;
