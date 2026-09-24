import { useMutation } from "@tanstack/react-query";
import axios from "../lib/axios";

// POST /api/coupons/validate — checks a code against a given order
// total and returns the discount it would apply. Doesn't mark the
// coupon used; that only happens once an order is actually placed.
export const useValidateCoupon = () => {
  return useMutation({
    mutationFn: async ({ code, orderTotal }) => {
      const res = await axios.post("/coupons/validate", { code, orderTotal });
      return res.data; // { code, type, value, discount }
    },
  });
};
