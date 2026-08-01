// Shared React Query configuration.
// Lives outside main.tsx so tests can assert against the same config the app runs.

import { QueryClient } from '@tanstack/react-query';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 min before refetch
        retry: 1,
        // Run even when the browser reports being offline, so a request that
        // cannot reach the server fails and sets `error`. The default
        // ("online") pauses it instead: `isPending` stays true with no error,
        // which renders a skeleton that never resolves. Failing lets the
        // error branches show a message and a retry button, and
        // refetchOnReconnect still reloads once the network is back.
        networkMode: 'always',
      },
      mutations: {
        // Same reason: a paused mutation keeps `isPending` true, so submit
        // buttons stay stuck on "Saving..." with no error and no way back.
        networkMode: 'always',
      },
    },
  });
}
