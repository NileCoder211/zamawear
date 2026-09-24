import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { mapApiProductToCard } from "../lib/MapApiProductToCard";
import { useAddToCart } from "../queries/useCart";
import { useWishlist, useToggleLike } from "../queries/useWishlist";
import { useUserStore } from "../stores/useUserStore";

const PRODUCTS_API = "/api/products";
const PAGE_SIZE = 12;

function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") || "";
  const page = Number(searchParams.get("page")) || 1;

  const [products, setProducts] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const { user } = useUserStore();
  const addToCartMutation = useAddToCart();
  const toggleLikeMutation = useToggleLike();
  const { data: wishlist = [] } = useWishlist(!!user);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchResults() {
      // No query yet (e.g. someone navigated straight to /search) — skip
      // the request rather than asking the backend for an empty search.
      if (!q.trim()) {
        setProducts([]);
        setTotalPages(1);
        setTotalResults(0);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const params = new URLSearchParams({ q, page: String(page), limit: String(PAGE_SIZE) });

        const res = await fetch(`${PRODUCTS_API}/search?${params.toString()}`, {
          credentials: "include",
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();

        setProducts(data.products || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalResults(data.pagination?.total || 0);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Something went wrong");
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchResults();
    return () => controller.abort();
  }, [q, page]);

  const goToPage = (nextPage) => {
    setSearchParams({ q, page: String(nextPage) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Same shared mutations CategoryPage uses, so the Navbar's cart/wishlist
  // badges update correctly from here too.
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
          className="text-3xl text-center text-[#1E1E1E] mb-2"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          {q.trim() ? `Results for "${q}"` : "Search"}
        </h1>

        {q.trim() && !isLoading && !error && (
          <p className="text-center text-[12px] text-[#8a8375] mb-10">
            {totalResults} {totalResults === 1 ? "result" : "results"}
          </p>
        )}

        {error && <p className="text-center text-sm text-red-700 mb-6">{error}</p>}

        {!q.trim() ? (
          <p className="text-center text-[#8a8375] py-10">
            Type something into the search bar above to find products.
          </p>
        ) : isLoading ? (
          <p className="text-center text-[#8a8375] py-10">Searching...</p>
        ) : products.length === 0 ? (
          <p className="text-center text-[#8a8375] py-10">
            No products found for "{q}".
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

export default SearchResultsPage;