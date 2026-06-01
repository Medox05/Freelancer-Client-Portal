import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Mail, ArrowLeft, CheckCircle2, RefreshCw } from "lucide-react";
import api from "../lib/axios";
import { setToken } from "../lib/auth";
import ThemeToggle from "../components/theme-toggle";
import { useTheme } from "../lib/theme";

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { theme, toggleTheme } = useTheme();

  const emailParam = searchParams.get("email");

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!emailParam) {
      navigate("/login", { replace: true });
    }
  }, [emailParam, navigate]);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!emailParam) return;

    setLoading(true);
    setError("");

    try {
      const res = await api.post("/verify-email", { email: emailParam, code });

      setToken(res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      setMessage("Email verified successfully! Redirecting...");
      
      setTimeout(() => {
        if (res.data.user.role === "client") {
          navigate("/client-dashboard", { replace: true });
        } else {
          navigate("/dashboard", { replace: true });
        }
      }, 1500);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Invalid or expired verification code.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!emailParam) return;

    setResending(true);
    setError("");
    setMessage("");

    try {
      const res = await api.post("/resend-verification", { email: emailParam });
      setMessage(res.data.message || "Verification code resent successfully.");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to resend verification code.");
    } finally {
      setResending(false);
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
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
            <Mail size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Verify Your Email
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            We've sent a 6-digit verification code to <br />
            <span className="font-semibold text-slate-900 dark:text-white">{emailParam}</span>
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
            <CheckCircle2 size={16} />
            {message}
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">
              Verification Code
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-3 dark:border-slate-700 dark:bg-slate-800">
              <input
                type="text"
                placeholder="Enter 6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                maxLength={6}
                className="w-full bg-transparent py-3 text-center text-xl font-bold tracking-[0.25em] text-slate-900 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
              />
            </div>
          </div>

          <button
            disabled={loading || code.length < 6}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50 dark:bg-emerald-500 dark:hover:bg-emerald-600"
          >
            {loading ? "Verifying..." : "Verify & Continue"}
          </button>
        </form>

        <div className="mt-6 flex flex-col items-center justify-center gap-4 border-t border-slate-200 pt-6 dark:border-slate-800">
          <button
            onClick={handleResend}
            disabled={resending}
            className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 disabled:opacity-50 dark:text-slate-400 dark:hover:text-white"
          >
            <RefreshCw size={14} className={resending ? "animate-spin" : ""} />
            {resending ? "Resending..." : "Resend Verification Code"}
          </button>

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
