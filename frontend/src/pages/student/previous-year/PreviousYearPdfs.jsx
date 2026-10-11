import { useEffect, useRef, useState } from "react";

import {
  downloadPreviousYearPdf,
  getPreviousYearPdfFile,
  getPreviousYearPdfs,
} from "../../../services/previousYearPdfService";

const PER_PAGE = 20;

const getErrorMessage = (error) => error.response?.data?.message || error.message;

async function getApiErrorMessage(error) {
  const responseData = error.response?.data;
  if (responseData instanceof Blob) {
    try {
      const body = JSON.parse(await responseData.text());
      return body.message || error.message;
    } catch {
      return error.message;
    }
  }
  return responseData?.message || error.message;
}

function getPdfUnavailableMessage(message) {
  return message?.toLowerCase().includes("file")
    ? "PDF फाइल सध्या उपलब्ध नाही."
    : "ही प्रश्नपत्रिका सध्या उपलब्ध नाही.";
}

function getSafeDownloadFilename(disposition, fallback) {
  let filename = "";
  const encodedFilename = disposition?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  const standardFilename = disposition?.match(/filename="?([^";]+)"?/i)?.[1];
  if (encodedFilename) {
    try {
      filename = decodeURIComponent(encodedFilename.trim().replace(/^"|"$/g, ""));
    } catch {
      filename = "";
    }
  } else {
    filename = standardFilename || "";
  }
  const selected = filename || fallback || "previous-year.pdf";
  const basename = selected.split(/[\\/]/).pop();
  const safeName = Array.from(basename)
    .filter((character) => {
      const codePoint = character.codePointAt(0);
      return codePoint > 31 && (codePoint < 127 || codePoint > 159);
    })
    .join("");
  return safeName || "previous-year.pdf";
}

function formatFileSize(size = 0) {
  if (size < 1024) return `${size} Bytes`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value) {
  if (!value) return "उपलब्ध नाही";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "उपलब्ध नाही" : date.toLocaleDateString("mr-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function PdfCard({ pdf, onView, loadingPdfId }) {
  return (
    <article className="flex min-w-0 flex-col rounded-2xl border border-pb-border bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6">
      <div className="flex items-start gap-4">
        <div aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#f2ecda] text-2xl">📄</div>
        <div className="min-w-0 flex-1"><h2 className="break-words text-base font-extrabold leading-6 text-pb-green sm:text-lg">{pdf.title}</h2><p className="mt-1 break-words text-sm font-semibold text-pb-green">{pdf.exam_name}</p></div>
      </div>
      {pdf.description && <p className="mt-4 break-words text-sm leading-6 text-slate-600">{pdf.description}</p>}
      <dl className="mt-5 grid min-w-0 grid-cols-2 gap-x-4 gap-y-4 border-t border-pb-border-soft pt-4 text-sm">
        <div><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">परीक्षा वर्ष</dt><dd className="mt-1 font-bold text-pb-green">{pdf.exam_year}</dd></div>
        <div><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">फाइलचा आकार</dt><dd className="mt-1 font-semibold text-slate-700">{formatFileSize(pdf.file_size_bytes)}</dd></div>
        <div className="col-span-2 min-w-0"><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">PDF फाइल</dt><dd className="mt-1 break-all font-medium text-slate-700">{pdf.original_filename}</dd></div>
        <div className="col-span-2"><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">अपलोड तारीख</dt><dd className="mt-1 font-medium text-slate-700">{formatDate(pdf.created_at)}</dd></div>
      </dl>
      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-pb-border-soft pt-4"><button type="button" disabled={loadingPdfId !== null} onClick={() => onView(pdf)} className="rounded-lg bg-pb-green px-4 py-2.5 text-sm font-bold text-white transition hover:bg-pb-khaki focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pb-khaki disabled:cursor-not-allowed disabled:opacity-60">{loadingPdfId === pdf.id ? "PDF उघडत आहे..." : "PDF पाहा"}</button></div>
    </article>
  );
}

function PdfViewer({ viewer, onClose, onRetry, onDownload, downloading, onRetryDownload }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-2 sm:p-5" role="presentation">
      <section role="dialog" aria-modal="true" aria-labelledby="previous-year-viewer-title" className="flex h-[96dvh] max-h-[96dvh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-pb-border bg-white shadow-2xl sm:h-[92vh] sm:max-h-[92vh] sm:rounded-2xl">
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-pb-border px-4 py-3 sm:items-center sm:px-6 sm:py-4">
          <div className="min-w-0"><h2 id="previous-year-viewer-title" className="break-words text-sm font-extrabold text-pb-green sm:text-lg">{viewer.pdf.title}</h2><p className="mt-1 break-words text-xs text-slate-600 sm:text-sm">{viewer.pdf.exam_name} · {viewer.pdf.exam_year}</p></div>
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" disabled={downloading} onClick={() => onDownload(viewer.pdf)} className="rounded-lg bg-pb-green px-3 py-2 text-xs font-bold text-white hover:bg-pb-khaki disabled:cursor-wait disabled:opacity-60 sm:px-4 sm:text-sm">{downloading ? "डाउनलोड होत आहे..." : "डाउनलोड करा"}</button>
            <button type="button" onClick={onClose} aria-label="बंद करा" className="flex h-9 w-9 items-center justify-center rounded-lg border border-pb-border text-lg font-bold text-pb-green hover:bg-pb-light">×</button>
          </div>
        </header>
        {viewer.downloadError && <div role="alert" className="flex shrink-0 items-center justify-between gap-3 border-b border-red-100 bg-red-50 px-4 py-2 text-xs text-red-700 sm:px-6 sm:text-sm"><span>{viewer.downloadError}</span><button type="button" disabled={downloading} onClick={() => onRetryDownload(viewer.pdf)} className="shrink-0 font-bold underline disabled:opacity-50">पुन्हा प्रयत्न करा</button></div>}
        <div className="flex min-h-0 flex-1 items-center justify-center bg-pb-light">
          {viewer.loading ? <div role="status" className="px-5 py-12 text-center"><span className="mx-auto block h-9 w-9 animate-spin rounded-full border-4 border-pb-border border-t-pb-khaki" /><p className="mt-4 text-sm font-bold text-pb-green">PDF उघडत आहे...</p></div>
            : viewer.error ? <div role="alert" className="max-w-md px-5 py-10 text-center"><p className="font-bold text-red-700">{viewer.error}</p><button type="button" onClick={() => onRetry(viewer.pdf)} className="mt-4 rounded-lg bg-pb-green px-4 py-2.5 text-sm font-bold text-white hover:bg-pb-khaki">पुन्हा प्रयत्न करा</button></div>
              : <iframe title={viewer.pdf.title} src={viewer.url} className="h-full w-full border-0 bg-white" />}
        </div>
      </section>
    </div>
  );
}

