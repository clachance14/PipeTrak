import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll, vi, expect } from 'vitest';
import { setupServer } from 'msw/node';
import { handlers } from './modules/pipetrak/components/__mocks__/msw-handlers';

// Setup MSW server
export const server = setupServer(...handlers);

// Start server before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

// Reset handlers after each test
afterEach(() => {
  cleanup();
  server.resetHandlers();
});

// Clean up after all tests
afterAll(() => {
  server.close();
});

// Mock window.matchMedia (for responsive components)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver (for virtual scrolling)
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
  takeRecords: () => [],
}));

// Mock ResizeObserver (for responsive components)
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Add custom matchers for accessibility testing
expect.extend({
  toHaveMinimumTouchTarget(received: HTMLElement, expectedSize = 52) {
    const rect = received.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const pass = width >= expectedSize && height >= expectedSize;

    return {
      pass,
      message: () =>
        pass
          ? `Expected element not to have minimum touch target of ${expectedSize}px, but it has ${width}x${height}px`
          : `Expected element to have minimum touch target of ${expectedSize}px, but it has ${width}x${height}px`,
    };
  },
});