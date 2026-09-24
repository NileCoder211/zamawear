import { Package, Wrench, CheckCircle, X } from "lucide-react";

// "pending" is intentionally absent — an Order document only ever
// gets created AFTER M-Pesa payment succeeds (see mpesaCallback), so
// it always starts life as "processing". A still-in-flight or
// failed payment lives in PendingOrder, never becomes an Order.
export const STATUS_CONFIG = {
  processing: {
    label: "Processing",
    icon: Wrench,
    dot: "bg-sky-500",
    badge: "bg-sky-50 text-sky-700 border border-sky-200",
  },
  shipped: {
    label: "Shipped",
    icon: Package,
    dot: "bg-[#C9A55C]",
    badge: "bg-[#C9A55C]/10 text-[#8a6f2f] border border-[#C9A55C]/30",
  },
  delivered: {
    label: "Delivered",
    icon: CheckCircle,
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  },
  cancelled: {
    label: "Cancelled",
    icon: X,
    dot: "bg-red-500",
    badge: "bg-red-50 text-red-700 border border-red-200",
  },
};