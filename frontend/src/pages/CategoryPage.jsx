import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { mapApiProductToCard } from "../lib/MapApiProductToCard";
import { useAddToCart } from "../queries/useCart";
import { useWishlist, useToggleLike } from "../queries/useWishlist";
import { useUserStore } from "../stores/useUserStore";

const PRODUCTS_API = "/api/products";
const PAGE_SIZE = 12;

function CategoryPage() {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeSub = searchParams.get("sub") || "all";
  const page = Number(searchParams.get("page")) || 1;

  const [categoryName, setCategoryName] = useState("");
  const [subcategories, setSubcategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const { user } = useUserStore();
  const addToCartMutation = useAddToCart();
  const toggleLikeMutation = useToggleLike();
  const { data: wishlist = [] } = useWishlist(!!user);

  // Subcategory pills only need to load once per category — they
  // don't depend on the page or which subcategory is selected.
  useEffect(() => {
    const controller = new AbortController();

    async function fetchSubcategories() {
      try {
        const res = await fetch(`${PRODUCTS_API}/category/${slug}/subcategories`, {
          credentials: "include",
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = await res.json();
        setSubcategories(data.subcategories || []);
      } catch (err) {
        if (err.name !== "AbortError") {
          // silently ignore — filter pills are a nice-to-have
        }
      }
    }

    fetchSubcategories();
    return () => controller.abort();
  }, [slug]);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchProducts() {
      try {
        setIsLoading(true);
        setError(null);

        const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
        if (activeSub !== "all") params.set("subcategory", activeSub);

        const res = await fetch(`${PRODUCTS_API}/category/${slug}?${params.toString()}`, {
          credentials: "include",
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Failed to load products");
        const data = await res.json();

        setCategoryName(data.category?.name || slug);
        setProducts(data.products || []);
        setTotalPages(data.totalPages || 1);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Something went wrong");
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchProducts();
    return () => controller.abort();
  }, [slug, activeSub, page]);

  const setSub = (subSlug) => {
    const next = {};
    if (subSlug !== "all") next.sub = subSlug;
    setSearchParams(next); // dropping page resets to 1
  };

  const goToPage = (nextPage) => {
    const next = { page: String(nextPage) };
    if (activeSub !== "all") next.sub = activeSub;
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Both now go through the shared mutations from queries/useCart.js
  // and queries/useWishlist.js — which invalidate ["cart"]/["wishlist"]
  // on success, so the Navbar's badges actually update. The previous
  // version's handleAddToBag used a raw fetch() with no cache
  // invalidation at all, so the cart badge never refreshed.
  const handleAddToBag = (productId, colorName, size) => {
    addToCartMutation.mutate({ productId, color: colorName, size });
  };

  const handleBuyNow = (productId, colorName, size) => {
    addToCartMutation.mutate(
      { productId, color: colorName, size },
      { onSuccess: () => { window.location.href = "/cart"; } }
    );
  };

  const handleToggleWishlist = (productId) => {
    const product = products.find((p) => p._id === productId);
    if (product) toggleLikeMutation.mutate(product);
  };

  return (
    <>
      <Navbar />
      <section className="max-w-7xl mx-auto px-5 md:px-10 py-14 md:py-20">
        <h1
          className="text-3xl text-center text-[#1E1E1E] mb-6"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          {categoryName}
      </h1>

      {subcategories.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          <button
            onClick={() => setSub("all")}
            className={`text-[11px] tracking-[0.15em] uppercase px-4 py-2 border rounded-full transition-colors ${
              activeSub === "all"
                ? "bg-[#1E1E1E] text-white border-[#1E1E1E]"
                : "border-[#E7DED1] text-[#1E1E1E]/70 hover:border-[#C9A55C]"
            }`}
          >
            All
          </button>
          {subcategories.map((sub) => (
            <button
              key={sub.slug}
              onClick={() => setSub(sub.slug)}
              className={`text-[11px] tracking-[0.15em] uppercase px-4 py-2 border rounded-full transition-colors ${
                activeSub === sub.slug
                  ? "bg-[#1E1E1E] text-white border-[#1E1E1E]"
                  : "border-[#E7DED1] text-[#1E1E1E]/70 hover:border-[#C9A55C]"
              }`}
            >
              {sub.name}
            </button>
          ))}
        </div>
      )}

      {error && <p className="text-center text-sm text-red-700 mb-6">{error}</p>}

      {isLoading ? (
        <p className="text-center text-[#8a8375] py-10">Loading products...</p>
      ) : products.length === 0 ? (
        <p className="text-center text-[#8a8375] py-10">
          No products found in this category yet.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 items-start justify-items-center">
  {products.map((product) => (
    <ProductCard
      key={product._id}
      product={mapApiProductToCard(product)}
      isWishlisted={wishlist.some((p) => p._id === product._id)}
      onAddToBag={handleAddToBag}
      onBuyNow={handleBuyNow}
      onToggleWishlist={handleToggleWishlist}
    />
  ))}
</div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-12">
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page === 1}
                className="text-[11px] tracking-[0.1em] uppercase px-3 py-2 border border-[#E7DED1] rounded-full disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#C9A55C]"
              >
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => goToPage(p)}
                  className={`w-8 h-8 text-[12px] rounded-full transition-colors ${
                    p === page
                      ? "bg-[#1E1E1E] text-white"
                      : "text-[#1E1E1E]/70 hover:bg-[#E7DED1]/50"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => goToPage(page + 1)}
                disabled={page === totalPages}
                className="text-[11px] tracking-[0.1em] uppercase px-3 py-2 border border-[#E7DED1] rounded-full disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#C9A55C]"
              >
                Next
              </button>
            </div>
          )}

          </>
        )}
    </section>
    <Footer />
    </>
  );
}

export default CategoryPage;