import type { Scenario, VentSettings } from './scenarios';
import type { DerivedVitals } from './ventilatorTypes';
import { calculateAnionGap, calculateBaseExcess, calculateHendersonHasselbalchPh } from './acidBase';
import { clamp, finiteOr } from './ventilatorMath';

type NormalizedVentSettings = {
  fio2: number;
  flow: number;
  inspiratoryTime: number;
  mode: VentSettings['mode'];
  modePressureModifier: number;
  modeVentilationFactor: number;
  peep: number;
  respiratoryRate: number;
  tidalVolume: number;
  trigger: number;
};

type RespiratoryMechanics = {
  airwayResistance: number;
  alveolarVentilation: number;
  autoPeep: number;
  compliance: number;
  deadSpaceFraction: number;
  drivingPressure: number;
  dynamicCompliance: number;
  frc: number;
  leak: number;
  lowerInflectionPoint: number;
  lungProtectiveTidalVolume: number;
  mandatoryTidalVolume: number;
  mechanicalPower: number;
  minuteVentilation: number;
  negativeInspiratoryForce: number;
  optimalPeep: number;
  plateau: number;
  predictedBodyWeight: number;
  pip: number;
  resistance: number;
  rsbi: number;
  spontaneousTidalVolume: number;
  staticCompliance: number;
  strain: number;
  stressIndex: number;
  transpulmonaryStress: number;
  triggerWorkPenalty: number;
  upperInflectionPoint: number;
  vitalCapacity: number;
  vte: number;
};

type GasExchange = {
  anionGap: number;
  baseExcess: number;
  diastolicBloodPressure: number;
  etco2: number;
  hco3: number;
  heartRate: number;
  lactate: number;
  meanArterialPressure: number;
  paco2: number;
  pao2: number;
  pao2fio2: number;
  ph: number;
  spo2: number;
  systolicBloodPressure: number;
  temperatureCelsius: number;
  totalRR: number;
};

export type VitalsCalculationOptions = {
  elapsedSeconds?: number;
};

