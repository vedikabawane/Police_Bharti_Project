import { useCallback, useEffect, useRef, useState } from "react";
import {
  deleteAIChatHistory,
  getAIChatHistory,
  sendAIMessage,
} from "../../services/aiAssistantService";

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

const BotIcon = (p) => (
  <svg {...iconProps} {...p}>
    <rect x="4" y="8" width="16" height="12" rx="3" />
    <path d="M12 4v4M9 14h.01M15 14h.01" />
    <path d="M2 13v2M22 13v2" />
  </svg>
);
const SendIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M4 4h16v12H8l-4 4Z" />
    <path d="M8 9h8M8 12h5" />
  </svg>
);
const PlusIcon = (p) => (
  <svg {...iconProps} strokeWidth="2" {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
const TrashIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M3 6h18" />
    <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
    <path d="M19 6v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <path d="M10 11v5M14 11v5" />
  </svg>
);
const HistoryIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M3 12a9 9 0 1 0 3-6.7" />
    <path d="M3 4v5h5" />
    <path d="M12 8v4l3 2" />
  </svg>
);
const SparklesIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.3 6.3l2.8 2.8M14.9 14.9l2.8 2.8M17.7 6.3l-2.8 2.8M9.1 14.9l-2.8 2.8" />
  </svg>
);
const UserIcon = (p) => (
  <svg {...iconProps} {...p}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 20a7 7 0 0 1 14 0" />
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
const InboxIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M3 12h5l1.5 3h5L16 12h5" />
    <path d="M5 5h14l2 7v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6Z" />
  </svg>
);
const ChevronRightIcon = (p) => (
  <svg {...iconProps} strokeWidth="2.2" {...p}>
    <path d="m9 6 6 6-6 6" />
  </svg>
);
const MessageIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-5 4V5Z" />
    <path d="M8 9h8M8 12h5" />
  </svg>
);

