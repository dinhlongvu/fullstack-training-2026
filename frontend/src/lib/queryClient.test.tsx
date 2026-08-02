// Offline behaviour of the shared QueryClient config.
//
// React Query's default networkMode ("online") pauses a request when the
// browser reports being offline: `isPending` stays true and `error` stays null.
// Every loading branch in the app keys off `isPending`, so a paused query
// renders a skeleton that never resolves and a paused mutation leaves a submit
// button stuck on its pending label. These tests pin the config that avoids
// that, since the failure is invisible until someone actually goes offline.

import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import {
  QueryClientProvider,
  onlineManager,
  useQuery,
  useMutation,
} from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { createQueryClient } from './queryClient';

function wrapper({ children }: { children: ReactNode }) {
  const client = createQueryClient();
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

// React Query decides "offline" from its own onlineManager, not from
// navigator.onLine, so the manager is what has to be switched. fetch rejects
// the way it does in DevTools -> Network -> Offline.
function goOffline() {
  onlineManager.setOnline(false);
  return vi
    .spyOn(globalThis, 'fetch')
    .mockRejectedValue(new TypeError('Failed to fetch'));
}

afterEach(() => {
  onlineManager.setOnline(true);
  vi.restoreAllMocks();
});

describe('offline behaviour', () => {
  it('errors a query instead of pausing it', async () => {
    goOffline();

    const { result } = renderHook(
      () =>
        useQuery({
          queryKey: ['offline-query'],
          queryFn: () => fetch('/api/anything').then((r) => r.json()),
          retry: false,
        }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));

    // The combination that produces the never-ending skeleton.
    expect(result.current.isPaused).toBe(false);
    expect(result.current.isPending).toBe(false);
    expect(result.current.error).not.toBeNull();
  });

  it('errors a mutation instead of leaving it pending forever', async () => {
    goOffline();

    const { result } = renderHook(
      () =>
        useMutation({
          mutationFn: () => fetch('/api/anything', { method: 'POST' }),
        }),
      { wrapper },
    );

    result.current.mutate();

    await waitFor(() => expect(result.current.isError).toBe(true));

    // A stuck submit button is `isPending` true with nothing in flight.
    expect(result.current.isPaused).toBe(false);
    expect(result.current.isPending).toBe(false);
  });
});
