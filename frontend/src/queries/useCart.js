import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

export const useCart = (enabled = true) => {
  return useQuery({
    queryKey: ["cart"],
    queryFn: async () => {
      const res = await axios.get("/cart");
      return res.data;
    },
    enabled, // only fetch when user is logged in
  });
};

export const useAddToCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    // productId is required; color/size are optional — pass whatever
    // the product page has selected (undefined for products with no
    // variants, e.g. creams). The backend decides whether this
    // matches an existing line (same productId+color+size) to
    // increment, or becomes a new line — that matching logic isn't
    // duplicated here, since color/size composite matching is easy
    // to get subtly wrong twice.
    mutationFn: async ({ productId, color, size }) => {
      const res = await axios.post("/cart", { productId, color, size });
      return res.data;
    },

    onSuccess: () => {
      toast.success("Added to bag");
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },

    onError: (error) => {
      toast.error(error.response?.data?.message || "Something went wrong");
    },
  });
};

export const useRemoveFromCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    // cartItemId is the cart LINE's own _id (from getCartProducts'
    // cartItemId field) — not productId. The same product can now
    // appear as more than one line (different color/size), so
    // productId alone can't say which one to remove.
    mutationFn: async (cartItemId) => {
      await axios.delete(`/cart/${cartItemId}`);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },

    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to remove item");
    },
  });
};

export const useUpdateQuantity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    // Same cartItemId-keyed approach as useRemoveFromCart.
    mutationFn: async ({ cartItemId, quantity }) => {
      const res = await axios.put(`/cart/${cartItemId}`, { quantity });
      return res.data;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },

    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update quantity");
    },
  });
};

export const useClearCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await axios.delete("/cart");
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Cart cleared");
    },

    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to clear cart");
    },
  });
};
