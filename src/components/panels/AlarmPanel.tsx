import { useEffect, useId, useMemo, useReducer, useState } from 'react';
import { AlertTriangle, Bell, BellOff, BellRing, Pause, Play, Volume2 } from '@/components/ui/icons';
import { sortAlarmsByPriority, type Alarm, type AlarmThresholds } from '@/simulation/ventilatorModel';
import './AlarmPanel.css';
import './Panel.css';

type AlarmPanelProps = {
  alarms: Alarm[];
  elapsedSeconds?: number;
  thresholds?: AlarmThresholds;
  onThresholdChange?: (key: keyof AlarmThresholds, value: number) => void;
};

type AlarmHistoryEntry = {
  id: string;
  label: string;
  category: Alarm['category'];
  priority: Alarm['priority'];
  generatedAtSeconds: number;
  resolvedAtSeconds: number | null;
  occurrenceCount: number;
};

type AlarmHistoryAction = {
  activeAlarmIds: ReadonlySet<string>;
  activeAlarms: readonly Alarm[];
  elapsedSeconds: number;
};

type AlarmProfile = 'adult' | 'ards' | 'copd';

const ALARM_PROFILES: Record<AlarmProfile, Partial<AlarmThresholds>> = {
  adult: {},
  ards: {
    highPressureWarning: 38,
    highPeep: 22,
    lowSpo2Warning: 90,
  },
  copd: {
    highCo2Warning: 65,
    highEtco2: 58,
    lowEtco2: 20,
  },
};

function alarmHistoryReducer(current: AlarmHistoryEntry[], action: AlarmHistoryAction) {
  const updated = current.map((entry) =>
    !action.activeAlarmIds.has(entry.id) && entry.resolvedAtSeconds === null
      ? { ...entry, resolvedAtSeconds: action.elapsedSeconds }
      : entry,
  );

  action.activeAlarms.forEach((alarm) => {
    const existingIndex = updated.findIndex(
      (entry) => entry.id === alarm.id && entry.resolvedAtSeconds === null,
    );
    const existingEntry = updated[existingIndex];
    if (existingEntry) {
      updated[existingIndex] = {
        ...existingEntry,
        category: alarm.category,
        priority: alarm.priority,
      };
      return;
    }

    const previousCount = updated
      .filter((entry) => entry.id === alarm.id)
      .reduce((count, entry) => Math.max(count, entry.occurrenceCount), 0);
    updated.unshift({
      id: alarm.id,
      label: alarm.label,
      category: alarm.category,
      priority: alarm.priority,
      generatedAtSeconds: alarm.generatedAtSeconds || action.elapsedSeconds,
      resolvedAtSeconds: null,
      occurrenceCount: previousCount + 1,
    });
  });

  return updated.slice(0, 8);
}

function formatAlarmTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function playAlarmTone() {
  const audioWindow = window as Window & { webkitAudioContext?: typeof AudioContext };
  const AudioContextClass = window.AudioContext ?? audioWindow.webkitAudioContext;
  if (!AudioContextClass) return;

  const audioContext = new AudioContextClass();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.frequency.value = 880;
  oscillator.type = 'square';
  gain.gain.setValueAtTime(0.04, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.18);
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.2);
}

function getToneLabel(priority: Alarm['priority']) {
  return priority === 'high' ? 'HIGH tone' : priority === 'medium' ? 'MED tone' : 'LOW tone';
}

