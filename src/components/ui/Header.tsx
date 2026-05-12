import { useState, type KeyboardEvent, type ReactNode } from 'react';
import { APP_COPY, LOCALE_OPTIONS, type AppLocale } from '@/lib';
import { VENT_MODES, type VentMode } from '@/simulation/scenarios';
import { Eye, HelpCircle, Languages, Settings, Volume2 } from './icons';
import './Header.css';

const MODES = VENT_MODES;

type HeaderProps = {
  isColorblindPalette: boolean;
  locale?: AppLocale;
  mode: VentMode;
  onLocaleAutoDetect?: () => void;
  onLocaleChange?: (locale: AppLocale) => void;
  onLocaleToggle?: () => void;
  onModeChange: (mode: VentMode) => void;
  onPaletteToggle: () => void;
};

export function Header(props: HeaderProps): ReactNode {
  const {
    isColorblindPalette,
    locale = 'ko',
    mode,
    onLocaleAutoDetect,
    onLocaleChange,
    onLocaleToggle,
    onModeChange,
    onPaletteToggle,
  } = props;
  const copy = APP_COPY[locale].header;
  const [previewMode, setPreviewMode] = useState<VentMode | null>(null);
  const [confirmedMode, setConfirmedMode] = useState<VentMode | null>(null);

  const handleModeChange = (nextMode: VentMode) => {
    setConfirmedMode(nextMode);
    onModeChange(nextMode);
  };

  const handleModeKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const tabs = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button'));
    const currentIndex = tabs.findIndex((tab) => tab === document.activeElement);
    const direction = event.key === 'ArrowRight' ? 1 : -1;
    tabs[(currentIndex + direction + tabs.length) % tabs.length]?.focus();
  };

  return (
    <header className="top-header">
      <h1 id="app-title">VENT SIMULATOR 2D</h1>
      <nav className="mode-tabs" aria-label="Ventilator mode" role="navigation" onKeyDown={handleModeKeyDown}>
        {MODES.map((item) => (
          <button
            aria-current={item === mode ? 'page' : undefined}
            className={item === mode ? 'active' : ''}
            data-confirmed={confirmedMode === item}
            data-preview={previewMode === item}
            key={item}
            onBlur={() => setPreviewMode(null)}
            onClick={() => handleModeChange(item)}
            onFocus={() => setPreviewMode(item)}
            onMouseEnter={() => setPreviewMode(item)}
            onMouseLeave={() => setPreviewMode(null)}
            title="Confirm mode change"
            type="button"
          >
            {item === 'AC' ? 'A/C' : item === 'VC' ? 'V/C' : item === 'PC' ? 'P/C' : item}
          </button>
        ))}
        <span className="mode-preview" aria-live="polite">
          Preview {previewMode ?? mode} · confirmation armed
        </span>
      </nav>
      <div className="header-actions">
        <button
          aria-label={copy.colorblindPalette}
          aria-pressed={isColorblindPalette}
          className={isColorblindPalette ? 'active' : ''}
          onClick={onPaletteToggle}
          type="button"
        >
          <Eye size={21} />
        </button>
        <button aria-label={copy.language} type="button" onClick={onLocaleToggle}>
          <Languages size={21} />
        </button>
        <label className="language-select">
          <span className="sr-only">{copy.languageSelect}</span>
          <select
            aria-label={copy.languageSelect}
            onChange={(event) => {
              if (event.target.value === 'auto') {
                onLocaleAutoDetect?.();
                return;
              }
              onLocaleChange?.(event.target.value as AppLocale);
            }}
            value={locale}
          >
            <option value="auto">Auto browser</option>
            {LOCALE_OPTIONS.map((option) => (
              <option key={option.code} value={option.code}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <button aria-label={copy.help} type="button">
          <HelpCircle size={21} />
        </button>
        <button aria-label={copy.sound} type="button">
          <Volume2 size={22} />
        </button>
        <button aria-label={copy.settings} type="button">
          <Settings size={23} />
        </button>
      </div>
    </header>
  );
}
