import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  getStudentTestAttempt,
  getTestAttemptResult,
  saveStudentTestAnswer,
  submitTestAttempt,
} from "../../../services/testService";

/* ---------- SVG ICON SET ---------- */
const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.8",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": "true",
};

const ClipboardIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M8 4H5.5A1.5 1.5 0 0 0 4 5.5v14A1.5 1.5 0 0 0 5.5 21h13a1.5 1.5 0 0 0 1.5-1.5v-14A1.5 1.5 0 0 0 18.5 4H16" />
    <path d="M9 3h6v4H9zM8 13l2.5 2.5L16 10" />
  </svg>
);
const TimerIcon = (p) => (
  <svg {...iconProps} {...p}>
    <circle cx="12" cy="13" r="8" />
    <path d="M12 9v4l2 2M9 2h6" />
  </svg>
);
const CheckCircleIcon = (p) => (
  <svg {...iconProps} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m8.5 12 2.5 2.5L16 9.5" />
  </svg>
);
const XCircleIcon = (p) => (
  <svg {...iconProps} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m9 9 6 6M15 9l-6 6" />
  </svg>
);
const AlertIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M10.3 3.9 2.4 17a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9v4M12 17h.01" />
  </svg>
);
const RefreshIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M21 12a9 9 0 1 1-3-6.7" />
    <path d="M21 4v5h-5" />
  </svg>
);
const SpinnerIcon = (p) => (
  <svg {...iconProps} strokeWidth="2.4" {...p}>
    <path d="M21 12a9 9 0 1 1-6.2-8.5" />
  </svg>
);
const ChevronLeftIcon = (p) => (
  <svg {...iconProps} strokeWidth="2.2" {...p}>
    <path d="m15 6-6 6 6 6" />
  </svg>
);
const ChevronRightIcon = (p) => (
  <svg {...iconProps} strokeWidth="2.2" {...p}>
    <path d="m9 6 6 6-6 6" />
  </svg>
);
const SendIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M4 4h16v12H8l-4 4Z" />
    <path d="M8 9h8M8 12h5" />
  </svg>
);
const ListIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M8 6h13M8 12h13M8 18h13" />
    <path d="M3 6h.01M3 12h.01M3 18h.01" />
  </svg>
);
const SaveIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M5 3h11l3 3v15H5z" />
    <path d="M8 3v6h7V3M8 17h8" />
  </svg>
);
const ClockIcon = (p) => (
  <svg {...iconProps} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);
const AwardIcon = (p) => (
  <svg {...iconProps} {...p}>
    <circle cx="12" cy="9" r="5" />
    <path d="m8.5 13.5-2 7 5.5-3 5.5 3-2-7" />
  </svg>
);
const LockIcon = (p) => (
  <svg {...iconProps} {...p}>
    <rect x="4" y="10" width="16" height="11" rx="2.5" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </svg>
);
const ArrowLeftIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M19 12H5" />
    <path d="m11 18-6-6 6-6" />
  </svg>
);

