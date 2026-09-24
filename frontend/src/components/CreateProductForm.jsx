import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { PlusCircle, Upload, Loader, X, Plus } from "lucide-react";
import { useCreateProduct } from "../queries/useProduct";
import { useCategories } from "../queries/useCategories";
import { useSubcategories } from "../queries/useSubCategories";

const MAX_IMAGES_PER_COLOR = 10;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const inputClasses =
  "mt-1 block w-full bg-white border border-[#B9A58E]/40 rounded-md shadow-sm py-2 px-3 " +
  "text-[#1E1E1E] placeholder:text-[#1E1E1E]/30 focus:outline-none focus:ring-2 " +
  "focus:ring-[#C9A55C]/30 focus:border-[#C9A55C] disabled:opacity-50 disabled:cursor-not-allowed";

const labelClasses = "block text-sm font-medium text-[#1E1E1E]/80";

let nextColorId = 1;
// Sizes now live on the color group itself: a white polka dress and a red
// polka dress are the same product but can legitimately carry different
// size runs, so size selection has to happen at the same scope as the
// color/image selection, not once for the whole product.
const makeColorGroup = () => ({
  id: nextColorId++,
  name: "",
  hex: "#1E1E1E",
  images: [],
  sizes: [],
  sizeInput: "",
});

// Reads a batch of files into base64, enforcing the per-color image
// cap and per-file size limit. Shared by both the color-scoped
// uploader and the colorless fallback uploader below.
async function readImageFiles(files, currentCount, cap) {
  if (currentCount + files.length > cap) {
    toast.error(`Maximum ${cap} images allowed per color`);
    return null;
  }

  const validFiles = files.filter((file) => {
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`"${file.name}" exceeds the 5MB size limit`);
      return false;
    }
    return true;
  });

  if (validFiles.length === 0) return null;

  try {
    return await Promise.all(
      validFiles.map(
        (file) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
          })
      )
    );
  } catch (err) {
    console.error("Error reading image files:", err);
    toast.error("Failed to read one or more images. Please try again.");
    return null;
  }
}

