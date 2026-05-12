import { memo, useMemo, useState } from 'react';
import { WaveformChart } from '@/components/ui';
import { Eye, PauseCircle, PlayCircle, Printer } from '@/components/ui/icons';
import type { ClinicalAssessments } from '@/simulation/clinicalAssessments';
import type { Scenario, VentSettings } from '@/simulation/scenarios';
import type { DerivedVitals } from '@/simulation/ventilatorModel';
import { generateWaveform, toPolyline, type WaveformKind } from '@/simulation/waveformGenerator';
import { DataVisualizationPanel } from './DataVisualizationPanel';
import './MonitorPanel.css';
import './Panel.css';

type MonitorPanelProps = {
  isPaused: boolean;
  scenario: Scenario;
  settings: VentSettings;
  clinical: ClinicalAssessments;
  vitals: DerivedVitals;
};

/** Monitor surface for vitals, waveforms, clinical assessments, and trend visualizations. */
// prettier-ignore
function MonitorPanelComponent({ clinical, isPaused, scenario, settings, vitals }: Readonly<MonitorPanelProps>) {
  const [monitorFrozen, setMonitorFrozen] = useState(false);
  const [viewMode, setViewMode] = useState<'standard' | 'multi' | 'minimized'>('standard');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [customLayout, setCustomLayout] = useState(false);
  const pressureMax = Math.ceil(Math.max(45, vitals.pip + 8));
  const volumeMax = Math.ceil(Math.max(800, vitals.vte + 220));
  const effectivePaused = isPaused || monitorFrozen;

  // prettier-ignore
  return (
    <aside aria-busy={effectivePaused} aria-label="실시간 환자 모니터" aria-roledescription="real-time patient monitor" className={`panel monitor-panel ${isFullscreen ? 'monitor-fullscreen' : ''} ${customLayout ? 'custom-monitor-layout' : ''}`} data-monitor-view={viewMode} data-monitor-paused={effectivePaused} role="region">
      <div className="monitor-header">
        <h2>실시간 모니터링</h2>
        <div className="monitor-toolbar" aria-label="monitor display controls" role="group">
          <button aria-label={monitorFrozen ? 'Resume monitor screen' : 'Pause monitor screen'} aria-pressed={monitorFrozen} type="button" onClick={() => setMonitorFrozen((value) => !value)}>{monitorFrozen ? <PlayCircle size={15} /> : <PauseCircle size={15} />}</button>
          <button aria-label="Fullscreen monitor" aria-pressed={isFullscreen} type="button" onClick={() => setIsFullscreen((value) => !value)}><Eye size={15} /></button>
          <button aria-label="Print monitor screen" type="button" onClick={() => window.print()}><Printer size={15} /></button>
          <div aria-label="Monitor view mode" className="monitor-view-tabs" role="tablist">
            <button aria-label="Std standard monitor view" aria-selected={viewMode === 'standard'} role="tab" type="button" onClick={() => setViewMode('standard')}>Std</button>
            <button aria-label="Multi waveform view" aria-selected={viewMode === 'multi'} role="tab" type="button" onClick={() => setViewMode('multi')}>Multi</button>
            <button aria-label="Minimize monitor view" aria-selected={viewMode === 'minimized'} role="tab" type="button" onClick={() => setViewMode('minimized')}>Min</button>
          </div>
          <button aria-label="Custom monitor layout" aria-pressed={customLayout} type="button" onClick={() => setCustomLayout((value) => !value)}>Layout</button>
        </div>
      </div>
      <div aria-label="Primary monitor waveforms" className="monitor-wave-stack" role="region" tabIndex={0}>
        <WaveformChart color="var(--wave-pressure)" isPaused={effectivePaused} kind="pressure" label="Pressure" maxLabel={String(pressureMax)} minLabel="-5" scenario={scenario} settings={settings} showAnalysisTools={false} unit="cmH2O" valueLabel={`Ppeak ${vitals.pip}`} vitals={vitals} />
        <WaveformChart color="var(--wave-flow)" isPaused={effectivePaused} kind="flow" label="Flow" maxLabel={String(settings.flow)} minLabel={String(Math.round(-settings.flow * 0.8))} scenario={scenario} settings={settings} showAnalysisTools={false} unit="L/min" valueLabel={`ExpMinVol ${vitals.minuteVentilation}`} vitals={vitals} />
        <WaveformChart color="var(--wave-volume)" isPaused={effectivePaused} kind="volume" label="Volume" maxLabel={String(volumeMax)} minLabel="0" scenario={scenario} settings={settings} showAnalysisTools={false} unit="mL" valueLabel={`Vt ${vitals.vte}`} vitals={vitals} />
        <WaveformChart color="var(--wave-co2)" isPaused={effectivePaused} kind="co2" label="CO2" maxLabel={String(Math.max(60, vitals.etco2 + 16))} minLabel="0" scenario={scenario} settings={settings} showAnalysisTools={false} unit="mmHg" valueLabel={`EtCO2 ${vitals.etco2}`} vitals={vitals} />
      </div>
      <MonitorLoopStrip settings={settings} vitals={vitals} />

      <AdditionalMonitoring clinical={clinical} scenario={scenario} settings={settings} vitals={vitals} />
    </aside>
  );
}

