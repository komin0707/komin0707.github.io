import type { Alarm, AlarmCategory, AlarmPriority, AlarmSeverity, AlarmThresholds } from './ventilatorTypes';
import type { VentMode } from './scenarios';

export type AlarmInput = {
  category: AlarmCategory;
  generatedAtSeconds: number;
  id: string;
  isLikelyFalseAlarm?: boolean;
  label: string;
  message: string;
  priority: AlarmPriority;
  repeatedAlarmIds: readonly string[];
  severity: AlarmSeverity;
  threshold: number;
  unit: string;
  value: number;
};

export const DEFAULT_ALARM_THRESHOLDS: AlarmThresholds = {
  lowSpo2Warning: 92,
  lowSpo2Critical: 88,
  highPressureWarning: 35,
  highPressureCritical: 40,
  lowPressure: 5,
  disconnectPressure: 3,
  apneaRate: 4,
  apneaSeconds: 20,
  tachypneaWarning: 35,
  tachypneaCritical: 35,
  bradypneaRate: 8,
  tachycardiaRate: 120,
  bradycardiaRate: 50,
  highSystolicBloodPressure: 180,
  highDiastolicBloodPressure: 110,
  lowSystolicBloodPressure: 90,
  lowDiastolicBloodPressure: 60,
  highTemperatureCelsius: 38.5,
  lowTemperatureCelsius: 35,
  highFio2: 80,
  lowFio2: 30,
  highPeep: 20,
  lowPeep: 3,
  highMinuteVentilation: 15,
  highCo2Warning: 55,
  highCo2Critical: 70,
  highEtco2: 50,
  lowCo2: 30,
  lowEtco2: 25,
  lowMinuteVentilationWarning: 4,
  lowMinuteVentilationCritical: 3,
  lowComplianceWarning: 25,
  lowComplianceCritical: 18,
  highAutoPeep: 5,
  highLeak: 15,
  circuitOcclusionResistance: 32,
  gasSupplyPressure: 35,
  oxygenSupplyPressure: 45,
  batteryCriticalPercent: 5,
  batteryPercent: 10,
};

export const ALARM_PRECISION_MANIFEST = {
  thresholds: {
    highPressureWarning: {
      adjustable: true,
      defaultValue: DEFAULT_ALARM_THRESHOLDS.highPressureWarning,
      unit: 'cmH2O',
    },
    lowPressure: { adjustable: true, defaultValue: DEFAULT_ALARM_THRESHOLDS.lowPressure, unit: 'cmH2O' },
    highMinuteVentilation: {
      adjustable: true,
      defaultValue: DEFAULT_ALARM_THRESHOLDS.highMinuteVentilation,
      unit: 'L/min',
    },
    lowMinuteVentilationCritical: {
      adjustable: true,
      defaultValue: DEFAULT_ALARM_THRESHOLDS.lowMinuteVentilationCritical,
      unit: 'L/min',
    },
    apneaSeconds: { adjustable: true, defaultValue: DEFAULT_ALARM_THRESHOLDS.apneaSeconds, unit: 'sec' },
    tachypneaWarning: {
      adjustable: true,
      defaultValue: DEFAULT_ALARM_THRESHOLDS.tachypneaWarning,
      unit: '/min',
    },
    bradypneaRate: { adjustable: true, defaultValue: DEFAULT_ALARM_THRESHOLDS.bradypneaRate, unit: '/min' },
    highFio2: { adjustable: true, defaultValue: DEFAULT_ALARM_THRESHOLDS.highFio2, unit: '%' },
    lowFio2: { adjustable: true, defaultValue: DEFAULT_ALARM_THRESHOLDS.lowFio2, unit: '%' },
    highPeep: { adjustable: true, defaultValue: DEFAULT_ALARM_THRESHOLDS.highPeep, unit: 'cmH2O' },
    lowPeep: { adjustable: true, defaultValue: DEFAULT_ALARM_THRESHOLDS.lowPeep, unit: 'cmH2O' },
    highAutoPeep: { adjustable: true, defaultValue: DEFAULT_ALARM_THRESHOLDS.highAutoPeep, unit: 'cmH2O' },
    highLeak: { adjustable: true, defaultValue: DEFAULT_ALARM_THRESHOLDS.highLeak, unit: '%' },
    lowSpo2Warning: { adjustable: true, defaultValue: DEFAULT_ALARM_THRESHOLDS.lowSpo2Warning, unit: '%' },
    lowSpo2Critical: { adjustable: true, defaultValue: DEFAULT_ALARM_THRESHOLDS.lowSpo2Critical, unit: '%' },
    lowEtco2: { adjustable: true, defaultValue: DEFAULT_ALARM_THRESHOLDS.lowEtco2, unit: 'mmHg' },
    highEtco2: { adjustable: true, defaultValue: DEFAULT_ALARM_THRESHOLDS.highEtco2, unit: 'mmHg' },
    tachycardiaRate: {
      adjustable: true,
      defaultValue: DEFAULT_ALARM_THRESHOLDS.tachycardiaRate,
      unit: 'bpm',
    },
    bradycardiaRate: {
      adjustable: true,
      defaultValue: DEFAULT_ALARM_THRESHOLDS.bradycardiaRate,
      unit: 'bpm',
    },
    highSystolicBloodPressure: {
      adjustable: true,
      defaultValue: DEFAULT_ALARM_THRESHOLDS.highSystolicBloodPressure,
      pairedWith: DEFAULT_ALARM_THRESHOLDS.highDiastolicBloodPressure,
      unit: 'mmHg',
    },
    lowSystolicBloodPressure: {
      adjustable: true,
      defaultValue: DEFAULT_ALARM_THRESHOLDS.lowSystolicBloodPressure,
      pairedWith: DEFAULT_ALARM_THRESHOLDS.lowDiastolicBloodPressure,
      unit: 'mmHg',
    },
    highTemperatureCelsius: {
      adjustable: true,
      defaultValue: DEFAULT_ALARM_THRESHOLDS.highTemperatureCelsius,
      unit: 'C',
    },
    lowTemperatureCelsius: {
      adjustable: true,
      defaultValue: DEFAULT_ALARM_THRESHOLDS.lowTemperatureCelsius,
      unit: 'C',
    },
    batteryPercent: {
      adjustable: true,
      criticalValue: DEFAULT_ALARM_THRESHOLDS.batteryCriticalPercent,
      defaultValue: DEFAULT_ALARM_THRESHOLDS.batteryPercent,
      unit: '%',
    },
  },
  detection: {
    circuitDisconnect: 'low pressure variation plus low exhaled tidal volume or disconnected circuit flag',
    circuitOcclusion: 'high pressure plus low minute ventilation or high resistance/no-flow pattern',
    gasSupply: 'medical gas and oxygen supply pressure alarms',
    powerFailure: 'mains power unavailable alarm',
    systemError: 'technical ventilator system error alarm',
  },
  uiControls: {
    annunciation: ['HIGH tone', 'MED tone', 'LOW tone'],
    confirmButton: 'critical alertdialog confirm button',
    falseAlarmCounter: 'active likely-false alarm count',
    latencyMeasurement: 'per-alarm and average latency seconds',
    learningMode: 'alarm learning mode toggle',
    muteOptionsSeconds: [60, 120],
    patientProfiles: ['adult', 'ards', 'copd'],
    passwordProtection: 'VENT risk code required for dangerous pressure thresholds',
    smartAlarm: 'smart alarm toggle',
    statistics: 'time and category statistics in alarm history',
    thresholdLock: 'threshold lock toggle',
  },
} as const;

