// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Add TextEncoder/TextDecoder for MSW support
import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.sessionStorage = sessionStorageMock;

// Mock IntersectionObserver
global.IntersectionObserver = class {
  constructor() {}
  observe() {}
  disconnect() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class {
  constructor() {}
  observe() {}
  disconnect() {}
  unobserve() {}
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock navigator.mediaDevices for QR scanner
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: jest.fn(() => 
      Promise.resolve({
        getTracks: () => []
      })
    ),
  },
});

// Mock WebSocket
global.WebSocket = jest.fn(() => ({
  close: jest.fn(),
  send: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  readyState: 1,
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
}));

// Mock fetch for MSW
global.fetch = jest.fn();

// Suppress console warnings in tests unless explicitly needed
const originalWarn = console.warn;
const originalError = console.error;

console.warn = (...args) => {
  if (args[0]?.includes && (
    args[0].includes('React Router Future Flag Warning') ||
    args[0].includes('ReactDOMTestUtils.act is deprecated')
  )) {
    return;
  }
  originalWarn.call(console, ...args);
};

console.error = (...args) => {
  // Filter out expected error messages in tests
  if (args[0]?.includes && (
    args[0].includes('Warning: `ReactDOMTestUtils.act` is deprecated') ||
    args[0].includes('Error de inicio de sesión:') ||
    args[0].includes('Token expired on startup')
  )) {
    return;
  }
  originalError.call(console, ...args);
};

// Global test timeout
jest.setTimeout(10000); 