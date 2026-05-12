type AppEnv = 'development' | 'staging' | 'production' | 'test';

type AppConfig = {
  appEnv: AppEnv;
  debugPanelEnabled: boolean;
};

const APP_ENVS = ['development', 'staging', 'production', 'test'] as const;

const readBoolean = (value: string | undefined): boolean => value === 'true';
const isAppEnv = (value: string | undefined): value is AppEnv =>
  APP_ENVS.includes(value as (typeof APP_ENVS)[number]);

export function loadAppConfig(env: ImportMetaEnv = import.meta.env): AppConfig {
  if (!isAppEnv(env.VITE_APP_ENV)) {
    throw new Error(`Invalid VITE_APP_ENV: ${env.VITE_APP_ENV ?? '(missing)'}`);
  }

  return {
    appEnv: env.VITE_APP_ENV,
    debugPanelEnabled: readBoolean(env.VITE_ENABLE_DEBUG_PANEL),
  };
}

export const APP_CONFIG = loadAppConfig();
