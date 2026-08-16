import { useQuery } from "@tanstack/react-query";
import axios from "../lib/axios"; // adjust path to match your project's axios instance

// categorySlug is the selected category's slug — subcategories are
// scoped to whichever category is currently chosen in the form.
export const useSubcategories = (categorySlug) => {
  return useQuery({
    queryKey: ["subcategories", categorySlug],
    queryFn: async () => {
      const res = await axios.get("/subcategories", { params: { category: categorySlug } });
      return res.data.subcategories;
    },
    enabled: !!categorySlug, // don't fetch until a category is actually selected
    staleTime: 5 * 60 * 1000,
  });
};