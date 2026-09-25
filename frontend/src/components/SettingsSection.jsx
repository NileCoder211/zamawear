import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Loader2, ChevronRight } from "lucide-react";
import { toast } from "react-hot-toast";
import FormField from "../components/FormField";
import axios from "../lib/axios";
import { useUserStore } from "../stores/useUserStore";

// "idle" -> danger zone with just the entry button
// "confirming" -> re-auth form open
export default function SettingsSection({ user }) {
  const navigate = useNavigate();
  const [stage, setStage] = useState("idle");

  const [formData, setFormData] = useState({ password: "", confirmation: "" });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isGoogleOnly = user?.authProvider === "google";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleDelete = async (e) => {
    e.preventDefault();

    if (isGoogleOnly && formData.confirmation !== "DELETE") {
      setErrors({ confirmation: 'Type "DELETE" exactly to confirm.' });
      return;
    }
    if (!isGoogleOnly && !formData.password) {
      setErrors({ password: "Enter your current password to confirm." });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await axios.delete("/auth/delete-account", {
        data: isGoogleOnly
          ? { confirmation: formData.confirmation }
          : { password: formData.password },
      });

      toast.success(res.data.message || "Account scheduled for deletion");

      // The backend has already cleared the auth cookies — just
      // clear the local store so the rest of the app reflects it.
      useUserStore.setState({ user: null });
      navigate("/login");
    } catch (error) {
      const message = error.response?.data?.message || "Couldn't process that.";
      setErrors(isGoogleOnly ? { confirmation: message } : { password: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <h2 className="text-2xl text-[#1E1E1E] font-heading">Settings</h2>

      <section className="rounded-lg border border-[#E7DED1] bg-white p-6">
        <h3 className="text-lg text-[#1E1E1E] font-heading mb-4">Account</h3>
        <Link
          to="/forgot-password"
          className="flex items-center justify-between rounded-md px-3 py-3 text-sm text-[#1E1E1E] hover:bg-[#F8F6F2] transition"
        >
          <span>Reset your password</span>
          <ChevronRight size={16} className="text-[#1E1E1E]/40" />
        </Link>
      </section>

      <section className="rounded-lg border border-red-200 bg-red-50/40 p-6">
        <h3 className="text-lg text-red-700 font-heading mb-2">Danger zone</h3>

        {stage === "idle" && (
          <>
            <p className="text-sm text-[#1E1E1E]/70 mb-4">
              Deleting your account schedules it for permanent removal in 30
              days. You'll be logged out immediately, and logging back in
              before then automatically cancels it.
            </p>
            <button
              onClick={() => setStage("confirming")}
              className="rounded-md border border-red-300 px-4 py-2 text-[13px] font-medium uppercase tracking-[0.15em] text-red-700 hover:bg-red-100 transition"
            >
              Delete my account
            </button>
          </>
        )}

        {stage === "confirming" && (
          <form onSubmit={handleDelete} noValidate className="flex flex-col gap-4">
            <p className="text-sm text-[#1E1E1E]/70">
              {isGoogleOnly
                ? 'Type "DELETE" to confirm you want to permanently delete your account.'
                : "Enter your current password to confirm."}
            </p>

            {isGoogleOnly ? (
              <FormField
                label="Type DELETE to confirm"
                name="confirmation"
                type="text"
                placeholder="DELETE"
                value={formData.confirmation}
                onChange={handleChange}
                error={errors.confirmation}
              />
            ) : (
              <FormField
                label="Current password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Your current password"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
              />
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 rounded-md bg-red-600 px-4 py-2.5 text-[13px] font-medium uppercase tracking-[0.15em] text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isSubmitting ? "Processing…" : "Permanently delete"}
              </button>
              <button
                type="button"
                onClick={() => setStage("idle")}
                className="text-xs text-[#1E1E1E]/60 hover:text-[#1E1E1E]"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}