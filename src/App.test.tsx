import { fireEvent, screen, waitFor } from '@testing-library/react';
import { APP_CONFIG } from '@/config';
import { describe, expect, it, vi } from 'vitest';
import {
  INTEGRATION_TEST_TIMEOUT_MS,
  SETTINGS_TEST_TIMEOUT_MS,
  expectDefaultDashboard,
  renderLoadedApp,
  runInteractionFlow,
  runSettingsFlow,
  switchToEnglishLocaleAndExpect,
  switchToKoreanLocaleAndExpect,
} from './App.test.helpers';

describe('App integration flow', () => {
  registerDefaultDashboardTest();
  registerLocaleSwitchTest();
  registerSettingsFlowTest();
  registerInteractionFlowTest();
  registerDebugPanelTest();
});

function registerDefaultDashboardTest(): void {
  it(
    'renders the default pneumonia simulator dashboard with warnings and monitor values',
    async () => {
      await renderLoadedApp();
      await expectDefaultDashboard();
    },
    INTEGRATION_TEST_TIMEOUT_MS,
  );
}

function registerLocaleSwitchTest(): void {
  it(
    'switches the simulator chrome between Korean and English locale copy',
    async () => {
      await renderLoadedApp();
      switchToEnglishLocaleAndExpect();
      switchToKoreanLocaleAndExpect();
    },
    INTEGRATION_TEST_TIMEOUT_MS,
  );
}

function registerSettingsFlowTest(): void {
  it(
    'updates settings, mode, scenario, pause, resume, and reset from user controls',
    async () => {
      await runSettingsFlow();
    },
    SETTINGS_TEST_TIMEOUT_MS,
  );
}

function registerInteractionFlowTest(): void {
  it(
    'supports keyboard shortcuts, context menu, drag-drop scenarios, touch gestures, voice, AR, and help modes',
    async () => {
      await runInteractionFlow();
    },
    INTEGRATION_TEST_TIMEOUT_MS,
  );
}

function registerDebugPanelTest(): void {
  it(
    'renders the debug panel when the runtime config enables it',
    async () => {
      const previousDebugPanelEnabled = APP_CONFIG.debugPanelEnabled;
      APP_CONFIG.debugPanelEnabled = true;

      try {
        await renderLoadedApp();
        expect(screen.getByLabelText('Debug panel')).toHaveTextContent('env');
        expect(screen.getByLabelText('Debug panel')).toHaveTextContent('paused no');
        fireEvent.click(screen.getByRole('button', { name: /중지/ }));
        await waitFor(() => expect(screen.getByLabelText('Debug panel')).toHaveTextContent('paused yes'));
      } finally {
        APP_CONFIG.debugPanelEnabled = previousDebugPanelEnabled;
      }
    },
    INTEGRATION_TEST_TIMEOUT_MS,
  );

  it(
    'keeps the debug panel out of production builds',
    async () => {
      const previousDebugPanelEnabled = APP_CONFIG.debugPanelEnabled;
      APP_CONFIG.debugPanelEnabled = true;
      vi.stubEnv('PROD', true);

      try {
        await renderLoadedApp();
        expect(screen.queryByLabelText('Debug panel')).not.toBeInTheDocument();
      } finally {
        vi.unstubAllEnvs();
        APP_CONFIG.debugPanelEnabled = previousDebugPanelEnabled;
      }
    },
    INTEGRATION_TEST_TIMEOUT_MS,
  );
}
