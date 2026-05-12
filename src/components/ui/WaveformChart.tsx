import { memo, useEffect, useMemo, useState } from 'react';
import type { Scenario, VentSettings } from '@/simulation/scenarios';
import type { DerivedVitals } from '@/simulation/ventilatorModel';
import type { WaveformKind } from '@/simulation/waveformGenerator';
import { getInitialWaveformPolyline, requestWaveformPolyline } from '@/simulation/waveformWorkerClient';
import { Download, Eye, History, Pause, Play, Printer, ZoomIn, ZoomOut } from './icons';

type WaveformChartProps = {
  color: string;
  isPaused: boolean;
  kind: WaveformKind;
  label: string;
  maxLabel: string;
  minLabel: string;
  scenario: Scenario;
  settings: VentSettings;
  showAnalysisTools?: boolean;
  unit: string;
  valueLabel: string;
  vitals: DerivedVitals;
};

const WAVEFORM_COLOR_OPTIONS = ['default', '#ffd84a', '#35d27f', '#f8fcff', '#56b8ff', '#2dd4bf'] as const;
const SVG_HEIGHT = 88;

function getWaveformFlags({
  kind,
  scenario,
  settings,
  vitals,
}: Pick<WaveformChartProps, 'kind' | 'scenario' | 'settings' | 'vitals'>) {
  const spontaneous = ['PSV', 'CPAP', 'BiPAP', 'NIV'].includes(settings.mode);
  return {
    abnormal:
      (kind === 'pressure' && vitals.pip > 28) ||
      (kind === 'flow' && scenario.type === 'airwayObstruction') ||
      (kind === 'volume' && vitals.vte < 320) ||
      (kind === 'co2' && (vitals.etco2 > 45 || vitals.etco2 < 30)) ||
      (kind === 'pleth' && vitals.spo2 < 92) ||
      (kind === 'ibp' && (vitals.meanArterialPressure < 65 || vitals.systolicBloodPressure > 180)) ||
      (kind === 'cvp' && vitals.peep > 16) ||
      (kind === 'pap' && vitals.pao2fio2 < 200) ||
      (kind === 'eeg' && (vitals.paco2 > 55 || vitals.spo2 < 88)),
    cycling: kind === 'flow' || kind === 'volume',
    overDistention: kind === 'pressure' && vitals.plateau > 30,
    spontaneous,
    trigger: spontaneous || settings.trigger > 5,
    underDistention: kind === 'volume' && vitals.vte < 350,
  };
}

function getWaveformStats(polyline: string, maxLabel: string, minLabel: string) {
  const max = Number(maxLabel);
  const min = Number(minLabel);
  const range = max - min;
  if (!Number.isFinite(max) || !Number.isFinite(min) || range <= 0) return null;

  const values = polyline
    .split(' ')
    .map((point) => Number(point.split(',')[1]))
    .filter(Number.isFinite)
    .map((y) => Math.round(max - (y / SVG_HEIGHT) * range));

  if (values.length === 0) return null;
  const total = values.reduce((sum, value) => sum + value, 0);
  return {
    average: Math.round(total / values.length),
    maximum: Math.max(...values),
    minimum: Math.min(...values),
  };
}

function downloadTextFile(filename: string, mimeType: string, text: string) {
  if (typeof URL.createObjectURL !== 'function') return;
  const link = document.createElement('a');
  link.download = filename;
  link.href = URL.createObjectURL(new Blob([text], { type: mimeType }));
  link.click();
  URL.revokeObjectURL(link.href);
}

function resolveCanvasStrokeColor(color: string, kind: WaveformKind) {
  if (!color.startsWith('var(')) return color;
  const waveformColors: Partial<Record<WaveformKind, string>> = {
    co2: '#56b8ff',
    flow: '#35d27f',
    pleth: '#2dd4bf',
    pressure: '#ffd84a',
    volume: '#f8fcff',
  };
  return waveformColors[kind] ?? '#f8fcff';
}

function exportWaveformPng(label: string, kind: WaveformKind, color: string, polyline: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 660;
  canvas.height = 176;
  const context = canvas.getContext('2d');

  if (!context || typeof canvas.toBlob !== 'function') {
    downloadTextFile(
      `${label}-${kind}-waveform.svg`,
      'image/svg+xml',
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 330 88"><polyline fill="none" stroke="${color}" stroke-width="2" points="${polyline}"/></svg>`,
    );
    return;
  }

  context.fillStyle = '#020e19';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = resolveCanvasStrokeColor(color, kind);
  context.lineWidth = 4;
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.beginPath();
  for (const [index, point] of polyline.split(' ').entries()) {
    const [x = 0, y = 0] = point.split(',').map(Number);
    if (index === 0) context.moveTo(x * 2, y * 2);
    else context.lineTo(x * 2, y * 2);
  }
  context.stroke();
  canvas.toBlob((blob) => {
    if (!blob || typeof URL.createObjectURL !== 'function') return;
    const link = document.createElement('a');
    link.download = `${label}-${kind}-waveform.png`;
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
  }, 'image/png');
}

