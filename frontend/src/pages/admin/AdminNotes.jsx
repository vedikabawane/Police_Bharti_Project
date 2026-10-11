import { useEffect, useState } from "react";

import AdminConfirmDialog from "../../components/admin/AdminConfirmDialog";
import { getSubjects } from "../../services/admin/adminSubjectService";
import { getTopics } from "../../services/admin/adminTopicService";
import { createNote, deleteNote, getNotes, updateNote } from "../../services/admin/adminNoteService";

const PER_PAGE = 20;
const emptyForm = { subject_id: "", topic_id: "", title: "", content: "", is_active: true };

async function getAllPages(fetchPage, { recordsKey, ...filters } = {}) {
  const first = await fetchPage({ ...filters, page: 1, per_page: 100 });
  const records = first?.data?.[recordsKey];
  const pageCount = first?.data?.pagination?.pages;
  if (!first?.success || !Array.isArray(records) || !Number.isInteger(pageCount)) {
    throw new Error(first?.message || "The list response was incomplete.");
  }
  if (pageCount < 2) return records;
  const remaining = await Promise.all(
    Array.from({ length: pageCount - 1 }, (_, index) =>
      fetchPage({ ...filters, page: index + 2, per_page: 100 }),
    ),
  );
  return records.concat(...remaining.map((response) => {
    const pageRecords = response?.data?.[recordsKey];
    if (!response?.success || !Array.isArray(pageRecords)) {
      throw new Error(response?.message || "The list response was incomplete.");
    }
    return pageRecords;
  }));
}

const loadAllSubjects = () => getAllPages(getSubjects, { recordsKey: "subjects" });
const loadTopics = (subjectId = "") => {
  const filters = { recordsKey: "topics" };
  if (subjectId) filters.subject_id = subjectId;
  return getAllPages(getTopics, filters);
};

