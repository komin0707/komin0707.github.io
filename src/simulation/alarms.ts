import type { VentMode } from './scenarios';
import {
  createAlarm,
  DEFAULT_ALARM_THRESHOLDS,
  modeAdjustedThresholds,
  sortAlarmsByPriority,
} from './alarmDefinitions';
import type { Alarm, AlarmSystemStatus, AlarmThresholds, DerivedVitals } from './ventilatorTypes';

export { DEFAULT_ALARM_THRESHOLDS, sortAlarmsByPriority } from './alarmDefinitions';

export type AlarmCalculationOptions = {
  elapsedSeconds?: number;
  mode?: VentMode;
  repeatedAlarmIds?: readonly string[];
  system?: Partial<AlarmSystemStatus> | undefined;
  thresholds?: Partial<AlarmThresholds> | undefined;
};

type AlarmContext = {
  generatedAtSeconds: number;
  repeatedAlarmIds: readonly string[];
  system: AlarmSystemStatus;
  thresholds: AlarmThresholds;
  vitals: DerivedVitals;
};

export function calculateAlarms(vitals: DerivedVitals, options: AlarmCalculationOptions = {}): Alarm[] {
  const context = createAlarmContext(vitals, options);
  const alarms: Alarm[] = [];

  addOxygenationAlarms(alarms, context);
  addPressureAlarms(alarms, context);
  addRespiratoryRateAlarms(alarms, context);
  addHeartRateAlarms(alarms, context);
  addBloodPressureAlarms(alarms, context);
  addTemperatureAlarms(alarms, context);
  addVentilationAlarms(alarms, context);
  addCircuitAlarms(alarms, context);
  addSystemAlarms(alarms, context);

  return sortAlarmsByPriority(alarms);
}

function createAlarmContext(vitals: DerivedVitals, options: AlarmCalculationOptions): AlarmContext {
  return {
    generatedAtSeconds: options.elapsedSeconds ?? 0,
    repeatedAlarmIds: options.repeatedAlarmIds ?? [],
    system: {
      batteryPercent: 100,
      circuitConnected: true,
      gasSupplyPressure: 55,
      mainsPowerAvailable: true,
      oxygenSupplyPressure: 55,
      systemError: false,
      ...options.system,
    },
    thresholds: modeAdjustedThresholds(options.mode, {
      ...DEFAULT_ALARM_THRESHOLDS,
      ...options.thresholds,
    }),
    vitals,
  };
}

function addAlarm(
  alarms: Alarm[],
  context: AlarmContext,
  category: Alarm['category'],
  id: string,
  label: string,
  message: string,
  priority: Alarm['priority'],
  severity: Alarm['severity'],
  threshold: number,
  unit: string,
  value: number,
  isLikelyFalseAlarm = false,
) {
  alarms.push(
    createAlarm({
      category,
      generatedAtSeconds: context.generatedAtSeconds,
      id,
      isLikelyFalseAlarm,
      label,
      message,
      priority,
      repeatedAlarmIds: context.repeatedAlarmIds,
      severity,
      threshold,
      unit,
      value,
    }),
  );
}

function addOxygenationAlarms(alarms: Alarm[], context: AlarmContext) {
  const { thresholds, vitals } = context;
  if (vitals.spo2 < thresholds.lowSpo2Warning) addLowSpo2Alarm(alarms, context);
  if (vitals.fio2 > thresholds.highFio2) addHighFio2Alarm(alarms, context);
  if (vitals.fio2 < thresholds.lowFio2) addLowFio2Alarm(alarms, context);
}

function addLowSpo2Alarm(alarms: Alarm[], context: AlarmContext) {
  const { thresholds, vitals } = context;
  const critical = vitals.spo2 < thresholds.lowSpo2Critical;
  addAlarm(
    alarms,
    context,
    'oxygenation',
    'low-spo2',
    'Low SpO2',
    `SpO2 ${vitals.spo2}% is below the ${thresholds.lowSpo2Warning}% safety threshold.`,
    critical ? 'high' : 'medium',
    critical ? 'critical' : 'warning',
    thresholds.lowSpo2Warning,
    '%',
    vitals.spo2,
  );
}

