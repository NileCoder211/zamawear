import { create } from "zustand";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

export const useUserStore = create((set, get) => ({
  user: null,
  loading: false,
  checkingAuth: true, // page-load auth check only
  refreshing: false, // separate flag — token-refresh-in-progress, distinct from checkingAuth

  signup: async ({ name, email, password, confirmPassword }) => {
    set({ loading: true });

    if (password !== confirmPassword) {
      set({ loading: false });
      return toast.error("Passwords do not match");
    }

    try {
      const res = await axios.post("/auth/signup", { name, email, password });
      // Pull message out separately so it doesn't end up sitting
      // inside the stored user object — reuse the backend's own
      // wording instead of hardcoding the same string again here.
      const { message, ...userData } = res.data;
      set({ user: userData, loading: false });
      toast.success(message || "Account created successfully");
    } catch (error) {
      set({ loading: false });
      toast.error(error.response?.data?.message || "An error occurred");
    }
  },

  login: async (email, password) => {
    set({ loading: true });

    try {
      const res = await axios.post("/auth/login", { email, password });
      const { message, ...userData } = res.data;
      toast.success(message || "Logged in successfully");
      set({ user: userData, loading: false });
    } catch (error) {
      set({ loading: false });
      toast.error(error.response?.data?.message || "An error occurred");
    }
  },

  logout: async () => {
    try {
      const res = await axios.post("/auth/logout");
      toast.success(res.data.message);
      set({ user: null });
    } catch (error) {
      toast.error(
        error.response?.data?.message || "An error occurred during logout",
      );
    }
  },
  checkAuth: async () => {
    try {
      set({ checkingAuth: true });

      const res = await axios.get("/auth/profile");

      set({
        user: res.data,
        checkingAuth: false,
      });
    } catch (error) {
      if (error.response?.status === 401) {
        set({
          user: null,
          checkingAuth: false,
        });
        return;
      }

      console.error(error);

      set({
        user: null,
        checkingAuth: false,
      });
    }
  },

  refreshToken: async () => {
    // Dedup guard for direct callers of this action (the interceptor
    // below has its own separate dedup via the module-level
    // refreshPromise variable — this just protects against something
    // else in the app calling refreshToken() directly while one is
    // already in flight).
    if (get().refreshing) return;

    set({ refreshing: true });
    try {
      const response = await axios.post("/auth/refresh-token");
      set({ refreshing: false });
      return response.data;
    } catch (error) {
      set({ user: null, refreshing: false });
      throw error;
    }
  },

  // ── Forgot password ──────────────────────────────────────────
  // Two steps, mirroring the backend: request a code, then verify
  // it along with the new password. The backend always returns a
  // generic success message on the "send" step regardless of
  // whether the email exists, so this never needs to branch on that.
  sendForgotPasswordCode: async (email) => {
    set({ loading: true });
    try {
      const res = await axios.post("/auth/forgot-password/send", { email });
      toast.success(
        res.data.message || "If that account exists, a code has been sent.",
      );
      set({ loading: false });
      return true;
    } catch (error) {
      set({ loading: false });
      toast.error(error.response?.data?.message || "An error occurred");
      return false;
    }
  },

  resetForgottenPassword: async (email, providedCode, newPassword) => {
    set({ loading: true });
    try {
      const res = await axios.post("/auth/forgot-password/verify", {
        email,
        providedCode,
        newPassword,
      });
      toast.success(res.data.message || "Password updated!");
      set({ loading: false });
      return true;
    } catch (error) {
      set({ loading: false });
      toast.error(
        error.response?.data?.message || "That code is invalid or has expired.",
      );
      return false;
    }
  },

  // ── Delete account ───────────────────────────────────────────
  // Pass { password } for local accounts or { confirmation: "DELETE" }
  // for Google-only accounts, matching what the backend expects.
  // Clears the local user on success since the backend has already
  // cleared the auth cookies.
  deleteAccount: async ({ password, confirmation }) => {
    set({ loading: true });
    try {
      const res = await axios.delete("/auth/delete-account", {
        data: { password, confirmation },
      });
      toast.success(res.data.message || "Account scheduled for deletion.");
      set({ user: null, loading: false });
      return res.data;
    } catch (error) {
      set({ loading: false });
      toast.error(error.response?.data?.message || "Couldn't process that.");
      return null;
    }
  },
}));

// Axios interceptor for token refresh
let refreshPromise = null;

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Never re-enter this retry logic for the refresh-token request
    // itself. Without this check, if the refresh token is expired or
    // revoked, the resulting 401 from THIS request gets caught by
    // this same interceptor, which then awaits `refreshPromise` —
    // the very promise this code is already executing inside of.
    // That's a deadlock, not just a retry loop: it can never resolve.
    if (originalRequest?.url?.includes("/auth/refresh-token")) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        if (refreshPromise) {
          await refreshPromise;
          return axios(originalRequest);
        }

        refreshPromise = useUserStore.getState().refreshToken();
        await refreshPromise;
        refreshPromise = null;

        return axios(originalRequest);
      } catch (refreshError) {
        // Must reset here too — previously this only reset on the
        // success path, so a single failed refresh left
        // refreshPromise permanently holding a rejected promise,
        // silently disabling every future refresh attempt for the
        // rest of the page's lifetime.
        refreshPromise = null;
        useUserStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);