/** Alarm console for active warnings, escalation history, thresholds, and notification controls. */
export function AlarmPanel({ alarms, elapsedSeconds = 0, onThresholdChange, thresholds }: AlarmPanelProps) {
  const [history, updateHistory] = useReducer(alarmHistoryReducer, []);
  // prettier-ignore
  const [muted, setMuted] = useState(false), [paused, setPaused] = useState(false), [audioEnabled, setAudioEnabled] = useState(false);
  const [mutedUntil, setMutedUntil] = useState(0);
  const [thresholdLocked, setThresholdLocked] = useState(false);
  const [riskCode, setRiskCode] = useState('');
  const [smartAlarmEnabled, setSmartAlarmEnabled] = useState(true);
  const [learningMode, setLearningMode] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<AlarmProfile>('adult');
  const [notificationStatus, setNotificationStatus] = useState<'off' | 'queued' | 'granted'>('off');
  const [snoozedUntil, setSnoozedUntil] = useState(0);
  // prettier-ignore
  const lowSpo2Id = useId(), highPressureId = useId(), lowPressureId = useId(), highMvId = useId(), lowMvId = useId(), highPeepId = useId(), lowPeepId = useId(), highEtco2Id = useId(), highCo2Id = useId(), criticalDialogTitleId = useId(), criticalDialogDescriptionId = useId();
  const activeAlarms = useMemo(() => sortAlarmsByPriority(alarms), [alarms]);
  const visibleAlarms = paused ? [] : activeAlarms;
  const activeAlarmIds = useMemo(() => new Set(activeAlarms.map((alarm) => alarm.id)), [activeAlarms]);
  const activeAlarmKey = activeAlarms.map((alarm) => alarm.id).join('|');
  const activeCriticalAlarms = activeAlarms.filter((alarm) => alarm.severity === 'critical');
  const criticalAlarmKey = activeCriticalAlarms.map((alarm) => alarm.id).join('|');
  const [dismissedCriticalAlarmKey, setDismissedCriticalAlarmKey] = useState('');
  const isTemporarilyMuted = mutedUntil > elapsedSeconds;
  const effectiveMuted = muted || isTemporarilyMuted;
  const isSnoozed = snoozedUntil > elapsedSeconds;
  const highPriorityCount = activeAlarms.filter((alarm) => alarm.priority === 'high').length;
  const falseAlarmCount = activeAlarms.filter((alarm) => alarm.isLikelyFalseAlarm).length;
  const averageLatencySeconds =
    activeAlarms.length === 0
      ? 0
      : Math.max(
          0,
          Math.round(
            activeAlarms.reduce(
              (total, alarm) => total + Math.max(0, elapsedSeconds - alarm.generatedAtSeconds),
              0,
            ) / activeAlarms.length,
          ),
        );
  const categoryStats = useMemo(
    () =>
      activeAlarms.reduce<Record<string, number>>((stats, alarm) => {
        stats[alarm.category] = (stats[alarm.category] ?? 0) + 1;
        return stats;
      }, {}),
    [activeAlarms],
  );
  const dangerousThresholdsUnlocked = riskCode === 'VENT';
  // prettier-ignore
  const shouldShowCriticalDialog = !paused && activeCriticalAlarms.length > 0 && dismissedCriticalAlarmKey !== criticalAlarmKey;
  // prettier-ignore
  useEffect(() => { updateHistory({ activeAlarmIds, activeAlarms, elapsedSeconds }); }, [activeAlarmIds, activeAlarmKey, activeAlarms, elapsedSeconds]);
  // prettier-ignore
  const requestMobileNotification = () => { setNotificationStatus('queued'); if ('Notification' in window && Notification.requestPermission) { void Notification.requestPermission().then((permission) => { if (permission !== 'granted') { setNotificationStatus('off'); return; } if ('serviceWorker' in navigator) { void navigator.serviceWorker.ready.then((registration) => { if (registration.showNotification) { void registration.showNotification('VENTSIM alarm', { body: activeAlarms[0]?.message ?? 'Ventilator alarm active', tag: 'ventsim-alarm' }); } setNotificationStatus('granted'); }); return; } setNotificationStatus('granted'); }); return; } setNotificationStatus('granted'); };
  const applyProfile = (profile: AlarmProfile) => {
    setSelectedProfile(profile);
    if (!onThresholdChange) return;
    Object.entries(ALARM_PROFILES[profile]).forEach(([key, value]) => {
      if (typeof value === 'number') onThresholdChange(key as keyof AlarmThresholds, value);
    });
  };
  // prettier-ignore
  return (
    <section className="panel compact-panel alarm-panel">
      <h2>알람 <span>(ALARMS)</span></h2>
      <div className="alarm-actions" aria-label="알람 제어" role="group"><button type="button" onClick={() => setMuted((value) => !value)}>{effectiveMuted ? <BellOff size={15} /> : <Bell size={15} />}{effectiveMuted ? '음소거 해제' : 'Mute'}</button><button type="button" onClick={() => setMutedUntil(elapsedSeconds + 60)}><BellOff size={15} />60초</button><button type="button" onClick={() => setMutedUntil(elapsedSeconds + 120)}><BellOff size={15} />120초</button><button type="button" onClick={() => setPaused((value) => !value)}>{paused ? <Play size={15} /> : <Pause size={15} />}{paused ? '재개' : '일시 정지'}</button><button type="button" onClick={() => setSnoozedUntil(elapsedSeconds + 300)}><BellRing size={15} />스누즈</button><button type="button" onClick={() => { setAudioEnabled((value) => { const nextValue = !value; if (nextValue && !effectiveMuted && visibleAlarms.length > 0) playAlarmTone(); return nextValue; }); }}><Volume2 size={15} />{audioEnabled ? '음성 켬' : '음성 끔'}</button></div>
      <div className="alarm-status-row"><span>High {highPriorityCount}</span><span>False {falseAlarmCount}</span><span>Latency {averageLatencySeconds}s</span><span>Smart {smartAlarmEnabled ? 'on' : 'off'}</span><span>Learning {learningMode ? 'on' : 'off'}</span><button type="button" onClick={requestMobileNotification}>모바일 {notificationStatus === 'granted' ? '허용' : notificationStatus === 'queued' ? '대기' : '알림'}</button></div>
      {visibleAlarms.length === 0 ? <p className="no-alarms">{paused ? '알람 일시 정지됨' : '활성 알람 없음'}</p> : <div aria-live="assertive" role="alert"><ul>{visibleAlarms.map((alarm) => <li className={`${alarm.severity === 'critical' ? 'critical' : ''} priority-${alarm.priority} category-${alarm.category} ${isSnoozed ? 'snoozed' : ''}`} key={alarm.id}><AlertTriangle size={18} /><span>{alarm.label}<small>{alarm.message}</small><small>{alarm.category} · {alarm.severity} · {getToneLabel(alarm.priority)} · latency {Math.max(0, elapsedSeconds - alarm.generatedAtSeconds)}s</small></span><strong>{alarm.value}</strong><small>{alarm.unit}</small><em>발생 {formatAlarmTime(alarm.generatedAtSeconds || elapsedSeconds)}</em></li>)}</ul></div>}
      {shouldShowCriticalDialog ? <div aria-describedby={criticalDialogDescriptionId} aria-labelledby={criticalDialogTitleId} aria-modal="true" className="critical-alarm-dialog" role="alertdialog"><strong id={criticalDialogTitleId}>중대 알람 확인 필요</strong><p id={criticalDialogDescriptionId}>{activeCriticalAlarms[0]?.message}</p><button type="button" onClick={() => setDismissedCriticalAlarmKey(criticalAlarmKey)}>확인</button></div> : null}
      {thresholds && onThresholdChange ? <fieldset className="alarm-thresholds" aria-label="알람 임계값"><legend>알람 임계값</legend><label>Profile<select aria-label="Alarm profile" disabled={thresholdLocked} onChange={(event) => applyProfile(event.target.value as AlarmProfile)} value={selectedProfile}><option value="adult">Adult</option><option value="ards">ARDS</option><option value="copd">COPD</option></select></label><label>Risk code<input aria-label="Risk threshold code" onChange={(event) => setRiskCode(event.target.value)} type="password" value={riskCode} /></label><button type="button" onClick={() => setThresholdLocked((value) => !value)}>{thresholdLocked ? '임계값 잠금 해제' : '임계값 잠금'}</button><button type="button" onClick={() => setSmartAlarmEnabled((value) => !value)}>Smart alarm {smartAlarmEnabled ? 'on' : 'off'}</button><button type="button" onClick={() => setLearningMode((value) => !value)}>Alarm learning {learningMode ? 'on' : 'off'}</button><label htmlFor={lowSpo2Id}>SpO2<input aria-label="Low SpO2 threshold" disabled={thresholdLocked} id={lowSpo2Id} max={99} min={70} onChange={(event) => onThresholdChange('lowSpo2Warning', Number(event.target.value))} type="number" value={thresholds.lowSpo2Warning} /></label><label htmlFor={highPressureId}>PIP high<input aria-label="High pressure threshold" disabled={thresholdLocked || !dangerousThresholdsUnlocked} id={highPressureId} max={60} min={10} onChange={(event) => onThresholdChange('highPressureWarning', Number(event.target.value))} type="number" value={thresholds.highPressureWarning} /></label><label htmlFor={lowPressureId}>PIP low<input aria-label="Low pressure threshold" disabled={thresholdLocked || !dangerousThresholdsUnlocked} id={lowPressureId} max={20} min={0} onChange={(event) => onThresholdChange('lowPressure', Number(event.target.value))} type="number" value={thresholds.lowPressure} /></label><label htmlFor={highMvId}>MV high<input aria-label="High minute ventilation threshold" disabled={thresholdLocked} id={highMvId} max={30} min={5} onChange={(event) => onThresholdChange('highMinuteVentilation', Number(event.target.value))} type="number" value={thresholds.highMinuteVentilation} /></label><label htmlFor={lowMvId}>MV low<input aria-label="Low minute ventilation threshold" disabled={thresholdLocked} id={lowMvId} max={10} min={1} onChange={(event) => onThresholdChange('lowMinuteVentilationCritical', Number(event.target.value))} type="number" value={thresholds.lowMinuteVentilationCritical} /></label><label htmlFor={highPeepId}>PEEP high<input aria-label="High PEEP threshold" disabled={thresholdLocked || !dangerousThresholdsUnlocked} id={highPeepId} max={30} min={5} onChange={(event) => onThresholdChange('highPeep', Number(event.target.value))} type="number" value={thresholds.highPeep} /></label><label htmlFor={lowPeepId}>PEEP low<input aria-label="Low PEEP threshold" disabled={thresholdLocked} id={lowPeepId} max={10} min={0} onChange={(event) => onThresholdChange('lowPeep', Number(event.target.value))} type="number" value={thresholds.lowPeep} /></label><label htmlFor={highEtco2Id}>EtCO2<input aria-label="High EtCO2 threshold" disabled={thresholdLocked} id={highEtco2Id} max={80} min={30} onChange={(event) => onThresholdChange('highEtco2', Number(event.target.value))} type="number" value={thresholds.highEtco2} /></label><label htmlFor={highCo2Id}>PaCO2<input aria-label="High CO2 threshold" disabled={thresholdLocked} id={highCo2Id} max={90} min={35} onChange={(event) => onThresholdChange('highCo2Warning', Number(event.target.value))} type="number" value={thresholds.highCo2Warning} /></label></fieldset> : null}
      <div className="alarm-history" aria-label="알람 히스토리" role="region" tabIndex={0}><strong>History</strong><span>Stats {Object.entries(categoryStats).map(([category, count]) => `${category}:${count}`).join(' ') || '-'}</span>{history.length === 0 ? <span>기록 없음</span> : history.map((entry) => <span className={`priority-${entry.priority}`} key={`${entry.id}-${entry.generatedAtSeconds}-${entry.occurrenceCount}`}>{entry.label} #{entry.occurrenceCount} 발생 {formatAlarmTime(entry.generatedAtSeconds)} 해결 {entry.resolvedAtSeconds === null ? '-' : formatAlarmTime(entry.resolvedAtSeconds)}</span>)}</div>
    </section>
  );
}