function addHighFio2Alarm(alarms: Alarm[], context: AlarmContext) {
  const { thresholds, vitals } = context;
  addAlarm(
    alarms,
    context,
    'oxygenation',
    'high-fio2',
    'High FiO2',
    `FiO2 ${vitals.fio2}% exceeds the ${thresholds.highFio2}% oxygen exposure threshold.`,
    'low',
    'warning',
    thresholds.highFio2,
    '%',
    vitals.fio2,
  );
}

function addLowFio2Alarm(alarms: Alarm[], context: AlarmContext) {
  const { thresholds, vitals } = context;
  addAlarm(
    alarms,
    context,
    'oxygenation',
    'low-fio2',
    'Low FiO2',
    `FiO2 ${vitals.fio2}% is below the ${thresholds.lowFio2}% delivered oxygen threshold.`,
    'medium',
    'warning',
    thresholds.lowFio2,
    '%',
    vitals.fio2,
  );
}

function addPressureAlarms(alarms: Alarm[], context: AlarmContext) {
  const { thresholds, vitals } = context;

  if (vitals.pip > thresholds.highPressureWarning) addHighPressureAlarm(alarms, context);
  if (vitals.pip < thresholds.lowPressure) addLowPressureAlarm(alarms, context);
  if (vitals.peep > thresholds.highPeep) addHighPeepAlarm(alarms, context);
  if (vitals.peep < thresholds.lowPeep) addLowPeepAlarm(alarms, context);
  if (vitals.autoPeep > thresholds.highAutoPeep) addAutoPeepAlarm(alarms, context);
  if (vitals.compliance <= thresholds.lowComplianceWarning) addComplianceAlarm(alarms, context);
}

function addHighPressureAlarm(alarms: Alarm[], context: AlarmContext) {
  const { thresholds, vitals } = context;
  const critical = vitals.pip > thresholds.highPressureCritical;
  addAlarm(
    alarms,
    context,
    'pressure',
    'high-pip',
    'High Peak Pressure',
    `Peak pressure ${vitals.pip} cmH2O exceeds the ${thresholds.highPressureWarning} cmH2O limit.`,
    critical ? 'high' : 'medium',
    critical ? 'critical' : 'warning',
    thresholds.highPressureWarning,
    'cmH2O',
    vitals.pip,
  );
}

function addLowPressureAlarm(alarms: Alarm[], context: AlarmContext) {
  const { thresholds, vitals } = context;
  const critical = vitals.pip < thresholds.disconnectPressure;
  addAlarm(
    alarms,
    context,
    'pressure',
    'low-pressure',
    'Low Airway Pressure',
    `Peak pressure ${vitals.pip} cmH2O is below the ${thresholds.lowPressure} cmH2O low-pressure threshold.`,
    critical ? 'high' : 'medium',
    critical ? 'critical' : 'warning',
    thresholds.lowPressure,
    'cmH2O',
    vitals.pip,
  );
}

function addComplianceAlarm(alarms: Alarm[], context: AlarmContext) {
  const { thresholds, vitals } = context;
  const critical = vitals.compliance < thresholds.lowComplianceCritical;
  addAlarm(
    alarms,
    context,
    'pressure',
    'low-compliance',
    'Low Compliance',
    `Compliance ${vitals.compliance} mL/cmH2O is below the ${thresholds.lowComplianceWarning} mL/cmH2O threshold.`,
    critical ? 'high' : 'medium',
    critical ? 'critical' : 'warning',
    thresholds.lowComplianceWarning,
    'mL/cmH2O',
    vitals.compliance,
  );
}

function addHighPeepAlarm(alarms: Alarm[], context: AlarmContext) {
  const { thresholds, vitals } = context;
  addAlarm(
    alarms,
    context,
    'pressure',
    'high-peep',
    'High PEEP',
    `PEEP ${vitals.peep} cmH2O exceeds the ${thresholds.highPeep} cmH2O threshold.`,
    'medium',
    'warning',
    thresholds.highPeep,
    'cmH2O',
    vitals.peep,
  );
}