/** Calculates simplified educational vitals from ventilator controls and a lung scenario. */
export function calculateVitals(
  settings: VentSettings,
  scenario: Scenario,
  options: VitalsCalculationOptions = {},
): DerivedVitals {
  const normalized = normalizeVentSettings(settings);
  const mechanics = calculateRespiratoryMechanics(normalized, scenario);
  const gasExchange = calculateGasExchange(normalized, scenario, mechanics);
  const response = calculatePhysiologyResponse(normalized, scenario, mechanics, options.elapsedSeconds ?? 0);
  const adjustedGasExchange = applyTimeResponse(gasExchange, response);

  return {
    compliance: Number(mechanics.compliance.toFixed(1)),
    anionGap: adjustedGasExchange.anionGap,
    airwayResistance: mechanics.airwayResistance,
    alveolarVentilation: Number(mechanics.alveolarVentilation.toFixed(1)),
    atelectraumaRisk: response.atelectraumaRisk,
    autoPeep: mechanics.autoPeep,
    barotraumaRisk: response.barotraumaRisk,
    baseExcess: adjustedGasExchange.baseExcess,
    biotraumaRisk: response.biotraumaRisk,
    cardiacOutput: response.cardiacOutput,
    co2ResponsePercent: response.co2ResponsePercent,
    co2RetentionPattern: getCo2RetentionPattern(adjustedGasExchange.paco2, adjustedGasExchange.etco2),
    deadSpaceFraction: Number(mechanics.deadSpaceFraction.toFixed(2)),
    diffusionLimitationIndex: response.diffusionLimitationIndex,
    deteriorationTrajectory: response.deteriorationTrajectory,
    drivingPressure: mechanics.drivingPressure,
    drivingPressureSafe: mechanics.drivingPressure < 15,
    dynamicCompliance: mechanics.dynamicCompliance,
    etco2: adjustedGasExchange.etco2,
    fio2: normalized.fio2,
    frc: mechanics.frc,
    hco3: adjustedGasExchange.hco3,
    heartRate: adjustedGasExchange.heartRate,
    hemodynamicPeepPenalty: response.hemodynamicPeepPenalty,
    diastolicBloodPressure: adjustedGasExchange.diastolicBloodPressure,
    intrathoracicPressure: response.intrathoracicPressure,
    lactate: adjustedGasExchange.lactate,
    leak: mechanics.leak,
    lowerInflectionPoint: mechanics.lowerInflectionPoint,
    lungProtectiveTidalVolume: mechanics.lungProtectiveTidalVolume,
    mandatoryTidalVolume: Math.round(mechanics.mandatoryTidalVolume),
    mechanicalPower: mechanics.mechanicalPower,
    meanArterialPressure: adjustedGasExchange.meanArterialPressure,
    minuteVentilation: Number(mechanics.minuteVentilation.toFixed(1)),
    negativeInspiratoryForce: mechanics.negativeInspiratoryForce,
    optimalPeep: mechanics.optimalPeep,
    oxygenationResponsePercent: response.oxygenationResponsePercent,
    oxygenationPattern: getOxygenationPattern(
      adjustedGasExchange.spo2,
      adjustedGasExchange.pao2fio2,
      response.shuntFraction,
    ),
    paco2: adjustedGasExchange.paco2,
    pao2: adjustedGasExchange.pao2,
    pao2fio2: adjustedGasExchange.pao2fio2,
    peep: normalized.peep,
    permissiveHypercapnia: adjustedGasExchange.paco2 <= 65 && adjustedGasExchange.ph >= 7.2,
    plateauSafe: mechanics.plateau < 30,
    predictedBodyWeight: mechanics.predictedBodyWeight,
    pulmonaryVascularResistance: response.pulmonaryVascularResistance,
    ph: Number(adjustedGasExchange.ph.toFixed(2)),
    pip: Number(mechanics.pip.toFixed(1)),
    plateau: Number(mechanics.plateau.toFixed(1)),
    resistance: Number(mechanics.resistance.toFixed(1)),
    rightVentricleAfterload: response.rightVentricleAfterload,
    rsbi: mechanics.rsbi,
    recoveryTrajectory: response.recoveryTrajectory,
    settingResponseScore: response.settingResponseScore,
    shuntFraction: response.shuntFraction,
    spo2: adjustedGasExchange.spo2,
    spontaneousTidalVolume: Math.round(mechanics.spontaneousTidalVolume),
    staticCompliance: mechanics.staticCompliance,
    strain: mechanics.strain,
    stressIndex: mechanics.stressIndex,
    systolicBloodPressure: adjustedGasExchange.systolicBloodPressure,
    temperatureCelsius: adjustedGasExchange.temperatureCelsius,
    temporalVariation: response.temporalVariation,
    transpulmonaryStress: mechanics.transpulmonaryStress,
    totalRR: adjustedGasExchange.totalRR,
    upperInflectionPoint: mechanics.upperInflectionPoint,
    venousReturnIndex: response.venousReturnIndex,
    vitalCapacity: mechanics.vitalCapacity,
    vqMismatchIndex: response.vqMismatchIndex,
    vte: Math.round(mechanics.vte),
    volutraumaRisk: response.volutraumaRisk,
    viliRisk: response.viliRisk,
  };
}

function normalizeVentSettings(settings: VentSettings): NormalizedVentSettings {
  return {
    fio2: clamp(finiteOr(settings.fio2, 40), 21, 100),
    flow: clamp(finiteOr(settings.flow, 50), 10, 100),
    inspiratoryTime: clamp(finiteOr(settings.inspiratoryTime, 1), 0.1, 3),
    mode: settings.mode,
    modePressureModifier: getModePressureModifier(settings.mode),
    modeVentilationFactor: getModeVentilationFactor(settings.mode),
    peep: clamp(finiteOr(settings.peep, 5), 0, 24),
    respiratoryRate: clamp(finiteOr(settings.respiratoryRate, 16), 4, 40),
    tidalVolume: clamp(finiteOr(settings.tidalVolume, 500), 100, 1000),
    trigger: clamp(finiteOr(settings.trigger, 2), 0.5, 15),
  };
}

