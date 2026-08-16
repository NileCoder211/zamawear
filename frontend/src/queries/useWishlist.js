import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import axios from "../lib/axios";

// ── Fetch wishlist ────────────────────────────────────────────────────────────
export const useWishlist = (enabled = true) => {          // ← no async
  return useQuery({
    queryKey: ["wishlist"],                                // ← string
    queryFn: async () => {
      const res = await axios.get("/wishlist");
      return res.data;
    },
    enabled,
  });
};

// ── Toggle like / unlike ──────────────────────────────────────────────────────
export const useToggleLike = () => {                      // ← no async
  const queryClient = useQueryClient();                   // ← fixed typo

  return useMutation({
    mutationFn: async (product) => {                      // ← product as argument
      const res = await axios.post(`/wishlist/${product._id}`); // ← fixed spelling
      return { liked: res.data.liked, product };
    },

    onSuccess: ({ liked, product }) => {
      queryClient.setQueryData(["wishlist"], (oldWishlist = []) => {
        if (liked) {
          return [...oldWishlist, product];
        } else {
          return oldWishlist.filter((p) => p._id !== product._id); // ← no curly braces
        }
      });

      toast.success(liked ? "Added to saved pieces" : "Removed from saved pieces");
    },

    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to update wishlist");
    },
  });
};

// ── Check if a product is liked ───────────────────────────────────────────────
export const useIsLiked = (productId, enabled = true) => {
  const { data: wishlist = [] } = useWishlist(enabled);
  return wishlist.some((p) => p._id === productId);       // ← no curly braces
};