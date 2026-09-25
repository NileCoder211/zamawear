import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import FormField from "../components/FormField";
import { useUserStore } from "../stores/useUserStore";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { sendForgotPasswordCode, resetForgottenPassword, loading } = useUserStore();

  // "request" -> enter email and ask for a code
  // "reset"   -> enter the code + new password
  // "done"    -> success, redirect to login
  const [step, setStep] = useState("request");

  const [email, setEmail] = useState("");
  const [resetData, setResetData] = useState({
    code: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});

  const handleResetChange = (e) => {
    const { name, value } = e.target;
    setResetData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSendCode = async (e) => {
    e.preventDefault();

    if (!EMAIL_RE.test(email)) {
      setErrors({ email: "Enter a valid email address." });
      return;
    }
    setErrors({});

    const ok = await sendForgotPasswordCode(email);
    if (ok) setStep("reset");
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    const validationErrors = {};
    if (!/^\d{6}$/.test(resetData.code.trim())) {
      validationErrors.code = "Enter the 6-digit code from your email.";
    }
    if (resetData.newPassword.length < 8) {
      validationErrors.newPassword = "Must be at least 8 characters.";
    }
    if (resetData.newPassword !== resetData.confirmPassword) {
      validationErrors.confirmPassword = "Passwords do not match.";
    }
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});

    const ok = await resetForgottenPassword(
      email,
      resetData.code.trim(),
      resetData.newPassword,
    );
    if (ok) {
      setStep("done");
      setTimeout(() => navigate("/login"), 2000);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F6F2] px-5 py-12">
      <div className="w-full max-w-sm rounded-lg border border-[#B9A58E]/25 bg-[#F8F6F2] p-8 shadow-sm">
        <div className="mb-8 text-center">
          <img src="/zamalogo.png" alt="Zama Wear" className="mx-auto h-12 w-auto" />
          <p className="mt-2 text-2xl tracking-[0.15em] text-[#1E1E1E] font-heading">
            ZAMA WEAR
          </p>
          <h1 className="mt-4 text-2xl text-[#1E1E1E] font-heading">
            {step === "done" ? "Password updated" : "Reset your password"}
          </h1>
          {step === "request" && (
            <p className="mt-1 text-sm text-[#1E1E1E]/60">
              Enter your email and we'll send you a reset code
            </p>
          )}
          {step === "reset" && (
            <p className="mt-1 text-sm text-[#1E1E1E]/60">
              Check your inbox for the code — it expires in 5 minutes
            </p>
          )}
        </div>

        {step === "request" && (
          <form onSubmit={handleSendCode} noValidate className="flex flex-col gap-5">
            <FormField
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({});
              }}
              error={errors.email}
            />

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-md bg-[#C9A55C] px-4 py-3 text-[13px] font-medium uppercase tracking-[0.15em] text-white transition hover:bg-[#b8944e] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Sending…" : "Send reset code"}
            </button>
          </form>
        )}

        {step === "reset" && (
          <form onSubmit={handleResetPassword} noValidate className="flex flex-col gap-5">
            <FormField
              label="6-digit code"
              name="code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="123456"
              value={resetData.code}
              onChange={handleResetChange}
              error={errors.code}
            />

            <FormField
              label="New password"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={resetData.newPassword}
              onChange={handleResetChange}
              error={errors.newPassword}
            />

            <FormField
              label="Confirm new password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Re-enter new password"
              value={resetData.confirmPassword}
              onChange={handleResetChange}
              error={errors.confirmPassword}
            />

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-md bg-[#C9A55C] px-4 py-3 text-[13px] font-medium uppercase tracking-[0.15em] text-white transition hover:bg-[#b8944e] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Updating…" : "Update password"}
            </button>

            <button
              type="button"
              onClick={() => setStep("request")}
              className="text-xs text-[#1E1E1E]/60 hover:text-[#C9A55C]"
            >
              Use a different email
            </button>
          </form>
        )}

        {step === "done" && (
          <p className="text-center text-sm text-[#1E1E1E]/60">
            Redirecting you to log in…
          </p>
        )}

        {step !== "done" && (
          <p className="mt-6 text-center text-sm text-[#1E1E1E]/60">
            Remembered your password?{" "}
            <Link to="/login" className="font-medium text-[#1E1E1E] hover:text-[#C9A55C]">
              Log in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}