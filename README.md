# Todo Monorepo

This repository contains the Todo service monorepo consisting of a Spring Boot API and a Next.js web client. It is provisioned for local development with Dockerized infrastructure.

## Getting Started

### Prerequisites
- Java 17+
- Node.js 18+
- npm 9+
- Docker & Docker Compose

### Bootstrapping

```
make bootstrap
```

The bootstrap target installs dependencies for the API and web projects.

### Running locally

```
make up        # start infrastructure services (PostgreSQL, Adminer)
make api       # run the Spring Boot API (http://localhost:8080)
make web       # run the Next.js app (http://localhost:3000)
```

### Environment configuration

Copy the provided example environment files and populate them with your secrets.

```
cp api/.env.example api/.env
cp web/.env.example web/.env.local
```

### Health checks

- API: `curl http://localhost:8080/actuator/health`
- Web: browse to `http://localhost:3000`

### Project layout

See [`docs/Agent.md`](docs/Agent.md) for the detailed execution plan and architecture guidance.
