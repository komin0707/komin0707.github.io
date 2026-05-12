import { describe, expect, it } from 'vitest';
import { APP_CONFIG, loadAppConfig } from './env';

describe('environment config', () => {
  it('exports config loaded from the current import meta env', () => {
    expect(['development', 'staging', 'production', 'test']).toContain(APP_CONFIG.appEnv);
    expect(typeof APP_CONFIG.debugPanelEnabled).toBe('boolean');
  });

  it('loads allowed app environments and parses only literal true as enabled', () => {
    expect(
      loadAppConfig({ VITE_APP_ENV: 'development', VITE_ENABLE_DEBUG_PANEL: 'true' } as ImportMetaEnv),
    ).toEqual({
      appEnv: 'development',
      debugPanelEnabled: true,
    });
    expect(
      loadAppConfig({ VITE_APP_ENV: 'staging', VITE_ENABLE_DEBUG_PANEL: 'false' } as ImportMetaEnv),
    ).toEqual({
      appEnv: 'staging',
      debugPanelEnabled: false,
    });
    expect(loadAppConfig({ VITE_APP_ENV: 'production' } as ImportMetaEnv)).toEqual({
      appEnv: 'production',
      debugPanelEnabled: false,
    });
    expect(loadAppConfig({ VITE_APP_ENV: 'test', VITE_ENABLE_DEBUG_PANEL: 'TRUE' } as ImportMetaEnv)).toEqual(
      {
        appEnv: 'test',
        debugPanelEnabled: false,
      },
    );
  });

  it('throws for missing or unsupported app environments', () => {
    expect(() => loadAppConfig({} as ImportMetaEnv)).toThrow('Invalid VITE_APP_ENV: (missing)');
    expect(() => loadAppConfig({ VITE_APP_ENV: 'qa' } as ImportMetaEnv)).toThrow('Invalid VITE_APP_ENV: qa');
  });
});
