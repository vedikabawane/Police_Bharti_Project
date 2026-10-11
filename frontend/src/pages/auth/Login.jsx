import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import PasswordVisibilityButton from "../../components/common/PasswordVisibilityButton";

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
      setError(
        "कृपया Email आणि Password दोन्ही भरा."
      );

      return;
    }

    try {
      setLoading(true);

      const response = await login(formData);

      const role = response?.data?.user?.role;
      const destination = role === "student"
        ? "/student/dashboard"
        : role === "admin"
          ? "/admin/dashboard"
          : "/unauthorized";

      setSuccess(
        "Login successful! Dashboard वर जात आहोत..."
      );

      // ========================================
      // REDIRECT
      // ========================================

      setTimeout(() => {
        navigate(destination, { replace: true });
      }, 500);

    } catch (error) {
      console.error(
        "Login error:",
        error
      );

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

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-pb-light">

      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-7xl items-center px-4 py-10 sm:px-6 lg:px-8">

        <div className="grid w-full overflow-hidden rounded-3xl bg-white shadow-xl lg:grid-cols-2">

          {/* ======================================
              LEFT SIDE
          ====================================== */}

          <div className="relative hidden overflow-hidden bg-pb-green p-10 text-white lg:flex lg:flex-col lg:justify-between">

            {/* Decorative Circle */}
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full border-[40px] border-pb-khaki/30" />

            <div className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full border-[50px] border-pb-green/40" />

            <div className="relative z-10">

              <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-pb-khaki shadow-lg">
                <span className="text-3xl">
                  🛡️
                </span>
              </div>

              <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-[#d7c56f]">
                Police Bharti Platform
              </p>

              <h1 className="max-w-lg text-4xl font-extrabold leading-tight">
                तुमच्या
                <span className="text-[#d7c56f]">
                  {" "}पोलीस भरतीच्या{" "}
                </span>
                स्वप्नासाठी तयारी आजच सुरू करा.
              </h1>

              <p className="mt-6 max-w-lg text-base leading-8 text-slate-300">
                अभ्यास, टेस्ट, मागील वर्षांचे प्रश्न,
                शारीरिक तयारी आणि performance tracking —
                सर्व काही एका ठिकाणी.
              </p>

            </div>

            <div className="relative z-10 mt-10 grid grid-cols-3 gap-3">

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-2xl">📚</div>
                <p className="mt-2 text-xs font-semibold text-slate-300">
                  Study
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-2xl">📝</div>
                <p className="mt-2 text-xs font-semibold text-slate-300">
                  Tests
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-2xl">🏃</div>
                <p className="mt-2 text-xs font-semibold text-slate-300">
                  Physical
                </p>
              </div>

            </div>

          </div>

          {/* ======================================
              RIGHT SIDE
          ====================================== */}

          <div className="flex items-center justify-center p-6 sm:p-10 lg:p-12">

            <div className="w-full max-w-md">

              {/* Header */}

              <div className="mb-8">

                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-pb-light">
                  <span className="text-2xl">
                    🔐
                  </span>
                </div>

                <h2 className="text-3xl font-extrabold text-pb-green">
                  Welcome Back
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  तुमच्या account मध्ये login करा आणि
                  तयारी पुढे सुरू ठेवा.
                </p>

              </div>

              {/* ==================================
                  ERROR
              ================================== */}

              {error && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </div>
              )}

              {/* ==================================
                  SUCCESS
              ================================== */}

              {success && (
                <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                  {success}
                </div>
              )}

              {/* ==================================
                  FORM
              ================================== */}

              <form
                onSubmit={handleSubmit}
                className="space-y-5"
              >

                {/* Email */}

                <div>

                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-bold text-pb-green"
                  >
                    Email Address
                  </label>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    autoComplete="email"
                    disabled={loading}
                    className="w-full rounded-xl border border-[#ddd8ca] bg-white px-4 py-3.5 text-sm text-pb-green outline-none transition-all duration-300 placeholder:text-slate-500 focus:border-pb-khaki focus:ring-4 focus:ring-pb-khaki/10 disabled:cursor-not-allowed disabled:bg-slate-50"
                  />

                </div>

                {/* Password */}

                <div>

                  <div className="mb-2 flex items-center justify-between">

                    <label
                      htmlFor="password"
                      className="block text-sm font-bold text-pb-green"
                    >
                      Password
                    </label>

                    <button
                      type="button"
                      className="text-xs font-bold text-pb-khaki hover:underline"
                    >
                      Forgot Password?
                    </button>

                  </div>

                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={passwordVisible ? "text" : "password"}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      disabled={loading}
                      className="w-full rounded-xl border border-[#ddd8ca] bg-white px-4 py-3.5 pr-14 text-sm text-pb-green outline-none transition-all duration-300 placeholder:text-slate-500 focus:border-pb-khaki focus:ring-4 focus:ring-pb-khaki/10 disabled:cursor-not-allowed disabled:bg-slate-50"
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
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-pb-green px-5 py-3.5 text-sm font-extrabold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:bg-pb-khaki hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {loading ? (
                    <>
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                      Logging in...
                    </>
                  ) : (
                    <>
                      Login

                      <span className="transition-transform duration-300 group-hover:translate-x-1">
                        →
                      </span>
                    </>
                  )}

                </button>

              </form>

              {/* Register */}

              <div className="mt-7 text-center">

                <p className="text-sm text-slate-500">
                  Account नाही?
                </p>

                <Link
                  to="/register"
                  className="mt-1 inline-block text-sm font-extrabold text-pb-khaki hover:underline"
                >
                  नवीन Account तयार करा →
                </Link>

              </div>

              {/* Home */}

              <div className="mt-6 text-center">

                <Link
                  to="/"
                  className="text-xs font-semibold text-slate-500 transition-colors hover:text-pb-khaki"
                >
                  ← Back to Home
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
