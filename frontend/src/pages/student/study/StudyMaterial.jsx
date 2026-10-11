import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getSubjects } from "../../../services/studyService";

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
          console.error("Unexpected subjects response:", response);
          if (isActive) {
            setError("अभ्यासाचे विषय लोड करताना समस्या आली. कृपया पुन्हा प्रयत्न करा.");
          }
          return;
        }

        if (isActive) {
          setSubjects(response.data);
        }
      } catch (requestError) {
        console.error("Failed to load subjects:", requestError);
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
      <section className="border-b border-pb-border bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <p className="text-sm font-bold text-pb-khaki">
                📚 Study Center
              </p>

              <h1 className="mt-2 text-2xl font-extrabold text-pb-green sm:text-3xl">
                अभ्यास साहित्य
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Police Bharti परीक्षेच्या तयारीसाठी विषयानुसार
                अभ्यास साहित्य, notes आणि learning resources मिळवा.
              </p>
            </div>

            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-pb-green text-3xl shadow-lg">
              📚
            </div>

          </div>

        </div>
      </section>

      {/* Subjects */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        <div className="mb-6">
          <h2 className="text-xl font-extrabold text-pb-green">
            विषय निवडा
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            ज्या विषयाचा अभ्यास करायचा आहे तो विषय निवडा.
          </p>
        </div>

        {loading ? (
          <div
            className="rounded-2xl bg-white p-8 text-center text-sm font-medium text-slate-500 shadow-sm"
            role="status"
            aria-live="polite"
          >
            <span className="mx-auto mb-3 block h-8 w-8 animate-spin rounded-full border-4 border-pb-border border-t-pb-khaki" />
            विषय लोड होत आहेत...
          </div>
        ) : error ? (
          <div
            className="rounded-2xl border border-red-200 bg-white p-6 text-center text-sm text-red-700 shadow-sm"
            role="alert"
          >
            {error}
          </div>
        ) : subjects.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
            सध्या कोणतेही विषय उपलब्ध नाहीत.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

            {subjects.map((subject) => (

              <Link
                key={subject.id}
                to={`/student/study/${subject.id}`}
                className="group block rounded-2xl bg-white p-6 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pb-khaki"
              >

                <div className="flex items-start justify-between">

                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-pb-light text-2xl transition-all duration-300 group-hover:scale-110">
                    📖
                  </div>

                  <span className="text-lg text-slate-500 transition-all group-hover:translate-x-1 group-hover:text-pb-khaki">
                    →
                  </span>

                </div>

                <h3 className="mt-5 font-extrabold text-pb-green">
                  {subject.name}
                </h3>

                {subject.description && (
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {subject.description}
                  </p>
                )}

              </Link>

            ))}

          </div>
        )}

      </section>

    </div>
  );
}

export default StudyMaterial;