import { useState } from "react";
import { Loader2 } from "lucide-react";
import FormField from "../components/FormField";
import GoogleAuthButton from "../components/GoogleAuthButton";
import { useUserStore } from "../stores/useUserStore";
import {validateLoginForm} from "../components/AuthValidation";

export default function LoginPage({ onSuccess, onNavigateToSignUp }) {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {login} = useUserStore();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // clear the field's error as soon as the user starts fixing it
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (serverError) setServerError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateLoginForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setServerError(null);

    try {
      await login(formData.email, formData.password);
    } catch {
      setServerError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F6F2] px-5 py-12">
      <div className="w-full max-w-sm rounded-lg border border-[#B9A58E]/25 bg-[#F8F6F2] p-8 shadow-sm">
        <div className="mb-8 text-center">
          <img
            src="/zamalogo.png"
            alt="Zama Wear"
            className="mx-auto h-12 w-auto"
          />
          <p
            className="mt-2 text-2xl tracking-[0.15em] text-[#1E1E1E] font-heading"
          >
            ZAMA WEAR
          </p>
          <h1
            className="mt-4 text-2xl text-[#1E1E1E] font-heading"
          >
            Welcome back
          </h1>
          <p className="mt-1 text-sm text-[#1E1E1E]/60">
            Sign in to continue to your account
          </p>
        </div>

        {serverError && (
          <div
            role="alert"
            className="mb-5 rounded-md border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-600"
          >
            {serverError}
          </div>
        )}

        <GoogleAuthButton label="Sign in with Google" />

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-[#B9A58E]/30" />
          <span className="text-[11px] uppercase tracking-[0.15em] text-[#1E1E1E]/40">
            or sign in with email
          </span>
          <div className="h-px flex-1 bg-[#B9A58E]/30" />
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          <FormField
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
          />

          <FormField
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
          />

          <div className="flex justify-end">
            <a href="/forgot-password" className="text-xs text-[#1E1E1E]/60 hover:text-[#C9A55C]">
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center justify-center gap-2 rounded-md bg-[#C9A55C] px-4 py-3 text-[13px] font-medium uppercase tracking-[0.15em] text-white transition hover:bg-[#b8944e] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSubmitting ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#1E1E1E]/60">
          Don't have an account?{" "}
          {onNavigateToSignUp ? (
            <button
              type="button"
              onClick={onNavigateToSignUp}
              className="font-medium text-[#1E1E1E] hover:text-[#C9A55C]"
            >
              Sign up
            </button>
          ) : (
            <a href="/signup" className="font-medium text-[#1E1E1E] hover:text-[#C9A55C]">
              Sign up
            </a>
          )}
        </p>
      </div>
    </div>
  );
}