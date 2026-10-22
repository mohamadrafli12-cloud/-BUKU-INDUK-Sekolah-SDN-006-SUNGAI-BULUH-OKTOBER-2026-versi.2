import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { repairStorageQuota } from './utils/storageHelper';
import './index.css';

// Proactively verify and repair localStorage quota before any component mounts
if (typeof window !== 'undefined') {
  try {
    const testKey = '__test_storage_quota__';
    localStorage.setItem(testKey, '1');
    localStorage.removeItem(testKey);
  } catch (err) {
    console.warn('Storage quota full on boot, running proactive repair...', err);
    try {
      repairStorageQuota();
    } catch {}
  }
}

// Prevent uncaught errors from crashing the application or throwing empty unhandled rejections
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    console.warn('Captured unhandled promise rejection:', event.reason);
    // Prevent default browser logging if it is an empty error
    if (!event.reason || event.reason === '' || typeof event.reason === 'undefined') {
      event.preventDefault();
    }
  });

  window.addEventListener('error', (event) => {
    // Prevent empty or cross-origin script error from bubbling as empty uncaught
    if (!event.message || event.message === 'Script error.') {
      console.warn('Captured generic/cross-origin window script error');
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