function addLowPeepAlarm(alarms: Alarm[], context: AlarmContext) {
  const { thresholds, vitals } = context;
  addAlarm(
    alarms,
    context,
    'pressure',
    'low-peep',
    'Low PEEP',
    `PEEP ${vitals.peep} cmH2O is below the ${thresholds.lowPeep} cmH2O threshold.`,
    'medium',
    'warning',
    thresholds.lowPeep,
    'cmH2O',
    vitals.peep,
  );
}

function addAutoPeepAlarm(alarms: Alarm[], context: AlarmContext) {
  const { thresholds, vitals } = context;
  addAlarm(
    alarms,
    context,
    'pressure',
    'auto-peep',
    'Auto-PEEP',
    `Auto-PEEP ${vitals.autoPeep} cmH2O exceeds the ${thresholds.highAutoPeep} cmH2O threshold.`,
    'medium',
    'warning',
    thresholds.highAutoPeep,
    'cmH2O',
    vitals.autoPeep,
  );
}

function addRespiratoryRateAlarms(alarms: Alarm[], context: AlarmContext) {
  const { thresholds, vitals } = context;

  if (vitals.totalRR <= thresholds.apneaRate) {
    addAlarm(
      alarms,
      context,
      'ventilation',
      'apnea',
      'Apnea',
      `Respiratory rate ${vitals.totalRR}/min meets the apnea alarm threshold; bedside default is ${thresholds.apneaSeconds}s.`,
      'high',
      'critical',
      thresholds.apneaSeconds,
      'sec',
      vitals.totalRR <= 0 ? thresholds.apneaSeconds : Math.round(60 / Math.max(1, vitals.totalRR)),
    );
  } else if (vitals.totalRR < thresholds.bradypneaRate) {
    addBradypneaAlarm(alarms, context);
  }

  if (vitals.totalRR >= thresholds.tachypneaWarning) addTachypneaAlarm(alarms, context);
}

function addBradypneaAlarm(alarms: Alarm[], context: AlarmContext) {
  const { thresholds, vitals } = context;
  addAlarm(
    alarms,
    context,
    'ventilation',
    'bradypnea',
    'Bradypnea',
    `Respiratory rate ${vitals.totalRR}/min is below the ${thresholds.bradypneaRate}/min threshold.`,
    'medium',
    'warning',
    thresholds.bradypneaRate,
    '/min',
    vitals.totalRR,
  );
}

function addTachypneaAlarm(alarms: Alarm[], context: AlarmContext) {
  const { thresholds, vitals } = context;
  const critical = vitals.totalRR >= thresholds.tachypneaCritical;
  addAlarm(
    alarms,
    context,
    'ventilation',
    'high-rr',
    'Tachypnea',
    `Respiratory rate ${vitals.totalRR}/min exceeds the ${thresholds.tachypneaWarning}/min threshold.`,
    critical ? 'high' : 'medium',
    critical ? 'critical' : 'warning',
    thresholds.tachypneaWarning,
    '/min',
    vitals.totalRR,
  );
}

function addHeartRateAlarms(alarms: Alarm[], context: AlarmContext) {
  const { thresholds, vitals } = context;

  if (vitals.heartRate >= thresholds.tachycardiaRate) {
    addAlarm(
      alarms,
      context,
      'hemodynamics',
      'tachycardia',
      'Tachycardia',
      `Heart rate ${vitals.heartRate} bpm exceeds the ${thresholds.tachycardiaRate} bpm threshold.`,
      'medium',
      'warning',
      thresholds.tachycardiaRate,
      'bpm',
      vitals.heartRate,
    );
  }

  if (vitals.heartRate <= thresholds.bradycardiaRate) {
    addAlarm(
      alarms,
      context,
      'hemodynamics',
      'bradycardia',
      'Bradycardia',
      `Heart rate ${vitals.heartRate} bpm is below the ${thresholds.bradycardiaRate} bpm threshold.`,
      'high',
      'critical',
      thresholds.bradycardiaRate,
      'bpm',
      vitals.heartRate,
    );
  }
}

