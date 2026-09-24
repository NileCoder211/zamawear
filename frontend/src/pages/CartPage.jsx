import { useState } from "react";
import { Link } from "react-router-dom";
import { Minus, Plus } from "lucide-react";
import { useCart, useUpdateQuantity, useRemoveFromCart } from "../queries/useCart";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import GiftCouponCard from "../components/GiftCouponCard";

function formatKES(amount) {
  return `KES ${Number(amount).toLocaleString("en-KE")}`;
}

// A cart line's thumbnail should reflect the color the customer
// actually picked, not just "whatever the product's first image is."
function cartItemImage(item) {
  if (item.color && Array.isArray(item.colors)) {
    const match = item.colors.find((c) => c.name === item.color);
    if (match?.images?.[0]?.url) return match.images[0].url;
  }

  return item.images?.[0]?.url || "";
}

function CartRow({ item, isUpdating, onQuantityChange, onRemove }) {
  return (
    <div
      className="flex gap-4 py-5 border-b border-[#E7DED1]"
      style={{
        opacity: isUpdating ? 0.6 : 1,
        transition: "opacity 0.2s ease",
      }}
    >
      <img
        src={cartItemImage(item)}
        alt={item.name}
        className="w-20 h-24 sm:w-24 sm:h-28 object-cover rounded-lg bg-[#E7DED1] flex-shrink-0"
      />

      <div className="flex-1 min-w-0">
        <div className="flex justify-between gap-3">
          <div>
            <p
              className="text-base sm:text-lg text-[#1E1E1E] font-semibold"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              {item.name}
            </p>

            {(item.color || item.size) && (
              <p className="text-xs text-[#8a8375] mt-0.5">
                {[item.color, item.size].filter(Boolean).join(" · ")}
              </p>
            )}

            <p className="text-sm text-[#8a8375] mt-1">
              {formatKES(item.price)} each
            </p>
          </div>

          <p className="text-sm sm:text-base font-medium text-[#1E1E1E] whitespace-nowrap">
            {formatKES(item.price * item.quantity)}
          </p>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center border border-[#E7DED1] rounded-lg">
            <button
              onClick={() =>
                onQuantityChange(item.cartItemId, item.quantity - 1)
              }
              disabled={isUpdating}
              aria-label="Decrease quantity"
              className="w-8 h-8 flex items-center justify-center text-[#1E1E1E] disabled:cursor-not-allowed"
            >
              <Minus size={14} />
            </button>

            <span className="w-6 text-center text-sm">
              {item.quantity}
            </span>

            <button
              onClick={() =>
                onQuantityChange(item.cartItemId, item.quantity + 1)
              }
              disabled={isUpdating}
              aria-label="Increase quantity"
              className="w-8 h-8 flex items-center justify-center text-[#1E1E1E] disabled:cursor-not-allowed"
            >
              <Plus size={14} />
            </button>
          </div>

          <button
            onClick={() => onRemove(item.cartItemId)}
            disabled={isUpdating}
            className="text-[13px] text-red-700 disabled:cursor-not-allowed"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CartPage() {
  const { data: cart = [], isLoading, error } = useCart();

  const updateQuantityMutation = useUpdateQuantity();
  const removeFromCartMutation = useRemoveFromCart();

  // Coupon state is now handled by GiftCouponCard.
  const [coupon, setCoupon] = useState(null);
  const [isCouponApplied, setIsCouponApplied] = useState(false);

  const [pendingIds, setPendingIds] = useState(new Set());

  const setPending = (id, isPending) => {
    setPendingIds((prev) => {
      const next = new Set(prev);

      if (isPending) {
        next.add(id);
      } else {
        next.delete(id);
      }

      return next;
    });
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const discount = isCouponApplied ? coupon?.discount || 0 : 0;

  const total = Math.max(0, subtotal - discount);

  const handleQuantityChange = (cartItemId, quantity) => {
    if (quantity < 0) return;

    setPending(cartItemId, true);

    updateQuantityMutation.mutate(
      { cartItemId, quantity },
      {
        onSettled: () => setPending(cartItemId, false),
      }
    );
  };

  const handleRemove = (cartItemId) => {
    setPending(cartItemId, true);

    removeFromCartMutation.mutate(cartItemId, {
      onSettled: () => setPending(cartItemId, false),
    });
  };

  return (
    <>
      <Navbar />

      <section className="max-w-4xl mx-auto px-5 md:px-10 py-14 md:py-20">
        <h1
          className="text-3xl text-center text-[#1E1E1E] mb-10"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          Your Bag
        </h1>

        {error && (
          <p className="text-center text-sm text-red-700 mb-6">
            Couldn't load your cart. Please try again.
          </p>
        )}

        {isLoading ? (
          <p className="text-center text-[#8a8375] py-16">
            Loading your bag...
          </p>
        ) : cart.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[#8a8375] mb-4">
              Your bag is empty.
            </p>

            <Link
              to="/"
              className="inline-block border border-[#1E1E1E] text-[#1E1E1E] px-8 py-3 text-[13px] tracking-[0.25em] uppercase hover:bg-[#1E1E1E] hover:text-white transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10">
            {/* Items */}
            <div>
              {cart.map((item) => (
                <CartRow
                  key={item.cartItemId}
                  item={item}
                  isUpdating={pendingIds.has(item.cartItemId)}
                  onQuantityChange={handleQuantityChange}
                  onRemove={handleRemove}
                />
              ))}
            </div>

            {/* Summary */}
            <div className="border border-[#E7DED1] rounded-2xl p-6 h-fit bg-white">
              <h2
                className="text-xl text-[#1E1E1E] mb-4"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                Order Summary
              </h2>

              {/* Gift Coupon Card */}
              <GiftCouponCard
                coupon={coupon}
                setCoupon={setCoupon}
                isCouponApplied={isCouponApplied}
                setIsCouponApplied={setIsCouponApplied}
                orderTotal={subtotal}
              />

              {/* Totals */}
              <div className="space-y-2 text-sm mt-6">
                <div className="flex justify-between text-[#5c564c]">
                  <span>Subtotal</span>
                  <span>{formatKES(subtotal)}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-[#C9A55C]">
                    <span>Discount</span>
                    <span>-{formatKES(discount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-base font-semibold text-[#1E1E1E] pt-2 border-t border-[#E7DED1]">
                  <span>Total</span>
                  <span>{formatKES(total)}</span>
                </div>
              </div>

              <Link
                to="/checkout"
                state={{
                  couponCode: isCouponApplied ? coupon?.code : undefined,
                }}
                className="mt-6 block text-center bg-[#1E1E1E] hover:bg-black text-white rounded-lg py-3 text-sm font-medium transition-colors"
              >
                Proceed to Checkout
              </Link>

              <p className="text-xs text-[#8a8375] text-center mt-3">
                Shipping details are collected on the next step.
              </p>
            </div>
          </div>
        )}
      </section>

      <Footer />
    </>
  );
}