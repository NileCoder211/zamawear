import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

export const useCart = ( enabled = true ) => {
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
    mutationFn: async (product) => {
      const cart = queryClient.getQueryData(["cart"]) ?? [];
      const existing = cart.find((item) => item._id === product._id);

      if (existing) {
        await axios.put(`/cart/${product._id}`, {
          quantity: existing.quantity + 1,
        });
        return { wasExisting: true };
      } else {
        await axios.post("/cart", { productId: product._id });
        return { wasExisting: false };
      }
    },

    onSuccess: ({ wasExisting }) => {
      toast.success(
        wasExisting ? "Quantity increased in cart" : "Product added to cart"
      );
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
    mutationFn: async (productId) => {
      // productId in the URL, no body — matches DELETE /cart/:id on
      // the backend. Bare DELETE /cart (no id) means "clear
      // everything" now, so this must NOT hit that path.
      await axios.delete(`/cart/${productId}`);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["cart"],
      });
    },

    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to remove item");
    },
  });
};

export const useUpdateQuantity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      quantity,
    }) => {
      const res = await axios.put(
        `/cart/${productId}`,
        {
          quantity,
        }
      );

      return res.data;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["cart"],
      });
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
      // Bare DELETE /cart — the "/clear" suffix no longer exists on
      // the backend; clearing and single-item removal are now
      // distinguished by presence/absence of :id, not by path.
      await axios.delete("/cart");
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["cart"],
      });

      toast.success("Cart cleared");
    },

    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to clear cart");
    },
  });
};