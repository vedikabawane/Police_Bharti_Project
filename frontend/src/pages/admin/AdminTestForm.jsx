import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { createTest, getTest, updateTest } from "../../services/admin/adminTestService";
import { getSubjects } from "../../services/admin/adminSubjectService";
import { getTopics } from "../../services/admin/adminTopicService";

const TEST_TYPES = [
  ["subject", "विषय चाचणी"],
  ["topic", "विषयघटक चाचणी"],
  ["full_mock", "महाराष्ट्र पोलीस भरती — संपूर्ण सराव चाचणी (100 गुण)"],
];
const LEGACY_TEST_TYPE_LABELS = {
  mixed: "जुनी मिश्र चाचणी",
  daily: "जुनी दैनिक चाचणी",
  weekly: "जुनी साप्ताहिक चाचणी",
  previous_year: "जुनी मागील वर्षाची चाचणी",
};
const EMPTY_FORM = {
  title: "",
  description: "",
  instructions: "",
  test_type: "subject",
  subject_id: "",
  topic_id: "",
  duration_minutes: "30",
};
const fieldClass = "w-full min-w-0 rounded-lg border border-pb-border bg-white px-3.5 py-2.5 text-sm text-pb-green outline-none focus:border-pb-khaki focus:ring-2 focus:ring-pb-khaki/20 disabled:bg-slate-100";
const labelClass = "mb-1.5 block text-sm font-bold text-pb-green";

function formatValidationErrors(errors, path = "") {
  if (typeof errors === "string") return [path ? `${path}: ${errors}` : errors];
  if (Array.isArray(errors)) {
    return errors.flatMap((error, index) => {
      const itemPath = path ? `${path}[${index}]` : `[${index}]`;
      return formatValidationErrors(error, itemPath);
    });
  }
  if (!errors || typeof errors !== "object") return [];

  return Object.entries(errors).flatMap(([key, error]) => {
    const itemPath = /^\d+$/.test(key)
      ? `${path}[${key}]`
      : path ? `${path}.${key}` : key;
    return formatValidationErrors(error, itemPath);
  });
}

const getErrorMessage = (error, fallback) => {
  const response = error.response?.data;
  const validationMessage = response?.errors
    ? formatValidationErrors(response.errors).join(" ")
    : "";
  return validationMessage || response?.message || error.message || fallback;
};

async function loadAllPages(fetchPage, recordsKey) {
  const first = await fetchPage({ page: 1, per_page: 100 });
  const records = first?.data?.[recordsKey];
  const pages = first?.data?.pagination?.pages;
  if (!first?.success || !Array.isArray(records) || !Number.isInteger(pages)) {
    throw new Error(first?.message || "यादीचा प्रतिसाद अपूर्ण आहे.");
  }
  if (pages <= 1) return records;
  const rest = await Promise.all(Array.from({ length: pages - 1 }, (_, index) =>
    fetchPage({ page: index + 2, per_page: 100 }),
  ));
  return records.concat(...rest.map((response) => {
    const items = response?.data?.[recordsKey];
    if (!response?.success || !Array.isArray(items)) {
      throw new Error(response?.message || "यादीचा प्रतिसाद अपूर्ण आहे.");
    }
    return items;
  }));
}

function emptyQuestion(testType, subjectId, topicId) {
  return {
    managedId: null,
    question_text: "",
    subject_id: testType === "full_mock" ? "" : subjectId,
    topic_id: testType === "topic" ? topicId : "",
    exam_name: "",
    exam_year: "",
    options: [
      { option_label: "A", option_text: "" },
      { option_label: "B", option_text: "" },
      { option_label: "C", option_text: "" },
      { option_label: "D", option_text: "" },
    ],
    correct_option: "A",
    explanation: "",
    difficulty: "medium",
    marks: "1",
    is_pyq: false,
  };
}

