import { useAuth } from "../../context/AuthContext";

function StudentDashboard() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-pb-light">

      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* ======================================
            HEADER
        ====================================== */}

        <div className="rounded-3xl bg-pb-green p-6 text-white shadow-lg sm:p-8">

          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <p className="text-sm font-semibold text-[#d7c56f]">
                Student Dashboard
              </p>

              <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">
                नमस्कार, {user?.name} 👋
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-300">
                तुमची Police Bharti तयारी आजपासून आणखी
                व्यवस्थितपणे पुढे घेऊन जा.
              </p>

            </div>

            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-pb-khaki text-3xl">
              🛡️
            </div>

          </div>

        </div>

        {/* ======================================
            QUICK ACCESS
        ====================================== */}

        <div className="mt-8">

          <h2 className="text-xl font-extrabold text-pb-green">
            तुमची तयारी
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            अभ्यास आणि सरावासाठी उपलब्ध modules.
          </p>

          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

            {/* Study */}

            <div className="rounded-2xl bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-pb-light text-2xl">
                📚
              </div>

              <h3 className="mt-5 font-extrabold text-pb-green">
                Study Material
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                विषयानुसार notes आणि learning material.
              </p>

            </div>

            {/* Tests */}

            <div className="rounded-2xl bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-pb-light text-2xl">
                📝
              </div>

              <h3 className="mt-5 font-extrabold text-pb-green">
                Practice Tests
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Subject, topic आणि mock tests सोडवा.
              </p>

            </div>

            {/* PYQ */}

            <div className="rounded-2xl bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-pb-light text-2xl">
                📄
              </div>

              <h3 className="mt-5 font-extrabold text-pb-green">
                Previous Questions
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                मागील वर्षांचे प्रश्न आणि explanations.
              </p>

            </div>

            {/* Physical */}

            <div className="rounded-2xl bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-pb-light text-2xl">
                🏃
              </div>

              <h3 className="mt-5 font-extrabold text-pb-green">
                Physical Tracking
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Running आणि physical preparation track करा.
              </p>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default StudentDashboard;