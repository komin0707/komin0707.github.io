import { type KeyboardEvent, useMemo, useState } from 'react';
import { SliderControl } from '@/components/ui';
import { Activity, Bell, Download, History, RotateCcw, Settings } from '@/components/ui/icons';
import { sanitizePlainTextInput } from '@/lib';
import { DEFAULT_SETTINGS, type VentSettings } from '@/simulation/scenarios';
import { Panel } from './Panel';
import './SettingsPanel.css';

type SettingsPanelProps = {
  settings: VentSettings;
  onChange: <K extends keyof VentSettings>(key: K, value: VentSettings[K]) => void;
};

type NumericVentSettingKey = {
  [K in keyof VentSettings]: VentSettings[K] extends number ? K : never;
}[keyof VentSettings];

type SettingsSliderConfig = {
  dangerHigh?: number;
  dangerLow?: number;
  key: NumericVentSettingKey;
  label: string;
  max: number;
  min: number;
  recommendedMax: number;
  recommendedMin: number;
  step: number;
};

const SETTINGS_SLIDERS: readonly SettingsSliderConfig[] = [
  {
    dangerHigh: 80,
    key: 'fio2',
    label: 'FiO2 (%)',
    max: 100,
    min: 21,
    recommendedMax: 60,
    recommendedMin: 21,
    step: 1,
  },
  {
    dangerHigh: 700,
    dangerLow: 250,
    key: 'tidalVolume',
    label: 'Tidal Volume (mL)',
    max: 1000,
    min: 100,
    recommendedMax: 520,
    recommendedMin: 360,
    step: 10,
  },
  {
    dangerHigh: 35,
    dangerLow: 8,
    key: 'respiratoryRate',
    label: 'Respiratory Rate (/min)',
    max: 40,
    min: 4,
    recommendedMax: 24,
    recommendedMin: 12,
    step: 1,
  },
  {
    dangerHigh: 16,
    key: 'peep',
    label: 'PEEP (cmH2O)',
    max: 20,
    min: 0,
    recommendedMax: 12,
    recommendedMin: 5,
    step: 1,
  },
  {
    dangerHigh: 2.2,
    dangerLow: 0.5,
    key: 'inspiratoryTime',
    label: 'Inspiratory Time (sec)',
    max: 3,
    min: 0.1,
    recommendedMax: 1.2,
    recommendedMin: 0.8,
    step: 0.1,
  },
  {
    dangerHigh: 90,
    dangerLow: 20,
    key: 'flow',
    label: 'Flow (L/min)',
    max: 100,
    min: 10,
    recommendedMax: 70,
    recommendedMin: 40,
    step: 1,
  },
  {
    dangerHigh: 8,
    key: 'trigger',
    label: 'Trigger (L/min)',
    max: 15,
    min: 0.5,
    recommendedMax: 4,
    recommendedMin: 1,
    step: 0.1,
  },
];

const SETTINGS_PRESETS: Record<string, VentSettings> = {
  ARDS: { ...DEFAULT_SETTINGS, fio2: 70, flow: 60, peep: 12, respiratoryRate: 24, tidalVolume: 360 },
  COPD: {
    ...DEFAULT_SETTINGS,
    fio2: 32,
    flow: 70,
    inspiratoryTime: 0.8,
    peep: 5,
    respiratoryRate: 10,
    tidalVolume: 520,
  },
  Normal: DEFAULT_SETTINGS,
};

type SettingHistoryEntry = {
  key: keyof VentSettings | 'preset';
  next: number | string;
  previous: number | string;
  reason: string;
};

