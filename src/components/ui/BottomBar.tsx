import { useId, useReducer, useState, useTransition, type FormEvent } from 'react';
import { APP_COPY, type AppLocale } from '@/lib';
import { SCENARIOS, type ScenarioType } from '@/simulation/scenarios';
import {
  buildCurrentTimeLog,
  buildSimulationTimeline,
  exportTimeLogCsv,
  formatElapsedMilliseconds,
  secondsToMilliseconds,
  TIME_SCALE_OPTIONS,
} from '@/simulation/simulationTime';
import { isTimeScale, type TimeScale } from '@/simulation/simulationSnapshot';
import { formatTime } from '@/utils';
import { Download, PauseCircle, PlayCircle, RotateCcw, ServerCog, Upload } from './icons';
import { ScenarioSelector } from './ScenarioSelector';
import './BottomBar.css';

type BottomBarProps = {
  elapsedMilliseconds?: number;
  elapsedSeconds: number;
  isPaused: boolean;
  locale?: AppLocale;
  onExportSnapshot: () => string;
  onImportSnapshot: (json: string) => boolean;
  onJumpToTime: (seconds: number) => void;
  onPauseToggle: () => void;
  onReset: () => void;
  onRewind: (seconds: number) => void;
  onScenarioChange: (scenario: ScenarioType) => void;
  onTimeScaleChange: (timeScale: TimeScale) => void;
  scenarioType: ScenarioType;
  timeScale: TimeScale;
};

type SnapshotStatus = 'exported' | 'idle' | 'imported' | 'invalidJson' | 'timeCsv';

type BottomBarFormValues = {
  jumpValue: string;
  snapshotJson: string;
  timeScale: number;
};

type BottomBarFormAction =
  | { type: 'jump'; value: string }
  | { type: 'snapshot'; value: string }
  | { type: 'timeScale'; value: number };

function bottomBarFormReducer(state: BottomBarFormValues, action: BottomBarFormAction): BottomBarFormValues {
  if (action.type === 'jump') return { ...state, jumpValue: action.value };
  if (action.type === 'snapshot') return { ...state, snapshotJson: action.value };
  return { ...state, timeScale: action.value };
}