function addBloodPressureAlarms(alarms: Alarm[], context: AlarmContext) {
  const { thresholds, vitals } = context;
  const highBloodPressure =
    vitals.systolicBloodPressure >= thresholds.highSystolicBloodPressure ||
    vitals.diastolicBloodPressure >= thresholds.highDiastolicBloodPressure;
  const lowBloodPressure =
    vitals.systolicBloodPressure <= thresholds.lowSystolicBloodPressure ||
    vitals.diastolicBloodPressure <= thresholds.lowDiastolicBloodPressure;

  if (highBloodPressure) {
    addAlarm(
      alarms,
      context,
      'hemodynamics',
      'hypertension',
      'Hypertension',
      `Blood pressure ${vitals.systolicBloodPressure}/${vitals.diastolicBloodPressure} mmHg meets the ${thresholds.highSystolicBloodPressure}/${thresholds.highDiastolicBloodPressure} alarm threshold.`,
      'medium',
      'warning',
      thresholds.highSystolicBloodPressure,
      'mmHg',
      vitals.systolicBloodPressure,
    );
  }

  if (lowBloodPressure) {
    addAlarm(
      alarms,
      context,
      'hemodynamics',
      'hypotension',
      'Hypotension',
      `Blood pressure ${vitals.systolicBloodPressure}/${vitals.diastolicBloodPressure} mmHg meets the ${thresholds.lowSystolicBloodPressure}/${thresholds.lowDiastolicBloodPressure} alarm threshold.`,
      'high',
      'critical',
      thresholds.lowSystolicBloodPressure,
      'mmHg',
      vitals.systolicBloodPressure,
    );
  }
}

function addTemperatureAlarms(alarms: Alarm[], context: AlarmContext) {
  const { thresholds, vitals } = context;

  if (vitals.temperatureCelsius >= thresholds.highTemperatureCelsius) {
    addAlarm(
      alarms,
      context,
      'temperature',
      'hyperthermia',
      'Hyperthermia',
      `Temperature ${vitals.temperatureCelsius} °C exceeds the ${thresholds.highTemperatureCelsius} °C threshold.`,
      'medium',
      'warning',
      thresholds.highTemperatureCelsius,
      '°C',
      vitals.temperatureCelsius,
    );
  }

  if (vitals.temperatureCelsius <= thresholds.lowTemperatureCelsius) {
    addAlarm(
      alarms,
      context,
      'temperature',
      'hypothermia',
      'Hypothermia',
      `Temperature ${vitals.temperatureCelsius} °C is below the ${thresholds.lowTemperatureCelsius} °C threshold.`,
      'high',
      'critical',
      thresholds.lowTemperatureCelsius,
      '°C',
      vitals.temperatureCelsius,
    );
  }
}

function addVentilationAlarms(alarms: Alarm[], context: AlarmContext) {
  const { thresholds, vitals } = context;

  if (vitals.paco2 > thresholds.highCo2Warning) addHighCo2Alarm(alarms, context);
  if (vitals.paco2 < thresholds.lowCo2) addLowCo2Alarm(alarms, context);
  if (vitals.etco2 > thresholds.highEtco2) addHighEtco2Alarm(alarms, context);
  if (vitals.etco2 < thresholds.lowEtco2) addLowEtco2Alarm(alarms, context);
  if (vitals.minuteVentilation > thresholds.highMinuteVentilation)
    addHighMinuteVentilationAlarm(alarms, context);
  if (vitals.minuteVentilation < thresholds.lowMinuteVentilationWarning) {
    addMinuteVentilationAlarm(alarms, context);
  }
}

function addHighCo2Alarm(alarms: Alarm[], context: AlarmContext) {
  const { thresholds, vitals } = context;
  const critical = vitals.paco2 > thresholds.highCo2Critical;
  addAlarm(
    alarms,
    context,
    'ventilation',
    'high-co2',
    'High CO2',
    `PaCO2 ${vitals.paco2} mmHg exceeds the ${thresholds.highCo2Warning} mmHg threshold.`,
    critical ? 'high' : 'medium',
    critical ? 'critical' : 'warning',
    thresholds.highCo2Warning,
    'mmHg',
    vitals.paco2,
  );
}

