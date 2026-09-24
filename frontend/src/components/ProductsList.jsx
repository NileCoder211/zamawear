import { motion } from "framer-motion";
import { Trash, Star, ToggleLeft, ToggleRight } from "lucide-react";
import { useAllProducts, useDeleteProduct, useToggleFeatured, useUpdateStock } from "../queries/useProduct";

const ProductsList = () => {
  const { data: products = [] } = useAllProducts();
  const deleteProductMutation = useDeleteProduct();
  const toggleFeaturedMutation = useToggleFeatured();
  const updateStockMutation = useUpdateStock();

  return (
    <motion.div
      className="bg-white border border-[#E7DED1] shadow-sm rounded-2xl overflow-hidden max-w-4xl mx-auto"
      style={{ fontFamily: "'Poppins', sans-serif" }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <table className="min-w-full divide-y divide-[#E7DED1]">
        <thead className="bg-[#F8F6F2]">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-[#8a8375] uppercase tracking-wider">
              Product
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-[#8a8375] uppercase tracking-wider">
              Price
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-[#8a8375] uppercase tracking-wider">
              Category
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-[#8a8375] uppercase tracking-wider">
              Featured
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-[#8a8375] uppercase tracking-wider">
              Stock
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-[#8a8375] uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>

        <tbody className="bg-white divide-y divide-[#E7DED1]">
          {products.map((product) => (
            <tr key={product._id} className="hover:bg-[#F8F6F2] transition-colors">
              {/* Product */}
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10">
                    <img
                      className="h-10 w-10 rounded-full object-cover bg-[#E7DED1]"
                      src={product.images?.[0]?.url}
                      alt={product.name}
                    />
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-[#1E1E1E]">
                      {product.name}
                    </div>
                  </div>
                </div>
              </td>

              {/* Price */}
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-[#1E1E1E]">
                  KES {product.price.toFixed(2)}
                </div>
              </td>

              {/* Category — populated as { name, slug } by getAllProducts,
                  so read .name rather than rendering the object directly. */}
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-[#1E1E1E]">
                  {product.category?.name || "—"}
                </div>
                {product.subCategory?.name && (
                  <div className="text-xs text-[#8a8375]">{product.subCategory.name}</div>
                )}
              </td>

              {/* Featured */}
              <td className="px-6 py-4 whitespace-nowrap">
                <button
                  onClick={() => toggleFeaturedMutation.mutate(product._id)}
                  disabled={toggleFeaturedMutation.isPending}
                  className={`p-1 rounded-full transition-colors duration-200 ${
                    product.isFeatured
                      ? "bg-[#C9A55C] text-white"
                      : "bg-[#E7DED1] text-[#8a8375]"
                  } hover:bg-[#b6924c]`}
                >
                  <Star className="h-5 w-5" />
                </button>
              </td>

              {/* Stock */}
              <td className="px-6 py-4 whitespace-nowrap">
                <button
                  onClick={() =>
                    updateStockMutation.mutate({
                      productId: product._id,
                      stock: product.stock === 0 ? 1 : 0,
                    })
                  }
                  disabled={updateStockMutation.isPending}
                  className="transition hover:scale-110"
                  title={product.stock === 0 ? "Set In Stock" : "Set Out of Stock"}
                >
                  {product.stock === 0 ? (
                    <ToggleLeft className="h-7 w-7 text-[#8a8375] hover:text-red-600 transition" />
                  ) : (
                    <ToggleRight className="h-7 w-7 text-emerald-600 hover:text-emerald-500 transition" />
                  )}
                </button>
              </td>

              {/* Delete */}
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button
                  onClick={() => deleteProductMutation.mutate(product._id)}
                  disabled={deleteProductMutation.isPending}
                  className="text-red-600 hover:text-red-500"
                >
                  <Trash className="h-5 w-5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  );
};

export default ProductsList;