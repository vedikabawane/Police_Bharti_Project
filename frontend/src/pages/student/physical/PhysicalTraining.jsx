import { useCallback, useEffect, useRef, useState } from "react";
import {
  createPhysicalTrainingRecord,
  deletePhysicalTrainingRecord,
  getLatestPhysicalTraining,
  getPhysicalTrainingRecord,
  getPhysicalTrainingRecords,
  updatePhysicalTrainingRecord,
} from "../../../services/physicalTrainingService";

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

const RunIcon = (p) => (
  <svg {...iconProps} {...p}>
    <circle cx="15" cy="4.5" r="1.8" />
    <path d="m5 20 3-6 3 2 3-1" />
    <path d="m13 10-3 3-3-5" />
    <path d="M14 15l3 5" />
  </svg>
);
const PlusIcon = (p) => (
  <svg {...iconProps} strokeWidth="2" {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
const EditIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="m4 20 4-1 10-10a2 2 0 0 0-3-3L5 16l-1 4Z" />
    <path d="m14 6 3 3" />
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
const CloseIcon = (p) => (
  <svg {...iconProps} strokeWidth="2" {...p}>
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
);
const CalendarIcon = (p) => (
  <svg {...iconProps} {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M8 3v4M16 3v4M3 10h18" />
  </svg>
);
const TimerIcon = (p) => (
  <svg {...iconProps} {...p}>
    <circle cx="12" cy="13" r="8" />
    <path d="M12 9v4l2 2M9 2h6" />
  </svg>
);
const RulerIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M3 8h18v8H3z" />
    <path d="M7 8v3M11 8v4M15 8v3M19 8v4" />
  </svg>
);
const WeightIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M6 8h12l2 12H4L6 8Z" />
    <path d="M9 8a3 3 0 1 1 6 0" />
  </svg>
);
const TargetIcon = (p) => (
  <svg {...iconProps} {...p}>
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="12" cy="12" r="1" />
  </svg>
);
const ActivityIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M3 12h3l2-6 4 12 3-9 2 3h4" />
    <path d="M3 20h18" />
  </svg>
);
const AlertIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M10.3 3.9 2.4 17a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9v4M12 17h.01" />
  </svg>
);
const CheckCircleIcon = (p) => (
  <svg {...iconProps} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m8.5 12 2.5 2.5L16 9.5" />
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
const TrophyIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M8 3h8v6a4 4 0 0 1-8 0Z" />
    <path d="M8 5H5v2a3 3 0 0 0 3 3M16 5h3v2a3 3 0 0 1-3 3" />
    <path d="M10 13v3h4v-3M8 19h8M9 16h6" />
  </svg>
);
const HistoryIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M3 12a9 9 0 1 0 3-6.7" />
    <path d="M3 4v5h5" />
    <path d="M12 8v4l3 2" />
  </svg>
);

/* ---------- METRIC ICON MAP ---------- */
const metricIcons = {
  running: RunIcon,
  run_100m: TimerIcon,
  run_800m: TimerIcon,
  run_1600m: TimerIcon,
  running_distance: RulerIcon,
  running_time: TimerIcon,
  shot_put: TargetIcon,
  push_ups: ActivityIcon,
  weight: WeightIcon,
};

const metricGroups = [
  {
    title: "Running",
    icon: RunIcon,
    fields: [
      { key: "running", label: "Running", unit: "सेकंद" },
      { key: "run_100m", label: "100 मीटर", unit: "सेकंद" },
      { key: "run_800m", label: "800 मीटर", unit: "सेकंद" },
      { key: "run_1600m", label: "1600 मीटर", unit: "सेकंद" },
      { key: "running_distance", label: "Running Distance", unit: "मीटर" },
      { key: "running_time", label: "Running Time", unit: "सेकंद" },
    ],
  },
  {
    title: "इतर शारीरिक उपक्रम",
    icon: ActivityIcon,
    fields: [
      { key: "shot_put", label: "Shot Put", unit: "मीटर" },
      { key: "push_ups", label: "Push-ups", unit: "वेळा", integer: true },
    ],
  },
  {
    title: "शरीराचे मोजमाप",
    icon: WeightIcon,
    fields: [{ key: "weight", label: "Weight", unit: "कि.ग्रॅ." }],
  },
];

const metrics = metricGroups.flatMap((group) => group.fields);
const metricByKey = Object.fromEntries(metrics.map((metric) => [metric.key, metric]));

