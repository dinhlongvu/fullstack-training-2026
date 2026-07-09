import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { RegisterPage } from './RegisterPage';
import { register } from '@/features/auth/api/authApi';
import { renderWithProviders } from '@/test/test-utils';

vi.mock('@/features/auth/api/authApi');
vi.mock('sonner');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('RegisterPage', () => {
  it('registers successfully and redirects to /login', async () => {
    const user = userEvent.setup();
    vi.mocked(register).mockResolvedValue({
      id: 1,
      email: 'a@b.com',
      fullName: 'A B',
    });

    renderWithProviders(<RegisterPage />);

    await user.type(screen.getByLabelText(/full name/i), 'A B');
    await user.type(screen.getByLabelText(/email/i), 'a@b.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        'Account created successfully. Please sign in.',
      );
    });
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('shows validation errors when fields are invalid', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText(/full name is required/i)).toBeInTheDocument();
    expect(
      await screen.findByText(/please enter a valid email address/i),
    ).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
  });

  it('shows an error toast when the server rejects registration', async () => {
    const user = userEvent.setup();
    vi.mocked(register).mockRejectedValue(new Error('Email already exists'));

    renderWithProviders(<RegisterPage />);

    await user.type(screen.getByLabelText(/full name/i), 'A B');
    await user.type(screen.getByLabelText(/email/i), 'a@b.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Email already exists');
    });
    expect(mockNavigate).not.toHaveBeenCalledWith('/login');
  });
});
