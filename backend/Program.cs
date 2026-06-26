// Program.cs — Application entry point.
// Registers ALL services: Carter, MediatR, EF Core, JWT, FluentValidation, AutoMapper, Swagger, and Custom Services.
// Order matters! Authentication → Authorization → Carter modules.

using Backend.Infrastructure.Data;
using Backend.Middleware;
using Backend.Services.Auth;
using Backend.Validation;
using Carter;
using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Text;
using Backend.Infrastructure.Interceptors;

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

// ─── MediatR + CQRS ─────────────────────────────────────
builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(Program).Assembly));

// ─── FluentValidation (auto-validate via pipeline) ──────
builder.Services.AddValidatorsFromAssembly(typeof(Program).Assembly);
builder.Services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));

// ─── AutoMapper ─────────────────────────────────────────
builder.Services.AddAutoMapper(typeof(Program).Assembly);

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

// ─── Custom Infrastructure Services ─────────────────────
// Register the token service to handle isolated infrastructure cryptography logic
builder.Services.AddScoped<ITokenService, JwtTokenService>();

// ─── JWT Authentication ─────────────────────────────────
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        // Disable inbound claim mapping to prevent Microsoft from renaming "sub" to ClaimTypes.NameIdentifier
        options.MapInboundClaims = false;

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!)),
            // Explicitly set the claim type used to resolve User.Identity.Name to stable "sub"
            NameClaimType = JwtRegisteredClaimNames.Sub
        };

        // Intercept authentication failures to return structural JSON payloads for 401 Unauthorized responses
        options.Events = new JwtBearerEvents
        {
            OnChallenge = async context =>
            {
                // Suppress the default empty inbound HTTP 401 challenge response behavior
                context.HandleResponse();

                // Explicitly set the standardized content type boundary and HTTP status code
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                context.Response.ContentType = "application/json";

                // Emit a unified error payload for consistent client-side interceptor parsing
                await context.Response.WriteAsJsonAsync(new
                {
                    error = "Unauthorized. Please provide a valid Bearer token."
                });
            }
        };
    });
builder.Services.AddAuthorization();

// ─── Swagger ────────────────────────────────────────────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    // Configure Token input interface (Bearer) for Swagger UI
    options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\""
    });

    // Apply security requirement globally to enforce JWT input requirements on Swagger UI
    options.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

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
