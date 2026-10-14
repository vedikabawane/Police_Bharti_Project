import { useMemo, useState } from "react";
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
const UserIcon = (p) => (
  <svg {...iconProps} {...p}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 20a7 7 0 0 1 14 0" />
  </svg>
);
const MailIcon = (p) => (
  <svg {...iconProps} {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m4 7 8 6 8-6" />
  </svg>
);
const PhoneIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M4 6a2 2 0 0 1 2-2h2l2 5-2 1a12 12 0 0 0 6 6l1-2 5 2v2a2 2 0 0 1-2 2A16 16 0 0 1 4 6Z" />
  </svg>
);
const LockIcon = (p) => (
  <svg {...iconProps} {...p}>
    <rect x="4" y="10" width="16" height="11" rx="2.5" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    <path d="M12 15v2" />
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
const BookIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 0-2 2Z" />
    <path d="M18 3v18" />
  </svg>
);
const ClipboardCheckIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M8 4H5.5A1.5 1.5 0 0 0 4 5.5v14A1.5 1.5 0 0 0 5.5 21h13a1.5 1.5 0 0 0 1.5-1.5v-14A1.5 1.5 0 0 0 18.5 4H16" />
    <path d="M9 3h6v4H9zM8 13l2.5 2.5L16 10" />
  </svg>
);
const ActivityIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M3 12h3l2-6 4 12 3-9 2 3h4" />
    <path d="M3 20h18" />
  </svg>
);
const BellIcon = (p) => (
  <svg {...iconProps} {...p}>
    <path d="M6 8a6 6 0 1 1 12 0c0 4 1.5 5.5 2 6H4c.5-.5 2-2 2-6Z" />
    <path d="M10 18a2 2 0 0 0 4 0" />
  </svg>
);

const initialForm = { name: "", email: "", mobile: "", password: "", confirmPassword: "" };

const promotionalFeatures = [
  {
    title: "अभ्यास साहित्य",
    description: "विषयानुसार Notes आणि Study Material",
    icon: BookIcon,
  },
  {
    title: "सराव चाचण्या",
    description: "स्वतःची तयारी तपासण्यासाठी Tests",
    icon: ClipboardCheckIcon,
  },
  {
    title: "शारीरिक प्रशिक्षण",
    description: "तुमच्या Physical Progress ची नोंद",
    icon: ActivityIcon,
  },
  {
    title: "दैनंदिन अपडेट्स",
    description: "Current Affairs आणि महत्त्वाच्या सूचना",
    icon: BellIcon,
  },
];

