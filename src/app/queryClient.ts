import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (count, error: any) => count < 2 && (!error?.status || error.status >= 500),
      refetchOnWindowFocus: false,
    },
    mutations: { retry: false },
  },
});
