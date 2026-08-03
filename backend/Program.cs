// Program.cs — Application entry point.
// Registers ALL services: Carter, MediatR, EF Core, JWT, FluentValidation, AutoMapper, Swagger, and Custom Services.
// Order matters! Authentication → Authorization → Carter modules.

using System.IdentityModel.Tokens.Jwt;
using System.Reflection;
using System.Text;
using Backend.Infrastructure.Data;
using Backend.Infrastructure.Interceptors;
using Backend.Middleware;
using Backend.Services.Auth;
using Backend.Validation;
using Carter;
using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

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
            ClockSkew = TimeSpan.Zero,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!)),
            // Explicitly set the claim type used to resolve User.Identity.Name to stable "sub"
            NameClaimType = JwtRegisteredClaimNames.Sub
        };

        // Intercept JWT authentication and authorization failures to return
        // a structured JSON body instead of ASP.NET's default empty response.
        options.Events = new JwtBearerEvents
        {
            // Fires when the request has no token or an invalid/expired token (HTTP 401).
            OnChallenge = async context =>
            {
                // Suppress ASP.NET's default empty 401 response.
                context.HandleResponse();

                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                context.Response.ContentType = "application/json";

                await context.Response.WriteAsJsonAsync(new
                {
                    error = "Unauthorized. Please provide a valid Bearer token.",
                    traceId = context.HttpContext.GetTraceId()
                });
            },

            // Fires when the token is valid but the user lacks permission (HTTP 403).
            OnForbidden = async context =>
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                context.Response.ContentType = "application/json";

                await context.Response.WriteAsJsonAsync(new
                {
                    error = "Forbidden.",
                    traceId = context.HttpContext.GetTraceId()
                });
            }
        };
    });
builder.Services.AddAuthorization();

// ─── Swagger ────────────────────────────────────────────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    // Read the Comments XML file to display description and example on Swagger UI
    var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
    {
        options.IncludeXmlComments(xmlPath);
    }


    // Configure Token input interface (Bearer) for Swagger UI
    options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "JWT Authorization header using the Bearer scheme.\n\nGet token from /api/auth/login"
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