function getTodayDate() {
  const today = new Date();
  const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
}

function createEmptyForm() {
  return {
    date: getTodayDate(),
    ...Object.fromEntries(metrics.map(({ key }) => [key, ""])),
  };
}

function getRequestErrorMessage(requestError) {
  const status = requestError.response?.status;
  const responseData = requestError.response?.data;

  if (status === 400) {
    return responseData?.message || "कृपया दिनांक आणि नोंद तपासा.";
  }
  if (status === 422) {
    const validationMessages = Object.entries(responseData?.errors || {})
      .flatMap(([field, messages]) => {
        const label = metricByKey[field]?.label || (field === "date" ? "दिनांक" : field);
        return (Array.isArray(messages) ? messages : [messages]).map(
          (message) => `${label}: ${message}`,
        );
      });
    return validationMessages.length
      ? validationMessages.join(" ")
      : responseData?.message || "नोंदीतील माहिती वैध नाही. कृपया तपासा.";
  }
  if (status === 401) {
    return "तुमचे सत्र संपले आहे. कृपया पुन्हा लॉग इन करा.";
  }
  if (status === 403) {
    return "या नोंदीसाठी तुम्हाला परवानगी नाही.";
  }
  if (status === 404) {
    return "ही नोंद उपलब्ध नाही किंवा आधीच हटवली गेली आहे.";
  }
  if (!requestError.response) {
    return "सर्व्हरशी संपर्क होऊ शकला नाही. कृपया पुन्हा प्रयत्न करा.";
  }
  return responseData?.message || "नोंद जतन करता आली नाही. कृपया पुन्हा प्रयत्न करा.";
}