function calculatePhysiologyResponse(
  settings: NormalizedVentSettings,
  scenario: Scenario,
  mechanics: RespiratoryMechanics,
  elapsedSeconds: number,
) {
  const timeProgress = clamp(elapsedSeconds / 900, 0, 1);
  const temporalVariation = Number(
    (Math.sin(elapsedSeconds / 37) * 0.8 + Math.sin(elapsedSeconds / 91) * 0.5).toFixed(2),
  );
  const oxygenationResponsePercent = Number(
    clamp((settings.fio2 - 21) * 0.65 + settings.peep * 2.2 - scenario.shunt * 35, 0, 100).toFixed(1),
  );
  const co2ResponsePercent = Number(
    clamp(mechanics.alveolarVentilation * 9 - scenario.severity * 12, 0, 100).toFixed(1),
  );
  const protectiveVt = mechanics.lungProtectiveTidalVolume;
  const barotraumaRisk = Number(
    clamp(Math.max(0, mechanics.pip - 35) / 22 + Math.max(0, mechanics.plateau - 30) / 18, 0, 1).toFixed(2),
  );
  const volutraumaRisk = Number(
    clamp(Math.max(0, settings.tidalVolume / protectiveVt - 1.15) * 1.6, 0, 1).toFixed(2),
  );
  const atelectraumaRisk = Number(
    clamp(
      Math.max(0, mechanics.optimalPeep - settings.peep) / Math.max(1, mechanics.optimalPeep),
      0,
      1,
    ).toFixed(2),
  );
  const hemodynamicPeepPenalty = Number(clamp(Math.max(0, settings.peep - 12) * 1.8, 0, 18).toFixed(1));
  const shuntFraction = Number(
    clamp(
      scenario.shunt + atelectraumaRisk * 0.08 - Math.max(0, settings.peep - 5) * 0.01,
      0.05,
      0.85,
    ).toFixed(2),
  );
  const vqMismatchIndex = Number(
    clamp(shuntFraction * 0.55 + mechanics.deadSpaceFraction * 0.55 + scenario.severity * 0.18, 0, 1).toFixed(
      2,
    ),
  );
  const diffusionLimitationIndex = Number(
    clamp(
      scenario.severity * 0.55 +
        (scenario.type === 'pulmonaryFibrosis' ? 0.25 : 0) +
        (scenario.baselineCompliance < 22 ? 0.12 : 0),
      0,
      1,
    ).toFixed(2),
  );
  const intrathoracicPressure = Number(
    (settings.peep + mechanics.plateau * 0.35 + mechanics.autoPeep).toFixed(1),
  );
  const venousReturnIndex = Number(
    clamp(
      100 - settings.peep * 2.1 - mechanics.autoPeep * 2.4 - intrathoracicPressure * 0.45,
      35,
      105,
    ).toFixed(1),
  );
  const pulmonaryVascularResistance = Math.round(
    clamp(
      120 +
        shuntFraction * 95 +
        mechanics.deadSpaceFraction * 80 +
        diffusionLimitationIndex * 45 +
        settings.peep * 2.5,
      90,
      320,
    ),
  );
  const rightVentricleAfterload = Number(
    clamp(pulmonaryVascularResistance / 160 + Math.max(0, settings.peep - 10) * 0.04, 0.7, 2.6).toFixed(2),
  );
  const biotraumaRisk = Number(
    clamp(
      scenario.severity * 0.45 + (barotraumaRisk + volutraumaRisk + atelectraumaRisk) * 0.18,
      0,
      1,
    ).toFixed(2),
  );
  const viliRisk = Number(
    clamp(
      Math.max(barotraumaRisk, volutraumaRisk, atelectraumaRisk) * 0.65 +
        mechanics.mechanicalPower / 80 +
        biotraumaRisk * 0.15,
      0,
      1,
    ).toFixed(2),
  );
  const settingResponseScore = Number(
    clamp(
      oxygenationResponsePercent * 0.42 +
        co2ResponsePercent * 0.28 +
        (mechanics.drivingPressure < 15 ? 18 : 4) -
        viliRisk * 18 -
        hemodynamicPeepPenalty,
      0,
      100,
    ).toFixed(1),
  );
  const recoveryTrajectory = Number(
    clamp(settingResponseScore >= 50 ? timeProgress * (settingResponseScore / 100) : 0, 0, 1).toFixed(2),
  );
  const deteriorationTrajectory = Number(
    clamp(
      (viliRisk * 0.7 +
        scenario.severity * 0.15 +
        (settingResponseScore < 35 ? 0.25 : 0) -
        (settingResponseScore >= 50 ? 0.16 : 0)) *
        timeProgress,
      0,
      1,
    ).toFixed(2),
  );
  const cardiacOutput = Number(
    clamp(
      5.4 * (venousReturnIndex / 100) - hemodynamicPeepPenalty * 0.035 - deteriorationTrajectory * 0.7,
      2.2,
      7.2,
    ).toFixed(1),
  );

  return {
    atelectraumaRisk,
    barotraumaRisk,
    biotraumaRisk,
    cardiacOutput,
    co2ResponsePercent,
    diffusionLimitationIndex,
    deteriorationTrajectory,
    hemodynamicPeepPenalty,
    intrathoracicPressure,
    oxygenationResponsePercent,
    pulmonaryVascularResistance,
    recoveryTrajectory,
    rightVentricleAfterload,
    settingResponseScore,
    shuntFraction,
    temporalVariation,
    venousReturnIndex,
    viliRisk,
    volutraumaRisk,
    vqMismatchIndex,
  };
}

