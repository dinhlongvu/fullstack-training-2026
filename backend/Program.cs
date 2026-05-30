// Program.cs — Application entry point.
// Registers ALL services: Carter, MediatR, EF Core, JWT, FluentValidation, AutoMapper, Swagger.
// Order matters! Authentication → Authorization → Carter modules.

using Backend.Infrastructure.Data;
using Backend.Middleware;
using Backend.Validation;
using Carter;
using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// ─── Database (SQLite — file-based, no Docker needed for training) ──
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("Default")));

// ─── Carter (Minimal API) ───────────────────────────────
builder.Services.AddCarter();

// ─── MediatR + CQRS ─────────────────────────────────────
builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(Program).Assembly));

// ─── FluentValidation (auto-validate via pipeline) ──────
builder.Services.AddValidatorsFromAssembly(typeof(Program).Assembly);
builder.Services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));

// ─── AutoMapper ─────────────────────────────────────────
builder.Services.AddAutoMapper(typeof(Program).Assembly);

// ─── JWT Authentication ─────────────────────────────────
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
builder.Services.AddAuthorization();

// ─── Swagger ────────────────────────────────────────────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// ─── Middleware Pipeline (ORDER MATTERS!) ───────────────
app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseSwagger();
app.UseSwaggerUI();
app.UseAuthentication();
app.UseAuthorization();
app.MapCarter(); // Must be AFTER auth!

app.Run();
