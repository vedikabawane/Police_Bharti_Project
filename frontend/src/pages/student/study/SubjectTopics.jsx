import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getTopicsBySubject } from "../../../services/studyService";
import { logClientDiagnostic } from "../../../services/apiErrorLogging";

function SubjectTopics() {
  const { subjectId } = useParams();
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;

    setTopics([]);
    setError("");
    setLoading(true);

    const fetchTopics = async () => {
      if (!subjectId) {
        if (isActive) {
          setError("विषय सापडला नाही. कृपया पुन्हा प्रयत्न करा.");
          setLoading(false);
        }
        return;
      }

      try {
        const response = await getTopicsBySubject(subjectId);

        if (!response.success || !Array.isArray(response.data)) {
          logClientDiagnostic("API returned an unexpected topics payload.");
          if (isActive) {
            setError("विषयातील टॉपिक्स लोड करताना समस्या आली. कृपया पुन्हा प्रयत्न करा.");
          }
          return;
        }

        if (isActive) {
          setTopics(response.data);
        }
      } catch {
        if (isActive) {
          setError("विषयातील टॉपिक्स लोड करताना समस्या आली. कृपया पुन्हा प्रयत्न करा.");
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    fetchTopics();

    return () => {
      isActive = false;
    };
  }, [subjectId]);

  return (
    <div className="min-h-screen bg-pb-light">

      {/* Header */}
      <section className="border-b border-pb-border bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

          <Link
            to="/student/study"
            className="inline-flex items-center gap-2 text-sm font-bold text-pb-khaki transition-colors hover:text-pb-khaki"
          >
            ← सर्व विषय
          </Link>

          <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <p className="text-sm font-bold text-pb-khaki">
                📚 Study Material
              </p>

              <h1 className="mt-2 text-2xl font-extrabold text-pb-green sm:text-3xl">
                विषयाचे Topics
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                निवडलेल्या विषयातील विविध topics मधून अभ्यास सुरू करा.
              </p>
            </div>

            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-pb-green text-3xl shadow-lg">
              📖
            </div>

          </div>

        </div>
      </section>

      {/* Subject Information */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        <div className="rounded-3xl bg-pb-green p-6 text-white shadow-lg sm:p-8">

          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <p className="text-sm font-semibold text-[#d7c56f]">
                Subject ID
              </p>

              <h2 className="mt-2 text-2xl font-extrabold">
                Subject #{subjectId}
              </h2>

              <p className="mt-2 text-sm text-slate-300">
                या विषयासाठी उपलब्ध असलेले टॉपिक्स खाली दिले आहेत.
              </p>
            </div>

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-pb-khaki text-2xl">
              📚
            </div>

          </div>

        </div>

      </section>

      {/* Topics */}
      <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">

        <div className="mb-6">
          <h2 className="text-xl font-extrabold text-pb-green">
            Topics
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Topic निवडा आणि त्यातील अभ्यास साहित्य पहा.
          </p>
        </div>

        {loading ? (
          <div
            className="rounded-2xl bg-white p-8 text-center text-sm font-medium text-slate-500 shadow-sm"
            role="status"
            aria-live="polite"
          >
            <span className="mx-auto mb-3 block h-8 w-8 animate-spin rounded-full border-4 border-pb-border border-t-pb-khaki" />
            टॉपिक्स लोड होत आहेत...
          </div>
        ) : error ? (
          <div
            className="rounded-2xl border border-red-200 bg-white p-6 text-center text-sm text-red-700 shadow-sm"
            role="alert"
          >
            {error}
          </div>
        ) : topics.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-pb-light text-3xl">
              📚
            </div>

            <h3 className="mt-5 text-lg font-extrabold text-pb-green">
              टॉपिक्स उपलब्ध नाहीत
            </h3>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
              या विषयासाठी सध्या कोणतेही टॉपिक्स उपलब्ध नाहीत.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {topics.map((topic) => (
              <Link
                key={topic.id}
                to={`/student/study/${subjectId}/topic/${topic.id}`}
                state={{ topic }}
                className="block rounded-2xl bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pb-khaki"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-pb-light text-2xl">
                  📚
                </div>

                <h3 className="mt-5 font-extrabold text-pb-green">
                  {topic.name}
                </h3>

                {topic.description && (
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {topic.description}
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

export default SubjectTopics;
