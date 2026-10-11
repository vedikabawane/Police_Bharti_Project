import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  getStudentRecruitmentNotice,
  getStudentRecruitmentNoticePdf,
} from "../../services/recruitmentNoticeService";

function formatDate(value) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Date(year, month - 1, day).toLocaleDateString("mr-IN", { day: "numeric", month: "long", year: "numeric" });
}

function safeOfficialUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) return null;
    return url.href;
  } catch {
    return null;
  }
}

function display(value) {
  return value === null || value === undefined || value === "" ? "माहिती उपलब्ध नाही" : value;
}

function RecruitmentNoticeDetail() {
  const { id } = useParams();
  const [result, setResult] = useState({ id: null, notice: null, error: "" });
  const [pdfUrl, setPdfUrl] = useState("");
  const [pdfBusy, setPdfBusy] = useState("");
  const [pdfError, setPdfError] = useState("");

  useEffect(() => {
    let active = true;
    getStudentRecruitmentNotice(id)
      .then((response) => {
        if (!response?.success || !response.data) throw new Error(response?.message || "भरती सूचना उपलब्ध नाही.");
        if (active) setResult({ id, notice: response.data, error: "" });
      })
      .catch((error) => {
        if (active) setResult({
          id,
          notice: null,
          error: error.response?.data?.message || error.message || "भरती सूचना उपलब्ध नाही.",
        });
      });
    return () => { active = false; };
  }, [id]);

  useEffect(() => () => {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
  }, [pdfUrl]);

  const loading = result.id !== id;
  const notice = loading ? null : result.notice;
  const error = loading ? "" : result.error;

  const fetchPdf = async (download) => {
    setPdfBusy(download ? "download" : "view");
    setPdfError("");
    try {
      const response = await getStudentRecruitmentNoticePdf(id, download);
      const blobUrl = URL.createObjectURL(response.data);
      if (download) {
        const anchor = document.createElement("a");
        anchor.href = blobUrl;
        anchor.download = notice.pdf_original_filename || "recruitment-notice.pdf";
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      } else {
        setPdfUrl(blobUrl);
      }
    } catch (requestError) {
      setPdfError(requestError.response?.status === 404
        ? "ही सूचना किंवा PDF आता उपलब्ध नाही."
        : "PDF उघडता आली नाही. पुन्हा प्रयत्न करा.");
    } finally {
      setPdfBusy("");
    }
  };

  if (loading) return <div role="status" className="mx-auto max-w-4xl px-4 py-12 text-center text-sm font-semibold text-slate-600">सूचना लोड होत आहे…</div>;
  if (error || !notice) return <div className="mx-auto max-w-3xl px-4 py-12 text-center"><div role="alert" className="rounded-xl border border-pb-border bg-white p-7"><p className="font-bold text-pb-green">{error || "भरती सूचना उपलब्ध नाही."}</p><Link to="/student/recruitment-notices" className="mt-4 inline-flex rounded-lg bg-pb-green px-4 py-2.5 text-sm font-bold text-white hover:bg-pb-khaki">सर्व भरती सूचना</Link></div></div>;

  const sourceUrl = safeOfficialUrl(notice.official_source_url);
  const details = [
    ["भरती वर्ष", notice.recruitment_year],
    ["विभाग", notice.department],
    ["पद", notice.post_name],
    ["एकूण जागा", notice.vacancies],
    ["अर्ज सुरू", formatDate(notice.application_start_date)],
    ["अर्जाची अंतिम तारीख", formatDate(notice.application_end_date)],
    ["परीक्षा तारीख", formatDate(notice.exam_date)],
  ];

  return (
    <>
      <article className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        <Link to="/student/recruitment-notices" className="inline-flex items-center gap-2 text-sm font-bold text-pb-green hover:underline">← सर्व भरती सूचना</Link>
        <div className="mt-5 rounded-2xl border border-pb-border bg-white p-5 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-pb-light px-3 py-1 text-xs font-bold text-pb-green">{notice.notice_type.replaceAll("_", " ")}</span><time dateTime={notice.published_date} className="text-sm font-semibold text-slate-500">प्रकाशित: {formatDate(notice.published_date)}</time></div>
          <h1 className="mt-4 break-words text-2xl font-extrabold leading-tight text-pb-green sm:text-3xl">{notice.title}</h1>
          {notice.summary && <p className="mt-4 border-l-4 border-pb-khaki pl-4 text-base font-semibold leading-7 text-slate-700">{notice.summary}</p>}
          <dl className="mt-6 grid gap-3 rounded-xl bg-pb-light p-4 sm:grid-cols-2 lg:grid-cols-3">{details.map(([label, value]) => <div key={label}><dt className="text-xs font-semibold text-slate-500">{label}</dt><dd className="mt-1 break-words text-sm font-bold text-pb-green">{display(value)}</dd></div>)}</dl>
          <section className="mt-7"><h2 className="text-lg font-extrabold text-pb-green">सूचना तपशील</h2>{notice.content ? <div className="mt-3 whitespace-pre-wrap break-words text-[15px] leading-8 text-slate-700">{notice.content}</div> : <p className="mt-3 text-sm text-slate-500">माहिती उपलब्ध नाही</p>}</section>
          <section className="mt-7 border-t border-pb-border-soft pt-5"><h2 className="text-sm font-extrabold text-pb-green">अधिकृत स्रोत</h2>{notice.official_source_name && <p className="mt-1 text-sm font-semibold text-slate-700">{notice.official_source_name}</p>}{sourceUrl ? <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block break-all text-sm font-bold text-pb-green underline">अधिकृत स्रोत उघडा ↗</a> : <p className="mt-2 text-sm text-slate-500">माहिती उपलब्ध नाही</p>}</section>
          {notice.pdf_available && <section className="mt-6 rounded-xl border border-pb-border bg-pb-light p-4"><p className="break-words text-sm font-bold text-pb-green">अधिकृत PDF: {notice.pdf_original_filename || "Recruitment notice PDF"}</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" disabled={Boolean(pdfBusy)} onClick={() => fetchPdf(false)} className="rounded-lg bg-pb-green px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{pdfBusy === "view" ? "PDF उघडत आहे…" : "PDF पहा"}</button><button type="button" disabled={Boolean(pdfBusy)} onClick={() => fetchPdf(true)} className="rounded-lg border border-pb-khaki px-4 py-2.5 text-sm font-bold text-pb-green disabled:opacity-50">{pdfBusy === "download" ? "डाउनलोड होत आहे…" : "PDF डाउनलोड करा"}</button></div>{pdfError && <p role="alert" className="mt-3 text-sm font-semibold text-red-700">{pdfError}</p>}</section>}
        </div>
      </article>
      {pdfUrl && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-2 sm:p-5" role="presentation"><section role="dialog" aria-modal="true" aria-labelledby="recruitment-pdf-title" className="flex h-[96dvh] max-h-[96dvh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-pb-border bg-white shadow-2xl sm:h-[92vh] sm:max-h-[92vh]"><header className="flex shrink-0 items-center justify-between gap-3 border-b border-pb-border px-4 py-3 sm:px-6"><h2 id="recruitment-pdf-title" className="break-words text-sm font-extrabold text-pb-green sm:text-lg">{notice.title}</h2><button type="button" onClick={() => setPdfUrl("")} aria-label="PDF viewer बंद करा" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-pb-border text-lg font-bold text-pb-green">×</button></header><iframe title={notice.title} src={pdfUrl} className="h-full w-full border-0 bg-pb-light" /></section></div>}
    </>
  );
}

export default RecruitmentNoticeDetail;
