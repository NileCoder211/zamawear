import { useQuery } from "@tanstack/react-query";
import axios from "../lib/axios";

// Typeahead suggestions for SearchBox (debounced query -> small list).
// The full search results page (SearchResultsPage) uses a raw fetch +
// AbortController instead, matching CategoryPage's pattern, so there's
// no react-query hook for the full search here.
export const useSearchSuggestions = (query, enabled = true) => {
  return useQuery({
    queryKey: ["search-suggestions", query],
    queryFn: async () => {
      const res = await axios.get("/products/search/suggestions", {
        params: { q: query },
      });
      return res.data.suggestions;
    },
    enabled: enabled && query.trim().length >= 2,
    staleTime: 30_000,
  });
};