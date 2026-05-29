# 10 — Docker & Container Basics

## Concept

Docker lets you run applications in isolated **containers** — lightweight environments that bundle code, dependencies, and configuration. No more "it works on my machine" problems.

**Image** = blueprint (like a class)  
**Container** = running instance (like an object)  
**Docker Compose** = run multiple containers together (like an orchestra conductor)

## Why Docker in This Project

Our project needs multiple services running simultaneously:
- SQL Server (database)
- Redis (cache)
- Elasticsearch (search engine)

Docker Compose starts all of them with ONE command.

## Code Examples

### Dockerfile — Define Your App

```dockerfile
# backend/Dockerfile
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app
COPY *.csproj ./
RUN dotnet restore
COPY . ./
RUN dotnet publish -c Release -o /out

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /out ./
EXPOSE 8080
ENTRYPOINT ["dotnet", "TeamCollab.Api.dll"]
```

### Docker Compose — Orchestrate Services

```yaml
# docker-compose.yml
version: "3.8"

services:
  sqlserver:
    image: mcr.microsoft.com/mssql/server:2022-latest
    environment:
      SA_PASSWORD: "YourStrong!Passw0rd"
      ACCEPT_EULA: "Y"
    ports:
      - "1433:1433"
    volumes:
      - sqldata:/var/opt/mssql

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  elasticsearch:
    image: elasticsearch:8.12.0
    environment:
      discovery.type: single-node
      xpack.security.enabled: false
    ports:
      - "9200:9200"

volumes:
  sqldata:
```

### Daily Commands

```bash
# Start all services in background
docker compose up -d

# View running containers
docker compose ps

# View logs
docker compose logs -f sqlserver

# Stop all services
docker compose down

# Rebuild after code changes
docker compose up -d --build
```

## Key Rules

- 🟢 **Never hardcode secrets in docker-compose.yml** — use `.env` files
- 🟢 **Use volumes for persistent data** — databases need to survive container restarts
- 🟢 **`.dockerignore`** — exclude `node_modules`, `bin`, `obj` from builds (like `.gitignore`)
- 🟡 **Keep images small** — use multi-stage builds, Alpine variants
- 🔴 **Don't run `docker compose up` without `-d`** in development — it blocks your terminal

## Common Pitfalls

| ❌ | ✅ |
|----|-----|
| `docker compose up` — blocks terminal | `docker compose up -d` — runs in background |
| Password in docker-compose.yml | Password in `.env`, referenced via `${VAR}` |
| `localhost` in container | Use service name: `Server=sqlserver` (Docker DNS) |
| No volumes — data lost on restart | Always mount volumes for databases |

## 📚 Further Reading

- [Docker — Get Started](https://docs.docker.com/get-started/) — official tutorial
- [Docker Compose Overview](https://docs.docker.com/compose/) — multi-container apps
- [Play with Docker](https://labs.play-with-docker.com/) — try Docker in browser
- [Awesome Docker](https://github.com/veggiemonk/awesome-docker) — curated resources

## 💡 Tip

> Think of Docker containers as "mini-VMs for one process." Each container does ONE thing well — database, cache, web server. Docker Compose connects them.