function applyTimeResponse(
  gasExchange: GasExchange,
  response: ReturnType<typeof calculatePhysiologyResponse>,
): GasExchange {
  const fio2Fraction = gasExchange.pao2 / Math.max(1, gasExchange.pao2fio2);
  const oxygenDelta =
    response.temporalVariation + response.recoveryTrajectory * 5 - response.deteriorationTrajectory * 8;
  const co2Delta =
    -response.recoveryTrajectory * 6 +
    response.deteriorationTrajectory * 10 -
    (response.co2ResponsePercent - 50) * 0.025;
  const paco2 = clamp(Math.round(gasExchange.paco2 + co2Delta), 28, 90);
  const hco3 = clamp(Math.round(gasExchange.hco3 + Math.max(0, paco2 - gasExchange.paco2) * 0.08), 12, 34);
  const ph = clamp(calculateHendersonHasselbalchPh(hco3, paco2), 7.05, 7.5);
  const spo2 = clamp(Math.round(gasExchange.spo2 + oxygenDelta), 65, 99);
  const pao2 = clamp(
    Math.round(gasExchange.pao2 + oxygenDelta * 3.6 + response.recoveryTrajectory * 10),
    35,
    190,
  );
  const systolicBloodPressure = Math.round(
    gasExchange.systolicBloodPressure -
      response.hemodynamicPeepPenalty -
      response.deteriorationTrajectory * 9,
  );
  const diastolicBloodPressure = Math.round(
    gasExchange.diastolicBloodPressure -
      response.hemodynamicPeepPenalty * 0.45 -
      response.deteriorationTrajectory * 4,
  );

  return {
    ...gasExchange,
    anionGap: calculateAnionGap(138, 102, hco3),
    baseExcess: calculateBaseExcess(ph, hco3),
    diastolicBloodPressure,
    etco2: clamp(Math.round(paco2 - (gasExchange.paco2 - gasExchange.etco2)), 20, 80),
    hco3,
    heartRate: Math.round(
      gasExchange.heartRate + response.deteriorationTrajectory * 16 - response.recoveryTrajectory * 6,
    ),
    lactate: Number(
      clamp(
        gasExchange.lactate + response.deteriorationTrajectory * 1.1 - response.recoveryTrajectory * 0.4,
        0.7,
        7,
      ).toFixed(1),
    ),
    meanArterialPressure: Math.round((systolicBloodPressure + diastolicBloodPressure * 2) / 3),
    paco2,
    pao2,
    pao2fio2: Math.round(pao2 / Math.max(0.21, fio2Fraction)),
    ph,
    spo2,
    systolicBloodPressure,
    totalRR: clamp(
      Math.round(
        gasExchange.totalRR + response.deteriorationTrajectory * 6 - response.recoveryTrajectory * 3,
      ),
      4,
      48,
    ),
  };
}

function getCo2RetentionPattern(paco2: number, etco2: number) {
  const deadSpaceGradient = paco2 - etco2;

  if (paco2 >= 65) {
    return deadSpaceGradient > 8 ? 'severe CO2 retention with dead-space gradient' : 'severe CO2 retention';
  }
  if (paco2 >= 50) {
    return deadSpaceGradient > 8
      ? 'moderate CO2 retention with dead-space gradient'
      : 'moderate CO2 retention';
  }
  if (paco2 <= 32) {
    return 'hypocapnia / over-ventilation';
  }

  return 'normocapnia pattern';
}

