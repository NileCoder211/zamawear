// src/components/OrderItemRow.jsx
const OrderItemRow = ({ name, image, quantity }) => {
  return (
    <div className="flex items-center gap-3">
      <img
        src={image}
        alt={name}
        className="w-12 h-12 object-cover rounded-md border border-[#E7DED1] flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#1E1E1E] truncate">{name}</p>
        <p className="text-xs text-[#1E1E1E]/50">Qty {quantity}</p>
      </div>
    </div>
  );
};

export default OrderItemRow;