const suggestions = [
  "पोलीस भरतीची तयारी कशी करावी?",
  "माझे weak topics कोणते आहेत?",
  "माझी test performance कशी आहे?",
  "1600 मीटर रनिंगची तयारी कशी करावी?",
  "गणिताचा अभ्यास कसा सुरू करू?",
];

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString("mr-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
};

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
      @keyframes bubbleIn {
        from { opacity: 0; transform: translateY(6px) scale(0.98); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      .animate-blob { animation: blobMove 22s ease-in-out infinite; }
      .delay-2 { animation-delay: 4s; }
      .delay-4 { animation-delay: 8s; }
      .animate-fade-up { animation: fadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }
      .animate-gradient { background-size: 220% 220%; animation: gradientPan 9s ease infinite; }
      .animate-soft-glow { animation: softGlow 4.5s ease-in-out infinite; }
      .animate-spin-soft { animation: spinSoft 0.9s linear infinite; }
      .animate-bubble-in { animation: bubbleIn 0.3s cubic-bezier(0.22, 1, 0.36, 1) both; }
      @media (prefers-reduced-motion: reduce) {
        .animate-blob, .animate-fade-up, .animate-gradient,
        .animate-soft-glow, .animate-spin-soft, .animate-bubble-in { animation: none !important; }
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

/* ---------- TYPING INDICATOR ---------- */
function TypingIndicator() {
  return (
    <div className="animate-bubble-in flex justify-start">
      <div className="flex items-start gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pb-green to-[#0f3d2e] text-white shadow-sm">
          <BotIcon className="h-4 w-4" />
        </span>
        <div
          role="status"
          aria-live="polite"
          className="rounded-2xl rounded-bl-md border border-pb-border-soft bg-white px-4 py-3 text-sm text-slate-600 shadow-sm"
        >
          <span className="font-semibold">AI उत्तर तयार करत आहे</span>
          <span className="ml-2 inline-flex gap-1" aria-hidden="true">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-pb-khaki" />
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-pb-khaki [animation-delay:150ms]" />
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-pb-khaki [animation-delay:300ms]" />
          </span>
        </div>
      </div>
    </div>
  );
}

/* ---------- MESSAGE BUBBLE ---------- */
function MessageBubble({ item, index }) {
  const isUser = item.role === "user";
  return (
    <div
      className={`animate-bubble-in flex ${isUser ? "justify-end" : "justify-start"}`}
      style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
    >
      <div
        className={`flex max-w-[88%] items-start gap-2 sm:max-w-[78%] ${isUser ? "flex-row-reverse" : "flex-row"
          }`}
      >
        {/* Avatar */}
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm ${isUser
              ? "bg-gradient-to-br from-pb-khaki to-[#c9b95f] text-white"
              : "bg-gradient-to-br from-pb-green to-[#0f3d2e] text-white"
            }`}
        >
          {isUser ? (
            <UserIcon className="h-4 w-4" />
          ) : (
            <BotIcon className="h-4 w-4" />
          )}
        </span>

        <div
          className={`min-w-0 rounded-2xl px-4 py-3 shadow-sm ${isUser
              ? "rounded-br-md bg-gradient-to-br from-pb-green to-[#0f3d2e] text-white"
              : "rounded-bl-md border border-pb-border-soft bg-white text-pb-green"
            }`}
        >
          <p className="text-sm leading-6 break-words whitespace-pre-wrap">
            {item.message}
          </p>
          {item.created_at && (
            <p
              className={`mt-1.5 text-[10px] font-medium ${isUser ? "text-white/65" : "text-slate-500"
                }`}
            >
              {formatDate(item.created_at)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function AIAssistant() {
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [chatError, setChatError] = useState("");
  const sendLock = useRef(false);
  const localMessageId = useRef(0);
  const initialHistoryRequestStarted = useRef(false);
  const mountedRef = useRef(false);
  const messagesEndRef = useRef(null);

  const loadHistory = useCallback(async () => {
    try {
      const response = await getAIChatHistory();
      const history = Array.isArray(response?.data) ? response.data : [];
      if (mountedRef.current) {
        setSessions(history);
        if (history.length) {
          setSessionId(history[0].session_id);
          setMessages(history[0].messages || []);
        } else {
          setSessionId(null);
          setMessages([]);
        }
      }
    } catch {
      if (mountedRef.current) {
        setHistoryError(
          "Chat history लोड करताना समस्या आली. कृपया पुन्हा प्रयत्न करा.",
        );
      }
    } finally {
      if (mountedRef.current) {
        setLoadingHistory(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    if (!initialHistoryRequestStarted.current) {
      initialHistoryRequestStarted.current = true;
      loadHistory();
    }

    return () => {
      mountedRef.current = false;
    };
  }, [loadHistory]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, sending]);

  const startNewChat = () => {
    if (sending) return;
    setSessionId(null);
    setMessages([]);
    setChatError("");
    setMessage("");
  };

  const selectSession = (session) => {
    if (sending) return;
    setSessionId(session.session_id);
    setMessages(Array.isArray(session.messages) ? session.messages : []);
    setChatError("");
  };

  const handleSend = async (rawMessage = message) => {
    const trimmed = rawMessage.trim();
    if (!trimmed || trimmed.length > 2000 || sendLock.current) return;

    sendLock.current = true;
    setSending(true);
    setChatError("");

    localMessageId.current += 1;
    const currentLocalId = localMessageId.current;
    const localUserMessage = {
      id: `local-${currentLocalId}`,
      role: "user",
      message: trimmed,
    };
    setMessages((current) => [...current, localUserMessage]);

    try {
      const response = await sendAIMessage(trimmed, sessionId);
      if (!response?.success || !response?.data?.answer) {
        throw new Error("Assistant response was empty.");
      }

      const result = response.data;
      setMessage("");
      const assistantMessage = {
        id: `assistant-${currentLocalId}`,
        role: "assistant",
        message: result.answer,
      };
      setHistoryError("");
      setSessionId(result.session_id);
      setMessages((current) => [...current, assistantMessage]);

      setSessions((current) => {
        const existing = current.find(
          (item) => item.session_id === result.session_id,
        );
        const updatedSession = existing
          ? {
            ...existing,
            messages: [
              ...(existing.messages || []),
              localUserMessage,
              assistantMessage,
            ],
          }
          : {
            session_id: result.session_id,
            messages: [localUserMessage, assistantMessage],
          };
        return [
          updatedSession,
          ...current.filter((item) => item.session_id !== result.session_id),
        ];
      });
    } catch {
      setMessages((current) =>
        current.filter((item) => item.id !== `local-${currentLocalId}`),
      );
      setMessage(trimmed);
      setChatError("उत्तर मिळवताना समस्या आली. कृपया पुन्हा प्रयत्न करा.");
    } finally {
      sendLock.current = false;
      setSending(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    handleSend();
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const handleDeleteHistory = async () => {
    if (
      deleting ||
      sessions.length === 0 ||
      !window.confirm("तुमचा संपूर्ण Chat History कायमचा delete करायचा आहे का?")
    ) {
      return;
    }

    setDeleting(true);
    setHistoryError("");
    try {
      await deleteAIChatHistory();
      setSessions([]);
      setSessionId(null);
      setMessages([]);
      setChatError("");
    } catch {
      setHistoryError(
        "Chat History delete करता आली नाही. कृपया पुन्हा प्रयत्न करा.",
      );
    } finally {
      setDeleting(false);
    }
  };

  const retryHistory = () => {
    setLoadingHistory(true);
    setHistoryError("");
    loadHistory();
  };

  const submitDisabled =
    loadingHistory || sending || !message.trim() || message.trim().length > 2000;

  return (
    <div className="relative min-h-[calc(100vh-5rem)] min-w-0 overflow-x-hidden bg-pb-light">
      <AnimationStyles />
      <AnimatedBackground />

      <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:flex-row lg:px-8">

        {/* ================= CHAT PANEL ================= */}
        <section className="animate-fade-up min-w-0 flex-1 overflow-hidden rounded-2xl border border-pb-border bg-white/90 shadow-sm backdrop-blur-sm">

          {/* Header */}
          <header className="relative border-b border-pb-border-soft bg-white/80">
            <span
              aria-hidden="true"
              className="animate-gradient pointer-events-none block h-1 w-full bg-gradient-to-r from-pb-green via-pb-khaki to-pb-green"
            />

            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="flex min-w-0 items-center gap-3.5">
                <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-pb-green to-[#0f3d2e] text-white shadow-md">
                  <span
                    aria-hidden="true"
                    className="animate-soft-glow pointer-events-none absolute -inset-1 rounded-3xl bg-pb-khaki/30 blur-md"
                  />
                  <BotIcon className="relative h-6 w-6" />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold tracking-[0.16em] text-pb-khaki uppercase sm:text-xs">
                    Police Bharti AI Assistant
                  </p>
                  <h1 className="mt-1 text-lg leading-tight font-extrabold tracking-tight text-pb-green sm:text-xl">
                    तुमचा अभ्यास साथी
                  </h1>
                  <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-600 sm:text-sm">
                    महाराष्ट्र पोलीस भरतीच्या तयारीसाठी तुमचा अभ्यास साथी.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={startNewChat}
                disabled={loadingHistory || sending}
                className="group inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pb-green to-[#0f3d2e] px-4 py-2.5 text-sm font-extrabold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:from-pb-khaki hover:to-[#c9b95f] hover:shadow-lg active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                <PlusIcon className="h-4 w-4" />
                नवीन Chat
              </button>
            </div>

            {/* History error */}
            {historyError && (
              <div
                role="alert"
                className="mx-4 mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 sm:mx-6"
              >
                <span className="flex min-w-0 items-start gap-2.5">
                  <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
                  <span className="min-w-0 break-words">{historyError}</span>
                </span>
                <button
                  type="button"
                  onClick={retryHistory}
                  disabled={loadingHistory}
                  className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-extrabold text-red-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-100 hover:shadow-sm active:translate-y-0 focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:outline-none disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  <RefreshIcon className="h-3.5 w-3.5" />
                  पुन्हा प्रयत्न करा
                </button>
              </div>
            )}
          </header>

          {/* Chat body */}
          <div className="flex h-[min(65vh,620px)] min-h-[360px] flex-col bg-[#faf9f6]">
            <div
              aria-live="polite"
              className="flex-1 overflow-y-auto px-4 py-5 sm:px-6"
            >
              {loadingHistory ? (
                <div
                  role="status"
                  className="flex flex-col items-center justify-center gap-3 py-12 text-center"
                >
                  <SpinnerIcon className="animate-spin-soft h-10 w-10 text-pb-khaki" />
                  <p className="text-sm font-semibold text-pb-green">
                    Chat History लोड होत आहे...
                  </p>
                  <p className="text-xs text-slate-500">
                    Fetching your past conversations.
                  </p>
                </div>
              ) : messages.length === 0 ? (
                /* ================= EMPTY / WELCOME ================= */
                <div className="mx-auto flex min-h-full max-w-2xl flex-col justify-center py-5">
                  <div className="text-center">
                    <span className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-pb-green to-[#0f3d2e] text-white shadow-lg">
                      <span
                        aria-hidden="true"
                        className="animate-soft-glow pointer-events-none absolute -inset-1.5 rounded-3xl bg-pb-khaki/30 blur-lg"
                      />
                      <BotIcon className="relative h-8 w-8" />
                    </span>
                    <h2 className="mt-4 text-lg font-extrabold tracking-tight text-pb-green sm:text-xl">
                      नमस्कार! काय मदत करू?
                    </h2>
                    <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                      खालील प्रश्नांपैकी एक निवडा किंवा तुमचा प्रश्न लिहा.
                    </p>
                  </div>

                  <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
                    {suggestions.map((suggestion, i) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => handleSend(suggestion)}
                        disabled={loadingHistory || sending}
                        className="animate-fade-up group flex items-center gap-2.5 rounded-xl border border-pb-border bg-white px-4 py-3 text-left text-sm font-semibold text-pb-green transition-all duration-200 hover:-translate-y-0.5 hover:border-pb-khaki hover:bg-pb-light hover:shadow-sm active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none disabled:opacity-50 disabled:hover:translate-y-0"
                        style={{ animationDelay: `${Math.min(i * 60, 300)}ms` }}
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-pb-green/10 text-pb-green transition-colors group-hover:bg-pb-khaki group-hover:text-white">
                          <SparklesIcon className="h-3.5 w-3.5" />
                        </span>
                        <span className="min-w-0">{suggestion}</span>
                        <ChevronRightIcon className="ml-auto h-3.5 w-3.5 shrink-0 text-slate-300 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-pb-khaki" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* ================= MESSAGE LIST ================= */
                <div className="mx-auto max-w-3xl space-y-4">
                  {messages.map((item, index) => (
                    <MessageBubble
                      key={item.id || `${item.created_at}-${index}`}
                      item={item}
                      index={index}
                    />
                  ))}
                  {sending && <TypingIndicator />}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Chat error */}
            {chatError && (
              <div
                role="alert"
                className="mx-4 mb-2 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 sm:mx-6"
              >
                <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
                <span className="min-w-0 break-words">{chatError}</span>
              </div>
            )}

            {/* ================= INPUT FORM ================= */}
            <form
              onSubmit={handleSubmit}
              className="sticky bottom-0 border-t border-pb-border-soft bg-white/95 p-3 backdrop-blur-sm sm:p-4"
            >
              <div className="mx-auto flex max-w-3xl items-end gap-2 sm:gap-3">
                <div className="min-w-0 flex-1">
                  <label htmlFor="assistant-message" className="sr-only">
                    तुमचा प्रश्न
                  </label>
                  <textarea
                    id="assistant-message"
                    rows={2}
                    maxLength={2000}
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="तुमचा प्रश्न येथे लिहा..."
                    disabled={loadingHistory || sending}
                    className="max-h-36 min-h-12 w-full resize-y rounded-xl border border-pb-border bg-white px-4 py-3 text-sm text-pb-green transition-all duration-200 outline-none placeholder:text-slate-400 focus:border-pb-khaki focus:ring-4 focus:ring-pb-khaki/15 disabled:cursor-not-allowed disabled:bg-slate-50"
                  />
                  <p className="mt-1 flex items-center justify-end gap-1.5 text-[10px] text-slate-500 sm:text-[11px]">
                    <span
                      className={`tabular-nums ${message.length > 1800 ? "font-bold text-amber-600" : ""
                        }`}
                    >
                      {message.length}/2000
                    </span>
                    <span className="text-slate-300">·</span>
                    <span>Enter पाठवा</span>
                    <span className="text-slate-300">·</span>
                    <span>Shift + Enter नवीन ओळ</span>
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={submitDisabled}
                  aria-label="प्रश्न पाठवा"
                  className="group mb-5 inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pb-green to-[#0f3d2e] px-4 py-3 text-sm font-extrabold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:from-pb-khaki hover:to-[#c9b95f] hover:shadow-lg active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 sm:px-5"
                >
                  {sending ? (
                    <>
                      <SpinnerIcon className="animate-spin-soft h-4 w-4" />
                      <span className="hidden sm:inline">थांबा...</span>
                    </>
                  ) : (
                    <>
                      <SendIcon className="h-4 w-4" />
                      <span className="hidden sm:inline">विचारा</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* ================= SIDEBAR: HISTORY ================= */}
        <aside className="animate-fade-up w-full shrink-0 overflow-hidden rounded-2xl border border-pb-border bg-white/90 shadow-sm backdrop-blur-sm lg:w-72">
          <span
            aria-hidden="true"
            className="block h-1 w-full bg-gradient-to-r from-pb-khaki via-[#e1d37f] to-pb-khaki"
          />

          <div className="p-4 sm:p-5">
            {/* Header */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pb-green/10 text-pb-green">
                  <HistoryIcon className="h-4 w-4" />
                </span>
                <h2 className="text-sm leading-tight font-extrabold tracking-tight text-pb-green sm:text-base">
                  Chat History
                </h2>
              </div>
              <button
                type="button"
                onClick={handleDeleteHistory}
                disabled={deleting || sessions.length === 0}
                aria-label="Chat history delete करा"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-transparent text-red-600 transition-all duration-200 hover:border-red-200 hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:outline-none active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {deleting ? (
                  <SpinnerIcon className="animate-spin-soft h-4 w-4" />
                ) : (
                  <TrashIcon className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Session list */}
            {sessions.length ? (
              <div className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:max-h-[60vh] lg:flex-col lg:overflow-x-hidden lg:overflow-y-auto">
                {sessions.map((session) => {
                  const firstQuestion = session.messages?.find(
                    (item) => item.role === "user",
                  )?.message;
                  const active = session.session_id === sessionId;
                  return (
                    <button
                      key={session.session_id}
                      type="button"
                      onClick={() => selectSession(session)}
                      disabled={sending}
                      className={`group min-w-52 shrink-0 rounded-xl border p-3 text-left transition-all duration-200 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none disabled:opacity-60 lg:min-w-0 lg:shrink ${active
                          ? "border-pb-khaki bg-gradient-to-br from-pb-light to-white shadow-sm"
                          : "border-pb-border-soft bg-white hover:-translate-y-0.5 hover:border-pb-khaki hover:shadow-sm"
                        }`}
                    >
                      <div className="flex items-start gap-2">
                        <span
                          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors ${active
                              ? "bg-pb-khaki text-white"
                              : "bg-pb-light text-pb-khaki group-hover:bg-pb-khaki group-hover:text-white"
                            }`}
                        >
                          <MessageIcon className="h-3.5 w-3.5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <span
                            className={`block truncate text-sm font-bold ${active ? "text-pb-green" : "text-pb-green"
                              }`}
                          >
                            {firstQuestion || "नवीन संभाषण"}
                          </span>
                          <span className="mt-0.5 block text-[11px] font-medium text-slate-500">
                            {formatDate(
                              session.updated_at || session.created_at,
                            )}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="mt-4 flex flex-col items-center gap-2.5 rounded-xl border border-dashed border-[#d9d2c3] bg-pb-light/60 px-4 py-6 text-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-pb-khaki shadow-sm">
                  <InboxIcon className="h-5 w-5" />
                </span>
                <p className="text-xs font-semibold text-slate-500 sm:text-sm">
                  अजून जतन केलेली Chat History नाही.
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

export default AIAssistant;