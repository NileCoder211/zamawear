/**
 * GoogleAuthButton
 *
 * By default this is a plain link to your backend's Google OAuth entry
 * point (Passport.js redirects to Google, then back to your callback
 * route, which sets the session/cookie and redirects into the app) —
 * so it's a full-page navigation, not a fetch call.
 *
 * Props:
 *  - label?: string              // default "Continue with Google"
 *  - href?: string                // default `${API_BASE}/api/auth/google`
 *  - onClick?: (e) => void        // pass this instead of href if you're using
 *                                  // a popup flow or a client-side SDK (e.g. @react-oauth/google)
 *  - disabled?: boolean
 */


export default function GoogleAuthButton({
  label = "Continue with Google",
  href = "https://zamawear.onrender.com/api/auth/google",
  onClick,
  disabled = false,
}) {
  const sharedClassName =
    "flex w-full items-center justify-center gap-2.5 rounded-md border border-[#B9A58E]/40 bg-white px-4 py-3 text-sm font-medium text-[#1E1E1E] transition hover:bg-[#F8F6F2] disabled:cursor-not-allowed disabled:opacity-60";

  const googleIcon = (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5Z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.6 15.9 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6 29.6 4 24 4c-7.5 0-14 4.2-17.7 10.7Z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.5 0 10.4-1.9 14.3-5.1l-6.6-5.4C29.7 35.4 27 36 24 36c-5.3 0-9.7-3.4-11.3-8l-6.6 5.1C9.9 39.7 16.4 44 24 44Z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.6 5.4C41.4 36.1 44 30.5 44 24c0-1.2-.1-2.4-.4-3.5Z"
      />
    </svg>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} disabled={disabled} className={sharedClassName}>
        {googleIcon}
        {label}
      </button>
    );
  }

  return (
    <a href={disabled ? undefined : href} aria-disabled={disabled} className={sharedClassName}>
      {googleIcon}
      {label}
    </a>
  );
}
