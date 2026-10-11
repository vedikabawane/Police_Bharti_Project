import { useEffect, useState } from "react";
import AdminConfirmDialog from "../../components/admin/AdminConfirmDialog";

import {
  createSubject,
  deleteSubject,
  getSubjects,
  updateSubject,
} from "../../services/admin/adminSubjectService";

const PER_PAGE = 20;

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

function SubjectModal({ mode, form, formError, saving, onChange, onClose, onSubmit }) {
  const isEditing = mode === "edit";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4" role="presentation">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="subject-form-title"
        className="my-auto w-full max-w-lg rounded-xl border border-pb-border bg-white p-5 shadow-xl sm:p-6"
      >
        <h2 id="subject-form-title" className="text-xl font-extrabold text-pb-green">
          {isEditing ? "Edit Subject" : "Create Subject"}
        </h2>
        <form className="mt-5 space-y-4" onSubmit={onSubmit}>
          <div>
            <label htmlFor="subject-name" className="mb-1.5 block text-sm font-bold text-pb-green">
              Name <span className="text-red-600">*</span>
            </label>
            <input
              id="subject-name"
              name="name"
              type="text"
              required
              maxLength={100}
              value={form.name}
              onChange={onChange}
              className="w-full rounded-lg border border-pb-border bg-white px-3.5 py-2.5 text-sm text-pb-green outline-none focus:border-pb-khaki focus:ring-2 focus:ring-pb-khaki/20"
            />
          </div>
          <div>
            <label htmlFor="subject-description" className="mb-1.5 block text-sm font-bold text-pb-green">
              Description
            </label>
            <textarea
              id="subject-description"
              name="description"
              rows={4}
              value={form.description}
              onChange={onChange}
              className="w-full resize-y rounded-lg border border-pb-border bg-white px-3.5 py-2.5 text-sm text-pb-green outline-none focus:border-pb-khaki focus:ring-2 focus:ring-pb-khaki/20"
            />
          </div>
          {isEditing && (
            <label className="flex items-center gap-2 text-sm font-semibold text-pb-green">
              <input
                type="checkbox"
                name="is_active"
                checked={form.is_active}
                onChange={onChange}
                className="h-4 w-4 accent-pb-green"
              />
              Active
            </label>
          )}
          {formError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{formError}</p>}
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="rounded-lg border border-pb-border px-4 py-2.5 text-sm font-bold text-pb-green hover:bg-pb-light disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-pb-green px-4 py-2.5 text-sm font-bold text-white transition hover:bg-pb-khaki disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving…" : isEditing ? "Save Changes" : "Create Subject"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function AdminSubjects() {
  const [subjects, setSubjects] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: PER_PAGE,
    total: 0,
    pages: 0,
  });
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [reload, setReload] = useState(0);
  const [formMode, setFormMode] = useState(null);
  const [formSubject, setFormSubject] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", is_active: true });
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmSubject, setConfirmSubject] = useState(null);
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const [statusError, setStatusError] = useState("");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    let isCurrent = true;

    const loadSubjects = async () => {
      setLoading(true);
      setListError("");
      try {
        const params = {
          page,
          per_page: PER_PAGE,
          search: debouncedSearch,
        };
        if (statusFilter !== "") params.is_active = statusFilter;

        const response = await getSubjects(params);
        const data = response?.data;
        if (
          !response?.success
          || !Array.isArray(data?.subjects)
          || !data?.pagination
        ) {
          throw new Error("Subjects response is incomplete.");
        }
        if (isCurrent) {
          setSubjects(data.subjects);
          setPagination(data.pagination);
        }
      } catch {
        if (isCurrent) setListError("Unable to load subjects. Please try again.");
      } finally {
        if (isCurrent) setLoading(false);
      }
    };

    loadSubjects();
    return () => {
      isCurrent = false;
    };
  }, [page, debouncedSearch, statusFilter, reload]);

  const openCreate = () => {
    setForm({ name: "", description: "", is_active: true });
    setFormSubject(null);
    setFormError("");
    setFormMode("create");
  };

  const openEdit = (subject) => {
    setForm({
      name: subject.name || "",
      description: subject.description || "",
      is_active: Boolean(subject.is_active),
    });
    setFormSubject(subject);
    setFormError("");
    setStatusError("");
    setFormMode("edit");
  };

  const closeForm = () => {
    if (saving) return;
    setFormMode(null);
    setFormSubject(null);
    setFormError("");
  };

  const handleFormChange = (event) => {
    const { name, value, checked, type } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    const name = form.name.trim();
    if (!name) {
      setFormError("Subject name is required.");
      return;
    }
    if (name.length < 2) {
      setFormError("Subject name must be at least 2 characters.");
      return;
    }

    setSaving(true);
    setFormError("");
    setFeedback("");
    const payload = {
      name,
      description: form.description.trim(),
    };
    try {
      if (formMode === "create") {
        await createSubject(payload);
        setFeedback("Subject created successfully.");
        setPage(1);
      } else {
        payload.is_active = form.is_active;
        await updateSubject(formSubject.id, payload);
        setFeedback("Subject updated successfully.");
      }
      setFormMode(null);
      setFormSubject(null);
      setReload((current) => current + 1);
    } catch (requestError) {
      const message = requestError.response?.data?.message;
      setFormError(message || "Unable to save the subject. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async () => {
    if (!confirmSubject || updatingStatusId !== null) return;
    setUpdatingStatusId(confirmSubject.id);
    setStatusError("");
    setFeedback("");
    try {
      await updateSubject(confirmSubject.id, {
        is_active: !confirmSubject.is_active,
      });
      setFeedback(`Subject ${confirmSubject.is_active ? "deactivated" : "activated"} successfully.`);
      setConfirmSubject(null);
      setReload((current) => current + 1);
    } catch (requestError) {
      const message = requestError.response?.data?.message;
      setStatusError(message || "Unable to update subject status. Please try again.");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteCandidate || deleteBusy) return;
    setDeleteBusy(true);
    setDeleteError("");
    try {
      const response = await deleteSubject(deleteCandidate.id);
      const archived = Boolean(response?.data?.archived);
      setFeedback(archived
        ? "विषयात अवलंबित content असल्यामुळे तो deactivate केला आहे."
        : "विषय हटवला आहे.");
      setDeleteCandidate(null);
      setPage(1);
      setReload((current) => current + 1);
    } catch (error) {
      setDeleteError(error.response?.data?.message || "विषय हटवता आला नाही. पुन्हा प्रयत्न करा.");
    } finally {
      setDeleteBusy(false);
    }
  };

  const firstResult = pagination.total === 0
    ? 0
    : (pagination.page - 1) * pagination.per_page + 1;
  const lastResult = Math.min(
    pagination.page * pagination.per_page,
    pagination.total,
  );

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-7 flex flex-col gap-4 border-b border-pb-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-pb-khaki">Content Management</p>
          <h1 className="mt-2 text-2xl font-extrabold text-pb-green sm:text-3xl">Subject Management</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Create and manage the subjects used across student study content.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex shrink-0 items-center justify-center rounded-lg bg-pb-green px-4 py-2.5 text-sm font-bold text-white transition hover:bg-pb-khaki"
        >
          Create Subject
        </button>
      </div>

      {feedback && <p role="status" className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">{feedback}</p>}

      <section className="rounded-lg border border-pb-border bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="min-w-0 flex-1">
            <label htmlFor="subject-search" className="mb-2 block text-sm font-bold text-pb-green">Search subjects</label>
            <input
              id="subject-search"
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search by name or description"
              className="w-full rounded-lg border border-pb-border bg-pb-light px-4 py-3 text-sm text-pb-green outline-none transition focus:border-pb-khaki focus:ring-2 focus:ring-pb-khaki/20"
            />
          </div>
          <div className="w-full lg:w-52">
            <label htmlFor="subject-status-filter" className="mb-2 block text-sm font-bold text-pb-green">Status</label>
            <select
              id="subject-status-filter"
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-pb-border bg-white px-3.5 py-3 text-sm text-pb-green outline-none focus:border-pb-khaki focus:ring-2 focus:ring-pb-khaki/20"
            >
              <option value="">All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setDebouncedSearch("");
              setStatusFilter("");
              setPage(1);
            }}
            disabled={!search && !statusFilter}
            className="rounded-lg border border-pb-border px-4 py-3 text-sm font-bold text-pb-green hover:bg-pb-light disabled:cursor-not-allowed disabled:opacity-50"
          >
            Reset
          </button>
        </div>
      </section>

      <section className="mt-6 min-w-0 overflow-hidden rounded-lg border border-pb-border bg-white">
        <div className="flex flex-col gap-1 border-b border-pb-border-soft px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <h2 className="font-extrabold text-pb-green">Subjects</h2>
          {!loading && !listError && (
            <p className="text-xs font-semibold text-slate-500">
              Showing {firstResult}–{lastResult} of {pagination.total} subjects
            </p>
          )}
        </div>

        {loading ? (
          <div role="status" className="px-5 py-12 text-center">
            <span className="mx-auto block h-8 w-8 animate-spin rounded-full border-4 border-pb-border border-t-pb-khaki" />
            <p className="mt-3 text-sm font-semibold text-pb-green">Loading subjects...</p>
          </div>
        ) : listError ? (
          <div role="alert" className="px-5 py-10 text-center">
            <p className="text-sm font-semibold text-red-700">{listError}</p>
            <button
              type="button"
              onClick={() => setReload((current) => current + 1)}
              className="mt-4 rounded-lg bg-pb-green px-4 py-2 text-sm font-bold text-white hover:bg-pb-khaki"
            >
              Retry
            </button>
          </div>
        ) : subjects.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="font-bold text-pb-green">No subjects found.</p>
            {(debouncedSearch || statusFilter) && (
              <p className="mt-1 text-sm text-slate-500">Try changing or resetting your search and status filters.</p>
            )}
          </div>
        ) : (
          <div className="space-y-3"><div className="grid gap-3 xl:hidden">{subjects.map((subject) => <article key={subject.id} className="rounded-xl border border-pb-border-soft bg-white p-4"><div className="flex items-start justify-between gap-3"><h3 className="break-words font-bold text-pb-green">{subject.name}</h3><span className="shrink-0 rounded-full bg-pb-light px-2 py-1 text-xs font-bold">{subject.is_active ? "Active" : "Inactive"}</span></div><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">{subject.description || "Not available"}</p><p className="mt-2 text-xs text-slate-500">Updated {formatDate(subject.updated_at)}</p><div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => openEdit(subject)} className="min-h-11 rounded-md border border-pb-khaki px-3 text-sm font-bold">Edit</button><button type="button" disabled={updatingStatusId === subject.id} onClick={() => { setStatusError(""); setConfirmSubject(subject); }} className="min-h-11 rounded-md border border-pb-border px-3 text-sm font-bold disabled:opacity-50">{subject.is_active ? "Deactivate" : "Activate"}</button><button type="button" disabled={deleteBusy} onClick={() => { setDeleteError(""); setDeleteCandidate(subject); }} className="min-h-11 rounded-md border border-red-200 px-3 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-50">Delete / Remove</button></div></article>)}</div><div className="hidden max-w-full overflow-x-auto xl:block"><table className="w-full min-w-[980px] border-collapse text-left text-sm">
              <thead className="bg-pb-light text-xs uppercase tracking-wide text-pb-green">
                <tr>
                  {["#", "Subject Name", "Description", "Status", "Created Date", "Updated Date", "Actions"].map((heading) => (
                    <th key={heading} scope="col" className="whitespace-nowrap px-4 py-3 font-bold">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-pb-border-soft">
                {subjects.map((subject, index) => (
                  <tr key={subject.id} className="hover:bg-pb-light/60">
                    <td className="px-4 py-3 text-slate-500">{(pagination.page - 1) * pagination.per_page + index + 1}</td>
                    <td className="max-w-64 px-4 py-3 font-bold text-pb-green">{subject.name}</td>
                    <td className="max-w-sm px-4 py-3 text-slate-600">{subject.description || "Not available"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${subject.is_active ? "bg-[#e8eee3] text-pb-green" : "bg-[#f2ecda] text-pb-khaki"}`}>
                        {subject.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(subject.created_at)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(subject.updated_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(subject)}
                          className="rounded-md border border-pb-khaki px-3 py-1.5 text-xs font-bold text-pb-green transition hover:bg-pb-light"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={updatingStatusId === subject.id}
                          onClick={() => {
                            setStatusError("");
                            setConfirmSubject(subject);
                          }}
                          className="rounded-md border border-pb-border px-3 py-1.5 text-xs font-bold text-pb-green transition hover:bg-[#e8eee3] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {updatingStatusId === subject.id
                            ? "Updating..."
                            : subject.is_active ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          type="button"
                          disabled={deleteBusy}
                          onClick={() => { setDeleteError(""); setDeleteCandidate(subject); }}
                          className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Delete / Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div></div>
        )}

        {!loading && !listError && pagination.pages > 0 && (
          <div className="flex flex-col gap-3 border-t border-pb-border-soft px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p className="text-sm font-semibold text-slate-600">
              Page {pagination.page} of {pagination.pages}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="rounded-md border border-pb-border px-4 py-2 text-sm font-bold text-pb-green hover:bg-pb-light disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={pagination.page >= pagination.pages}
                onClick={() => setPage((current) => Math.min(pagination.pages, current + 1))}
                className="rounded-md border border-pb-border px-4 py-2 text-sm font-bold text-pb-green hover:bg-pb-light disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>

      {formMode && (
        <SubjectModal
          mode={formMode}
          form={form}
          formError={formError}
          saving={saving}
          onChange={handleFormChange}
          onClose={closeForm}
          onSubmit={handleFormSubmit}
        />
      )}

      {confirmSubject && !formMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="presentation">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="subject-status-title"
            className="w-full max-w-md rounded-xl border border-pb-border bg-white p-6 shadow-xl"
          >
            <h2 id="subject-status-title" className="text-lg font-extrabold text-pb-green">
              Confirm status change
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              Are you sure you want to {confirmSubject.is_active ? "deactivate" : "activate"} {confirmSubject.name}?
            </p>
            {statusError && <p role="alert" className="mt-3 text-sm font-semibold text-red-700">{statusError}</p>}
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={updatingStatusId !== null}
                onClick={() => setConfirmSubject(null)}
                className="rounded-lg border border-pb-border px-4 py-2 text-sm font-bold text-pb-green hover:bg-pb-light disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={updatingStatusId !== null}
                onClick={handleStatusChange}
                className="rounded-lg bg-pb-green px-4 py-2 text-sm font-bold text-white hover:bg-pb-khaki disabled:cursor-not-allowed disabled:opacity-60"
              >
                {updatingStatusId !== null ? "Updating..." : "Confirm"}
              </button>
            </div>
          </section>
        </div>
      )}
      {deleteCandidate && (
        <AdminConfirmDialog
          title="विषय हटवायचा आहे का?"
          message={`“${deleteCandidate.name}” हटवण्याची विनंती करा.`}
          detail="विषयाला topics, study content किंवा tests जोडलेले असल्यास इतिहास जपण्यासाठी तो कायमचा हटवण्याऐवजी deactivate केला जाईल."
          busy={deleteBusy}
          error={deleteError}
          onCancel={() => setDeleteCandidate(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}

export default AdminSubjects;
