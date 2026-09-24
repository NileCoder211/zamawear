// src/pages/MpesaSuccessPage.jsx
import { CheckCircle, ArrowRight } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Confetti from "react-confetti";
import axios from "../lib/axios";
import OrderItemRow from "../components/OrderItemRow";

const MpesaSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      const res = await axios.get(`/orders/${orderId}`);
      return res.data.order; // matches getSingleOrder's { order } response shape
    },
    enabled: !!orderId,
  });

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#F8F6F2]">
      {!isLoading && !isError && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          gravity={0.12}
          numberOfPieces={500}
          colors={["#C9A55C", "#B9A58E", "#1E1E1E", "#F8F6F2"]}
          recycle={false}
          style={{ zIndex: 99 }}
        />
      )}

      <div className="max-w-md w-full bg-white rounded-lg shadow-xl border border-[#E7DED1] overflow-hidden relative z-10">
        <div className="p-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-[#E7DED1] flex items-center justify-center">
              <CheckCircle className="text-[#C9A55C] w-9 h-9" strokeWidth={1.75} />
            </div>
          </div>

          <h1
            className="text-3xl font-semibold text-center text-[#1E1E1E] mb-2"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Payment Successful
          </h1>

          <p className="text-[#1E1E1E]/70 text-center text-sm mb-1">
            Thank you for your order — we're processing it now.
          </p>
          <p className="text-[#C9A55C] text-center text-sm mb-6">
            You'll receive an M-Pesa confirmation SMS shortly.
          </p>

          {isLoading && (
            <p className="text-center text-sm text-[#1E1E1E]/50 mb-6">Loading your order…</p>
          )}
          {isError && (
            <p className="text-center text-sm text-red-600 mb-6">
              Couldn't load order details, but your payment went through.
            </p>
          )}

          {order && (
            <div className="bg-[#F8F6F2] border border-[#E7DED1] rounded-lg p-4 mb-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wide text-[#1E1E1E]/50">
                  Order number
                </span>
                <span className="text-sm font-semibold text-[#1E1E1E]">
                  {order.orderNumber}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wide text-[#1E1E1E]/50">
                  Amount paid
                </span>
                <span className="text-sm font-semibold text-[#1E1E1E]">
                  KES {Number(order.totalAmount).toLocaleString("en-KE")}
                </span>
              </div>

              {order.mpesaReceiptNumber && (
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wide text-[#1E1E1E]/50">
                    M-Pesa code
                  </span>
                  <span className="text-sm font-semibold text-[#1E1E1E]">
                    {order.mpesaReceiptNumber}
                  </span>
                </div>
              )}

              <div className="pt-2 border-t border-[#E7DED1] space-y-3">
                // reading order items — order stores its own name/image snapshot,
// no need to fall back to the populated product ref
{order.products?.map((item, i) => (
  <OrderItemRow
    key={item.product?._id || item.product || i}
    name={item.name}
    image={item.image}
    quantity={item.quantity}
  />
))}
              </div>
            </div>
          )}

          <div className="space-y-3">
          
<Link
  to="/user-profile"
  className="w-full bg-[#1E1E1E] hover:bg-[#1E1E1E]/90 text-[#F8F6F2] font-medium py-2.5 px-4 rounded-lg transition duration-200 flex items-center justify-center"
>
  View Order
  <ArrowRight className="ml-2" size={16} />
</Link>
            <Link
              to="/"
              className="w-full border border-[#B9A58E] text-[#1E1E1E] font-medium py-2.5 px-4 rounded-lg transition duration-200 hover:bg-[#E7DED1]/40 flex items-center justify-center"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MpesaSuccessPage;