const PRIORITY_SCORE: Record<AlarmPriority, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

export function modeAdjustedThresholds(
  mode: VentMode | undefined,
  thresholds: AlarmThresholds,
): AlarmThresholds {
  if (mode === 'HFOV') {
    return {
      ...thresholds,
      highPressureWarning: thresholds.highPressureWarning + 8,
      highPressureCritical: thresholds.highPressureCritical + 8,
      lowMinuteVentilationWarning: thresholds.lowMinuteVentilationWarning * 0.55,
      lowMinuteVentilationCritical: thresholds.lowMinuteVentilationCritical * 0.55,
    };
  }

  if (mode === 'CPAP' || mode === 'NIV') {
    return {
      ...thresholds,
      lowPressure: thresholds.lowPressure - 2,
      disconnectPressure: thresholds.disconnectPressure - 1,
      highLeak: thresholds.highLeak - 1,
    };
  }

  if (mode === 'APRV') {
    return {
      ...thresholds,
      highPressureWarning: thresholds.highPressureWarning + 4,
      highPressureCritical: thresholds.highPressureCritical + 4,
    };
  }

  return thresholds;
}

export function createAlarm({
  category,
  generatedAtSeconds,
  id,
  isLikelyFalseAlarm = false,
  label,
  message,
  priority,
  repeatedAlarmIds,
  severity,
  threshold,
  unit,
  value,
}: AlarmInput): Alarm {
  const repeated = repeatedAlarmIds.includes(id);
  const escalatedPriority =
    repeated && priority === 'medium' ? 'high' : repeated && priority === 'low' ? 'medium' : priority;

  return {
    id,
    label,
    message,
    value,
    unit,
    severity: escalatedPriority === 'high' ? 'critical' : severity,
    priority: escalatedPriority,
    category,
    threshold,
    generatedAtSeconds,
    isLikelyFalseAlarm,
  };
}

export function sortAlarmsByPriority(alarms: readonly Alarm[]): Alarm[] {
  return [...alarms].sort((left, right) => {
    const priorityDelta = PRIORITY_SCORE[right.priority] - PRIORITY_SCORE[left.priority];
    if (priorityDelta !== 0) return priorityDelta;
    return left.label.localeCompare(right.label);
  });
}
