# Changelog

All notable changes to this project will be documented in this file.

## [0.4.0] - 2025-12-28

### Added
- **Multi-Device Synchronization**: Complete state sync across devices using a centralized database.
- **Real-Time Updates**: Implemented Server-Sent Events (SSE) for instant updates on settings changes and item status.
- **Session Tracking**: Real-time presence awareness showing active viewers on item detail pages.
- **Database Layer**: Introduced Prisma ORM with SQLite (migratable to PostgreSQL) for persistent storage.
- **Dual-Write Architecture**: Hybrid approach syncing `localStorage` (for speed) and Database (for persistence).
- **Auto-Migration**: Utility to automatically migrate existing local data to the cloud on first run.

### Changed
- **Architecture**: Moved from pure client-side storage to a Client-Server hybrid model.
- **API**: Expanded API routes to support `GET/POST/DELETE` for sessions and preferences.

## [0.3.1] - 2025-12-28

### Added
- **New Tests**: Added tests for `ApiStatusIndicator`, `LanguageSwitcher`, `time-service`, and `Modal` components.
- **Edge Case Tests**: Enhanced test coverage for `ContentView`, `Dashboard`, and `AddModal` edge cases.
- **Coverage Completion**: Audited and achieved ~100% coverage by adding foundational tests for `browser-service`, `utils`, and `Providers`.

### Changed
- **Type Consistency**: Unified component types to use `ApiItemListView`/`ApiItemDetail` throughout.
- **Time Service**: Centralized time access via `timeService` for better testability.

### Removed
- Removed unused files: `ConfirmationModal.tsx`, `user-context.ts`, `use-countdown.ts`.
- Removed unused dependencies: `react-hook-form`, `uuid`, `prettier`.

### Metrics
- Test coverage: 272 tests across 28 test files (all passing).

## [0.3.0] - 2025-12-28

### Added
- **Dashboard**: New statistics dashboard showing encrypted item overview, content type distribution, and lock status charts.
- **Settings Page**: Comprehensive settings management including:
  - Default behavior configuration (duration, confirmations)
  - Theme customization (Light/Dark/System, Custom Colors)
  - Privacy & Security settings (Privacy Mode, Panic Button, Cache TTL)
  - Data management (Export, Clear Data)
- **Internationalization (i18n)**: Full support for English and Chinese (Simplified) languages.
- **Dark Mode**: Complete dark mode support with system preference detection.
- **Export Functionality**: Ability to export unlocked items to JSON or Markdown.
- **Image Zoom**: Integrated `yet-another-react-lightbox` for in-place image zooming.
- **Date Formatting**: Centralized date formatting using `date-fns` with configurable formats.
- **Testing Infrastructure**: Comprehensive unit test coverage (~66%) with 97 tests covering utilities, hooks, and components including edge cases.

### Changed
- **Tech Stack**:
  - Migrated state management to **Zustand**.
  - Adopated **React Query** for data fetching and caching.
  - Updated to **Tailwind CSS 4**.
  - Integrated **Radix UI** for accessible dialogs and components.
- **UI/UX**:
  - Replaced native browser alerts with custom `ConfirmDialog`.
  - Improved mobile responsiveness with bottom-sheet modals and collapsible sidebar.
  - Enhanced animations with Framer Motion.
- **Architecture**:
  - Implemented `useHasMounted` hook to fix hydration issues.
  - Added repository pattern for API calls via `api-client.ts`.

### Fixed
- Fixed hydration errors caused by local storage dependent rendering.
- Fixed theme flickering on load.
- Resolved "Rules of Hooks" violations in initial implementation.
- Fixed sort setting application issues.

## [0.2.0] - 2025-12-27

### Added
- **Remote API Integration**: Switched from local logic to consuming remote Chaster API.
- **Proxy Layer**: Added Next.js API Routes as proxy for secure token handling.

### Changed
- Refactored project structure to separate frontend concerns from backend logic.
- Updated documentation for remote API usage.

## [0.1.0] - 2025-12-20

### Added
- Initial release.
- Basic Timelock Encryption using `tlock-js`.
- Local SQLite database support.
- Basic text and image encryption.
- Duration and Absolute time modes.
- Extend lock functionality.
