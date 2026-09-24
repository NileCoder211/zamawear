import { useState } from "react";
import { Package, ChevronRight } from "lucide-react";
import { STATUS_CONFIG } from "../lib/statusConfig";

const OrderCard = ({ order, cancelOrder })=> {
  const [expanded, setExpanded] = useState(false);

  const status = STATUS_CONFIG[order.orderStatus] || STATUS_CONFIG.processing;

  // Matches the backend's own rule exactly: cancelOrder only allows
  // moving out of "processing" — an order can never be "pending" or
  // "paid" as its orderStatus (see cancelOrder controller).
  const canCancel = order.orderStatus === "processing";

  const firstItem = order.products?.[0];
  const firstItemImage = firstItem?.image || firstItem?.product?.images?.[0]?.url;

  return (
    <div className="bg-white border border-[#E7DED1] rounded-xl overflow-hidden hover:shadow-sm transition-all">
      {/* Header */}
      <div className="p-6 flex items-center gap-6 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="w-20 h-20 rounded-lg bg-[#F8F6F2] overflow-hidden shrink-0 border border-[#E7DED1]">
          {firstItemImage ? (
            <img
              src={firstItemImage}
              alt={firstItem?.name || firstItem?.product?.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package size={24} className="text-[#c9c3b6]" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs">
                <span className="text-[#8a8375]">Order Number: </span>
                <span className="font-medium text-[#1E1E1E]">{order.orderNumber}</span>
              </p>

              <h4
                className="text-lg text-[#1E1E1E] leading-tight"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                {order.products?.length} item{order.products?.length > 1 ? "s" : ""}
              </h4>

              <p className="text-xs text-[#8a8375] mt-1">
                {order.paymentMethod?.toUpperCase()} • {order.paymentStatus}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${status.badge}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                {status.label}
              </span>

              <ChevronRight
                size={16}
                className={`text-[#8a8375] transition-transform ${expanded ? "rotate-90" : ""}`}
              />
            </div>
          </div>

          <div className="flex items-center gap-6 mt-3 flex-wrap">
            <span className="text-sm font-semibold text-[#1E1E1E]">
              KES {Number(order.totalAmount || 0).toLocaleString("en-KE")}
            </span>
            <span className="text-xs text-[#8a8375]">
              {new Date(order.createdAt).toLocaleDateString("en-GB")}
            </span>
          </div>
        </div>
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="border-t border-[#E7DED1] px-6 py-5 bg-[#F8F6F2]/60 space-y-6">
          {/* Products */}
          <div className="space-y-4">
            {order.products?.map((item) => (
              <div
                key={item.product?._id || item.product}
                className="flex items-center justify-between gap-4 bg-white border border-[#E7DED1] rounded-lg p-4"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={item.image || item.product?.images?.[0]?.url}
                    alt={item.name || item.product?.name}
                    className="w-16 h-16 object-cover rounded-md bg-[#E7DED1]"
                  />
                  <div>
                    <h4 className="text-sm font-semibold text-[#1E1E1E]">
                      {item.name || item.product?.name}
                    </h4>
                    <p className="text-xs text-[#8a8375]">Qty: {item.quantity}</p>
                  </div>
                </div>

                <p className="text-sm font-semibold text-[#1E1E1E]">
                  KES {Number(item.price).toLocaleString("en-KE")}
                </p>
              </div>
            ))}
          </div>

          {/* Payment, status, shipping */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-sm">
            <div>
              <p className="text-[10px] text-[#8a8375] uppercase tracking-[0.15em] mb-1">
                Payment
              </p>
              <p className="text-[#1E1E1E] capitalize">{order.paymentMethod}</p>
            </div>

            <div>
              <p className="text-[10px] text-[#8a8375] uppercase tracking-[0.15em] mb-1">
                Status
              </p>
              <p className="text-[#1E1E1E] capitalize">{order.orderStatus}</p>
            </div>

            <div className="col-span-2 sm:col-span-1 space-y-1">
              <p className="text-[10px] text-[#8a8375] uppercase tracking-[0.15em] mb-1">
                Shipping Info
              </p>

              <p>
                <span className="text-[#8a8375]">Name: </span>
                <span className="font-medium text-[#1E1E1E]">
                  {order.shippingAddress?.fullName || "—"}
                </span>
              </p>
              <p>
                <span className="text-[#8a8375]">Phone: </span>
                <span className="font-medium text-[#1E1E1E]">
                  {order.shippingAddress?.phoneNumber || "—"}
                </span>
              </p>
              <p>
                <span className="text-[#8a8375]">Location: </span>
                <span className="font-medium text-[#1E1E1E]">
                  {order.shippingAddress?.area || "—"}
                </span>
              </p>
              <p>
                <span className="text-[#8a8375]">County: </span>
                <span className="font-medium text-[#1E1E1E]">
                  {order.shippingAddress?.county || "—"}
                </span>
              </p>
              {order.shippingAddress?.landmark && (
                <p>
                  <span className="text-[#8a8375]">Landmark: </span>
                  <span className="font-medium text-[#1E1E1E]">
                    {order.shippingAddress.landmark}
                  </span>
                </p>
              )}
              {order.shippingAddress?.houseNumber && (
                <p>
                  <span className="text-[#8a8375]">House No: </span>
                  <span className="font-medium text-[#1E1E1E]">
                    {order.shippingAddress.houseNumber}
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* Cancel */}
          {canCancel && (
            <div className="flex justify-end">
              <button
                onClick={() => cancelOrder(order._id)}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs uppercase tracking-widest transition-colors"
              >
                Cancel Order
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default OrderCard;