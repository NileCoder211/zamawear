import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

/**
 * FormField
 *
 * Reusable labeled input for the auth forms. Handles its own
 * show/hide toggle when type="password". Renders an inline error
 * message (and a red ring) when `error` is passed.
 *
 * Props:
 *  - label: string
 *  - name: string
 *  - type?: string ("text" | "email" | "password" ...), default "text"
 *  - value: string
 *  - onChange: (e) => void
 *  - error?: string
 *  - autoComplete?: string
 *  - placeholder?: string
 */
export default function FormField({
  label,
  name,
  type = "text",
  value,
  onChange,
  error,
  autoComplete,
  placeholder,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={name}
        className="text-[11px] font-medium uppercase tracking-[0.15em] text-[#1E1E1E]/70"
      >
        {label}
      </label>

      <div className="relative">
        <input
          id={name}
          name={name}
          type={inputType}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          placeholder={placeholder}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : undefined}
          className={`w-full rounded-md border bg-white px-3.5 py-2.5 text-sm text-[#1E1E1E] outline-none transition placeholder:text-[#1E1E1E]/30 focus:ring-2 ${
            error
              ? "border-red-400 focus:ring-red-200"
              : "border-[#B9A58E]/40 focus:border-[#C9A55C] focus:ring-[#C9A55C]/20"
          } ${isPassword ? "pr-10" : ""}`}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1E1E1E]/40 transition hover:text-[#1E1E1E]/70"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {error && (
        <p id={`${name}-error`} className="text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}