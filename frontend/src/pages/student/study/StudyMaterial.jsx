import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getSubjects } from "../../../services/studyService";
import { logClientDiagnostic } from "../../../services/apiErrorLogging";

function StudyMaterial() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;

    const fetchSubjects = async () => {
      try {
        const response = await getSubjects();

        if (!response.success || !Array.isArray(response.data)) {
          logClientDiagnostic("API returned an unexpected subjects payload.");
          if (isActive) {
            setError("अभ्यासाचे विषय लोड करताना समस्या आली. कृपया पुन्हा प्रयत्न करा.");
          }
          return;
        }

        if (isActive) {
          setSubjects(response.data);
        }
      } catch {
        if (isActive) {
          setError("अभ्यासाचे विषय लोड करताना समस्या आली. कृपया पुन्हा प्रयत्न करा.");
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    fetchSubjects();

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-pb-light">

      {/* Header */}
      <section className="border-b border-pb-border/70 bg-white">
        <div className="mx-auto max-w-7xl px-3.5 py-4 sm:px-6 sm:py-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs font-bold text-pb-khaki">
            <Link to="/student/dashboard" className="hover:underline">Dashboard</Link>
            <span>/</span>
            <span className="text-slate-500">अभ्यास साहित्य</span>
          </div>

          <div className="mt-2 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-extrabold text-pb-green sm:text-2xl lg:text-3xl">
                अभ्यास साहित्य (Study Material)
              </h1>
              <p className="mt-1 max-w-2xl text-xs sm:text-sm text-slate-500">
                Police Bharti परीक्षेच्या तयारीसाठी विषयानुसार नोट्स आणि अभ्यास साहित्य मिळवा.
              </p>
            </div>

            <div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-pb-green text-2xl shadow-sm sm:flex">
              📚
            </div>
          </div>
        </div>
      </section>

      {/* Subjects */}
      <section className="mx-auto max-w-7xl px-3.5 py-4 sm:px-6 sm:py-6 lg:px-8">
        <div className="mb-4 sm:mb-6">
          <h2 className="text-base font-extrabold text-pb-green sm:text-xl">
            विषय निवडा
          </h2>
          <p className="mt-0.5 text-xs sm:text-sm text-slate-500">
            ज्या विषयाचा अभ्यास करायचा आहे तो विषय निवडा.
          </p>
        </div>

        {loading ? (
          <div
            className="rounded-2xl border border-pb-border/80 bg-white p-8 text-center text-sm font-semibold text-slate-500 shadow-xs"
            role="status"
            aria-live="polite"
          >
            <span className="mx-auto mb-3 block h-8 w-8 animate-spin rounded-full border-4 border-pb-border border-t-pb-khaki" />
            विषय लोड होत आहेत...
          </div>
        ) : error ? (
          <div
            className="rounded-2xl border border-red-200 bg-white p-6 text-center text-xs sm:text-sm font-bold text-red-700 shadow-xs"
            role="alert"
          >
            {error}
          </div>
        ) : subjects.length === 0 ? (
          <div className="rounded-2xl border border-pb-border/80 bg-white p-8 text-center text-xs sm:text-sm text-slate-500 shadow-xs">
            सध्या कोणतेही विषय उपलब्ध नाहीत.
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((subject) => (
              <Link
                key={subject.id}
                to={`/student/study/${subject.id}`}
                className="group flex flex-col justify-between rounded-xl border border-pb-border/80 bg-white p-4 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-pb-khaki hover:shadow-md active:scale-[0.99] sm:rounded-2xl sm:p-5"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-pb-light text-xl transition-all duration-200 group-hover:scale-105 sm:h-12 sm:w-12 sm:text-2xl">
                      📖
                    </span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-pb-light/60 text-sm font-bold text-slate-400 transition-all group-hover:bg-pb-khaki group-hover:text-white">
                      →
                    </span>
                  </div>

                  <h3 className="mt-3 text-sm sm:text-base font-extrabold text-pb-green group-hover:text-pb-khaki">
                    {subject.name}
                  </h3>

                  {subject.description && (
                    <p className="mt-1 text-xs leading-5 text-slate-500 line-clamp-2">
                      {subject.description}
                    </p>
                  )}
                </div>

                <div className="mt-3.5 flex items-center justify-between border-t border-pb-border/50 pt-2 text-xs font-bold text-pb-khaki">
                  <span>घटक आणि नोट्स पहा</span>
                  <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}

export default StudyMaterial;
