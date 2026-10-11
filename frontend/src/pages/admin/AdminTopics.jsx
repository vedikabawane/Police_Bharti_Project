import { useEffect, useState } from "react";
import AdminConfirmDialog from "../../components/admin/AdminConfirmDialog";

import { createTopic, deleteTopic, getTopics, updateTopic } from "../../services/admin/adminTopicService";
import { getSubjects } from "../../services/admin/adminSubjectService";

const PER_PAGE = 20;
const emptyForm = { subject_id: "", name: "", description: "", is_active: true };

const formatDate = (value) => {
  if (!value) return "Not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not available"
    : date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

function TopicModal({ mode, form, subjects, formError, saving, onChange, onClose, onSubmit }) {
  const isEditing = mode === "edit";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4" role="presentation">
      <section role="dialog" aria-modal="true" aria-labelledby="topic-form-title" className="my-auto w-full max-w-lg rounded-xl border border-pb-border bg-white p-5 shadow-xl sm:p-6">
        <h2 id="topic-form-title" className="text-xl font-extrabold text-pb-green">{isEditing ? "Edit Topic" : "Add Topic"}</h2>
        <form className="mt-5 space-y-4" onSubmit={onSubmit}>
          <div>
            <label htmlFor="topic-subject" className="mb-1.5 block text-sm font-bold text-pb-green">Subject <span className="text-red-600">*</span></label>
            <select id="topic-subject" name="subject_id" required value={form.subject_id} onChange={onChange} className="w-full rounded-lg border border-pb-border bg-white px-3.5 py-2.5 text-sm text-pb-green outline-none focus:border-pb-khaki focus:ring-2 focus:ring-pb-khaki/20">
              <option value="">Select a subject</option>
              {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="topic-name" className="mb-1.5 block text-sm font-bold text-pb-green">Topic Name <span className="text-red-600">*</span></label>
            <input id="topic-name" name="name" type="text" required minLength={2} maxLength={150} value={form.name} onChange={onChange} className="w-full rounded-lg border border-pb-border bg-white px-3.5 py-2.5 text-sm text-pb-green outline-none focus:border-pb-khaki focus:ring-2 focus:ring-pb-khaki/20" />
          </div>
          <div>
            <label htmlFor="topic-description" className="mb-1.5 block text-sm font-bold text-pb-green">Description</label>
            <textarea id="topic-description" name="description" rows={4} value={form.description} onChange={onChange} className="w-full resize-y rounded-lg border border-pb-border bg-white px-3.5 py-2.5 text-sm text-pb-green outline-none focus:border-pb-khaki focus:ring-2 focus:ring-pb-khaki/20" />
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold text-pb-green"><input type="checkbox" name="is_active" checked={form.is_active} onChange={onChange} className="h-4 w-4 accent-pb-green" />Active</label>
          {formError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{formError}</p>}
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <button type="button" disabled={saving} onClick={onClose} className="rounded-lg border border-pb-border px-4 py-2.5 text-sm font-bold text-pb-green hover:bg-pb-light disabled:opacity-60">Cancel</button>
            <button type="submit" disabled={saving || subjects.length === 0} className="rounded-lg bg-pb-green px-4 py-2.5 text-sm font-bold text-white transition hover:bg-pb-khaki disabled:cursor-not-allowed disabled:opacity-60">{saving ? "Saving..." : isEditing ? "Save Changes" : "Create Topic"}</button>
          </div>
        </form>
      </section>
    </div>
  );
}

function AdminTopics() {
  const [topics, setTopics] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [subjectsError, setSubjectsError] = useState("");
  const [subjectReload, setSubjectReload] = useState(0);
  const [pagination, setPagination] = useState({ page: 1, per_page: PER_PAGE, total: 0, pages: 0 });
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [reload, setReload] = useState(0);
  const [formMode, setFormMode] = useState(null);
  const [formTopic, setFormTopic] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmTopic, setConfirmTopic] = useState(null);
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
    getSubjects({ page: 1, per_page: 100 }).then((response) => {
      const records = response?.data?.subjects;
      if (!response?.success || !Array.isArray(records)) throw new Error("Subjects response is incomplete.");
      if (current) setSubjects(records);
    }).catch(() => {
      if (current) setSubjectsError("Unable to load subjects. Please try again.");
    });
    return () => { current = false; };
  }, [subjectReload]);

  useEffect(() => {
    let current = true;
    const loadTopics = async () => {
      setLoading(true);
      setListError("");
      try {
        const params = { page, per_page: PER_PAGE, search: debouncedSearch };
        if (subjectFilter) params.subject_id = subjectFilter;
        if (statusFilter !== "") params.is_active = statusFilter;
        const response = await getTopics(params);
        const data = response?.data;
        if (!response?.success || !Array.isArray(data?.topics) || !data?.pagination) {
          throw new Error(response?.message || "Topics response is incomplete.");
        }
        if (current) {
          setTopics(data.topics);
          setPagination(data.pagination);
        }
      } catch (error) {
        if (current) setListError(error.response?.data?.message || error.message || "Unable to load topics. Please try again.");
      } finally {
        if (current) setLoading(false);
      }
    };
    loadTopics();
    return () => { current = false; };
  }, [page, debouncedSearch, subjectFilter, statusFilter, reload]);

  const openCreate = () => {
    setForm({ ...emptyForm, subject_id: subjectFilter });
    setFormTopic(null);
    setFormError("");
    setFormMode("create");
  };

  const openEdit = (topic) => {
    setForm({ subject_id: String(topic.subject_id), name: topic.name || "", description: topic.description || "", is_active: Boolean(topic.is_active) });
    setFormTopic(topic);
    setFormError("");
    setFormMode("edit");
  };

  const closeForm = () => {
    if (saving) return;
    setFormMode(null);
    setFormTopic(null);
    setFormError("");
  };

  const handleChange = (event) => {
    const { name, value, checked, type } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const name = form.name.trim();
    if (name.length < 2) return setFormError("Topic name must be at least 2 characters.");
    if (!form.subject_id) return setFormError("Please select a subject.");
    setSaving(true);
    setFormError("");
    setFeedback("");
    const payload = { name, description: form.description.trim(), is_active: form.is_active };
    try {
      if (formMode === "create") {
        await createTopic(form.subject_id, payload);
        setFeedback("Topic created successfully.");
        setPage(1);
      } else {
        await updateTopic(formTopic.id, { ...payload, subject_id: Number(form.subject_id) });
        setFeedback("Topic updated successfully.");
      }
      setFormMode(null);
      setFormTopic(null);
      setForm(emptyForm);
      setReload((value) => value + 1);
    } catch (error) {
      setFormError(error.response?.data?.message || "Unable to save the topic. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async () => {
    if (!confirmTopic || updatingStatusId !== null) return;
    setUpdatingStatusId(confirmTopic.id);
    setStatusError("");
    setFeedback("");
    try {
      await updateTopic(confirmTopic.id, { is_active: !confirmTopic.is_active });
      setFeedback(`Topic ${confirmTopic.is_active ? "deactivated" : "activated"} successfully.`);
      setConfirmTopic(null);
      setReload((value) => value + 1);
    } catch (error) {
      setStatusError(error.response?.data?.message || "Unable to update topic status. Please try again.");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteCandidate || deleteBusy) return;
    setDeleteBusy(true);
    setDeleteError("");
    try {
      const response = await deleteTopic(deleteCandidate.id);
      setFeedback(response?.data?.archived
        ? "प्रकरणात जोडलेला content असल्यामुळे ते deactivate केले आहे."
        : "प्रकरण हटवले आहे.");
      setDeleteCandidate(null);
      setPage(1);
      setReload((value) => value + 1);
    } catch (error) {
      setDeleteError(error.response?.data?.message || "प्रकरण हटवता आले नाही. पुन्हा प्रयत्न करा.");
    } finally {
      setDeleteBusy(false);
    }
  };

  const firstResult = pagination.total ? (pagination.page - 1) * pagination.per_page + 1 : 0;
  const lastResult = Math.min(pagination.page * pagination.per_page, pagination.total);
  const hasFilters = Boolean(search || subjectFilter || statusFilter);

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-7 flex flex-col gap-4 border-b border-pb-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-pb-khaki">Content Management</p><h1 className="mt-2 text-2xl font-extrabold text-pb-green sm:text-3xl">Topic Management</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Create and manage topics used across student study content.</p></div>
        <button type="button" onClick={openCreate} disabled={!subjects.length} className="inline-flex shrink-0 items-center justify-center rounded-lg bg-pb-green px-4 py-2.5 text-sm font-bold text-white transition hover:bg-pb-khaki disabled:cursor-not-allowed disabled:opacity-50">Add Topic</button>
      </div>
      {feedback && <p role="status" className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">{feedback}</p>}

      <section className="rounded-lg border border-pb-border bg-white p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_13rem_13rem_auto] lg:items-end">
          <div className="min-w-0"><label htmlFor="topic-search" className="mb-2 block text-sm font-bold text-pb-green">Search topics</label><input id="topic-search" type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search by name or description" className="w-full rounded-lg border border-pb-border bg-pb-light px-4 py-3 text-sm text-pb-green outline-none transition focus:border-pb-khaki focus:ring-2 focus:ring-pb-khaki/20" /></div>
          <div><label htmlFor="topic-subject-filter" className="mb-2 block text-sm font-bold text-pb-green">Subject</label><select id="topic-subject-filter" value={subjectFilter} onChange={(event) => { setSubjectFilter(event.target.value); setPage(1); }} className="w-full rounded-lg border border-pb-border bg-white px-3.5 py-3 text-sm text-pb-green outline-none focus:border-pb-khaki focus:ring-2 focus:ring-pb-khaki/20"><option value="">All Subjects</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select></div>
          <div><label htmlFor="topic-status-filter" className="mb-2 block text-sm font-bold text-pb-green">Status</label><select id="topic-status-filter" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }} className="w-full rounded-lg border border-pb-border bg-white px-3.5 py-3 text-sm text-pb-green outline-none focus:border-pb-khaki focus:ring-2 focus:ring-pb-khaki/20"><option value="">All</option><option value="true">Active</option><option value="false">Inactive</option></select></div>
          <button type="button" onClick={() => { setSearch(""); setDebouncedSearch(""); setSubjectFilter(""); setStatusFilter(""); setPage(1); }} disabled={!hasFilters} className="rounded-lg border border-pb-border px-4 py-3 text-sm font-bold text-pb-green hover:bg-pb-light disabled:cursor-not-allowed disabled:opacity-50">Reset</button>
        </div>
      </section>

      <section className="mt-6 min-w-0 overflow-hidden rounded-lg border border-pb-border bg-white">
        <div className="flex flex-col gap-1 border-b border-pb-border-soft px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"><h2 className="font-extrabold text-pb-green">Topics</h2>{!loading && !listError && <p className="text-xs font-semibold text-slate-500">Showing {firstResult}–{lastResult} of {pagination.total} topics</p>}</div>
        {loading ? <div role="status" className="px-5 py-12 text-center"><span className="mx-auto block h-8 w-8 animate-spin rounded-full border-4 border-pb-border border-t-pb-khaki" /><p className="mt-3 text-sm font-semibold text-pb-green">Loading topics...</p></div>
          : listError ? <div role="alert" className="px-5 py-10 text-center"><p className="text-sm font-semibold text-red-700">{listError}</p><button type="button" onClick={() => setReload((value) => value + 1)} className="mt-4 rounded-lg bg-pb-green px-4 py-2 text-sm font-bold text-white hover:bg-pb-khaki">Retry</button></div>
            : topics.length === 0 ? <div className="px-5 py-12 text-center"><p className="font-bold text-pb-green">No topics found.</p>{hasFilters && <p className="mt-1 text-sm text-slate-500">No topics match your search or filters. Try changing or resetting them.</p>}</div>
              : <><div className="space-y-3"><div className="grid gap-3 xl:hidden">{topics.map((topic) => <article key={topic.id} className="rounded-xl border border-pb-border-soft bg-white p-4"><div className="flex items-start justify-between gap-3"><h3 className="break-words font-bold text-pb-green">{topic.name}</h3><span className="shrink-0 rounded-full bg-pb-light px-2 py-1 text-xs font-bold">{topic.is_active ? "Active" : "Inactive"}</span></div><p className="mt-2 break-words text-sm text-pb-khaki">{topic.subject_name}</p><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">{topic.description || "Not available"}</p><p className="mt-2 text-xs text-slate-500">Updated {formatDate(topic.updated_at)}</p><div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => openEdit(topic)} className="min-h-11 rounded-md border border-pb-khaki px-3 text-sm font-bold">Edit</button><button type="button" disabled={updatingStatusId === topic.id} onClick={() => { setStatusError(""); setConfirmTopic(topic); }} className="min-h-11 rounded-md border border-pb-border px-3 text-sm font-bold disabled:opacity-50">{topic.is_active ? "Deactivate" : "Activate"}</button><button type="button" disabled={deleteBusy} onClick={() => { setDeleteError(""); setDeleteCandidate(topic); }} className="min-h-11 rounded-md border border-red-200 px-3 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-50">Delete / Remove</button></div></article>)}</div></div><div className="hidden max-w-full overflow-x-auto xl:block"><div className="max-w-full overflow-x-auto"><table className="w-full min-w-[1120px] border-collapse text-left text-sm"><thead className="bg-pb-light text-xs uppercase tracking-wide text-pb-green"><tr>{["#", "Topic Name", "Subject", "Description", "Status", "Created Date", "Updated Date", "Actions"].map((heading) => <th key={heading} scope="col" className="whitespace-nowrap px-4 py-3 font-bold">{heading}</th>)}</tr></thead><tbody className="divide-y divide-pb-border-soft">{topics.map((topic, index) => <tr key={topic.id} className="hover:bg-pb-light/60"><td className="px-4 py-3 text-slate-500">{(pagination.page - 1) * pagination.per_page + index + 1}</td><td className="max-w-64 px-4 py-3 font-bold text-pb-green">{topic.name}</td><td className="whitespace-nowrap px-4 py-3 text-slate-700">{topic.subject_name}</td><td className="max-w-sm px-4 py-3 text-slate-600">{topic.description || "Not available"}</td><td className="px-4 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${topic.is_active ? "bg-[#e8eee3] text-pb-green" : "bg-[#f2ecda] text-pb-khaki"}`}>{topic.is_active ? "Active" : "Inactive"}</span></td><td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(topic.created_at)}</td><td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(topic.updated_at)}</td><td className="px-4 py-3"><div className="flex items-center gap-2"><button type="button" onClick={() => openEdit(topic)} className="rounded-md border border-pb-khaki px-3 py-1.5 text-xs font-bold text-pb-green transition hover:bg-pb-light">Edit</button><button type="button" disabled={updatingStatusId === topic.id} onClick={() => { setStatusError(""); setConfirmTopic(topic); }} className="rounded-md border border-pb-border px-3 py-1.5 text-xs font-bold text-pb-green transition hover:bg-[#e8eee3] disabled:cursor-not-allowed disabled:opacity-50">{updatingStatusId === topic.id ? "Updating..." : topic.is_active ? "Deactivate" : "Activate"}</button><button type="button" disabled={deleteBusy} onClick={() => { setDeleteError(""); setDeleteCandidate(topic); }} className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50">Delete / Remove</button></div></td></tr>)}</tbody></table></div></div></>}
        {!loading && !listError && pagination.pages > 0 && <div className="flex flex-col gap-3 border-t border-pb-border-soft px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"><p className="text-sm font-semibold text-slate-600">Page {pagination.page} of {pagination.pages}</p><div className="flex items-center gap-2"><button type="button" disabled={pagination.page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-md border border-pb-border px-4 py-2 text-sm font-bold text-pb-green hover:bg-pb-light disabled:cursor-not-allowed disabled:opacity-40">Previous</button><button type="button" disabled={pagination.page >= pagination.pages} onClick={() => setPage((value) => Math.min(pagination.pages, value + 1))} className="rounded-md border border-pb-border px-4 py-2 text-sm font-bold text-pb-green hover:bg-pb-light disabled:cursor-not-allowed disabled:opacity-40">Next</button></div></div>}
      </section>

      {subjectsError && <p role="alert" className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{subjectsError} <button type="button" onClick={() => { setSubjectsError(""); setSubjectReload((value) => value + 1); }} className="ml-2 underline">Retry</button></p>}

      {formMode && <TopicModal mode={formMode} form={form} subjects={subjects} formError={formError} saving={saving} onChange={handleChange} onClose={closeForm} onSubmit={handleSubmit} />}
      {confirmTopic && !formMode && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="presentation"><section role="dialog" aria-modal="true" aria-labelledby="topic-status-title" className="w-full max-w-md rounded-xl border border-pb-border bg-white p-6 shadow-xl"><h2 id="topic-status-title" className="text-lg font-extrabold text-pb-green">Confirm status change</h2><p className="mt-3 text-sm leading-6 text-slate-700">Are you sure you want to {confirmTopic.is_active ? "deactivate" : "activate"} {confirmTopic.name}?</p>{statusError && <p role="alert" className="mt-3 text-sm font-semibold text-red-700">{statusError}</p>}<div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" disabled={updatingStatusId !== null} onClick={() => setConfirmTopic(null)} className="rounded-lg border border-pb-border px-4 py-2 text-sm font-bold text-pb-green hover:bg-pb-light disabled:opacity-60">Cancel</button><button type="button" disabled={updatingStatusId !== null} onClick={handleStatusChange} className="rounded-lg bg-pb-green px-4 py-2 text-sm font-bold text-white hover:bg-pb-khaki disabled:cursor-not-allowed disabled:opacity-60">{updatingStatusId !== null ? "Updating..." : "Confirm"}</button></div></section></div>}
      {deleteCandidate && !formMode && <AdminConfirmDialog title="प्रकरण हटवायचे आहे का?" message={`“${deleteCandidate.name}” हटवण्याची विनंती करा.`} detail="या प्रकरणाला questions, tests किंवा study content जोडलेले असल्यास इतिहास वाचवण्यासाठी ते कायमचे हटवण्याऐवजी deactivate केले जाईल." busy={deleteBusy} error={deleteError} onCancel={() => setDeleteCandidate(null)} onConfirm={handleDelete} />}
    </div>
  );
}

export default AdminTopics;