// prettier-ignore
export function BottomBar({ elapsedSeconds, elapsedMilliseconds = secondsToMilliseconds(elapsedSeconds), isPaused, locale = 'ko', onExportSnapshot, onImportSnapshot, onJumpToTime, onPauseToggle, onReset, onRewind, onScenarioChange, onTimeScaleChange, scenarioType, timeScale }: BottomBarProps) {
  const copy = APP_COPY[locale].bottomBar;
  const [snapshotStatus, setSnapshotStatus] = useState<SnapshotStatus>('idle');
  const [isScenarioPending, startScenarioTransition] = useTransition();
  const scenarioLabel = locale === 'ko' ? SCENARIOS[scenarioType].koreanLabel : SCENARIOS[scenarioType].label;
  const timeline = buildSimulationTimeline({ elapsedMilliseconds });
  // prettier-ignore
  const [formState, dispatchForm] = useReducer(bottomBarFormReducer, { jumpValue: String(elapsedSeconds), snapshotJson: '', timeScale });
  // prettier-ignore
  const timeScaleId = useId(), jumpId = useId(), snapshotId = useId(), snapshotStatusId = useId();
  const isSnapshotInvalid = snapshotStatus === 'invalidJson';

  // prettier-ignore
  const handleExport = () => { dispatchForm({ type: 'snapshot', value: onExportSnapshot() }); setSnapshotStatus('exported'); };

  // prettier-ignore
  const handleTimeCsvExport = () => {
    dispatchForm({ type: 'snapshot', value: exportTimeLogCsv(buildCurrentTimeLog({ elapsedSeconds: timeline.elapsedSeconds, isPaused, scenarioLabel, timeScale, timeZone: timeline.timeZone })) });
    setSnapshotStatus('timeCsv');
  };

  // prettier-ignore
  const handleImport = () => setSnapshotStatus(onImportSnapshot(formState.snapshotJson) ? 'imported' : 'invalidJson');

  // prettier-ignore
  const handleJump = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const nextSeconds = Number(formState.jumpValue); if (Number.isFinite(nextSeconds)) onJumpToTime(nextSeconds); };

  // prettier-ignore
  return (
    <footer className="bottom-bar" data-scenario-pending={isScenarioPending}>
      <div>
        <span>{copy.simulationTime}</span>
        <strong data-testid="primary-simulation-time">{formatTime(elapsedSeconds)}</strong>
      </div>
      <ScenarioSelector locale={locale} onChange={(nextScenario) => startScenarioTransition(() => onScenarioChange(nextScenario))} value={scenarioType} />
      <div><span>{copy.currentScenario}</span><strong>{scenarioLabel}</strong></div>
      <div><span>{locale === 'ko' ? '환자 정보' : 'Patient info'}</span><strong>{copy.patientInfo}</strong></div>
      <div className="timeline-readout">
        <span>{locale === 'ko' ? '정밀 시간' : 'Precise time'}</span>
        <strong>{formatElapsedMilliseconds(timeline.elapsedMilliseconds, true)}</strong>
        <small>
          {timeline.simulationClock24h} / {timeline.simulationClock12h} · {timeline.timeZone}
        </small>
      </div>
      <div className="timeline-readout">
        <span>{locale === 'ko' ? '남은 시간' : 'Remaining'}</span>
        <strong>{formatElapsedMilliseconds(secondsToMilliseconds(timeline.remainingSeconds))}</strong>
        <small>{isPaused ? (locale === 'ko' ? '정지' : 'Paused') : `${timeScale}x realtime`}</small>
      </div>
      <form aria-label="Simulation time controls" className="time-controls" role="form" onSubmit={handleJump}>
        <label htmlFor={timeScaleId}><span>{copy.speed}</span><select aria-label={copy.simulationSpeed} id={timeScaleId} onChange={(event) => { const nextScale = Number(event.target.value); dispatchForm({ type: 'timeScale', value: nextScale }); if (isTimeScale(nextScale)) onTimeScaleChange(nextScale); }} value={formState.timeScale}>{TIME_SCALE_OPTIONS.map((option) => <option key={option} value={option}>{option}x</option>)}</select></label>
        <button type="button" onClick={() => onRewind(5)}>-5s</button>
        <button type="button" onClick={() => onRewind(30)}>-30s</button>
        <button type="button" onClick={() => onRewind(60)}>-1m</button>
        <button type="button" onClick={() => onRewind(300)}>-5m</button>
        <button type="button" onClick={() => onJumpToTime(elapsedSeconds + 5)}>+5s</button>
        <button type="button" onClick={() => onJumpToTime(elapsedSeconds + 60)}>+1m</button>
        <button type="button" onClick={() => onJumpToTime(elapsedSeconds + 3600)}>+1h</button>
        <label htmlFor={jumpId}><span>{copy.jump}</span><input aria-invalid={!Number.isFinite(Number(formState.jumpValue))} aria-label={copy.jumpAria} aria-required="true" id={jumpId} inputMode="numeric" min="0" onChange={(event) => dispatchForm({ type: 'jump', value: event.target.value })} required type="number" value={formState.jumpValue} /></label>
        <button type="submit">{copy.move}</button>
      </form>
      <div className="timeline-slider">
        <label>
          <span>{locale === 'ko' ? '타임라인' : 'Timeline'}</span>
          <input aria-label={locale === 'ko' ? '시간 슬라이더' : 'Timeline slider'} max={3600} min={0} onChange={(event) => onJumpToTime(Number(event.target.value))} step={1} type="range" value={Math.min(3600, Math.floor(timeline.elapsedSeconds))} />
        </label>
        <small>{timeline.elapsedPercent}% · {timeline.markers.map((marker) => marker.label).join(' / ')}</small>
      </div>
      <div className="snapshot-controls">
        <label htmlFor={snapshotId}><span>{copy.snapshotJson}</span><textarea aria-describedby={snapshotStatusId} aria-invalid={isSnapshotInvalid} aria-label={copy.simulationJson} id={snapshotId} onChange={(event) => dispatchForm({ type: 'snapshot', value: event.target.value })} value={formState.snapshotJson} /></label>
        <strong aria-atomic="true" id={snapshotStatusId} role={isSnapshotInvalid ? 'alert' : 'status'}>{copy[snapshotStatus]}</strong>
      </div>
      <button type="button" onClick={handleExport}><Download size={18} /> {copy.exportJson}</button>
      <button type="button" onClick={handleTimeCsvExport}><Download size={18} /> {locale === 'ko' ? '시간 CSV' : 'Time CSV'}</button>
      <button type="button" onClick={handleImport}><Upload size={18} /> {copy.importJson}</button>
      <button aria-disabled={isScenarioPending} disabled={isScenarioPending} type="button"><ServerCog size={19} /> {copy.scenarioChange}</button>
      <button type="button" onClick={onPauseToggle}>{isPaused ? <PlayCircle size={19} /> : <PauseCircle size={19} />}{isPaused ? copy.resume : copy.pause}</button>
      <button type="button" onClick={onReset}><RotateCcw size={19} /> {locale === 'ko' ? '초기화' : 'Reset'}</button>
    </footer>
  );
}