function addLowCo2Alarm(alarms: Alarm[], context: AlarmContext) {
  const { thresholds, vitals } = context;
  addAlarm(
    alarms,
    context,
    'ventilation',
    'low-co2',
    'Low CO2',
    `PaCO2 ${vitals.paco2} mmHg is below the ${thresholds.lowCo2} mmHg threshold.`,
    'low',
    'warning',
    thresholds.lowCo2,
    'mmHg',
    vitals.paco2,
    vitals.paco2 >= thresholds.lowCo2 - 1,
  );
}

function addMinuteVentilationAlarm(alarms: Alarm[], context: AlarmContext) {
  const { thresholds, vitals } = context;
  const critical = vitals.minuteVentilation < thresholds.lowMinuteVentilationCritical;
  addAlarm(
    alarms,
    context,
    'ventilation',
    'low-mv',
    'Low Minute Ventilation',
    `Minute ventilation ${vitals.minuteVentilation} L/min is below the ${thresholds.lowMinuteVentilationWarning} L/min threshold.`,
    critical ? 'high' : 'medium',
    critical ? 'critical' : 'warning',
    thresholds.lowMinuteVentilationWarning,
    'L/min',
    vitals.minuteVentilation,
  );
}

function addHighEtco2Alarm(alarms: Alarm[], context: AlarmContext) {
  const { thresholds, vitals } = context;
  addAlarm(
    alarms,
    context,
    'ventilation',
    'high-etco2',
    'High EtCO2',
    `EtCO2 ${vitals.etco2} mmHg exceeds the ${thresholds.highEtco2} mmHg threshold.`,
    'medium',
    'warning',
    thresholds.highEtco2,
    'mmHg',
    vitals.etco2,
  );
}

function addLowEtco2Alarm(alarms: Alarm[], context: AlarmContext) {
  const { thresholds, vitals } = context;
  addAlarm(
    alarms,
    context,
    'ventilation',
    'low-etco2',
    'Low EtCO2',
    `EtCO2 ${vitals.etco2} mmHg is below the ${thresholds.lowEtco2} mmHg threshold.`,
    'low',
    'warning',
    thresholds.lowEtco2,
    'mmHg',
    vitals.etco2,
  );
}

function addHighMinuteVentilationAlarm(alarms: Alarm[], context: AlarmContext) {
  const { thresholds, vitals } = context;
  addAlarm(
    alarms,
    context,
    'ventilation',
    'high-mv',
    'High Minute Ventilation',
    `Minute ventilation ${vitals.minuteVentilation} L/min exceeds the ${thresholds.highMinuteVentilation} L/min threshold.`,
    'medium',
    'warning',
    thresholds.highMinuteVentilation,
    'L/min',
    vitals.minuteVentilation,
  );
}

function addCircuitAlarms(alarms: Alarm[], context: AlarmContext) {
  const { system, thresholds, vitals } = context;
  const disconnected =
    !system.circuitConnected || (vitals.pip <= thresholds.disconnectPressure && vitals.vte < 150);

  if (disconnected) addDisconnectAlarm(alarms, context);
  if (vitals.leak > thresholds.highLeak) addLeakAlarm(alarms, context);
  if (
    vitals.resistance >= thresholds.circuitOcclusionResistance ||
    (vitals.pip > thresholds.highPressureWarning &&
      vitals.minuteVentilation < thresholds.lowMinuteVentilationWarning)
  )
    addOcclusionAlarm(alarms, context);
}

function addDisconnectAlarm(alarms: Alarm[], context: AlarmContext) {
  addAlarm(
    alarms,
    context,
    'circuit',
    'disconnect',
    'Circuit Disconnect',
    'Ventilator circuit appears disconnected or unable to generate pressure.',
    'high',
    'critical',
    context.thresholds.disconnectPressure,
    'cmH2O',
    context.vitals.pip,
  );
}

