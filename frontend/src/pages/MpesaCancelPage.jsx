// src/pages/MpesaCancelPage.jsx
import { XCircle, ArrowRight, RefreshCcw } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const MpesaCancelPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#F8F6F2]">
      <motion.div
        className="max-w-md w-full bg-white rounded-lg shadow-xl border border-[#E7DED1] overflow-hidden"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <div className="p-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
              <XCircle className="text-red-400 w-9 h-9" strokeWidth={1.75} />
            </div>
          </div>

          <h1
            className="text-3xl font-semibold text-center text-[#1E1E1E] mb-2"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Payment Not Completed
          </h1>

          <p className="text-[#1E1E1E]/70 text-center text-sm mb-1">
            Your M-Pesa payment wasn't completed.
          </p>
          <p className="text-[#1E1E1E]/50 text-center text-sm mb-6">
            No money has been deducted. Your cart is still saved.
          </p>

          <div className="bg-[#F8F6F2] border border-[#E7DED1] rounded-lg p-4 mb-6">
            <p className="text-xs uppercase tracking-wide text-[#1E1E1E]/50 mb-2">
              Common reasons
            </p>
            <ul className="text-sm text-[#1E1E1E]/70 space-y-1 list-disc list-inside">
              <li>PIN entered incorrectly</li>
              <li>STK prompt timed out</li>
              <li>Insufficient M-Pesa balance</li>
              <li>Request dismissed on phone</li>
            </ul>
          </div>

          <div className="space-y-3">
            <motion.button
              onClick={() => navigate(-1)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-[#C9A55C] hover:bg-[#C9A55C]/90 text-[#1E1E1E] font-medium py-2.5 px-4 rounded-lg transition duration-200 flex items-center justify-center"
            >
              <RefreshCcw className="mr-2" size={16} />
              Try Again
            </motion.button>

            <Link
              to="/"
              className="w-full border border-[#B9A58E] text-[#1E1E1E] font-medium py-2.5 px-4 rounded-lg transition duration-200 hover:bg-[#E7DED1]/40 flex items-center justify-center"
            >
              Continue Shopping
              <ArrowRight className="ml-2" size={16} />
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default MpesaCancelPage;