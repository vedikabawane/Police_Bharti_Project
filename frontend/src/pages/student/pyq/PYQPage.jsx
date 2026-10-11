import { useEffect, useState } from "react";
import { getPYQQuestions } from "../../../services/pyqService";
import { getSubjects, getTopicsBySubject } from "../../../services/studyService";

function PYQPage() {
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [subjectId, setSubjectId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [examYear, setExamYear] = useState("");
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState("");
  const [answerChecked, setAnswerChecked] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [subjectError, setSubjectError] = useState("");
  const [topicError, setTopicError] = useState("");

  useEffect(() => {
    let isActive = true;

    const loadSubjects = async () => {
      try {
        const response = await getSubjects();
        if (!response.success || !Array.isArray(response.data)) {
          throw new Error("Unexpected subjects response");
        }
        if (isActive) {
          setSubjects(response.data);
        }
      } catch (requestError) {
        console.error("Failed to load PYQ subject filters:", requestError);
        if (isActive) {
          setSubjectError("Unable to load subjects.");
        }
      }
    };

    loadSubjects();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    setTopics([]);
    setTopicId("");
    setTopicError("");

    if (!subjectId) {
      return () => {
        isActive = false;
      };
    }

    const loadTopics = async () => {
      try {
        const response = await getTopicsBySubject(subjectId);
        if (!response.success || !Array.isArray(response.data)) {
          throw new Error("Unexpected topics response");
        }
        if (isActive) {
          setTopics(response.data);
        }
      } catch (requestError) {
        console.error("Failed to load PYQ topic filters:", requestError);
        if (isActive) {
          setTopicError("Unable to load topics for this subject.");
        }
      }
    };

    loadTopics();

    return () => {
      isActive = false;
    };
  }, [subjectId]);

  const loadQuestions = async (filters = {}) => {
    setLoading(true);
    setError("");
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setSelectedOption("");
    setAnswerChecked(false);
    setCompleted(false);

    try {
      const response = await getPYQQuestions(filters);
      if (!response.success || !Array.isArray(response.data)) {
        throw new Error("Unexpected PYQ response");
      }

      setQuestions(
        response.data.filter(
          (question) => question.is_pyq === true && question.is_active === true
        )
      );
    } catch (requestError) {
      console.error("Failed to load previous year questions:", requestError);
      setError("Unable to load previous year questions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, []);

  const currentQuestion = questions[currentQuestionIndex];
  const availableYears = [
    ...new Set(
      questions
        .map((question) => question.exam_year)
        .filter((year) => year !== null && year !== undefined && year !== "")
    ),
  ].sort((first, second) => Number(second) - Number(first));
  const progress = questions.length
    ? ((currentQuestionIndex + 1) / questions.length) * 100
    : 0;

  const applyFilters = () => {
    const filters = {};
    if (subjectId) filters.subject_id = subjectId;
    if (topicId) filters.topic_id = topicId;
    if (examYear) filters.exam_year = examYear;
    loadQuestions(filters);
  };

  const resetFilters = () => {
    setSubjectId("");
    setTopicId("");
    setExamYear("");
    setTopics([]);
    loadQuestions();
  };

  const moveToQuestion = (nextIndex) => {
    setCurrentQuestionIndex(nextIndex);
    setSelectedOption("");
    setAnswerChecked(false);
    setCompleted(false);
  };

  const checkAnswer = () => {
    if (selectedOption) {
      setAnswerChecked(true);
    }
  };

  const retryQuestion = () => {
    setSelectedOption("");
    setAnswerChecked(false);
  };

  return (
    <main className="min-h-screen bg-pb-light">
      <header className="border-b border-pb-border bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-4 py-7 sm:px-6 lg:px-8">
          <div>
            <p className="text-sm font-bold text-pb-khaki">📄 Previous Questions</p>
            <h1 className="mt-2 text-2xl font-extrabold text-pb-green sm:text-3xl">
              मागील वर्षांचे प्रश्न
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              विषय, टॉपिक आणि परीक्षेच्या वर्षानुसार प्रश्नांचा सराव करा.
            </p>
          </div>
          <div className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-pb-green text-3xl text-white shadow-lg sm:flex">
            📝
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5">
            <h2 className="text-lg font-extrabold text-pb-green">प्रश्न फिल्टर करा</h2>
            <p className="mt-1 text-sm text-slate-500">
              फिल्टर निवडून उपलब्ध PYQ प्रश्न पहा.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-sm font-bold text-slate-700">
              Subject
              <select
                value={subjectId}
                onChange={(event) => setSubjectId(event.target.value)}
                className="mt-2 w-full rounded-xl border border-pb-border bg-white px-3 py-3 font-medium outline-none focus:border-pb-khaki focus:ring-2 focus:ring-pb-khaki/20"
              >
                <option value="">All subjects</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
              {subjectError && <span className="mt-1 block text-xs font-medium text-red-600">{subjectError}</span>}
            </label>

            <label className="text-sm font-bold text-slate-700">
              Topic
              <select
                value={topicId}
                onChange={(event) => setTopicId(event.target.value)}
                disabled={!subjectId || Boolean(topicError)}
                className="mt-2 w-full rounded-xl border border-pb-border bg-white px-3 py-3 font-medium outline-none focus:border-pb-khaki focus:ring-2 focus:ring-pb-khaki/20 disabled:cursor-not-allowed disabled:bg-slate-50"
              >
                <option value="">All topics</option>
                {topics.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.name}
                  </option>
                ))}
              </select>
              {topicError && <span className="mt-1 block text-xs font-medium text-red-600">{topicError}</span>}
            </label>

            <label className="text-sm font-bold text-slate-700">
              Exam year
              <select
                value={examYear}
                onChange={(event) => setExamYear(event.target.value)}
                className="mt-2 w-full rounded-xl border border-pb-border bg-white px-3 py-3 font-medium outline-none focus:border-pb-khaki focus:ring-2 focus:ring-pb-khaki/20"
              >
                <option value="">All years</option>
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={applyFilters}
              className="rounded-xl bg-pb-green px-5 py-3 text-sm font-bold text-white transition hover:bg-pb-khaki focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pb-khaki"
            >
              Apply Filters
            </button>
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-xl border border-[#d8d1bf] px-5 py-3 text-sm font-bold text-pb-green transition hover:bg-pb-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pb-khaki"
            >
              Reset Filters
            </button>
          </div>
        </section>

        {loading ? (
          <div
            role="status"
            aria-live="polite"
            className="rounded-2xl bg-white p-10 text-center text-sm font-medium text-slate-600 shadow-sm"
          >
            <span className="mx-auto mb-3 block h-9 w-9 animate-spin rounded-full border-4 border-pb-border border-t-pb-khaki" />
            प्रश्न लोड होत आहेत...
          </div>
        ) : error ? (
          <div role="alert" className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
            <p className="font-bold text-red-700">{error}</p>
            <button
              type="button"
              onClick={() => {
                const filters = {};
                if (subjectId) filters.subject_id = subjectId;
                if (topicId) filters.topic_id = topicId;
                if (examYear) filters.exam_year = examYear;
                loadQuestions(filters);
              }}
              className="mt-4 rounded-xl bg-pb-green px-5 py-3 text-sm font-bold text-white hover:bg-pb-khaki"
            >
              Try Again
            </button>
          </div>
        ) : questions.length === 0 ? (
          <div className="rounded-2xl bg-white px-6 py-12 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-pb-light text-2xl">
              📭
            </div>
            <h2 className="mt-4 text-lg font-extrabold text-pb-green">
              No previous year questions found.
            </h2>
            <p className="mt-2 text-sm text-slate-500">Try changing the filters.</p>
          </div>
        ) : completed ? (
          <section className="rounded-2xl bg-white px-6 py-12 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-pb-light text-2xl">
              ✅
            </div>
            <h2 className="mt-4 text-xl font-extrabold text-pb-green">सराव पूर्ण झाला!</h2>
            <p className="mt-2 text-sm text-slate-500">
              तुम्ही {questions.length} प्रश्न पाहिले आहेत.
            </p>
            <button
              type="button"
              onClick={() => moveToQuestion(0)}
              className="mt-5 rounded-xl bg-pb-green px-5 py-3 text-sm font-bold text-white hover:bg-pb-khaki"
            >
              Review Questions
            </button>
          </section>
        ) : currentQuestion ? (
          <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="border-b border-pb-border-soft p-5 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-extrabold text-pb-khaki">
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </p>
                  <h2 className="mt-2 text-lg font-extrabold text-pb-green sm:text-xl">
                    {currentQuestion.exam_name || "Previous Year Question"}
                    {currentQuestion.exam_year ? ` · ${currentQuestion.exam_year}` : ""}
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-bold">
                  {currentQuestion.difficulty && (
                    <span className="rounded-full bg-pb-light px-3 py-2 text-pb-green">
                      Difficulty: {currentQuestion.difficulty}
                    </span>
                  )}
                  {currentQuestion.marks !== undefined && currentQuestion.marks !== null && (
                    <span className="rounded-full bg-pb-light px-3 py-2 text-pb-green">
                      Marks: {currentQuestion.marks}
                    </span>
                  )}
                </div>
              </div>
              <div
                className="mt-5 h-2 overflow-hidden rounded-full bg-pb-border-soft"
                role="progressbar"
                aria-label="Question progress"
                aria-valuemin={0}
                aria-valuemax={questions.length}
                aria-valuenow={currentQuestionIndex + 1}
              >
                <div
                  className="h-full rounded-full bg-pb-khaki transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="p-5 sm:p-8">
              <h3 className="whitespace-pre-wrap break-words text-lg font-bold leading-8 text-slate-800 sm:text-xl sm:leading-9">
                {currentQuestion.question_text}
              </h3>

              <div className="mt-6 space-y-3">
                {(Array.isArray(currentQuestion.options) ? currentQuestion.options : []).map((option) => {
                  const isSelected = selectedOption === option.option_label;
                  const isCorrectOption =
                    answerChecked && option.option_label === currentQuestion.correct_option;
                  const isIncorrectSelection =
                    answerChecked && isSelected && option.option_label !== currentQuestion.correct_option;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setSelectedOption(option.option_label)}
                      disabled={answerChecked}
                      aria-pressed={isSelected}
                      className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition ${
                        isCorrectOption
                          ? "border-green-600 bg-green-50 text-green-900"
                          : isIncorrectSelection
                            ? "border-red-500 bg-red-50 text-red-900"
                            : isSelected
                              ? "border-pb-khaki bg-pb-light text-pb-green"
                              : "border-pb-border hover:border-pb-khaki hover:bg-[#fbfaf7]"
                      } disabled:cursor-default`}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pb-green text-sm font-extrabold text-white">
                        {option.option_label}
                      </span>
                      <span className="whitespace-pre-wrap break-words pt-1 text-sm leading-6 sm:text-base">
                        {option.option_text}
                      </span>
                    </button>
                  );
                })}
              </div>

              {!answerChecked ? (
                <button
                  type="button"
                  onClick={checkAnswer}
                  disabled={!selectedOption}
                  className="mt-6 w-full rounded-xl bg-pb-green px-5 py-3 font-bold text-white transition hover:bg-pb-khaki disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  Check Answer
                </button>
              ) : (
                <div
                  className={`mt-6 rounded-xl border p-5 ${
                    selectedOption === currentQuestion.correct_option
                      ? "border-green-200 bg-green-50"
                      : "border-red-200 bg-red-50"
                  }`}
                  role="status"
                >
                  <p
                    className={`font-extrabold ${
                      selectedOption === currentQuestion.correct_option
                        ? "text-green-800"
                        : "text-red-800"
                    }`}
                  >
                    {selectedOption === currentQuestion.correct_option
                      ? "Correct Answer"
                      : "Incorrect Answer"}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-800">
                    Correct Answer: {currentQuestion.correct_option}
                  </p>
                  {currentQuestion.explanation && (
                    <div className="mt-3">
                      <p className="text-sm font-bold text-pb-green">Explanation:</p>
                      <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                        {currentQuestion.explanation}
                      </p>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={retryQuestion}
                    className="mt-4 rounded-lg border border-[#d8d1bf] bg-white px-4 py-2 text-sm font-bold text-pb-green hover:bg-pb-light"
                  >
                    Try Again
                  </button>
                </div>
              )}

              <div className="mt-8 flex flex-col gap-3 border-t border-pb-border-soft pt-5 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={() => moveToQuestion(currentQuestionIndex - 1)}
                  disabled={currentQuestionIndex === 0}
                  className="rounded-xl border border-[#d8d1bf] px-5 py-3 text-sm font-bold text-pb-green hover:bg-pb-light disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ← Previous
                </button>
                <p className="text-center text-sm font-bold text-slate-500">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </p>
                {currentQuestionIndex < questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => moveToQuestion(currentQuestionIndex + 1)}
                    className="rounded-xl bg-pb-green px-5 py-3 text-sm font-bold text-white hover:bg-pb-khaki"
                  >
                    Next →
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCompleted(true)}
                    className="rounded-xl bg-pb-khaki px-5 py-3 text-sm font-bold text-white hover:bg-pb-khaki"
                  >
                    Finish
                  </button>
                )}
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}

export default PYQPage;
