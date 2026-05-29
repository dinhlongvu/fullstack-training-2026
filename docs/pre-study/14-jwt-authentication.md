# 14 — JWT Authentication

JWT (JSON Web Token) is how the app knows **who you are** after you log in. Instead of sending your password with every request, the server gives you a signed token — like a digital ID card. You show the card, the server verifies the signature, and you're in.

> **Prerequisite:** [05 — ASP.NET Core + Carter](05-aspnet-core-carter.md) (middleware pipeline, DI). This file covers both backend (token generation/validation) and frontend (storing/sending tokens).

---

## 1. How JWT Works

```
Login Request                    Every Request After Login
─────────────                    ─────────────────────────
POST /api/auth/login             GET /api/projects
{ email, password }              Authorization: Bearer <token>
     │                                │
     ▼                                ▼
  Server                         Server verifies
  checks password                token signature
     │                                │
     ▼                                ▼
  Generates JWT token            Decodes → { userId, email }
  → { userId, email, exp }           │
     │                                ▼
     ▼                            Returns data
  Returns token to client         (no password needed!)
     │
     ▼
  Client stores token
  (Zustand + localStorage)
```

**JWT structure:** `header.payload.signature`

```
eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOjV9.X3fB...
   ↑                    ↑              ↑
  header             payload       signature
  (algorithm)    (userId, exp)   (verifies token
                                  wasn't tampered)
```

---

## 2. Backend: Generating JWT Tokens (.NET)

```csharp
// Step 1: Install package
// dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer

// Step 2: Configure in Program.cs
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
        };
    });

// Step 3: Generate token on login
public record LoginCommand(string Email, string Password) : IRequest<string>;

public class LoginHandler : IRequestHandler<LoginCommand, string>
{
    public async Task<string> Handle(LoginCommand request, CancellationToken ct)
    {
        // 1. Validate credentials (check password hash)
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Invalid credentials");

        // 2. Create claims (what the token contains)
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim("fullName", user.FullName),
        };

        // 3. Generate token
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(24),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
```

---

## 3. Backend: Protecting Routes with [Authorize]

```csharp
// Option A: Protect individual endpoints
app.MapGet("/api/projects", [Authorize] async (IMediator mediator) =>
{
    // Only authenticated users can access
    var projects = await mediator.Send(new GetMyProjectsQuery());
    return Results.Ok(projects);
});

// Option B: Protect entire module
public class ProjectsModule : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/projects")
            .RequireAuthorization(); // ← All endpoints in this group need auth

        group.MapGet("/", async (IMediator m) => ...);
        group.MapPost("/", async (IMediator m) => ...);
    }
}

// Get current user from token inside a handler
public class GetMyProjectsHandler : IRequestHandler<GetMyProjectsQuery, List<ProjectDto>>
{
    private readonly IHttpContextAccessor _http;

    public async Task<List<ProjectDto>> Handle(GetMyProjectsQuery request, CancellationToken ct)
    {
        var userId = int.Parse(
            _http.HttpContext!.User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        // Now userId is the authenticated user — safe to use
        return await _db.Projects.Where(p => p.CreatedById == userId).ToListAsync();
    }
}
```

---

## 4. Frontend: Storing & Sending Tokens (React)

```typescript
// stores/useAuthStore.ts — Zustand store for auth
import { create } from 'zustand';

interface AuthState {
  token: string | null;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'), // Persist across refreshes
  user: null,
  login: (token, user) => {
    localStorage.setItem('token', token);
    set({ token, user });
  },
  logout: () => {
    localStorage.removeItem('token');
    set({ token: null, user: null });
  },
}));
```

```typescript
// lib/api.ts — Attach token to every request
import { useAuthStore } from '@/stores/useAuthStore';

async function apiFetch(url: string, options: RequestInit = {}) {
  const token = useAuthStore.getState().token;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };
  return fetch(url, { ...options, headers });
}
```

```typescript
// components/AuthGuard.tsx — Redirect if not logged in
function AuthGuard({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
```

---

## Key Rules

| Rule | Why |
|------|-----|
| Never store JWT secret in code | Use `appsettings.json` or environment variables |
| Set a reasonable expiry (24h) | Short-lived tokens limit damage if stolen |
| Store token in `localStorage` (not cookies for SPAs) | Simpler for API-only backends |
| Always use HTTPS in production | Tokens sent in headers — must be encrypted |
| Validate ALL claims on the server | Never trust client-sent userId — always read from token |

---

## 📚 Further Reading

- [JWT.io](https://jwt.io/) — debug and inspect tokens visually
- [Microsoft: JWT Authentication in ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/jwt-authn)
- [Hasura: JWT Guide](https://hasura.io/blog/best-practices-of-using-jwt-with-graphql/)
- [React: Protected Routes Pattern](https://reactrouter.com/en/main/start/faq#how-do-i-protect-routes)

---

> **Tip:** The JWT token is like a hotel key card. The front desk gives it to you at check-in (login). You show it at every door (API call). If it expires, you go back to the front desk. Never try to decode or modify the card yourself — the server does all the verification.
