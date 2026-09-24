// src/pages/MpesaPendingPage.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Smartphone, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import axios from "../lib/axios";
import { useClearCart } from "../queries/useCart";

const POLL_INTERVAL_MS = 4000;
const MAX_POLLS = 15;

const MpesaPendingPage = () => {
  // checkoutRequestId comes from the URL param — this is what the
  // route actually declares (/mpesa-pending/:checkoutRequestId) and
  // what CheckoutPage puts in the URL when it navigates here.
  const { checkoutRequestId } = useParams();

  // phone/totalAmount are display-only, passed separately via
  // router state since they're not part of the URL.
  const { state } = useLocation();
  const { phone, totalAmount } = state || {};

  const navigate = useNavigate();
  const clearCartMutation = useClearCart();

  const [status, setStatus] = useState("waiting");
  const [pollCount, setPollCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const intervalRef = useRef(null);
  const pollCountRef = useRef(0);

  const stopPolling = useCallback(() => {
    clearInterval(intervalRef.current);
  }, []);

  const startPolling = useCallback(() => {
    pollCountRef.current = 0;
    setPollCount(0);

    intervalRef.current = setInterval(async () => {
      pollCountRef.current += 1;
      setPollCount(pollCountRef.current);

      if (pollCountRef.current >= MAX_POLLS) {
        clearInterval(intervalRef.current);
        setStatus("failed");
        setErrorMsg(
          "Safaricom hasn't confirmed your payment yet. If money was deducted, please contact support."
        );
        return;
      }

      try {
        const res = await axios.post("/mpesa/confirm", { checkoutRequestId });

        if (res.data.success) {
          clearInterval(intervalRef.current);
          setStatus("success");
          clearCartMutation.mutate();
          setTimeout(
            () => navigate(`/purchase-success?orderId=${res.data.orderId}`),
            1500
          );
          return;
        }
        // res.data.pending === true → keep polling silently
      } catch (err) {
        const httpStatus = err.response?.status;
        const serverError = err.response?.data?.error || "";

        if (httpStatus === 400) {
          clearInterval(intervalRef.current);
          setStatus("failed");
          setErrorMsg(serverError || "Payment was cancelled or failed.");
          return;
        }

        console.warn("Poll error (will retry):", err.message);
      }
    }, POLL_INTERVAL_MS);
  }, [checkoutRequestId, clearCartMutation.mutate, navigate]);

  useEffect(() => {
    if (!checkoutRequestId) {
      setStatus("failed");
      setErrorMsg("Payment session not found. Please go back and try again.");
      return;
    }

    startPolling();
    return () => stopPolling();
  }, [checkoutRequestId, startPolling, stopPolling]);

  const handleRetry = () => {
    setStatus("waiting");
    setErrorMsg("");
    stopPolling();
    startPolling();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 px-4">
      <motion.div
        className="w-full max-w-md rounded-2xl border border-gray-700 bg-gray-800 p-8 text-center shadow-2xl"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        {status === "waiting" && (
          <>
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15">
              <Smartphone className="h-8 w-8 text-emerald-400" />
            </div>

            <h1 className="mb-2 text-xl font-bold text-white">Check Your Phone</h1>
            <p className="mb-1 text-gray-400">An M-Pesa prompt has been sent to</p>
            <p className="mb-4 text-lg font-semibold text-emerald-400">
              {phone || "your phone"}
            </p>
            <p className="mb-6 text-sm text-gray-400">
              Enter your M-Pesa PIN to complete your payment
              {totalAmount != null && (
                <>
                  {" "}of{" "}
                  <span className="font-semibold text-white">
                    KES {Number(totalAmount).toFixed(2)}
                  </span>
                </>
              )}
              . This page confirms automatically once Safaricom processes it.
            </p>

            <div className="mb-6 flex items-center justify-center gap-2 text-sm text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
              <span>Waiting for confirmation…</span>
            </div>

            <div className="mb-6 flex justify-center gap-1.5">
              {Array.from({ length: MAX_POLLS }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 w-1.5 rounded-full transition-colors duration-300 ${
                    i < pollCount ? "bg-emerald-400" : "bg-gray-600"
                  }`}
                />
              ))}
            </div>

            <button
              onClick={() => {
                stopPolling();
                navigate("/mpesa-cancel");
              }}
              className="w-full rounded-xl border border-gray-700 py-3 text-sm text-gray-400 transition hover:bg-gray-700"
            >
              Cancel & Go Back
            </button>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>
            <h1 className="mb-2 text-xl font-bold text-white">Payment Confirmed!</h1>
            <p className="text-gray-400">Your order has been placed. Redirecting…</p>
            <Loader2 className="mx-auto mt-4 h-5 w-5 animate-spin text-emerald-400" />
          </>
        )}

        {status === "failed" && (
          <>
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/15">
              <XCircle className="h-8 w-8 text-red-400" />
            </div>
            <h1 className="mb-2 text-xl font-bold text-white">Confirmation Failed</h1>
            <p className="mb-6 text-sm text-gray-400">{errorMsg}</p>
            <motion.button
              onClick={handleRetry}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="w-full rounded-xl bg-emerald-600 py-3 font-semibold text-white transition hover:bg-emerald-700"
            >
              Try Again
            </motion.button>
            <button
              onClick={() => navigate("/mpesa-cancel")}
              className="mt-3 w-full rounded-xl border border-gray-700 py-3 text-sm text-gray-400 transition hover:bg-gray-700"
            >
              Go Back to Cart
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default MpesaPendingPage;