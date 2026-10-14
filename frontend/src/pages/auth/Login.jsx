import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import PasswordVisibilityButton from "../../components/common/PasswordVisibilityButton";

/* ---------- SVG ICON SET ---------- */
const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.8",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": "true",
};

const ShieldIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M12 3 5 6v5c0 4.6 2.8 8.1 7 10 4.2-1.9 7-5.4 7-10V6l-7-3Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);
const LockIcon = (p) => (
  <svg {...iconProps} {...p}>
    <rect x="4" y="10" width="16" height="11" rx="2.5" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    <path d="M12 15v2" />
  </svg>
);
const MailIcon = (p) => (
  <svg {...iconProps} {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m4 7 8 6 8-6" />
  </svg>
);
const BookIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 0-2 2Z" />
    <path d="M18 3v18" />
  </svg>
);
const PencilIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="m4 20 4-1 10-10a2 2 0 0 0-3-3L5 16l-1 4Z" />
    <path d="m14 6 3 3" />
  </svg>
);
const RunIcon = (p) => (
  <svg {...iconProps} {...p}>
    <circle cx="15" cy="4.5" r="1.8" />
    <path d="m5 20 3-6 3 2 3-1" />
    <path d="m13 10-3 3-3-5" />
    <path d="M14 15l3 5" />
  </svg>
);
const AlertIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M10.3 3.9 2.4 17a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9v4M12 17h.01" />
  </svg>
);
const CheckCircleIcon = (p) => (
  <svg {...iconProps} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m8.5 12 2.5 2.5L16 9.5" />
  </svg>
);
const ArrowRightIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M5 12h14" />
    <path d="m13 6 6 6-6 6" />
  </svg>
);
const ArrowLeftIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M19 12H5" />
    <path d="m11 18-6-6 6-6" />
  </svg>
);
const SpinnerIcon = (p) => (
  <svg {...iconProps} strokeWidth="2.4" {...p}>
    <path d="M21 12a9 9 0 1 1-6.2-8.5" />
  </svg>
);

