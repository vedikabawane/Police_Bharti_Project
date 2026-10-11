import { Link } from "react-router-dom";

function Unauthorized() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-pb-light px-4">

      <div className="w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-xl sm:p-12">

        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-pb-green text-4xl">
          🔒
        </div>

        <h1 className="mt-6 text-3xl font-extrabold text-pb-green">
          Access Denied
        </h1>

        <p className="mt-3 text-sm leading-7 text-slate-500">
          या page वर access करण्यासाठी तुमच्या account ला
          आवश्यक permission नाही.
        </p>

        <Link
          to="/"
          className="mt-7 inline-flex rounded-xl bg-pb-green px-6 py-3 text-sm font-bold text-white transition-all hover:bg-pb-khaki"
        >
          ← Back to Home
        </Link>

      </div>

    </div>
  );
}

export default Unauthorized;