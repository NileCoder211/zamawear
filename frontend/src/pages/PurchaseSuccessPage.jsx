// src/pages/PurchaseSuccessPage.jsx
import { ArrowRight, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useClearCart } from "../queries/useCart";
import axios from "../lib/axios";
import Confetti from "react-confetti";
import OrderItemRow from "../components/OrderItemRow";

const PurchaseSuccessPage = () => {
  const [order, setOrder] = useState(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState(null);

  const clearCartMutation = useClearCart();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");

  useEffect(() => {
    // Note: MpesaPendingPage already calls useClearCart on its own
    // success branch before navigating here. This second call is a
    // safe no-op if the cart's already empty, but if you'd rather not
    // clear twice, this whole mutate() call can be dropped from this
    // page and left solely to MpesaPendingPage.
    const loadOrder = async () => {
      if (!orderId) {
        setError("No order reference found");
        setIsProcessing(false);
        return;
      }

      try {
        const res = await axios.get(`/orders/${orderId}`);
        setOrder(res.data.order);
        clearCartMutation.mutate();
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || "Failed to load order");
      } finally {
        setIsProcessing(false);
      }
    };

    loadOrder();
  }, [orderId]);

  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F6F2]">
        <p className="text-[#1E1E1E]/50 animate-pulse">Confirming your order…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F6F2] px-4">
        <p className="text-red-600 text-center">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#F8F6F2]">
      <Confetti
        width={window.innerWidth}
        height={window.innerHeight}
        gravity={0.12}
        numberOfPieces={500}
        colors={["#C9A55C", "#B9A58E", "#1E1E1E", "#F8F6F2"]}
        recycle={false}
        style={{ zIndex: 99 }}
      />

      <div className="bg-white border border-[#E7DED1] rounded-2xl p-8 shadow-[0_8px_30px_rgba(0,0,0,0.06)] w-full max-w-md relative z-10">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-[#E7DED1] flex items-center justify-center">
            <CheckCircle className="text-[#C9A55C] w-9 h-9" strokeWidth={1.75} />
          </div>
        </div>

        <h1
          className="text-3xl font-semibold text-center text-[#1E1E1E] mb-2"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          Purchase Successful
        </h1>

        <p className="text-center text-[#1E1E1E]/60 text-sm mb-6">
          Thank you for your order — a confirmation has been sent to your phone.
        </p>

        <div className="bg-[#F8F6F2] border border-[#E7DED1] rounded-lg p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-[#1E1E1E]/50">Order number</span>
            <span className="font-semibold text-[#1E1E1E]">
              {order?.orderNumber || "—"}
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-[#1E1E1E]/50">Total</span>
            <span className="font-semibold text-[#1E1E1E]">
              KES {order?.totalAmount?.toLocaleString("en-KE")}
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-[#1E1E1E]/50">Delivery</span>
            <span className="font-semibold text-[#1E1E1E]">3–5 days</span>
          </div>

          {order?.products?.length > 0 && (
            <div className="pt-3 border-t border-[#E7DED1] space-y-3">
              {order.products.map((item, i) => (
                <OrderItemRow
                  key={item.product?._id || item.product || i}
                  name={item.name}
                  image={item.image}
                  quantity={item.quantity}
                />
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 space-y-3">
          <Link
            to="/user-profile#orders"
            className="w-full bg-[#1E1E1E] hover:bg-[#1E1E1E]/90 text-[#F8F6F2] font-medium py-2.5 px-4 rounded-lg transition duration-200 flex items-center justify-center"
          >
            View My Orders
          </Link>

          <Link
            to="/"
            className="w-full border border-[#B9A58E] text-[#1E1E1E] font-medium py-2.5 px-4 rounded-lg transition duration-200 hover:bg-[#E7DED1]/40 flex items-center justify-center"
          >
            Continue Shopping
            <ArrowRight className="ml-2" size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PurchaseSuccessPage;