function getOxygenationPattern(spo2: number, pao2fio2: number, shuntFraction: number) {
  if (pao2fio2 < 100 || spo2 < 85) {
    return 'severe refractory hypoxemia';
  }
  if (pao2fio2 < 200 || shuntFraction >= 0.45) {
    return 'shunt-dominant oxygenation failure';
  }
  if (pao2fio2 < 300) {
    return 'mild diffusion/VQ oxygenation impairment';
  }

  return 'oxygenation preserved';
}

function getModeVentilationFactor(mode: VentSettings['mode']) {
  return {
    AC: 1,
    APRV: 0.9,
    BiPAP: 0.82,
    CPAP: 0.64,
    HFOV: 0.42,
    ASV: 0.88,
    IntelliVent: 0.9,
    NAVA: 0.9,
    NIV: 0.76,
    PAV: 0.92,
    PC: 0.94,
    PRVC: 0.98,
    PSV: 0.86,
    SIMV: 0.92,
    SmartCare: 0.84,
    VC: 1,
    VS: 0.9,
  }[mode];
}

function getModePressureModifier(mode: VentSettings['mode']) {
  return {
    AC: 0,
    APRV: 4,
    BiPAP: 2,
    CPAP: -3,
    HFOV: 6,
    ASV: 1.2,
    IntelliVent: 1,
    NAVA: -0.5,
    NIV: 1.5,
    PAV: -0.4,
    PC: 1.8,
    PRVC: 1.2,
    PSV: -1,
    SIMV: 0.8,
    SmartCare: -0.8,
    VC: 0,
    VS: -0.6,
  }[mode];
}

function calculateRespiratoryMechanics(
  settings: NormalizedVentSettings,
  scenario: Scenario,
): RespiratoryMechanics {
  // PEEP can recruit alveoli at moderate levels, but excessive PEEP lowers compliance through overdistension.
  const recruitment = clamp((settings.peep - 5) * 0.08, 0, 0.5);
  const overdistension = settings.peep > 14 ? (settings.peep - 14) * 0.08 : 0;
  const compliance = clamp(scenario.baselineCompliance * (1 + recruitment - overdistension), 10, 65);
  const resistance = clamp(scenario.baselineResistance + scenario.secretionLevel * 6, 5, 40);
  const leak = scenario.type === 'pneumothorax' ? 6 : 2;
  const vte = calculateExhaledTidalVolume(settings, compliance, leak);
  const minuteVentilation = (vte * settings.respiratoryRate) / 1000;
  // High trigger thresholds model increased patient work and worsen gas exchange downstream.
  const triggerWorkPenalty = clamp((settings.trigger - 2) * 0.6, 0, 7);
  const inspiratoryPressurePenalty =
    settings.inspiratoryTime < 0.8 ? (0.8 - settings.inspiratoryTime) * 4 : 0;
  const plateau = settings.peep + settings.tidalVolume / compliance;
  const pip =
    plateau +
    resistance * (settings.flow / 60) * 0.45 +
    inspiratoryPressurePenalty +
    (scenario.type === 'airwayObstruction' ? 2.2 : 0) +
    settings.modePressureModifier;
  const drivingPressure = plateau - settings.peep;
  const staticCompliance = vte / Math.max(1, drivingPressure);
  const dynamicCompliance = vte / Math.max(1, pip - settings.peep);
  const airwayResistance = (pip - plateau) / Math.max(0.1, settings.flow / 60);
  const expiratoryTime = Math.max(0.1, 60 / settings.respiratoryRate - settings.inspiratoryTime);
  const obstructionAutoPeep = scenario.type === 'airwayObstruction' ? 2 : 0;
  const autoPeep = clamp(
    obstructionAutoPeep +
      (resistance - 12) * 0.08 +
      (settings.respiratoryRate - 18) * 0.07 +
      (1.2 - expiratoryTime) * 1.4,
    0,
    8,
  );
  const deadSpaceFraction = clamp(0.25 + scenario.severity * 0.35, 0.25, 0.7);
  const alveolarVentilation = minuteVentilation * (1 - deadSpaceFraction);
  const spontaneousFraction = getSpontaneousVentilationFraction(settings.mode);
  const spontaneousTidalVolume = vte * spontaneousFraction;
  const mandatoryTidalVolume = vte - spontaneousTidalVolume;
  const predictedBodyWeight = 65;
  const lungProtectiveTidalVolume = Math.round(predictedBodyWeight * 6);
  const rsbi = Math.round(
    settings.respiratoryRate / Math.max(0.1, spontaneousTidalVolume / 1000 || vte / 1000),
  );
  const negativeInspiratoryForce = -Math.round(clamp(18 + compliance * 0.28 - scenario.severity * 6, 8, 35));
  const vitalCapacity = Math.round(clamp(predictedBodyWeight * (58 - scenario.severity * 18), 900, 4200));
  const lowerInflectionPoint = Math.round(
    clamp(4 + scenario.severity * 7 + (scenario.type === 'ards' ? 2 : 0), 4, 16),
  );
  const upperInflectionPoint = Math.round(clamp(24 - compliance / 8 + scenario.severity * 4, 16, 30));
  const optimalPeep = lowerInflectionPoint + 2;
  const stressIndex = Number(
    clamp(
      1 + overdistension * 0.8 - recruitment * 0.25 + (scenario.type === 'ards' ? 0.12 : 0),
      0.7,
      1.4,
    ).toFixed(2),
  );
  const mechanicalPower = Number(
    (
      0.098 *
      settings.respiratoryRate *
      (vte / 1000) *
      (settings.peep + drivingPressure + (pip - plateau) * 0.5)
    ).toFixed(1),
  );
  const transpulmonaryStress = Number((drivingPressure / Math.max(0.35, scenario.frc / 1000)).toFixed(1));
  const strain = Number((vte / Math.max(1, scenario.frc)).toFixed(2));

  return {
    airwayResistance: Number(airwayResistance.toFixed(1)),
    alveolarVentilation,
    autoPeep: Number(autoPeep.toFixed(1)),
    compliance,
    deadSpaceFraction,
    drivingPressure: Number(drivingPressure.toFixed(1)),
    dynamicCompliance: Number(dynamicCompliance.toFixed(1)),
    frc: Math.round(clamp(scenario.frc + (settings.peep - 5) * 85, 650, 2600)),
    leak,
    lowerInflectionPoint,
    lungProtectiveTidalVolume,
    mandatoryTidalVolume,
    mechanicalPower,
    minuteVentilation,
    negativeInspiratoryForce,
    optimalPeep,
    pip,
    plateau,
    predictedBodyWeight,
    resistance,
    rsbi,
    spontaneousTidalVolume,
    staticCompliance: Number(staticCompliance.toFixed(1)),
    strain,
    stressIndex,
    transpulmonaryStress,
    triggerWorkPenalty,
    upperInflectionPoint,
    vitalCapacity,
    vte,
  };
}

