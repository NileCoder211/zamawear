import { useQuery } from "@tanstack/react-query";
import axios from "../lib/axios"; // adjust path to match your project's axios instance

export const useCategories = () => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await axios.get("/categories");
      return res.data.categories;
    },
    staleTime: 5 * 60 * 1000, // categories rarely change — avoid refetching on every mount
  });
};