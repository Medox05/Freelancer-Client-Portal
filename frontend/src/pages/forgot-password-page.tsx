import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Mail, ArrowLeft, KeyRound, CheckCircle2 } from "lucide-react";
import api from "../lib/axios";
import ThemeToggle from "../components/theme-toggle";
import { useTheme } from "../lib/theme";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await api.post("/forgot-password", { email });
      setMessage(res.data.message || "Reset code sent to your email.");
      setStep(2);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to send reset code.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (password !== passwordConfirmation) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await api.post("/reset-password", {
        email,
        code,
        password,
        password_confirmation: passwordConfirmation,
      });

      setMessage(res.data.message || "Password reset successfully.");
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 2000);
    } catch (err: any) {
      const errors = err?.response?.data?.errors;
      if (errors?.password?.[0]) {
        setError(errors.password[0]);
      } else {
        setError(err?.response?.data?.message || "Invalid or expired reset code.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-100 p-4 dark:bg-slate-950">
      <Link to="/" className="absolute left-6 top-6 flex items-center gap-3">
        <img
          src={theme === "dark" ? "/M_nobackround_White.png" : "/M_nobackround_Black.png"}
          className="h-10 md:h-12 w-auto object-contain drop-shadow-sm dark:drop-shadow-md"
          alt="MhFlow Logo"
        />
        <span className="text-2xl md:text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500 dark:from-slate-100 dark:to-slate-400">
          MhFlow
        </span>
      </Link>

      <button
        type="button"
        onClick={toggleTheme}
        className="absolute right-6 top-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        <ThemeToggle />
      </button>

      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-lg dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {step === 1 ? "Forgot Password" : "Reset Password"}
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            {step === 1 ? "Enter your email to receive a reset code" : "Enter the code and your new password"}
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-green-300 bg-green-50 p-3 text-sm text-green-700 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-300">
            <CheckCircle2 size={16} />
            {message}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-slate-600 dark:text-slate-300">
                Email
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-3 dark:border-slate-700 dark:bg-slate-800">
                <Mail size={16} className="text-slate-400" />
                <input
                  type="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-transparent py-3 text-slate-900 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
                />
              </div>
            </div>

            <button
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50 dark:bg-white dark:text-slate-900"
            >
              <KeyRound size={18} />
              {loading ? "Sending..." : "Send Reset Code"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-slate-600 dark:text-slate-300">
                Reset Code
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-3 dark:border-slate-700 dark:bg-slate-800">
                <KeyRound size={16} className="text-slate-400" />
                <input
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  className="w-full bg-transparent py-3 text-slate-900 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-600 dark:text-slate-300">
                New Password
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-3 dark:border-slate-700 dark:bg-slate-800">
                <Lock size={16} className="text-slate-400" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-transparent py-3 text-slate-900 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-600 dark:text-slate-300">
                Confirm Password
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-3 dark:border-slate-700 dark:bg-slate-800">
                <Lock size={16} className="text-slate-400" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  required
                  className="w-full bg-transparent py-3 text-slate-900 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
                />
              </div>
            </div>

            <button
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50 dark:bg-white dark:text-slate-900"
            >
              <CheckCircle2 size={18} />
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}

        <div className="mt-6 flex justify-center">
          <Link
            to="/login"
            className="flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
