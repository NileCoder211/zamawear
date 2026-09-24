/**
 * WhatsAppButton.jsx
 *
 * Creates a server-side WhatsApp order first,
 * then opens WhatsApp with the generated order number.
 *
 * Props:
 *   product         { id, name, price, image? } required
 *   selectedColor   string                         optional
 *   selectedSize    string                         optional
 *   quantity        number (default 1)
 *   variant         "full" | "icon" (default "full")
 */

const BUSINESS_PHONE =
  import.meta.env.VITE_WHATSAPP_PHONE ||
  "15551536972";

export default function WhatsAppButton({
  product,
  selectedColor = "",
  selectedSize = "",
  quantity = 1,
  variant = "full",
}) {
  const handleClick = async (e) => {
    e.stopPropagation();

    /*
     * Open the tab synchronously, while we still have
     * the trusted user-click gesture. Some browsers
     * (Safari especially) block window.open() if it's
     * called after an awaited fetch, since the click
     * gesture context can expire by then. We set this
     * tab's destination once the order is created.
     */
    const whatsappTab = window.open("", "_blank");

    try {
      /*
       * IMPORTANT:
       *
       * We do NOT trust product.price from the
       * frontend for the actual order.
       *
       * The backend receives product.id and gets
       * the current product/price from MongoDB.
       */
      const response = await fetch(
        "/api/whatsapp/orders",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            productId: product.id,
            quantity,
            selectedColor,
            selectedSize,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to create WhatsApp order."
        );
      }

      /*
       * The backend has now created the order.
       *
       * Example:
       * WA-20260920-A1B2C3
       */
      const line =
        `*${product.name}*` +
        (selectedColor
          ? ` (${selectedColor})`
          : "") +
        (selectedSize
          ? ` [${selectedSize}]`
          : "") +
        ` ×${quantity}`;

      const message =
        `Hi! I'd like to order:\n\n` +
        `🛋️ ${line}\n\n` +
        `🧾 Order: *#${data.orderNumber}*\n\n` +
        `Please confirm availability and delivery.\n\n` +
        `⚠️ No payment has been made yet.\n\n` +
        `Thank you! 🙏`;

      const encodedMessage =
        encodeURIComponent(message);

      /*
       * Redirect the already-open tab to WhatsApp.
       * Your existing BUSINESS_PHONE is preserved.
       */
      if (whatsappTab) {
        whatsappTab.location.href = `https://wa.me/${BUSINESS_PHONE}?text=${encodedMessage}`;
      }
    } catch (error) {
      if (whatsappTab) {
        whatsappTab.close();
      }

      console.error(
        "WhatsApp order error:",
        error
      );

      alert(
        error.message ||
          "Unable to start WhatsApp order. Please try again."
      );
    }
  };

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={handleClick}
        title="Order via WhatsApp"
        className="p-2.5 rounded-full bg-green-500 hover:bg-green-600 active:scale-90
                   text-white shadow-md transition-all duration-150"
      >
        <WaIcon size={18} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex items-center justify-center gap-2.5 w-full
                 bg-green-500 hover:bg-green-600 active:bg-green-700
                 text-white font-semibold text-sm px-5 py-3 rounded-xl
                 shadow-md hover:shadow-green-200 hover:shadow-lg
                 transition-all duration-150 active:scale-95"
    >
      <WaIcon size={20} />
      Order via WhatsApp
    </button>
  );
}

function WaIcon({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.371.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}