/**
 * MSW Server
 *
 * Node.js server instance for running tests.
 */

import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
