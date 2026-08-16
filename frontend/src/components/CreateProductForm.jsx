import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { PlusCircle, Upload, Loader, X } from "lucide-react";
import { useCreateProduct } from "../queries/useProduct";
import { useCategories } from "../queries/useCategories";
import { useSubcategories } from "../queries/useSubcategories";

const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const CreateProductForm = () => {
  // Only fields the backend actually accepts live in newProduct —
  // subCategory is what gets submitted; category is derived
  // server-side from it, so it's never sent directly.
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    subCategory: "",
    images: [],
  });

  // Tracks which category is selected in the UI so we know which
  // subcategories to fetch/show — not part of the submitted payload.
  const [selectedCategorySlug, setSelectedCategorySlug] = useState("");

  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: subcategories, isLoading: subcategoriesLoading } =
    useSubcategories(selectedCategorySlug);

  const createProductMutation = useCreateProduct();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!newProduct.subCategory) {
      toast.error("Please select a category and subcategory");
      return;
    }

    createProductMutation.mutate(newProduct, {
      onSuccess: () => {
        setNewProduct({
          name: "",
          description: "",
          price: "",
          stock: "",
          subCategory: "",
          images: [],
        });
        setSelectedCategorySlug("");
      },
    });
  };

  const handleCategoryChange = (e) => {
    setSelectedCategorySlug(e.target.value);
    // Changing category invalidates whatever subcategory was picked
    // under the old one.
    setNewProduct((prev) => ({ ...prev, subCategory: "" }));
  };

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);

    if (newProduct.images.length + files.length > MAX_IMAGES) {
      toast.error(`Maximum ${MAX_IMAGES} images allowed`);
      e.target.value = "";
      return;
    }

    const validFiles = files.filter((file) => {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`"${file.name}" exceeds the 5MB size limit`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) {
      e.target.value = "";
      return;
    }

    const imagePromises = validFiles.map(
      (file) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
        })
    );

    try {
      const base64Images = await Promise.all(imagePromises);
      setNewProduct((prev) => ({
        ...prev,
        images: [...prev.images, ...base64Images],
      }));
    } catch (err) {
      console.error("Error reading image files:", err);
      toast.error("Failed to read one or more images. Please try again.");
    }

    e.target.value = "";
  };

  const handleRemoveImage = (indexToRemove) => {
    setNewProduct((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== indexToRemove),
    }));
  };

  return (
    <motion.div
      className="bg-gray-800 shadow-lg rounded-lg p-8 mb-8 max-w-xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <h2 className="text-2xl font-semibold mb-6 text-emerald-300">
        Create New Product
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Product Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-300">
            Product Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={newProduct.name}
            onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2
						 px-3 text-white focus:outline-none focus:ring-2
						focus:ring-emerald-500 focus:border-emerald-500"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-300">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={newProduct.description}
            onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
            rows="3"
            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm
						 py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 
						 focus:border-emerald-500"
            required
          />
        </div>

        {/* Price */}
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-300">
            Price
          </label>
          <input
            type="number"
            id="price"
            name="price"
            value={newProduct.price}
            onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
            step="0.01"
            min="0.01"
            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm 
						py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500
						 focus:border-emerald-500"
            required
          />
        </div>

        {/* Stock */}
        <div>
          <label htmlFor="stock" className="block text-sm font-medium text-gray-300">
            Stock Quantity
          </label>
          <input
            type="number"
            id="stock"
            name="stock"
            value={newProduct.stock}
            onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
            step="1"
            min="0"
            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm 
    py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500
     focus:border-emerald-500"
            required
          />
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-300">
            Category
          </label>
          <select
            id="category"
            name="category"
            value={selectedCategorySlug}
            onChange={handleCategoryChange}
            disabled={categoriesLoading}
            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md
						 shadow-sm py-2 px-3 text-white focus:outline-none 
						 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-50"
            required
          >
            <option value="">
              {categoriesLoading ? "Loading categories..." : "Select a category"}
            </option>
            {categories?.map((category) => (
              <option key={category._id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Subcategory — depends on the selected category */}
        <div>
          <label htmlFor="subCategory" className="block text-sm font-medium text-gray-300">
            Subcategory
          </label>
          <select
            id="subCategory"
            name="subCategory"
            value={newProduct.subCategory}
            onChange={(e) => setNewProduct({ ...newProduct, subCategory: e.target.value })}
            disabled={!selectedCategorySlug || subcategoriesLoading}
            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md
						 shadow-sm py-2 px-3 text-white focus:outline-none 
						 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-50"
            required
          >
            <option value="">
              {!selectedCategorySlug
                ? "Select a category first"
                : subcategoriesLoading
                ? "Loading subcategories..."
                : "Select a subcategory"}
            </option>
            {subcategories?.map((subcategory) => (
              <option key={subcategory._id} value={subcategory._id}>
                {subcategory.name}
              </option>
            ))}
          </select>
        </div>

        {/* Image Upload + Drag & Drop — single block, single input id */}
        <div className="mt-1">
          <input
            type="file"
            id="images"
            className="sr-only"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            disabled={newProduct.images.length >= MAX_IMAGES}
          />

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const files = Array.from(e.dataTransfer.files);
              handleImageChange({ target: { files } });
            }}
            className="mt-1 border-2 border-dashed border-gray-600 rounded-lg p-6 text-center bg-gray-800 hover:border-emerald-500 transition"
          >
            <label htmlFor="images" className="cursor-pointer block">
              <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-300">Drag & drop images here</p>
              <p className="text-xs text-gray-500 mt-1">
                or click to browse files (max {MAX_IMAGES})
              </p>
            </label>
          </div>

          {/* Image Previews */}
          {newProduct.images.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-3">
              {newProduct.images.map((img, index) => (
                <div key={index} className="relative group">
                  <img
                    src={img}
                    alt={`preview ${index + 1}`}
                    className="h-20 w-full object-cover rounded"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white 
            rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md 
					shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 
					focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
          disabled={createProductMutation.isPending}
        >
          {createProductMutation.isPending ? (
            <>
              <Loader className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
              Loading...
            </>
          ) : (
            <>
              <PlusCircle className="mr-2 h-5 w-5" />
              Create Product
            </>
          )}
        </button>
      </form>
    </motion.div>
  );
};

export default CreateProductForm;