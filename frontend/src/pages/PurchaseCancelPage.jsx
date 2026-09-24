// src/pages/PurchaseCancelPage.jsx
import { XCircle, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const PurchaseCancelPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#F8F6F2]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white border border-[#E7DED1] shadow-[0_8px_30px_rgba(0,0,0,0.06)] rounded-2xl max-w-md w-full overflow-hidden"
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

          <p className="text-[#1E1E1E]/60 text-center text-sm mb-6">
            Your order was not completed. No charges have been made, and your cart is still saved.
          </p>

          <div className="bg-[#F8F6F2] border border-[#E7DED1] rounded-lg p-4 mb-6">
            <p className="text-sm text-[#1E1E1E]/60 text-center">
              If you ran into any issues during checkout, feel free to reach out to our support team.
            </p>
          </div>

          <Link
            to="/"
            className="w-full border border-[#B9A58E] text-[#1E1E1E] font-medium py-2.5 px-4 rounded-lg transition duration-200 hover:bg-[#E7DED1]/40 flex items-center justify-center"
          >
            <ArrowLeft className="mr-2" size={16} />
            Return to Shop
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default PurchaseCancelPage;