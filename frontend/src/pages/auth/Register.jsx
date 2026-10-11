import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import PasswordVisibilityButton from "../../components/common/PasswordVisibilityButton";

function Register() {
  const navigate = useNavigate();

  const { register } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
  });
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

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

    setError("");
    setSuccess("");
  };

  // ==========================================
  // VALIDATE FORM
  // ==========================================

  const validateForm = () => {
    if (!formData.name.trim()) {
      return "कृपया तुमचे नाव भरा.";
    }

    if (formData.name.trim().length < 2) {
      return "नाव कमीत कमी 2 characters असावे.";
    }

    if (!formData.email.trim()) {
      return "कृपया Email भरा.";
    }

    if (!formData.mobile.trim()) {
      return "कृपया Mobile Number भरा.";
    }

    if (!/^[6-9][0-9]{9}$/.test(formData.mobile)) {
      return "कृपया valid 10-digit mobile number भरा.";
    }

    if (!formData.password) {
      return "कृपया Password भरा.";
    }

    if (formData.password.length < 6) {
      return "Password कमीत कमी 6 characters असावा.";
    }

    if (
      formData.password !==
      formData.confirmPassword
    ) {
      return "Password आणि Confirm Password समान नाहीत.";
    }

    return null;
  };

  // ==========================================
  // HANDLE SUBMIT
  // ==========================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);

      // confirmPassword backend ला पाठवायचा नाही
      const registerData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        mobile: formData.mobile.trim(),
        password: formData.password,
      };

      const response = await register(registerData);

      console.log(
        "Register response:",
        response
      );

      setSuccess(
        "Registration successful! आता Login करा."
      );

      // Form clear
      setFormData({
        name: "",
        email: "",
        mobile: "",
        password: "",
        confirmPassword: "",
      });

      // Login page वर redirect
      setTimeout(() => {
        navigate("/login");
      }, 1000);

    } catch (error) {
      console.error(
        "Registration error:",
        error
      );

      // ========================================
      // BACKEND ERROR
      // ========================================

      const responseData =
        error?.response?.data;

      if (
        responseData?.errors
      ) {
        const validationMessages =
          Object.values(
            responseData.errors
          )
            .flat()
            .join(" ");

        setError(
          validationMessages ||
            responseData.message ||
            "Validation failed."
        );
      } else {
        setError(
          responseData?.message ||
            "Registration failed. कृपया पुन्हा प्रयत्न करा."
        );
      }

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
                तयारीची सुरुवात आजच करा.
              </h1>

              <p className="mt-6 max-w-lg text-base leading-8 text-slate-300">
                अभ्यासापासून physical preparation
                पर्यंत तुमच्या पूर्ण तयारीचा प्रवास
                एका platform वर track करा.
              </p>

            </div>

            {/* Benefits */}

            <div className="relative z-10 mt-10 space-y-3">

              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <span className="text-xl">📚</span>

                <span className="text-sm font-semibold text-slate-200">
                  विषयानुसार Study Material
                </span>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <span className="text-xl">📝</span>

                <span className="text-sm font-semibold text-slate-200">
                  Mock Tests आणि PYQs
                </span>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <span className="text-xl">🏃</span>

                <span className="text-sm font-semibold text-slate-200">
                  Physical Preparation Tracking
                </span>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <span className="text-xl">🤖</span>

                <span className="text-sm font-semibold text-slate-200">
                  Marathi AI Study Assistant
                </span>
              </div>

            </div>

          </div>

          {/* ======================================
              RIGHT SIDE
          ====================================== */}

          <div className="flex items-center justify-center p-6 sm:p-10 lg:p-12">

            <div className="w-full max-w-md">

              {/* Header */}

              <div className="mb-7">

                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-pb-light">
                  <span className="text-2xl">
                    📝
                  </span>
                </div>

                <h2 className="text-3xl font-extrabold text-pb-green">
                  Create Account
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Police Bharti Platform वर तुमचे
                  free account तयार करा.
                </p>

              </div>

              {/* ==================================
                  ERROR
              ================================== */}

              {error && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium leading-6 text-red-700">
                  {error}
                </div>
              )}

              {/* ==================================
                  SUCCESS
              ================================== */}

              {success && (
                <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium leading-6 text-green-700">
                  {success}
                </div>
              )}

              {/* ==================================
                  FORM
              ================================== */}

              <form
                onSubmit={handleSubmit}
                className="space-y-4"
              >

                {/* Name */}

                <div>

                  <label
                    htmlFor="name"
                    className="mb-2 block text-sm font-bold text-pb-green"
                  >
                    Full Name
                  </label>

                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="तुमचे पूर्ण नाव"
                    autoComplete="name"
                    disabled={loading}
                    className="w-full rounded-xl border border-[#ddd8ca] bg-white px-4 py-3.5 text-sm text-pb-green outline-none transition-all duration-300 placeholder:text-slate-500 focus:border-pb-khaki focus:ring-4 focus:ring-pb-khaki/10 disabled:cursor-not-allowed disabled:bg-slate-50"
                  />

                </div>

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
                    placeholder="example@gmail.com"
                    autoComplete="email"
                    disabled={loading}
                    className="w-full rounded-xl border border-[#ddd8ca] bg-white px-4 py-3.5 text-sm text-pb-green outline-none transition-all duration-300 placeholder:text-slate-500 focus:border-pb-khaki focus:ring-4 focus:ring-pb-khaki/10 disabled:cursor-not-allowed disabled:bg-slate-50"
                  />

                </div>

                {/* Mobile */}

                <div>

                  <label
                    htmlFor="mobile"
                    className="mb-2 block text-sm font-bold text-pb-green"
                  >
                    Mobile Number
                  </label>

                  <input
                    id="mobile"
                    name="mobile"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={formData.mobile}
                    onChange={handleChange}
                    placeholder="9876543210"
                    autoComplete="tel"
                    disabled={loading}
                    className="w-full rounded-xl border border-[#ddd8ca] bg-white px-4 py-3.5 text-sm text-pb-green outline-none transition-all duration-300 placeholder:text-slate-500 focus:border-pb-khaki focus:ring-4 focus:ring-pb-khaki/10 disabled:cursor-not-allowed disabled:bg-slate-50"
                  />

                </div>

                {/* Password */}

                <div>

                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-bold text-pb-green"
                  >
                    Password
                  </label>

                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={passwordVisible ? "text" : "password"}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Minimum 6 characters"
                      autoComplete="new-password"
                      disabled={loading}
                      className="w-full rounded-xl border border-[#ddd8ca] bg-white px-4 py-3.5 pr-14 text-sm text-pb-green outline-none transition-all duration-300 placeholder:text-slate-500 focus:border-pb-khaki focus:ring-4 focus:ring-pb-khaki/10 disabled:cursor-not-allowed disabled:bg-slate-50"
                    />
                    <PasswordVisibilityButton
                      visible={passwordVisible}
                      onToggle={() => setPasswordVisible((visible) => !visible)}
                    />
                  </div>

                </div>

                {/* Confirm Password */}

                <div>

                  <label
                    htmlFor="confirmPassword"
                    className="mb-2 block text-sm font-bold text-pb-green"
                  >
                    Confirm Password
                  </label>

                  <div className="relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={confirmPasswordVisible ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Password पुन्हा enter करा"
                      autoComplete="new-password"
                      disabled={loading}
                      className="w-full rounded-xl border border-[#ddd8ca] bg-white px-4 py-3.5 pr-14 text-sm text-pb-green outline-none transition-all duration-300 placeholder:text-slate-500 focus:border-pb-khaki focus:ring-4 focus:ring-pb-khaki/10 disabled:cursor-not-allowed disabled:bg-slate-50"
                    />
                    <PasswordVisibilityButton
                      visible={confirmPasswordVisible}
                      onToggle={() => setConfirmPasswordVisible((visible) => !visible)}
                    />
                  </div>

                </div>

                {/* Submit */}

                <button
                  type="submit"
                  disabled={loading}
                  className="group mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-pb-green px-5 py-3.5 text-sm font-extrabold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:bg-pb-khaki hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {loading ? (
                    <>
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                      Creating Account...
                    </>
                  ) : (
                    <>
                      Create Free Account

                      <span className="transition-transform duration-300 group-hover:translate-x-1">
                        →
                      </span>
                    </>
                  )}

                </button>

              </form>

              {/* Login */}

              <div className="mt-6 text-center">

                <p className="text-sm text-slate-500">
                  आधीच account आहे?
                </p>

                <Link
                  to="/login"
                  className="mt-1 inline-block text-sm font-extrabold text-pb-khaki hover:underline"
                >
                  Login करा →
                </Link>

              </div>

              {/* Home */}

              <div className="mt-5 text-center">

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

export default Register;
