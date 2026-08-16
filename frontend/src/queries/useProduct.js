import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "../lib/axios";
import toast from "react-hot-toast";

// ── Fetch all products ────────────────────────────────────────────────────────
export const useAllProducts = () => {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await axios.get("/products");
      return res.data.products;
    },
  });
};

// ── Fetch products by category ────────────────────────────────────────────────
export const useProductsByCategory = (categorySlug) => {
  return useQuery({
    queryKey: ["products", "category", categorySlug],
    queryFn: async () => {
      const res = await axios.get(`/products/category/${categorySlug}`);
      return res.data.products;
    },
    enabled: !!categorySlug,
  });
};

// ── Fetch featured products ───────────────────────────────────────────────────
export const useFeaturedProducts = () => {
  return useQuery({
    queryKey: ["products", "featured"],
    queryFn: async () => {
      const res = await axios.get("/products/featured");
      return res.data;
    },
  });
};

// ── Fetch out of stock products ───────────────────────────────────────────────
export const useOutOfStockProducts = () => {
  return useQuery({
    queryKey: ["products", "out-of-stock"],
    queryFn: async () => {
      const res = await axios.get("/products/out-of-stock");
      return res.data;
    },
  });
};

// ── Create product ────────────────────────────────────────────────────────────
export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productData) => {
      const res = await axios.post("/products", productData);
      return res.data;
    },

    onSuccess: (newProduct) => {
      queryClient.setQueryData(["products"], (old = []) => [
        ...old,
        newProduct,
      ]);
      toast.success("Product created successfully");
    },

    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to create product"
      );
    },
  });
};

// ── Update product (full edit) ────────────────────────────────────────────────
export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    // productId + whichever fields changed: name, description, price,
    // stock, subCategory, sizes, colors, brand, newImages,
    // removeImagePublicIds — see the updateProduct controller for
    // the full accepted shape.
    mutationFn: async ({ productId, ...updates }) => {
      const res = await axios.put(`/products/${productId}`, updates);
      return res.data;
    },

    onSuccess: (updatedProduct) => {
      queryClient.setQueryData(["products"], (old = []) =>
        old.map((p) => (p._id === updatedProduct._id ? updatedProduct : p))
      );
      toast.success("Product updated successfully");
    },

    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to update product"
      );
    },
  });
};

// ── Delete product ────────────────────────────────────────────────────────────
export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId) => {
      await axios.delete(`/products/${productId}`);
      return productId;
    },

    onSuccess: (productId) => {
      queryClient.setQueryData(["products"], (old = []) =>
        old.filter((p) => p._id !== productId)
      );
      toast.success("Product deleted");
    },

    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to delete product"
      );
    },
  });
};

// ── Toggle featured ───────────────────────────────────────────────────────────
export const useToggleFeatured = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId) => {
      // Split out to its own sub-path — PATCH /:id is no longer a
      // valid endpoint on its own (PUT /:id now means "full edit").
      const res = await axios.patch(`/products/${productId}/toggle-featured`);
      return { productId, isFeatured: res.data.isFeatured };
    },

    onSuccess: ({ productId, isFeatured }) => {
      queryClient.setQueryData(["products"], (old = []) =>
        old.map((p) =>
          p._id === productId ? { ...p, isFeatured } : p
        )
      );
        toast.success(isFeatured ? "Product featured" : "Product unfeatured");
    },

    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to update product"
      );
    },
  });
};

// ── Update stock ──────────────────────────────────────────────────────────────
export const useUpdateStock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, stock }) => {
      const res = await axios.patch(`/products/${productId}/stock`, { stock });
      return { productId, stock: res.data.stock };
    },

    onSuccess: ({ productId, stock }) => {
      queryClient.setQueryData(["products"], (old = []) =>
        old.map((p) =>
          p._id === productId ? { ...p, stock } : p
        )
      );
      toast.success("Stock updated successfully");
    },

    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to update stock"
      );
    },
  });
};