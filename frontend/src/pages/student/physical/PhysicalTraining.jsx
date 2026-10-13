import { useCallback, useEffect, useRef, useState } from "react";
import {
  createPhysicalTrainingRecord,
  deletePhysicalTrainingRecord,
  getLatestPhysicalTraining,
  getPhysicalTrainingRecord,
  getPhysicalTrainingRecords,
  updatePhysicalTrainingRecord,
} from "../../../services/physicalTrainingService";

const metricGroups = [
  {
    title: "Running",
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
    fields: [
      { key: "shot_put", label: "Shot Put", unit: "मीटर" },
      { key: "push_ups", label: "Push-ups", unit: "वेळा", integer: true },
    ],
  },
  {
    title: "शरीराचे मोजमाप",
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
        return (Array.isArray(messages) ? messages : [messages])
          .map((message) => `${label}: ${message}`);
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

function MetricGrid({ record }) {
  return (
    <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
      {metrics.map(({ key, label, unit }) => (
        <div key={key} className="min-w-0 rounded-xl bg-pb-light p-3">
          <dt className="text-xs font-bold text-slate-500">{label}</dt>
          <dd className="mt-1 break-words text-sm font-extrabold text-pb-green">
            {record[key] == null ? "नोंद नाही" : `${record[key]} ${unit}`}
          </dd>
        </div>
      ))}
    </dl>
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
            return {
              success: false,
              data: null,
            };
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
    if (loadingRecord || submittingRef.current || deletingRef.current) {
      return;
    }

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
    if (submittingRef.current || loadingRecord) {
      return;
    }

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
      if (value === "") {
        continue;
      }

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
    if (submittingRef.current) {
      return;
    }

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
    if (!recordToDelete || deletingRef.current) {
      return;
    }

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
    <div className="min-h-screen bg-pb-light">
      <section className="border-b border-pb-border bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div>
            <p className="text-sm font-bold text-pb-khaki">🏃 Physical Training</p>
            <h1 className="mt-2 text-2xl font-extrabold text-pb-green sm:text-3xl">
              शारीरिक प्रशिक्षण
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              तुमच्या प्रशिक्षणाच्या नोंदी आणि मागील कामगिरी येथे पहा.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={openForm}
              className="rounded-xl bg-pb-green px-5 py-3 text-sm font-bold text-white transition hover:bg-pb-khaki"
            >
              नवीन Record जोडा
            </button>
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-pb-green text-3xl shadow-lg">
              🏃
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {successMessage && (
          <p
            role="status"
            className="rounded-xl border border-green-200 bg-white px-4 py-3 text-sm font-bold text-pb-green"
          >
            {successMessage}
          </p>
        )}

        {showForm && (
          <section
            aria-labelledby="add-training-heading"
            className="rounded-2xl bg-white p-5 shadow-sm sm:p-7"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-pb-khaki">नवीन नोंद</p>
                <h2
                  id="add-training-heading"
                  className="mt-1 text-xl font-extrabold text-pb-green"
                >
                  {editingRecordId
                    ? "Physical Training Record अपडेट करा"
                    : "नवीन Physical Training Record"}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeForm}
                disabled={submitting || loadingRecord}
                className="rounded-lg px-3 py-2 text-sm font-bold text-slate-600 hover:bg-pb-light disabled:cursor-not-allowed disabled:opacity-50"
              >
                बंद करा
              </button>
            </div>

            {loadingRecord ? (
              <div role="status" aria-live="polite" className="mt-6 rounded-xl bg-pb-light p-6 text-center text-sm font-medium text-slate-600">
                नोंदीची माहिती लोड होत आहे...
              </div>
            ) : editLoadFailed ? (
              <div className="mt-6">
                <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {formError}
                </p>
                <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeForm}
                    className="rounded-xl border border-[#d8d1bf] px-5 py-3 text-sm font-bold text-pb-green hover:bg-pb-light"
                  >
                    रद्द करा
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditForm(editingRecordId)}
                    className="rounded-xl bg-pb-green px-5 py-3 text-sm font-bold text-white hover:bg-pb-khaki"
                  >
                    पुन्हा प्रयत्न करा
                  </button>
                </div>
              </div>
            ) : (
            <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
              <fieldset>
                <legend className="mb-3 text-sm font-extrabold text-pb-green">
                  मूलभूत माहिती
                </legend>
                <label className="block max-w-sm text-sm font-bold text-slate-700" htmlFor="training-date">
                  दिनांक <span className="text-red-600">*</span>
                </label>
                <input
                  id="training-date"
                  name="date"
                  type="date"
                  required
                  value={formValues.date}
                  onChange={handleFieldChange}
                  className="mt-2 w-full rounded-xl border border-[#d8d1bf] bg-white px-4 py-3 text-sm text-pb-green outline-none focus:border-pb-khaki focus:ring-2 focus:ring-pb-khaki/20"
                />
              </fieldset>

              {metricGroups.map((group) => (
                <fieldset key={group.title}>
                  <legend className="mb-3 text-sm font-extrabold text-pb-green">
                    {group.title}
                  </legend>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {group.fields.map(({ key, label, unit, integer }) => (
                      <div key={key}>
                        <label
                          htmlFor={`training-${key}`}
                          className="block text-sm font-bold text-slate-700"
                        >
                          {label} <span className="font-normal text-slate-500">({unit})</span>
                        </label>
                        <input
                          id={`training-${key}`}
                          name={key}
                          type="number"
                          min="0"
                          step={integer ? "1" : "0.01"}
                          inputMode={integer ? "numeric" : "decimal"}
                          placeholder={integer ? "उदा. 20" : "उदा. 12.50"}
                          value={formValues[key]}
                          onChange={handleFieldChange}
                          className="mt-2 w-full rounded-xl border border-[#d8d1bf] bg-white px-4 py-3 text-sm text-pb-green outline-none focus:border-pb-khaki focus:ring-2 focus:ring-pb-khaki/20"
                        />
                      </div>
                    ))}
                  </div>
                </fieldset>
              ))}

              {formError && (
                <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {formError}
                </p>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-pb-border-soft pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={submitting || loadingRecord}
                  className="rounded-xl border border-[#d8d1bf] px-5 py-3 text-sm font-bold text-pb-green transition hover:bg-pb-light disabled:cursor-not-allowed disabled:opacity-50"
                >
                  रद्द करा
                </button>
                <button
                  type="submit"
                  disabled={submitting || loadingRecord}
                  className="rounded-xl bg-pb-green px-5 py-3 text-sm font-bold text-white transition hover:bg-pb-khaki disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting
                    ? editingRecordId
                      ? "Record अपडेट करत आहे..."
                      : "Record Save करत आहे..."
                    : editingRecordId
                      ? "Record Update करा"
                      : "Record Save करा"}
                </button>
              </div>
            </form>
            )}
          </section>
        )}

        {recordToDelete && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            role="presentation"
          >
            <section
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="delete-training-heading"
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            >
              <h2 id="delete-training-heading" className="text-lg font-extrabold text-pb-green">
                नोंद हटवण्याची खात्री करा
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                हा Physical Training Record delete करायचा आहे का?
              </p>
              {formError && (
                <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                  {formError}
                </p>
              )}
              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setRecordToDelete(null)}
                  disabled={deletingRecordId === recordToDelete.id}
                  className="rounded-xl border border-[#d8d1bf] px-5 py-3 text-sm font-bold text-pb-green hover:bg-pb-light disabled:cursor-not-allowed disabled:opacity-50"
                >
                  रद्द करा
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={deletingRecordId === recordToDelete.id}
                  className="rounded-xl bg-red-700 px-5 py-3 text-sm font-bold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deletingRecordId === recordToDelete.id
                    ? "नोंद हटवत आहे..."
                    : "Delete करा"}
                </button>
              </div>
            </section>
          </div>
        )}

        {loading ? (
          <div
            role="status"
            aria-live="polite"
            className="rounded-2xl bg-white p-8 text-center text-sm font-medium text-slate-500 shadow-sm"
          >
            <span className="mx-auto mb-3 block h-8 w-8 animate-spin rounded-full border-4 border-pb-border border-t-pb-khaki" />
            प्रशिक्षणाच्या नोंदी लोड होत आहेत...
          </div>
        ) : error ? (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-white p-6 text-center text-sm text-red-700 shadow-sm"
          >
            <p>{error}</p>
            <button
              type="button"
              onClick={loadRecords}
              className="mt-4 rounded-xl bg-pb-green px-5 py-3 font-bold text-white transition hover:bg-pb-khaki"
            >
              पुन्हा प्रयत्न करा
            </button>
          </div>
        ) : records.length === 0 ? (
          <section className="rounded-2xl bg-white px-5 py-10 text-center shadow-sm sm:px-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-pb-light text-2xl">
              🏃
            </div>
            <h2 className="mt-4 text-lg font-extrabold text-pb-green">
              अजून कोणतीही Physical Training नोंद उपलब्ध नाही.
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              नवीन नोंद जोडल्यावर तुमचा प्रशिक्षण इतिहास येथे दिसेल.
            </p>
            <button
              type="button"
              onClick={openForm}
              className="mt-5 rounded-xl bg-pb-green px-5 py-3 text-sm font-bold text-white transition hover:bg-pb-khaki"
            >
              नवीन Record जोडा
            </button>
          </section>
        ) : (
          <>
            {latestRecord && (
              <section aria-labelledby="latest-training-heading">
                <div className="mb-4">
                  <p className="text-sm font-bold text-pb-khaki">Latest Performance</p>
                  <h2
                    id="latest-training-heading"
                    className="mt-1 text-xl font-extrabold text-pb-green"
                  >
                    नवीनतम प्रशिक्षण नोंद
                  </h2>
                </div>
                <article className="rounded-2xl border border-pb-border bg-white p-5 shadow-sm sm:p-6">
                  <p className="text-sm font-bold text-slate-500">दिनांक</p>
                  <p className="mt-1 text-lg font-extrabold text-pb-green">
                    {latestRecord.date || "दिनांक उपलब्ध नाही"}
                  </p>
                  <MetricGrid record={latestRecord} />
                </article>
              </section>
            )}

            <section aria-labelledby="training-history-heading">
              <div className="mb-4">
                <p className="text-sm font-bold text-pb-khaki">Training History</p>
                <h2
                  id="training-history-heading"
                  className="mt-1 text-xl font-extrabold text-pb-green"
                >
                  प्रशिक्षण इतिहास
                </h2>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                {records.map((record) => (
                  <article
                    key={record.id}
                    className="min-w-0 rounded-2xl bg-white p-5 shadow-sm sm:p-6"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold text-pb-khaki">
                          प्रशिक्षण दिनांक
                        </p>
                        <h3 className="mt-1 text-lg font-extrabold text-pb-green">
                          {record.date || "दिनांक उपलब्ध नाही"}
                        </h3>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEditForm(record.id)}
                          disabled={loadingRecord || submitting || deletingRecordId !== null}
                          className="rounded-lg border border-[#d8d1bf] px-3 py-2 text-xs font-bold text-pb-green hover:bg-pb-light disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          संपादित करा
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFormError("");
                            setRecordToDelete(record);
                          }}
                          disabled={loadingRecord || submitting || deletingRecordId !== null}
                          className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          हटवा
                        </button>
                      </div>
                    </div>
                    <MetricGrid record={record} />
                  </article>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

export default PhysicalTraining;