export const MonitorPanel = memo(MonitorPanelComponent);

const MonitorLoopStrip = memo(function MonitorLoopStrip({
  settings,
  vitals,
}: Readonly<{
  settings: VentSettings;
  vitals: DerivedVitals;
}>) {
  const pressureVolumePoints = useMemo(
    () =>
      Array.from({ length: 30 }, (_, index) => {
        const phase = (index / 29) * Math.PI * 2;
        const x = 44 + Math.sin(phase) * 32 + Math.max(0, vitals.vte - 450) * 0.02;
        const y = 42 - Math.cos(phase) * Math.min(28, Math.max(16, vitals.pip * 0.62));
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      }).join(' '),
    [vitals.pip, vitals.vte],
  );
  const volumeTimePoints = useMemo(
    () =>
      Array.from({ length: 30 }, (_, index) => {
        const x = 8 + index * 3;
        const y = 70 - Math.max(0, Math.sin((index / 29) * Math.PI)) * Math.min(58, vitals.vte / 12);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      }).join(' '),
    [vitals.vte],
  );
  const loopClass =
    vitals.plateau > 30 || vitals.drivingPressure > 15 ? 'monitor-loop abnormal-loop' : 'monitor-loop';

  return (
    <div className="monitor-loop-strip" aria-label="monitor loop comparison" role="group">
      <article className={loopClass}>
        <span>P-V Loop</span>
        <svg aria-label="monitor P-V loop" role="img" viewBox="0 0 100 80">
          <polyline
            className="loop-history past"
            fill="none"
            points={pressureVolumePoints}
            stroke="rgba(255, 216, 74, 0.28)"
            strokeWidth="5"
          />
          <polyline
            fill="none"
            points={pressureVolumePoints}
            stroke="var(--wave-pressure)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </svg>
        <small>{vitals.plateau > 30 ? 'Over-distention' : `PEEP ${settings.peep}`}</small>
      </article>
      <article className={loopClass}>
        <span>V-T Loop</span>
        <svg aria-label="monitor V-T loop" role="img" viewBox="0 0 100 80">
          <polyline
            className="loop-history recent"
            fill="none"
            points={volumeTimePoints}
            stroke="rgba(248, 252, 255, 0.3)"
            strokeWidth="5"
          />
          <polyline
            fill="none"
            points={volumeTimePoints}
            stroke="var(--wave-volume)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </svg>
        <small>Current Vt {vitals.vte} mL</small>
      </article>
      <article className="monitor-loop">
        <span>12/24h Trend</span>
        <div className="trend-window-toggle" aria-label="trend mode 12 and 24 hour windows" role="group">
          <b>12h</b>
          <b>24h</b>
        </div>
        <small>Mini trends beside vitals</small>
      </article>
    </div>
  );
});

