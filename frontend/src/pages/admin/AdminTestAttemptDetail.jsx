import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { getAdminTestAttempt } from "../../services/admin/adminTestAttemptService";

function formatDate(value) {
  if (!value) return "Not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not available" : date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDuration(seconds) {
  if (seconds === null || seconds === undefined || seconds <= 0) return "Not available";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

function SummaryCard({ title, children, className = "" }) {
  return <section className={`rounded-lg border border-pb-border bg-white p-4 sm:p-5 ${className}`}><h2 className="text-sm font-extrabold text-pb-green">{title}</h2><div className="mt-3">{children}</div></section>;
}

function DataField({ label, value }) {
  return <div className="min-w-0 border-b border-pb-border-soft pb-2"><dt className="text-xs font-bold text-slate-500">{label}</dt><dd className="mt-1 break-words text-sm font-semibold text-pb-green">{value ?? "—"}</dd></div>;
}

function statusStyle(status) {
  if (status === "correct") return "bg-[#e8eee3] text-pb-green";
  if (status === "wrong") return "bg-red-50 text-red-700";
  if (status === "skipped" || status === "unanswered") return "bg-[#f2ecda] text-pb-khaki";
  return "bg-slate-100 text-slate-700";
}

function statusLabel(status) {
  return ({
    correct: "Correct",
    wrong: "Wrong",
    skipped: "Skipped",
    saved: "Saved · in progress",
    unanswered: "Unanswered · in progress",
  })[status] || status;
}

function QuestionReview({ question }) {
  const selectedOption = question.options.find((option) => option.label === question.selected_option);
  const correctOption = question.options.find((option) => option.label === question.correct_option);
  return (
    <article className="rounded-lg border border-pb-border bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pb-green text-sm font-extrabold text-white">{question.question_number}</span>
          <h3 className="whitespace-pre-wrap break-words pt-1 text-sm font-bold leading-6 text-pb-green">{question.question_text}</h3>
        </div>
        <span className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${statusStyle(question.result_status)}`}>{statusLabel(question.result_status)}</span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg bg-pb-light p-3"><p className="text-xs font-bold text-slate-500">Student answer</p><p className="mt-1 break-words text-sm font-semibold text-pb-green">{selectedOption ? `${selectedOption.label}. ${selectedOption.text}` : "No answer"}</p></div>
        {question.correct_option && <div className="rounded-lg bg-[#e8eee3] p-3"><p className="text-xs font-bold text-slate-500">Correct answer</p><p className="mt-1 break-words text-sm font-semibold text-pb-green">{correctOption ? `${correctOption.label}. ${correctOption.text}` : question.correct_option}</p></div>}
      </div>
      {question.marks_earned !== null && <p className="mt-3 text-xs font-semibold text-slate-600">Marks earned: <span className="text-pb-green">{question.marks_earned}</span></p>}
    </article>
  );
}

function AdminTestAttemptDetail() {
  const { attemptId } = useParams();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let current = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await getAdminTestAttempt(attemptId);
        if (!response?.success || !response.data?.attempt || !response.data?.student || !response.data?.test || !response.data?.result || !Array.isArray(response.data.questions)) {
          throw new Error("Attempt detail response is incomplete.");
        }
        if (current) setDetail(response.data);
      } catch {
        if (current) {
          setDetail(null);
          setError("Unable to load this test attempt. Please try again.");
        }
      } finally {
        if (current) setLoading(false);
      }
    };
    load();
    return () => { current = false; };
  }, [attemptId, reload]);

  if (loading) return <div role="status" className="mx-auto max-w-7xl px-4 py-12 text-center text-sm font-semibold text-pb-green">Loading attempt…</div>;
  if (error || !detail) return <div className="mx-auto max-w-3xl px-4 py-8"><section role="alert" className="rounded-lg border border-red-200 bg-white p-6"><p className="font-semibold text-red-700">{error || "Attempt not found."}</p><div className="mt-4 flex flex-wrap gap-3"><button type="button" onClick={() => setReload((value) => value + 1)} className="rounded-lg bg-pb-green px-4 py-2.5 text-sm font-bold text-white">Retry</button><Link to="/admin/test-attempts" className="rounded-lg border border-pb-border px-4 py-2.5 text-sm font-bold text-pb-green">Back to attempts</Link></div></section></div>;

  const { attempt, student, test, result, questions } = detail;
  const completed = attempt.status === "submitted";
  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-6 border-b border-pb-border pb-5">
        <Link to="/admin/test-attempts" className="text-sm font-bold text-pb-khaki hover:text-pb-khaki">← Back to test attempts</Link>
        <p className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-pb-khaki">READ ONLY · ATTEMPT {attempt.attempt_id}</p>
        <h1 className="mt-1 break-words text-2xl font-extrabold text-pb-green sm:text-3xl">{test.title}</h1>
        <div className="mt-3 inline-flex rounded-full bg-[#f2ecda] px-3 py-1 text-xs font-bold text-pb-khaki">{attempt.status === "submitted" ? "Submitted" : "In progress"}</div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SummaryCard title="Student summary">
          <dl className="grid gap-3 sm:grid-cols-2"><DataField label="Name" value={student.name} /><DataField label="Email" value={student.email} /><DataField label="Student ID" value={student.student_id} /></dl>
        </SummaryCard>
        <SummaryCard title="Test summary">
          <dl className="grid gap-3 sm:grid-cols-2"><DataField label="Test" value={test.title} /><DataField label="Type" value={test.test_type?.replaceAll("_", " ").toUpperCase()} /><DataField label="Questions" value={test.total_questions} /><DataField label="Duration" value={`${test.duration_minutes} minutes`} /></dl>
        </SummaryCard>
        <SummaryCard title="Score summary" className="lg:col-span-2">
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><DataField label="Score" value={completed ? `${result.score} / ${result.total_marks}` : "Pending submission"} /><DataField label="Percentage" value={completed ? `${result.percentage}%` : "Pending"} /><DataField label="Accuracy" value={completed ? `${result.accuracy}%` : "Pending"} /><DataField label="Correct / Wrong / Skipped" value={completed ? `${result.correct_count} / ${result.wrong_count} / ${result.skipped_count}` : "Pending submission"} /></dl>
          <dl className="mt-4 grid gap-3 border-t border-pb-border-soft pt-4 sm:grid-cols-2 lg:grid-cols-4"><DataField label="Rank" value={result.rank ?? "Not available"} /><DataField label="Previous score" value={result.previous_score ?? "Not available"} /><DataField label="Previous percentage" value={result.previous_percentage === null ? "Not available" : `${result.previous_percentage}%`} /><DataField label="Improvement" value={result.improvement_percentage_points === null ? "Not available" : `${result.improvement_percentage_points} percentage points`} /></dl>
        </SummaryCard>
        <SummaryCard title="Timing" className="lg:col-span-2">
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><DataField label="Started" value={formatDate(attempt.started_at)} /><DataField label="Completed" value={formatDate(attempt.completed_at)} /><DataField label="Time taken" value={formatDuration(attempt.time_taken_seconds)} /><DataField label="Allowed time" value={`${attempt.duration_minutes} minutes`} /></dl>
        </SummaryCard>
      </div>

      <section className="mt-6">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2"><div><h2 className="text-lg font-extrabold text-pb-green">Question-wise review</h2><p className="mt-1 text-sm text-slate-600">{completed ? "Saved answers and submitted scoring" : "Saved answers only; correctness is not available before submission"}</p></div><span className="text-xs font-semibold text-slate-500">{questions.length} questions</span></div>
        {questions.length === 0 ? <div className="rounded-lg border border-pb-border bg-white p-8 text-center text-sm text-slate-600">No question data is available for this attempt.</div> : <div className="space-y-3">{questions.map((question) => <QuestionReview key={question.question_id} question={question} />)}</div>}
      </section>
    </div>
  );
}

export default AdminTestAttemptDetail;