function Login() {
  const navigate = useNavigate();

  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [passwordVisible, setPasswordVisible] = useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  // ==========================================
  // HANDLE INPUT CHANGE
  // ==========================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));

    // Clear previous messages
    setError("");
    setSuccess("");
  };

  // ==========================================
  // HANDLE LOGIN
  // ==========================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    // Basic frontend validation
    if (!formData.email || !formData.password) {
      setError("कृपया Email आणि Password दोन्ही भरा.");
      return;
    }

    try {
      setLoading(true);

      const response = await login(formData);

      const role = response?.data?.user?.role;
      const destination =
        role === "student"
          ? "/student/dashboard"
          : role === "admin"
            ? "/admin/dashboard"
            : "/unauthorized";

      setSuccess("Login successful! Dashboard वर जात आहोत...");

      // ========================================
      // REDIRECT
      // ========================================

      setTimeout(() => {
        navigate(destination, { replace: true });
      }, 500);
    } catch (error) {
      // ========================================
      // BACKEND ERROR
      // ========================================

      const message =
        error?.response?.data?.message ||
        "Login failed. कृपया पुन्हा प्रयत्न करा.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const featureHighlights = [
    { label: "Study", icon: BookIcon },
    { label: "Tests", icon: PencilIcon },
    { label: "Physical", icon: RunIcon },
  ];

  return (
    <div className="relative min-h-[calc(100vh-5rem)] overflow-hidden bg-pb-light">
      {/* ---------- ANIMATION KEYFRAMES ---------- */}
      <style>{`
        @keyframes blobMove {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(40px, -60px) scale(1.12); }
          66% { transform: translate(-30px, 30px) scale(0.94); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes gradientPan {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes softGlow {
          0%, 100% { opacity: 0.45; transform: scale(1); }
          50% { opacity: 0.85; transform: scale(1.12); }
        }
        @keyframes spinSoft { to { transform: rotate(360deg); } }
        .animate-blob { animation: blobMove 20s ease-in-out infinite; }
        .delay-2 { animation-delay: 3s; }
        .delay-4 { animation-delay: 6s; }
        .animate-fade-up { animation: fadeUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .animate-gradient { background-size: 220% 220%; animation: gradientPan 9s ease infinite; }
        .animate-soft-glow { animation: softGlow 4.5s ease-in-out infinite; }
        .animate-spin-soft { animation: spinSoft 0.9s linear infinite; }
        @media (prefers-reduced-motion: reduce) {
          .animate-blob, .animate-fade-up, .animate-gradient,
          .animate-soft-glow, .animate-spin-soft { animation: none !important; }
        }
      `}</style>

      {/* ---------- ANIMATED BACKGROUND ---------- */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-br from-pb-light via-white to-pb-light" />
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(15,23,42,0.06) 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="animate-blob absolute -top-28 -left-24 h-72 w-72 rounded-full bg-pb-khaki/25 blur-3xl" />
        <div className="animate-blob delay-2 absolute top-1/3 -right-24 h-72 w-72 rounded-full bg-pb-green/15 blur-3xl" />
        <div className="animate-blob delay-4 absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-pb-khaki/20 blur-3xl" />
      </div>

      {/* ---------- MAIN WRAPPER ---------- */}
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-5rem)] max-w-7xl items-start px-4 py-6 sm:px-6 sm:py-10 lg:items-center lg:px-8">
        <div className="grid w-full overflow-hidden rounded-3xl border border-pb-border/50 bg-white/90 shadow-2xl backdrop-blur-sm lg:grid-cols-2">

          {/* ======================================
              LEFT SIDE (decorative panel)
          ====================================== */}
          <div className="relative hidden overflow-hidden bg-gradient-to-br from-pb-green via-pb-green to-[#0f3d2e] p-10 text-white lg:flex lg:flex-col lg:justify-between">
            {/* Animated accent bar */}
            <span
              aria-hidden="true"
              className="animate-gradient pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-pb-khaki via-[#e1d37f] to-pb-khaki"
            />

            {/* Decorative rings */}
            <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full border-[40px] border-pb-khaki/20" />
            <div className="pointer-events-none absolute -bottom-24 -left-20 h-72 w-72 rounded-full border-[50px] border-white/5" />
            <div className="animate-blob pointer-events-none absolute top-1/2 left-1/3 h-56 w-56 rounded-full bg-pb-khaki/10 blur-3xl" />

            <div className="animate-fade-up relative z-10">
              <div className="relative mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-pb-khaki to-[#c9b95f] shadow-lg">
                <span
                  aria-hidden="true"
                  className="animate-soft-glow pointer-events-none absolute -inset-1.5 rounded-3xl bg-pb-khaki/40 blur-lg"
                />
                <ShieldIcon className="relative h-8 w-8 text-white" />
              </div>

              <p className="mb-3 text-sm font-bold tracking-[0.2em] text-[#d7c56f] uppercase">
                Police Bharti Platform
              </p>

              <h1 className="max-w-lg text-4xl leading-tight font-extrabold">
                तुमच्या
                <span className="text-[#d7c56f]"> पोलीस भरतीच्या </span>
                स्वप्नासाठी तयारी आजच सुरू करा.
              </h1>

              <p className="mt-6 max-w-lg text-base leading-8 text-slate-300">
                अभ्यास, टेस्ट, मागील वर्षांचे प्रश्न, शारीरिक तयारी आणि
                performance tracking — सर्व काही एका ठिकाणी.
              </p>
            </div>

            <div
              className="animate-fade-up relative z-10 mt-10 grid grid-cols-3 gap-3"
              style={{ animationDelay: "180ms" }}
            >
              {featureHighlights.map(({ label, icon: Icon }) => (
                <div
                  key={label}
                  className="group rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-pb-khaki/40 hover:bg-white/10"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-[#d7c56f] transition-colors duration-300 group-hover:bg-pb-khaki group-hover:text-white">
                    <Icon className="h-4 w-4" />
                  </span>
                  <p className="mt-2.5 text-xs font-bold text-slate-200">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ======================================
              RIGHT SIDE (login form)
          ====================================== */}
          <div className="flex items-center justify-center p-6 sm:p-10 lg:p-12">
            <div className="w-full max-w-md">
              {/* Header */}
              <div className="animate-fade-up mb-8">
                {/* Mobile brand (visible only on small screens) */}
                <div className="mb-6 flex items-center gap-3 lg:hidden">
                  <span className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-pb-green to-[#0f3d2e] text-white shadow-md">
                    <span
                      aria-hidden="true"
                      className="animate-soft-glow pointer-events-none absolute -inset-1 rounded-2xl bg-pb-khaki/30 blur-md"
                    />
                    <ShieldIcon className="relative h-6 w-6" />
                  </span>
                  <div>
                    <p className="text-sm leading-tight font-extrabold text-pb-green">
                      Police Bharti
                    </p>
                    <p className="mt-0.5 text-[10px] font-bold tracking-[0.14em] text-pb-khaki uppercase">
                      Preparation Platform
                    </p>
                  </div>
                </div>

                <div className="mb-5 hidden h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-pb-light to-white ring-1 ring-pb-border lg:flex">
                  <LockIcon className="h-6 w-6 text-pb-green" />
                </div>

                <h2 className="text-[1.75rem] leading-tight font-extrabold tracking-tight text-pb-green sm:text-3xl">
                  Welcome Back
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  तुमच्या account मध्ये login करा आणि तयारी पुढे सुरू ठेवा.
                </p>
              </div>

              {/* ==================================
                  ERROR
              ================================== */}
              {error && (
                <div
                  role="alert"
                  className="animate-fade-up mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
                >
                  <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
                  <span className="min-w-0 break-words">{error}</span>
                </div>
              )}

              {/* ==================================
                  SUCCESS
              ================================== */}
              {success && (
                <div
                  role="status"
                  className="animate-fade-up mb-5 flex items-start gap-2.5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700"
                >
                  <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
                  <span className="min-w-0 break-words">{success}</span>
                </div>
              )}

              {/* ==================================
                  FORM
              ================================== */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-bold text-pb-green"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-400">
                      <MailIcon className="h-4 w-4" />
                    </span>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your email"
                      autoComplete="email"
                      disabled={loading}
                      className="w-full rounded-xl border border-[#ddd8ca] bg-white py-3.5 pr-4 pl-11 text-sm text-pb-green transition-all duration-200 outline-none placeholder:text-slate-400 focus:border-pb-khaki focus:ring-4 focus:ring-pb-khaki/15 disabled:cursor-not-allowed disabled:bg-slate-50"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label
                      htmlFor="password"
                      className="block text-sm font-bold text-pb-green"
                    >
                      Password
                    </label>
                    <button
                      type="button"
                      className="text-xs font-bold text-pb-khaki transition-colors hover:text-pb-green hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  <div className="relative">
                    <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-400">
                      <LockIcon className="h-4 w-4" />
                    </span>
                    <input
                      id="password"
                      name="password"
                      type={passwordVisible ? "text" : "password"}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      disabled={loading}
                      className="w-full rounded-xl border border-[#ddd8ca] bg-white py-3.5 pr-14 pl-11 text-sm text-pb-green transition-all duration-200 outline-none placeholder:text-slate-400 focus:border-pb-khaki focus:ring-4 focus:ring-pb-khaki/15 disabled:cursor-not-allowed disabled:bg-slate-50"
                    />
                    <PasswordVisibilityButton
                      visible={passwordVisible}
                      onToggle={() => setPasswordVisible((visible) => !visible)}
                    />
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-pb-green to-[#0f3d2e] px-5 py-3.5 text-sm font-extrabold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:from-pb-khaki hover:to-[#c9b95f] hover:shadow-xl active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {loading ? (
                    <>
                      <SpinnerIcon className="animate-spin-soft h-5 w-5" />
                      <span>Logging in...</span>
                    </>
                  ) : (
                    <>
                      <span>Login</span>
                      <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </form>

              {/* Register */}
              <div className="mt-7 text-center">
                <p className="text-sm text-slate-500">Account नाही?</p>
                <Link
                  to="/register"
                  className="group mt-1.5 inline-flex items-center gap-1.5 text-sm font-extrabold text-pb-khaki transition-colors hover:text-pb-green"
                >
                  <span className="underline decoration-pb-khaki/40 decoration-2 underline-offset-4 group-hover:decoration-pb-green">
                    नवीन Account तयार करा
                  </span>
                  <ArrowRightIcon className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </div>

              {/* Home */}
              <div className="mt-6 text-center">
                <Link
                  to="/"
                  className="group inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-pb-khaki"
                >
                  <ArrowLeftIcon className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-1" />
                  Back to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;