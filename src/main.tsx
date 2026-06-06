// Prevent read-only window.fetch/globalThis.fetch errors in sandboxed iframe environments
try {
  const originalFetch = window.fetch;
  let currentFetch = originalFetch;

  Object.defineProperty(window, 'fetch', {
    get() {
      return currentFetch;
    },
    set(val) {
      currentFetch = val;
    },
    configurable: true,
    enumerable: true
  });

  if (typeof globalThis !== 'undefined' && globalThis !== window) {
    Object.defineProperty(globalThis, 'fetch', {
      get() {
        return currentFetch;
      },
      set(val) {
        currentFetch = val;
      },
      configurable: true,
      enumerable: true
    });
  }
} catch (e) {
  console.warn('Could not patch fetch descriptor:', e);
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