function LoadingCards() {
  return <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3" role="status" aria-label="प्रश्नपत्रिका लोड होत आहेत">{Array.from({ length: 6 }, (_, index) => <div key={index} className="animate-pulse rounded-2xl border border-pb-border bg-white p-6"><div className="flex gap-4"><div className="h-12 w-12 rounded-xl bg-pb-border-soft" /><div className="flex-1"><div className="h-4 w-3/4 rounded bg-pb-border-soft" /><div className="mt-3 h-3 w-1/2 rounded bg-pb-light" /></div></div><div className="mt-8 h-3 rounded bg-pb-light" /><div className="mt-3 h-3 w-2/3 rounded bg-pb-light" /><div className="mt-8 h-10 rounded-lg bg-pb-light" /></div>)}</div>;
}

function getPageNumbers(page, pages) {
  if (pages <= 5) return Array.from({ length: pages }, (_, index) => index + 1);
  const start = Math.max(1, Math.min(page - 2, pages - 4));
  return Array.from({ length: 5 }, (_, index) => start + index);
}

function PreviousYearPdfs() {
  const [pdfs, setPdfs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, per_page: PER_PAGE, total: 0, pages: 0 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [examName, setExamName] = useState("");
  const [examYear, setExamYear] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [viewer, setViewer] = useState(null);
  const [loadingPdfId, setLoadingPdfId] = useState(null);
  const [downloadingPdfId, setDownloadingPdfId] = useState(null);
  const viewerUrlRef = useRef(null);
  const viewerRequestRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      viewerRequestRef.current += 1;
      if (viewerUrlRef.current) {
        URL.revokeObjectURL(viewerUrlRef.current);
        viewerUrlRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    let isCurrent = true;
    const loadPdfs = async () => {
      setLoading(true);
      setError("");
      const params = { page, per_page: PER_PAGE, search: debouncedSearch };
      if (examName.trim()) params.exam_name = examName.trim();
      if (examYear) params.exam_year = examYear;
      try {
        const response = await getPreviousYearPdfs(params);
        const data = response?.data;
        if (!response?.success || !Array.isArray(data?.previous_year_pdfs) || !data?.pagination) throw new Error(response?.message || "Previous Year PDF response was incomplete.");
        if (isCurrent) {
          setPdfs(data.previous_year_pdfs);
          setPagination(data.pagination);
          if (data.pagination.pages > 0 && page > data.pagination.pages) setPage(data.pagination.pages);
        }
      } catch (requestError) {
        if (isCurrent) setError(getErrorMessage(requestError));
      } finally { if (isCurrent) setLoading(false); }
    };
    loadPdfs();
    return () => { isCurrent = false; };
  }, [page, debouncedSearch, examName, examYear, reload]);

  const hasFilters = Boolean(search || examName || examYear);
  const resetFilters = () => { setSearch(""); setDebouncedSearch(""); setExamName(""); setExamYear(""); setPage(1); };
  const firstResult = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.per_page + 1;
  const lastResult = Math.min(pagination.page * pagination.per_page, pagination.total);
  const fieldClass = "w-full rounded-xl border border-pb-border bg-white px-3.5 py-3 text-sm font-medium text-pb-green outline-none transition focus:border-pb-khaki focus:ring-2 focus:ring-pb-khaki/20";

  const closeViewer = () => {
    viewerRequestRef.current += 1;
    if (viewerUrlRef.current) {
      URL.revokeObjectURL(viewerUrlRef.current);
      viewerUrlRef.current = null;
    }
    setViewer(null);
    setLoadingPdfId(null);
  };

  const openViewer = async (pdf) => {
    if (loadingPdfId !== null) return;
    const requestId = viewerRequestRef.current + 1;
    viewerRequestRef.current = requestId;
    setLoadingPdfId(pdf.id);
    setViewer({ pdf, url: null, loading: true, error: "", downloadError: "" });
    try {
      const blob = await getPreviousYearPdfFile(pdf.id);
      if (!(blob instanceof Blob)) throw new Error("Invalid PDF response.");
      const url = URL.createObjectURL(blob);
      if (!mountedRef.current || viewerRequestRef.current !== requestId) {
        URL.revokeObjectURL(url);
        return;
      }
      if (viewerUrlRef.current) URL.revokeObjectURL(viewerUrlRef.current);
      viewerUrlRef.current = url;
      setViewer({ pdf, url, loading: false, error: "", downloadError: "" });
    } catch (requestError) {
      const apiMessage = await getApiErrorMessage(requestError);
      if (mountedRef.current && viewerRequestRef.current === requestId) {
        const message = requestError.response?.status === 404
          ? getPdfUnavailableMessage(apiMessage)
          : "PDF उघडताना समस्या आली.";
        setViewer({ pdf, url: null, loading: false, error: message, downloadError: "" });
      }
    } finally {
      if (mountedRef.current && viewerRequestRef.current === requestId) setLoadingPdfId(null);
    }
  };

  const downloadPdf = async (pdf) => {
    if (downloadingPdfId !== null) return;
    setDownloadingPdfId(pdf.id);
    if (viewer?.pdf.id === pdf.id) setViewer((current) => ({ ...current, downloadError: "" }));
    let blobUrl = null;
    let link = null;
    let scheduledRevoke = false;
    try {
      const response = await downloadPreviousYearPdf(pdf.id);
      if (!(response?.data instanceof Blob)) throw new Error("Invalid PDF response.");
      const disposition = response.headers?.["content-disposition"]
        || response.headers?.get?.("content-disposition");
      const filename = getSafeDownloadFilename(disposition, pdf.original_filename);
      blobUrl = URL.createObjectURL(response.data);
      link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      scheduledRevoke = true;
    } catch (requestError) {
      const apiMessage = await getApiErrorMessage(requestError);
      const message = requestError.response?.status === 404
        ? getPdfUnavailableMessage(apiMessage)
        : "PDF डाउनलोड करताना समस्या आली.";
      if (mountedRef.current && viewer?.pdf.id === pdf.id) {
        setViewer((current) => current ? { ...current, downloadError: message } : current);
      }
    } finally {
      link?.remove();
      if (blobUrl && !scheduledRevoke) URL.revokeObjectURL(blobUrl);
      if (mountedRef.current) setDownloadingPdfId(null);
    }
  };

  return (
    <div className="min-h-screen min-w-0 bg-pb-light">
      <header className="border-b border-pb-border bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-4 py-7 sm:px-6 sm:py-9 lg:px-8"><div className="min-w-0"><p className="text-sm font-bold text-pb-khaki">📄 Previous Year PDFs</p><h1 className="mt-2 text-2xl font-extrabold text-pb-green sm:text-3xl">मागील वर्षांच्या प्रश्नपत्रिका</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">महाराष्ट्र पोलीस भरतीच्या मागील वर्षांच्या प्रश्नपत्रिका PDF स्वरूपात पाहा.</p></div><div aria-hidden="true" className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-pb-green text-3xl text-white shadow-lg sm:flex">📄</div></div></header>
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <section className="rounded-2xl border border-pb-border bg-white p-4 shadow-sm sm:p-5" aria-label="प्रश्नपत्रिका शोधा आणि फिल्टर करा"><div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(13rem,0.8fr)_10rem_auto] lg:items-end">
          <div className="min-w-0"><label htmlFor="previous-year-search" className="mb-2 block text-sm font-bold text-pb-green">प्रश्नपत्रिका शोधा...</label><input id="previous-year-search" type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="प्रश्नपत्रिका शोधा..." className={`${fieldClass} bg-pb-light`} /></div>
          <div><label htmlFor="previous-year-exam-name" className="mb-2 block text-sm font-bold text-pb-green">परीक्षेचे नाव</label><input id="previous-year-exam-name" type="search" value={examName} onChange={(event) => { setExamName(event.target.value); setPage(1); }} placeholder="सर्व परीक्षा" className={fieldClass} /></div>
          <div><label htmlFor="previous-year-exam-year" className="mb-2 block text-sm font-bold text-pb-green">परीक्षा वर्ष</label><input id="previous-year-exam-year" type="number" step="1" value={examYear} onChange={(event) => { setExamYear(event.target.value); setPage(1); }} placeholder="सर्व वर्षे" className={fieldClass} /></div>
          <button type="button" onClick={resetFilters} disabled={!hasFilters} className="rounded-xl border border-pb-border px-4 py-3 text-sm font-bold text-pb-green transition hover:bg-pb-light disabled:cursor-not-allowed disabled:opacity-50">फिल्टर काढा</button>
        </div></section>

        <section aria-labelledby="previous-year-list-heading"><div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"><h2 id="previous-year-list-heading" className="text-lg font-extrabold text-pb-green">उपलब्ध प्रश्नपत्रिका</h2>{!loading && !error && <p className="text-sm font-semibold text-slate-500">एकूण {pagination.total} प्रश्नपत्रिका · {firstResult}–{lastResult}</p>}</div>
          {loading ? <LoadingCards /> : error ? <div role="alert" className="rounded-2xl border border-red-200 bg-white p-7 text-center shadow-sm"><p className="font-bold text-red-700">मागील वर्षांच्या प्रश्नपत्रिका मिळवताना समस्या आली.</p><p className="mt-2 text-sm text-slate-600">{error}</p><button type="button" onClick={() => setReload((current) => current + 1)} className="mt-4 rounded-xl bg-pb-green px-5 py-2.5 text-sm font-bold text-white transition hover:bg-pb-khaki">पुन्हा प्रयत्न करा</button></div>
            : pdfs.length === 0 ? <div className="rounded-2xl border border-pb-border bg-white px-5 py-12 text-center shadow-sm"><div aria-hidden="true" className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-pb-light text-2xl">📄</div><p className="mt-4 font-bold text-pb-green">{hasFilters ? "तुमच्या शोधासाठी कोणतीही प्रश्नपत्रिका सापडली नाही." : "सध्या कोणतीही मागील वर्षांची प्रश्नपत्रिका उपलब्ध नाही."}</p>{hasFilters && <button type="button" onClick={resetFilters} className="mt-3 text-sm font-bold text-pb-khaki underline underline-offset-2">फिल्टर काढा</button>}</div>
              : <div className="grid min-w-0 gap-5 sm:grid-cols-2 xl:grid-cols-3">{pdfs.map((pdf) => <PdfCard key={pdf.id} pdf={pdf} onView={openViewer} loadingPdfId={loadingPdfId} />)}</div>}
        </section>

        {!loading && !error && pagination.pages > 1 && <nav aria-label="प्रश्नपत्रिका पृष्ठे" className="flex flex-col gap-3 rounded-2xl border border-pb-border bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"><p className="text-sm font-semibold text-slate-600">पृष्ठ {pagination.page} / {pagination.pages}</p><div className="flex flex-wrap items-center gap-2"><button type="button" disabled={pagination.page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="rounded-lg border border-pb-border px-3 py-2 text-sm font-bold text-pb-green hover:bg-pb-light disabled:cursor-not-allowed disabled:opacity-40">मागील</button>{getPageNumbers(pagination.page, pagination.pages).map((pageNumber) => <button key={pageNumber} type="button" aria-current={pageNumber === pagination.page ? "page" : undefined} onClick={() => setPage(pageNumber)} className={`h-9 min-w-9 rounded-lg px-3 text-sm font-bold ${pageNumber === pagination.page ? "bg-pb-green text-white" : "border border-pb-border text-pb-green hover:bg-pb-light"}`}>{pageNumber}</button>)}<button type="button" disabled={pagination.page >= pagination.pages} onClick={() => setPage((current) => Math.min(pagination.pages, current + 1))} className="rounded-lg border border-pb-border px-3 py-2 text-sm font-bold text-pb-green hover:bg-pb-light disabled:cursor-not-allowed disabled:opacity-40">पुढील</button></div></nav>}
      </main>
      {viewer && <PdfViewer viewer={viewer} onClose={closeViewer} onRetry={openViewer} onDownload={downloadPdf} downloading={downloadingPdfId === viewer.pdf.id} onRetryDownload={downloadPdf} />}
    </div>
  );
}

export default PreviousYearPdfs;
