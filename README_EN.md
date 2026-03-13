# Promissum

A time-lock encryption content protection system based on Timelock Encryption and the drand decentralized randomness beacon network. Allows users to encrypt text or images with a specified unlock time that cannot be bypassed, even by the server.

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
│   Browser   │ ───> │    Promissum App         │ ───> │   SQLite DB     │
└─────────────┘      │  (Next.js + Encryption)  │      │ (better-sqlite3)│
                     └──────────────────────────┘      └─────────────────┘
                            │
                            v
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
- npm or pnpm

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
# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

Visit http://localhost:3000

## Deployment

### Production Deployment

```bash
# 1. Prepare environment variables
cp .env.example .env
# Edit .env for production configuration

# 2. Install dependencies
npm install

# 3. Run database migrations
npm run db:migrate

# 4. Build and start
npm run build
npm start
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MOCK_DRAND` | Use mock drand network (set to `true` for instant decryption in dev) | `false` |
| `NEXT_PUBLIC_APP_URL` | Public application URL | `http://localhost:3000` |

For complete configuration options, see [`.env.example`](./.env.example).

### Update Deployment

```bash
# Pull latest code
git pull origin main

# Install dependencies
npm install

# Run database migrations
npm run db:migrate

# Rebuild and restart
npm run build
npm start
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
npm run db:generate       # Generate Drizzle migrations
npm run db:migrate        # Apply migrations
npm run db:push           # Push schema changes (development)
npm run db:studio         # Open Drizzle Studio
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
│   └── stores/         # Zustand stores
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
- **State Management**: Zustand 5 + TanStack Query 5
- **Database**: SQLite (better-sqlite3) + Drizzle ORM
- **Internationalization**: next-intl
- **UI Components**: Radix UI
- **Encryption**: tlock-js (IBE + drand)
- **State Sync**: TanStack Query Smart Polling

## Security

- Integrated encryption service, all encryption operations performed server-side
- Uses BLS12-381 Identity-Based Encryption (IBE)
- Depends on drand decentralized randomness network, no single point of failure
- SQLite data persistence, supports multi-device sync

## Documentation

- [Product Requirements Document](docs/PRD.md)
- [API Reference](docs/API_REFERENCE.md)
- [System Architecture](docs/ARCHITECTURE.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Development Guide](docs/DEVELOPMENT.md)

## License

MIT License

---

**Last Updated**: 2026-03-13
**Version**: v0.5.0
