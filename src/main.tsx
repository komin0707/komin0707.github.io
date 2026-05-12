import React from 'react';
import ReactDOM from 'react-dom/client';
import { ErrorBoundary } from '@/components';
import { APP_CONFIG } from '@/config';
import {
  registerPrivacyFriendlyAnalytics,
  registerRealUserMonitoring,
  registerSecurityViolationMonitoring,
  registerServiceWorker,
  registerVercelObservability,
} from '@/lib';
import App from './App';
import '@/styles/global.css';

document.documentElement.dataset.appEnv = APP_CONFIG.appEnv;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);

void registerServiceWorker({ enabled: import.meta.env.PROD })
  .then((registration) => {
    document.documentElement.dataset.serviceWorker = registration ? 'registered' : 'unsupported';
  })
  .catch(() => {
    document.documentElement.dataset.serviceWorker = 'failed';
  });

registerRealUserMonitoring({ enabled: import.meta.env.PROD });
registerPrivacyFriendlyAnalytics({ enabled: import.meta.env.PROD });
registerVercelObservability(import.meta.env.PROD);
registerSecurityViolationMonitoring();
