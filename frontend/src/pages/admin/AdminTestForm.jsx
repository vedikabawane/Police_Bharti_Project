import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { createTest, getTest, updateTest } from "../../services/admin/adminTestService";
import { getQuestions } from "../../services/admin/adminQuestionService";
import { getSubjects } from "../../services/admin/adminSubjectService";
import { getTopics } from "../../services/admin/adminTopicService";

const PER_PAGE = 15;
const TEST_TYPES = [
  ["SUBJECT", "विषय चाचणी"],
  ["TOPIC", "विषयघटक चाचणी"],
  ["MIXED", "मिश्र चाचणी"],
  ["FULL_MOCK", "पूर्ण सराव चाचणी"],
  ["DAILY", "दैनिक चाचणी"],
  ["WEEKLY", "साप्ताहिक चाचणी"],
  ["PREVIOUS_YEAR", "मागील वर्षाची चाचणी"],
];
const EMPTY_FORM = {
  title: "",
  description: "",
  test_type: "SUBJECT",
  subject_id: "",
  topic_id: "",
  duration_minutes: "30",
};
const fieldClass = "w-full min-w-0 rounded-lg border border-pb-border bg-white px-3.5 py-2.5 text-sm text-pb-green outline-none focus:border-pb-khaki focus:ring-2 focus:ring-pb-khaki/20 disabled:bg-slate-100";
const labelClass = "mb-1.5 block text-sm font-bold text-pb-green";

const getErrorMessage = (error, fallback) => {
  const response = error.response?.data;
  const validationMessage = response?.errors
    ? Object.values(response.errors).flat().join(" ")
    : "";
  return validationMessage || response?.message || error.message || fallback;
};

async function loadAllPages(fetchPage, recordsKey, filters = {}) {
  const first = await fetchPage({ ...filters, page: 1, per_page: 100 });
  const records = first?.data?.[recordsKey];
  const pages = first?.data?.pagination?.pages;
  if (!first?.success || !Array.isArray(records) || !Number.isInteger(pages)) {
    throw new Error(first?.message || "यादीचा प्रतिसाद अपूर्ण आहे.");
  }
  if (pages <= 1) return records;
  const rest = await Promise.all(Array.from({ length: pages - 1 }, (_, index) =>
    fetchPage({ ...filters, page: index + 2, per_page: 100 }),
  ));
  return records.concat(...rest.map((response) => {
    const items = response?.data?.[recordsKey];
    if (!response?.success || !Array.isArray(items)) {
      throw new Error(response?.message || "यादीचा प्रतिसाद अपूर्ण आहे.");
    }
    return items;
  }));
}