/* ---------- UTILITIES (unchanged) ---------- */
function formatTime(seconds) {
  const safeSeconds = Math.max(0, seconds || 0);
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

function answersDiffer(intendedAnswers, confirmedAnswers, questionId) {
  return (
    (Object.hasOwn(intendedAnswers, questionId) ? intendedAnswers[questionId] : null) !==
    (Object.hasOwn(confirmedAnswers, questionId) ? confirmedAnswers[questionId] : null)
  );
}

function getSaveFailure(error, timerExpired) {
  const status = error.response?.status;
  const backendMessage = error.response?.data?.message || "";
  const expired =
    timerExpired ||
    /time has expired|attempt has expired|test time.*ended/i.test(backendMessage);
  if (expired) {
    return {
      expired: true,
      message: "चाचणीची वेळ संपली. हे उत्तर जतन करता आले नाही.",
    };
  }
  if (!error.response) {
    return {
      expired: false,
      message: "नेटवर्कशी संपर्क होत नाही. इंटरनेट तपासून पुन्हा प्रयत्न करा.",
    };
  }
  if (status === 401)
    return {
      expired: false,
      message:
        "तुमचे सत्र संपले आहे. पुन्हा साइन इन करा; हे उत्तर जतन झालेले नाही.",
    };
  if (status === 403)
    return {
      expired: false,
      message: "या उत्तरासाठी परवानगी नाही. हे उत्तर जतन झालेले नाही.",
    };
  if (status === 404)
    return {
      expired: false,
      message: "चाचणी सत्र सापडले नाही. हे उत्तर जतन झालेले नाही.",
    };
  if (status === 409)
    return {
      expired: false,
      message: "चाचणी सत्र आता उत्तरे स्वीकारत नाही. हे उत्तर जतन झालेले नाही.",
    };
  if (status === 422)
    return {
      expired: false,
      message: "हे उत्तर स्वीकारले गेले नाही. पर्याय पुन्हा निवडून प्रयत्न करा.",
    };
  if (status >= 500)
    return {
      expired: false,
      message:
        "सर्व्हरमध्ये अडचण आली. हे उत्तर जतन झालेले नाही; पुन्हा प्रयत्न करा.",
    };
  return { expired: false, message: "उत्तर जतन झाले नाही. पुन्हा प्रयत्न करा." };
}

/* ---------- ANIMATIONS ---------- */
function AnimationStyles() {
  return (
    <style>{`
      @keyframes blobMove {
        0%, 100% { transform: translate(0px, 0px) scale(1); }
        33% { transform: translate(40px, -60px) scale(1.12); }
        66% { transform: translate(-30px, 30px) scale(0.94); }
      }
      @keyframes fadeUp {
        from { opacity: 0; transform: translateY(12px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes gradientPan {
        0%, 100% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
      }
      @keyframes softGlow {
        0%, 100% { opacity: 0.45; transform: scale(1); }
        50% { opacity: 0.85; transform: scale(1.12); }
      }
      @keyframes spinSoft { to { transform: rotate(360deg); } }
      @keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes dialogIn {
        from { opacity: 0; transform: translateY(10px) scale(0.96); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      @keyframes pulseSoft {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.6; }
      }
      .animate-blob { animation: blobMove 22s ease-in-out infinite; }
      .delay-2 { animation-delay: 4s; }
      .delay-4 { animation-delay: 8s; }
      .animate-fade-up { animation: fadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }
      .animate-gradient { background-size: 220% 220%; animation: gradientPan 9s ease infinite; }
      .animate-soft-glow { animation: softGlow 4.5s ease-in-out infinite; }
      .animate-spin-soft { animation: spinSoft 0.9s linear infinite; }
      .animate-overlay-in { animation: overlayIn 0.2s ease-out both; }
      .animate-dialog-in { animation: dialogIn 0.28s cubic-bezier(0.22, 1, 0.36, 1) both; }
      .animate-pulse-soft { animation: pulseSoft 1.8s ease-in-out infinite; }
      @media (prefers-reduced-motion: reduce) {
        .animate-blob, .animate-fade-up, .animate-gradient,
        .animate-soft-glow, .animate-spin-soft,
        .animate-overlay-in, .animate-dialog-in, .animate-pulse-soft { animation: none !important; }
      }
    `}</style>
  );
}

function AnimatedBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-gradient-to-br from-pb-light via-white to-pb-light" />
      <div
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(15,23,42,0.06) 1px, transparent 0)",
          backgroundSize: "26px 26px",
        }}
      />
      <div className="animate-blob absolute -top-32 -left-28 h-80 w-80 rounded-full bg-pb-khaki/20 blur-3xl" />
      <div className="animate-blob delay-2 absolute top-1/3 -right-28 h-72 w-72 rounded-full bg-pb-green/12 blur-3xl" />
      <div className="animate-blob delay-4 absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-pb-khaki/15 blur-3xl" />
    </div>
  );
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
      if (
        !response?.success ||
        !data ||
        String(data.test_id) !== String(testId) ||
        !Array.isArray(data.questions)
      ) {
        throw new Error("चाचणी सत्राची माहिती मिळाली नाही.");
      }
      const orderedQuestions = [...data.questions].sort(
        (first, second) => first.question_number - second.question_number,
      );
      const savedAnswers = Object.fromEntries(
        orderedQuestions
          .filter((question) => question.selected_answer)
          .map((question) => [question.question_id, question.selected_answer]),
      );
      answersRef.current = savedAnswers;
      savedAnswersRef.current = savedAnswers;
      setSelectedAnswers(savedAnswers);
      setSavedAnswers(savedAnswers);
      setAnswerStatus(
        Object.fromEntries(
          Object.keys(savedAnswers).map((questionId) => [questionId, "saved"]),
        ),
      );
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

  const saveAnswer = useCallback(
    (questionId, { force = false } = {}) => {
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
            if (!response?.success)
              throw Object.assign(new Error("Answer save failed."), {
                response: { status: 500 },
              });
          } catch (error) {
            const deadlineReached =
              timerDeadlineRef.current !== null &&
              Date.now() >= timerDeadlineRef.current;
            const failure = getSaveFailure(
              error,
              remainingSecondsRef.current <= 0 || deadlineReached,
            );
            const latestOption = Object.hasOwn(answersRef.current, questionId)
              ? answersRef.current[questionId]
              : null;
            const terminalFailure =
              failure.expired || error.response?.status === 409;
            if (terminalFailure) {
              expiredSaveQuestionsRef.current.add(questionId);
              setSaveLocked(true);
            }
            if (!terminalFailure && latestOption !== intendedOption) continue;
            setAnswerStatus((previous) => ({
              ...previous,
              [questionId]: terminalFailure ? "expired" : "error",
            }));
            setAnswerErrors((previous) => ({
              ...previous,
              [questionId]: failure.message,
            }));
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
            setAnswerStatus((previous) => ({
              ...previous,
              [questionId]: intendedOption === null ? "cleared" : "saved",
            }));
            return true;
          }
        }
      })();

      const queuedWorker = worker.finally(() => {
        if (saveQueuesRef.current[questionId] === queuedWorker)
          delete saveQueuesRef.current[questionId];
      });
      saveQueuesRef.current[questionId] = queuedWorker;
      return queuedWorker;
    },
    [attemptId],
  );

  const chooseAnswer = (questionId, optionLabel) => {
    if (!canAnswer || answersRef.current[questionId] === optionLabel) return;
    const nextAnswers = { ...answersRef.current, [questionId]: optionLabel };
    answersRef.current = nextAnswers;
    delete navigationAcknowledgementsRef.current[questionId];
    setSelectedAnswers(nextAnswers);
    saveAnswer(questionId);
  };

  const retryAnswer = (questionId) => {
    if (!canAnswer || expiredSaveQuestionsRef.current.has(questionId))
      return Promise.resolve(false);
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
    () =>
      questions.some((question) =>
        answersDiffer(selectedAnswers, savedAnswers, question.question_id),
      ),
    [questions, savedAnswers, selectedAnswers],
  );

  const answeredCount = useMemo(
    () =>
      questions.reduce(
        (count, question) =>
          count +
          (selectedAnswers[question.question_id] &&
            savedAnswers[question.question_id] === selectedAnswers[question.question_id]
            ? 1
            : 0),
        0,
      ),
    [questions, savedAnswers, selectedAnswers],
  );
  const currentQuestion = questions[currentQuestionIndex];
  const isExpired = Boolean(attempt?.is_expired) || remainingSeconds <= 0;
  const canAnswer =
    attempt?.status === "in_progress" && attempt?.test_active && !isExpired && !saveLocked;
  const hasSavingAnswers = Object.values(answerStatus).some((status) => status === "saving");
  const unansweredCount = Math.max(0, questions.length - answeredCount);

  const navigateToQuestion = (targetIndex) => {
    if (targetIndex === currentQuestionIndex) return;
    const questionId = currentQuestion?.question_id;
    if (
      questionId &&
      answersDiffer(answersRef.current, savedAnswersRef.current, questionId)
    ) {
      const intendedOption = Object.hasOwn(answersRef.current, questionId)
        ? answersRef.current[questionId]
        : null;
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
    navigationAcknowledgementsRef.current[questionId] = Object.hasOwn(
      answersRef.current,
      questionId,
    )
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
      .filter((question) =>
        answersDiffer(answersRef.current, savedAnswersRef.current, question.question_id),
      )
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

  const finishAttempt = useCallback(
    async ({ automatic = false, allowUnsaved = false } = {}) => {
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
          throw new Error(
            "काही उत्तरे जतन झालेली नाहीत. ती पुन्हा जतन करा आणि सबमिट करा.",
          );
        }

        const response = await submitTestAttempt(attemptId);
        if (!response?.success || !response.data)
          throw new Error(response?.message || "चाचणी सबमिट झाली नाही.");
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
        setSubmitError(
          "चाचणी सबमिट करता आली नाही. जतन केलेली उत्तरे सुरक्षित आहेत; पुन्हा प्रयत्न करा.",
        );
      } finally {
        submittingRef.current = false;
        setSubmitting(false);
        setShowSubmitConfirmation(false);
      }
    },
    [attemptId, navigate, questions, testId],
  );

  useEffect(() => {
    if (
      attempt?.status !== "in_progress" ||
      remainingSeconds !== 0 ||
      loading ||
      !attemptId
    )
      return;
    if (autoSubmitAttemptRef.current === attemptId) return;
    autoSubmitAttemptRef.current = attemptId;
    finishAttempt({ automatic: true });
  }, [attempt, attemptId, finishAttempt, loading, remainingSeconds]);

  /* ---------- NO ATTEMPT ID ---------- */
  if (!attemptId) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-pb-light">
        <AnimationStyles />
        <AnimatedBackground />
        <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
          <section className="animate-fade-up flex w-full max-w-xl flex-col items-center gap-4 rounded-2xl border border-pb-border bg-white/90 p-7 text-center shadow-sm backdrop-blur-sm">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-pb-light text-pb-khaki">
              <ClipboardIcon className="h-6 w-6" />
            </span>
            <h1 className="text-xl font-extrabold text-pb-green">
              चाचणी सत्र उपलब्ध नाही.
            </h1>
            <p className="max-w-md text-sm text-slate-600">
              चाचणीच्या माहिती पानावरून चाचणी सुरू करा.
            </p>
            <Link
              to={`/student/tests/${testId}`}
              className="mt-1 inline-flex min-h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-pb-green to-[#0f3d2e] px-5 py-2.5 text-sm font-extrabold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:from-pb-khaki hover:to-[#c9b95f] hover:shadow-lg active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              चाचणीच्या माहितीकडे जा
            </Link>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-pb-light">
      <AnimationStyles />
      <AnimatedBackground />

      <main className="relative z-10 px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-5">

          {/* ================= STICKY HEADER ================= */}
          <header className="animate-fade-up sticky top-[4.5rem] z-20 overflow-hidden rounded-2xl border border-pb-border/60 bg-white/90 shadow-md backdrop-blur-xl">
            <span
              aria-hidden="true"
              className="animate-gradient pointer-events-none block h-1 w-full bg-gradient-to-r from-pb-green via-pb-khaki to-pb-green"
            />

            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div className="flex min-w-0 items-center gap-3">
                <span className="relative hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-pb-green to-[#0f3d2e] text-white shadow-md sm:flex">
                  <span
                    aria-hidden="true"
                    className="animate-soft-glow pointer-events-none absolute -inset-1 rounded-2xl bg-pb-khaki/30 blur-md"
                  />
                  <ClipboardIcon className="relative h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[10px] font-bold tracking-[0.14em] text-pb-khaki uppercase sm:text-xs">
                    चाचणी सत्र · {attemptId}
                  </p>
                  <h1 className="mt-0.5 text-base leading-tight font-extrabold break-words text-pb-green sm:text-lg">
                    {attempt?.test_title || "चाचणी"}
                  </h1>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Timer */}
                <div
                  role="timer"
                  aria-live="off"
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-base font-extrabold tabular-nums shadow-sm transition-colors duration-300 ${isExpired
                      ? "border border-red-200 bg-red-50 text-red-700"
                      : "bg-gradient-to-br from-pb-green to-[#0f3d2e] text-white"
                    }`}
                >
                  <TimerIcon
                    className={`h-4 w-4 ${!isExpired ? "animate-pulse-soft" : ""}`}
                  />
                  {attempt ? (isExpired ? "00:00" : formatTime(remainingSeconds)) : "--:--"}
                </div>

                {/* Answered */}
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-xs font-extrabold text-green-700 sm:text-sm">
                  <CheckCircleIcon className="h-3.5 w-3.5" />
                  {answeredCount}
                </span>

                {/* Remaining */}
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-pb-khaki/30 bg-pb-khaki/10 px-3 py-2 text-xs font-extrabold text-pb-khaki sm:text-sm">
                  <ClockIcon className="h-3.5 w-3.5" />
                  {Math.max(0, questions.length - answeredCount)}
                </span>
              </div>
            </div>
          </header>

          {/* ================= STATUS BANNERS ================= */}
          {isExpired && attempt && (
            <div
              role="alert"
              className="animate-fade-up flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900"
            >
              <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
              <span>वेळ संपली. उत्तरे बदलणे बंद केले आहे.</span>
            </div>
          )}

          {attempt && !attempt.test_active && (
            <div
              role="alert"
              className="animate-fade-up flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900"
            >
              <LockIcon className="mt-0.5 h-4 w-4 shrink-0" />
              <span>ही चाचणी निष्क्रिय आहे. उत्तरे बदलता येणार नाहीत.</span>
            </div>
          )}

          {hasSavingAnswers && (
            <div
              role="status"
              className="animate-fade-up flex items-center gap-2.5 rounded-xl border border-pb-khaki/30 bg-pb-khaki/10 px-4 py-3 text-sm font-semibold text-pb-khaki"
            >
              <SpinnerIcon className="animate-spin-soft h-4 w-4" />
              तुमची उत्तरे जतन होत आहेत...
            </div>
          )}

          {submitError && (
            <div
              role="alert"
              className="animate-fade-up flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-2.5">
                <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
                <span className="min-w-0 font-semibold">{submitError}</span>
              </div>
              <button
                type="button"
                onClick={() =>
                  finishAttempt({
                    automatic: isExpired,
                    allowUnsaved: hasUnsavedAnswers,
                  })
                }
                disabled={submitting}
                className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-red-300 bg-white px-3.5 py-2 text-xs font-extrabold text-red-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-100 hover:shadow-sm active:translate-y-0 focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:outline-none disabled:opacity-50 disabled:hover:translate-y-0 sm:text-sm"
              >
                <RefreshIcon className="h-3.5 w-3.5" />
                पुन्हा सबमिट करा
              </button>
            </div>
          )}

          {/* ================= MAIN CONTENT ================= */}
          {loading ? (
            <div
              role="status"
              aria-live="polite"
              className="animate-fade-up flex flex-col items-center justify-center gap-3 rounded-2xl border border-pb-border bg-white/85 px-5 py-12 text-center backdrop-blur-sm"
            >
              <SpinnerIcon className="animate-spin-soft h-10 w-10 text-pb-khaki" />
              <p className="text-sm font-semibold text-pb-green">
                चाचणी सत्र लोड होत आहे...
              </p>
              <p className="text-xs text-slate-500">Fetching your attempt.</p>
            </div>
          ) : loadError ? (
            <div
              role="alert"
              className="animate-fade-up overflow-hidden rounded-2xl border border-red-200 bg-white/90 backdrop-blur-sm"
            >
              <span
                aria-hidden="true"
                className="block h-1 w-full bg-gradient-to-r from-red-500 via-red-600 to-red-500"
              />
              <div className="flex flex-col items-center gap-4 p-7 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                  <AlertIcon className="h-6 w-6" />
                </span>
                <p className="max-w-md text-sm font-semibold text-red-700">{loadError}</p>
                <button
                  type="button"
                  onClick={loadAttempt}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-pb-green to-[#0f3d2e] px-5 py-2.5 text-sm font-extrabold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:from-pb-khaki hover:to-[#c9b95f] hover:shadow-lg active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  <RefreshIcon className="h-4 w-4" />
                  पुन्हा प्रयत्न करा
                </button>
              </div>
            </div>
          ) : questions.length === 0 ? (
            <section className="animate-fade-up flex flex-col items-center gap-3 rounded-2xl border border-pb-border bg-white/85 p-8 text-center shadow-sm backdrop-blur-sm">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-pb-light text-pb-khaki">
                <ClipboardIcon className="h-6 w-6" />
              </span>
              <h2 className="font-bold text-pb-green">
                या चाचणीत प्रश्न उपलब्ध नाहीत.
              </h2>
            </section>
          ) : (
            <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">

              {/* ================= QUESTION CARD ================= */}
              <section className="animate-fade-up min-w-0 overflow-hidden rounded-2xl border border-pb-border bg-white/90 shadow-sm backdrop-blur-sm">
                <span
                  aria-hidden="true"
                  className="block h-1 w-full bg-gradient-to-r from-pb-green via-pb-khaki to-pb-green"
                />

                <div className="p-5 sm:p-7">
                  {/* Question header */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-pb-green to-[#0f3d2e] text-xs font-extrabold text-white shadow-sm">
                        {currentQuestion.question_number}
                      </span>
                      <p className="text-[11px] font-bold tracking-[0.14em] text-pb-khaki uppercase sm:text-xs">
                        Question {currentQuestion.question_number} of{" "}
                        {questions.length}
                      </p>
                    </div>

                    <span className="inline-flex items-center gap-1.5 rounded-full border border-pb-khaki/30 bg-pb-khaki/10 px-3 py-1 text-xs font-extrabold text-pb-khaki">
                      <AwardIcon className="h-3.5 w-3.5" />
                      गुण: {currentQuestion.marks}
                    </span>
                  </div>

                  {/* Question text */}
                  <h2 className="mt-5 text-base leading-7 font-bold break-words whitespace-pre-wrap text-pb-green sm:text-lg sm:leading-8">
                    {currentQuestion.question_text}
                  </h2>

                  {/* Options */}
                  <div className="mt-6 space-y-3">
                    {currentQuestion.options.map((option) => {
                      const isSelected =
                        selectedAnswers[currentQuestion.question_id] ===
                        option.option_label;
                      return (
                        <button
                          key={option.option_label}
                          type="button"
                          onClick={() =>
                            chooseAnswer(
                              currentQuestion.question_id,
                              option.option_label,
                            )
                          }
                          disabled={!canAnswer}
                          aria-pressed={isSelected}
                          className={`group flex min-h-14 w-full items-start gap-3 rounded-xl border-2 p-4 text-left transition-all duration-200 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed ${isSelected
                              ? "border-pb-khaki bg-pb-light text-pb-green shadow-sm"
                              : "border-pb-border bg-white hover:-translate-y-0.5 hover:border-pb-khaki hover:bg-[#fbfaf7] hover:shadow-sm"
                            } disabled:opacity-75 disabled:hover:translate-y-0`}
                        >
                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-extrabold transition-colors duration-200 ${isSelected
                                ? "bg-pb-khaki text-white"
                                : "bg-pb-green text-white group-hover:bg-pb-khaki"
                              }`}
                          >
                            {option.option_label}
                          </span>
                          <span className="min-w-0 pt-1 text-sm leading-6 break-words whitespace-pre-wrap sm:text-base">
                            {option.option_text}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Clear answer */}
                  {selectedAnswers[currentQuestion.question_id] && canAnswer && (
                    <button
                      type="button"
                      onClick={() => clearAnswer(currentQuestion.question_id)}
                      disabled={
                        answerStatus[currentQuestion.question_id] === "saving"
                      }
                      className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl border border-pb-border bg-white px-4 py-2 text-sm font-bold text-pb-green transition-all duration-200 hover:-translate-y-0.5 hover:border-pb-khaki hover:bg-pb-light hover:shadow-sm active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                    >
                      <XCircleIcon className="h-4 w-4" />
                      Clear answer
                    </button>
                  )}

                  {/* Saving status */}
                  {answerStatus[currentQuestion.question_id] === "saving" && (
                    <div
                      role="status"
                      className="mt-4 flex items-center gap-2.5 rounded-xl border border-pb-khaki/30 bg-pb-khaki/10 px-4 py-2.5 text-sm font-semibold text-pb-khaki"
                    >
                      <SpinnerIcon className="animate-spin-soft h-4 w-4" />
                      उत्तर जतन होत आहे... (Saving...)
                    </div>
                  )}

                  {/* Save error */}
                  {answerErrors[currentQuestion.question_id] && (
                    <div
                      role="alert"
                      className="mt-4 overflow-hidden rounded-xl border border-red-200 bg-red-50"
                    >
                      <div className="flex items-start gap-2.5 p-4 text-sm text-red-700">
                        <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold">
                            उत्तर जतन झाले नाही (Not saved):{" "}
                            {answerErrors[currentQuestion.question_id]}
                          </p>
                          <button
                            type="button"
                            onClick={() => retryAnswer(currentQuestion.question_id)}
                            disabled={!canAnswer}
                            className="mt-2 inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-extrabold text-red-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-100 hover:shadow-sm active:translate-y-0 focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:outline-none disabled:opacity-50 disabled:hover:translate-y-0"
                          >
                            <RefreshIcon className="h-3.5 w-3.5" />
                            पुन्हा जतन करा (Retry)
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Saved status */}
                  {(answerStatus[currentQuestion.question_id] === "saved" ||
                    answerStatus[currentQuestion.question_id] === "cleared") && (
                      <div
                        role="status"
                        className="mt-4 flex items-center gap-2.5 rounded-xl border border-green-200 bg-green-50 px-4 py-2.5 text-sm font-semibold text-green-700"
                      >
                        <CheckCircleIcon className="h-4 w-4" />
                        उत्तर जतन झाले (Saved)
                      </div>
                    )}

                  {/* Navigation */}
                  <div className="mt-8 flex items-center justify-between gap-3 border-t border-pb-border-soft pt-5">
                    <button
                      type="button"
                      onClick={() => navigateToQuestion(currentQuestionIndex - 1)}
                      disabled={currentQuestionIndex === 0}
                      className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-pb-border bg-white px-4 py-2.5 text-xs font-bold text-pb-green shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-pb-khaki hover:bg-pb-light hover:shadow-md active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 sm:text-sm"
                    >
                      <ChevronLeftIcon className="h-4 w-4" />
                      मागील प्रश्न
                    </button>
                    <button
                      type="button"
                      onClick={() => navigateToQuestion(currentQuestionIndex + 1)}
                      disabled={currentQuestionIndex === questions.length - 1}
                      className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-pb-green to-[#0f3d2e] px-4 py-2.5 text-xs font-extrabold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:from-pb-khaki hover:to-[#c9b95f] hover:shadow-lg active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 sm:text-sm"
                    >
                      पुढील प्रश्न
                      <ChevronRightIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </section>

              {/* ================= SIDEBAR / PALETTE ================= */}
              <aside className="animate-fade-up h-fit overflow-hidden rounded-2xl border border-pb-border bg-white/90 shadow-sm backdrop-blur-sm lg:sticky lg:top-[8rem]">
                <span
                  aria-hidden="true"
                  className="block h-1 w-full bg-gradient-to-r from-pb-khaki via-[#e1d37f] to-pb-khaki"
                />

                <div className="p-4 sm:p-5">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pb-green/10 text-pb-green">
                      <ListIcon className="h-4 w-4" />
                    </span>
                    <h2 className="text-sm leading-tight font-extrabold tracking-tight text-pb-green">
                      प्रश्नांची यादी
                    </h2>
                  </div>

                  {/* Legend */}
                  <div className="mt-3 flex flex-wrap gap-x-3 gap-y-2 text-[11px] font-semibold text-slate-600">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded-sm bg-gradient-to-br from-pb-green to-[#0f3d2e]" />
                      चालू
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded-sm border border-emerald-300 bg-emerald-50" />
                      सोडवलेले
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded-sm border border-pb-border bg-white" />
                      बाकी
                    </span>
                  </div>

                  {/* Palette grid */}
                  <div className="mt-3.5 grid grid-cols-5 gap-1.5 sm:grid-cols-8 lg:grid-cols-4">
                    {questions.map((question, index) => {
                      const isCurrent = index === currentQuestionIndex;
                      const isAnswered =
                        Boolean(selectedAnswers[question.question_id]) &&
                        savedAnswers[question.question_id] ===
                        selectedAnswers[question.question_id];
                      return (
                        <button
                          key={question.question_id}
                          type="button"
                          onClick={() => navigateToQuestion(index)}
                          aria-current={isCurrent ? "step" : undefined}
                          aria-label={`Question ${question.question_number}${isCurrent ? ", current" : ""
                            }, ${isAnswered ? "answered" : "unanswered"}`}
                          className={`min-h-[40px] rounded-lg border text-xs font-black tabular-nums transition-all duration-200 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none sm:text-sm ${isCurrent
                              ? "border-transparent bg-gradient-to-br from-pb-green to-[#0f3d2e] text-white shadow-md"
                              : isAnswered
                                ? "border-emerald-300 bg-emerald-50 text-emerald-800 hover:-translate-y-0.5 hover:shadow-sm active:translate-y-0"
                                : "border-pb-border bg-white text-slate-600 hover:-translate-y-0.5 hover:border-pb-khaki hover:shadow-sm active:translate-y-0"
                            }`}
                        >
                          {question.question_number}
                        </button>
                      );
                    })}
                  </div>

                  {/* Submit info */}
                  <p className="mt-5 border-t border-pb-border-soft pt-4 text-[11px] leading-5 text-slate-500">
                    सबमिट केल्यानंतर तुमची उत्तरे बदलता येणार नाहीत.
                  </p>

                  {/* Submit button */}
                  <button
                    type="button"
                    onClick={() => setShowSubmitConfirmation(true)}
                    disabled={submitting || attempt?.status !== "in_progress"}
                    className="group mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pb-green to-[#0f3d2e] px-4 py-3 text-sm font-extrabold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:from-pb-khaki hover:to-[#c9b95f] hover:shadow-lg active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                  >
                    {submitting ? (
                      <>
                        <SpinnerIcon className="animate-spin-soft h-4 w-4" />
                        सबमिट होत आहे...
                      </>
                    ) : (
                      <>
                        <SendIcon className="h-4 w-4" />
                        चाचणी सबमिट करा
                      </>
                    )}
                  </button>

                  {!canAnswer && !isExpired && attempt?.status !== "in_progress" && (
                    <p className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs font-semibold text-amber-800">
                      <LockIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      हा प्रयत्न आधीच पूर्ण झाला आहे.
                    </p>
                  )}
                </div>
              </aside>
            </div>
          )}
        </div>

        {/* ================= NAVIGATION WARNING DIALOG ================= */}
        {navigationWarning && (
          <div className="animate-overlay-in fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
            <section
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="navigation-warning-title"
              className="animate-dialog-in relative w-full max-w-md overflow-hidden rounded-2xl border border-pb-border bg-white shadow-2xl"
            >
              <span
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400"
              />

              <div className="p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-md">
                    <AlertIcon className="h-6 w-6" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2
                      id="navigation-warning-title"
                      className="text-lg leading-tight font-extrabold tracking-tight text-pb-green"
                    >
                      उत्तर जतन झालेले नाही (Answer not saved)
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      हे उत्तर आत्ता जतन झालेले नाही. पुढे गेल्यास ते रीफ्रेश केल्यानंतर
                      परत मिळेलच असे नाही.
                    </p>
                  </div>
                </div>

                {answerErrors[navigationWarning.questionId] && (
                  <p
                    role="alert"
                    className="mt-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-semibold text-red-700"
                  >
                    <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
                    <span className="min-w-0 break-words">
                      {answerErrors[navigationWarning.questionId]}
                    </span>
                  </p>
                )}

                <div className="mt-5 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setNavigationWarning(null)}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-pb-border bg-white px-4 py-2.5 text-sm font-bold text-pb-green transition-all duration-200 hover:-translate-y-0.5 hover:bg-pb-light hover:shadow-sm active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none"
                  >
                    Stay here
                  </button>
                  <button
                    type="button"
                    onClick={continueNavigationWithoutSaving}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-900 transition-all duration-200 hover:-translate-y-0.5 hover:bg-amber-100 hover:shadow-sm active:translate-y-0 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
                  >
                    Continue without saving
                  </button>
                  <button
                    type="button"
                    onClick={retryPendingNavigation}
                    disabled={
                      !canAnswer ||
                      answerStatus[navigationWarning.questionId] === "saving"
                    }
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pb-green to-[#0f3d2e] px-4 py-2.5 text-sm font-extrabold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:from-pb-khaki hover:to-[#c9b95f] hover:shadow-lg active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                  >
                    <RefreshIcon className="h-4 w-4" />
                    Retry
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ================= SUBMIT CONFIRMATION DIALOG ================= */}
        {showSubmitConfirmation && (
          <div
            className="animate-overlay-in fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !submitting)
                setShowSubmitConfirmation(false);
            }}
          >
            <section
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="submit-confirmation-title"
              className="animate-dialog-in relative w-full max-w-md overflow-hidden rounded-2xl border border-pb-border bg-white shadow-2xl"
            >
              <span
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-pb-green via-pb-khaki to-pb-green"
              />

              <div className="p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-pb-green to-[#0f3d2e] text-white shadow-md">
                    <SendIcon className="h-6 w-6" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2
                      id="submit-confirmation-title"
                      className="text-lg leading-tight font-extrabold tracking-tight text-pb-green"
                    >
                      तुम्हाला ही चाचणी सबमिट करायची आहे का?
                    </h2>
                  </div>
                </div>

                {/* Summary */}
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-green-200 bg-green-50 p-3">
                    <p className="text-[10px] font-bold tracking-wide text-green-700 uppercase">
                      उत्तर दिलेले
                    </p>
                    <p className="mt-1 text-2xl font-extrabold tabular-nums text-green-700">
                      {answeredCount}
                    </p>
                  </div>
                  <div className="rounded-xl border border-pb-khaki/30 bg-pb-khaki/10 p-3">
                    <p className="text-[10px] font-bold tracking-wide text-pb-khaki uppercase">
                      अनुत्तरित
                    </p>
                    <p className="mt-1 text-2xl font-extrabold tabular-nums text-pb-khaki">
                      {unansweredCount}
                    </p>
                  </div>
                </div>

                {hasSavingAnswers && (
                  <div
                    role="status"
                    className="mt-4 flex items-center gap-2.5 rounded-xl border border-pb-khaki/30 bg-pb-khaki/10 px-4 py-2.5 text-sm font-semibold text-pb-khaki"
                  >
                    <SpinnerIcon className="animate-spin-soft h-4 w-4" />
                    उत्तरे जतन होत आहेत...
                  </div>
                )}

                {hasUnsavedAnswers && (
                  <div
                    role="alert"
                    className="mt-4 overflow-hidden rounded-xl border border-amber-200 bg-amber-50"
                  >
                    <div className="p-4 text-sm text-amber-950">
                      <p className="flex items-start gap-2 font-bold">
                        <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
                        काही उत्तरे जतन झालेली नाहीत (You have unsaved answers).
                      </p>
                      <p className="mt-1.5 leading-6">
                        Continue submit निवडल्यास फक्त सर्व्हरवर जतन केलेली उत्तरेच
                        सबमिट होतील. न जतन केलेली उत्तरे पाठवली जाणार नाहीत.
                      </p>
                      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                        <button
                          type="button"
                          onClick={retryAllUnsavedAnswers}
                          disabled={!canAnswer || hasSavingAnswers}
                          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-amber-400 bg-white px-3 py-2 text-sm font-bold text-amber-900 transition-all duration-200 hover:-translate-y-0.5 hover:bg-amber-100 hover:shadow-sm active:translate-y-0 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                        >
                          <RefreshIcon className="h-4 w-4" />
                          Retry saving
                        </button>
                        <button
                          type="button"
                          onClick={() => finishAttempt({ allowUnsaved: true })}
                          disabled={submitting}
                          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-pb-green to-[#0f3d2e] px-3 py-2 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:from-pb-khaki hover:to-[#c9b95f] hover:shadow-md active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                        >
                          Continue submit
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-5 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setShowSubmitConfirmation(false)}
                    disabled={submitting}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-pb-border bg-white px-5 py-2.5 text-sm font-bold text-pb-green transition-all duration-200 hover:-translate-y-0.5 hover:bg-pb-light hover:shadow-sm active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
                  >
                    परत जा
                  </button>
                  {!hasUnsavedAnswers && (
                    <button
                      type="button"
                      onClick={() => finishAttempt()}
                      disabled={submitting || hasSavingAnswers}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pb-green to-[#0f3d2e] px-5 py-2.5 text-sm font-extrabold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:from-pb-khaki hover:to-[#c9b95f] hover:shadow-lg active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-wait disabled:opacity-60 disabled:hover:translate-y-0"
                    >
                      {submitting ? (
                        <>
                          <SpinnerIcon className="animate-spin-soft h-4 w-4" />
                          सबमिट होत आहे...
                        </>
                      ) : (
                        "होय, सबमिट करा"
                      )}
                    </button>
                  )}
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

export default TestAttempt;