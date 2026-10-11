import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { getStudentCurrentAffair, getStudentCurrentAffairMedia } from "../../services/currentAffairService";

function formatDate(value) {
  if (!value) return "";
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Date(year, month - 1, day).toLocaleDateString("mr-IN", {
    day: "numeric", month: "long", year: "numeric",
  });
}

function safeSourceUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) return null;
    return url.href;
  } catch {
    return null;
  }
}

function CurrentAffairDetail() {
  const { id } = useParams();
  const [result, setResult] = useState({ id: null, record: null, error: "" });
  const [media, setMedia] = useState({ id: null, url: "" });

  useEffect(() => {
    let active = true;
    getStudentCurrentAffair(id)
      .then((response) => {
        if (!response?.success || !response.data) {
          throw new Error(response?.message || "ही घडामोड उपलब्ध नाही.");
        }
        if (active) setResult({ id, record: response.data, error: "" });
      })
      .catch((requestError) => {
        if (active) {
          setResult({
            id,
            record: null,
            error: requestError.response?.data?.message || requestError.message || "ही घडामोड उपलब्ध नाही.",
          });
        }
      });
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    let active = true;
    let objectUrl = "";
    const record = result.id === id ? result.record : null;
    if (!record || !["IMAGE", "PDF"].includes(record.content_type)) return undefined;
    getStudentCurrentAffairMedia(id).then((blob) => {
      if (active) { objectUrl = URL.createObjectURL(blob); setMedia({ id, url: objectUrl }); }
    }).catch(() => {});
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [id, result]);

  const loading = result.id !== id;
  const record = loading ? null : result.record;
  const mediaUrl = media.id === id ? media.url : "";
  const error = loading ? "" : result.error;

  if (loading) {
    return <div role="status" className="mx-auto max-w-4xl px-4 py-12 text-center text-sm font-semibold text-slate-600">घडामोड लोड होत आहे…</div>;
  }

  if (error || !record) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <div role="alert" className="rounded-xl border border-pb-border bg-white p-7"><p className="font-bold text-pb-green">{error || "ही घडामोड उपलब्ध नाही."}</p><Link to="/student/current-affairs" className="mt-4 inline-flex rounded-lg bg-pb-green px-4 py-2.5 text-sm font-bold text-white hover:bg-pb-khaki">सर्व घडामोडी</Link></div>
      </div>
    );
  }

  const sourceUrl = safeSourceUrl(record.source_url);

  return (
    <article className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <Link to="/student/current-affairs" className="inline-flex items-center gap-2 text-sm font-bold text-pb-green hover:underline">← सर्व चालू घडामोडी</Link>
      <div className="mt-5 rounded-2xl border border-pb-border bg-white p-5 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-pb-light px-3 py-1 text-xs font-bold text-pb-green">{record.category}</span><time dateTime={record.published_date} className="text-sm font-semibold text-slate-500">{formatDate(record.published_date)}</time></div>
        <h1 className="mt-4 break-words text-2xl font-extrabold leading-tight text-pb-green sm:text-3xl">{record.title}</h1>
        {record.summary && <p className="mt-4 border-l-4 border-pb-khaki pl-4 text-base font-semibold leading-7 text-slate-700">{record.summary}</p>}
        {(record.content_type === "TEXT" || !record.content_type) && <div className="mt-6 whitespace-pre-wrap break-words text-[15px] leading-8 text-slate-700">{record.content}</div>}
        {record.content_type === "IMAGE" && (mediaUrl ? <img src={mediaUrl} alt={record.title} className="mt-6 max-h-[75vh] w-full rounded-xl bg-pb-light object-contain" /> : <div role="status" className="mt-6 h-64 animate-pulse rounded-xl bg-pb-light" />)}
        {record.content_type === "PDF" && <div className="mt-6">{mediaUrl ? <iframe title={record.title} src={mediaUrl} className="h-[75vh] min-h-[480px] w-full rounded-xl border border-pb-border" /> : <div role="status" className="h-64 animate-pulse rounded-xl bg-pb-light" />}<div className="mt-4 flex flex-wrap items-center gap-3"><a href={mediaUrl || undefined} download={record.original_filename || `${record.title}.pdf`} aria-disabled={!mediaUrl} className="rounded-lg bg-pb-khaki px-4 py-2.5 text-sm font-bold text-white aria-disabled:opacity-50">PDF डाउनलोड करा</a><span className="break-all text-sm text-slate-500">{record.original_filename}</span></div></div>}
        {(record.source_name || sourceUrl) && (
          <footer className="mt-8 border-t border-pb-border-soft pt-5">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">स्रोत</p>
            {record.source_name && <p className="mt-1 text-sm font-semibold text-pb-green">{record.source_name}</p>}
            {sourceUrl && <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block break-all text-sm font-bold text-pb-green underline">मूळ स्रोत उघडा</a>}
          </footer>
        )}
      </div>
    </article>
  );
}

export default CurrentAffairDetail;