function AdminTestForm() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(testId);
  const [form, setForm] = useState(EMPTY_FORM);
  const [subjects, setSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [subjectsError, setSubjectsError] = useState("");
  const [subjectsReload, setSubjectsReload] = useState(0);
  const [topics, setTopics] = useState([]);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [topicsError, setTopicsError] = useState("");
  const [topicsReload, setTopicsReload] = useState(0);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [testLoading, setTestLoading] = useState(isEditing);
  const [testError, setTestError] = useState("");
  const [testReload, setTestReload] = useState(0);
  const [questionSearch, setQuestionSearch] = useState("");
  const [debouncedQuestionSearch, setDebouncedQuestionSearch] = useState("");
  const [questionSubjectFilter, setQuestionSubjectFilter] = useState("");
  const [questionTopicFilter, setQuestionTopicFilter] = useState("");
  const [questionTopics, setQuestionTopics] = useState([]);
  const [questionTopicsError, setQuestionTopicsError] = useState("");
  const [questionTopicsReload, setQuestionTopicsReload] = useState(0);
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [questionPage, setQuestionPage] = useState(1);
  const [questions, setQuestions] = useState([]);
  const [questionPagination, setQuestionPagination] = useState({ page: 1, per_page: PER_PAGE, total: 0, pages: 0 });
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [questionsError, setQuestionsError] = useState("");
  const [questionsReload, setQuestionsReload] = useState(0);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuestionSearch(questionSearch.trim()), 300);
    return () => window.clearTimeout(timeout);
  }, [questionSearch]);

  useEffect(() => {
    let current = true;
    loadAllPages(getSubjects, "subjects")
      .then((items) => { if (current) setSubjects(items); })
      .catch((error) => { if (current) setSubjectsError(getErrorMessage(error, "विषय लोड करता आले नाहीत.")); })
      .finally(() => { if (current) setSubjectsLoading(false); });
    return () => { current = false; };
  }, [subjectsReload]);

  useEffect(() => {
    if (!form.subject_id) {
      return undefined;
    }
    let current = true;
    Promise.resolve()
      .then(() => {
        if (!current) return null;
        setTopicsLoading(true);
        setTopicsError("");
        return loadAllPages(getTopics, "topics", { subject_id: form.subject_id });
      })
      .then((items) => { if (current && items) setTopics(items); })
      .catch((error) => { if (current) setTopicsError(getErrorMessage(error, "विषयघटक लोड करता आले नाहीत.")); })
      .finally(() => { if (current) setTopicsLoading(false); });
    return () => { current = false; };
  }, [form.subject_id, topicsReload]);

  useEffect(() => {
    if (!isEditing) return undefined;
    let current = true;
    getTest(testId)
      .then((response) => {
        const test = response?.data;
        if (!response?.success || !test || !Array.isArray(test.questions)) {
          throw new Error(response?.message || "चाचणीची माहिती अपूर्ण आहे.");
        }
        if (!current) return;
        setForm({
          title: test.title || "",
          description: test.description || "",
          test_type: String(test.test_type || "SUBJECT").toUpperCase(),
          subject_id: test.subject_id == null ? "" : String(test.subject_id),
          topic_id: test.topic_id == null ? "" : String(test.topic_id),
          duration_minutes: String(test.duration_minutes || ""),
        });
        setSelectedQuestions(test.questions
          .slice()
          .sort((a, b) => a.question_order - b.question_order)
          .map((row) => row.question)
          .filter(Boolean));
      })
      .catch((error) => { if (current) setTestError(getErrorMessage(error, "चाचणी लोड करता आली नाही.")); })
      .finally(() => { if (current) setTestLoading(false); });
    return () => { current = false; };
  }, [isEditing, testId, testReload]);

  const isPreviousYear = form.test_type === "PREVIOUS_YEAR";
  const isSubjectTest = form.test_type === "SUBJECT";
  const isTopicTest = form.test_type === "TOPIC";
  const effectiveQuestionSubject = isSubjectTest || isTopicTest
    ? form.subject_id
    : questionSubjectFilter;
  const effectiveQuestionTopic = isTopicTest
    ? form.topic_id
    : isSubjectTest && form.topic_id
      ? form.topic_id
      : questionTopicFilter;

  useEffect(() => {
    let current = true;
    const filters = effectiveQuestionSubject
      ? { subject_id: effectiveQuestionSubject }
      : {};
    Promise.resolve()
      .then(() => {
        if (!current) return null;
        setQuestionTopicsError("");
        return loadAllPages(getTopics, "topics", filters);
      })
      .then((items) => { if (current && items) setQuestionTopics(items); })
      .catch((error) => { if (current) setQuestionTopicsError(getErrorMessage(error, "विषयघटक लोड करता आले नाहीत.")); });
    return () => { current = false; };
  }, [effectiveQuestionSubject, questionTopicsReload]);

  useEffect(() => {
    let current = true;
    const load = async () => {
      const params = {
        page: questionPage,
        per_page: PER_PAGE,
        is_active: "true",
      };
      if (debouncedQuestionSearch) params.search = debouncedQuestionSearch;
      if (effectiveQuestionSubject) params.subject_id = effectiveQuestionSubject;
      if (effectiveQuestionTopic) params.topic_id = effectiveQuestionTopic;
      if (difficultyFilter) params.difficulty = difficultyFilter;
      if (isPreviousYear) params.is_pyq = "true";
      try {
        const response = await Promise.resolve().then(() => {
          if (!current) return null;
          setQuestionsLoading(true);
          setQuestionsError("");
          return getQuestions(params);
        });
        if (response === null) return;
        if (!response?.success || !Array.isArray(response.data?.questions) || !response.data?.pagination) {
          throw new Error(response?.message || "प्रश्नांची माहिती अपूर्ण आहे.");
        }
        if (current) {
          setQuestions(response.data.questions);
          setQuestionPagination(response.data.pagination);
        }
      } catch (error) {
        if (current) {
          setQuestions([]);
          setQuestionsError(getErrorMessage(error, "प्रश्न लोड करता आले नाहीत."));
        }
      } finally {
        if (current) setQuestionsLoading(false);
      }
    };
    load();
    return () => { current = false; };
  }, [questionPage, debouncedQuestionSearch, effectiveQuestionSubject, effectiveQuestionTopic, difficultyFilter, isPreviousYear, questionsReload]);

  const selectedIds = useMemo(() => new Set(selectedQuestions.map((question) => String(question.id))), [selectedQuestions]);
  const selectedMarks = selectedQuestions.reduce((sum, question) => sum + (Number(question.marks) || 0), 0);

  const changeField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === "subject_id" ? { topic_id: "" } : {}),
    }));
    if (name === "subject_id") {
      setTopics([]);
      setTopicsLoading(Boolean(value));
      setTopicsError("");
      setQuestionTopicFilter("");
      setQuestionPage(1);
    }
    setFormError("");
  };

  const toggleQuestion = (question) => {
    setSelectedQuestions((current) => current.some((item) => item.id === question.id)
      ? current.filter((item) => item.id !== question.id)
      : [...current, question]);
    setFormError("");
  };

  const moveSelected = (index, direction) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= selectedQuestions.length) return;
    setSelectedQuestions((current) => {
      const reordered = current.slice();
      [reordered[index], reordered[nextIndex]] = [reordered[nextIndex], reordered[index]];
      return reordered;
    });
  };

  const validateForm = () => {
    if (!form.title.trim()) return "चाचणीचे नाव आवश्यक आहे.";
    if (form.title.trim().length > 200) return "चाचणीचे नाव २०० अक्षरांपेक्षा मोठे असू शकत नाही.";
    if (!TEST_TYPES.some(([type]) => type === form.test_type)) return "वैध चाचणी प्रकार निवडा.";
    if (!Number.isInteger(Number(form.duration_minutes)) || Number(form.duration_minutes) < 1) return "वेळ १ किंवा अधिक पूर्ण मिनिटे असावी.";
    if (selectedQuestions.length === 0) return "किमान एक प्रश्न निवडा.";
    if (isSubjectTest && !form.subject_id) return "विषय चाचणीसाठी विषय निवडा.";
    if (isTopicTest && (!form.subject_id || !form.topic_id)) return "विषयघटक चाचणीसाठी विषय आणि विषयघटक निवडा.";
    if (form.subject_id && form.topic_id && !topics.some((topic) => String(topic.id) === form.topic_id && String(topic.subject_id) === form.subject_id)) {
      return "निवडलेला विषयघटक या विषयाचा नाही.";
    }
    if (isSubjectTest && selectedQuestions.some((question) => String(question.subject_id) !== form.subject_id)) {
      return "विषय चाचणीतील सर्व प्रश्न निवडलेल्या विषयाचे असावेत.";
    }
    if (isTopicTest && selectedQuestions.some((question) => String(question.topic_id) !== form.topic_id)) {
      return "विषयघटक चाचणीतील सर्व प्रश्न निवडलेल्या विषयघटकाचे असावेत.";
    }
    if (isPreviousYear && selectedQuestions.some((question) => !question.is_pyq)) {
      return "मागील वर्षाच्या चाचणीसाठी PYQ प्रश्न निवडा.";
    }
    return "";
  };

  const submit = async (event) => {
    event.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      test_type: form.test_type,
      subject_id: form.subject_id ? Number(form.subject_id) : null,
      topic_id: form.topic_id ? Number(form.topic_id) : null,
      duration_minutes: Number(form.duration_minutes),
      question_ids: selectedQuestions.map((question) => Number(question.id)),
    };
    setSaving(true);
    setFormError("");
    try {
      const response = isEditing
        ? await updateTest(testId, payload)
        : await createTest(payload);
      if (!response?.success || !response?.data?.id) {
        throw new Error(response?.message || "चाचणी जतन करता आली नाही.");
      }
      if (isEditing) {
        navigate(`/admin/tests/${testId}`, { state: { feedback: "चाचणीची माहिती जतन केली." } });
      } else {
        navigate("/admin/tests", { state: { feedback: "नवीन चाचणी तयार केली." } });
      }
    } catch (error) {
      setFormError(getErrorMessage(error, "चाचणी जतन करताना समस्या आली."));
    } finally {
      setSaving(false);
    }
  };

  const retryQuestions = () => {
    setQuestionsLoading(true);
    setQuestionsError("");
    setQuestionsReload((value) => value + 1);
  };

  const retrySubjects = () => {
    setSubjectsLoading(true);
    setSubjectsError("");
    setSubjectsReload((value) => value + 1);
  };

  const retryTopics = () => {
    setTopicsLoading(true);
    setTopicsError("");
    setTopicsReload((value) => value + 1);
  };

  const retryTest = () => {
    setTestLoading(true);
    setTestError("");
    setTestReload((value) => value + 1);
  };

  if (testLoading) {
    return <div role="status" className="mx-auto max-w-7xl px-4 py-12 text-center text-sm font-semibold text-pb-green">चाचणीची माहिती लोड होत आहे...</div>;
  }
  if (testError) {
    return <div className="mx-auto max-w-3xl px-4 py-8"><div role="alert" className="rounded-lg border border-red-200 bg-white p-6"><p className="font-semibold text-red-700">{testError}</p><div className="mt-4 flex gap-3"><button type="button" onClick={retryTest} className="rounded-lg bg-pb-green px-4 py-2 text-sm font-bold text-white">पुन्हा प्रयत्न</button><Link to="/admin/tests" className="rounded-lg border border-pb-border px-4 py-2 text-sm font-bold text-pb-green">चाचण्यांकडे परत</Link></div></div></div>;
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-6 border-b border-pb-border pb-5">
        <Link to={isEditing ? `/admin/tests/${testId}` : "/admin/tests"} className="text-sm font-bold text-pb-khaki hover:text-pb-khaki">← चाचण्यांकडे परत</Link>
        <p className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-pb-khaki">चाचणी व्यवस्थापन</p>
        <h1 className="mt-1 text-2xl font-extrabold text-pb-green sm:text-3xl">{isEditing ? "चाचणी संपादित करा" : "नवीन चाचणी"}</h1>
      </div>

      <form onSubmit={submit} className="space-y-6">
        <section className="rounded-lg border border-pb-border bg-white p-4 sm:p-6">
          <h2 className="text-lg font-extrabold text-pb-green">मूलभूत माहिती</h2>
          <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><label htmlFor="admin-test-title" className={labelClass}>चाचणीचे नाव <span className="text-red-600">*</span></label><input id="admin-test-title" name="title" required maxLength={200} value={form.title} onChange={changeField} disabled={saving} className={fieldClass} /></div>
            <div className="sm:col-span-2"><label htmlFor="admin-test-description" className={labelClass}>वर्णन</label><textarea id="admin-test-description" name="description" rows={3} value={form.description} onChange={changeField} disabled={saving} className={`${fieldClass} resize-y`} /></div>
            <div><label htmlFor="admin-test-type-form" className={labelClass}>चाचणी प्रकार <span className="text-red-600">*</span></label><select id="admin-test-type-form" name="test_type" value={form.test_type} onChange={changeField} disabled={saving} className={fieldClass}>{TEST_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
            <div><label htmlFor="admin-test-duration" className={labelClass}>वेळ (मिनिटे) <span className="text-red-600">*</span></label><input id="admin-test-duration" name="duration_minutes" type="number" min="1" max="600" step="1" required value={form.duration_minutes} onChange={changeField} disabled={saving} className={fieldClass} /></div>
            <div><label htmlFor="admin-test-subject-form" className={labelClass}>विषय{(isSubjectTest || isTopicTest) && <span className="text-red-600"> *</span>}</label><select id="admin-test-subject-form" name="subject_id" value={form.subject_id} onChange={changeField} disabled={saving || subjectsLoading} required={isSubjectTest || isTopicTest} className={fieldClass}><option value="">{subjectsLoading ? "विषय लोड होत आहेत..." : "विषय निवडा"}</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select>{subjectsError && <p role="alert" className="mt-1 text-xs font-semibold text-red-700">{subjectsError} <button type="button" onClick={retrySubjects} className="underline">पुन्हा प्रयत्न</button></p>}</div>
            <div><label htmlFor="admin-test-topic-form" className={labelClass}>विषयघटक{isTopicTest && <span className="text-red-600"> *</span>}</label><select id="admin-test-topic-form" name="topic_id" value={form.topic_id} onChange={changeField} disabled={saving || !form.subject_id || topicsLoading} required={isTopicTest} className={fieldClass}><option value="">{topicsLoading ? "विषयघटक लोड होत आहेत..." : "विषयघटक निवडा"}</option>{topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}</select>{topicsError && <p role="alert" className="mt-1 text-xs font-semibold text-red-700">{topicsError} <button type="button" onClick={retryTopics} className="underline">पुन्हा प्रयत्न</button></p>}</div>
          </div>
          {isPreviousYear && <p className="mt-4 rounded-lg bg-pb-light px-3 py-2 text-sm text-slate-600">या चाचणीसाठी प्रश्नसंचातील PYQ म्हणून नोंदवलेले प्रश्न निवडा. Previous Year PDF विभागाशी याचा संबंध नाही.</p>}
        </section>

        <section className="min-w-0 rounded-lg border border-pb-border bg-white p-4 sm:p-6">
          <div className="flex flex-col gap-2 border-b border-pb-border-soft pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div><h2 className="text-lg font-extrabold text-pb-green">प्रश्न निवडा</h2><p className="mt-1 text-sm text-slate-600">निवडलेले प्रश्न क्रमाने चाचणीत जोडले जातील.</p></div>
            <p className="text-sm font-bold text-pb-green">निवडलेले: {selectedQuestions.length} · एकूण गुण: {selectedMarks.toFixed(2)}</p>
          </div>

          <div className="mt-4 grid min-w-0 gap-5 lg:grid-cols-2">
            <div className="min-w-0">
              <div className="grid min-w-0 gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2"><label htmlFor="admin-test-question-search" className={labelClass}>प्रश्न शोधा</label><input id="admin-test-question-search" type="search" value={questionSearch} onChange={(event) => { setQuestionSearch(event.target.value); setQuestionPage(1); }} placeholder="प्रश्न किंवा परीक्षेचे नाव" className={fieldClass} /></div>
                <div><label htmlFor="admin-test-question-subject" className={labelClass}>प्रश्नांचा विषय</label><select id="admin-test-question-subject" value={effectiveQuestionSubject} disabled={isSubjectTest || isTopicTest} onChange={(event) => { setQuestionSubjectFilter(event.target.value); setQuestionTopicFilter(""); setQuestionPage(1); }} className={fieldClass}><option value="">सर्व विषय</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select></div>
                <div><label htmlFor="admin-test-question-topic" className={labelClass}>प्रश्नांचा विषयघटक</label><select id="admin-test-question-topic" value={effectiveQuestionTopic} disabled={isTopicTest || (isSubjectTest && Boolean(form.topic_id))} onChange={(event) => { setQuestionTopicFilter(event.target.value); setQuestionPage(1); }} className={fieldClass}><option value="">सर्व विषयघटक</option>{questionTopics.map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}</select>{questionTopicsError && <p role="alert" className="mt-1 text-xs text-red-700">{questionTopicsError} <button type="button" onClick={() => setQuestionTopicsReload((value) => value + 1)} className="underline">पुन्हा प्रयत्न</button></p>}</div>
                <div><label htmlFor="admin-test-question-difficulty" className={labelClass}>कठीणता</label><select id="admin-test-question-difficulty" value={difficultyFilter} onChange={(event) => { setDifficultyFilter(event.target.value); setQuestionPage(1); }} className={fieldClass}><option value="">सर्व</option><option value="easy">सोपे</option><option value="medium">मध्यम</option><option value="hard">कठीण</option></select></div>
              </div>
              <div className="mt-3 max-h-[52vh] min-h-48 space-y-2 overflow-y-auto rounded-lg border border-pb-border-soft bg-pb-light/50 p-2">
                {questionsLoading ? <p role="status" className="py-8 text-center text-sm font-semibold text-slate-600">प्रश्न लोड होत आहेत...</p>
                  : questionsError ? <div role="alert" className="py-8 text-center"><p className="text-sm font-semibold text-red-700">{questionsError}</p><button type="button" onClick={retryQuestions} className="mt-3 text-sm font-bold text-pb-khaki underline">पुन्हा प्रयत्न</button></div>
                    : questions.length === 0 ? <p className="py-8 text-center text-sm font-semibold text-slate-500">जुळणारे सक्रिय प्रश्न सापडले नाहीत.</p>
                      : questions.map((question) => {
                        const selected = selectedIds.has(String(question.id));
                        return <article key={question.id} className="flex min-w-0 items-start gap-3 rounded-lg border border-pb-border bg-white p-3">
                          <div className="min-w-0 flex-1"><p className="break-words text-sm font-semibold leading-6 text-pb-green">{question.question_text}</p><p className="mt-1 text-xs text-slate-500">ID: {question.id} · {question.subject?.name || "—"} / {question.topic?.name || "—"} · {question.difficulty} · {question.marks} गुण{question.is_pyq ? " · PYQ" : ""}</p></div>
                          <button type="button" onClick={() => toggleQuestion(question)} className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-bold ${selected ? "border border-pb-border text-pb-green hover:bg-pb-light" : "bg-pb-green text-white hover:bg-pb-khaki"}`}>{selected ? "काढा" : "निवडा"}</button>
                        </article>;
                      })}
              </div>
              {!questionsLoading && !questionsError && questionPagination.pages > 0 && <div className="mt-3 flex items-center justify-between gap-3"><span className="text-xs font-semibold text-slate-500">पृष्ठ {questionPagination.page} / {questionPagination.pages} · {questionPagination.total} प्रश्न</span><div className="flex gap-2"><button type="button" disabled={questionPagination.page <= 1} onClick={() => setQuestionPage((value) => value - 1)} className="rounded-md border border-pb-border px-3 py-1.5 text-xs font-bold text-pb-green disabled:opacity-40">मागील</button><button type="button" disabled={questionPagination.page >= questionPagination.pages} onClick={() => setQuestionPage((value) => value + 1)} className="rounded-md border border-pb-border px-3 py-1.5 text-xs font-bold text-pb-green disabled:opacity-40">पुढील</button></div></div>}
            </div>

            <div className="min-w-0 rounded-lg border border-pb-border-soft">
              <div className="flex items-center justify-between gap-3 border-b border-pb-border-soft bg-pb-light px-3 py-3"><h3 className="font-extrabold text-pb-green">निवडलेले प्रश्न</h3><span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-pb-green">{selectedQuestions.length}</span></div>
              {selectedQuestions.length === 0 ? <p className="px-4 py-8 text-center text-sm text-slate-500">अद्याप प्रश्न निवडलेले नाहीत.</p> : <ol className="max-h-[52vh] space-y-2 overflow-y-auto p-3">
                {selectedQuestions.map((question, index) => <li key={question.id} className="flex min-w-0 items-start gap-2 rounded-lg border border-pb-border bg-white p-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-pb-green text-xs font-extrabold text-white">{index + 1}</span>
                  <div className="min-w-0 flex-1"><p className="break-words text-sm font-semibold leading-5 text-pb-green">{question.question_text}</p><p className="mt-1 text-xs text-slate-500">ID: {question.id} · {question.marks} गुण</p></div>
                  <div className="flex shrink-0 flex-col gap-1"><button type="button" disabled={saving || index === 0} onClick={() => moveSelected(index, -1)} aria-label={`प्रश्न ${index + 1} वर हलवा`} className="rounded border border-pb-border px-2 py-0.5 text-xs font-bold text-pb-green disabled:opacity-30">↑</button><button type="button" disabled={saving || index === selectedQuestions.length - 1} onClick={() => moveSelected(index, 1)} aria-label={`प्रश्न ${index + 1} खाली हलवा`} className="rounded border border-pb-border px-2 py-0.5 text-xs font-bold text-pb-green disabled:opacity-30">↓</button><button type="button" disabled={saving} onClick={() => toggleQuestion(question)} aria-label={`प्रश्न ${index + 1} काढा`} className="rounded border border-red-200 px-2 py-0.5 text-xs font-bold text-red-700 disabled:opacity-40">×</button></div>
                </li>)}
              </ol>}
            </div>
          </div>
        </section>

        {formError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{formError}</p>}
        <div className="flex flex-col-reverse gap-2 border-t border-pb-border pt-4 sm:flex-row sm:justify-end">
          <Link to={isEditing ? `/admin/tests/${testId}` : "/admin/tests"} className="rounded-lg border border-pb-border px-4 py-2.5 text-center text-sm font-bold text-pb-green hover:bg-pb-light">रद्द करा</Link>
          <button type="submit" disabled={saving || testLoading || questionsLoading} className="rounded-lg bg-pb-green px-5 py-2.5 text-sm font-bold text-white hover:bg-pb-khaki disabled:cursor-not-allowed disabled:opacity-60">{saving ? "जतन होत आहे..." : isEditing ? "बदल जतन करा" : "चाचणी तयार करा"}</button>
        </div>
      </form>
    </div>
  );
}

export default AdminTestForm;
