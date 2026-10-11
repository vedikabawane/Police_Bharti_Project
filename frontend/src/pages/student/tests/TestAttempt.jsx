import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  getStudentTestAttempt,
  getTestAttemptResult,
  saveStudentTestAnswer,
  submitTestAttempt,
} from "../../../services/testService";

function formatTime(seconds) {
  const safeSeconds = Math.max(0, seconds || 0);
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

function answersDiffer(intendedAnswers, confirmedAnswers, questionId) {
  return (Object.hasOwn(intendedAnswers, questionId) ? intendedAnswers[questionId] : null)
    !== (Object.hasOwn(confirmedAnswers, questionId) ? confirmedAnswers[questionId] : null);
}

function getSaveFailure(error, timerExpired) {
  const status = error.response?.status;
  const backendMessage = error.response?.data?.message || "";
  const expired = timerExpired || /time has expired|attempt has expired|test time.*ended/i.test(backendMessage);
  if (expired) {
    return { expired: true, message: "चाचणीची वेळ संपली. हे उत्तर जतन करता आले नाही." };
  }
  if (!error.response) {
    return { expired: false, message: "नेटवर्कशी संपर्क होत नाही. इंटरनेट तपासून पुन्हा प्रयत्न करा." };
  }
  if (status === 401) return { expired: false, message: "तुमचे सत्र संपले आहे. पुन्हा साइन इन करा; हे उत्तर जतन झालेले नाही." };
  if (status === 403) return { expired: false, message: "या उत्तरासाठी परवानगी नाही. हे उत्तर जतन झालेले नाही." };
  if (status === 404) return { expired: false, message: "चाचणी सत्र सापडले नाही. हे उत्तर जतन झालेले नाही." };
  if (status === 409) return { expired: false, message: "चाचणी सत्र आता उत्तरे स्वीकारत नाही. हे उत्तर जतन झालेले नाही." };
  if (status === 422) return { expired: false, message: "हे उत्तर स्वीकारले गेले नाही. पर्याय पुन्हा निवडून प्रयत्न करा." };
  if (status >= 500) return { expired: false, message: "सर्व्हरमध्ये अडचण आली. हे उत्तर जतन झालेले नाही; पुन्हा प्रयत्न करा." };
  return { expired: false, message: "उत्तर जतन झाले नाही. पुन्हा प्रयत्न करा." };
}

function TestAttempt() {
  const { testId, attemptId: routeAttemptId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const attemptId = routeAttemptId || searchParams.get("attempt_id");
  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [savedAnswers, setSavedAnswers] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [timerDeadline, setTimerDeadline] = useState(null);
  const [loading, setLoading] = useState(Boolean(attemptId));
  const [loadError, setLoadError] = useState("");
  const [answerStatus, setAnswerStatus] = useState({});
  const [answerErrors, setAnswerErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [saveLocked, setSaveLocked] = useState(false);
  const [showSubmitConfirmation, setShowSubmitConfirmation] = useState(false);
  const [navigationWarning, setNavigationWarning] = useState(null);
  const answersRef = useRef({});
  const savedAnswersRef = useRef({});
  const saveQueuesRef = useRef({});
  const navigationAcknowledgementsRef = useRef({});
  const expiredSaveQuestionsRef = useRef(new Set());
  const remainingSecondsRef = useRef(0);
  const timerDeadlineRef = useRef(null);
  const submittingRef = useRef(false);
  const autoSubmitAttemptRef = useRef(null);

  const loadAttempt = useCallback(async () => {
    if (!attemptId) return;
    setLoading(true);
    setLoadError("");
    try {
      const response = await getStudentTestAttempt(attemptId);
      const data = response?.data;
      if (!response?.success || !data || String(data.test_id) !== String(testId) || !Array.isArray(data.questions)) {
        throw new Error("चाचणी सत्राची माहिती मिळाली नाही.");
      }
      const orderedQuestions = [...data.questions].sort((first, second) => first.question_number - second.question_number);
      const savedAnswers = Object.fromEntries(
        orderedQuestions
          .filter((question) => question.selected_answer)
          .map((question) => [question.question_id, question.selected_answer]),
      );
      answersRef.current = savedAnswers;
      savedAnswersRef.current = savedAnswers;
      setSelectedAnswers(savedAnswers);
      setSavedAnswers(savedAnswers);
      setAnswerStatus(Object.fromEntries(Object.keys(savedAnswers).map((questionId) => [questionId, "saved"])));
      setQuestions(orderedQuestions);
      setAttempt(data);
      const seconds = Math.max(0, Number(data.remaining_seconds) || 0);
      setRemainingSeconds(seconds);
      remainingSecondsRef.current = seconds;
      const deadline = Date.now() + seconds * 1000;
      timerDeadlineRef.current = deadline;
      setTimerDeadline(deadline);
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      setLoadError(message || "चाचणी सत्र लोड करता आले नाही. पुन्हा प्रयत्न करा.");
    } finally {
      setLoading(false);
    }
  }, [attemptId, testId]);

  useEffect(() => {
    if (attemptId) Promise.resolve().then(loadAttempt);
  }, [attemptId, loadAttempt]);

  useEffect(() => {
    if (timerDeadline === null || timerDeadline <= Date.now()) return undefined;
    const intervalId = setInterval(() => {
      const nextValue = Math.max(0, Math.ceil((timerDeadline - Date.now()) / 1000));
      setRemainingSeconds(nextValue);
      remainingSecondsRef.current = nextValue;
      if (nextValue === 0) {
        clearInterval(intervalId);
        setTimerDeadline(null);
      }
    }, 1000);
    return () => clearInterval(intervalId);
  }, [timerDeadline]);

  const saveAnswer = useCallback((questionId, { force = false } = {}) => {
    if (!attemptId) return Promise.resolve(false);
    if (saveQueuesRef.current[questionId]) return saveQueuesRef.current[questionId];

    const worker = (async () => {
      let forceCurrent = force;
      while (true) {
        const intendedOption = Object.hasOwn(answersRef.current, questionId)
          ? answersRef.current[questionId]
          : null;
        const confirmedOption = Object.hasOwn(savedAnswersRef.current, questionId)
          ? savedAnswersRef.current[questionId]
          : null;
        if (!forceCurrent && intendedOption === confirmedOption) return true;
        forceCurrent = false;
        setAnswerErrors((previous) => ({ ...previous, [questionId]: "" }));
        setAnswerStatus((previous) => ({ ...previous, [questionId]: "saving" }));

        try {
          const response = await saveStudentTestAnswer(attemptId, {
            question_id: questionId,
            selected_option: intendedOption,
          });
          if (!response?.success) throw Object.assign(new Error("Answer save failed."), { response: { status: 500 } });
        } catch (error) {
          const deadlineReached = timerDeadlineRef.current !== null && Date.now() >= timerDeadlineRef.current;
          const failure = getSaveFailure(error, remainingSecondsRef.current <= 0 || deadlineReached);
          const latestOption = Object.hasOwn(answersRef.current, questionId)
            ? answersRef.current[questionId]
            : null;
          const terminalFailure = failure.expired || error.response?.status === 409;
          if (terminalFailure) {
            expiredSaveQuestionsRef.current.add(questionId);
            setSaveLocked(true);
          }
          if (!terminalFailure && latestOption !== intendedOption) continue;
          setAnswerStatus((previous) => ({ ...previous, [questionId]: terminalFailure ? "expired" : "error" }));
          setAnswerErrors((previous) => ({ ...previous, [questionId]: failure.message }));
          return false;
        }

        const confirmedAnswers = { ...savedAnswersRef.current };
        if (intendedOption === null) delete confirmedAnswers[questionId];
        else confirmedAnswers[questionId] = intendedOption;
        savedAnswersRef.current = confirmedAnswers;
        setSavedAnswers(confirmedAnswers);

        const latestOption = Object.hasOwn(answersRef.current, questionId)
          ? answersRef.current[questionId]
          : null;
        if (latestOption === intendedOption) {
          if (intendedOption === null) {
            const latestAnswers = { ...answersRef.current };
            delete latestAnswers[questionId];
            answersRef.current = latestAnswers;
            setSelectedAnswers(latestAnswers);
          }
          delete navigationAcknowledgementsRef.current[questionId];
          setAnswerErrors((previous) => ({ ...previous, [questionId]: "" }));
          setAnswerStatus((previous) => ({ ...previous, [questionId]: intendedOption === null ? "cleared" : "saved" }));
          return true;
        }
      }
    })();

    const queuedWorker = worker.finally(() => {
      if (saveQueuesRef.current[questionId] === queuedWorker) delete saveQueuesRef.current[questionId];
    });
    saveQueuesRef.current[questionId] = queuedWorker;
    return queuedWorker;
  }, [attemptId]);

  const chooseAnswer = (questionId, optionLabel) => {
    if (!canAnswer || answersRef.current[questionId] === optionLabel) return;
    const nextAnswers = { ...answersRef.current, [questionId]: optionLabel };
    answersRef.current = nextAnswers;
    delete navigationAcknowledgementsRef.current[questionId];
    setSelectedAnswers(nextAnswers);
    saveAnswer(questionId);
  };

  const retryAnswer = (questionId) => {
    if (!canAnswer || expiredSaveQuestionsRef.current.has(questionId)) return Promise.resolve(false);
    return saveAnswer(questionId, { force: true });
  };

  const clearAnswer = (questionId) => {
    if (!canAnswer || !answersRef.current[questionId]) return;
    const nextAnswers = { ...answersRef.current, [questionId]: null };
    answersRef.current = nextAnswers;
    delete navigationAcknowledgementsRef.current[questionId];
    setSelectedAnswers(nextAnswers);
    saveAnswer(questionId);
  };

  const hasUnsavedAnswers = useMemo(
    () => questions.some((question) => answersDiffer(selectedAnswers, savedAnswers, question.question_id)),
    [questions, savedAnswers, selectedAnswers],
  );

  const answeredCount = useMemo(
    () => questions.reduce((count, question) => count + (
      selectedAnswers[question.question_id] &&
      savedAnswers[question.question_id] === selectedAnswers[question.question_id] ? 1 : 0
    ), 0),
    [questions, savedAnswers, selectedAnswers],
  );
  const currentQuestion = questions[currentQuestionIndex];
  const isExpired = Boolean(attempt?.is_expired) || remainingSeconds <= 0;
  const canAnswer = attempt?.status === "in_progress" && attempt?.test_active && !isExpired && !saveLocked;
  const hasSavingAnswers = Object.values(answerStatus).some((status) => status === "saving");
  const unansweredCount = Math.max(0, questions.length - answeredCount);

  const navigateToQuestion = (targetIndex) => {
    if (targetIndex === currentQuestionIndex) return;
    const questionId = currentQuestion?.question_id;
    if (questionId && answersDiffer(answersRef.current, savedAnswersRef.current, questionId)) {
      const intendedOption = Object.hasOwn(answersRef.current, questionId) ? answersRef.current[questionId] : null;
      if (navigationAcknowledgementsRef.current[questionId] !== intendedOption) {
        setNavigationWarning({ questionId, targetIndex });
        return;
      }
    }
    setCurrentQuestionIndex(targetIndex);
  };

  const continueNavigationWithoutSaving = () => {
    if (!navigationWarning) return;
    const { questionId, targetIndex } = navigationWarning;
    navigationAcknowledgementsRef.current[questionId] = Object.hasOwn(answersRef.current, questionId)
      ? answersRef.current[questionId]
      : null;
    setCurrentQuestionIndex(targetIndex);
    setNavigationWarning(null);
  };

  const retryPendingNavigation = async () => {
    if (!navigationWarning) return;
    const { questionId, targetIndex } = navigationWarning;
    const saved = await retryAnswer(questionId);
    if (!saved) return;
    setCurrentQuestionIndex(targetIndex);
    setNavigationWarning(null);
  };

  const retryAllUnsavedAnswers = async () => {
    const unsavedQuestionIds = questions
      .filter((question) => answersDiffer(answersRef.current, savedAnswersRef.current, question.question_id))
      .map((question) => question.question_id);
    await Promise.all(unsavedQuestionIds.map((questionId) => retryAnswer(questionId)));
  };

  useEffect(() => {
    if (!hasUnsavedAnswers) return undefined;
    const warnBeforeLeaving = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [hasUnsavedAnswers]);

  const finishAttempt = useCallback(async ({ automatic = false, allowUnsaved = false } = {}) => {
    if (!attemptId || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setSubmitError("");
    try {
      await Promise.allSettled(Object.values(saveQueuesRef.current));
      const hasUnsavedChanges = questions.some((question) =>
        answersDiffer(answersRef.current, savedAnswersRef.current, question.question_id),
      );
      if (!automatic && !allowUnsaved && hasUnsavedChanges) {
        throw new Error("काही उत्तरे जतन झालेली नाहीत. ती पुन्हा जतन करा आणि सबमिट करा.");
      }

      const response = await submitTestAttempt(attemptId);
      if (!response?.success || !response.data) throw new Error(response?.message || "चाचणी सबमिट झाली नाही.");
      navigate(`/student/tests/${testId}/result/${attemptId}`, { replace: true });
    } catch {
      try {
        const resultResponse = await getTestAttemptResult(attemptId);
        if (resultResponse?.success && resultResponse.data) {
          navigate(`/student/tests/${testId}/result/${attemptId}`, { replace: true });
          return;
        }
      } catch {
        // Keep the active attempt and local answers visible so the student can retry.
      }
      setSubmitError("चाचणी सबमिट करता आली नाही. जतन केलेली उत्तरे सुरक्षित आहेत; पुन्हा प्रयत्न करा.");
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
      setShowSubmitConfirmation(false);
    }
  }, [attemptId, navigate, questions, testId]);

  useEffect(() => {
    if (attempt?.status !== "in_progress" || remainingSeconds !== 0 || loading || !attemptId) return;
    if (autoSubmitAttemptRef.current === attemptId) return;
    autoSubmitAttemptRef.current = attemptId;
    finishAttempt({ automatic: true });
  }, [attempt, attemptId, finishAttempt, loading, remainingSeconds]);

  if (!attemptId) {
    return (
      <main className="min-h-screen bg-pb-light px-4 py-10 sm:px-6">
        <section className="mx-auto max-w-xl rounded-2xl bg-white p-7 text-center shadow-sm">
          <h1 className="text-xl font-extrabold text-pb-green">चाचणी सत्र उपलब्ध नाही.</h1>
          <p className="mt-2 text-sm text-slate-600">चाचणीच्या माहिती पानावरून चाचणी सुरू करा.</p>
          <Link to={`/student/tests/${testId}`} className="mt-5 inline-flex rounded-xl bg-pb-green px-5 py-3 text-sm font-bold text-white">चाचणीच्या माहितीकडे जा</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-pb-light px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-5">
        <header className="sticky top-[4.5rem] z-20 flex flex-col gap-3 rounded-2xl bg-white/95 p-4 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="min-w-0">
            <p className="text-sm font-bold text-pb-khaki">चाचणी सत्र · {attemptId}</p>
            <h1 className="mt-1 break-words text-xl font-extrabold text-pb-green sm:text-2xl">{attempt?.test_title || "चाचणी"}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <div role="timer" aria-live="off" className={`rounded-xl px-4 py-2 text-lg font-extrabold tabular-nums ${isExpired ? "bg-red-50 text-red-700" : "bg-pb-green text-white"}`}>
              {attempt ? (isExpired ? "00:00" : formatTime(remainingSeconds)) : "--:--"}
            </div>
            <span className="rounded-xl bg-green-50 px-3 py-2 text-sm font-bold text-pb-green">उत्तर दिले: {answeredCount}</span>
            <span className="rounded-xl bg-pb-light px-3 py-2 text-sm font-bold text-pb-khaki">बाकी: {Math.max(0, questions.length - answeredCount)}</span>
          </div>
        </header>

        {isExpired && attempt && <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">वेळ संपली. उत्तरे बदलणे बंद केले आहे.</p>}
        {attempt && !attempt.test_active && <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">ही चाचणी निष्क्रिय आहे. उत्तरे बदलता येणार नाहीत.</p>}
        {hasSavingAnswers && <p role="status" className="text-sm font-semibold text-pb-khaki">तुमची उत्तरे जतन होत आहेत...</p>}
        {submitError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><p className="font-semibold">{submitError}</p><button type="button" onClick={() => finishAttempt({ automatic: isExpired, allowUnsaved: hasUnsavedAnswers })} disabled={submitting} className="mt-2 font-bold underline disabled:opacity-50">पुन्हा सबमिट करा</button></div>}

        {loading ? (
          <div role="status" aria-live="polite" className="rounded-2xl bg-white p-10 text-center text-sm font-medium text-slate-600 shadow-sm"><span className="mx-auto mb-3 block h-9 w-9 animate-spin rounded-full border-4 border-pb-border border-t-pb-khaki" />चाचणी सत्र लोड होत आहे...</div>
        ) : loadError ? (
          <div role="alert" className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm"><p className="font-bold text-red-700">{loadError}</p><button type="button" onClick={loadAttempt} className="mt-4 rounded-xl bg-pb-green px-5 py-3 text-sm font-bold text-white hover:bg-pb-khaki">पुन्हा प्रयत्न करा</button></div>
        ) : questions.length === 0 ? (
          <section className="rounded-2xl bg-white p-8 text-center shadow-sm"><h2 className="font-bold text-pb-green">या चाचणीत प्रश्न उपलब्ध नाहीत.</h2></section>
        ) : (
          <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
            <section className="min-w-0 rounded-2xl bg-white p-5 shadow-sm sm:p-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-extrabold text-pb-khaki">Question {currentQuestion.question_number} of {questions.length}</p>
                <span className="rounded-full bg-pb-light px-3 py-1.5 text-xs font-bold text-pb-green">गुण: {currentQuestion.marks}</span>
              </div>
              <h2 className="mt-5 whitespace-pre-wrap break-words text-lg font-bold leading-8 text-pb-green sm:text-xl sm:leading-9">{currentQuestion.question_text}</h2>
              <div className="mt-6 space-y-3">
                {currentQuestion.options.map((option) => {
                  const isSelected = selectedAnswers[currentQuestion.question_id] === option.option_label;
                  return (
                    <button key={option.option_label} type="button" onClick={() => chooseAnswer(currentQuestion.question_id, option.option_label)} disabled={!canAnswer} aria-pressed={isSelected} className={`flex min-h-14 w-full items-start gap-3 rounded-xl border p-4 text-left transition ${isSelected ? "border-pb-khaki bg-pb-light text-pb-green" : "border-pb-border hover:border-pb-khaki hover:bg-[#fbfaf7]"} disabled:cursor-not-allowed disabled:opacity-75`}>
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pb-green text-sm font-extrabold text-white">{option.option_label}</span>
                      <span className="whitespace-pre-wrap break-words pt-1 text-sm leading-6 sm:text-base">{option.option_text}</span>
                    </button>
                  );
                })}
              </div>
              {selectedAnswers[currentQuestion.question_id] && canAnswer && <button type="button" onClick={() => clearAnswer(currentQuestion.question_id)} disabled={answerStatus[currentQuestion.question_id] === "saving"} className="mt-4 rounded-lg border border-[#d8d1bf] px-4 py-2 text-sm font-bold text-pb-green hover:bg-pb-light disabled:cursor-not-allowed disabled:opacity-50">Clear answer</button>}
              {answerStatus[currentQuestion.question_id] === "saving" && <p role="status" className="mt-4 text-sm font-semibold text-pb-khaki">उत्तर जतन होत आहे... (Saving...)</p>}
              {answerErrors[currentQuestion.question_id] && <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><p className="font-semibold">⚠ उत्तर जतन झाले नाही (Not saved): {answerErrors[currentQuestion.question_id]}</p><button type="button" onClick={() => retryAnswer(currentQuestion.question_id)} disabled={!canAnswer} className="mt-2 font-bold underline disabled:opacity-50">पुन्हा जतन करा (Retry)</button></div>}
              {(answerStatus[currentQuestion.question_id] === "saved" || answerStatus[currentQuestion.question_id] === "cleared") && <p role="status" className="mt-4 text-sm font-semibold text-pb-green">✓ उत्तर जतन झाले (Saved)</p>}
              <div className="mt-8 flex flex-col gap-3 border-t border-pb-border-soft pt-5 sm:flex-row sm:items-center sm:justify-between">
                <button type="button" onClick={() => navigateToQuestion(currentQuestionIndex - 1)} disabled={currentQuestionIndex === 0} className="min-h-11 rounded-xl border border-[#d8d1bf] px-5 py-3 text-sm font-bold text-pb-green hover:bg-pb-light disabled:cursor-not-allowed disabled:opacity-40">Previous</button>
                <button type="button" onClick={() => navigateToQuestion(currentQuestionIndex + 1)} disabled={currentQuestionIndex === questions.length - 1} className="min-h-11 rounded-xl bg-pb-green px-5 py-3 text-sm font-bold text-white hover:bg-pb-khaki disabled:cursor-not-allowed disabled:opacity-40">Next</button>
              </div>
            </section>

            <aside className="h-fit rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="text-sm font-extrabold text-pb-green">Question navigation</h2>
              <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs font-semibold text-slate-600" aria-label="Question state legend">
                <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-pb-green" />Current</span>
                <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm border border-green-200 bg-green-50" />Answered</span>
                <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm border border-pb-border bg-white" />Unanswered</span>
              </div>
              <div className="mt-4 grid grid-cols-5 gap-2 sm:grid-cols-8 lg:grid-cols-4">
                {questions.map((question, index) => {
                  const isCurrent = index === currentQuestionIndex;
                  const isAnswered = Boolean(selectedAnswers[question.question_id]) && savedAnswers[question.question_id] === selectedAnswers[question.question_id];
                  return <button key={question.question_id} type="button" onClick={() => navigateToQuestion(index)} aria-current={isCurrent ? "step" : undefined} aria-label={`Question ${question.question_number}${isCurrent ? ", current" : ""}, ${isAnswered ? "answered" : "unanswered"}`} className={`min-h-11 rounded-lg border text-sm font-extrabold transition ${isCurrent ? "border-pb-khaki bg-pb-green text-white" : isAnswered ? "border-green-200 bg-green-50 text-pb-green" : "border-pb-border bg-white text-slate-500 hover:border-pb-khaki"}`}>{question.question_number}</button>;
                })}
              </div>
              <p className="mt-5 border-t border-pb-border-soft pt-4 text-xs leading-5 text-slate-500">सबमिट केल्यानंतर तुमची उत्तरे बदलता येणार नाहीत.</p>
              <button type="button" onClick={() => setShowSubmitConfirmation(true)} disabled={submitting || attempt?.status !== "in_progress"} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-pb-green px-4 py-3 text-sm font-bold text-white hover:bg-pb-khaki disabled:cursor-not-allowed disabled:opacity-60">
                {submitting ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />सबमिट होत आहे...</> : "चाचणी सबमिट करा"}
              </button>
              {!canAnswer && !isExpired && attempt?.status !== "in_progress" && <p className="mt-3 text-sm font-semibold text-amber-800">हा प्रयत्न आधीच पूर्ण झाला आहे.</p>}
            </aside>
          </div>
        )}
      </div>

      {navigationWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <section role="dialog" aria-modal="true" aria-labelledby="navigation-warning-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl sm:p-7">
            <h2 id="navigation-warning-title" className="text-lg font-extrabold text-pb-green">उत्तर जतन झालेले नाही (Answer not saved)</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">हे उत्तर आत्ता जतन झालेले नाही. पुढे गेल्यास ते रीफ्रेश केल्यानंतर परत मिळेलच असे नाही.</p>
            {answerErrors[navigationWarning.questionId] && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{answerErrors[navigationWarning.questionId]}</p>}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setNavigationWarning(null)} className="rounded-xl border border-[#d8d1bf] px-4 py-3 text-sm font-bold text-pb-green hover:bg-pb-light">Stay here</button>
              <button type="button" onClick={continueNavigationWithoutSaving} className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900 hover:bg-amber-100">Continue without saving</button>
              <button type="button" onClick={retryPendingNavigation} disabled={!canAnswer || answerStatus[navigationWarning.questionId] === "saving"} className="rounded-xl bg-pb-green px-4 py-3 text-sm font-bold text-white hover:bg-pb-khaki disabled:cursor-not-allowed disabled:opacity-50">Retry</button>
            </div>
          </section>
        </div>
      )}

      {showSubmitConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !submitting) setShowSubmitConfirmation(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="submit-confirmation-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl sm:p-7">
            <h2 id="submit-confirmation-title" className="text-lg font-extrabold text-pb-green">तुम्हाला ही चाचणी सबमिट करायची आहे का?</h2>
            <p className="mt-4 text-sm text-slate-600">उत्तर दिलेले प्रश्न: <strong>{answeredCount}</strong></p>
            <p className="mt-1 text-sm text-slate-600">अनुत्तरित प्रश्न: <strong>{unansweredCount}</strong></p>
            {hasSavingAnswers && <p role="status" className="mt-3 text-sm font-semibold text-pb-khaki">उत्तरे जतन होत आहेत...</p>}
            {hasUnsavedAnswers && (
              <div role="alert" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                <p className="font-bold">काही उत्तरे जतन झालेली नाहीत (You have unsaved answers).</p>
                <p className="mt-1">Continue submit निवडल्यास फक्त सर्व्हरवर जतन केलेली उत्तरेच सबमिट होतील. न जतन केलेली उत्तरे पाठवली जाणार नाहीत.</p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <button type="button" onClick={retryAllUnsavedAnswers} disabled={!canAnswer || hasSavingAnswers} className="rounded-lg border border-amber-400 px-3 py-2 font-bold hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50">Retry saving</button>
                  <button type="button" onClick={() => finishAttempt({ allowUnsaved: true })} disabled={submitting} className="rounded-lg bg-pb-green px-3 py-2 font-bold text-white hover:bg-pb-khaki disabled:cursor-not-allowed disabled:opacity-50">Continue submit</button>
                </div>
              </div>
            )}
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setShowSubmitConfirmation(false)} disabled={submitting} className="rounded-xl border border-[#d8d1bf] px-5 py-3 text-sm font-bold text-pb-green hover:bg-pb-light disabled:opacity-50">परत जा</button>
              {!hasUnsavedAnswers && <button type="button" onClick={() => finishAttempt()} disabled={submitting || hasSavingAnswers} className="inline-flex items-center justify-center gap-2 rounded-xl bg-pb-green px-5 py-3 text-sm font-bold text-white hover:bg-pb-khaki disabled:cursor-not-allowed disabled:opacity-60">
                {submitting ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />सबमिट होत आहे...</> : "होय, सबमिट करा"}
              </button>}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

export default TestAttempt;
