import { useEffect, useMemo, useState } from "react";
import AdminConfirmDialog from "../../components/admin/AdminConfirmDialog";

import { getSubjects } from "../../services/admin/adminSubjectService";
import { getTopics } from "../../services/admin/adminTopicService";
import {
  createQuestion,
  deleteQuestion,
  getQuestions,
  updateQuestion,
  updateQuestionStatus,
} from "../../services/admin/adminQuestionService";

const PER_PAGE = 20;
const OPTION_LABELS = ["A", "B", "C", "D"];
const EMPTY_FORM = {
  subject_id: "",
  topic_id: "",
  question_text: "",
  options: { A: "", B: "", C: "", D: "" },
  correct_option: "A",
  explanation: "",
  difficulty: "easy",
  marks: "1",
  exam_name: "",
  exam_year: "",
  is_pyq: false,
  is_active: true,
};

const errorMessage = (error, fallback) =>
  error.response?.data?.message || error.message || fallback;

async function getAllPages(fetchPage, recordsKey, filters = {}) {
  const first = await fetchPage({ ...filters, page: 1, per_page: 100 });
  const records = first?.data?.[recordsKey];
  const pages = first?.data?.pagination?.pages;
  if (!first?.success || !Array.isArray(records) || !Number.isInteger(pages)) {
    throw new Error(first?.message || "The list response was incomplete.");
  }
  if (pages < 2) return records;

  const rest = await Promise.all(
    Array.from({ length: pages - 1 }, (_, index) =>
      fetchPage({ ...filters, page: index + 2, per_page: 100 }),
    ),
  );
  return records.concat(...rest.map((response) => {
    const items = response?.data?.[recordsKey];
    if (!response?.success || !Array.isArray(items)) {
      throw new Error(response?.message || "The list response was incomplete.");
    }
    return items;
  }));
}

