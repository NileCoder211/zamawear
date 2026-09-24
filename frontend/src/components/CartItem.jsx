import { X, Minus, Plus, Tag } from "lucide-react";
import {useCart, useUpdateQuantity, useRemoveFromCart} from "../queries/useCart";


function CartItem({ item }) {

  const {data: cart=[]} = useCart();
  const removeFromCartMutation = useRemoveFromCart();
  const updateQuantityMutation = useUpdateQuantity();

  const liveItem = cart.find((c) => c._id === item._id);
  const quantity = liveItem ? liveItem.quantity : item.quantity;

  const handleIncrease = () =>{
    updateQuantityMutation.mutate({
      productId: item._id,
      quantity: quantity + 1
    })
  }

  const handleDecrease = () =>{
    updateQuantityMutation.mutate({
      productId: item._id,
      quantity: quantity - 1
    })
  }

  const handleRemove = () =>{
    removeFromCartMutation.mutate(item._id);
  }

  return (
    <div
      style={{
        display: "flex",
        gap: "12px",
        padding: "1rem 0",
        borderBottom: "1px solid #E7DED1",
        opacity: isUpdating ? 0.6 : 1,
        transition: "opacity 0.2s ease",
      }}
    >
      <img
        src={item.image}
        alt={item.name}
        style={{
          width: "72px",
          height: "88px",
          objectFit: "cover",
          borderRadius: "8px",
          flexShrink: 0,
          background: "#E7DED1",
        }}
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "8px",
          }}
        >
          <div>
            <p
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "1.05rem",
                fontWeight: 600,
                color: "#1E1E1E",
                margin: 0,
              }}
            >
              {item.name}
            </p>
            <p
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: "0.8rem",
                color: "#8a8375",
                margin: "2px 0 0",
              }}
            >
              {formatKES(item.price)} each
            </p>
          </div>
          <p
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: "0.95rem",
              fontWeight: 500,
              color: "#1E1E1E",
              margin: 0,
              whiteSpace: "nowrap",
            }}
          >
            {formatKES(item.price * item.quantity)}
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "12px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              border: "1px solid #E7DED1",
              borderRadius: "8px",
            }}
          >
            <button
              onClick={handleDecrease}
              disabled={isUpdating}
              aria-label="Decrease quantity"
              style={{
                width: "28px",
                height: "28px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "transparent",
                border: "none",
                cursor: isUpdating ? "not-allowed" : "pointer",
                color: "#1E1E1E",
              }}
            >
              <Minus size={14} />
            </button>
            <span
              style={{
                width: "24px",
                textAlign: "center",
                fontFamily: "'Poppins', sans-serif",
                fontSize: "0.85rem",
              }}
            >
              {item.quantity}
            </span>
            <button
              onClick={handleIncrease}
              disabled={isUpdating}
              aria-label="Increase quantity"
              style={{
                width: "28px",
                height: "28px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "transparent",
                border: "none",
                cursor: isUpdating ? "not-allowed" : "pointer",
                color: "#1E1E1E",
              }}
            >
              <Plus size={14} />
            </button>
          </div>

          <button
            onClick={handleRemove}
            disabled={isUpdating}
            style={{
              background: "none",
              border: "none",
              color: "#b23b3b",
              cursor: isUpdating ? "not-allowed" : "pointer",
              fontFamily: "'Poppins', sans-serif",
              fontSize: "0.78rem",
              padding: 0,
            }}
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

export default CartItem;