export function SettingsPanel({ settings, onChange }: SettingsPanelProps) {
  const settingsValuesId = 'settings-values';
  const reasonDescriptionId = 'settings-reason-description';
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [compactLayout, setCompactLayout] = useState(false);
  const [locked, setLocked] = useState(false);
  const [reason, setReason] = useState('');
  const [history, setHistory] = useState<SettingHistoryEntry[]>([]);
  const [redoStack, setRedoStack] = useState<SettingHistoryEntry[]>([]);
  const [exportStatus, setExportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const lastFive = useMemo(() => history.slice(-5).reverse(), [history]);

  const recordChange = (entry: SettingHistoryEntry) => {
    setHistory((items) => [...items.slice(-19), entry]);
    setRedoStack([]);
  };

  const handleChange = <K extends keyof VentSettings>(key: K, value: VentSettings[K]) => {
    if (locked) return;
    recordChange({
      key,
      next: String(value),
      previous: String(settings[key]),
      reason: reason || 'No reason entered',
    });
    onChange(key, value);
  };

  const applyPreset = (presetName: keyof typeof SETTINGS_PRESETS) => {
    if (locked) return;
    const preset = SETTINGS_PRESETS[presetName];
    if (!preset) return;
    recordChange({
      key: 'preset',
      next: presetName,
      previous: settings.mode,
      reason: reason || 'Preset applied',
    });
    for (const slider of SETTINGS_SLIDERS) {
      onChange(slider.key, preset[slider.key]);
    }
  };

  const undoLast = () => {
    const entry = history.at(-1);
    if (!entry || entry.key === 'preset') return;
    setHistory((items) => items.slice(0, -1));
    setRedoStack((items) => [...items, entry]);
    onChange(entry.key, Number(entry.previous) as VentSettings[typeof entry.key]);
  };

  const redoLast = () => {
    const entry = redoStack.at(-1);
    if (!entry || entry.key === 'preset') return;
    setRedoStack((items) => items.slice(0, -1));
    setHistory((items) => [...items, entry]);
    onChange(entry.key, Number(entry.next) as VentSettings[typeof entry.key]);
  };

  const handlePanelKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (locked || (!event.ctrlKey && !event.metaKey)) return;
    const key = event.key.toLowerCase();
    if (key === 'z' && !event.shiftKey) {
      event.preventDefault();
      undoLast();
      return;
    }
    if (key === 'y' || (key === 'z' && event.shiftKey)) {
      event.preventDefault();
      redoLast();
    }
  };

  const exportSettings = () => {
    setExportStatus('loading');
    try {
      const payload = JSON.stringify({ auditLog: history, reason, settings }, null, 2);
      if (typeof URL.createObjectURL === 'function') {
        const link = document.createElement('a');
        link.download = 'vent-settings-audit.json';
        link.href = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
        link.click();
        URL.revokeObjectURL(link.href);
      }
      setExportStatus('success');
    } catch {
      setExportStatus('error');
    }
  };

  return (
    <Panel.Aside
      aria-label="인공호흡기 설정 폼"
      className={`settings-panel ${isFullscreen ? 'settings-fullscreen' : ''}`}
      data-layout={compactLayout ? 'compact' : 'standard'}
      data-locked={locked}
      data-minimized={isMinimized}
      onKeyDown={handlePanelKeyDown}
    >
      <Panel.Heading>
        설정 <span>(SETTINGS)</span>
      </Panel.Heading>
      <div className="settings-panel-toolbar" aria-label="Settings panel controls" role="group">
        <button
          aria-controls={settingsValuesId}
          aria-expanded={!isMinimized}
          aria-label="Minimize settings panel"
          type="button"
          onClick={() => setIsMinimized((value) => !value)}
        >
          Min
        </button>
        <button
          aria-label="Fullscreen settings panel"
          aria-pressed={isFullscreen}
          type="button"
          onClick={() => setIsFullscreen((value) => !value)}
        >
          Full
        </button>
        <button
          aria-label="Change settings panel layout"
          aria-pressed={compactLayout}
          type="button"
          onClick={() => setCompactLayout((value) => !value)}
        >
          <Settings size={14} /> Layout
        </button>
        <button
          aria-disabled={history.length === 0 || locked}
          aria-label="Undo settings change"
          disabled={history.length === 0 || locked}
          type="button"
          onClick={undoLast}
        >
          <RotateCcw size={14} /> Undo
        </button>
        <button
          aria-disabled={redoStack.length === 0 || locked}
          aria-label="Redo settings change"
          disabled={redoStack.length === 0 || locked}
          type="button"
          onClick={redoLast}
        >
          <History size={14} /> Redo
        </button>
        <button
          aria-busy={exportStatus === 'loading'}
          aria-label="Export settings audit"
          className={exportStatus}
          type="button"
          onClick={exportSettings}
        >
          <Download size={14} /> Export
        </button>
        <button
          aria-label="Admin settings lock"
          aria-pressed={locked}
          type="button"
          onClick={() => setLocked((value) => !value)}
        >
          {locked ? 'Unlock' : 'Lock'}
        </button>
      </div>
      <label className="settings-reason">
        <span>Reason</span>
        <input
          aria-describedby={reasonDescriptionId}
          aria-invalid={reason.length > 120}
          aria-required="false"
          value={reason}
          onChange={(event) => setReason(sanitizePlainTextInput(event.target.value, 120))}
          placeholder="optional change reason"
        />
        <small id={reasonDescriptionId}>Optional audit reason, maximum 120 characters.</small>
      </label>
      <div className="settings-presets" aria-label="Settings presets" role="group">
        {Object.keys(SETTINGS_PRESETS).map((presetName) => (
          <button disabled={locked} key={presetName} type="button" onClick={() => applyPreset(presetName)}>
            {presetName}
          </button>
        ))}
      </div>
      <fieldset aria-hidden={isMinimized} id={settingsValuesId}>
        <legend>환기 설정값</legend>
        {!isMinimized &&
          SETTINGS_SLIDERS.map((slider) => (
            <SliderControl
              dangerHigh={slider.dangerHigh}
              dangerLow={slider.dangerLow}
              defaultValue={DEFAULT_SETTINGS[slider.key]}
              disabled={locked}
              key={slider.key}
              label={slider.label}
              locked={locked}
              max={slider.max}
              min={slider.min}
              recommendedMax={slider.recommendedMax}
              recommendedMin={slider.recommendedMin}
              step={slider.step}
              value={settings[slider.key]}
              onChange={(value) => handleChange(slider.key, value)}
            />
          ))}
      </fieldset>
      <div
        className="settings-audit-log"
        aria-atomic="true"
        aria-label="settings change audit log"
        aria-live="polite"
        aria-relevant="additions text"
        role="status"
      >
        {lastFive.map((entry, index) => (
          <small key={`${entry.key}-${index}`}>
            {String(entry.key)} {entry.previous} → {entry.next} · {entry.reason}
          </small>
        ))}
      </div>
      <div className="settings-footer-actions">
        <button className="success" type="button">
          <Activity size={23} /> 환자 상태
        </button>
        <button className={locked ? 'error' : ''} type="button">
          <Bell size={21} /> 알람 설정
        </button>
      </div>
    </Panel.Aside>
  );
}
