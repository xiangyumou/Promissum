/**
 * Vitest Test Setup
 *
 * Global test configuration and MSW server initialization.
 */

import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import { server } from './mocks/server';

// Start MSW server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Reset handlers after each test (important for test isolation)
afterEach(() => {
    cleanup();
    server.resetHandlers();
});

// Stop MSW server after all tests
afterAll(() => server.close());
