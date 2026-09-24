import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import axios from "../lib/axios";

const GiftCouponCard = ({ coupon, setCoupon, isCouponApplied, setIsCouponApplied }) => {
  const [userInputCode, setUserInputCode] = useState("");
  const [isApplying, setIsApplying] = useState(false);

  // fetch user's available coupon on mount
  useEffect(() => {
    const getMyCoupon = async () => {
      try {
        const res = await axios.get("/coupons");
        setCoupon(res.data);
      } catch (error) {
        console.error("Error fetching coupon:", error);
      }
    };
    getMyCoupon();
  }, [setCoupon]);

  useEffect(() => {
    if (coupon) setUserInputCode(coupon.code);
  }, [coupon]);

  const handleApplyCoupon = async () => {
    if (!userInputCode || isApplying) return;
    setIsApplying(true);
    try {
      const res = await axios.post("/coupons/validate", { code: userInputCode });
      setCoupon(res.data);
      setIsCouponApplied(true);
      toast.success("Coupon applied successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || err?.message || "Invalid coupon code");
    } finally {
      setIsApplying(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCoupon(null);
    setIsCouponApplied(false);
    setUserInputCode("");
    toast.success("Coupon removed");
  };

  return (
    <motion.div
      className="bg-[#fcfcfc]
      border border-gray-200
      shadow-[0_8px_30px_rgba(0,0,0,0.06)]
      rounded-2xl space-y-4 p-4 sm:p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="space-y-4">
        <div>
          <label
            htmlFor="voucher"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Do you have a voucher or gift card?
          </label>
          <input
            type="text"
            id="voucher"
            className="block w-full rounded-lg border border-gray-300
            p-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-emerald-500
            focus:ring-emerald-500"
            placeholder="Enter code here"
            value={userInputCode}
            onChange={(e) => setUserInputCode(e.target.value)}
          />
        </div>

        <motion.button
          type="button"
          disabled={isApplying}
          className="flex w-full items-center justify-center rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-4 focus:ring-gray-500 disabled:cursor-not-allowed disabled:opacity-60"
          whileHover={{ scale: isApplying ? 1 : 1.05 }}
          whileTap={{ scale: isApplying ? 1 : 0.95 }}
          onClick={handleApplyCoupon}
        >
          {isApplying ? "Applying..." : "Apply Code"}
        </motion.button>
      </div>

      {isCouponApplied && coupon && (
        <div className="mt-4">
          <h3 className="text-lg font-medium text-gray-800">Applied Coupon</h3>
          <p className="mt-2 text-sm text-gray-600">
            {coupon.code} - {coupon.discountPercentage}% off
          </p>
          <motion.button
            type="button"
            className="mt-2 flex w-full items-center justify-center rounded-lg bg-red-600
            px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700 focus:outline-none
            focus:ring-4 focus:ring-red-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRemoveCoupon}
          >
            Remove Coupon
          </motion.button>
        </div>
      )}

      {coupon && !isCouponApplied && (
        <div className="mt-4">
          <h3 className="text-lg font-medium text-gray-800">
            Your Available Coupon:
          </h3>
          <p className="mt-2 text-sm text-gray-600">
            {coupon.code} - {coupon.discountPercentage}% off
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default GiftCouponCard;