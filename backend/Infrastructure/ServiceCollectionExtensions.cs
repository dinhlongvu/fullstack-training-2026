// Infrastructure/ServiceCollectionExtensions.cs
// Extension methods that group related service registrations.
// Keeps Program.cs thin — each method registers one cohesive concern.

using System.IdentityModel.Tokens.Jwt;
using System.Reflection;
using System.Text;
using Backend.DTOs;
using Backend.Middleware;
using Backend.Services.Auth;
using Backend.Validation;
using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

namespace Backend.Infrastructure;

public static class ServiceCollectionExtensions
{
    /// <summary>
    /// Registers MediatR, FluentValidation pipeline, and AutoMapper.
    /// These three always work together in the CQRS pipeline.
    /// </summary>
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        // MediatR — dispatches Commands and Queries to their Handlers
        services.AddMediatR(cfg =>
            cfg.RegisterServicesFromAssembly(typeof(Program).Assembly));

        // FluentValidation — auto-discovers all AbstractValidator<T> in the assembly
        services.AddValidatorsFromAssembly(typeof(Program).Assembly);

        // ValidationBehavior — intercepts every MediatR request and runs validators before the handler
        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));

        // AutoMapper — auto-discovers all Profile classes in the assembly
        services.AddAutoMapper(typeof(Program).Assembly);

        return services;
    }

    /// <summary>
    /// Registers JWT Bearer authentication and authorization.
    /// Extracted here to keep the JWT configuration isolated and testable.
    /// </summary>
    public static IServiceCollection AddJwtAuthentication(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
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
                    ValidIssuer = configuration["Jwt:Issuer"],
                    ValidAudience = configuration["Jwt:Audience"],
                    IssuerSigningKey = new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(configuration["Jwt:Key"]!)),
                    // Explicitly set the claim type used to resolve User.Identity.Name to stable "sub"
                    NameClaimType = AppConstants.Claims.UserId
                };

                // Intercept JWT authentication and authorization failures to return
                // a structured JSON body instead of ASP.NET's default empty response.
                options.Events = new JwtBearerEvents
                {
                    // Fires when the request has no token or an invalid/expired token (HTTP 401).
                    OnChallenge = async context =>
                    {
                        context.HandleResponse();

                        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                        context.Response.ContentType = "application/json";

                        await context.Response.WriteAsJsonAsync(new ErrorResponse
                        {
                            Error = "Unauthorized. Please provide a valid Bearer token.",
                            TraceId = context.HttpContext.GetTraceId()
                        });
                    },

                    // Fires when the token is valid but the user lacks permission (HTTP 403).
                    OnForbidden = async context =>
                    {
                        context.Response.StatusCode = StatusCodes.Status403Forbidden;
                        context.Response.ContentType = "application/json";

                        await context.Response.WriteAsJsonAsync(new ErrorResponse
                        {
                            Error = "Forbidden.",
                            TraceId = context.HttpContext.GetTraceId()
                        });
                    }
                };
            });

        services.AddAuthorization();

        // Register the token service to handle isolated infrastructure cryptography logic
        services.AddScoped<ITokenService, JwtTokenService>();

        return services;
    }

    /// <summary>
    /// Registers Swagger with JWT Bearer security definition.
    /// </summary>
    public static IServiceCollection AddSwaggerWithJwt(this IServiceCollection services)
    {
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen(options =>
        {
            // Read the Comments XML file to display description and example on Swagger UI
            var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
            var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
            if (File.Exists(xmlPath))
            {
                options.IncludeXmlComments(xmlPath);
            }

            options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Name = "Authorization",
                Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
                Scheme = "Bearer",
                BearerFormat = "JWT",
                In = Microsoft.OpenApi.Models.ParameterLocation.Header,
                Description = "JWT Authorization header using the Bearer scheme.\n\nGet token from /api/auth/login"
            });

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

        return services;
    }
}
