import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getStudents } from "../../services/admin/adminStudentService";
import api from "../../services/api";

const PER_PAGE = 20;

const getProfilePhotoUrl = (photoPath) => {
  if (!photoPath) return "";
  try {
    const backendOrigin = new URL(api.defaults.baseURL).origin;
    return new URL(photoPath, backendOrigin).toString();
  } catch {
    return "";
  }
};

function StudentAvatar({ photoPath, initial }) {
  const [imageFailed, setImageFailed] = useState(false);
  const photoUrl = getProfilePhotoUrl(photoPath);

  if (!photoUrl || imageFailed) {
    return (
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pb-green text-sm font-extrabold text-white">
        {initial}
      </span>
    );
  }

  return (
    <img
      src={photoUrl}
      alt=""
      onError={() => setImageFailed(true)}
      className="h-10 w-10 shrink-0 rounded-full border border-pb-border object-cover"
    />
  );
}

const formatDate = (value) => {
  if (!value) return "Not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not available"
    : date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
};

function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: PER_PAGE,
    total: 0,
    pages: 0,
  });
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    let isCurrent = true;

    const loadStudents = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await getStudents({
          page,
          per_page: PER_PAGE,
          search: debouncedSearch,
        });
        const data = response?.data;

        if (
          !response?.success ||
          !Array.isArray(data?.students) ||
          !data?.pagination
        ) {
          throw new Error("Student response is incomplete.");
        }

        if (isCurrent) {
          setStudents(data.students);
          setPagination(data.pagination);
        }
      } catch {
        if (isCurrent) {
          setError("विद्यार्थी माहिती लोड करता आली नाही.");
          setStudents([]);
        }
      } finally {
        if (isCurrent) setLoading(false);
      }
    };

    loadStudents();

    return () => {
      isCurrent = false;
    };
  }, [page, debouncedSearch, reload]);

  const firstResult = pagination.total === 0
    ? 0
    : (pagination.page - 1) * pagination.per_page + 1;
  const lastResult = Math.min(
    pagination.page * pagination.per_page,
    pagination.total,
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-7 border-b border-pb-border pb-5">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-pb-khaki">
          विद्यार्थी व्यवस्थापन
        </p>
        <h1 className="mt-2 text-2xl font-extrabold text-pb-green sm:text-3xl">
          Student Management
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Manage registered Police Bharti students.
        </p>
      </div>

      <section className="rounded-lg border border-pb-border bg-white p-4 sm:p-5">
        <label htmlFor="student-search" className="mb-2 block text-sm font-bold text-pb-green">
          Search students
        </label>
        <input
          id="student-search"
          type="search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="विद्यार्थी शोधा..."
          className="w-full max-w-xl rounded-lg border border-pb-border bg-pb-light px-4 py-3 text-sm text-pb-green outline-none transition focus:border-pb-khaki focus:ring-2 focus:ring-pb-khaki/20"
        />
      </section>

      <section className="mt-6 overflow-hidden rounded-lg border border-pb-border bg-white">
        <div className="flex flex-col gap-1 border-b border-pb-border-soft px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <h2 className="font-extrabold text-pb-green">Registered students</h2>
          {!loading && !error && (
            <p className="text-xs font-semibold text-slate-500">
              Showing {firstResult}–{lastResult} of {pagination.total} students
            </p>
          )}
        </div>

        {loading ? (
          <div role="status" className="px-5 py-12 text-center">
            <span className="mx-auto block h-8 w-8 animate-spin rounded-full border-4 border-pb-border border-t-pb-khaki" />
            <p className="mt-3 text-sm font-semibold text-pb-green">Loading students...</p>
          </div>
        ) : error ? (
          <div role="alert" className="px-5 py-10 text-center">
            <p className="text-sm font-semibold text-red-700">{error}</p>
            <button
              type="button"
              onClick={() => setReload((current) => current + 1)}
              className="mt-4 rounded-lg bg-pb-green px-4 py-2 text-sm font-bold text-white hover:bg-pb-khaki"
            >
              Retry
            </button>
          </div>
        ) : students.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="font-bold text-pb-green">
              {debouncedSearch
                ? "तुमच्या शोधाशी जुळणारे विद्यार्थी आढळले नाहीत."
                : "विद्यार्थी उपलब्ध नाहीत."}
            </p>
            {debouncedSearch && (
              <p className="mt-1 text-sm text-slate-500">
                Try a different name, email, or mobile number.
              </p>
            )}
          </div>
        ) : (
          <>
          <div className="space-y-3 p-3 xl:hidden">
            {students.map((student) => {
              const name = student.name || "Student";
              const photo = student.profile?.profile_photo;
              const initial = name.trim().charAt(0).toUpperCase() || "S";
              return (
                <article key={student.id} className="min-w-0 rounded-xl border border-pb-border-soft bg-white p-4 shadow-sm">
                  <div className="flex min-w-0 items-center gap-3">
                    <StudentAvatar key={`${student.id}-${photo || "no-photo"}`} photoPath={photo} initial={initial} />
                    <div className="min-w-0 flex-1"><h2 className="break-words font-bold text-pb-green">{name}</h2><p className="break-all text-sm text-slate-600">{student.email || "Not available"}</p></div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${student.is_active ? "bg-[#e8eee3] text-pb-green" : "bg-[#f2ecda] text-pb-khaki"}`}>{student.is_active ? "Active" : "Inactive"}</span>
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-pb-border-soft pt-3 text-sm">
                    {[["Mobile", student.mobile], ["District", student.profile?.district], ["Target exam", student.profile?.target_exam], ["Joined", formatDate(student.created_at)]].map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-xs font-semibold text-slate-500">{label}</dt><dd className="mt-0.5 break-words font-semibold text-pb-green">{value || "Not available"}</dd></div>)}
                  </dl>
                  <Link to={`/admin/students/${student.id}`} className="mt-4 flex min-h-11 items-center justify-center rounded-lg border border-pb-khaki px-4 py-2 text-sm font-bold text-pb-green">View student</Link>
                </article>
              );
            })}
          </div>
          <div className="hidden overflow-x-auto xl:block">
            <table className="w-full min-w-[1050px] border-collapse text-left text-sm">
              <thead className="bg-pb-light text-xs uppercase tracking-wide text-pb-green">
                <tr>
                  {["#", "Student", "Email", "Mobile", "District", "Target Exam", "Status", "Joined", "Action"].map((heading) => (
                    <th key={heading} scope="col" className="whitespace-nowrap px-4 py-3 font-bold">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-pb-border-soft">
                {students.map((student, index) => {
                  const name = student.name || "Student";
                  const photo = student.profile?.profile_photo;
                  const initial = name.trim().charAt(0).toUpperCase() || "S";

                  return (
                    <tr key={student.id} className="hover:bg-pb-light/60">
                      <td className="px-4 py-3 text-slate-500">
                        {(pagination.page - 1) * pagination.per_page + index + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex min-w-44 items-center gap-3">
                          <StudentAvatar
                            key={`${student.id}-${photo || "no-photo"}`}
                            photoPath={photo}
                            initial={initial}
                          />
                          <span className="font-bold text-pb-green">{name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{student.email || "Not available"}</td>
                      <td className="px-4 py-3 text-slate-600">{student.mobile || "Not available"}</td>
                      <td className="px-4 py-3 text-slate-600">{student.profile?.district || "Not available"}</td>
                      <td className="px-4 py-3 text-slate-600">{student.profile?.target_exam || "Not available"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${student.is_active ? "bg-[#e8eee3] text-pb-green" : "bg-[#f2ecda] text-pb-khaki"}`}>
                          {student.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(student.created_at)}</td>
                      <td className="px-4 py-3">
                        <Link
                          to={`/admin/students/${student.id}`}
                          className="inline-flex rounded-md border border-pb-khaki px-3 py-1.5 text-xs font-bold text-pb-green transition hover:bg-pb-light"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          </>
        )}

        {!loading && !error && pagination.pages > 0 && (
          <div className="flex flex-col gap-3 border-t border-pb-border-soft px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p className="text-sm font-semibold text-slate-600">
              Page {pagination.page} of {pagination.pages}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="rounded-md border border-pb-border px-4 py-2 text-sm font-bold text-pb-green hover:bg-pb-light disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={pagination.page >= pagination.pages}
                onClick={() => setPage((current) => Math.min(pagination.pages, current + 1))}
                className="rounded-md border border-pb-border px-4 py-2 text-sm font-bold text-pb-green hover:bg-pb-light disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default AdminStudents;