const AdditionalMonitoring = memo(function AdditionalMonitoring({
  clinical,
  scenario,
  settings,
  vitals,
}: Readonly<Omit<MonitorPanelProps, 'isPaused'>>) {
  return (
    <div className="additional-monitoring">
      <h3>추가 모니터링</h3>
      <DataVisualizationPanel settings={settings} vitals={vitals} />
      <div className="advanced-wave-grid" aria-label="advanced patient waveforms" role="group">
        <MiniPatientWaveform
          color="var(--wave-ecg)"
          kind="ecg"
          label="ECG Lead II"
          scenario={scenario}
          settings={settings}
          valueLabel={clinical.integratedMonitoring.hrAnalysis}
          vitals={vitals}
        />
        <MiniPatientWaveform
          color="var(--wave-spo2)"
          kind="pleth"
          label="SpO2 Pleth"
          scenario={scenario}
          settings={settings}
          valueLabel={`PI ${clinical.integratedMonitoring.perfusionIndex}`}
          vitals={vitals}
        />
        <MiniPatientWaveform
          color="#ff7891"
          kind="ibp"
          label="IBP"
          scenario={scenario}
          settings={settings}
          valueLabel={clinical.integratedMonitoring.ibp}
          vitals={vitals}
        />
        <MiniPatientWaveform
          color="#a98bff"
          kind="cvp"
          label="CVP"
          scenario={scenario}
          settings={settings}
          valueLabel={clinical.integratedMonitoring.cvp}
          vitals={vitals}
        />
        <MiniPatientWaveform
          color="#ffd166"
          kind="pap"
          label="PAP"
          scenario={scenario}
          settings={settings}
          valueLabel={clinical.integratedMonitoring.pap}
          vitals={vitals}
        />
        <MiniPatientWaveform
          color="var(--wave-ecg)"
          kind="eeg"
          label="EEG/BIS"
          scenario={scenario}
          settings={settings}
          valueLabel={`BIS ${clinical.integratedMonitoring.bisIndex}`}
          vitals={vitals}
        />
      </div>
      <div
        className="vital-strip"
        aria-atomic="true"
        aria-live="polite"
        aria-relevant="additions text"
        role="status"
      >
        <Vital
          isDanger={vitals.spo2 < 90}
          isWarning={vitals.spo2 < 94}
          label="SpO2"
          unit="%"
          value={vitals.spo2}
        />
        <Vital
          isDanger={vitals.heartRate > 110}
          isWarning={vitals.heartRate > 100}
          label="HR"
          unit="/min"
          value={vitals.heartRate}
        />
        <Vital
          isDanger={clinical.bloodPressure.map < 65}
          isWarning={clinical.bloodPressure.map < 75 || clinical.bloodPressure.map > 105}
          label="BP"
          unit="mmHg"
          value={`${clinical.bloodPressure.systolic}/${clinical.bloodPressure.diastolic}`}
        />
        <Vital
          isDanger={clinical.temperatureCelsius >= 39}
          isWarning={clinical.temperatureCelsius >= 38}
          label="Temp"
          unit="°C"
          value={clinical.temperatureCelsius.toFixed(1)}
        />
        <Vital
          isDanger={clinical.gcs < 9}
          isWarning={clinical.gcs < 15}
          label="GCS"
          unit="/15"
          value={clinical.gcs}
        />
        <Vital
          isDanger={clinical.painScore >= 7}
          isWarning={clinical.painScore >= 4}
          label="NRS"
          unit="/10"
          value={clinical.painScore}
        />
        <Vital
          isDanger={vitals.etco2 > 50}
          isWarning={vitals.etco2 > 45}
          label="EtCO2"
          unit="mmHg"
          value={vitals.etco2}
        />
        <Vital
          isDanger={vitals.totalRR >= 28}
          isWarning={vitals.totalRR > 24}
          label="RR"
          unit="/min"
          value={vitals.totalRR}
        />
        <Vital
          isDanger={clinical.integratedMonitoring.perfusionIndex < 1}
          isWarning={clinical.integratedMonitoring.perfusionIndex < 2}
          label="PI"
          unit="%"
          value={clinical.integratedMonitoring.perfusionIndex}
        />
        <Vital
          isDanger={clinical.integratedMonitoring.bisIndex < 40}
          isWarning={clinical.integratedMonitoring.bisIndex < 60}
          label="BIS"
          unit="idx"
          value={clinical.integratedMonitoring.bisIndex}
        />
      </div>
      <div className="clinical-data-grid">
        <ClinicalList title="ABGA" items={clinical.abga} />
        <ClinicalList title="ABG Auto" items={clinical.integratedMonitoring.arterialBloodGas} />
        <ClinicalList title="VBG" items={clinical.integratedMonitoring.venousBloodGas} />
        <ClinicalList title="5-lead ECG" items={clinical.integratedMonitoring.ecg5Lead} />
        <ClinicalList title="12-lead ECG" items={clinical.integratedMonitoring.ecg12Lead} />
        <ClinicalList title="EtCO2 Trend" items={clinical.integratedMonitoring.etco2Trend} />
        <ClinicalList title="Temperature Sites" items={clinical.integratedMonitoring.temperatureSites} />
        <ClinicalList title="Scenario" items={clinical.scenarioFindings} />
        <ClinicalList title="CBC" items={clinical.cbc} />
        <ClinicalList title="BMP" items={clinical.bmp} />
        <ClinicalList title="Trend" items={clinical.trend} />
        <ClinicalList title="Log" items={clinical.simulationLog} />
        <div className="clinical-card">
          <span>ECG</span>
          <strong>{clinical.ecg}</strong>
        </div>
        <div className="clinical-card">
          <span>Hemodynamics</span>
          <strong>{clinical.integratedMonitoring.nibp}</strong>
          <small>{clinical.integratedMonitoring.cardiacOutput}</small>
          <small>CVP {clinical.integratedMonitoring.cvp}</small>
          <small>PAP {clinical.integratedMonitoring.pap}</small>
        </div>
        <div className="clinical-card">
          <span>Monitoring</span>
          <strong>{clinical.integratedMonitoring.spo2Pleth}</strong>
          <small>TOF: {clinical.integratedMonitoring.tof}</small>
          <small>Glucose: {clinical.integratedMonitoring.glucose}</small>
          <small>Urine: {clinical.integratedMonitoring.urineOutput}</small>
        </div>
        <div className="clinical-card">
          <span>X-ray</span>
          <strong>{clinical.xray}</strong>
        </div>
        <div className="clinical-card patient-chart">
          <span>Patient</span>
          <strong>
            {clinical.patient.name}, {clinical.patient.age}y, {clinical.patient.sex},{' '}
            {clinical.patient.weightKg}kg
          </strong>
          <small>{clinical.patient.photoLabel}</small>
          <small>{clinical.chiefComplaint}</small>
          <small>PMH: {clinical.pastMedicalHistory.join(', ')}</small>
          <small>Meds: {clinical.currentMedications.join(', ')}</small>
          <small>Allergy: {clinical.allergies}</small>
        </div>
      </div>
    </div>
  );
});