function addLeakAlarm(alarms: Alarm[], context: AlarmContext) {
  const { thresholds, vitals } = context;
  addAlarm(
    alarms,
    context,
    'circuit',
    'high-leak',
    'Circuit Leak',
    `Measured leak ${vitals.leak}% exceeds the ${thresholds.highLeak}% circuit leak threshold.`,
    'medium',
    'warning',
    thresholds.highLeak,
    '%',
    vitals.leak,
  );
}

function addOcclusionAlarm(alarms: Alarm[], context: AlarmContext) {
  const { thresholds, vitals } = context;
  addAlarm(
    alarms,
    context,
    'circuit',
    'circuit-occlusion',
    'Circuit Occlusion',
    `Resistance ${vitals.resistance} cmH2O/L/s suggests circuit or airway obstruction.`,
    'high',
    'critical',
    thresholds.circuitOcclusionResistance,
    'cmH2O/L/s',
    vitals.resistance,
  );
}

function addSystemAlarms(alarms: Alarm[], context: AlarmContext) {
  const { system, thresholds } = context;

  if (!system.mainsPowerAvailable) addPowerFailureAlarm(alarms, context);
  if (system.systemError) addSystemErrorAlarm(alarms, context);
  if (system.gasSupplyPressure <= thresholds.gasSupplyPressure) addGasSupplyAlarm(alarms, context);
  if (system.batteryPercent <= thresholds.batteryPercent) addBatteryAlarm(alarms, context);
  if (system.oxygenSupplyPressure <= thresholds.oxygenSupplyPressure) addOxygenSupplyAlarm(alarms, context);
}

function addBatteryAlarm(alarms: Alarm[], context: AlarmContext) {
  const { system, thresholds } = context;
  const critical = system.batteryPercent <= thresholds.batteryCriticalPercent;
  addAlarm(
    alarms,
    context,
    'system',
    'low-battery',
    'Battery Low',
    `Battery ${system.batteryPercent}% is below the ${thresholds.batteryPercent}% threshold.`,
    critical ? 'high' : 'low',
    critical ? 'critical' : 'warning',
    thresholds.batteryPercent,
    '%',
    system.batteryPercent,
  );
}

function addPowerFailureAlarm(alarms: Alarm[], context: AlarmContext) {
  addAlarm(
    alarms,
    context,
    'system',
    'power-failure',
    'Power Supply Failure',
    'Mains power is unavailable; ventilator is running on backup power.',
    'high',
    'critical',
    1,
    'state',
    0,
  );
}

function addSystemErrorAlarm(alarms: Alarm[], context: AlarmContext) {
  addAlarm(
    alarms,
    context,
    'system',
    'system-error',
    'System Error',
    'Ventilator system error requires immediate technical and clinical backup.',
    'high',
    'critical',
    1,
    'state',
    1,
  );
}

function addGasSupplyAlarm(alarms: Alarm[], context: AlarmContext) {
  const { system, thresholds } = context;
  addAlarm(
    alarms,
    context,
    'system',
    'gas-supply-low',
    'Gas Supply Low',
    `Medical gas supply pressure ${system.gasSupplyPressure} psi is below the ${thresholds.gasSupplyPressure} psi threshold.`,
    'high',
    'critical',
    thresholds.gasSupplyPressure,
    'psi',
    system.gasSupplyPressure,
  );
}

function addOxygenSupplyAlarm(alarms: Alarm[], context: AlarmContext) {
  const { system, thresholds } = context;
  const critical = system.oxygenSupplyPressure <= 35;
  addAlarm(
    alarms,
    context,
    'system',
    'oxygen-supply-low',
    'Oxygen Supply Low',
    `Oxygen supply pressure ${system.oxygenSupplyPressure} psi is below the ${thresholds.oxygenSupplyPressure} psi threshold.`,
    critical ? 'high' : 'medium',
    critical ? 'critical' : 'warning',
    thresholds.oxygenSupplyPressure,
    'psi',
    system.oxygenSupplyPressure,
  );
}
