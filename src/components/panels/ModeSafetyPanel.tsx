import type { ModeSafetyState } from '@/simulation/modeSafety';
import './ModeSafetyPanel.css';

type ModeSafetyPanelProps = {
  safety: ModeSafetyState;
};

export function ModeSafetyPanel({ safety }: Readonly<ModeSafetyPanelProps>) {
  return (
    <section className="mode-safety-panel" aria-label="모드 안전 상태">
      <strong>{safety.safetyWarning}</strong>
      <span>{safety.modeTransitionTrigger}</span>
      <span>{safety.modeDetail}</span>
      <span>{safety.apneaDetected ? 'Apnea detected' : 'No apnea'}</span>
      <span>{safety.apneaBackupActive ? `Backup ${safety.autoBackupMode}` : 'Backup standby'}</span>
      <span>{safety.inverseRatioVentilation ? 'IRV active' : 'IRV off'}</span>
      <span title={safety.modeControlSummary.join(' / ')}>
        Mode controls: {safety.modeControlSummary.length}
      </span>
      <span title={safety.adjunctControlSummary.join(' / ')}>
        Adjunct controls: {safety.adjunctControlSummary.length}
      </span>
    </section>
  );
}
