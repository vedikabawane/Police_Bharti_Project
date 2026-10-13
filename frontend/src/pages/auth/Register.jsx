import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import PasswordVisibilityButton from "../../components/common/PasswordVisibilityButton";

const initialForm = { name: "", email: "", mobile: "", password: "", confirmPassword: "" };
const promotionalFeatures = [
  {
    title: "अभ्यास साहित्य",
    description: "विषयानुसार Notes आणि Study Material",
    icon: (
      <svg className="h-full w-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z" />
        <path d="M4 5.5v16M8 7h8M8 11h8" />
      </svg>
    ),
  },
  {
    title: "सराव चाचण्या",
    description: "स्वतःची तयारी तपासण्यासाठी Tests",
    icon: (
      <svg className="h-full w-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M8 4H5.5A1.5 1.5 0 0 0 4 5.5v14A1.5 1.5 0 0 0 5.5 21h13a1.5 1.5 0 0 0 1.5-1.5v-14A1.5 1.5 0 0 0 18.5 4H16" />
        <path d="M9 3h6v4H9zM8 13l2.5 2.5L16 10" />
      </svg>
    ),
  },
  {
    title: "शारीरिक प्रशिक्षण",
    description: "तुमच्या Physical Progress ची नोंद",
    icon: (
      <svg className="h-full w-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M3 12h3l2-6 4 12 3-9 2 3h4" />
        <path d="M3 20h18" />
      </svg>
    ),
  },
  {
    title: "दैनंदिन अपडेट्स",
    description: "Current Affairs आणि महत्त्वाच्या सूचना",
    icon: (
      <svg className="h-full w-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
        <path d="M12 2v1" />
      </svg>
    ),
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

  const registrationData = useMemo(() => ({
    name: formData.name.trim(),
    email: formData.email.trim().toLowerCase(),
    mobile: formData.mobile.trim(),
    password: formData.password,
  }), [formData]);

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
      setError(registrationError?.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full rounded-xl border border-[#ddd8ca] bg-white px-4 py-3 text-sm text-pb-green outline-none focus:border-pb-khaki focus:ring-4 focus:ring-pb-khaki/10 disabled:bg-slate-50";

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-pb-light">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-7xl items-start px-4 py-6 sm:px-6 sm:py-10 lg:items-center lg:px-8">
        <div className="grid w-full overflow-hidden rounded-3xl bg-white shadow-xl lg:grid-cols-2">
          <aside className="relative isolate hidden flex-col overflow-hidden bg-[#26351e] px-5 py-7 text-white lg:flex lg:px-10 lg:py-10">
            <div aria-hidden="true" className="pointer-events-none absolute -right-20 top-20 h-64 w-64 rounded-full border border-[#b08d2f]/20" />
            <div aria-hidden="true" className="pointer-events-none absolute -right-8 top-32 h-40 w-40 rounded-full border border-[#e8e4d8]/10" />
            <div className="relative z-10">
              <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#e6d28a] sm:text-sm">
                <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[#b08d2f]" />
                Police Bharti Platform
              </p>
              <h1 className="max-w-xl text-2xl font-extrabold leading-tight sm:text-3xl lg:text-4xl">
                Start your Police Bharti preparation today.
              </h1>
              <p className="mt-3 max-w-lg text-sm leading-6 text-[#e8e4d8] sm:mt-5 sm:text-base sm:leading-8">
                Study material, mock tests, and preparation tracking in one place.
              </p>
            </div>

            <div className="relative z-10 mt-7 sm:mt-8 lg:my-auto lg:py-8">
              <h2 className="text-xl font-bold leading-snug text-white sm:text-2xl">
                तुमच्या ध्येयाकडे एक पाऊल पुढे
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[#e8e4d8] sm:mt-3 sm:text-base sm:leading-7">
                योग्य नियोजन, नियमित सराव आणि सातत्यपूर्ण मेहनतीने तुमची पोलीस भरतीची तयारी अधिक प्रभावी बनवा.
              </p>

              <ul className="mt-5 grid grid-cols-2 gap-2.5 lg:grid-cols-1 xl:grid-cols-2">
                {promotionalFeatures.map((feature) => (
                  <li key={feature.title} className="flex min-w-0 flex-col items-start gap-2 rounded-2xl border border-white/10 bg-white/5 p-2.5 sm:flex-row sm:gap-3 sm:p-3.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#b08d2f]/20 text-[#e6d28a]">
                      <span className="h-5 w-5">{feature.icon}</span>
                    </span>
                    <span className="min-w-0 pt-0.5">
                      <span className="block text-sm font-bold leading-5 text-white">{feature.title}</span>
                      <span className="mt-1 block text-xs leading-5 text-[#e8e4d8] sm:text-sm">{feature.description}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative z-10 mt-6 border-t border-white/15 pt-4 sm:mt-7 sm:pt-5 lg:mt-0">
              <p className="text-sm font-bold tracking-wide text-[#e6d28a] sm:text-base">
                आजची तयारी, उद्याच्या यशासाठी!
              </p>
              <p className="mt-1 text-xs text-[#e8e4d8] sm:text-sm">Build your preparation journey with Police Bharti Platform.</p>
            </div>
          </aside>

          <main className="flex items-center justify-center p-6 sm:p-10 lg:p-12">
            <div className="w-full max-w-md">
              <div className="mb-7">
                <h2 className="text-3xl font-extrabold text-pb-green">Create Account</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">Create your account with your details.</p>
              </div>
              {error && <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">{error}</div>}
              {success && <div role="status" className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm leading-6 text-green-700">{success}</div>}

              <form onSubmit={handleSubmit} className="space-y-4">
                <label className="block text-sm font-bold text-pb-green" htmlFor="name">Full Name
                  <input className={inputClass + " mt-2"} id="name" name="name" value={formData.name} onChange={handleChange} autoComplete="name" disabled={loading || completed} required minLength={2} maxLength={100} />
                </label>
                <label className="block text-sm font-bold text-pb-green" htmlFor="email">Email Address
                  <input className={inputClass + " mt-2"} id="email" name="email" type="email" value={formData.email} onChange={handleChange} autoComplete="email" disabled={loading || completed} required maxLength={255} />
                </label>
                <label className="block text-sm font-bold text-pb-green" htmlFor="mobile">Mobile Number
                  <input className={inputClass + " mt-2"} id="mobile" name="mobile" type="tel" inputMode="numeric" maxLength={10} value={formData.mobile} onChange={handleChange} autoComplete="tel" disabled={loading || completed} required pattern="[6-9][0-9]{9}" />
                </label>
                <label className="block text-sm font-bold text-pb-green" htmlFor="password">Password
                  <div className="relative mt-2"><input className={inputClass + " pr-14"} id="password" name="password" type={passwordVisible ? "text" : "password"} value={formData.password} onChange={handleChange} autoComplete="new-password" disabled={loading || completed} required minLength={6} maxLength={128} />
                    <PasswordVisibilityButton visible={passwordVisible} onToggle={() => setPasswordVisible((value) => !value)} /></div>
                </label>
                <label className="block text-sm font-bold text-pb-green" htmlFor="confirmPassword">Confirm Password
                  <div className="relative mt-2"><input className={inputClass + " pr-14"} id="confirmPassword" name="confirmPassword" type={confirmPasswordVisible ? "text" : "password"} value={formData.confirmPassword} onChange={handleChange} autoComplete="new-password" disabled={loading || completed} required minLength={6} maxLength={128} />
                    <PasswordVisibilityButton visible={confirmPasswordVisible} onToggle={() => setConfirmPasswordVisible((value) => !value)} /></div>
                </label>

                <button type="submit" disabled={loading || completed} className="mt-2 flex w-full items-center justify-center rounded-xl bg-pb-green px-5 py-3.5 text-sm font-extrabold text-white shadow-lg hover:bg-pb-khaki disabled:cursor-not-allowed disabled:opacity-60">
                  {loading ? "Please wait…" : completed ? "Registration complete" : "Create Account"}
                </button>
              </form>
              <div className="mt-6 text-center text-sm text-slate-500">Already have an account? <Link to="/login" className="font-extrabold text-pb-khaki hover:underline">Log in</Link></div>
              <div className="mt-5 text-center"><Link to="/" className="text-xs font-semibold text-slate-500 hover:text-pb-khaki">Back to Home</Link></div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default Register;