/* ---------- SHARED ANIMATIONS ---------- */
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
      .animate-blob { animation: blobMove 22s ease-in-out infinite; }
      .delay-2 { animation-delay: 4s; }
      .delay-4 { animation-delay: 8s; }
      .animate-fade-up { animation: fadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }
      .animate-gradient { background-size: 220% 220%; animation: gradientPan 9s ease infinite; }
      .animate-soft-glow { animation: softGlow 4.5s ease-in-out infinite; }
      .animate-spin-soft { animation: spinSoft 0.9s linear infinite; }
      .animate-overlay-in { animation: overlayIn 0.2s ease-out both; }
      .animate-dialog-in { animation: dialogIn 0.28s cubic-bezier(0.22, 1, 0.36, 1) both; }
      @media (prefers-reduced-motion: reduce) {
        .animate-blob, .animate-fade-up, .animate-gradient,
        .animate-soft-glow, .animate-spin-soft,
        .animate-overlay-in, .animate-dialog-in { animation: none !important; }
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

/* ---------- METRIC TILE ---------- */
function MetricTile({ metric, record }) {
  const Icon = metricIcons[metric.key] || ActivityIcon;
  const raw = record?.[metric.key];
  const missing = raw == null;

  return (
    <div className="min-w-0 rounded-xl border border-pb-border-soft bg-white/70 p-3 transition-colors duration-200 hover:bg-white">
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-pb-green/10 text-pb-green">
          <Icon className="h-3.5 w-3.5" />
        </span>
        <p className="truncate text-[10px] font-bold tracking-wide text-slate-500 uppercase">
          {metric.label}
        </p>
      </div>
      <p
        className={`mt-1.5 text-sm font-extrabold break-words ${
          missing ? "text-slate-400" : "text-pb-green"
        }`}
      >
        {missing ? "नोंद नाही" : `${raw} ${metric.unit}`}
      </p>
    </div>
  );
}

/* ---------- METRIC GRID ---------- */
function MetricGrid({ record, groups = metricGroups }) {
  return (
    <dl className="mt-4 space-y-4">
      {groups.map((group) => {
        const GroupIcon = group.icon || ActivityIcon;
        return (
          <div key={group.title}>
            <dt className="mb-2 flex items-center gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-pb-green/10 text-pb-green">
                <GroupIcon className="h-3 w-3" />
              </span>
              <span className="text-[10px] font-extrabold tracking-[0.14em] text-slate-500 uppercase">
                {group.title}
              </span>
              <span className="h-px flex-1 bg-gradient-to-r from-pb-border to-transparent" />
            </dt>
            <dd className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {group.fields.map((metric) => (
                <MetricTile key={metric.key} metric={metric} record={record} />
              ))}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

/* ---------- FIELD INPUT ---------- */
function MetricInput({ metric, value, onChange }) {
  const Icon = metricIcons[metric.key] || ActivityIcon;
  return (
    <div>
      <label
        htmlFor={`training-${metric.key}`}
        className="flex items-center gap-2 text-xs font-bold text-pb-green"
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-pb-green/10 text-pb-green">
          <Icon className="h-3.5 w-3.5" />
        </span>
        <span className="min-w-0 truncate">{metric.label}</span>
        <span className="ml-auto shrink-0 text-[10px] font-semibold text-slate-500">
          {metric.unit}
        </span>
      </label>
      <input
        id={`training-${metric.key}`}
        name={metric.key}
        type="number"
        min="0"
        step={metric.integer ? "1" : "0.01"}
        inputMode={metric.integer ? "numeric" : "decimal"}
        placeholder={metric.integer ? "उदा. 20" : "उदा. 12.50"}
        value={value}
        onChange={onChange}
        className="mt-2 w-full rounded-xl border border-[#d8d1bf] bg-white px-3.5 py-2.5 text-sm font-semibold text-pb-green transition-all duration-200 outline-none placeholder:font-normal placeholder:text-slate-400 focus:border-pb-khaki focus:ring-4 focus:ring-pb-khaki/15"
      />
    </div>
  );
}

function PhysicalTraining() {
  const [records, setRecords] = useState([]);
  const [latestRecord, setLatestRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState(null);
  const [loadingRecord, setLoadingRecord] = useState(false);
  const [editLoadFailed, setEditLoadFailed] = useState(false);
  const [formValues, setFormValues] = useState(createEmptyForm);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingRecordId, setDeletingRecordId] = useState(null);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const isMounted = useRef(false);
  const submittingRef = useRef(false);
  const deletingRef = useRef(false);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [historyResponse, latestResponse] = await Promise.all([
        getPhysicalTrainingRecords(),
        getLatestPhysicalTraining().catch((requestError) => {
          if (requestError.response?.status === 404) {
            return { success: false, data: null };
          }
          throw requestError;
        }),
      ]);

      if (!historyResponse.success || !Array.isArray(historyResponse.data)) {
        throw new Error("Unexpected physical training history response");
      }

      if (
        latestResponse.success &&
        (!latestResponse.data || typeof latestResponse.data !== "object")
      ) {
        throw new Error("Unexpected latest physical training response");
      }

      if (isMounted.current) {
        setRecords(historyResponse.data);
        setLatestRecord(latestResponse.success ? latestResponse.data : null);
      }
      return true;
    } catch {
      if (isMounted.current) {
        setError("शारीरिक प्रशिक्षणाच्या नोंदी लोड करता आल्या नाहीत.");
      }
      return false;
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    loadRecords();

    return () => {
      isMounted.current = false;
    };
  }, [loadRecords]);

  const openForm = () => {
    setEditingRecordId(null);
    setEditLoadFailed(false);
    setFormValues(createEmptyForm());
    setFormError("");
    setSuccessMessage("");
    setShowForm(true);
  };

  const openEditForm = async (recordId) => {
    if (loadingRecord || submittingRef.current || deletingRef.current) return;

    setShowForm(true);
    setLoadingRecord(true);
    setEditingRecordId(recordId);
    setEditLoadFailed(false);
    setFormValues(createEmptyForm());
    setFormError("");
    setSuccessMessage("");

    try {
      const response = await getPhysicalTrainingRecord(recordId);
      if (!response.success || !response.data?.id) {
        throw new Error("Unexpected physical training record response");
      }

      const record = response.data;
      const values = createEmptyForm();
      values.date = record.date ? record.date.slice(0, 10) : "";
      for (const { key } of metrics) {
        values[key] = record[key] == null ? "" : String(record[key]);
      }

      if (isMounted.current) {
        setFormValues(values);
      }
    } catch (requestError) {
      if (isMounted.current) {
        setFormError(
          requestError.response
            ? getRequestErrorMessage(requestError)
            : "नोंदीची माहिती लोड करता आली नाही. कृपया पुन्हा प्रयत्न करा.",
        );
        setEditLoadFailed(true);
      }
    } finally {
      if (isMounted.current) {
        setLoadingRecord(false);
      }
    }
  };

  const closeForm = () => {
    if (submittingRef.current || loadingRecord) return;

    setShowForm(false);
    setEditingRecordId(null);
    setEditLoadFailed(false);
    setFormValues(createEmptyForm());
    setFormError("");
  };

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setFormValues((currentValues) => ({
      ...currentValues,
      [name]: value,
    }));
    setFormError("");
  };

  const validateForm = () => {
    if (!formValues.date) {
      return "कृपया दिनांक निवडा.";
    }
    if (metrics.every(({ key }) => formValues[key] === "")) {
      return "कृपया किमान एक शारीरिक कामगिरीची नोंद भरा.";
    }
    for (const { key, label, integer } of metrics) {
      const value = formValues[key];
      if (value === "") continue;

      const numericValue = Number(value);
      if (!Number.isFinite(numericValue) || numericValue < 0) {
        return `${label} साठी शून्य किंवा त्यापेक्षा मोठी वैध संख्या द्या.`;
      }
      if (integer && !Number.isInteger(numericValue)) {
        return `${label} साठी पूर्ण संख्या द्या.`;
      }
      if (!integer && !/^\d+(\.\d{1,2})?$/.test(value)) {
        return `${label} साठी जास्तीत जास्त दोन दशांश स्थानांची संख्या द्या.`;
      }
    }
    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submittingRef.current) return;

    const validationMessage = validateForm();
    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    const payload = { date: formValues.date };
    for (const { key, integer } of metrics) {
      const value = formValues[key];
      if (value !== "") {
        payload[key] = integer ? Number(value) : value;
      }
    }

    submittingRef.current = true;
    setSubmitting(true);
    setFormError("");
    setSuccessMessage("");

    try {
      const response = editingRecordId
        ? await updatePhysicalTrainingRecord(editingRecordId, payload)
        : await createPhysicalTrainingRecord(payload);
      if (!response.success || !response.data?.id) {
        throw new Error("Unexpected save response");
      }

      setShowForm(false);
      setEditingRecordId(null);
      setFormValues(createEmptyForm());
      setSuccessMessage(
        editingRecordId
          ? "Physical Training Record यशस्वीरित्या अपडेट झाला."
          : "Physical Training Record यशस्वीरित्या जतन झाला.",
      );
      await loadRecords();
    } catch (requestError) {
      if (isMounted.current) {
        setFormError(
          requestError.response
            ? getRequestErrorMessage(requestError)
            : requestError.message === "Unexpected save response"
              ? "नोंद जतन किंवा अपडेट झाली नाही. कृपया पुन्हा प्रयत्न करा."
              : getRequestErrorMessage(requestError),
        );
      }
    } finally {
      submittingRef.current = false;
      if (isMounted.current) {
        setSubmitting(false);
      }
    }
  };

  const confirmDelete = async () => {
    if (!recordToDelete || deletingRef.current) return;

    const recordId = recordToDelete.id;
    deletingRef.current = true;
    setDeletingRecordId(recordId);
    setFormError("");

    try {
      const response = await deletePhysicalTrainingRecord(recordId);
      if (!response.success) {
        throw new Error("Unexpected delete response");
      }
      if (isMounted.current) {
        setRecordToDelete(null);
        setSuccessMessage("Physical Training Record यशस्वीरित्या हटवला.");
      }
      await loadRecords();
    } catch (requestError) {
      if (isMounted.current) {
        setFormError(
          requestError.response
            ? getRequestErrorMessage(requestError)
            : requestError.message === "Unexpected delete response"
              ? "नोंद हटवता आली नाही. कृपया पुन्हा प्रयत्न करा."
              : getRequestErrorMessage(requestError),
        );
      }
    } finally {
      deletingRef.current = false;
      if (isMounted.current) {
        setDeletingRecordId(null);
      }
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-pb-light">
      <AnimationStyles />
      <AnimatedBackground />

      <div className="relative z-10">

        {/* ================= PAGE HEADER ================= */}
        <section className="animate-fade-up mx-auto mt-4 w-[calc(100%-2rem)] max-w-7xl overflow-hidden rounded-2xl border border-pb-border/50 bg-white/85 shadow-sm backdrop-blur-sm sm:mt-6 sm:w-[calc(100%-3rem)] lg:w-[calc(100%-4rem)]">
          <span
            aria-hidden="true"
            className="animate-gradient pointer-events-none block h-1 w-full bg-gradient-to-r from-pb-green via-pb-khaki to-pb-green"
          />
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex min-w-0 items-center gap-4">
              <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-pb-green to-[#0f3d2e] text-white shadow-md">
                <span
                  aria-hidden="true"
                  className="animate-soft-glow pointer-events-none absolute -inset-1 rounded-3xl bg-pb-khaki/30 blur-md"
                />
                <RunIcon className="relative h-6 w-6" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold tracking-[0.16em] text-pb-khaki uppercase sm:text-xs">
                  Physical Training
                </p>
                <h1 className="mt-1 text-xl leading-tight font-extrabold tracking-tight text-pb-green sm:text-2xl lg:text-3xl">
                  शारीरिक प्रशिक्षण
                </h1>
                <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-600 sm:text-sm">
                  तुमच्या प्रशिक्षणाच्या नोंदी आणि मागील कामगिरी येथे पहा.
                </p>
              </div>
            </div>

            {/* Action button */}
            <button
              type="button"
              onClick={openForm}
              className="group inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pb-green to-[#0f3d2e] px-5 py-2.5 text-sm font-extrabold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:from-pb-khaki hover:to-[#c9b95f] hover:shadow-lg active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:ring-offset-2 focus-visible:outline-none sm:w-auto"
            >
              <PlusIcon className="h-4 w-4" />
              नवीन Record जोडा
            </button>
          </div>
        </section>

        <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">

          {/* ================= SUCCESS ================= */}
          {successMessage && (
            <div
              role="status"
              className="animate-fade-up flex items-start gap-2.5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800"
            >
              <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="min-w-0 break-words">{successMessage}</span>
            </div>
          )}

          {/* ================= FORM ================= */}
          {showForm && (
            <section
              aria-labelledby="add-training-heading"
              className="animate-fade-up overflow-hidden rounded-2xl border border-pb-border bg-white/90 shadow-sm backdrop-blur-sm"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 border-b border-pb-border-soft bg-pb-light/50 px-5 py-4 sm:px-6">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-pb-green/10 text-pb-green">
                    {editingRecordId ? (
                      <EditIcon className="h-4 w-4" />
                    ) : (
                      <PlusIcon className="h-4 w-4" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold tracking-[0.14em] text-pb-khaki uppercase">
                      {editingRecordId ? "नोंद अपडेट" : "नवीन नोंद"}
                    </p>
                    <h2
                      id="add-training-heading"
                      className="mt-0.5 text-base leading-tight font-extrabold tracking-tight text-pb-green sm:text-lg"
                    >
                      {editingRecordId
                        ? "Physical Training Record अपडेट करा"
                        : "नवीन Physical Training Record"}
                    </h2>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={submitting || loadingRecord}
                  aria-label="Close form"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-transparent text-pb-green transition-all duration-200 hover:border-pb-khaki hover:bg-pb-light focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none active:scale-95 disabled:opacity-50"
                >
                  <CloseIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 sm:p-6">
                {loadingRecord ? (
                  <div
                    role="status"
                    aria-live="polite"
                    className="flex flex-col items-center justify-center gap-3 rounded-xl bg-pb-light px-5 py-10 text-center"
                  >
                    <SpinnerIcon className="animate-spin-soft h-8 w-8 text-pb-khaki" />
                    <p className="text-sm font-semibold text-pb-green">
                      नोंदीची माहिती लोड होत आहे...
                    </p>
                  </div>
                ) : editLoadFailed ? (
                  <div className="space-y-4">
                    <div
                      role="alert"
                      className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
                    >
                      <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
                      <span className="min-w-0 break-words">{formError}</span>
                    </div>
                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                      <button
                        type="button"
                        onClick={closeForm}
                        className="inline-flex min-h-11 items-center justify-center rounded-xl border border-pb-border bg-white px-5 py-2.5 text-sm font-bold text-pb-green transition-all duration-200 hover:-translate-y-0.5 hover:bg-pb-light hover:shadow-sm active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none"
                      >
                        रद्द करा
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditForm(editingRecordId)}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pb-green to-[#0f3d2e] px-5 py-2.5 text-sm font-extrabold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:from-pb-khaki hover:to-[#c9b95f] hover:shadow-lg active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:ring-offset-2 focus-visible:outline-none"
                      >
                        <RefreshIcon className="h-4 w-4" />
                        पुन्हा प्रयत्न करा
                      </button>
                    </div>
                  </div>
                ) : (
                  <form className="space-y-6" onSubmit={handleSubmit}>
                    {/* Date field */}
                    <fieldset>
                      <legend className="mb-3 flex items-center gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-pb-green/10 text-pb-green">
                          <CalendarIcon className="h-3 w-3" />
                        </span>
                        <span className="text-[10px] font-extrabold tracking-[0.14em] text-slate-500 uppercase">
                          मूलभूत माहिती
                        </span>
                        <span className="h-px flex-1 bg-gradient-to-r from-pb-border to-transparent" />
                      </legend>
                      <label
                        className="block max-w-sm text-sm font-bold text-pb-green"
                        htmlFor="training-date"
                      >
                        दिनांक <span className="text-red-600">*</span>
                      </label>
                      <input
                        id="training-date"
                        name="date"
                        type="date"
                        required
                        value={formValues.date}
                        onChange={handleFieldChange}
                        className="mt-2 w-full rounded-xl border border-[#d8d1bf] bg-white px-4 py-3 text-sm font-semibold text-pb-green transition-all duration-200 outline-none focus:border-pb-khaki focus:ring-4 focus:ring-pb-khaki/15"
                      />
                    </fieldset>

                    {/* Metric groups */}
                    {metricGroups.map((group) => {
                      const GroupIcon = group.icon || ActivityIcon;
                      return (
                        <fieldset key={group.title}>
                          <legend className="mb-3 flex items-center gap-2">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-pb-green/10 text-pb-green">
                              <GroupIcon className="h-3 w-3" />
                            </span>
                            <span className="text-[10px] font-extrabold tracking-[0.14em] text-slate-500 uppercase">
                              {group.title}
                            </span>
                            <span className="h-px flex-1 bg-gradient-to-r from-pb-border to-transparent" />
                          </legend>
                          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {group.fields.map((metric) => (
                              <MetricInput
                                key={metric.key}
                                metric={metric}
                                value={formValues[metric.key]}
                                onChange={handleFieldChange}
                              />
                            ))}
                          </div>
                        </fieldset>
                      );
                    })}

                    {/* Form error */}
                    {formError && (
                      <div
                        role="alert"
                        className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
                      >
                        <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
                        <span className="min-w-0 break-words">{formError}</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col-reverse gap-3 border-t border-pb-border-soft pt-5 sm:flex-row sm:justify-end">
                      <button
                        type="button"
                        onClick={closeForm}
                        disabled={submitting || loadingRecord}
                        className="inline-flex min-h-11 items-center justify-center rounded-xl border border-pb-border bg-white px-5 py-2.5 text-sm font-bold text-pb-green transition-all duration-200 hover:-translate-y-0.5 hover:bg-pb-light hover:shadow-sm active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                      >
                        रद्द करा
                      </button>
                      <button
                        type="submit"
                        disabled={submitting || loadingRecord}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pb-green to-[#0f3d2e] px-5 py-2.5 text-sm font-extrabold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:from-pb-khaki hover:to-[#c9b95f] hover:shadow-lg active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-wait disabled:opacity-60 disabled:hover:translate-y-0"
                      >
                        {submitting ? (
                          <>
                            <SpinnerIcon className="animate-spin-soft h-4 w-4" />
                            {editingRecordId ? "Record अपडेट करत आहे..." : "Record Save करत आहे..."}
                          </>
                        ) : (
                          editingRecordId ? "Record Update करा" : "Record Save करा"
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </section>
          )}

          {/* ================= DELETE DIALOG ================= */}
          {recordToDelete && (
            <div
              className="animate-overlay-in fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
              role="presentation"
            >
              <section
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="delete-training-heading"
                className="animate-dialog-in relative w-full max-w-md overflow-hidden rounded-2xl border border-pb-border bg-white shadow-2xl"
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-500 via-red-600 to-red-500"
                />
                <div className="p-5 sm:p-6">
                  <div className="flex items-start gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-red-600 to-red-700 text-white shadow-md">
                      <TrashIcon className="h-6 w-6" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h2
                        id="delete-training-heading"
                        className="text-lg leading-tight font-extrabold tracking-tight text-pb-green"
                      >
                        नोंद हटवण्याची खात्री करा
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        हा Physical Training Record delete करायचा आहे का?
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRecordToDelete(null)}
                      disabled={deletingRecordId === recordToDelete.id}
                      aria-label="Close dialog"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-transparent text-pb-green transition-all duration-200 hover:border-pb-khaki hover:bg-pb-light focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none active:scale-95 disabled:opacity-50"
                    >
                      <CloseIcon className="h-5 w-5" />
                    </button>
                  </div>

                  {formError && (
                    <div
                      role="alert"
                      className="mt-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-semibold text-red-700"
                    >
                      <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
                      <span className="min-w-0 break-words">{formError}</span>
                    </div>
                  )}

                  <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={() => setRecordToDelete(null)}
                      disabled={deletingRecordId === recordToDelete.id}
                      className="inline-flex min-h-11 items-center justify-center rounded-xl border border-pb-border bg-white px-4 py-2.5 text-sm font-bold text-pb-green transition-all duration-200 hover:-translate-y-0.5 hover:bg-pb-light hover:shadow-sm active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
                    >
                      रद्द करा
                    </button>
                    <button
                      type="button"
                      onClick={confirmDelete}
                      disabled={deletingRecordId === recordToDelete.id}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-700 to-red-600 px-5 py-2.5 text-sm font-extrabold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:from-red-800 hover:to-red-700 hover:shadow-lg active:translate-y-0 focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-wait disabled:opacity-60 disabled:hover:translate-y-0"
                    >
                      {deletingRecordId === recordToDelete.id ? (
                        <>
                          <SpinnerIcon className="animate-spin-soft h-4 w-4" />
                          नोंद हटवत आहे...
                        </>
                      ) : (
                        <>
                          <TrashIcon className="h-4 w-4" />
                          Delete करा
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* ================= LOADING ================= */}
          {loading ? (
            <div
              role="status"
              aria-live="polite"
              className="animate-fade-up flex flex-col items-center justify-center gap-3 rounded-2xl border border-pb-border bg-white/85 px-5 py-12 text-center backdrop-blur-sm"
            >
              <SpinnerIcon className="animate-spin-soft h-10 w-10 text-pb-khaki" />
              <p className="text-sm font-semibold text-pb-green">
                प्रशिक्षणाच्या नोंदी लोड होत आहेत...
              </p>
            </div>
          ) : error ? (
            /* ================= ERROR ================= */
            <div
              role="alert"
              className="animate-fade-up overflow-hidden rounded-2xl border border-red-200 bg-white/90 backdrop-blur-sm"
            >
              <span
                aria-hidden="true"
                className="block h-1 w-full bg-gradient-to-r from-red-500 via-red-600 to-red-500"
              />
              <div className="flex flex-col items-center gap-4 p-6 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                  <AlertIcon className="h-6 w-6" />
                </span>
                <p className="text-sm font-semibold text-red-700">{error}</p>
                <button
                  type="button"
                  onClick={loadRecords}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-pb-green to-[#0f3d2e] px-5 py-2.5 text-sm font-extrabold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:from-pb-khaki hover:to-[#c9b95f] hover:shadow-lg active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  <RefreshIcon className="h-4 w-4" />
                  पुन्हा प्रयत्न करा
                </button>
              </div>
            </div>
          ) : records.length === 0 ? (
            /* ================= EMPTY ================= */
            <section className="animate-fade-up flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#d9d2c3] bg-white/70 px-5 py-14 text-center backdrop-blur-sm">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-pb-light text-pb-khaki">
                <RunIcon className="h-6 w-6" />
              </span>
              <h2 className="text-base font-extrabold text-pb-green sm:text-lg">
                अजून कोणतीही Physical Training नोंद उपलब्ध नाही.
              </h2>
              <p className="max-w-md text-sm text-slate-500">
                नवीन नोंद जोडल्यावर तुमचा प्रशिक्षण इतिहास येथे दिसेल.
              </p>
              <button
                type="button"
                onClick={openForm}
                className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-pb-green to-[#0f3d2e] px-5 py-2.5 text-sm font-extrabold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:from-pb-khaki hover:to-[#c9b95f] hover:shadow-lg active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <PlusIcon className="h-4 w-4" />
                नवीन Record जोडा
              </button>
            </section>
          ) : (
            <>
              {/* ================= LATEST RECORD ================= */}
              {latestRecord && (
                <section
                  aria-labelledby="latest-training-heading"
                  className="animate-fade-up"
                >
                  <div className="mb-4 flex items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pb-khaki/15 text-pb-khaki">
                      <TrophyIcon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-[10px] font-bold tracking-[0.14em] text-pb-khaki uppercase">
                        Latest Performance
                      </p>
                      <h2
                        id="latest-training-heading"
                        className="mt-0.5 text-lg leading-tight font-extrabold tracking-tight text-pb-green sm:text-xl"
                      >
                        नवीनतम प्रशिक्षण नोंद
                      </h2>
                    </div>
                  </div>

                  <article className="relative overflow-hidden rounded-2xl border border-pb-border bg-white/90 p-5 shadow-sm backdrop-blur-sm sm:p-6">
                    <span
                      aria-hidden="true"
                      className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-pb-green via-pb-khaki to-pb-green"
                    />
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-pb-khaki/10 blur-3xl"
                    />

                    <div className="flex flex-wrap items-center justify-between gap-3 pl-2">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-pb-green/10 text-pb-green">
                          <CalendarIcon className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="text-[10px] font-bold tracking-wide text-slate-500 uppercase">
                            दिनांक
                          </p>
                          <p className="mt-0.5 text-base font-extrabold text-pb-green sm:text-lg">
                            {latestRecord.date || "दिनांक उपलब्ध नाही"}
                          </p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-pb-khaki/30 bg-pb-khaki/10 px-3 py-1 text-[10px] font-extrabold tracking-wide text-pb-khaki uppercase">
                        <span className="h-1.5 w-1.5 rounded-full bg-pb-khaki" />
                        Latest
                      </span>
                    </div>

                    <div className="pl-2">
                      <MetricGrid record={latestRecord} />
                    </div>
                  </article>
                </section>
              )}

              {/* ================= HISTORY ================= */}
              <section
                aria-labelledby="training-history-heading"
                className="animate-fade-up"
                style={{ animationDelay: "80ms" }}
              >
                <div className="mb-4 flex items-center gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pb-green/10 text-pb-green">
                    <HistoryIcon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold tracking-[0.14em] text-pb-khaki uppercase">
                      Training History
                    </p>
                    <h2
                      id="training-history-heading"
                      className="mt-0.5 text-lg leading-tight font-extrabold tracking-tight text-pb-green sm:text-xl"
                    >
                      प्रशिक्षण इतिहास
                    </h2>
                  </div>
                  <span className="rounded-full border border-pb-border-soft bg-pb-light px-2.5 py-0.5 text-[11px] font-bold tabular-nums text-pb-green">
                    {records.length}
                  </span>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  {records.map((record, index) => (
                    <article
                      key={record.id}
                      className="animate-fade-up group relative min-w-0 overflow-hidden rounded-2xl border border-pb-border bg-white/90 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-pb-khaki/40 hover:shadow-md"
                      style={{ animationDelay: `${Math.min(index * 40, 400)}ms` }}
                    >
                      <span
                        aria-hidden="true"
                        className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-pb-green via-pb-khaki to-pb-green opacity-70"
                      />

                      {/* Header */}
                      <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5 pb-3 sm:px-6">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-pb-green/10 text-pb-green">
                            <CalendarIcon className="h-4 w-4" />
                          </span>
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold tracking-wide text-slate-500 uppercase">
                              प्रशिक्षण दिनांक
                            </p>
                            <h3 className="mt-0.5 text-base leading-tight font-extrabold text-pb-green sm:text-lg">
                              {record.date || "दिनांक उपलब्ध नाही"}
                            </h3>
                          </div>
                        </div>

                        {/* Actions — full-width row on mobile, inline on sm+ */}
                        <div className="flex w-full gap-2 sm:w-auto">
                          <button
                            type="button"
                            onClick={() => openEditForm(record.id)}
                            disabled={
                              loadingRecord ||
                              submitting ||
                              deletingRecordId !== null
                            }
                            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-pb-border bg-white px-3 py-2 text-xs font-bold text-pb-green transition-all duration-200 hover:-translate-y-0.5 hover:border-pb-khaki hover:bg-pb-light hover:shadow-sm active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 sm:flex-initial"
                          >
                            <EditIcon className="h-3.5 w-3.5" />
                            संपादित करा
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFormError("");
                              setRecordToDelete(record);
                            }}
                            disabled={
                              loadingRecord ||
                              submitting ||
                              deletingRecordId !== null
                            }
                            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-50 hover:shadow-sm active:translate-y-0 focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 sm:flex-initial"
                          >
                            <TrashIcon className="h-3.5 w-3.5" />
                            हटवा
                          </button>
                        </div>
                      </div>

                      {/* Metrics */}
                      <div className="px-5 pb-5 sm:px-6">
                        <MetricGrid record={record} />
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default PhysicalTraining;