function getSpontaneousVentilationFraction(mode: VentSettings['mode']) {
  return {
    AC: 0.08,
    APRV: 0.22,
    BiPAP: 0.46,
    CPAP: 0.72,
    HFOV: 0.04,
    ASV: 0.42,
    IntelliVent: 0.48,
    NAVA: 0.78,
    NIV: 0.58,
    PAV: 0.76,
    PC: 0.14,
    PRVC: 0.12,
    PSV: 0.82,
    SIMV: 0.35,
    SmartCare: 0.86,
    VC: 0.06,
    VS: 0.82,
  }[mode];
}

function calculateExhaledTidalVolume(settings: NormalizedVentSettings, compliance: number, leak: number) {
  return (
    settings.tidalVolume *
    settings.modeVentilationFactor *
    (1 - leak / 100) *
    clamp(0.85 + compliance / 200, 0.82, 1.02)
  );
}

function calculateGasExchange(
  settings: NormalizedVentSettings,
  scenario: Scenario,
  mechanics: RespiratoryMechanics,
): GasExchange {
  const oxygen = calculateOxygenation(settings, scenario, mechanics.triggerWorkPenalty);
  const ventilation = calculateVentilation(scenario, mechanics.minuteVentilation);
  const lactate = Number(
    clamp(
      1 +
        scenario.severity * 2.2 +
        Math.max(0, 90 - oxygen.spo2) * 0.08 +
        mechanics.triggerWorkPenalty * 0.05,
      0.7,
      6.5,
    ).toFixed(1),
  );
  const totalRR = settings.respiratoryRate + (oxygen.spo2 < 88 ? 12 : oxygen.spo2 < 92 ? 6 : 0);
  const triggeredRR = totalRR + Math.round(mechanics.triggerWorkPenalty);
  const heartRate = Math.round(
    80 +
      Math.max(0, 92 - oxygen.spo2) * 2.8 +
      Math.max(0, ventilation.paco2 - 45) * 1.25 +
      mechanics.triggerWorkPenalty * 1.7,
  );
  const hemodynamics = calculateHemodynamics(scenario, oxygen.spo2);

  return {
    ...oxygen,
    ...ventilation,
    ...hemodynamics,
    heartRate,
    lactate,
    totalRR: triggeredRR,
  };
}

