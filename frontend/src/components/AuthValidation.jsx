// authValidation.js
// Shared client-side validation for the Login and Sign Up forms.
// These are UX-layer checks only — the backend must still validate
// and sanitize everything again server-side.

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email) {
  return EMAIL_REGEX.test(email.trim());
}

/**
 * Returns an error message string if the password is too weak,
 * or null if it passes.
 */
export function getPasswordError(password) {
  if (!password) return "Password is required";
  if (password.length < 8) return "Password must be at least 8 characters";
  if (!/[a-zA-Z]/.test(password)) return "Password must include a letter";
  if (!/[0-9]/.test(password)) return "Password must include a number";
  return null;
}

export function validateLoginForm({ email, password }) {
  const errors = {};

  if (!email.trim()) {
    errors.email = "Email is required";
  } else if (!isValidEmail(email)) {
    errors.email = "Enter a valid email address";
  }

  if (!password) {
    errors.password = "Password is required";
  }

  return errors;
}

export function validateSignUpForm({
  name,
  email,
  password,
  confirmPassword,
  agreeToTerms,
}) {
  const errors = {};

  if (!name.trim()) {
    errors.name = "Full name is required";
  } else if (name.trim().length < 2) {
    errors.name = "Enter your full name";
  }

  if (!email.trim()) {
    errors.email = "Email is required";
  } else if (!isValidEmail(email)) {
    errors.email = "Enter a valid email address";
  }

  const passwordError = getPasswordError(password);
  if (passwordError) {
    errors.password = passwordError;
  }

  if (!confirmPassword) {
    errors.confirmPassword = "Please confirm your password";
  } else if (password !== confirmPassword) {
    errors.confirmPassword = "Passwords do not match";
  }

  if (!agreeToTerms) {
    errors.agreeToTerms = "You must agree to the Terms & Privacy Policy";
  }

  return errors;
}