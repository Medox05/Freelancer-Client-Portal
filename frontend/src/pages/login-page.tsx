import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, LogIn, Mail, ArrowLeft } from "lucide-react";
import { login } from "../services/auth-service";
import { setToken } from "../lib/auth";
import ThemeToggle from "../components/theme-toggle";
import { useTheme } from "../lib/theme";

export default function LoginPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const res = await login({ email, password });

      if (res.token) {
        setToken(res.token);
      }
      if (res.user) {
        localStorage.setItem("user", JSON.stringify(res.user));

        if (res.user.role === "client") {
          navigate("/client-dashboard", { replace: true });
        } else {
          navigate("/dashboard", { replace: true });
        }
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (err: any) {
      const errors = err?.response?.data?.errors;

      if (err?.response?.status === 403 && err?.response?.data?.require_verification) {
        navigate(`/verify-email?email=${encodeURIComponent(err.response.data.email || email)}`);
        return;
      }

      if (errors?.email?.[0]) {
        setError(errors.email[0]);
      } else if (errors?.password?.[0]) {
        setError(errors.password[0]);
      } else {
        setError(err?.response?.data?.message || "Invalid email or password");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-100 p-4 dark:bg-slate-950">
      <Link to="/" className="absolute left-6 top-6 flex items-center gap-3">
        <img src={theme === "dark" ? "/M_nobackround_White.png" : "/M_nobackround_Black.png"} className="h-10 md:h-12 w-auto object-contain drop-shadow-sm dark:drop-shadow-md" alt="MhFlow Logo" />
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
            Welcome Back
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Login to your account
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-sm text-slate-600 dark:text-slate-300">
                Password
              </label>
              <Link to="/forgot-password" className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
                Forgot password?
              </Link>
            </div>
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

          <button
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50 dark:bg-white dark:text-slate-900"
          >
            <LogIn size={18} />
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Don&apos;t have an account?{" "}
          <Link
            to="/register"
            className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
          >
            Register
          </Link>
        </p>

        <div className="mt-6 flex justify-center">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to Home Page
          </Link>
        </div>
      </div>
    </div>
  );
}