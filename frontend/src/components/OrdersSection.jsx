import { useState } from "react";
import { Package } from "lucide-react";
import { STATUS_CONFIG } from "../lib/statusConfig";
import OrderCard from "./OrderCard";

const OrdersSection = ({ orders, loading, cancelOrder })=> {
  const [filter, setFilter] = useState("all");

  const statuses = ["all", "processing", "shipped", "delivered", "cancelled"];

  const filtered = filter === "all" ? orders : orders.filter((o) => o.orderStatus === filter);

  return (
    <div className="space-y-6">
      <div>
        <h2
          className="text-3xl text-[#1E1E1E] mb-1"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          My Orders
        </h2>
        <p className="text-sm text-[#8a8375]">{orders.length} total orders</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-full text-xs uppercase tracking-widest transition-all ${
              filter === s
                ? "bg-[#1E1E1E] text-white"
                : "bg-white border border-[#E7DED1] text-[#8a8375] hover:border-[#C9A55C]"
            }`}
          >
            {s === "all" ? "All" : STATUS_CONFIG[s]?.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-[#E7DED1]/40 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white border border-[#E7DED1] rounded-xl">
          <Package size={40} className="mx-auto text-[#c9c3b6] mb-4" />
          <p className="text-sm text-[#8a8375]">No orders found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((order) => (
            <OrderCard key={order._id} order={order} cancelOrder={cancelOrder} />
          ))}
        </div>
      )}
    </div>
  );
}

export default OrdersSection;