function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState(initialForm);
  const [completed, setCompleted] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const registrationData = useMemo(
    () => ({
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      mobile: formData.mobile.trim(),
      password: formData.password,
    }),
    [formData],
  );

  const validateForm = () => {
    if (formData.name.trim().length < 2) return "Enter your name (at least 2 characters).";
    if (!formData.email.trim()) return "Enter your email address.";
    if (!/^[6-9][0-9]{9}$/.test(formData.mobile)) return "Enter a valid 10-digit Indian mobile number.";
    if (formData.password.length < 6) return "Password must be at least 6 characters.";
    if (formData.password.length > 128) return "Password must be no longer than 128 characters.";
    if (formData.password !== formData.confirmPassword) return "Passwords do not match.";
    return "";
  };

  const handleChange = (event) => {
    setFormData((previous) => ({ ...previous, [event.target.name]: event.target.value }));
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    setLoading(true);
    setError("");
    try {
      await register(registrationData);
      setSuccess("Registration successful! You can now log in.");
      setCompleted(true);
      setFormData(initialForm);
      window.setTimeout(() => navigate("/login"), 1000);
    } catch (registrationError) {
      setError(
        registrationError?.response?.data?.message ||
          "Registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-[#ddd8ca] bg-white py-3 pr-4 pl-11 text-sm text-pb-green transition-all duration-200 outline-none placeholder:text-slate-400 focus:border-pb-khaki focus:ring-4 focus:ring-pb-khaki/15 disabled:cursor-not-allowed disabled:bg-slate-50";

  const passwordInputClass =
    "w-full rounded-xl border border-[#ddd8ca] bg-white py-3 pr-14 pl-11 text-sm text-pb-green transition-all duration-200 outline-none placeholder:text-slate-400 focus:border-pb-khaki focus:ring-4 focus:ring-pb-khaki/15 disabled:cursor-not-allowed disabled:bg-slate-50";

  const isDisabled = loading || completed;

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
          <aside className="relative isolate hidden flex-col overflow-hidden bg-gradient-to-br from-pb-green via-pb-green to-[#0f3d2e] px-5 py-7 text-white lg:flex lg:px-10 lg:py-10">
            {/* Animated accent bar */}
            <span
              aria-hidden="true"
              className="animate-gradient pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-pb-khaki via-[#e1d37f] to-pb-khaki"
            />

            {/* Decorative rings */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-20 -right-20 h-64 w-64 rounded-full border border-pb-khaki/20"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-32 -right-8 h-40 w-40 rounded-full border border-white/10"
            />
            <div className="animate-blob pointer-events-none absolute top-1/2 left-1/4 h-56 w-56 rounded-full bg-pb-khaki/10 blur-3xl" />

            <div className="animate-fade-up relative z-10">
              <p className="mb-3 flex items-center gap-2 text-xs font-bold tracking-[0.18em] text-[#e6d28a] uppercase sm:text-sm">
                <span aria-hidden="true" className="h-2 w-2 rounded-full bg-pb-khaki" />
                Police Bharti Platform
              </p>
              <h1 className="max-w-xl text-2xl leading-tight font-extrabold sm:text-3xl lg:text-4xl">
                Start your Police Bharti preparation today.
              </h1>
              <p className="mt-3 max-w-lg text-sm leading-6 text-slate-200 sm:mt-5 sm:text-base sm:leading-8">
                Study material, mock tests, and preparation tracking in one place.
              </p>
            </div>

            <div
              className="animate-fade-up relative z-10 mt-7 sm:mt-8 lg:my-auto lg:py-8"
              style={{ animationDelay: "120ms" }}
            >
              <h2 className="text-xl leading-snug font-bold text-white sm:text-2xl">
                तुमच्या ध्येयाकडे एक पाऊल पुढे
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-200 sm:mt-3 sm:text-base sm:leading-7">
                योग्य नियोजन, नियमित सराव आणि सातत्यपूर्ण मेहनतीने तुमची पोलीस भरतीची
                तयारी अधिक प्रभावी बनवा.
              </p>

              <ul className="mt-5 grid grid-cols-2 gap-2.5 lg:grid-cols-1 xl:grid-cols-2">
                {promotionalFeatures.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <li
                      key={feature.title}
                      className="animate-fade-up group flex min-w-0 flex-col items-start gap-2 rounded-2xl border border-white/10 bg-white/5 p-2.5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-pb-khaki/40 hover:bg-white/10 sm:flex-row sm:gap-3 sm:p-3.5"
                      style={{ animationDelay: `${200 + index * 60}ms` }}
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pb-khaki/20 text-[#e6d28a] transition-colors duration-300 group-hover:bg-pb-khaki group-hover:text-white">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 pt-0.5">
                        <span className="block text-sm leading-5 font-bold text-white">
                          {feature.title}
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-slate-300 sm:text-sm">
                          {feature.description}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div
              className="animate-fade-up relative z-10 mt-6 border-t border-white/15 pt-4 sm:mt-7 sm:pt-5 lg:mt-0"
              style={{ animationDelay: "420ms" }}
            >
              <p className="text-sm font-bold tracking-wide text-[#e6d28a] sm:text-base">
                आजची तयारी, उद्याच्या यशासाठी!
              </p>
              <p className="mt-1 text-xs text-slate-300 sm:text-sm">
                Build your preparation journey with Police Bharti Platform.
              </p>
            </div>
          </aside>

          {/* ======================================
              RIGHT SIDE (register form)
          ====================================== */}
          <main className="flex items-center justify-center p-6 sm:p-10 lg:p-12">
            <div className="w-full max-w-md">

              {/* Header */}
              <div className="animate-fade-up mb-7">
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
                  <UserIcon className="h-6 w-6 text-pb-green" />
                </div>

                <h2 className="text-[1.75rem] leading-tight font-extrabold tracking-tight text-pb-green sm:text-3xl">
                  Create Account
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Create your account with your details.
                </p>
              </div>

              {/* Error */}
              {error && (
                <div
                  role="alert"
                  className="animate-fade-up mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 font-semibold text-red-700"
                >
                  <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
                  <span className="min-w-0 break-words">{error}</span>
                </div>
              )}

              {/* Success */}
              {success && (
                <div
                  role="status"
                  className="animate-fade-up mb-5 flex items-start gap-2.5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm leading-6 font-semibold text-green-700"
                >
                  <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
                  <span className="min-w-0 break-words">{success}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name */}
                <label className="block text-sm font-bold text-pb-green" htmlFor="name">
                  Full Name
                  <div className="relative mt-2">
                    <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-400">
                      <UserIcon className="h-4 w-4" />
                    </span>
                    <input
                      className={inputClass}
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      autoComplete="name"
                      disabled={isDisabled}
                      required
                      minLength={2}
                      maxLength={100}
                    />
                  </div>
                </label>

                {/* Email */}
                <label className="block text-sm font-bold text-pb-green" htmlFor="email">
                  Email Address
                  <div className="relative mt-2">
                    <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-400">
                      <MailIcon className="h-4 w-4" />
                    </span>
                    <input
                      className={inputClass}
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      autoComplete="email"
                      disabled={isDisabled}
                      required
                      maxLength={255}
                    />
                  </div>
                </label>

                {/* Mobile */}
                <label className="block text-sm font-bold text-pb-green" htmlFor="mobile">
                  Mobile Number
                  <div className="relative mt-2">
                    <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-400">
                      <PhoneIcon className="h-4 w-4" />
                    </span>
                    <input
                      className={inputClass}
                      id="mobile"
                      name="mobile"
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={formData.mobile}
                      onChange={handleChange}
                      autoComplete="tel"
                      disabled={isDisabled}
                      required
                      pattern="[6-9][0-9]{9}"
                    />
                  </div>
                </label>

                {/* Password */}
                <label className="block text-sm font-bold text-pb-green" htmlFor="password">
                  Password
                  <div className="relative mt-2">
                    <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-400">
                      <LockIcon className="h-4 w-4" />
                    </span>
                    <input
                      className={passwordInputClass}
                      id="password"
                      name="password"
                      type={passwordVisible ? "text" : "password"}
                      value={formData.password}
                      onChange={handleChange}
                      autoComplete="new-password"
                      disabled={isDisabled}
                      required
                      minLength={6}
                      maxLength={128}
                    />
                    <PasswordVisibilityButton
                      visible={passwordVisible}
                      onToggle={() => setPasswordVisible((value) => !value)}
                    />
                  </div>
                </label>

                {/* Confirm Password */}
                <label className="block text-sm font-bold text-pb-green" htmlFor="confirmPassword">
                  Confirm Password
                  <div className="relative mt-2">
                    <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-400">
                      <LockIcon className="h-4 w-4" />
                    </span>
                    <input
                      className={passwordInputClass}
                      id="confirmPassword"
                      name="confirmPassword"
                      type={confirmPasswordVisible ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      autoComplete="new-password"
                      disabled={isDisabled}
                      required
                      minLength={6}
                      maxLength={128}
                    />
                    <PasswordVisibilityButton
                      visible={confirmPasswordVisible}
                      onToggle={() => setConfirmPasswordVisible((value) => !value)}
                    />
                  </div>
                </label>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isDisabled}
                  className="group relative mt-2 flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-pb-green to-[#0f3d2e] px-5 py-3.5 text-sm font-extrabold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:from-pb-khaki hover:to-[#c9b95f] hover:shadow-xl active:translate-y-0 focus-visible:ring-2 focus-visible:ring-pb-khaki focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {loading ? (
                    <>
                      <SpinnerIcon className="animate-spin-soft h-5 w-5" />
                      <span>Please wait…</span>
                    </>
                  ) : completed ? (
                    <>
                      <CheckCircleIcon className="h-5 w-5" />
                      <span>Registration complete</span>
                    </>
                  ) : (
                    <>
                      <span>Create Account</span>
                      <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </form>

              {/* Login link */}
              <div className="mt-6 text-center text-sm text-slate-500">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-extrabold text-pb-khaki underline decoration-pb-khaki/40 decoration-2 underline-offset-4 transition-colors hover:text-pb-green hover:decoration-pb-green"
                >
                  Log in
                </Link>
              </div>

              {/* Back */}
              <div className="mt-5 text-center">
                <Link
                  to="/"
                  className="group inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-pb-khaki"
                >
                  <ArrowLeftIcon className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-1" />
                  Back to Home
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default Register;