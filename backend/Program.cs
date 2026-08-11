// Program.cs — Application entry point.
// Registers ALL services: Carter, MediatR, EF Core, JWT, FluentValidation, AutoMapper, Swagger, and Custom Services.
// Order matters! Authentication → Authorization → Carter modules.

using Backend.Infrastructure;
using Backend.Infrastructure.Data;
using Backend.Infrastructure.Interceptors;
using Backend.Middleware;
using Carter;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// ─── Database (SQLite — file-based, no Docker needed for training) ──

// ─── ADDED FOR INTERCEPTOR ───────────────────────────────
// 1. Register the interceptor into the Dependency Injection container as a Scoped service
builder.Services.AddScoped<AuditableEntityInterceptor>();

// 2. Configure the AppDbContext and attach the interceptor to its options
builder.Services.AddDbContext<AppDbContext>((sp, options) =>
{
    // Retrieve the interceptor instance from the service provider
    var auditableInterceptor = sp.GetRequiredService<AuditableEntityInterceptor>();

    // Configure the database provider and explicitly add the interceptor to the EF Core pipeline.
    options.UseSqlite(builder.Configuration.GetConnectionString("Default")).AddInterceptors(auditableInterceptor);
});

// ─── Carter (Minimal API) ───────────────────────────────
builder.Services.AddCarter();
// Force the framework to throw an exception on bad HTTP requests (malformed JSON body,
// wrong data type, missing required body) instead of silently returning an empty 400 response.
// This ensures ALL errors go through ExceptionHandlingMiddleware and return a consistent JSON envelope.
builder.Services.Configure<RouteHandlerOptions>(options =>
{
    options.ThrowOnBadRequest = true;
});

// ─── CORS (Allow Frontend Dev Server to Access API) ─────
// Read origins dynamically from configuration to prevent hardcoding
var allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();

builder.Services.AddCors(options =>
{
    // Use Default Policy so app.UseCors() automatically hooks into it without explicitly naming the policy
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod());
});

// ─── Application Services (MediatR + FluentValidation + AutoMapper) ──
builder.Services.AddApplicationServices();

// ─── JWT Authentication + Authorization ─────────────────────────────
builder.Services.AddJwtAuthentication(builder.Configuration);

// ─── Swagger ────────────────────────────────────────────────────────
builder.Services.AddSwaggerWithJwt();

var app = builder.Build();

// ─── Middleware Pipeline (ORDER MATTERS!) ───────────────
app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseSwagger();
app.UseSwaggerUI();

// CORS MUST be placed before Authentication and Authorization
// to handle unauthenticated OPTIONS preflight requests successfully
app.UseCors();

app.UseAuthentication();
app.UseAuthorization();
app.MapCarter(); // Must be AFTER authentication and authorization middleware!

// API Health Check
app.MapGet("/health", () => Results.Ok(new { status = "Healthy", timestamp = DateTime.UtcNow }));

app.Run();
