import { apiClient } from "@/lib/api";
import { type AuthUser } from "@/stores/useAuthStore";

// Data Transfer Objects (DTOs) defining the shape of outgoing request bodies.
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  fullName: string;
  password: string;
}

// Expected response shape from the backend upon successful authentication.
export interface AuthResponse {
  token: string; // JWT token to be stored in localStorage
  user: AuthUser;
}

// Authenticates an existing user
export function login(request: LoginRequest) {
  return apiClient<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export interface RegisterResponse {
  id: number;
  email: string;
  fullName: string;
}

// Registers a new user
export function register(request: RegisterRequest) {
  return apiClient<RegisterResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

// Fetches the currently authenticated user's information using the stored JWT token.
export function getCurrentUser() {
  return apiClient<AuthUser>("/api/auth/me");
}
