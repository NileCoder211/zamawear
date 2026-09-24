import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "./ProductCard";
import { mapApiProductToCard } from "../lib/MapApiProductToCard";
import { useAddToCart } from "../queries/useCart";
import { useWishlist, useToggleLike } from "../queries/useWishlist";
import { useUserStore } from "../stores/useUserStore";

const FeaturedProducts = ({ featuredProducts = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(4);

  const { user } = useUserStore();
  const addToCartMutation = useAddToCart();
  const toggleLikeMutation = useToggleLike();
  // Fetched once here (not per-card) so checking "is this product
  // liked" is just an array lookup, not a hook call inside a loop.
  const { data: wishlist = [] } = useWishlist(!!user);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) setItemsPerPage(1);
      else if (window.innerWidth < 1024) setItemsPerPage(2);
      else if (window.innerWidth < 1280) setItemsPerPage(3);
      else setItemsPerPage(4);
    };

    handleResize();

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => {
      const nextIndex = prevIndex + itemsPerPage;
      const maxIndex = Math.max(featuredProducts.length - itemsPerPage, 0);

      return Math.min(nextIndex, maxIndex);
    });
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => {
      return Math.max(prevIndex - itemsPerPage, 0);
    });
  };

  const isStartDisabled = currentIndex === 0;

  const isEndDisabled =
    featuredProducts.length <= itemsPerPage ||
    currentIndex >= featuredProducts.length - itemsPerPage;

  const handleAddToBag = (productId, colorName, size) => {
    addToCartMutation.mutate({ productId, color: colorName, size });
  };

  const handleToggleWishlist = (productId) => {
    const product = featuredProducts.find((p) => p._id === productId);
    if (product) toggleLikeMutation.mutate(product);
  };

  return (
    <div className="py-12">
      <div className="container mx-auto px-4">
        <h2 className="text-center text-5xl sm:text-6xl font-bold text-black mb-10">
          Featured Products
        </h2>

        <div className="relative">
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-300 ease-in-out"
              style={{
                transform: `translateX(-${
                  currentIndex * (100 / itemsPerPage)
                }%)`,
              }}
            >
              {featuredProducts.map((product) => (
                <div
                  key={product._id}
                  className="w-full sm:w-1/2 lg:w-1/3 xl:w-1/4 shrink-0 px-2"
                >
                  <ProductCard
                    product={mapApiProductToCard(product)}
                    isWishlisted={wishlist.some((p) => p._id === product._id)}
                    onAddToBag={handleAddToBag}
                    onToggleWishlist={handleToggleWishlist}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Prev */}
          <button
            onClick={prevSlide}
            disabled={isStartDisabled}
            className={`absolute top-1/2 -left-4 transform -translate-y-1/2 p-2 rounded-full transition ${
              isStartDisabled
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-black text-white hover:bg-gray-800"
            }`}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Next */}
          <button
            onClick={nextSlide}
            disabled={isEndDisabled}
            className={`absolute top-1/2 -right-4 transform -translate-y-1/2 p-2 rounded-full transition ${
              isEndDisabled
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-black text-white hover:bg-gray-800"
            }`}
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeaturedProducts;