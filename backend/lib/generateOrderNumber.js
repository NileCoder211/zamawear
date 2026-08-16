import Order from "../models/orderModel.js";

// paymentMethod param kept (harmless if a caller still passes "mpesa")
// but no longer branches on it — MPS is the only prefix now.
export const generateOrderNumber = async () => {
  const year = new Date().getFullYear();

  let orderNumber;
  let exists = true;

  while (exists) {
    const random = Math.floor(100000 + Math.random() * 900000);
    orderNumber = `ORD-MPS-${year}-${random}`;

    const existingOrder = await Order.findOne({ orderNumber });
    exists = !!existingOrder;
  }

  return orderNumber;
};