import { apiClient, NetworkError } from "@/lib/api";
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
  refreshToken: string;
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

// Response shape from the refresh endpoint
export interface RefreshResponse {
  token: string;
  refreshToken: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL;

export async function refreshTokenRequest(
  refreshToken: string,
): Promise<RefreshResponse> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
  } catch {
    // Never reached the server, so this says nothing about the token.
    throw new NetworkError();
  }

  if (!response.ok) {
    throw new Error("Refresh failed");
  }

  const body = (await response.json()) as Partial<RefreshResponse>;

  // A 200 with the wrong shape is not a usable session. Without this check the
  // string "undefined" ends up in localStorage and in the Authorization header.
  if (typeof body.token !== "string" || typeof body.refreshToken !== "string") {
    throw new Error("Refresh failed");
  }

  return { token: body.token, refreshToken: body.refreshToken };
}
