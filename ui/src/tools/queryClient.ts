import {QueryClient} from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30_000,
    },
  },
});

export const queryKeys = {
  rootStore: (place: string) => ['rootStore', place] as const,
  search: (place: string, pattern: string) => ['search', place, pattern] as const,
  addresses: ['addresses'] as const,
  diskUsage: (place: string) => ['diskUsage', place] as const,
  dirSize: (place: string) => ['dirSize', place] as const,
  storage: (keys: string[]) => ['storage', ...keys] as const,
  previews: ['preview'] as const,
  preview: (place: string) => ['preview', place] as const,
};
