import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/auth`
  : "/api/auth";

// Optional: pass onAccountDeleted to clear your global auth state
// (e.g. useUserStore.getState().clear()) once deletion is confirmed —
// the backend has already cleared the auth cookies at that point.
export default function DeleteAccountPage({ onAccountDeleted }) {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // "idle" -> just the warning + button
  // "confirming" -> re-auth form is open
  // "success" -> deletion scheduled
  const [stage, setStage] = useState("idle");

  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [scheduledFor, setScheduledFor] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch(`${API_BASE}/profile`, { credentials: "include" });
        if (res.ok) setUser(await res.json());
      } catch {
        // If this fails we just fall back to asking for a password
        // below; the backend still enforces the real check.
      } finally {
        setLoadingUser(false);
      }
    };
    loadProfile();
  }, []);

  const isGoogleOnly = user?.authProvider === "google";

  const handleDelete = async (e) => {
    e.preventDefault();
    setError("");

    if (isGoogleOnly) {
      if (confirmation !== "DELETE") {
        setError('Type "DELETE" exactly to confirm.');
        return;
      }
    } else if (!password) {
      setError("Enter your current password to confirm.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/delete-account`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(
          isGoogleOnly ? { confirmation } : { password }
        ),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Couldn't process that. Please try again.");
        return;
      }

      setScheduledFor(data.deletionScheduledAt);
      setStage("success");
      onAccountDeleted?.();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F6F2]">
        <p className="font-['Poppins'] text-sm text-[#1E1E1E]/60">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F6F2] px-4">
      <div className="w-full max-w-md bg-white border border-[#E7DED1] rounded-lg shadow-sm p-8">
        {stage !== "success" && (
          <h1 className="font-['Cormorant_Garamond'] text-3xl text-[#1E1E1E] mb-2">
            Delete account
          </h1>
        )}

        {stage === "idle" && (
          <>
            <p className="font-['Poppins'] text-sm text-[#1E1E1E]/70 mb-6">
              This schedules your account for permanent deletion in 30 days.
              You'll be logged out immediately. If you log back in before the
              30 days are up, the deletion is automatically cancelled — after
              that, your data can't be recovered.
            </p>
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 mb-6">
              <p className="font-['Poppins'] text-xs text-red-700">
                Your orders will be kept for our records, but your profile,
                cart, wishlist, and login access will be removed once the
                grace period ends.
              </p>
            </div>
            <button
              onClick={() => setStage("confirming")}
              className="w-full bg-red-600 text-white font-['Poppins'] text-sm font-medium rounded-md py-2.5 hover:bg-red-700 transition"
            >
              Continue to delete my account
            </button>
            <Link
              to="/account"
              className="block text-center font-['Poppins'] text-xs text-[#1E1E1E]/60 hover:text-[#1E1E1E] underline mt-4"
            >
              Cancel, take me back
            </Link>
          </>
        )}

        {stage === "confirming" && (
          <>
            <p className="font-['Poppins'] text-sm text-[#1E1E1E]/70 mb-6">
              {isGoogleOnly
                ? 'Type "DELETE" below to confirm you want to permanently delete your account.'
                : "Enter your current password to confirm."}
            </p>

            <form onSubmit={handleDelete} className="space-y-4">
              {isGoogleOnly ? (
                <div>
                  <label className="font-['Poppins'] text-sm text-[#1E1E1E] block mb-1">
                    Type DELETE to confirm
                  </label>
                  <input
                    type="text"
                    value={confirmation}
                    onChange={(e) => setConfirmation(e.target.value)}
                    className="w-full border border-[#B9A58E] rounded-md px-3 py-2 font-['Poppins'] text-sm text-[#1E1E1E] focus:outline-none focus:ring-2 focus:ring-red-400"
                    placeholder="DELETE"
                    autoFocus
                  />
                </div>
              ) : (
                <div>
                  <label className="font-['Poppins'] text-sm text-[#1E1E1E] block mb-1">
                    Current password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-[#B9A58E] rounded-md px-3 py-2 font-['Poppins'] text-sm text-[#1E1E1E] focus:outline-none focus:ring-2 focus:ring-red-400"
                    placeholder="Your current password"
                    autoFocus
                  />
                </div>
              )}

              {error && (
                <p className="font-['Poppins'] text-sm text-red-600">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 text-white font-['Poppins'] text-sm font-medium rounded-md py-2.5 hover:bg-red-700 disabled:opacity-50 transition"
              >
                {loading ? "Processing…" : "Permanently delete my account"}
              </button>

              <button
                type="button"
                onClick={() => setStage("idle")}
                className="w-full font-['Poppins'] text-xs text-[#1E1E1E]/60 hover:text-[#1E1E1E] underline"
              >
                Go back
              </button>
            </form>
          </>
        )}

        {stage === "success" && (
          <div className="text-center py-2">
            <h1 className="font-['Cormorant_Garamond'] text-3xl text-[#1E1E1E] mb-4">
              Deletion scheduled
            </h1>
            <p className="font-['Poppins'] text-sm text-[#1E1E1E]/70 mb-2">
              Your account will be permanently deleted on{" "}
              <span className="font-medium text-[#1E1E1E]">
                {scheduledFor
                  ? new Date(scheduledFor).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "the scheduled date"}
              </span>
              .
            </p>
            <p className="font-['Poppins'] text-xs text-[#1E1E1E]/60 mb-6">
              Changed your mind? Just log back in before then and it's
              automatically cancelled. We've also sent this to your email.
            </p>
            <button
              onClick={() => navigate("/login")}
              className="w-full bg-[#C9A55C] text-white font-['Poppins'] text-sm font-medium rounded-md py-2.5 hover:opacity-90 transition"
            >
              Back to login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}