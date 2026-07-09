import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { LoginPage } from './LoginPage';
import { login } from '@/features/auth/api/authApi';
import { useAuthStore } from '@/stores/useAuthStore';
import { renderWithProviders } from '@/test/test-utils';

vi.mock('@/features/auth/api/authApi');
vi.mock('sonner');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@/stores/useAuthStore');

const mockSetAuth = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useAuthStore).mockImplementation((selector) =>
    selector({
      token: null,
      refreshToken: null,
      currentUser: null,
      setAuth: mockSetAuth,
      setTokens: vi.fn(),
      clearAuth: vi.fn(),
    }),
  );
});

describe('LoginPage', () => {
  it('logs in successfully and navigates to /projects', async () => {
    const user = userEvent.setup();
    vi.mocked(login).mockResolvedValue({
      token: 'fake-token',
      refreshToken: 'fake-refresh',
      user: { id: 1, email: 'a@b.com', fullName: 'A B' },
    });

    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), 'a@b.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockSetAuth).toHaveBeenCalledWith(
        'fake-token',
        'fake-refresh',
        { id: 1, email: 'a@b.com', fullName: 'A B' },
      );
    });
    expect(mockNavigate).toHaveBeenCalledWith('/projects');
  });

  it('shows validation errors when fields are invalid', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText(/password/i), '123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(
      await screen.findByText(/please enter a valid email address/i),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/password must be at least 8 characters/i),
    ).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it('shows an error toast when the server rejects login', async () => {
    const user = userEvent.setup();
    vi.mocked(login).mockRejectedValue(new Error('Invalid credentials'));

    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), 'a@b.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Invalid credentials');
    });
    expect(mockSetAuth).not.toHaveBeenCalled();
  });
});