const Vital = memo(function Vital({
  isDanger,
  isWarning,
  label,
  unit,
  value,
}: {
  isDanger: boolean;
  isWarning: boolean;
  label: string;
  unit: string;
  value: number | string;
}) {
  return (
    <div className="vital">
      <span>
        {label} <small>({unit})</small>
      </span>
      <i className="vital-sparkline" aria-hidden="true" />
      <strong className={isDanger ? 'danger-text' : isWarning ? 'warning-text' : ''}>{value}</strong>
    </div>
  );
});

const ClinicalList = memo(function ClinicalList({
  items,
  title,
}: {
  items: readonly string[];
  title: string;
}) {
  return (
    <div className="clinical-card">
      <span>{title}</span>
      {items.map((item) => (
        <small key={item}>{item}</small>
      ))}
    </div>
  );
});

const MiniPatientWaveform = memo(function MiniPatientWaveform({
  color,
  kind,
  label,
  scenario,
  settings,
  valueLabel,
  vitals,
}: {
  color: string;
  kind: WaveformKind;
  label: string;
  scenario: Scenario;
  settings: VentSettings;
  valueLabel: string;
  vitals: DerivedVitals;
}) {
  const points = useMemo(
    () =>
      toPolyline(
        generateWaveform({
          height: 54,
          kind,
          paused: true,
          phase: 0.32,
          scenario,
          settings,
          vitals,
          width: 170,
        }),
      ),
    [kind, scenario, settings, vitals],
  );

  return (
    <article className="patient-mini-wave">
      <span>{label}</span>
      <svg aria-label={`${label} waveform data`} preserveAspectRatio="none" role="img" viewBox="0 0 170 54">
        <polyline
          fill="none"
          points={points}
          stroke={color}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.4"
        />
      </svg>
      <strong>{valueLabel}</strong>
    </article>
  );
});
