import { useCallback, useEffect, useRef, useState } from "react";
import {
  deleteAIChatHistory,
  getAIChatHistory,
  sendAIMessage,
} from "../../services/aiAssistantService";

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
              messages: [...(existing.messages || []), localUserMessage, assistantMessage],
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
    <div className="min-h-[calc(100vh-5rem)] min-w-0 bg-pb-light">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:flex-row lg:px-8">
        <section className="min-w-0 flex-1 overflow-hidden rounded-2xl bg-white shadow-sm">
          <header className="border-b border-pb-border-soft bg-white px-4 py-5 sm:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold text-pb-khaki">
                  🤖 Police Bharti AI Assistant
                </p>
                <h1 className="mt-1 text-xl font-extrabold text-pb-green sm:text-2xl">
                  तुमचा अभ्यास साथी
                </h1>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  महाराष्ट्र पोलीस भरतीच्या तयारीसाठी तुमचा अभ्यास साथी.
                </p>
              </div>
              <button
                type="button"
                onClick={startNewChat}
                disabled={loadingHistory || sending}
                className="shrink-0 rounded-xl bg-pb-green px-4 py-2.5 text-sm font-bold text-white transition hover:bg-pb-khaki disabled:cursor-not-allowed disabled:opacity-60"
              >
                नवीन Chat
              </button>
            </div>
          </header>

          {historyError && (
            <div role="alert" className="mx-4 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 sm:mx-6">
              <span>{historyError}</span>
              <button
                type="button"
                onClick={retryHistory}
                disabled={loadingHistory}
                className="font-bold underline disabled:opacity-50"
              >
                पुन्हा प्रयत्न करा
              </button>
            </div>
          )}

          <div className="flex h-[min(65vh,620px)] min-h-[360px] flex-col bg-[#faf9f6]">
            <div
              aria-live="polite"
              className="flex-1 overflow-y-auto px-4 py-5 sm:px-6"
            >
              {loadingHistory ? (
                <div role="status" className="py-10 text-center text-sm font-medium text-slate-500">
                  Chat History लोड होत आहे...
                </div>
              ) : messages.length === 0 ? (
                <div className="mx-auto flex min-h-full max-w-2xl flex-col justify-center py-5">
                  <div className="text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-pb-green text-2xl text-white">
                      🤖
                    </div>
                    <h2 className="mt-4 text-lg font-extrabold text-pb-green">
                      नमस्कार! काय मदत करू?
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                      खालील प्रश्नांपैकी एक निवडा किंवा तुमचा प्रश्न लिहा.
                    </p>
                  </div>
                  <div className="mt-6 grid gap-2 sm:grid-cols-2">
                    {suggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => handleSend(suggestion)}
                        disabled={loadingHistory || sending}
                        className="rounded-xl border border-pb-border bg-white px-4 py-3 text-left text-sm font-semibold text-pb-green transition hover:border-pb-khaki hover:bg-pb-light disabled:opacity-50 sm:text-center"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mx-auto max-w-3xl space-y-4">
                  {messages.map((item, index) => {
                    const isUser = item.role === "user";
                    return (
                      <div
                        key={item.id || `${item.created_at}-${index}`}
                        className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[88%] rounded-2xl px-4 py-3 shadow-sm sm:max-w-[78%] ${
                            isUser
                              ? "rounded-br-md bg-pb-green text-white"
                              : "rounded-bl-md border border-pb-border-soft bg-white text-pb-green"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words text-sm leading-6">
                            {item.message}
                          </p>
                          {item.created_at && (
                            <p className={`mt-1 text-[10px] ${isUser ? "text-white/65" : "text-slate-500"}`}>
                              {formatDate(item.created_at)}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {sending && (
                    <div className="flex justify-start">
                      <div
                        role="status"
                        aria-live="polite"
                        className="rounded-2xl rounded-bl-md border border-pb-border-soft bg-white px-4 py-3 text-sm text-slate-600 shadow-sm"
                      >
                        <span>AI उत्तर तयार करत आहे</span>
                        <span className="ml-1 inline-flex gap-1" aria-hidden="true">
                          <span className="animate-pulse">●</span>
                          <span className="animate-pulse [animation-delay:150ms]">●</span>
                          <span className="animate-pulse [animation-delay:300ms]">●</span>
                        </span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {chatError && (
              <p role="alert" className="mx-4 mb-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700 sm:mx-6">
                {chatError}
              </p>
            )}

            <form
              onSubmit={handleSubmit}
              className="sticky bottom-0 border-t border-pb-border-soft bg-white p-3 sm:p-4"
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
                    className="max-h-36 min-h-12 w-full resize-y rounded-xl border border-[#d8d1bf] bg-white px-4 py-3 text-sm text-pb-green outline-none placeholder:text-slate-500 focus:border-pb-khaki focus:ring-2 focus:ring-pb-khaki/20 disabled:bg-slate-50"
                  />
                  <p className="mt-1 text-right text-[11px] text-slate-500">
                    {message.length}/2000 · Enter पाठवा · Shift + Enter नवीन ओळ
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={submitDisabled}
                  className="mb-5 shrink-0 rounded-xl bg-pb-green px-4 py-3 text-sm font-bold text-white transition hover:bg-pb-khaki disabled:cursor-not-allowed disabled:opacity-50 sm:px-6"
                >
                  {sending ? "थांबा..." : "विचारा"}
                </button>
              </div>
            </form>
          </div>
        </section>

        <aside className="w-full shrink-0 rounded-2xl bg-white p-4 shadow-sm lg:w-72">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-extrabold text-pb-green">Chat History</h2>
            <button
              type="button"
              onClick={handleDeleteHistory}
              disabled={deleting || sessions.length === 0}
              className="text-xs font-bold text-red-700 hover:underline disabled:cursor-not-allowed disabled:opacity-40"
            >
              {deleting ? "Delete होत आहे..." : "History Delete करा"}
            </button>
          </div>
          {sessions.length ? (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:max-h-[60vh] lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden">
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
                    className={`min-w-52 rounded-xl border p-3 text-left transition lg:min-w-0 ${
                      active
                        ? "border-pb-khaki bg-pb-light"
                        : "border-pb-border-soft bg-white hover:border-pb-khaki"
                    }`}
                  >
                    <span className="block truncate text-sm font-bold text-pb-green">
                      {firstQuestion || "नवीन संभाषण"}
                    </span>
                    <span className="mt-1 block text-xs text-slate-500">
                      {formatDate(session.updated_at || session.created_at)}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="mt-3 rounded-xl bg-pb-light p-3 text-sm text-slate-500">
              अजून जतन केलेली Chat History नाही.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}

export default AIAssistant;