const CreateProductForm = () => {
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    subCategory: "",
  });

  const [selectedCategorySlug, setSelectedCategorySlug] = useState("");

  // Colors ARE the image (and now size) storage for products that have
  // variants — each group holds its own gallery and its own size run.
  // Products with no color variants (e.g. Body Lotions & Creams) use
  // fallbackImages / fallbackSizes instead.
  const [colorGroups, setColorGroups] = useState([makeColorGroup()]);
  const [fallbackImages, setFallbackImages] = useState([]);
  const [fallbackSizes, setFallbackSizes] = useState([]);
  const [fallbackSizeInput, setFallbackSizeInput] = useState("");
  const [useColors, setUseColors] = useState(true);

  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: subcategories, isLoading: subcategoriesLoading } =
    useSubcategories(selectedCategorySlug);

  const createProductMutation = useCreateProduct();

  const resetForm = () => {
    setNewProduct({ name: "", description: "", price: "", stock: "", subCategory: "" });
    setSelectedCategorySlug("");
    setColorGroups([makeColorGroup()]);
    setFallbackImages([]);
    setFallbackSizes([]);
    setFallbackSizeInput("");
    setUseColors(true);
  };

  const handleCategoryChange = (e) => {
    setSelectedCategorySlug(e.target.value);
    setNewProduct((prev) => ({ ...prev, subCategory: "" }));
  };

  // ── Fallback sizes (tag input, only used when the product has no colors) ──
  const addFallbackSize = () => {
    const value = fallbackSizeInput.trim();
    if (!value) return;
    if (fallbackSizes.some((s) => s.toLowerCase() === value.toLowerCase())) {
      setFallbackSizeInput("");
      return;
    }
    setFallbackSizes((prev) => [...prev, value]);
    setFallbackSizeInput("");
  };

  const handleFallbackSizeKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addFallbackSize();
    }
  };

  const removeFallbackSize = (value) => {
    setFallbackSizes((prev) => prev.filter((s) => s !== value));
  };

  // ── Color groups ─────────────────────────────────────────────────────────
  const addColorGroup = () => {
    setColorGroups((prev) => [...prev, makeColorGroup()]);
  };

  const removeColorGroup = (id) => {
    setColorGroups((prev) => (prev.length > 1 ? prev.filter((c) => c.id !== id) : prev));
  };

  const updateColorField = (id, field, value) => {
    setColorGroups((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const handleColorImageChange = async (id, e) => {
    const files = Array.from(e.target.files);
    const group = colorGroups.find((c) => c.id === id);
    const result = await readImageFiles(files, group.images.length, MAX_IMAGES_PER_COLOR);
    e.target.value = "";
    if (!result) return;

    setColorGroups((prev) =>
      prev.map((c) => (c.id === id ? { ...c, images: [...c.images, ...result] } : c))
    );
  };

  const removeColorImage = (id, indexToRemove) => {
    setColorGroups((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, images: c.images.filter((_, i) => i !== indexToRemove) }
          : c
      )
    );
  };

  // ── Per-color sizes (tag input scoped to a single color group) ────────────
  const addColorSize = (id) => {
    setColorGroups((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const value = c.sizeInput.trim();
        if (!value) return c;
        if (c.sizes.some((s) => s.toLowerCase() === value.toLowerCase())) {
          return { ...c, sizeInput: "" };
        }
        return { ...c, sizes: [...c.sizes, value], sizeInput: "" };
      })
    );
  };

  const handleColorSizeKeyDown = (id, e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addColorSize(id);
    }
  };

  const removeColorSize = (id, value) => {
    setColorGroups((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, sizes: c.sizes.filter((s) => s !== value) } : c
      )
    );
  };

  // ── Fallback (colorless) images ─────────────────────────────────────────────
  const handleFallbackImageChange = async (e) => {
    const files = Array.from(e.target.files);
    const result = await readImageFiles(files, fallbackImages.length, MAX_IMAGES_PER_COLOR);
    e.target.value = "";
    if (!result) return;
    setFallbackImages((prev) => [...prev, ...result]);
  };

  const removeFallbackImage = (indexToRemove) => {
    setFallbackImages((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!newProduct.subCategory) {
      toast.error("Please select a category and subcategory");
      return;
    }

    let payload = { ...newProduct };

    if (useColors) {
      const cleanedColors = colorGroups
        .map((c) => ({
          name: c.name.trim(),
          hex: c.hex,
          images: c.images,
          sizes: c.sizes,
        }))
        .filter((c) => c.name && c.images.length > 0);

      if (cleanedColors.length === 0) {
        toast.error("Add at least one color with a name and at least one image");
        return;
      }
      payload.colors = cleanedColors;
    } else {
      if (fallbackImages.length === 0) {
        toast.error("Add at least one image");
        return;
      }
      payload.images = fallbackImages;
      payload.sizes = fallbackSizes;
    }

    createProductMutation.mutate(payload, {
      onSuccess: resetForm,
    });
  };

  return (
    <motion.div
      className="bg-[#F8F6F2] shadow-sm ring-1 ring-[#B9A58E]/20 rounded-lg p-8 mb-8 max-w-xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <h2 className="text-2xl font-heading text-[#1E1E1E] mb-6">
        Create New Product
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Product Name */}
        <div>
          <label htmlFor="name" className={labelClasses}>
            Product Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={newProduct.name}
            onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
            className={inputClasses}
            required
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className={labelClasses}>
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={newProduct.description}
            onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
            rows="3"
            className={inputClasses}
            required
          />
        </div>

        {/* Price */}
        <div>
          <label htmlFor="price" className={labelClasses}>
            Price (KES)
          </label>
          <input
            type="number"
            id="price"
            name="price"
            value={newProduct.price}
            onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
            step="0.01"
            min="0.01"
            className={inputClasses}
            required
          />
        </div>

        {/* Stock */}
        <div>
          <label htmlFor="stock" className={labelClasses}>
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
            className={inputClasses}
            required
          />
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className={labelClasses}>
            Category
          </label>
          <select
            id="category"
            name="category"
            value={selectedCategorySlug}
            onChange={handleCategoryChange}
            disabled={categoriesLoading}
            className={inputClasses}
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

        {/* Subcategory */}
        <div>
          <label htmlFor="subCategory" className={labelClasses}>
            Subcategory
          </label>
          <select
            id="subCategory"
            name="subCategory"
            value={newProduct.subCategory}
            onChange={(e) => setNewProduct({ ...newProduct, subCategory: e.target.value })}
            disabled={!selectedCategorySlug || subcategoriesLoading}
            className={inputClasses}
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

        {/* Colors toggle */}
        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="useColors"
            checked={useColors}
            onChange={(e) => setUseColors(e.target.checked)}
            className="h-4 w-4 accent-[#C9A55C]"
          />
          <label htmlFor="useColors" className="text-sm text-[#1E1E1E]/80">
            This product has color variants (uncheck for items like creams with
            just one shared image set)
          </label>
        </div>

        {useColors ? (
          <div className="space-y-4">
            {colorGroups.map((color) => (
              <div
                key={color.id}
                className="border border-[#B9A58E]/30 rounded-lg p-4 bg-white space-y-3"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={color.name}
                    onChange={(e) => updateColorField(color.id, "name", e.target.value)}
                    placeholder={`Color name (e.g. Black)`}
                    className={inputClasses + " flex-1 mt-0"}
                  />
                  <input
                    type="color"
                    value={color.hex}
                    onChange={(e) => updateColorField(color.id, "hex", e.target.value)}
                    className="h-9 w-12 rounded border border-[#B9A58E]/40 cursor-pointer"
                    title="Swatch color"
                  />
                  {colorGroups.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeColorGroup(color.id)}
                      className="text-[#1E1E1E]/50 hover:text-red-600"
                      title="Remove this color"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Per-color sizes — this color's own size run */}
                <div>
                  <label className={labelClasses}>
                    Sizes for this color{" "}
                    <span className="text-[#1E1E1E]/40 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={color.sizeInput}
                    onChange={(e) => updateColorField(color.id, "sizeInput", e.target.value)}
                    onKeyDown={(e) => handleColorSizeKeyDown(color.id, e)}
                    onBlur={() => addColorSize(color.id)}
                    placeholder="Type a size and press Enter (e.g. S, M, L)"
                    className={inputClasses}
                  />
                  {color.sizes.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {color.sizes.map((size) => (
                        <span
                          key={size}
                          className="flex items-center gap-1 bg-[#F8F6F2] border border-[#B9A58E]/40 rounded-full px-3 py-1 text-xs text-[#1E1E1E]"
                        >
                          {size}
                          <button
                            type="button"
                            onClick={() => removeColorSize(color.id, size)}
                            className="text-[#1E1E1E]/50 hover:text-[#1E1E1E]"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Per-color image upload */}
                <div>
                  <input
                    type="file"
                    id={`color-images-${color.id}`}
                    className="sr-only"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleColorImageChange(color.id, e)}
                    disabled={color.images.length >= MAX_IMAGES_PER_COLOR}
                  />
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const files = Array.from(e.dataTransfer.files);
                      handleColorImageChange(color.id, { target: { files, value: "" } });
                    }}
                    className="border-2 border-dashed border-[#B9A58E]/50 rounded-lg p-4 text-center hover:border-[#C9A55C] transition"
                  >
                    <label htmlFor={`color-images-${color.id}`} className="cursor-pointer block">
                      <Upload className="h-6 w-6 mx-auto text-[#B9A58E] mb-1" />
                      <p className="text-xs text-[#1E1E1E]/70">
                        Drag & drop images for this color, or click to browse
                        (max {MAX_IMAGES_PER_COLOR})
                      </p>
                    </label>
                  </div>

                  {color.images.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      {color.images.map((img, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={img}
                            alt={`${color.name || "color"} preview ${index + 1}`}
                            className="h-20 w-full object-cover rounded border border-[#B9A58E]/30"
                          />
                          <button
                            type="button"
                            onClick={() => removeColorImage(color.id, index)}
                            className="absolute top-1 right-1 bg-[#1E1E1E]/80 hover:bg-[#1E1E1E] text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addColorGroup}
              className="flex items-center gap-2 text-sm text-[#C9A55C] hover:text-[#b8944e] font-medium"
            >
              <Plus className="h-4 w-4" />
              Add another color
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Fallback sizes — only relevant when there's a single shared set,
                e.g. a lotion that still comes in 100ml/200ml sizes */}
            <div>
              <label htmlFor="fallback-sizes" className={labelClasses}>
                Sizes <span className="text-[#1E1E1E]/40 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                id="fallback-sizes"
                value={fallbackSizeInput}
                onChange={(e) => setFallbackSizeInput(e.target.value)}
                onKeyDown={handleFallbackSizeKeyDown}
                onBlur={addFallbackSize}
                placeholder="Type a size and press Enter (e.g. 100ml, 200ml)"
                className={inputClasses}
              />
              {fallbackSizes.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {fallbackSizes.map((size) => (
                    <span
                      key={size}
                      className="flex items-center gap-1 bg-white border border-[#B9A58E]/40 rounded-full px-3 py-1 text-xs text-[#1E1E1E]"
                    >
                      {size}
                      <button
                        type="button"
                        onClick={() => removeFallbackSize(size)}
                        className="text-[#1E1E1E]/50 hover:text-[#1E1E1E]"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <input
                type="file"
                id="fallback-images"
                className="sr-only"
                accept="image/*"
                multiple
                onChange={handleFallbackImageChange}
                disabled={fallbackImages.length >= MAX_IMAGES_PER_COLOR}
              />
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const files = Array.from(e.dataTransfer.files);
                  handleFallbackImageChange({ target: { files, value: "" } });
                }}
                className="border-2 border-dashed border-[#B9A58E]/50 rounded-lg p-6 text-center bg-white hover:border-[#C9A55C] transition"
              >
                <label htmlFor="fallback-images" className="cursor-pointer block">
                  <Upload className="h-8 w-8 mx-auto text-[#B9A58E] mb-2" />
                  <p className="text-sm text-[#1E1E1E]/70">Drag & drop images here</p>
                  <p className="text-xs text-[#1E1E1E]/40 mt-1">
                    or click to browse files (max {MAX_IMAGES_PER_COLOR})
                  </p>
                </label>
              </div>

              {fallbackImages.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {fallbackImages.map((img, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={img}
                        alt={`preview ${index + 1}`}
                        className="h-20 w-full object-cover rounded border border-[#B9A58E]/30"
                      />
                      <button
                        type="button"
                        onClick={() => removeFallbackImage(index)}
                        className="absolute top-1 right-1 bg-[#1E1E1E]/80 hover:bg-[#1E1E1E] text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-md
					shadow-sm text-[13px] font-medium uppercase tracking-[0.15em] text-white bg-[#C9A55C] hover:bg-[#b8944e]
					focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C9A55C] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={createProductMutation.isPending}
        >
          {createProductMutation.isPending ? (
            <>
              <Loader className="h-4 w-4 animate-spin" aria-hidden="true" />
              Creating...
            </>
          ) : (
            <>
              <PlusCircle className="h-4 w-4" />
              Create Product
            </>
          )}
        </button>
      </form>
    </motion.div>
  );
};

export default CreateProductForm;
