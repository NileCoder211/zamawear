import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Trash2, Eye } from "lucide-react";
import { useAllOrders, useUpdateOrderStatus, useDeleteOrder } from "../queries/useOrder";

// "pending" is never a real orderStatus — an Order document only
// ever gets created inside mpesaCallback AFTER Safaricom confirms
// payment, so every order starts life as "processing". A failed or
// still-in-flight STK push lives in PendingOrder, not here.
const statusOptions = ["processing", "shipped", "delivered", "cancelled"];

const statusStyles = {
  processing: "bg-sky-100 text-sky-700",
  shipped: "bg-[#C9A55C]/20 text-[#8a6f2f]",
  delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};

const OrdersTab = () => {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useAllOrders({ page, status, search });
  const orders = data?.orders ?? [];
  const pagination = data?.pagination;

  const updateStatusMutation = useUpdateOrderStatus();
  const deleteOrderMutation = useDeleteOrder();

  return (
    <motion.div
      className="bg-white border border-[#E7DED1] rounded-2xl p-6 shadow-sm"
      style={{ fontFamily: "'Poppins', sans-serif" }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h2
          className="text-2xl text-[#1E1E1E]"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          Orders Management
        </h2>

        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search order number or phone..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1); // reset to page 1 on new search
              }}
              className="bg-[#F8F6F2] text-[#1E1E1E] placeholder:text-[#8a8375] rounded-lg pl-10 pr-4 py-2 border border-[#E7DED1] focus:outline-none focus:ring-2 focus:ring-[#C9A55C]"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-[#8a8375]" />
          </div>

          {/* Filter */}
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1); // reset to page 1 on filter change
            }}
            className="bg-[#F8F6F2] text-[#1E1E1E] rounded-lg px-4 py-2 border border-[#E7DED1] focus:outline-none focus:ring-2 focus:ring-[#C9A55C]"
          >
            <option value="">All Status</option>
            {statusOptions.map((s) => (
              <option key={s} value={s} className="capitalize">
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[#E7DED1]">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#8a8375] uppercase tracking-wide">Order</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#8a8375] uppercase tracking-wide">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#8a8375] uppercase tracking-wide">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#8a8375] uppercase tracking-wide">M-Pesa Payment</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#8a8375] uppercase tracking-wide">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-[#8a8375] uppercase tracking-wide">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#E7DED1]">
            {orders.length > 0 ? (
              orders.map((order) => (
                <tr key={order._id} className="hover:bg-[#F8F6F2] transition-colors">
                  {/* Order */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-[#1E1E1E]">
                      {order.orderNumber || `#${order._id.slice(-6)}`}
                    </div>
                    <div className="text-xs text-[#8a8375]">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                  </td>

                  {/* Customer */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-[#1E1E1E]">
                      {order.user?.name || "Unknown"}
                    </div>
                    <div className="text-xs text-[#8a8375]">{order.user?.email}</div>
                  </td>

                  {/* Amount */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#1E1E1E] font-semibold">
                    KES {order.totalAmount?.toLocaleString()}
                  </td>

                  {/* M-Pesa payment details */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-[#1E1E1E]">
                      {order.phoneNumber || "—"}
                    </div>
                    <div className="text-xs text-[#8a8375]">
                      Receipt:{" "}
                      <span className="font-medium text-[#1E1E1E]">
                        {order.mpesaReceiptNumber || "—"}
                      </span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={order.orderStatus}
                      disabled={updateStatusMutation.isPending}
                      onChange={(e) =>
                        updateStatusMutation.mutate({
                          orderId: order._id,
                          orderStatus: e.target.value,
                        })
                      }
                      className={`px-3 py-1 rounded-full text-sm border-none outline-none capitalize ${
                        statusStyles[order.orderStatus] || "bg-[#E7DED1] text-[#1E1E1E]"
                      }`}
                    >
                      {statusOptions.map((s) => (
                        <option key={s} value={s} className="bg-white text-[#1E1E1E]">
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 rounded-lg bg-sky-100 text-sky-700 hover:bg-sky-200">
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => deleteOrderMutation.mutate(order._id)}
                        disabled={deleteOrderMutation.isPending}
                        className="p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="text-center py-10 text-[#8a8375]">
                  {isLoading ? "Loading orders..." : "No orders found"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={() => setPage((p) => Math.max(p - 1, 1))}
          disabled={page === 1}
          className="px-4 py-2 bg-[#F8F6F2] hover:bg-[#E7DED1] border border-[#E7DED1] rounded-lg text-[#1E1E1E] disabled:opacity-50"
        >
          Previous
        </button>

        <span className="text-[#8a8375] text-sm">
          Page {page} {pagination?.totalPages ? `of ${pagination.totalPages}` : ""}
        </span>

        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={pagination ? page >= pagination.totalPages : false}
          className="px-4 py-2 bg-[#1E1E1E] hover:bg-[#000000] rounded-lg text-white disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </motion.div>
  );
};

export default OrdersTab;