// prettier-ignore
export function WaveformChart({ color, isPaused, kind, label, maxLabel, minLabel, scenario, settings, showAnalysisTools = true, unit, valueLabel, vitals }: WaveformChartProps) {
  const [phase, setPhase] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [historyOffsetSeconds, setHistoryOffsetSeconds] = useState(0);
  const [isFrozen, setIsFrozen] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [showCaliper, setShowCaliper] = useState(false);
  const [customColor, setCustomColor] = useState('default');
  const [scrollSpeed, setScrollSpeed] = useState(1);
  const flags = useMemo(() => getWaveformFlags({ kind, scenario, settings, vitals }), [kind, scenario, settings, vitals]);
  const timeWindowSeconds = Math.round(10 / zoom);
  const inspirationRatio = Math.min(0.6, settings.inspiratoryTime / (60 / settings.respiratoryRate));
  const triggerX = Math.max(10, inspirationRatio * 330 * 0.22);
  const cycleX = inspirationRatio * 330;
  const chartColor = customColor === 'default' ? color : customColor;
  const effectivePaused = isPaused || isFrozen;
  // prettier-ignore
  const waveformOptions = useMemo(() => ({ historyOffsetSeconds, kind, paused: effectivePaused, phase, scenario, settings, vitals, zoom }), [historyOffsetSeconds, effectivePaused, kind, phase, scenario, settings, vitals, zoom]);
  const [polyline, setPolyline] = useState(() => getInitialWaveformPolyline(waveformOptions));
  const waveformStats = useMemo(() => getWaveformStats(polyline, maxLabel, minLabel), [maxLabel, minLabel, polyline]);
  const gridLines = useMemo(() => Array.from({ length: 10 }, (_, index) => (index + 1) * 33), []);
  const timeLabels = useMemo(() => Array.from({ length: 6 }, (_, index) => index * (timeWindowSeconds / 5)), [timeWindowSeconds]);

  // prettier-ignore
  useEffect(() => { let active = true; void requestWaveformPolyline(waveformOptions).then((nextPolyline) => { if (active) setPolyline(nextPolyline); }); return () => { active = false; }; }, [waveformOptions]);

  // prettier-ignore
  useEffect(() => { let frame = 0; let last = performance.now(); const tick = (now: number) => { if (!effectivePaused) { const delta = (now - last) / 1000; setPhase((current) => (current + delta * Math.max(0.18, vitals.totalRR / 34) * scrollSpeed) % 1); } last = now; frame = window.requestAnimationFrame(tick); }; frame = window.requestAnimationFrame(tick); return () => window.cancelAnimationFrame(frame); }, [effectivePaused, scrollSpeed, vitals.totalRR]);

  const exportCsv = () => downloadTextFile(`${label}-${kind}-waveform.csv`, 'text/csv', `kind,label,points\n${kind},${label},"${polyline}"\n`);
  const exportPng = () => exportWaveformPng(label, kind, chartColor, polyline);

  // prettier-ignore
  return (
    <article className={`wave-card ${flags.abnormal ? 'abnormal-wave' : ''} ${effectivePaused ? 'frozen-wave' : ''}`} data-waveform-kind={kind} data-waveform-label={label} data-caliper-active={showCaliper} data-grid-visible={showGrid} data-labels-visible={showLabels} data-scroll-speed={scrollSpeed}>
      <div className="wave-title"><span style={{ color }}>{label}</span><small>{unit}</small></div>
      <div className="wave-controls" aria-label={`${label} controls`} role="group">
        {showAnalysisTools ? <button aria-label={`${label} ${isFrozen ? 'resume waveform' : 'freeze waveform'}`} type="button" onClick={() => setIsFrozen((value) => !value)}>{isFrozen ? <Play size={13} /> : <Pause size={13} />}</button> : null}
        <button aria-label={`${label} zoom in`} type="button" onClick={() => setZoom((value) => Math.min(4, value * 2))}><ZoomIn size={13} /></button>
        <button aria-label={`${label} zoom out`} type="button" onClick={() => setZoom((value) => Math.max(1, value / 2))}><ZoomOut size={13} /></button>
        <button aria-label={`${label} history back`} type="button" onClick={() => setHistoryOffsetSeconds((value) => (value + timeWindowSeconds) % 60)}><History size={13} /></button>
        {showAnalysisTools ? <button aria-label={`${label} toggle grid`} type="button" onClick={() => setShowGrid((value) => !value)}><Eye size={13} /></button> : null}
        {showAnalysisTools ? <button aria-label={`${label} caliper measure`} type="button" onClick={() => setShowCaliper((value) => !value)}>Cal</button> : null}
        {showAnalysisTools ? <button aria-label={`${label} export PNG`} type="button" onClick={exportPng}><Download size={13} /></button> : null}
        {showAnalysisTools ? <button aria-label={`${label} export CSV`} type="button" onClick={exportCsv}>CSV</button> : null}
        {showAnalysisTools ? <button aria-label={`${label} print waveform`} type="button" onClick={() => window.print()}><Printer size={13} /></button> : null}
      </div>
      {showAnalysisTools ? <div className="wave-analysis-tools" aria-label={`${label} analysis tools`} role="group">
        <label>Speed <select aria-label={`${label} scroll speed`} value={scrollSpeed} onChange={(event) => setScrollSpeed(Number(event.target.value))}><option value={0.5}>0.5x</option><option value={1}>1x</option><option value={2}>2x</option></select></label>
        <label>Color <select aria-label={`${label} custom color`} value={customColor} onChange={(event) => setCustomColor(event.target.value)}>{WAVEFORM_COLOR_OPTIONS.map((option) => <option key={option} value={option}>{option === 'default' ? 'Default' : option}</option>)}</select></label>
        <button aria-label={`${label} toggle labels`} type="button" onClick={() => setShowLabels((value) => !value)}>Labels</button>
      </div> : null}
      <WaveBody chartColor={chartColor} cycleX={cycleX} flags={flags} gridLines={gridLines} historyOffsetSeconds={historyOffsetSeconds} label={label} maxLabel={maxLabel} minLabel={minLabel} polyline={polyline} showCaliper={showCaliper} showGrid={showGrid} showLabels={showLabels} timeLabels={timeLabels} timeWindowSeconds={timeWindowSeconds} triggerX={triggerX} />
      <div className="wave-value"><strong>{valueLabel}</strong>{waveformStats ? <small>min {waveformStats.minimum} max {waveformStats.maximum} avg {waveformStats.average}</small> : null}</div>
      <div className="wave-badges" aria-label={`${label} markers`} role="group">
        {flags.abnormal ? <span>Abnormal</span> : null}{flags.overDistention ? <span>Over-distention</span> : null}{flags.underDistention ? <span>Under-distention</span> : null}{flags.spontaneous ? <span>Spontaneous</span> : null}{flags.trigger ? <span>Trigger</span> : null}{flags.cycling ? <span>Cycling</span> : null}
      </div>
    </article>
  );
}