function calculateHemodynamics(scenario: Scenario, spo2: number) {
  const scenarioStress =
    scenario.severity > 0.85 ? 22 : scenario.severity > 0.55 ? 14 : scenario.severity > 0.25 ? 7 : 0;
  const hypoxiaPenalty = Math.max(0, 90 - spo2);
  const septicPenalty =
    scenario.type === 'sepsisRespiratoryFailure' || scenario.type === 'cardiogenicShock' ? 18 : 0;
  const systolicBloodPressure = Math.round(118 + scenarioStress - hypoxiaPenalty * 1.4 - septicPenalty);
  const diastolicBloodPressure = Math.round(
    72 + scenarioStress * 0.35 - hypoxiaPenalty * 0.5 - septicPenalty * 0.45,
  );
  const meanArterialPressure = Math.round((systolicBloodPressure + diastolicBloodPressure * 2) / 3);
  const infectiousFever =
    scenario.type === 'pneumonia' ||
    scenario.type === 'aspirationPneumonia' ||
    scenario.type === 'sepsisRespiratoryFailure' ||
    scenario.type === 'covidArds';
  const temperatureCelsius = infectiousFever
    ? 38.6
    : scenario.type === 'ards' || scenario.type === 'drowning' || scenario.type === 'burnInhalation'
      ? 37.8
      : 36.8 + Math.min(0.5, scenario.severity * 0.4);

  return {
    diastolicBloodPressure,
    meanArterialPressure,
    systolicBloodPressure,
    temperatureCelsius: Number(temperatureCelsius.toFixed(1)),
  };
}

function calculateOxygenation(
  settings: NormalizedVentSettings,
  scenario: Scenario,
  triggerWorkPenalty: number,
) {
  // Teaching approximation: FiO2/PEEP improve oxygenation while shunt and overdistension reduce it.
  const recruitment = clamp((settings.peep - 5) * 0.08, 0, 0.5);
  const overdistension = settings.peep > 14 ? (settings.peep - 14) * 0.08 : 0;
  const inspiratoryOxygenBonus = clamp((settings.inspiratoryTime - 1) * 1.2, 0, 2.4);
  const oxygenScore =
    78 +
    settings.fio2 * 0.25 +
    settings.peep * 1.8 +
    recruitment * 8 -
    scenario.shunt * 18 -
    overdistension * 8 +
    inspiratoryOxygenBonus -
    triggerWorkPenalty * 0.35;
  const spo2 = clamp(Math.round(oxygenScore), 65, 99);
  const pao2 = clamp(Math.round(35 + Math.max(0, spo2 - 75) * 1.25 + Math.max(0, spo2 - 90) * 4.8), 35, 180);

  return {
    pao2,
    pao2fio2: Math.round(pao2 / (settings.fio2 / 100)),
    spo2,
  };
}

function calculateVentilation(scenario: Scenario, minuteVentilation: number) {
  // Effective ventilation falls as scenario severity increases dead-space burden.
  const deadspaceFraction = clamp(0.25 + scenario.severity * 0.35, 0.25, 0.7);
  const effectiveMinuteVentilation = Math.max(1, minuteVentilation * (1 - deadspaceFraction));
  const paco2 = clamp(Math.round(40 * (4.5 / effectiveMinuteVentilation) + scenario.severity * 8), 28, 90);
  const hco3 = clamp(Math.round(24 - scenario.severity * 4 + Math.max(0, paco2 - 45) * 0.12), 12, 34);
  const ph = calculateHendersonHasselbalchPh(hco3, paco2);

  return {
    anionGap: calculateAnionGap(138, 102, hco3),
    baseExcess: calculateBaseExcess(ph, hco3),
    etco2: clamp(Math.round(paco2 - (scenario.severity > 0.7 ? 0 : 5)), 20, 80),
    hco3,
    paco2,
    ph: clamp(ph, 7.05, 7.5),
  };
}
