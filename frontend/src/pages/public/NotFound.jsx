import { Link } from "react-router-dom";

function NotFound() {
  return (
    <div className="flex min-h-[75vh] items-center justify-center bg-pb-light px-4">

      <div className="max-w-xl rounded-3xl border border-pb-border bg-white p-8 text-center shadow-md sm:p-12">

        <div className="text-8xl font-black tracking-tight text-pb-khaki">
          404
        </div>

        <h1 className="mt-6 text-3xl font-bold text-slate-900">
          हे पेज सापडले नाही
        </h1>

        <p className="mt-4 leading-7 text-slate-600">
          तुम्ही उघडलेले page उपलब्ध नाही किंवा URL चुकीचा असू शकतो.
          कृपया पुन्हा Home page वर जा.
        </p>

        <Link
          to="/"
          className="mt-8 inline-flex rounded-xl bg-pb-green px-7 py-3.5 font-bold text-white transition hover:bg-pb-khaki focus-visible:outline-pb-accent"
        >
          ← Home वर जा
        </Link>

      </div>

    </div>
  );
}

export default NotFound;