const WaveBody = memo(function WaveBody({
  chartColor,
  cycleX,
  flags,
  gridLines,
  historyOffsetSeconds,
  label,
  maxLabel,
  minLabel,
  polyline,
  showCaliper,
  showGrid,
  showLabels,
  timeLabels,
  timeWindowSeconds,
  triggerX,
}: Readonly<{
  chartColor: string;
  cycleX: number;
  flags: ReturnType<typeof getWaveformFlags>;
  gridLines: readonly number[];
  historyOffsetSeconds: number;
  label: string;
  maxLabel: string;
  minLabel: string;
  polyline: string;
  showCaliper: boolean;
  showGrid: boolean;
  showLabels: boolean;
  timeLabels: readonly number[];
  timeWindowSeconds: number;
  triggerX: number;
}>) {
  return (
    <div className="wave-body">
      {showLabels ? <span className="axis-label top">{maxLabel}</span> : null}
      <svg aria-label={`${label} waveform data`} preserveAspectRatio="none" role="img" viewBox="0 0 330 88">
        {showGrid ? (
          <g className="wave-grid" aria-label="0.5 sec and 1 sec grid" role="group">
            <line x1="0" y1="22" x2="330" y2="22" />
            <line x1="0" y1="44" x2="330" y2="44" />
            <line x1="0" y1="66" x2="330" y2="66" />
            {gridLines.map((x, index) => (
              <line
                className={index % 2 === 1 ? 'major-grid-line' : 'minor-grid-line'}
                key={x}
                x1={x}
                y1="0"
                x2={x}
                y2="88"
              />
            ))}
          </g>
        ) : null}
        {flags.trigger ? (
          <line className="wave-trigger-marker" x1={triggerX} y1="0" x2={triggerX} y2="88" />
        ) : null}
        {flags.cycling ? <line className="wave-cycle-marker" x1={cycleX} y1="0" x2={cycleX} y2="88" /> : null}
        {showCaliper ? (
          <g className="wave-caliper" aria-label={`${label} caliper measurement`} role="group">
            <line x1="104" y1="8" x2="104" y2="80" />
            <line x1="226" y1="8" x2="226" y2="80" />
            <line x1="104" y1="14" x2="226" y2="14" />
          </g>
        ) : null}
        <polyline
          className="waveform-trace"
          fill="none"
          points={polyline}
          stroke={chartColor}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {showLabels ? <span className="axis-label bottom">{minLabel}</span> : null}
      <span className="time-axis left">{historyOffsetSeconds}s</span>
      <span className="time-axis right">{historyOffsetSeconds + timeWindowSeconds}s</span>
      {showLabels ? (
        <div className="wave-time-ticks" aria-label={`${label} time axis seconds`} role="group">
          {timeLabels.map((tick) => (
            <span key={tick}>{Math.round(historyOffsetSeconds + tick)} sec</span>
          ))}
        </div>
      ) : null}
    </div>
  );
});