function QuestionForm({
  mode,
  form,
  subjects,
  topics,
  topicsLoading,
  topicsError,
  formError,
  saving,
  onChange,
  onClose,
  onSubmit,
  onRetryTopics,
}) {
  const isEditing = mode === "edit";
  const fieldClass = "w-full rounded-lg border border-pb-border bg-white px-3.5 py-2.5 text-sm text-pb-green outline-none focus:border-pb-khaki focus:ring-2 focus:ring-pb-khaki/20";
  const labelClass = "mb-1.5 block text-sm font-bold text-pb-green";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-3 sm:p-5" role="presentation">
      <section role="dialog" aria-modal="true" aria-labelledby="question-form-title" className="my-auto max-h-[95vh] w-full max-w-4xl overflow-y-auto rounded-xl border border-pb-border bg-white p-4 shadow-xl sm:p-6">
        <div className="flex items-start justify-between gap-4 border-b border-pb-border-soft pb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-pb-khaki">Question Bank</p>
            <h2 id="question-form-title" className="mt-1 text-xl font-extrabold text-pb-green">{isEditing ? "Edit Question" : "नवीन प्रश्न"}</h2>
          </div>
          <button type="button" onClick={onClose} disabled={saving} aria-label="Close form" className="rounded-lg px-3 py-1 text-xl font-bold text-slate-500 hover:bg-pb-light disabled:opacity-50">×</button>
        </div>
        <form onSubmit={onSubmit} className="mt-5 space-y-5">
          {!isEditing && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="question-form-subject" className={labelClass}>Subject <span className="text-red-600">*</span></label>
                <select id="question-form-subject" name="subject_id" required value={form.subject_id} onChange={onChange} className={fieldClass}>
                  <option value="">Select subject</option>
                  {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="question-form-topic" className={labelClass}>Topic <span className="text-red-600">*</span></label>
                <select id="question-form-topic" name="topic_id" required value={form.topic_id} onChange={onChange} disabled={!form.subject_id || topicsLoading} className={fieldClass}>
                  <option value="">{topicsLoading ? "Loading topics..." : "Select topic"}</option>
                  {topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}
                </select>
                {topicsError && <p role="alert" className="mt-2 text-xs font-semibold text-red-700">{topicsError} <button type="button" onClick={onRetryTopics} className="underline">Retry</button></p>}
              </div>
            </div>
          )}

          <div>
            <label htmlFor="question-form-text" className={labelClass}>Question <span className="text-red-600">*</span></label>
            <textarea id="question-form-text" name="question_text" required value={form.question_text} onChange={onChange} rows={4} className={`${fieldClass} resize-y`} />
          </div>

          <fieldset>
            <legend className={`${labelClass} mb-2`}>Answer Options <span className="text-red-600">*</span></legend>
            <p className="mb-3 text-xs text-slate-500">Exactly four options are required. Select the radio button beside the correct answer.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {OPTION_LABELS.map((label) => (
                <div key={label} className={`flex min-w-0 items-center gap-3 rounded-lg border p-3 ${form.correct_option === label ? "border-pb-khaki bg-pb-light" : "border-pb-border"}`}>
                  <input type="radio" name="correct_option" value={label} checked={form.correct_option === label} onChange={onChange} aria-label={`Mark option ${label} correct`} className="h-4 w-4 shrink-0 accent-pb-green" />
                  <label htmlFor={`question-option-${label}`} className="shrink-0 text-sm font-extrabold text-pb-green">{label}</label>
                  <input id={`question-option-${label}`} name={`option_${label}`} required value={form.options[label]} onChange={onChange} aria-label={`Option ${label}`} className={fieldClass} />
                  {form.correct_option === label && <span className="sr-only">Correct answer</span>}
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs font-semibold text-pb-green">Correct answer: Option {form.correct_option}</p>
          </fieldset>

          <div>
            <label htmlFor="question-form-explanation" className={labelClass}>Explanation</label>
            <textarea id="question-form-explanation" name="explanation" value={form.explanation} onChange={onChange} rows={3} className={`${fieldClass} resize-y`} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div><label htmlFor="question-form-difficulty" className={labelClass}>Difficulty <span className="text-red-600">*</span></label><select id="question-form-difficulty" name="difficulty" required value={form.difficulty} onChange={onChange} className={fieldClass}><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></div>
            <div><label htmlFor="question-form-marks" className={labelClass}>Marks</label><input id="question-form-marks" name="marks" type="number" step="0.01" value={form.marks} onChange={onChange} className={fieldClass} /></div>
            <div><label htmlFor="question-form-exam" className={labelClass}>Exam Name</label><input id="question-form-exam" name="exam_name" maxLength={200} value={form.exam_name} onChange={onChange} className={fieldClass} /></div>
            <div><label htmlFor="question-form-year" className={labelClass}>Exam Year</label><input id="question-form-year" name="exam_year" type="number" min="2000" max="2100" step="1" value={form.exam_year} onChange={onChange} className={fieldClass} /></div>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-3 rounded-lg bg-pb-light p-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-pb-green"><input type="checkbox" name="is_pyq" checked={form.is_pyq} onChange={onChange} className="h-4 w-4 accent-pb-green" />Previous Year Question (PYQ)</label>
            <label className="flex items-center gap-2 text-sm font-semibold text-pb-green"><input type="checkbox" name="is_active" checked={form.is_active} onChange={onChange} className="h-4 w-4 accent-pb-green" />Active</label>
          </div>

          {formError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{formError}</p>}
          <div className="flex flex-col-reverse gap-2 border-t border-pb-border-soft pt-4 sm:flex-row sm:justify-end">
            <button type="button" disabled={saving} onClick={onClose} className="rounded-lg border border-pb-border px-4 py-2.5 text-sm font-bold text-pb-green hover:bg-pb-light disabled:opacity-50">Cancel</button>
            <button type="submit" disabled={saving || (!isEditing && (!subjects.length || !topics.length))} className="rounded-lg bg-pb-green px-4 py-2.5 text-sm font-bold text-white hover:bg-pb-khaki disabled:cursor-not-allowed disabled:opacity-60">{saving ? "Saving..." : isEditing ? "Save Changes" : "प्रश्न तयार करा"}</button>
          </div>
        </form>
      </section>
    </div>
  );
}

function AdminQuestions() {
  const [questions, setQuestions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [filterTopics, setFilterTopics] = useState([]);
  const [formTopics, setFormTopics] = useState([]);
  const [subjectsError, setSubjectsError] = useState("");
  const [topicsError, setTopicsError] = useState("");
  const [filterTopicsError, setFilterTopicsError] = useState("");
  const [filterTopicsReload, setFilterTopicsReload] = useState(0);
  const [formTopicsLoading, setFormTopicsLoading] = useState(false);
  const [formTopicsReload, setFormTopicsReload] = useState(0);
  const [pagination, setPagination] = useState({ page: 1, per_page: PER_PAGE, total: 0, pages: 0 });
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [topicFilter, setTopicFilter] = useState("");
  const [examNameFilter, setExamNameFilter] = useState("");
  const [examYearFilter, setExamYearFilter] = useState("");
  const [pyqFilter, setPyqFilter] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [reload, setReload] = useState(0);
  const [formMode, setFormMode] = useState(null);
  const [formQuestion, setFormQuestion] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmQuestion, setConfirmQuestion] = useState(null);
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
    getAllPages(getSubjects, "subjects").then((records) => {
      if (current) {
        setSubjects(records);
        setSubjectsError("");
      }
    }).catch((error) => {
      if (current) setSubjectsError(errorMessage(error, "Unable to load subjects."));
    });
    return () => { current = false; };
  }, []);

  useEffect(() => {
    let current = true;
    const filters = subjectFilter ? { subject_id: subjectFilter } : {};
    getAllPages(getTopics, "topics", filters).then((records) => {
      if (current) {
        setFilterTopics(records);
        setFilterTopicsError("");
      }
    }).catch((error) => {
      if (current) setFilterTopicsError(errorMessage(error, "Unable to load topics."));
    });
    return () => { current = false; };
  }, [subjectFilter, filterTopicsReload]);

  useEffect(() => {
    if (formMode !== "create" || !form.subject_id) return undefined;
    let current = true;
    getAllPages(getTopics, "topics", { subject_id: form.subject_id }).then((records) => {
      if (current) setFormTopics(records);
    }).catch((error) => {
      if (current) setTopicsError(errorMessage(error, "Unable to load topics."));
    }).finally(() => {
      if (current) setFormTopicsLoading(false);
    });
    return () => { current = false; };
  }, [formMode, form.subject_id, formTopicsReload]);

  useEffect(() => {
    let current = true;
    const loadQuestions = async () => {
      setLoading(true);
      setListError("");
      const params = { page, per_page: PER_PAGE, search: debouncedSearch };
      if (subjectFilter) params.subject_id = subjectFilter;
      if (topicFilter) params.topic_id = topicFilter;
      if (examNameFilter.trim()) params.exam_name = examNameFilter.trim();
      if (examYearFilter) params.exam_year = examYearFilter;
      if (pyqFilter !== "") params.is_pyq = pyqFilter;
      if (difficultyFilter) params.difficulty = difficultyFilter;
      if (statusFilter !== "") params.is_active = statusFilter;
      try {
        const response = await getQuestions(params);
        const data = response?.data;
        if (!response?.success || !Array.isArray(data?.questions) || !data?.pagination) {
          throw new Error(response?.message || "Question response is incomplete.");
        }
        if (current) {
          setQuestions(data.questions);
          setPagination(data.pagination);
        }
      } catch (error) {
        if (current) setListError(errorMessage(error, "Unable to load questions. Please retry."));
      } finally {
        if (current) setLoading(false);
      }
    };
    loadQuestions();
    return () => { current = false; };
  }, [page, debouncedSearch, subjectFilter, topicFilter, examNameFilter, examYearFilter, pyqFilter, difficultyFilter, statusFilter, reload]);

  const sortedQuestions = useMemo(() => questions, [questions]);
  const firstResult = pagination.total ? (pagination.page - 1) * pagination.per_page + 1 : 0;
  const lastResult = Math.min(pagination.page * pagination.per_page, pagination.total);
  const hasFilters = Boolean(search || subjectFilter || topicFilter || examNameFilter || examYearFilter || pyqFilter || difficultyFilter || statusFilter);

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, subject_id: subjectFilter || "" });
    setFormTopics([]);
    setFormTopicsLoading(Boolean(subjectFilter));
    setTopicsError("");
    setFormQuestion(null);
    setFormError("");
    setFormMode("create");
  };

  const openEdit = (question) => {
    const options = Object.fromEntries(OPTION_LABELS.map((label) => {
      const option = question.options?.find((item) => item.option_label === label);
      return [label, option?.option_text || ""];
    }));
    setForm({
      ...EMPTY_FORM,
      question_text: question.question_text || "",
      options,
      correct_option: question.correct_option || "A",
      explanation: question.explanation || "",
      difficulty: question.difficulty || "easy",
      marks: question.marks ?? "1",
      exam_name: question.exam_name || "",
      exam_year: question.exam_year ?? "",
      is_pyq: Boolean(question.is_pyq),
      is_active: Boolean(question.is_active),
    });
    setFormQuestion(question);
    setFormError("");
    setFormMode("edit");
  };

  const closeForm = () => {
    if (saving) return;
    setFormMode(null);
    setFormQuestion(null);
    setForm(EMPTY_FORM);
    setFormError("");
  };

  const handleChange = (event) => {
    const { name, value, checked, type } = event.target;
    if (name === "subject_id") {
      setFormTopics([]);
      setTopicsError("");
      setFormTopicsLoading(Boolean(value));
    }
    setForm((previous) => {
      if (name === "subject_id") return { ...previous, subject_id: value, topic_id: "" };
      if (name.startsWith("option_")) {
        return { ...previous, options: { ...previous.options, [name.slice(7)]: value } };
      }
      return { ...previous, [name]: type === "checkbox" ? checked : value };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.question_text.trim()) return setFormError("Please enter the question text.");
    if (OPTION_LABELS.some((label) => !form.options[label].trim())) return setFormError("Please fill all four options A, B, C and D.");
    if (!OPTION_LABELS.includes(form.correct_option)) return setFormError("Select the correct option.");
    if (formMode === "create" && (!form.subject_id || !form.topic_id)) return setFormError("Select a subject and topic.");
    if (form.exam_year && (!Number.isInteger(Number(form.exam_year)) || Number(form.exam_year) < 2000 || Number(form.exam_year) > 2100)) {
      return setFormError("Exam year must be between 2000 and 2100.");
    }

    const payload = {
      question_text: form.question_text.trim(),
      options: OPTION_LABELS.map((option_label) => ({ option_label, option_text: form.options[option_label].trim() })),
      correct_option: form.correct_option,
      explanation: form.explanation.trim() || null,
      difficulty: form.difficulty,
      marks: String(form.marks || "1"),
      exam_name: form.exam_name.trim() || null,
      exam_year: form.exam_year ? Number(form.exam_year) : null,
      is_pyq: Boolean(form.is_pyq),
      is_active: Boolean(form.is_active),
    };

    setSaving(true);
    setFormError("");
    setFeedback("");
    try {
      if (formMode === "create") {
        await createQuestion(form.subject_id, form.topic_id, payload);
        setFeedback("प्रश्न यशस्वीरित्या तयार झाला.");
        setPage(1);
      } else {
        await updateQuestion(formQuestion.id, payload);
        setFeedback("प्रश्न यशस्वीरित्या अद्ययावत झाला.");
      }
      setFormMode(null);
      setFormQuestion(null);
      setForm(EMPTY_FORM);
      setReload((value) => value + 1);
    } catch (error) {
      setFormError(errorMessage(error, "Unable to save the question. Please try again."));
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async () => {
    if (!confirmQuestion || updatingStatusId !== null) return;
    setUpdatingStatusId(confirmQuestion.id);
    setStatusError("");
    setFeedback("");
    try {
      await updateQuestionStatus(confirmQuestion.id, !confirmQuestion.is_active);
      setFeedback(confirmQuestion.is_active ? "प्रश्न deactivate झाला." : "प्रश्न पुन्हा active झाला.");
      setConfirmQuestion(null);
      setReload((value) => value + 1);
    } catch (error) {
      setStatusError(errorMessage(error, "Unable to update question status. Please retry."));
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteCandidate || deleteBusy) return;
    setDeleteBusy(true);
    setDeleteError("");
    try {
      const response = await deleteQuestion(deleteCandidate.id);
      setFeedback(response?.data?.archived
        ? "Test history जपण्यासाठी प्रश्न deactivate केला आहे."
        : "प्रश्न कायमचा हटवला आहे.");
      setDeleteCandidate(null);
      setPage(1);
      setReload((value) => value + 1);
    } catch (error) {
      setDeleteError(errorMessage(error, "प्रश्न हटवता आला नाही. पुन्हा प्रयत्न करा."));
    } finally {
      setDeleteBusy(false);
    }
  };

  const resetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setSubjectFilter("");
    setTopicFilter("");
    setExamNameFilter("");
    setExamYearFilter("");
    setPyqFilter("");
    setDifficultyFilter("");
    setStatusFilter("");
    setPage(1);
  };

  const selectClass = "w-full rounded-lg border border-pb-border bg-white px-3 py-2.5 text-sm text-pb-green outline-none focus:border-pb-khaki focus:ring-2 focus:ring-pb-khaki/20";

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-7 flex flex-col gap-4 border-b border-pb-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-pb-khaki">Content Management</p><h1 className="mt-2 text-2xl font-extrabold text-pb-green sm:text-3xl">Question Bank</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">प्रश्न तयार करा, संपादित करा आणि PYQ व्यवस्थापित करा.</p></div>
        <button type="button" onClick={openCreate} disabled={!subjects.length} className="inline-flex shrink-0 items-center justify-center rounded-lg bg-pb-green px-4 py-2.5 text-sm font-bold text-white transition hover:bg-pb-khaki disabled:cursor-not-allowed disabled:opacity-50">नवीन प्रश्न</button>
      </div>
      {feedback && <p role="status" className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">{feedback}</p>}
      {subjectsError && <p role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{subjectsError} <button type="button" onClick={() => { setSubjectsError(""); getAllPages(getSubjects, "subjects").then(setSubjects).catch((error) => setSubjectsError(errorMessage(error, "Unable to load subjects."))); }} className="ml-2 underline">Retry subjects</button></p>}

      <section className="rounded-lg border border-pb-border bg-white p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="min-w-0 lg:col-span-2"><label htmlFor="question-search" className="mb-2 block text-sm font-bold text-pb-green">Search questions</label><input id="question-search" type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="प्रश्न किंवा परीक्षा शोधा..." className={`${selectClass} bg-pb-light px-4 py-3`} /></div>
          <div><label htmlFor="question-subject-filter" className="mb-2 block text-sm font-bold text-pb-green">Subject</label><select id="question-subject-filter" value={subjectFilter} onChange={(event) => { setSubjectFilter(event.target.value); setTopicFilter(""); setFilterTopics([]); setPage(1); }} className={selectClass}><option value="">All Subjects</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select></div>
          <div><label htmlFor="question-topic-filter" className="mb-2 block text-sm font-bold text-pb-green">Topic</label><select id="question-topic-filter" value={topicFilter} onChange={(event) => { setTopicFilter(event.target.value); setPage(1); }} className={selectClass}><option value="">All Topics</option>{filterTopics.map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}</select>{filterTopicsError && <p role="alert" className="mt-1 text-xs text-red-700">{filterTopicsError} <button type="button" onClick={() => setFilterTopicsReload((value) => value + 1)} className="ml-1 underline">Retry</button></p>}</div>
          <div><label htmlFor="question-exam-filter" className="mb-2 block text-sm font-bold text-pb-green">Exam Name</label><input id="question-exam-filter" value={examNameFilter} onChange={(event) => { setExamNameFilter(event.target.value); setPage(1); }} placeholder="Exact exam name" className={selectClass} /></div>
          <div><label htmlFor="question-year-filter" className="mb-2 block text-sm font-bold text-pb-green">Exam Year</label><input id="question-year-filter" type="number" min="2000" max="2100" step="1" value={examYearFilter} onChange={(event) => { setExamYearFilter(event.target.value); setPage(1); }} placeholder="All years" className={selectClass} /></div>
          <div><label htmlFor="question-pyq-filter" className="mb-2 block text-sm font-bold text-pb-green">PYQ / Regular</label><select id="question-pyq-filter" value={pyqFilter} onChange={(event) => { setPyqFilter(event.target.value); setPage(1); }} className={selectClass}><option value="">All</option><option value="true">PYQ</option><option value="false">Regular</option></select></div>
          <div><label htmlFor="question-difficulty-filter" className="mb-2 block text-sm font-bold text-pb-green">Difficulty</label><select id="question-difficulty-filter" value={difficultyFilter} onChange={(event) => { setDifficultyFilter(event.target.value); setPage(1); }} className={selectClass}><option value="">All</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></div>
          <div><label htmlFor="question-status-filter" className="mb-2 block text-sm font-bold text-pb-green">Status</label><select id="question-status-filter" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }} className={selectClass}><option value="">All</option><option value="true">Active</option><option value="false">Inactive</option></select></div>
          <div className="flex items-end"><button type="button" onClick={resetFilters} disabled={!hasFilters} className="w-full rounded-lg border border-pb-border px-4 py-2.5 text-sm font-bold text-pb-green hover:bg-pb-light disabled:cursor-not-allowed disabled:opacity-50">Reset Filters</button></div>
        </div>
      </section>

      <section className="mt-6 min-w-0 overflow-hidden rounded-lg border border-pb-border bg-white">
        <div className="flex flex-col gap-1 border-b border-pb-border-soft px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"><h2 className="font-extrabold text-pb-green">Questions</h2>{!loading && !listError && <p className="text-xs font-semibold text-slate-500">Showing {firstResult}–{lastResult} of {pagination.total} questions</p>}</div>
        {loading ? <div role="status" className="px-5 py-12 text-center"><span className="mx-auto block h-8 w-8 animate-spin rounded-full border-4 border-pb-border border-t-pb-khaki" /><p className="mt-3 text-sm font-semibold text-pb-green">Loading questions...</p></div>
          : listError ? <div role="alert" className="px-5 py-10 text-center"><p className="text-sm font-semibold text-red-700">{listError}</p><button type="button" onClick={() => setReload((value) => value + 1)} className="mt-4 rounded-lg bg-pb-green px-4 py-2 text-sm font-bold text-white hover:bg-pb-khaki">Retry</button></div>
            : sortedQuestions.length === 0 ? <div className="px-5 py-12 text-center"><p className="font-bold text-pb-green">प्रश्न सापडले नाहीत.</p>{hasFilters && <p className="mt-1 text-sm text-slate-500">शोध किंवा फिल्टरशी जुळणारे प्रश्न नाहीत. फिल्टर बदला किंवा रीसेट करा.</p>}</div>
              : <><div className="space-y-3"><div className="grid gap-3 xl:hidden">{sortedQuestions.map((question) => <article key={question.id} className="rounded-xl border border-pb-border-soft bg-white p-4"><p className="break-words font-bold leading-6 text-pb-green">{question.question_text}</p><dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm"><div><dt className="text-xs font-bold text-slate-500">Subject</dt><dd className="break-words">{question.subject?.name || "N/A"}</dd></div><div><dt className="text-xs font-bold text-slate-500">Topic</dt><dd className="break-words">{question.topic?.name || "N/A"}</dd></div><div><dt className="text-xs font-bold text-slate-500">Exam / year</dt><dd className="break-words">{question.exam_name || "N/A"} {question.exam_year || ""}</dd></div><div><dt className="text-xs font-bold text-slate-500">Type / difficulty</dt><dd>{question.is_pyq ? "PYQ" : "Regular"} / {question.difficulty}</dd></div><div><dt className="text-xs font-bold text-slate-500">Marks</dt><dd>{question.marks}</dd></div><div><dt className="text-xs font-bold text-slate-500">Status</dt><dd>{question.is_active ? "Active" : "Inactive"}</dd></div></dl><div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => openEdit(question)} className="min-h-11 rounded-md border border-pb-khaki px-3 text-sm font-bold text-pb-green">View/Edit</button><button type="button" disabled={updatingStatusId === question.id} onClick={() => { setStatusError(""); setConfirmQuestion(question); }} className="min-h-11 rounded-md border border-pb-border px-3 text-sm font-bold text-pb-green disabled:opacity-50">{question.is_active ? "Deactivate" : "Activate"}</button><button type="button" disabled={deleteBusy} onClick={() => { setDeleteError(""); setDeleteCandidate(question); }} className="min-h-11 rounded-md border border-red-200 px-3 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-50">Delete / Remove</button></div></article>)}</div></div><div className="hidden max-w-full overflow-x-auto xl:block"><div className="max-w-full overflow-x-auto"><table className="w-full min-w-[1350px] border-collapse text-left text-sm"><thead className="bg-pb-light text-xs uppercase tracking-wide text-pb-green"><tr>{["Question", "Subject", "Topic", "Exam", "Year", "Type", "Difficulty", "Marks", "Status", "Actions"].map((heading) => <th key={heading} scope="col" className="whitespace-nowrap px-3 py-3 font-bold">{heading}</th>)}</tr></thead><tbody className="divide-y divide-pb-border-soft">{sortedQuestions.map((question) => <tr key={question.id} className="hover:bg-pb-light/60"><td className="max-w-xs px-3 py-3"><span title={question.question_text} className="block max-w-xs truncate font-bold text-pb-green">{question.question_text}</span></td><td className="max-w-40 truncate px-3 py-3 text-slate-700">{question.subject?.name || "—"}</td><td className="max-w-40 truncate px-3 py-3 text-slate-700">{question.topic?.name || "—"}</td><td className="max-w-44 truncate px-3 py-3 text-slate-700">{question.exam_name || "—"}</td><td className="whitespace-nowrap px-3 py-3 text-slate-700">{question.exam_year || "—"}</td><td className="px-3 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${question.is_pyq ? "bg-[#e8eee3] text-pb-green" : "bg-[#f2ecda] text-pb-khaki"}`}>{question.is_pyq ? "PYQ" : "Regular"}</span></td><td className="whitespace-nowrap px-3 py-3 capitalize text-slate-700">{question.difficulty}</td><td className="whitespace-nowrap px-3 py-3 text-slate-700">{question.marks}</td><td className="px-3 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${question.is_active ? "bg-[#e8eee3] text-pb-green" : "bg-[#f2ecda] text-pb-khaki"}`}>{question.is_active ? "Active" : "Inactive"}</span></td><td className="px-3 py-3"><div className="flex items-center gap-2"><button type="button" onClick={() => openEdit(question)} className="rounded-md border border-pb-khaki px-3 py-1.5 text-xs font-bold text-pb-green hover:bg-pb-light">View/Edit</button><button type="button" disabled={updatingStatusId === question.id} onClick={() => { setStatusError(""); setConfirmQuestion(question); }} className="rounded-md border border-pb-border px-3 py-1.5 text-xs font-bold text-pb-green hover:bg-[#e8eee3] disabled:cursor-not-allowed disabled:opacity-50">{updatingStatusId === question.id ? "Updating..." : question.is_active ? "Deactivate" : "Activate"}</button><button type="button" disabled={deleteBusy} onClick={() => { setDeleteError(""); setDeleteCandidate(question); }} className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50">Delete / Remove</button></div></td></tr>)}</tbody></table></div></div></>}
        {!loading && !listError && pagination.pages > 0 && <div className="flex flex-col gap-3 border-t border-pb-border-soft px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"><p className="text-sm font-semibold text-slate-600">Page {pagination.page} of {pagination.pages}</p><div className="flex items-center gap-2"><button type="button" disabled={pagination.page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-md border border-pb-border px-4 py-2 text-sm font-bold text-pb-green hover:bg-pb-light disabled:cursor-not-allowed disabled:opacity-40">Previous</button><button type="button" disabled={pagination.page >= pagination.pages} onClick={() => setPage((value) => Math.min(pagination.pages, value + 1))} className="rounded-md border border-pb-border px-4 py-2 text-sm font-bold text-pb-green hover:bg-pb-light disabled:cursor-not-allowed disabled:opacity-40">Next</button></div></div>}
      </section>

      {formMode && <QuestionForm mode={formMode} form={form} subjects={subjects} topics={formTopics} topicsLoading={formTopicsLoading} topicsError={topicsError} formError={formError} saving={saving} onChange={handleChange} onClose={closeForm} onSubmit={handleSubmit} onRetryTopics={() => { setTopicsError(""); setFormTopicsReload((value) => value + 1); }} />}
      {confirmQuestion && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="presentation"><section role="dialog" aria-modal="true" aria-labelledby="question-status-title" className="w-full max-w-md rounded-xl border border-pb-border bg-white p-6 shadow-xl"><h2 id="question-status-title" className="text-lg font-extrabold text-pb-green">Confirm status change</h2><p className="mt-3 text-sm leading-6 text-slate-700">{confirmQuestion.is_active ? "हा प्रश्न deactivate करायचा आहे का?" : "हा प्रश्न पुन्हा active करायचा आहे का?"}</p>{statusError && <p role="alert" className="mt-3 text-sm font-semibold text-red-700">{statusError}</p>}<div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" disabled={updatingStatusId !== null} onClick={() => setConfirmQuestion(null)} className="rounded-lg border border-pb-border px-4 py-2 text-sm font-bold text-pb-green hover:bg-pb-light disabled:opacity-60">Cancel</button><button type="button" disabled={updatingStatusId !== null} onClick={handleStatusChange} className="rounded-lg bg-pb-green px-4 py-2 text-sm font-bold text-white hover:bg-pb-khaki disabled:cursor-not-allowed disabled:opacity-60">{updatingStatusId !== null ? "Updating..." : "Confirm"}</button></div></section></div>}
      {deleteCandidate && <AdminConfirmDialog title="Remove question?" message={`Remove “${deleteCandidate.question_text}”?`} detail="If this question is used in a test or saved attempt, it will be deactivated so the history stays intact. Otherwise, it will be permanently deleted." busy={deleteBusy} error={deleteError} onCancel={() => { if (!deleteBusy) setDeleteCandidate(null); }} onConfirm={handleDelete} />}
    </div>
  );
}

export default AdminQuestions;
