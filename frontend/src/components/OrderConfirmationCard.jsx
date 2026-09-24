// src/components/OrderConfirmationCard.jsx
import { useNavigate } from "react-router-dom";

export default function OrderConfirmationCard({ orderNumber, productName, productImage }) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-4 border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
      <img
        src={productImage}
        alt={productName}
        className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
      />

      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500">Order #{orderNumber}</p>
        <p className="font-medium text-gray-900 truncate">{productName}</p>
      </div>

      <button
        onClick={() => navigate("/profile#orders")}
        className="px-4 py-2 text-sm rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition whitespace-nowrap"
      >
        View Order
      </button>
    </div>
  );
}