const formatDate = (value) => {
  if (!value) return "Not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not available"
    : date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const contentPreview = (content) => {
  if (!content) return "Not available";
  return content.length > 180 ? `${content.slice(0, 180)}…` : content;
};

function NoteModal({ mode, form, subjects, topics, subjectsLoading, topicsLoading, topicsError,
  formError, saving, createdPendingStatus, onChange, onRetryTopics, onClose, onSubmit }) {
  const isEditing = mode === "edit";
  const fieldsLocked = createdPendingStatus;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-3 sm:p-4" role="presentation">
      <section role="dialog" aria-modal="true" aria-labelledby="note-form-title" className="my-auto max-h-[95vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-pb-border bg-white p-5 shadow-xl sm:p-6">
        <h2 id="note-form-title" className="text-xl font-extrabold text-pb-green">{isEditing ? "Edit Note" : "Add Note"}</h2>
        <form className="mt-5 space-y-4" onSubmit={onSubmit}>
          {isEditing ? (
            <div className="grid gap-3 rounded-lg bg-pb-light p-4 sm:grid-cols-2">
              <div><span className="block text-xs font-bold uppercase tracking-wide text-slate-500">Subject</span><p className="mt-1 text-sm font-semibold text-pb-green">{form.subject_name}</p></div>
              <div><span className="block text-xs font-bold uppercase tracking-wide text-slate-500">Topic</span><p className="mt-1 text-sm font-semibold text-pb-green">{form.topic_name}</p></div>
            </div>
          ) : (
            <>
              <div>
                <label htmlFor="note-subject" className="mb-1.5 block text-sm font-bold text-pb-green">Subject <span className="text-red-600">*</span></label>
                <select id="note-subject" name="subject_id" required disabled={subjectsLoading || fieldsLocked} value={form.subject_id} onChange={onChange} className="w-full rounded-lg border border-pb-border bg-white px-3.5 py-2.5 text-sm text-pb-green outline-none focus:border-pb-khaki focus:ring-2 focus:ring-pb-khaki/20 disabled:bg-slate-100">
                  <option value="">{subjectsLoading ? "Loading subjects..." : "Select a subject"}</option>
                  {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="note-topic" className="mb-1.5 block text-sm font-bold text-pb-green">Topic <span className="text-red-600">*</span></label>
                <select id="note-topic" name="topic_id" required disabled={!form.subject_id || topicsLoading || fieldsLocked} value={form.topic_id} onChange={onChange} className="w-full rounded-lg border border-pb-border bg-white px-3.5 py-2.5 text-sm text-pb-green outline-none focus:border-pb-khaki focus:ring-2 focus:ring-pb-khaki/20 disabled:bg-slate-100">
                  <option value="">{topicsLoading ? "Loading topics..." : "Select a topic"}</option>
                  {topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}
                </select>
                {topicsError && <p role="alert" className="mt-2 text-sm font-semibold text-red-700">{topicsError} <button type="button" onClick={onRetryTopics} className="underline">Retry</button></p>}
              </div>
            </>
          )}
          <div>
            <label htmlFor="note-title" className="mb-1.5 block text-sm font-bold text-pb-green">Title <span className="text-red-600">*</span></label>
            <input id="note-title" name="title" type="text" required minLength={2} maxLength={200} disabled={fieldsLocked} value={form.title} onChange={onChange} className="w-full rounded-lg border border-pb-border bg-white px-3.5 py-2.5 text-sm text-pb-green outline-none focus:border-pb-khaki focus:ring-2 focus:ring-pb-khaki/20 disabled:bg-slate-100" />
          </div>
          <div>
            <label htmlFor="note-content" className="mb-1.5 block text-sm font-bold text-pb-green">Content <span className="text-red-600">*</span></label>
            <textarea id="note-content" name="content" required rows={12} disabled={fieldsLocked} value={form.content} onChange={onChange} className="w-full resize-y rounded-lg border border-pb-border bg-white px-3.5 py-3 text-sm leading-6 text-pb-green outline-none focus:border-pb-khaki focus:ring-2 focus:ring-pb-khaki/20 disabled:bg-slate-100" />
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold text-pb-green"><input type="checkbox" name="is_active" disabled={fieldsLocked} checked={form.is_active} onChange={onChange} className="h-4 w-4 accent-pb-green" />Active</label>
          {createdPendingStatus && <p className="text-sm text-amber-800">The note was created, but its inactive status could not be saved. Retry to finish the status update.</p>}
          {formError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{formError}</p>}
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <button type="button" disabled={saving} onClick={onClose} className="rounded-lg border border-pb-border px-4 py-2.5 text-sm font-bold text-pb-green hover:bg-pb-light disabled:opacity-60">Cancel</button>
            <button type="submit" disabled={saving || (!isEditing && (subjectsLoading || !subjects.length || !form.subject_id || topicsLoading || !topics.some((topic) => String(topic.id) === form.topic_id)))} className="rounded-lg bg-pb-green px-4 py-2.5 text-sm font-bold text-white transition hover:bg-pb-khaki disabled:cursor-not-allowed disabled:opacity-60">{saving ? "Saving..." : createdPendingStatus ? "Retry status update" : isEditing ? "Save Changes" : "Create Note"}</button>
          </div>
        </form>
      </section>
    </div>
  );
}

function AdminNotes() {
  const [notes, setNotes] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [subjectsError, setSubjectsError] = useState("");
  const [subjectReload, setSubjectReload] = useState(0);
  const [topics, setTopics] = useState([]);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [topicsError, setTopicsError] = useState("");
  const [topicReload, setTopicReload] = useState(0);
  const [formTopics, setFormTopics] = useState([]);
  const [formTopicsLoading, setFormTopicsLoading] = useState(false);
  const [formTopicsError, setFormTopicsError] = useState("");
  const [formTopicReload, setFormTopicReload] = useState(0);
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
  const [formMode, setFormMode] = useState(null);
  const [formNote, setFormNote] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [createdPendingStatus, setCreatedPendingStatus] = useState(false);
  const [pendingCreatedNoteId, setPendingCreatedNoteId] = useState(null);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmNote, setConfirmNote] = useState(null);
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const [statusError, setStatusError] = useState("");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    let current = true;
    const fetchSubjects = async () => {
      setSubjectsLoading(true);
      setSubjectsError("");
      try {
        const records = await loadAllSubjects();
        if (current) setSubjects(records);
      } catch (error) {
        if (current) setSubjectsError(error.message || "Unable to load subjects.");
      } finally {
        if (current) setSubjectsLoading(false);
      }
    };
    fetchSubjects();
    return () => { current = false; };
  }, [subjectReload]);

  useEffect(() => {
    let current = true;
    const fetchTopics = async () => {
      setTopicsLoading(true);
      setTopicsError("");
      setTopics([]);
      try {
        const records = await loadTopics(subjectFilter);
        if (current) setTopics(records);
      } catch (error) {
        if (current) setTopicsError(error.message || "Unable to load topics.");
      } finally {
        if (current) setTopicsLoading(false);
      }
    };
    fetchTopics();
    return () => { current = false; };
  }, [subjectFilter, topicReload]);

  useEffect(() => {
    let current = true;
    const fetchFormTopics = async () => {
      if (!formMode || formMode !== "create" || !form.subject_id) {
        setFormTopics([]);
        setFormTopicsError("");
        setFormTopicsLoading(false);
        return;
      }
      setFormTopicsLoading(true);
      setFormTopicsError("");
      setFormTopics([]);
      try {
        const records = await loadTopics(form.subject_id);
        if (current) setFormTopics(records);
      } catch (error) {
        if (current) setFormTopicsError(error.message || "Unable to load topics for this subject.");
      } finally {
        if (current) setFormTopicsLoading(false);
      }
    };
    fetchFormTopics();
    return () => { current = false; };
  }, [formMode, form.subject_id, formTopicReload]);

  useEffect(() => {
    let current = true;
    const fetchNotes = async () => {
      setLoading(true);
      setListError("");
      try {
        const params = { page, per_page: PER_PAGE, search: debouncedSearch };
        if (subjectFilter) params.subject_id = subjectFilter;
        if (topicFilter) params.topic_id = topicFilter;
        if (statusFilter !== "") params.is_active = statusFilter;
        const response = await getNotes(params);
        if (!response?.success || !Array.isArray(response.data?.notes) || !response.data?.pagination) {
          throw new Error(response?.message || "Notes response is incomplete.");
        }
        if (current) {
          setNotes(response.data.notes);
          setPagination(response.data.pagination);
        }
      } catch (error) {
        if (current) setListError(error.response?.data?.message || error.message || "Unable to load notes. Please try again.");
      } finally {
        if (current) setLoading(false);
      }
    };
    fetchNotes();
    return () => { current = false; };
  }, [page, debouncedSearch, subjectFilter, topicFilter, statusFilter, reload]);

  const openCreate = () => {
    setForm({ ...emptyForm, subject_id: subjectFilter });
    setFormNote(null);
    setPendingCreatedNoteId(null);
    setCreatedPendingStatus(false);
    setFormError("");
    setFormMode("create");
  };

  const openEdit = (note) => {
    setForm({ subject_id: String(note.subject_id), topic_id: String(note.topic_id), subject_name: note.subject_name,
      topic_name: note.topic_name, title: note.title || "", content: note.content || "", is_active: Boolean(note.is_active) });
    setFormNote(note);
    setPendingCreatedNoteId(null);
    setCreatedPendingStatus(false);
    setFormError("");
    setFormMode("edit");
  };

  const closeForm = () => {
    if (saving) return;
    setFormMode(null);
    setFormNote(null);
    setForm(emptyForm);
    setPendingCreatedNoteId(null);
    setCreatedPendingStatus(false);
    setFormError("");
  };

  const handleFormChange = (event) => {
    const { name, value, checked, type } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value,
      ...(name === "subject_id" ? { topic_id: "" } : {}) }));
  };

  const finishSave = (message) => {
    setFeedback(message);
    setFormMode(null);
    setFormNote(null);
    setForm(emptyForm);
    setPendingCreatedNoteId(null);
    setCreatedPendingStatus(false);
    setReload((value) => value + 1);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const title = form.title.trim();
    if (title.length < 2) return setFormError("Title must be at least 2 characters.");
    if (formMode === "create" && (!form.subject_id || !form.topic_id)) return setFormError("Select both a subject and a topic.");
    if (!form.content.trim()) return setFormError("Content is required.");
    setSaving(true);
    setFormError("");
    setFeedback("");
    try {
      if (formMode === "edit") {
        await updateNote(formNote.id, { title, content: form.content, is_active: form.is_active });
        finishSave("Note updated successfully.");
      } else if (pendingCreatedNoteId) {
        await updateNote(pendingCreatedNoteId, { is_active: false });
        finishSave("Note created successfully.");
      } else {
        const response = await createNote(form.subject_id, form.topic_id, { title, content: form.content });
        if (!response?.success || !response.data?.id) throw new Error(response?.message || "Note creation response was incomplete.");
        if (!form.is_active) {
          setPendingCreatedNoteId(response.data.id);
          setCreatedPendingStatus(true);
          try {
            await updateNote(response.data.id, { is_active: false });
          } catch (error) {
            setFormError(error.response?.data?.message || "The note was created, but its status could not be set. Retry to finish.");
            setReload((value) => value + 1);
            return;
          }
        }
        finishSave("Note created successfully.");
      }
    } catch (error) {
      setFormError(error.response?.data?.message || error.message || "Unable to save the note. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async () => {
    if (!confirmNote || updatingStatusId !== null) return;
    setUpdatingStatusId(confirmNote.id);
    setStatusError("");
    setFeedback("");
    try {
      await updateNote(confirmNote.id, { is_active: !confirmNote.is_active });
      setFeedback(`Note ${confirmNote.is_active ? "deactivated" : "activated"} successfully.`);
      setConfirmNote(null);
      setReload((value) => value + 1);
    } catch (error) {
      setStatusError(error.response?.data?.message || "Unable to update note status. Please try again.");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteCandidate || deleteBusy) return;
    setDeleteBusy(true);
    setDeleteError("");
    setFeedback("");
    try {
      await deleteNote(deleteCandidate.id);
      setDeleteCandidate(null);
      setFeedback("Note deleted successfully.");
      setReload((value) => value + 1);
    } catch (error) {
      setDeleteError(error.response?.data?.message || error.message || "Unable to delete the note. Please try again.");
    } finally {
      setDeleteBusy(false);
    }
  };

  const firstResult = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.per_page + 1;
  const lastResult = Math.min(pagination.page * pagination.per_page, pagination.total);
  const hasFilters = Boolean(search || subjectFilter || topicFilter || statusFilter);
  const modalTopics = formMode === "create" ? formTopics : [];

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-7 flex flex-col gap-4 border-b border-pb-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-pb-khaki">Content Management</p><h1 className="mt-2 text-2xl font-extrabold text-pb-green sm:text-3xl">Notes Management</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Create and manage study notes organized by subject and topic.</p></div>
        <button type="button" onClick={openCreate} disabled={subjectsLoading || !subjects.length} className="inline-flex shrink-0 items-center justify-center rounded-lg bg-pb-green px-4 py-2.5 text-sm font-bold text-white transition hover:bg-pb-khaki disabled:cursor-not-allowed disabled:opacity-50">+ Add Note</button>
      </div>
      {feedback && <p role="status" className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">{feedback}</p>}
      {subjectsError && <p role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">Unable to load subjects: {subjectsError} <button type="button" onClick={() => setSubjectReload((value) => value + 1)} className="ml-2 underline">Retry</button></p>}

      <section className="rounded-lg border border-pb-border bg-white p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_13rem_13rem_13rem_auto] lg:items-end">
          <div className="min-w-0"><label htmlFor="note-search" className="mb-2 block text-sm font-bold text-pb-green">Search notes</label><input id="note-search" type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search notes..." className="w-full rounded-lg border border-pb-border bg-pb-light px-4 py-3 text-sm text-pb-green outline-none transition focus:border-pb-khaki focus:ring-2 focus:ring-pb-khaki/20" /></div>
          <div><label htmlFor="note-subject-filter" className="mb-2 block text-sm font-bold text-pb-green">Subject</label><select id="note-subject-filter" value={subjectFilter} onChange={(event) => { setSubjectFilter(event.target.value); setTopicFilter(""); setPage(1); }} className="w-full rounded-lg border border-pb-border bg-white px-3.5 py-3 text-sm text-pb-green outline-none focus:border-pb-khaki focus:ring-2 focus:ring-pb-khaki/20"><option value="">All Subjects</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select></div>
          <div><label htmlFor="note-topic-filter" className="mb-2 block text-sm font-bold text-pb-green">Topic</label><select id="note-topic-filter" disabled={topicsLoading || Boolean(topicsError)} value={topicFilter} onChange={(event) => { setTopicFilter(event.target.value); setPage(1); }} className="w-full rounded-lg border border-pb-border bg-white px-3.5 py-3 text-sm text-pb-green outline-none focus:border-pb-khaki focus:ring-2 focus:ring-pb-khaki/20 disabled:bg-slate-100"><option value="">{topicsLoading ? "Loading topics..." : "All Topics"}</option>{topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.name}{!subjectFilter ? ` · ${topic.subject_name}` : ""}</option>)}</select>{topicsError && <p role="alert" className="mt-1 text-xs text-red-700">{topicsError} <button type="button" onClick={() => setTopicReload((value) => value + 1)} className="underline">Retry</button></p>}</div>
          <div><label htmlFor="note-status-filter" className="mb-2 block text-sm font-bold text-pb-green">Status</label><select id="note-status-filter" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }} className="w-full rounded-lg border border-pb-border bg-white px-3.5 py-3 text-sm text-pb-green outline-none focus:border-pb-khaki focus:ring-2 focus:ring-pb-khaki/20"><option value="">All</option><option value="true">Active</option><option value="false">Inactive</option></select></div>
          <button type="button" onClick={() => { setSearch(""); setDebouncedSearch(""); setSubjectFilter(""); setTopicFilter(""); setStatusFilter(""); setPage(1); }} disabled={!hasFilters} className="rounded-lg border border-pb-border px-4 py-3 text-sm font-bold text-pb-green hover:bg-pb-light disabled:cursor-not-allowed disabled:opacity-50">Reset</button>
        </div>
      </section>

      <section className="mt-6 min-w-0 overflow-hidden rounded-lg border border-pb-border bg-white">
        <div className="flex flex-col gap-1 border-b border-pb-border-soft px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"><h2 className="font-extrabold text-pb-green">Study Notes</h2>{!loading && !listError && <p className="text-xs font-semibold text-slate-500">Showing {firstResult}–{lastResult} of {pagination.total} notes</p>}</div>
        {loading ? <div role="status" className="px-5 py-12 text-center"><span className="mx-auto block h-8 w-8 animate-spin rounded-full border-4 border-pb-border border-t-pb-khaki" /><p className="mt-3 text-sm font-semibold text-pb-green">Loading notes...</p></div>
          : listError ? <div role="alert" className="px-5 py-10 text-center"><p className="text-sm font-semibold text-red-700">{listError}</p><button type="button" onClick={() => setReload((value) => value + 1)} className="mt-4 rounded-lg bg-pb-green px-4 py-2 text-sm font-bold text-white hover:bg-pb-khaki">Retry</button></div>
            : notes.length === 0 ? <div className="px-5 py-12 text-center"><p className="font-bold text-pb-green">No notes found</p>{hasFilters && <p className="mt-1 text-sm text-slate-500">No notes match your current filters.</p>}</div>
              : <><div className="space-y-3"><div className="grid gap-3 xl:hidden">{notes.map((note) => <article key={note.id} className="rounded-xl border border-pb-border-soft bg-white p-4"><div className="flex items-start justify-between gap-3"><h3 className="break-words font-bold text-pb-green">{note.title}</h3><span className="shrink-0 rounded-full bg-pb-light px-2 py-1 text-xs font-bold">{note.is_active ? "Active" : "Inactive"}</span></div><p className="mt-2 break-words text-sm text-slate-600">{note.subject_name} / {note.topic_name}</p><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">{contentPreview(note.content)}</p><p className="mt-2 text-xs text-slate-500">Updated {formatDate(note.updated_at)}</p><div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => openEdit(note)} className="min-h-11 rounded-md border border-pb-khaki px-3 text-sm font-bold text-pb-green">Edit</button><button type="button" disabled={updatingStatusId === note.id} onClick={() => { setStatusError(""); setConfirmNote(note); }} className="min-h-11 rounded-md border border-pb-border px-3 text-sm font-bold text-pb-green disabled:opacity-50">{note.is_active ? "Deactivate" : "Activate"}</button><button type="button" disabled={deleteBusy} onClick={() => { setDeleteError(""); setDeleteCandidate(note); }} className="min-h-11 rounded-md border border-red-200 px-3 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-50">Delete / Remove</button></div></article>)}</div></div><div className="hidden max-w-full overflow-x-auto xl:block"><div className="max-w-full overflow-x-auto"><table className="w-full min-w-[1050px] border-collapse text-left text-sm"><thead className="bg-pb-light text-xs uppercase tracking-wide text-pb-green"><tr>{["#", "Title", "Subject", "Topic", "Content Preview", "Status", "Updated Date", "Actions"].map((heading) => <th key={heading} scope="col" className="whitespace-nowrap px-4 py-3 font-bold">{heading}</th>)}</tr></thead><tbody className="divide-y divide-pb-border-soft">{notes.map((note, index) => <tr key={note.id} className="align-top hover:bg-pb-light/60"><td className="px-4 py-3 text-slate-500">{(pagination.page - 1) * pagination.per_page + index + 1}</td><td className="max-w-56 px-4 py-3 font-bold text-pb-green">{note.title}</td><td className="whitespace-nowrap px-4 py-3 text-slate-700">{note.subject_name}</td><td className="whitespace-nowrap px-4 py-3 text-slate-700">{note.topic_name}</td><td className="max-w-sm px-4 py-3 text-slate-600"><p className="whitespace-pre-wrap">{contentPreview(note.content)}</p></td><td className="px-4 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${note.is_active ? "bg-[#e8eee3] text-pb-green" : "bg-[#f2ecda] text-pb-khaki"}`}>{note.is_active ? "Active" : "Inactive"}</span></td><td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(note.updated_at)}</td><td className="px-4 py-3"><div className="flex items-center gap-2"><button type="button" onClick={() => openEdit(note)} className="rounded-md border border-pb-khaki px-3 py-1.5 text-xs font-bold text-pb-green transition hover:bg-pb-light">Edit</button><button type="button" disabled={updatingStatusId === note.id} onClick={() => { setStatusError(""); setConfirmNote(note); }} className="rounded-md border border-pb-border px-3 py-1.5 text-xs font-bold text-pb-green transition hover:bg-[#e8eee3] disabled:cursor-not-allowed disabled:opacity-50">{updatingStatusId === note.id ? "Updating..." : note.is_active ? "Deactivate" : "Activate"}</button><button type="button" disabled={deleteBusy} onClick={() => { setDeleteError(""); setDeleteCandidate(note); }} className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-50">Delete / Remove</button></div></td></tr>)}</tbody></table></div></div></>}
        {!loading && !listError && pagination.pages > 0 && <div className="flex flex-col gap-3 border-t border-pb-border-soft px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"><p className="text-sm font-semibold text-slate-600">Page {pagination.page} of {pagination.pages}</p><div className="flex items-center gap-2"><button type="button" disabled={pagination.page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-md border border-pb-border px-4 py-2 text-sm font-bold text-pb-green hover:bg-pb-light disabled:cursor-not-allowed disabled:opacity-40">Previous</button><button type="button" disabled={pagination.page >= pagination.pages} onClick={() => setPage((value) => Math.min(pagination.pages, value + 1))} className="rounded-md border border-pb-border px-4 py-2 text-sm font-bold text-pb-green hover:bg-pb-light disabled:cursor-not-allowed disabled:opacity-40">Next</button></div></div>}
      </section>

      {formMode && <NoteModal mode={formMode} form={form} subjects={subjects} topics={modalTopics} subjectsLoading={subjectsLoading} topicsLoading={formTopicsLoading} topicsError={formTopicsError} formError={formError} saving={saving} createdPendingStatus={createdPendingStatus} onChange={handleFormChange} onRetryTopics={() => setFormTopicReload((value) => value + 1)} onClose={closeForm} onSubmit={handleSubmit} />}
      {confirmNote && !formMode && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="presentation"><section role="dialog" aria-modal="true" aria-labelledby="note-status-title" className="w-full max-w-md rounded-xl border border-pb-border bg-white p-6 shadow-xl"><h2 id="note-status-title" className="text-lg font-extrabold text-pb-green">Confirm status change</h2><p className="mt-3 text-sm leading-6 text-slate-700">Are you sure you want to {confirmNote.is_active ? "deactivate" : "activate"} {confirmNote.title}?</p>{statusError && <p role="alert" className="mt-3 text-sm font-semibold text-red-700">{statusError}</p>}<div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" disabled={updatingStatusId !== null} onClick={() => setConfirmNote(null)} className="rounded-lg border border-pb-border px-4 py-2 text-sm font-bold text-pb-green hover:bg-pb-light disabled:opacity-60">Cancel</button><button type="button" disabled={updatingStatusId !== null} onClick={handleStatusChange} className="rounded-lg bg-pb-green px-4 py-2 text-sm font-bold text-white hover:bg-pb-khaki disabled:cursor-not-allowed disabled:opacity-60">{updatingStatusId !== null ? "Updating..." : "Confirm"}</button></div></section></div>}
      {deleteCandidate && <AdminConfirmDialog title="Delete note?" message={`Permanently delete “${deleteCandidate.title}”?`} detail="This removes the note content from the study library." busy={deleteBusy} error={deleteError} onCancel={() => { if (!deleteBusy) setDeleteCandidate(null); }} onConfirm={handleDelete} />}
    </div>
  );
}

export default AdminNotes;
