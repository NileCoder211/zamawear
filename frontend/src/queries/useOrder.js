import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "../lib/axios";
import toast from "react-hot-toast";

// ── Fetch user orders ─────────────────────────────────────────────────────────
export const useUserOrders = (enabled = true) => {
  return useQuery({
    queryKey: ["orders", "my-orders"],
    queryFn: async () => {
      const res = await axios.get("/orders/my-orders");
      return res.data.orders ?? [];
    },
    enabled,
  });
};

// ── Fetch all orders (admin) — response already includes .analytics ──────────
export const useAllOrders = ({ page = 1, status = "", search = "" } = {}) => {
  return useQuery({
    queryKey: ["orders", "all", page, status, search],
    queryFn: async () => {
      const query = new URLSearchParams({ page, status, search }).toString();
      const res = await axios.get(`/orders/all?${query}`);
      return res.data; // { orders, pagination, analytics }
    },
  });
};

// ── Fetch single order ────────────────────────────────────────────────────────
export const useSingleOrder = (orderId) => {
  return useQuery({
    queryKey: ["orders", orderId],
    queryFn: async () => {
      const res = await axios.get(`/orders/${orderId}`);
      return res.data.order;
    },
    enabled: !!orderId,
  });
};

// ── Update order status (admin) ───────────────────────────────────────────────
export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, orderStatus }) => {
      const res = await axios.patch(`/orders/${orderId}/status`, {
        orderStatus,
      });
      return res.data.order;
    },

    onSuccess: (updatedOrder) => {
      queryClient.setQueryData(
        ["orders", "all"],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            orders: old.orders?.map((o) =>
              o._id === updatedOrder._id ? updatedOrder : o
            ),
          };
        }
      );

      queryClient.setQueryData(
        ["orders", updatedOrder._id],
        updatedOrder
      );

      toast.success("Order updated successfully");
    },

    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to update order"
      );
    },
  });
};

// ── Cancel order (user) ───────────────────────────────────────────────────────
export const useCancelOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId) => {
      const res = await axios.patch(`/orders/${orderId}/cancel`);
      return { orderId, message: res.data.message };
    },

    onSuccess: ({ orderId, message }) => {
      queryClient.setQueryData(["orders", "my-orders"], (old = []) =>
        old.map((o) =>
          o._id.toString() === orderId.toString()
            ? { ...o, orderStatus: "cancelled" }
            : o
        )
      );
      toast.success(message || "Order cancelled");
    },

    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to cancel order"
      );
    },
  });
};

// ── Delete order (admin) ──────────────────────────────────────────────────────
export const useDeleteOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId) => {
      await axios.delete(`/orders/${orderId}`);
      return orderId;
    },

    onSuccess: (orderId) => {
      queryClient.setQueryData(
        ["orders", "all"],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            orders: old.orders?.filter((o) => o._id !== orderId),
          };
        }
      );
      toast.success("Order deleted");
    },

    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to delete order"
      );
    },
  });
};

// ── Create M-Pesa order (STK push) ────────────────────────────────────────────
export const useCreateMpesaOrder = () => {
  return useMutation({
    mutationFn: async (orderData) => {
      const res = await axios.post("/mpesa/stkpush", orderData);
      return res.data;
    },

    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to initiate M-Pesa payment"
      );
    },
  });
};