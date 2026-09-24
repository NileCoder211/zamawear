import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import axios from "../lib/axios";
import { useCart } from "../queries/useCart";

const KENYAN_COUNTIES = [
  "Nairobi", "Mombasa", "Kisumu", "Nakuru", "Uasin Gishu", "Kiambu",
  "Machakos", "Kajiado", "Kilifi", "Kakamega",
];

const CheckoutPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // Coupon lives in CartPage's state — passed via navigate("/checkout",
  // { state: { coupon } }). If someone lands here directly (refresh,
  // bookmark), there's no coupon in state and we just proceed without
  // one rather than guessing.
  const appliedCoupon = location.state?.coupon ?? null;

  const { data: cartItems = [], isLoading: cartLoading } = useCart();
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const [shipping, setShipping] = useState({
    fullName: "",
    phoneNumber: "",
    county: "Nairobi",
    area: "",
    landmark: "",
    houseNumber: "",
  });

  const [mpesaPhone, setMpesaPhone] = useState("");
  const [useSamePhone, setUseSamePhone] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const shippingFee = subtotal > 0 ? 1: 0;
  const total = subtotal + shippingFee; // display only — server recomputes authoritatively

  const handleShippingChange = (e) => {
    setShipping({ ...shipping, [e.target.name]: e.target.value });
  };

  const isShippingValid = () => {
    const { fullName, phoneNumber, county, area } = shipping;
    if (!fullName || !phoneNumber || !county || !area) {
      toast.error("Please fill in all required shipping details");
      return false;
    }
    if (!/^0[17]\d{8}$/.test(phoneNumber.replace(/\s/g, ""))) {
      toast.error("Enter a valid phone number, e.g. 0712345678");
      return false;
    }
    return true;
  };

  const handlePlaceOrder = async () => {
    if (!isShippingValid()) return;
    if (cartLoading) return;
    if (cartItems.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    const payPhone = useSamePhone ? shipping.phoneNumber : mpesaPhone;
    if (!/^0[17]\d{8}$/.test(payPhone.replace(/\s/g, ""))) {
      toast.error("Enter a valid M-Pesa number");
      return;
    }

    setIsProcessing(true);
    try {
      const res = await axios.post("/mpesa/stkpush", {
        phone: payPhone, // top-level — the number charged
        products: cartItems.map((item) => ({
          id: item._id,
          quantity: item.quantity,
        })),
        couponCode: appliedCoupon?.code,
        shippingAddress: shipping, // field names match the PendingOrder schema exactly
      });

      toast.success("Check your phone and enter your M-Pesa PIN");
     // in handlePlaceOrder, replace the existing navigate call with:
navigate(`/mpesa-pending/${res.data.CheckoutRequestID}`, {
  state: { phone: payPhone, totalAmount: res.data.totalAmount },
});
    } catch (err) {
      setIsProcessing(false);
      if (err.response?.status === 429) {
        toast.error(err.response.data.message);
      } else {
        toast.error(err.response?.data?.message || "Could not start M-Pesa payment");
      }
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <motion.div
        className="space-y-4 rounded-2xl border border-gray-200 bg-[#fcfcfc] p-4 shadow-[0_8px_30px_rgba(0,0,0,0.06)] sm:p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-lg font-medium text-gray-800">Shipping details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Full name"
            name="fullName"
            value={shipping.fullName}
            onChange={handleShippingChange}
          />
          <Field
            label="Phone number"
            name="phoneNumber"
            value={shipping.phoneNumber}
            onChange={handleShippingChange}
            placeholder="0712345678"
          />
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">County</label>
            <select
              name="county"
              value={shipping.county}
              onChange={handleShippingChange}
              className="block w-full rounded-lg border border-gray-300 p-2.5 text-sm text-gray-900 focus:border-emerald-500 focus:ring-emerald-500"
            >
              {KENYAN_COUNTIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <Field
            label="Area / estate"
            name="area"
            value={shipping.area}
            onChange={handleShippingChange}
            placeholder="e.g. Kilimani, South B"
          />
          <Field
            label="Landmark (optional)"
            name="landmark"
            value={shipping.landmark}
            onChange={handleShippingChange}
            placeholder="e.g. near Total petrol station"
          />
          <Field
            label="House / apartment no. (optional)"
            name="houseNumber"
            value={shipping.houseNumber}
            onChange={handleShippingChange}
          />
        </div>
      </motion.div>

      <motion.div
        className="space-y-4 rounded-2xl border border-gray-200 bg-[#fcfcfc] p-4 shadow-[0_8px_30px_rgba(0,0,0,0.06)] sm:p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <h2 className="text-lg font-medium text-gray-800">Payment method</h2>

        <div className="grid grid-cols-2 gap-3">
          <PaymentOption label="M-Pesa" active />
          <PaymentOption label="Card" disabled />
        </div>

        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="space-y-3 overflow-hidden"
          >
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={useSamePhone}
                onChange={(e) => setUseSamePhone(e.target.checked)}
                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              Use my shipping phone number for M-Pesa
            </label>
            {!useSamePhone && (
              <Field
                label="M-Pesa number"
                name="mpesaPhone"
                value={mpesaPhone}
                onChange={(e) => setMpesaPhone(e.target.value)}
                placeholder="0712345678"
              />
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      <motion.div
        className="space-y-3 rounded-2xl border border-gray-200 bg-[#fcfcfc] p-4 shadow-[0_8px_30px_rgba(0,0,0,0.06)] sm:p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="flex justify-between text-sm text-gray-600">
          <span>Subtotal</span>
          <span>KES {subtotal.toLocaleString()}</span>
        </div>
        {appliedCoupon && (
          <div className="flex justify-between text-sm text-emerald-600">
            <span>Coupon ({appliedCoupon.code})</span>
            <span>-{appliedCoupon.discountPercentage}%</span>
          </div>
        )}
        <div className="flex justify-between text-sm text-gray-600">
          <span>Shipping</span>
          <span>KES {shippingFee.toLocaleString()}</span>
        </div>
        <div className="flex justify-between border-t border-gray-200 pt-3 text-base font-medium text-gray-900">
          <span>Total</span>
          <span>KES {total.toLocaleString()}</span>
        </div>
        <p className="text-xs text-gray-400">
          Final amount is confirmed by the server and may adjust for your coupon.
        </p>

        <motion.button
          type="button"
          disabled={isProcessing || cartLoading}
          onClick={handlePlaceOrder}
          className="mt-2 flex w-full items-center justify-center rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-4 focus:ring-gray-500 disabled:cursor-not-allowed disabled:opacity-60"
          whileHover={{ scale: isProcessing ? 1 : 1.05 }}
          whileTap={{ scale: isProcessing ? 1 : 0.95 }}
        >
          {isProcessing ? "Sending M-Pesa prompt..." : "Pay with M-Pesa"}
        </motion.button>
      </motion.div>
    </div>
  );
};

const Field = ({ label, name, value, onChange, placeholder, className = "" }) => (
  <div className={className}>
    <label htmlFor={name} className="mb-2 block text-sm font-medium text-gray-700">
      {label}
    </label>
    <input
      type="text"
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="block w-full rounded-lg border border-gray-300 p-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:ring-emerald-500"
    />
  </div>
);

const PaymentOption = ({ label, active, disabled }) => (
  <button
    type="button"
    disabled={disabled}
    className={`rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
      disabled
        ? "cursor-not-allowed border-gray-200 text-gray-400"
        : active
        ? "border-black bg-black text-white"
        : "border-gray-300 text-gray-700 hover:border-gray-400"
    }`}
  >
    {label}
    {disabled && <span className="ml-1 text-xs">(soon)</span>}
  </button>
);

export default CheckoutPage;