import { useState } from "react";
import { Loader2 } from "lucide-react";
import FormField from "../components/FormField";
import GoogleAuthButton from "../components/GoogleAuthButton";
import { validateSignUpForm, getPasswordError } from "../components/authValidation";
import {useUserStore} from "../stores/useUserStore";


/**
 * SignUpPage
 *
 * Props:
 *  - onSuccess?: (data: any) => void   // called with the parsed response on a successful sign up
 *  - onNavigateToLogin?: () => void    // wire this to your router; falls back to a plain <a href="/login">
 */
export default function SignUpPage({ onSuccess, onNavigateToLogin }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {signup} = useUserStore();

  const handleGoogleLogin = () => {
  window.location.href =
    "http://localhost:5000/api/auth/google";
};


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (serverError) setServerError(null);
  };

  const handleTermsChange = (e) => {
    setAgreeToTerms(e.target.checked);
    if (errors.agreeToTerms) {
      setErrors((prev) => ({ ...prev, agreeToTerms: undefined }));
    }
  };

  const passwordHint = getPasswordError(formData.password);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateSignUpForm({ ...formData, agreeToTerms });
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setServerError(null);

    try {
     await signup({
    name: formData.name,
    email: formData.email,
    password: formData.password,
    confirmPassword: formData.confirmPassword,
  });
  console.log(formData);
  console.log("works here also?");

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
            Create an account
          </h1>
          <p className="mt-1 text-sm text-[#1E1E1E]/60">
            Join Zama Wear for a tailored shopping experience
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

        <GoogleAuthButton label="Sign up with Google" />

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-[#B9A58E]/30" />
          <span className="text-[11px] uppercase tracking-[0.15em] text-[#1E1E1E]/40">
            or sign up with email
          </span>
          <div className="h-px flex-1 bg-[#B9A58E]/30" />
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          <FormField
            label="Full Name"
            name="name"
            autoComplete="name"
            placeholder="Jane Doe"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
          />

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

          <div>
            <FormField
              label="Password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
            />
            {!errors.password && formData.password && passwordHint && (
              <p className="mt-1 text-xs text-[#1E1E1E]/40">{passwordHint}</p>
            )}
          </div>

          <FormField
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
          />

          <div>
            <label className="flex items-start gap-2.5 text-xs text-[#1E1E1E]/70">
              <input
                type="checkbox"
                checked={agreeToTerms}
                onChange={handleTermsChange}
                className="mt-0.5 h-4 w-4 rounded border-[#B9A58E]/50 text-[#C9A55C] focus:ring-[#C9A55C]/30"
              />
              <span>
                I agree to Zama Wear's{" "}
                <a href="/terms" className="text-[#1E1E1E] underline hover:text-[#C9A55C]">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="/privacy" className="text-[#1E1E1E] underline hover:text-[#C9A55C]">
                  Privacy Policy
                </a>
              </span>
            </label>
            {errors.agreeToTerms && (
              <p className="mt-1.5 text-xs text-red-500">{errors.agreeToTerms}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            onClick={handleSubmit}
            className="flex items-center justify-center gap-2 rounded-md bg-[#C9A55C] px-4 py-3 text-[13px] font-medium uppercase tracking-[0.15em] text-white transition hover:bg-[#b8944e] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSubmitting ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#1E1E1E]/60">
          Already have an account?{" "}
          {onNavigateToLogin ? (
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="font-medium text-[#1E1E1E] hover:text-[#C9A55C]"
            >
              Sign in
            </button>
          ) : (
            <a href="/login" className="font-medium text-[#1E1E1E] hover:text-[#C9A55C]">
              Sign in
            </a>
          )}
        </p>
      </div>
    </div>
  );
}