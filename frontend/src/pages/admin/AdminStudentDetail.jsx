import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  getStudent,
  getStudentPerformance,
  updateStudentStatus,
} from "../../services/admin/adminStudentService";
import AdminStudentPerformance from "../../components/admin/AdminStudentPerformance";
import api from "../../services/api";

const formatValue = (value) => (
  value === null || value === undefined || value === ""
    ? "माहिती उपलब्ध नाही"
    : value
);

const formatDate = (value) => {
  if (!value) return "माहिती उपलब्ध नाही";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "माहिती उपलब्ध नाही"
    : date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
};

const getProfilePhotoUrl = (photoPath) => {
  if (!photoPath) return "";
  try {
    return new URL(photoPath, new URL(api.defaults.baseURL).origin).toString();
  } catch {
    return "";
  }
};

function InformationCard({ title, fields }) {
  return (
    <section className="rounded-lg border border-pb-border bg-white p-5 sm:p-6">
      <h2 className="text-lg font-extrabold text-pb-green">{title}</h2>
      <dl className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2">
        {fields.map(([label, value]) => (
          <div key={label} className="min-w-0 border-b border-pb-border-soft pb-3">
            <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
              {label}
            </dt>
            <dd className="mt-1 break-words text-sm font-semibold text-pb-green">
              {formatValue(value)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function AdminStudentDetail() {
  const { studentId } = useParams();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [reload, setReload] = useState(0);
  const [confirmStatus, setConfirmStatus] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusError, setStatusError] = useState("");
  const [performance, setPerformance] = useState(null);
  const [performanceLoading, setPerformanceLoading] = useState(true);
  const [performanceError, setPerformanceError] = useState("");
  const [performanceReload, setPerformanceReload] = useState(0);

  const confirmStatusChange = async () => {
    if (typeof confirmStatus !== "boolean" || updatingStatus) return;
    setUpdatingStatus(true);
    setStatusError("");
    setStatusMessage("");
    try {
      const response = await updateStudentStatus(studentId, confirmStatus);
      if (!response?.success || !response?.data?.student) {
        throw new Error("Status update response is incomplete.");
      }
      setStudent(response.data.student);
      setStatusMessage(`Student ${confirmStatus ? "activated" : "deactivated"} successfully.`);
      setConfirmStatus(null);
    } catch {
      setStatusError("Unable to update student status. Please try again.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  useEffect(() => {
    let isCurrent = true;

    const loadStudent = async () => {
      setLoading(true);
      setStudent(null);
      setError("");
      setNotFound(false);

      try {
        const response = await getStudent(studentId);
        if (!response?.success || !response?.data?.student) {
          throw new Error("Student response is incomplete.");
        }
        if (isCurrent) setStudent(response.data.student);
      } catch (requestError) {
        if (isCurrent) {
          if (requestError.response?.status === 404) {
            setNotFound(true);
          } else {
            setError("विद्यार्थ्याची माहिती लोड करता आली नाही.");
          }
        }
      } finally {
        if (isCurrent) setLoading(false);
      }
    };

    loadStudent();
    return () => {
      isCurrent = false;
    };
  }, [studentId, reload]);

  useEffect(() => {
    if (!student?.id) return undefined;

    let isCurrent = true;
    const loadPerformance = async () => {
      setPerformanceLoading(true);
      setPerformanceError("");
      setPerformance(null);
      try {
        const response = await getStudentPerformance(studentId);
        if (!response?.success || !response?.data) {
          throw new Error("Student performance response is incomplete.");
        }
        if (isCurrent) setPerformance(response.data);
      } catch {
        if (isCurrent) {
          setPerformanceError("Unable to load this student's performance. Please try again.");
        }
      } finally {
        if (isCurrent) setPerformanceLoading(false);
      }
    };

    loadPerformance();
    return () => {
      isCurrent = false;
    };
  }, [student?.id, studentId, performanceReload]);

  const pageLink = (
    <Link
      to="/admin/students"
      className="inline-flex items-center gap-2 rounded-lg border border-pb-border bg-white px-4 py-2.5 text-sm font-bold text-pb-green transition hover:bg-pb-light"
    >
      <span aria-hidden="true">←</span>
      विद्यार्थ्यांच्या यादीकडे परत जा
    </Link>
  );

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {pageLink}
        <div role="status" className="mt-6 rounded-lg border border-pb-border bg-white px-5 py-12 text-center">
          <span className="mx-auto block h-9 w-9 animate-spin rounded-full border-4 border-pb-border border-t-pb-khaki" />
          <p className="mt-3 text-sm font-semibold text-pb-green">विद्यार्थ्याची माहिती लोड होत आहे...</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {pageLink}
        <div role="alert" className="mt-6 rounded-lg border border-pb-border bg-white px-5 py-12 text-center">
          <p className="text-lg font-extrabold text-pb-green">विद्यार्थी सापडला नाही.</p>
          <p className="mt-2 text-sm text-slate-600">दिलेल्या माहितीसाठी विद्यार्थी नोंद उपलब्ध नाही.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {pageLink}
        <div role="alert" className="mt-6 rounded-lg border border-red-200 bg-white px-5 py-10 text-center">
          <p className="text-sm font-semibold text-red-700">{error}</p>
          <button
            type="button"
            onClick={() => setReload((current) => current + 1)}
            className="mt-4 rounded-lg bg-pb-green px-4 py-2 text-sm font-bold text-white hover:bg-pb-khaki"
          >
            पुन्हा प्रयत्न करा / Retry
          </button>
        </div>
      </div>
    );
  }

  const profile = student.profile;
  const name = student.name || "Student";
  const photoUrl = getProfilePhotoUrl(profile?.profile_photo);
  const statusClass = student.is_active
    ? "bg-[#e8eee3] text-pb-green"
    : "bg-[#f2ecda] text-pb-khaki";

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="flex flex-col items-start gap-5 border-b border-pb-border pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-pb-khaki">
            विद्यार्थी माहिती
          </p>
          <h1 className="mt-2 text-2xl font-extrabold text-pb-green sm:text-3xl">
            Student Details
          </h1>
        </div>
        {pageLink}
      </div>

      <section className="mt-6 rounded-lg border border-pb-border border-l-4 border-l-pb-khaki bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt=""
              className="h-24 w-24 shrink-0 rounded-full border border-pb-border object-cover"
            />
          ) : (
            <span className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-pb-green text-3xl font-extrabold text-white">
              {name.trim().charAt(0).toUpperCase() || "S"}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="break-words text-xl font-extrabold text-pb-green sm:text-2xl">
              {name}
            </h2>
            <p className="mt-1 break-all text-sm text-slate-600">{formatValue(student.email)}</p>
            <p className="mt-1 text-sm text-slate-600">{formatValue(student.mobile)}</p>
            <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-bold ${statusClass}`}>
              {student.is_active ? "Active" : "Inactive"}
            </span>
            <div className="mt-4">
              <button
                type="button"
                disabled={updatingStatus}
                onClick={() => {
                  setStatusError("");
                  setStatusMessage("");
                  setConfirmStatus(!student.is_active);
                }}
                className="rounded-lg bg-pb-green px-4 py-2.5 text-sm font-bold text-white transition hover:bg-pb-khaki disabled:cursor-not-allowed disabled:opacity-60"
              >
                {updatingStatus ? "Updating…" : student.is_active ? "Deactivate Student" : "Activate Student"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {statusMessage && <p role="status" className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">{statusMessage}</p>}
      {statusError && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{statusError}</p>}

      {confirmStatus !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="presentation">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="student-status-confirm-title"
            className="w-full max-w-md rounded-xl border border-pb-border bg-white p-6 shadow-xl"
          >
            <h2 id="student-status-confirm-title" className="text-lg font-extrabold text-pb-green">
              Confirm student status change
            </h2>
            <p className="mt-3 text-sm text-slate-700">
              {confirmStatus
                ? "Are you sure you want to activate this student?"
                : "Are you sure you want to deactivate this student?"}
            </p>
            {statusError && <p role="alert" className="mt-3 text-sm font-semibold text-red-700">{statusError}</p>}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={updatingStatus}
                onClick={() => setConfirmStatus(null)}
                className="rounded-lg border border-pb-border px-4 py-2 text-sm font-bold text-pb-green hover:bg-pb-light disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={updatingStatus}
                onClick={confirmStatusChange}
                className="rounded-lg bg-pb-green px-4 py-2 text-sm font-bold text-white hover:bg-pb-khaki disabled:cursor-not-allowed disabled:opacity-60"
              >
                {updatingStatus ? "Updating…" : "Confirm"}
              </button>
            </div>
          </section>
        </div>
      )}

      <div className="mt-6 grid min-w-0 gap-6 lg:grid-cols-2">
        <InformationCard
          title="मूलभूत माहिती · Basic Information"
          fields={[
            ["Name", student.name],
            ["Email", student.email],
            ["Mobile", student.mobile],
            ["Account Status", student.is_active ? "Active" : "Inactive"],
            ["Email Verified", student.email_verified ? "Verified" : "Not verified"],
            ["Joined Date", formatDate(student.created_at)],
          ]}
        />

        <section className="rounded-lg border border-pb-border bg-white p-5 sm:p-6">
          <h2 className="text-lg font-extrabold text-pb-green">
            विद्यार्थी प्रोफाइल · Student Profile
          </h2>
          {profile ? (
            <dl className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2">
              {[
                ["District", profile.district],
                ["Target Exam", profile.target_exam],
                ["Study Goal", profile.study_goal],
                ["Physical Goal", profile.physical_goal],
                ["Education", profile.education],
                ["Qualification", profile.qualification],
                ["Category", profile.category],
                ["Date of Birth", formatDate(profile.date_of_birth)],
                ["Height", profile.height],
                ["Chest", profile.chest],
                ["Weight", profile.weight],
              ].map(([label, value]) => (
                <div key={label} className="min-w-0 border-b border-pb-border-soft pb-3">
                  <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</dt>
                  <dd className="mt-1 break-words text-sm font-semibold text-pb-green">{formatValue(value)}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="mt-5 rounded-lg bg-pb-light px-4 py-6 text-center text-sm font-semibold text-slate-600">
              प्रोफाइल माहिती उपलब्ध नाही.
            </p>
          )}
        </section>
      </div>

      <AdminStudentPerformance
        performance={performance}
        loading={performanceLoading}
        error={performanceError}
        onRetry={() => setPerformanceReload((current) => current + 1)}
      />
    </div>
  );
}

export default AdminStudentDetail;
