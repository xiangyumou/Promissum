# Promissum

A time-lock encryption content protection system based on Timelock Encryption and the drand decentralized randomness beacon network. Allows users to encrypt text or images with a specified unlock time that cannot be bypassed, even by the user themselves.

[中文文档](./README.md) | [English Documentation](./README_EN.md)

---

## Overview

Promissum is a time-lock encryption system that allows users to encrypt content (text or images) and set a future unlock time. Based on BLS12-381 Identity-Based Encryption (IBE) and the drand decentralized randomness network, the system ensures that content cannot be decrypted before the specified time, even by the server.

## Features

- **Mandatory Time Lock**: Cryptographically enforced, cannot be decrypted early
- **Multiple Time Modes**: Duration-based or absolute time setting
- **Extend Lock**: Support for extending lock time through multi-layer encryption
- **Multi-Device Sync**: Real-time state sync across devices
- **Real-Time Updates**: Smart Polling for near real-time updates
- **Session Tracking**: See which devices are currently viewing items
- **Advanced Filtering**: Time-range filters (today/this week/this month), filter presets, fuzzy search
- **Unlock Effects**: Celebration confetti and sound effects
- **Countdown Visuals**: Gradient colors and pulse animations for items unlocking soon
- **Responsive Design**: Desktop and mobile support
- **Theme Customization**: Light/Dark mode with custom theme colors
- **Internationalization**: Complete English and Chinese interface
- **Dashboard**: Visual statistics of encrypted data
- **Data Export**: Export all encrypted data

## Architecture

```
┌─────────────┐      ┌──────────────────────────┐      ┌─────────────────┐
│   Browser   │ ───> │    Promissum App         │ ───> │ PostgreSQL DB   │
└─────────────┘      │  (Next.js + Encryption)  │      └─────────────────┘
                     └──────────────────────────┘                │
                            │                                  Redis
                            v                                  (Rate Limit)
                     ┌──────────────┐
                     │ drand Network│
                     └──────────────┘
```

**Sync Mechanism**:
- Smart polling: Dynamic refresh frequency based on remaining time (1s - 60s)
- Auto-refresh: List and detail pages stay updated automatically
- Local-first: Local state management + cloud data sync

## Quick Start

### Requirements

- Node.js 22+
- Docker & Docker Compose (for database services)
- pnpm (recommended) or npm

### Installation

```bash
# Clone repository
git clone https://github.com/xiangyumou/Promissum.git
cd Promissum

# Install dependencies (using pnpm)
pnpm install
```

### Configuration

```bash
# Copy environment variable template
cp .env.example .env

# Edit .env file, configure necessary variables
nano .env
```

### Start Development Environment

```bash
# Start database services (PostgreSQL + Redis)
# With port mapping to host, local app can access via localhost
docker compose up -d db redis

# Run database migrations
npx prisma migrate dev

# Start development server
pnpm run dev
```

Visit http://localhost:3000

**Note**:
- **Development**: `docker compose up -d db redis` + `pnpm run dev` (app runs locally)
- **Production**: `docker compose up -d` (all services including app run in Docker)

## Docker Deployment

### Production Deployment

```bash
# 1. Prepare environment variables
cp .env.example .env
# Edit .env for production configuration

# 2. Start all services
docker compose up -d

# 3. Run database migrations
docker compose exec app npx prisma migrate deploy
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://promissum:promissum_password@promissum-db:5432/promissum` |
| `REDIS_URL` | Redis connection string (rate limiting) | `redis://redis:6379` |
| `RATE_LIMIT_MAX` | Rate limit requests per window | `100` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window in milliseconds | `60000` |
| `MOCK_DRAND` | Mock drand network (development) | `true` |
| `DRAND_CHAIN_URL` | drand chain URL | `https://api.drand.sh/...` |
| `NEXT_PUBLIC_APP_URL` | Public application URL | `http://localhost:3000` |
| `NEXT_PUBLIC_DATE_FORMAT` | Date format | `yyyy-MM-dd HH:mm` |
| `NEXT_PUBLIC_AUTO_REFRESH_INTERVAL` | Auto-refresh interval (seconds) | `60` |
| `NEXT_PUBLIC_CACHE_TTL` | Cache TTL (minutes) | `5` |

For complete configuration options, see [`.env.example`](./.env.example).

### Update Deployment

```bash
docker compose pull
docker compose up -d
docker compose exec app npx prisma migrate deploy
```

## Development

### Available Scripts

```bash
pnpm run dev          # Start development server
pnpm run build        # Build production version
pnpm run start        # Start production server
pnpm run lint         # Run ESLint
pnpm run type-check   # Run TypeScript type check
pnpm run test         # Run tests
pnpm run test:coverage # Run tests with coverage report
```

### Database Operations

```bash
npx prisma migrate dev    # Create and apply new migrations
npx prisma migrate deploy # Deploy migrations (production)
npx prisma studio         # Open Prisma Studio
npx prisma generate       # Generate Prisma Client
```

### Project Structure

```
src/
├── app/                 # Next.js App Router
│   ├── [locale]/       # Internationalized routes
│   ├── api/            # API Routes
│   └── globals.css     # Global styles
├── components/         # React components
│   └── ui/             # Base UI components
├── hooks/              # Custom Hooks
├── lib/                # Utilities and state management
│   ├── db/             # Database client
│   ├── services/       # Business logic
│   ├── stores/         # Zustand stores
│   └── utils/          # Utility functions
├── i18n/               # Internationalization config
└── test/               # Test files
```

## Testing

The project uses Vitest for unit testing.

```bash
# Run all tests
pnpm test

# Run tests with coverage report
pnpm run test:coverage

# Watch mode
pnpm test -- --watch
```

**Test Coverage**: ~272 test cases, comprehensive coverage of core functionality.

## Tech Stack

- **Framework**: Next.js 16 + React 19
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **State Management**: Zustand 5 + React Query 5
- **Database**: PostgreSQL + Prisma ORM
- **Cache**: Redis (rate limiting)
- **Internationalization**: next-intl
- **UI Components**: Radix UI
- **Encryption**: tlock-js (IBE + drand)
- **State Sync**: React Query Smart Polling

## Security

- Integrated encryption service with all encryption operations server-side
- Uses BLS12-381 Identity-Based Encryption (IBE)
- Depends on drand decentralized randomness network, no single point of failure
- Redis for request rate limiting protection
- PostgreSQL data persistence with multi-device sync support

## Documentation

- [Product Requirements Document](docs/PRD.md)
- [API Reference](docs/API_REFERENCE.md)
- [System Architecture](docs/ARCHITECTURE.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Development Guide](docs/DEVELOPMENT.md)
- [Database Guide](docs/POSTGRES_MIGRATION.md)

## License

MIT License

---

**Last Updated**: 2025-12-28
**Version**: v0.5.0