function mapExistingQuestion(row) {
  const question = row.question;
  return {
    managedId: row.is_admin_created ? question.id : null,
    question_text: question.question_text || "",
    subject_id: String(question.subject_id || ""),
    topic_id: String(question.topic_id || ""),
    exam_name: question.exam_name || "",
    exam_year: question.exam_year == null ? "" : String(question.exam_year),
    options: ["A", "B", "C", "D"].map((label) => ({
      option_label: label,
      option_text: question.options?.find((option) => option.option_label === label)?.option_text || "",
    })),
    correct_option: question.correct_option || "A",
    explanation: question.explanation || "",
    difficulty: question.difficulty || "medium",
    marks: String(question.marks ?? "1"),
    is_pyq: Boolean(question.is_pyq),
  };
}

function AdminTestForm() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(testId);
  const [form, setForm] = useState(EMPTY_FORM);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState("");
  const [testLoading, setTestLoading] = useState(isEditing);
  const [testError, setTestError] = useState("");
  const [questions, setQuestions] = useState([]);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    let current = true;
    Promise.all([
      loadAllPages(getSubjects, "subjects"),
      loadAllPages(getTopics, "topics"),
    ])
      .then(([subjectRows, topicRows]) => {
        if (!current) return;
        setSubjects(subjectRows);
        setTopics(topicRows);
      })
      .catch((error) => {
        if (current) setCatalogError(getErrorMessage(error, "विषय आणि विषयघटक लोड करता आले नाहीत."));
      })
      .finally(() => { if (current) setCatalogLoading(false); });
    return () => { current = false; };
  }, []);

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
          instructions: test.instructions || "",
          test_type: String(test.test_type || "subject").toLowerCase(),
          subject_id: test.subject_id == null ? "" : String(test.subject_id),
          topic_id: test.topic_id == null ? "" : String(test.topic_id),
          duration_minutes: String(test.duration_minutes || ""),
        });
        setQuestions(test.questions
          .slice()
          .sort((first, second) => first.question_order - second.question_order)
          .map(mapExistingQuestion));
      })
      .catch((error) => { if (current) setTestError(getErrorMessage(error, "चाचणी लोड करता आली नाही.")); })
      .finally(() => { if (current) setTestLoading(false); });
    return () => { current = false; };
  }, [isEditing, testId]);

  const isTopicTest = form.test_type === "topic";
  const isSubjectTest = form.test_type === "subject";
  const isFullMock = form.test_type === "full_mock";
  const totalMarks = useMemo(
    () => questions.reduce((sum, question) => sum + (Number(question.marks) || 0), 0),
    [questions],
  );
  const distributions = useMemo(() => {
    const subjectsById = new Map(subjects.map((subject) => [String(subject.id), subject.name]));
    const topicsById = new Map(topics.map((topic) => [String(topic.id), topic.name]));
    const bySubject = new Map();
    const byTopic = new Map();
    questions.forEach((question) => {
      const marks = Number(question.marks) || 0;
      const subjectName = subjectsById.get(String(question.subject_id)) || "विषय निवडलेला नाही";
      const topicName = topicsById.get(String(question.topic_id)) || "विषयघटक निवडलेला नाही";
      const subject = bySubject.get(subjectName) || { name: subjectName, count: 0, marks: 0 };
      subject.count += 1;
      subject.marks += marks;
      bySubject.set(subjectName, subject);
      const key = `${subjectName}::${topicName}`;
      const topic = byTopic.get(key) || { subject: subjectName, name: topicName, count: 0, marks: 0 };
      topic.count += 1;
      topic.marks += marks;
      byTopic.set(key, topic);
    });
    return {
      subjects: [...bySubject.values()],
      topics: [...byTopic.values()],
    };
  }, [questions, subjects, topics]);

  const changeField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === "subject_id" ? { topic_id: "" } : {}),
      ...(name === "test_type" && value === "full_mock" ? { subject_id: "", topic_id: "" } : {}),
    }));
    if (name === "subject_id") {
      setQuestions((current) => current.map((question) => ({
        ...question,
        subject_id: value,
        topic_id: isTopicTest ? "" : "",
      })));
    } else if (name === "topic_id" && isTopicTest) {
      setQuestions((current) => current.map((question) => ({
        ...question,
        subject_id: form.subject_id,
        topic_id: value,
      })));
    } else if (name === "test_type" && value === "full_mock") {
      setQuestions((current) => current.map((question) => ({
        ...question,
        subject_id: "",
        topic_id: "",
      })));
    } else if (name === "test_type" && value === "topic") {
      setQuestions((current) => current.map((question) => ({
        ...question,
        subject_id: form.subject_id,
        topic_id: form.topic_id,
      })));
    } else if (name === "test_type" && value === "subject") {
      setQuestions((current) => current.map((question) => ({
        ...question,
        subject_id: form.subject_id,
        topic_id: "",
      })));
    }
    setFormError("");
  };

  const addQuestion = () => {
    setQuestions((current) => [...current, emptyQuestion(
      form.test_type, form.subject_id, form.topic_id,
    )]);
    setFormError("");
  };

  const updateQuestion = (index, field, value) => {
    setQuestions((current) => current.map((question, currentIndex) => {
      if (currentIndex !== index) return question;
      if (field === "subject_id") {
        return { ...question, subject_id: value, topic_id: "" };
      }
      return { ...question, [field]: value };
    }));
    setFormError("");
  };

  const updateOption = (questionIndex, optionLabel, value) => {
    setQuestions((current) => current.map((question, index) => index !== questionIndex
      ? question
      : {
          ...question,
          options: question.options.map((option) => option.option_label === optionLabel
            ? { ...option, option_text: value }
            : option),
        }));
    setFormError("");
  };

  const moveQuestion = (index, offset) => {
    const newIndex = index + offset;
    if (newIndex < 0 || newIndex >= questions.length) return;
    setQuestions((current) => {
      const reordered = current.slice();
      [reordered[index], reordered[newIndex]] = [reordered[newIndex], reordered[index]];
      return reordered;
    });
  };

  const validate = (publish) => {
    if (!form.title.trim()) return "चाचणीचे नाव आवश्यक आहे.";
    if (form.title.trim().length > 200) return "चाचणीचे नाव २०० अक्षरांपेक्षा मोठे असू शकत नाही.";
    if (!Number.isInteger(Number(form.duration_minutes)) || Number(form.duration_minutes) < 1 || Number(form.duration_minutes) > 600) {
      return "वेळ १ ते ६०० पूर्ण मिनिटांदरम्यान असावी.";
    }
    if ((isSubjectTest || isTopicTest) && !form.subject_id) return "या चाचणीसाठी विषय निवडा.";
    if (isTopicTest && !form.topic_id) return "विषयघटक चाचणीसाठी विषयघटक निवडा.";
    if (isTopicTest && !topics.some((topic) => String(topic.id) === form.topic_id && String(topic.subject_id) === form.subject_id)) {
      return "निवडलेला विषयघटक या विषयाचा नाही.";
    }
    if (!questions.length) return "किमान एक प्रश्न जोडा.";
    for (let index = 0; index < questions.length; index += 1) {
      const question = questions[index];
      const number = index + 1;
      if (!question.question_text.trim()) return `प्रश्न ${number}: प्रश्नाचा मजकूर आवश्यक आहे.`;
      if (question.options.length !== 4 || question.options.some((option) => !option.option_text.trim())) {
        return `प्रश्न ${number}: चारही पर्याय भरा.`;
      }
      if (!question.options.some((option) => option.option_label === question.correct_option)) {
        return `प्रश्न ${number}: योग्य उत्तर निवडा.`;
      }
      if (!Number.isFinite(Number(question.marks)) || Number(question.marks) <= 0) {
        return `प्रश्न ${number}: गुण शून्यापेक्षा जास्त असावेत.`;
      }
      if (!question.subject_id || !question.topic_id) {
        return `प्रश्न ${number}: विषय आणि विषयघटक निवडा.`;
      }
      if (isSubjectTest && String(question.subject_id) !== form.subject_id) {
        return `प्रश्न ${number}: विषय चाचणीतील प्रश्न निवडलेल्या विषयाचे असावेत.`;
      }
      if (isTopicTest && (String(question.subject_id) !== form.subject_id || String(question.topic_id) !== form.topic_id)) {
        return `प्रश्न ${number}: विषयघटक चाचणीतील प्रश्न निवडलेल्या विषय आणि विषयघटकाचे असावेत.`;
      }
      const topic = topics.find((item) => String(item.id) === String(question.topic_id));
      if (!topic || String(topic.subject_id) !== String(question.subject_id)) {
        return `प्रश्न ${number}: निवडलेला विषयघटक या विषयाचा नाही.`;
      }
      if (form.test_type === "previous_year" && !question.is_pyq) {
        return `प्रश्न ${number}: मागील वर्षाच्या चाचणीसाठी PYQ प्रश्न आवश्यक आहे.`;
      }
    }
    if (publish && isFullMock && Math.abs(totalMarks - 100) > 0.000001) {
      return `संपूर्ण सराव चाचणी प्रकाशित करण्यासाठी एकूण गुण नेमके १०० असावेत. सध्याचे गुण: ${totalMarks.toFixed(2)}.`;
    }
    return "";
  };

  const save = async (publish) => {
    const validationError = validate(publish);
    if (validationError) {
      setFormError(validationError);
      return;
    }
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      instructions: form.instructions.trim() || null,
      test_type: form.test_type,
      subject_id: isFullMock ? null : (form.subject_id ? Number(form.subject_id) : null),
      topic_id: isTopicTest ? Number(form.topic_id) : null,
      duration_minutes: Number(form.duration_minutes),
      is_active: publish,
      questions: questions.map((question) => ({
        ...(question.managedId ? { id: Number(question.managedId) } : {}),
        subject_id: Number(question.subject_id),
        topic_id: Number(question.topic_id),
        exam_name: question.exam_name.trim() || null,
        exam_year: question.exam_year ? Number(question.exam_year) : null,
        question_text: question.question_text.trim(),
        options: question.options.map((option) => ({
          option_label: option.option_label,
          option_text: option.option_text.trim(),
        })),
        correct_option: question.correct_option,
        explanation: question.explanation.trim() || null,
        difficulty: question.difficulty,
        marks: Number(question.marks),
        is_pyq: Boolean(question.is_pyq),
      })),
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
      const feedback = publish ? "चाचणी प्रकाशित केली." : "चाचणी मसुदा म्हणून जतन केली.";
      navigate(`/admin/tests/${response.data.id}`, { state: { feedback } });
    } catch (error) {
      setFormError(getErrorMessage(error, "चाचणी जतन करताना समस्या आली."));
    } finally {
      setSaving(false);
    }
  };

  if (testLoading || catalogLoading) {
    return <div role="status" className="mx-auto max-w-7xl px-4 py-12 text-center text-sm font-semibold text-pb-green">चाचणी आणि विषयांची माहिती लोड होत आहे...</div>;
  }
  if (testError || catalogError) {
    return <div className="mx-auto max-w-3xl px-4 py-8"><div role="alert" className="rounded-lg border border-red-200 bg-white p-6"><p className="font-semibold text-red-700">{testError || catalogError}</p><Link to="/admin/tests" className="mt-4 inline-flex rounded-lg border border-pb-border px-4 py-2 text-sm font-bold text-pb-green">चाचण्यांकडे परत</Link></div></div>;
  }

  const legacyTypeLabel = LEGACY_TEST_TYPE_LABELS[form.test_type];
  const availableTopics = (subjectId) => topics.filter(
    (topic) => String(topic.subject_id) === String(subjectId),
  );

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-6 border-b border-pb-border pb-5">
        <Link to={isEditing ? `/admin/tests/${testId}` : "/admin/tests"} className="text-sm font-bold text-pb-khaki hover:text-pb-khaki">← चाचण्यांकडे परत</Link>
        <p className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-pb-khaki">चाचणी व्यवस्थापन</p>
        <h1 className="mt-1 text-2xl font-extrabold text-pb-green sm:text-3xl">{isEditing ? "चाचणी संपादित करा" : "नवीन चाचणी तयार करा"}</h1>
        <p className="mt-2 text-sm text-slate-600">चाचणीचा प्रकार निवडा, प्रश्न इथेच तयार करा, पूर्वावलोकन करा आणि मसुदा जतन करा किंवा प्रकाशित करा.</p>
      </div>

      <form onSubmit={(event) => event.preventDefault()} className="space-y-6">
        <section className="rounded-lg border border-pb-border bg-white p-4 sm:p-6">
          <h2 className="text-lg font-extrabold text-pb-green">१. चाचणीचा प्रकार आणि माहिती</h2>
          <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="admin-test-type-form" className={labelClass}>चाचणीचा प्रकार <span className="text-red-600">*</span></label>
              <select id="admin-test-type-form" name="test_type" value={form.test_type} onChange={changeField} disabled={saving} className={fieldClass}>
                {legacyTypeLabel && <option value={form.test_type}>{legacyTypeLabel}</option>}
                {TEST_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
              {isFullMock && <p className="mt-1 text-xs font-semibold text-pb-khaki">प्रकाशित करताना प्रश्नांचे एकत्रित गुण नेमके १०० असणे आवश्यक आहे.</p>}
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="admin-test-title" className={labelClass}>चाचणीचे नाव <span className="text-red-600">*</span></label>
              <input id="admin-test-title" name="title" required maxLength={200} value={form.title} onChange={changeField} disabled={saving} className={fieldClass} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="admin-test-description" className={labelClass}>वर्णन</label>
              <textarea id="admin-test-description" name="description" rows={2} value={form.description} onChange={changeField} disabled={saving} className={`${fieldClass} resize-y`} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="admin-test-instructions" className={labelClass}>विद्यार्थ्यांसाठी सूचना</label>
              <textarea id="admin-test-instructions" name="instructions" rows={3} value={form.instructions} onChange={changeField} disabled={saving} className={`${fieldClass} resize-y`} placeholder="उदा. सर्व प्रश्न सोडवा. चाचणी पूर्ण झाल्यावर Submit करा." />
            </div>
            <div>
              <label htmlFor="admin-test-duration" className={labelClass}>वेळ (मिनिटे) <span className="text-red-600">*</span></label>
              <input id="admin-test-duration" name="duration_minutes" type="number" min="1" max="600" step="1" required value={form.duration_minutes} onChange={changeField} disabled={saving} className={fieldClass} />
            </div>
            {!isFullMock && <div>
              <label htmlFor="admin-test-subject-form" className={labelClass}>विषय <span className="text-red-600">*</span></label>
              <select id="admin-test-subject-form" name="subject_id" value={form.subject_id} onChange={changeField} disabled={saving} className={fieldClass}>
                <option value="">विषय निवडा</option>
                {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
              </select>
            </div>}
            {isTopicTest && <div>
              <label htmlFor="admin-test-topic-form" className={labelClass}>विषयघटक <span className="text-red-600">*</span></label>
              <select id="admin-test-topic-form" name="topic_id" value={form.topic_id} onChange={changeField} disabled={saving || !form.subject_id} className={fieldClass}>
                <option value="">विषयघटक निवडा</option>
                {availableTopics(form.subject_id).map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}
              </select>
            </div>}
          </div>
        </section>

        <section className="rounded-lg border border-pb-border bg-white p-4 sm:p-6">
          <div className="flex flex-col gap-3 border-b border-pb-border-soft pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div><h2 className="text-lg font-extrabold text-pb-green">२. प्रश्नपत्रिका</h2><p className="mt-1 text-sm text-slate-600">प्रत्येक प्रश्न, चार पर्याय, योग्य उत्तर आणि विषय-घटक इथे जोडा.</p></div>
            <button type="button" onClick={addQuestion} disabled={saving} className="inline-flex shrink-0 items-center justify-center rounded-lg bg-pb-green px-4 py-2.5 text-sm font-bold text-white hover:bg-pb-khaki disabled:opacity-60">＋ प्रश्न जोडा</button>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-pb-light px-4 py-3"><p className="text-xs font-bold text-slate-500">एकूण प्रश्न</p><p className="mt-1 text-lg font-extrabold text-pb-green">{questions.length}</p></div>
            <div className="rounded-lg bg-pb-light px-4 py-3"><p className="text-xs font-bold text-slate-500">एकूण गुण</p><p className="mt-1 text-lg font-extrabold text-pb-green">{totalMarks.toFixed(2)}</p></div>
            <div className="rounded-lg bg-pb-light px-4 py-3"><p className="text-xs font-bold text-slate-500">अंदाजे वेळ</p><p className="mt-1 text-lg font-extrabold text-pb-green">{form.duration_minutes || "—"} मिनिटे</p></div>
          </div>

          {questions.length === 0 ? <div className="mt-4 rounded-lg border border-dashed border-pb-border p-8 text-center"><p className="font-bold text-pb-green">अजून प्रश्न जोडलेले नाहीत.</p><p className="mt-1 text-sm text-slate-600">प्रश्नसंच विभागात जाण्याची गरज नाही — “प्रश्न जोडा” निवडा.</p></div> : <ol className="mt-4 space-y-4">
            {questions.map((question, index) => <li key={`${question.managedId || "new"}-${index}`} className="rounded-lg border border-pb-border-soft p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-extrabold text-pb-green">प्रश्न {index + 1}</h3>
                <div className="flex gap-2">
                  <button type="button" aria-label={`प्रश्न ${index + 1} वर हलवा`} disabled={saving || index === 0} onClick={() => moveQuestion(index, -1)} className="rounded-md border border-pb-border px-3 py-1.5 text-sm font-bold text-pb-green disabled:opacity-40">↑</button>
                  <button type="button" aria-label={`प्रश्न ${index + 1} खाली हलवा`} disabled={saving || index === questions.length - 1} onClick={() => moveQuestion(index, 1)} className="rounded-md border border-pb-border px-3 py-1.5 text-sm font-bold text-pb-green disabled:opacity-40">↓</button>
                  <button type="button" disabled={saving} onClick={() => setQuestions((current) => current.filter((_, currentIndex) => currentIndex !== index))} className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-40">काढा</button>
                </div>
              </div>
              <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor={`question-text-${index}`} className={labelClass}>प्रश्नाचा मजकूर <span className="text-red-600">*</span></label>
                  <textarea id={`question-text-${index}`} rows={3} value={question.question_text} onChange={(event) => updateQuestion(index, "question_text", event.target.value)} disabled={saving} className={`${fieldClass} resize-y`} />
                </div>
                {isFullMock && <>
                  <div>
                    <label htmlFor={`question-subject-${index}`} className={labelClass}>विषय <span className="text-red-600">*</span></label>
                    <select id={`question-subject-${index}`} value={question.subject_id} onChange={(event) => updateQuestion(index, "subject_id", event.target.value)} disabled={saving} className={fieldClass}>
                      <option value="">विषय निवडा</option>
                      {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor={`question-topic-${index}`} className={labelClass}>विषयघटक <span className="text-red-600">*</span></label>
                    <select id={`question-topic-${index}`} value={question.topic_id} onChange={(event) => updateQuestion(index, "topic_id", event.target.value)} disabled={saving || !question.subject_id} className={fieldClass}>
                      <option value="">विषयघटक निवडा</option>
                      {availableTopics(question.subject_id).map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}
                    </select>
                  </div>
                </>}
                {isSubjectTest && <div>
                  <label htmlFor={`question-topic-${index}`} className={labelClass}>विषयघटक <span className="text-red-600">*</span></label>
                  <select id={`question-topic-${index}`} value={question.topic_id} onChange={(event) => updateQuestion(index, "topic_id", event.target.value)} disabled={saving || !form.subject_id} className={fieldClass}>
                    <option value="">विषयघटक निवडा</option>
                    {availableTopics(form.subject_id).map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}
                  </select>
                </div>}
                <div className="sm:col-span-2">
                  <p className={labelClass}>उत्तराचे पर्याय <span className="text-red-600">*</span></p>
                  <div className="grid min-w-0 gap-3 sm:grid-cols-2">
                    {question.options.map((option) => <div key={option.option_label} className="flex min-w-0 items-center gap-2">
                      <label htmlFor={`question-${index}-option-${option.option_label}`} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-pb-light text-sm font-extrabold text-pb-green">{option.option_label}</label>
                      <input id={`question-${index}-option-${option.option_label}`} value={option.option_text} onChange={(event) => updateOption(index, option.option_label, event.target.value)} disabled={saving} className={fieldClass} />
                    </div>)}
                  </div>
                </div>
                <div>
                  <label htmlFor={`question-correct-${index}`} className={labelClass}>योग्य उत्तर <span className="text-red-600">*</span></label>
                  <select id={`question-correct-${index}`} value={question.correct_option} onChange={(event) => updateQuestion(index, "correct_option", event.target.value)} disabled={saving} className={fieldClass}>{question.options.map((option) => <option key={option.option_label} value={option.option_label}>{option.option_label}</option>)}</select>
                </div>
                <div>
                  <label htmlFor={`question-marks-${index}`} className={labelClass}>गुण <span className="text-red-600">*</span></label>
                  <input id={`question-marks-${index}`} type="number" min="0.01" step="0.01" value={question.marks} onChange={(event) => updateQuestion(index, "marks", event.target.value)} disabled={saving} className={fieldClass} />
                </div>
                <div>
                  <label htmlFor={`question-difficulty-${index}`} className={labelClass}>काठिण्य पातळी</label>
                  <select id={`question-difficulty-${index}`} value={question.difficulty} onChange={(event) => updateQuestion(index, "difficulty", event.target.value)} disabled={saving} className={fieldClass}><option value="easy">सोपे</option><option value="medium">मध्यम</option><option value="hard">कठीण</option></select>
                </div>
                <div>
                  <label htmlFor={`question-pyq-${index}`} className={labelClass}>प्रश्नाचा प्रकार</label>
                  <select id={`question-pyq-${index}`} value={question.is_pyq ? "true" : "false"} onChange={(event) => updateQuestion(index, "is_pyq", event.target.value === "true")} disabled={saving} className={fieldClass}><option value="false">सराव प्रश्न</option><option value="true">मागील वर्षाचा प्रश्न</option></select>
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor={`question-explanation-${index}`} className={labelClass}>समजावणी (ऐच्छिक)</label>
                  <textarea id={`question-explanation-${index}`} rows={2} value={question.explanation} onChange={(event) => updateQuestion(index, "explanation", event.target.value)} disabled={saving} className={`${fieldClass} resize-y`} />
                </div>
                <p className="sm:col-span-2 text-xs text-slate-500">सध्याच्या गुणांकन पद्धतीत चुकीच्या उत्तरासाठी गुण कपात लागू नाही; गुणकपात शून्यच राहते.</p>
              </div>
            </li>)}
          </ol>}
        </section>

        <section className="rounded-lg border border-pb-border bg-white p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div><h2 className="text-lg font-extrabold text-pb-green">३. प्रश्न वितरण</h2><p className="mt-1 text-sm text-slate-600">प्रकाशनापूर्वी विषय आणि विषयघटकानुसार प्रश्न व गुण तपासा.</p></div>
            <button type="button" onClick={() => setPreview((current) => !current)} className="rounded-lg border border-pb-khaki px-4 py-2.5 text-sm font-bold text-pb-green hover:bg-pb-light">{preview ? "पूर्वावलोकन बंद करा" : "पूर्ण पूर्वावलोकन"}</button>
          </div>
          <div className="mt-4 grid min-w-0 gap-5 lg:grid-cols-2">
            <div>
              <h3 className="text-sm font-extrabold text-pb-green">विषयानुसार</h3>
              {distributions.subjects.length ? <ul className="mt-2 divide-y divide-pb-border-soft rounded-lg border border-pb-border-soft">
                {distributions.subjects.map((item) => <li key={item.name} className="flex justify-between gap-3 px-3 py-2 text-sm"><span>{item.name}</span><span className="font-bold">{item.count} प्रश्न · {item.marks.toFixed(2)} गुण</span></li>)}
              </ul> : <p className="mt-2 text-sm text-slate-500">वितरणासाठी प्रश्न नाहीत.</p>}
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-pb-green">विषयघटकानुसार</h3>
              {distributions.topics.length ? <ul className="mt-2 divide-y divide-pb-border-soft rounded-lg border border-pb-border-soft">
                {distributions.topics.map((item) => <li key={`${item.subject}-${item.name}`} className="flex justify-between gap-3 px-3 py-2 text-sm"><span>{item.subject} · {item.name}</span><span className="shrink-0 font-bold">{item.count} · {item.marks.toFixed(2)}</span></li>)}
              </ul> : <p className="mt-2 text-sm text-slate-500">वितरणासाठी प्रश्न नाहीत.</p>}
            </div>
          </div>
          {isFullMock && <p className={`mt-4 rounded-lg px-3 py-2 text-sm font-bold ${Math.abs(totalMarks - 100) < 0.000001 ? "bg-[#e8eee3] text-pb-green" : "bg-amber-50 text-amber-800"}`}>एकूण: {totalMarks.toFixed(2)} / 100 गुण · {questions.length} प्रश्न</p>}
          {preview && <div className="mt-5 border-t border-pb-border-soft pt-5">
            <h3 className="font-extrabold text-pb-green">संपूर्ण प्रश्नपत्रिका पूर्वावलोकन</h3>
            {!questions.length ? <p className="mt-3 text-sm text-slate-500">पूर्वावलोकनासाठी आधी प्रश्न जोडा.</p> : <ol className="mt-3 space-y-3">
              {questions.map((question, index) => <li key={`preview-${question.managedId || "new"}-${index}`} className="rounded-lg border border-pb-border-soft p-4">
                <div className="flex justify-between gap-3"><p className="whitespace-pre-wrap text-sm font-bold leading-6 text-pb-green">{index + 1}. {question.question_text || "(प्रश्नाचा मजकूर रिकामा)"}</p><span className="shrink-0 text-xs font-bold text-pb-khaki">{Number(question.marks || 0).toFixed(2)} गुण</span></div>
                <p className="mt-1 text-xs text-slate-500">{subjects.find((subject) => String(subject.id) === String(question.subject_id))?.name || "विषय नाही"} · {topics.find((topic) => String(topic.id) === String(question.topic_id))?.name || "विषयघटक नाही"}</p>
                <ul className="mt-2 grid gap-1 sm:grid-cols-2">{question.options.map((option) => <li key={option.option_label} className={`text-sm ${question.correct_option === option.option_label ? "font-bold text-emerald-700" : "text-slate-600"}`}>{option.option_label}. {option.option_text || "(रिकामा पर्याय)"}{question.correct_option === option.option_label ? " ✓" : ""}</li>)}</ul>
                {question.explanation && <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">समजावणी: {question.explanation}</p>}
              </li>)}
            </ol>}
          </div>}
        </section>

        {formError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{formError}</p>}
        <div className="sticky bottom-0 z-10 -mx-4 flex flex-col gap-3 border-t border-pb-border bg-white/95 px-4 py-4 backdrop-blur sm:mx-0 sm:flex-row sm:justify-end sm:rounded-lg sm:border sm:px-5">
          <Link to={isEditing ? `/admin/tests/${testId}` : "/admin/tests"} className="rounded-lg border border-pb-border px-4 py-2.5 text-center text-sm font-bold text-pb-green hover:bg-pb-light">रद्द करा</Link>
          <button type="button" onClick={() => save(false)} disabled={saving} className="rounded-lg border border-pb-khaki px-4 py-2.5 text-sm font-bold text-pb-green hover:bg-pb-light disabled:opacity-60">{saving ? "जतन होत आहे..." : "मसुदा जतन करा"}</button>
          <button type="button" onClick={() => save(true)} disabled={saving} className="rounded-lg bg-pb-green px-5 py-2.5 text-sm font-bold text-white hover:bg-pb-khaki disabled:opacity-60">{saving ? "जतन होत आहे..." : "प्रकाशित करा"}</button>
        </div>
      </form>
    </div>
  );
}

export default AdminTestForm;
