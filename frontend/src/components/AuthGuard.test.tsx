import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { AuthGuard } from './AuthGuard';
import { getCurrentUser } from '@/features/auth/api/authApi';
import { useAuthStore } from '@/stores/useAuthStore';
import { renderWithProviders } from '@/test/test-utils';

vi.mock('@/features/auth/api/authApi');
vi.mock('@/stores/useAuthStore');

function mockAuthState(overrides: Partial<ReturnType<typeof useAuthStore.getState>> = {}) {
  const state = {
    token: null,
    refreshToken: null,
    currentUser: null,
    setAuth: vi.fn(),
    setTokens: vi.fn(),
    clearAuth: vi.fn(),
    ...overrides,
  };
  vi.mocked(useAuthStore).mockImplementation((selector) => selector(state));
  vi.mocked(useAuthStore).getState = vi.fn().mockReturnValue(state);
  return state;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('AuthGuard', () => {
  it('redirects to /login when there is no token', () => {
    mockAuthState({ token: null });

    renderWithProviders(
      <AuthGuard>
        <div>Protected content</div>
      </AuthGuard>,
    );

    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('shows a loading spinner while verifying the token', () => {
    mockAuthState({ token: 'valid-token', refreshToken: 'refresh' });
    vi.mocked(getCurrentUser).mockReturnValue(new Promise(() => {}));

    const { container } = renderWithProviders(
      <AuthGuard>
        <div>Protected content</div>
      </AuthGuard>,
    );

    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('redirects to /login when the token is invalid (server returns Unauthorized)', async () => {
    const state = mockAuthState({ token: 'stale-token', refreshToken: 'refresh' });
    vi.mocked(getCurrentUser).mockRejectedValue(new Error('Unauthorized'));

    renderWithProviders(
      <AuthGuard>
        <div>Protected content</div>
      </AuthGuard>,
    );

    await waitFor(() => {
      expect(state.clearAuth).toHaveBeenCalled();
    });
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('renders children once the token is verified', async () => {
    mockAuthState({ token: 'valid-token', refreshToken: 'refresh' });
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 1,
      email: 'a@b.com',
      fullName: 'A B',
    });

    renderWithProviders(
      <AuthGuard>
        <div>Protected content</div>
      </AuthGuard>,
    );

    await waitFor(() => {
      expect(screen.getByText('Protected content')).toBeInTheDocument();
    });
  });
});
