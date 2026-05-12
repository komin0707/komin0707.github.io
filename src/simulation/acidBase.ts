import type { DerivedVitals } from './ventilatorTypes';

const NORMAL_SODIUM = 138;
const NORMAL_CHLORIDE = 102;

export type AcidBaseAssessment = {
  anionGapFormula: string;
  baseExcessClassification: string;
  compensation: string;
  hendersonHasselbalchPh: number;
  hco3Classification: string;
  lactateClassification: string;
  pao2Classification: string;
  paco2Classification: string;
  pfClassification: string;
  phClassification: string;
  primaryDisorder: string;
  report: readonly string[];
  trendGraphMetrics: readonly string[];
  wintersExpectedPaco2Range: readonly [number, number];
};

export function classifyPh(ph: number): string {
  if (ph < 7.2) return 'severe acidemia (pH < 7.20)';
  if (ph < 7.35) return 'mild acidosis (pH 7.20-7.35)';
  if (ph <= 7.45) return 'normal range (pH 7.35-7.45)';
  return 'alkalemia (pH > 7.45)';
}

export function classifyPaco2(paco2: number): string {
  if (paco2 < 35) return 'hypocapnia (PaCO2 < 35 mmHg)';
  if (paco2 <= 45) return 'normal range (PaCO2 35-45 mmHg)';
  if (paco2 <= 60) return 'mild hypercapnia (PaCO2 46-60 mmHg)';
  return 'severe hypercapnia (PaCO2 > 60 mmHg), CO2 narcosis risk';
}

export function classifyPao2(pao2: number): string {
  if (pao2 < 60) return 'Type I respiratory failure range (PaO2 < 60 mmHg)';
  if (pao2 < 80) return 'mild hypoxemia (PaO2 60-80 mmHg)';
  return 'normal range (PaO2 80-100 mmHg)';
}

export function classifyHco3(hco3: number): string {
  if (hco3 < 22) return 'low bicarbonate';
  if (hco3 <= 26) return 'normal range (HCO3 22-26 mEq/L)';
  return 'elevated bicarbonate';
}

export function classifyPfRatio(pao2fio2: number): string {
  if (pao2fio2 < 100) return 'severe ARDS range by Berlin criteria (P/F < 100)';
  if (pao2fio2 <= 200) return 'moderate ARDS range by Berlin criteria (P/F 100-200)';
  if (pao2fio2 < 300) return 'mild ARDS range by Berlin criteria (P/F < 300)';
  return 'not in ARDS oxygenation range';
}

export function classifyBaseExcess(baseExcess: number): string {
  if (baseExcess < -3) return 'metabolic base deficit';
  if (baseExcess > 3) return 'metabolic base excess';
  return 'normal base excess range';
}

export function classifyLactate(lactate: number): string {
  if (lactate >= 4) return 'severe hyperlactatemia, shock risk';
  if (lactate > 2) return 'elevated lactate, tissue perfusion risk';
  return 'normal lactate perfusion marker';
}

export function calculateAnionGap(sodium: number, chloride: number, hco3: number): number {
  return Math.round(sodium - (chloride + hco3));
}

export function calculateBaseExcess(ph: number, hco3: number): number {
  return Number((0.93 * (hco3 - 24.4 + 14.8 * (ph - 7.4))).toFixed(1));
}

export function calculateHendersonHasselbalchPh(hco3: number, paco2: number): number {
  return Number((6.1 + Math.log10(hco3 / (0.03 * paco2))).toFixed(2));
}

export function calculateWintersExpectedPaco2Range(hco3: number): readonly [number, number] {
  const expected = 1.5 * hco3 + 8;
  return [Math.round(expected - 2), Math.round(expected + 2)];
}

export function buildAcidBaseAssessment(vitals: DerivedVitals): AcidBaseAssessment {
  const phClassification = classifyPh(vitals.ph);
  const paco2Classification = classifyPaco2(vitals.paco2);
  const pao2Classification = classifyPao2(vitals.pao2);
  const hco3Classification = classifyHco3(vitals.hco3);
  const baseExcessClassification = classifyBaseExcess(vitals.baseExcess);
  const lactateClassification = classifyLactate(vitals.lactate);
  const pfClassification = classifyPfRatio(vitals.pao2fio2);
  const hendersonHasselbalchPh = calculateHendersonHasselbalchPh(vitals.hco3, vitals.paco2);
  const wintersExpectedPaco2Range = calculateWintersExpectedPaco2Range(vitals.hco3);
  const primaryDisorder = classifyPrimaryDisorder(vitals);
  const compensation = classifyCompensation(vitals, wintersExpectedPaco2Range);

  return {
    anionGapFormula: 'Na - (Cl + HCO3)',
    baseExcessClassification,
    compensation,
    hendersonHasselbalchPh,
    hco3Classification,
    lactateClassification,
    pao2Classification,
    paco2Classification,
    pfClassification,
    phClassification,
    primaryDisorder,
    report: [
      `pH ${vitals.ph.toFixed(2)} - ${phClassification}`,
      `PaCO2 ${vitals.paco2} mmHg - ${paco2Classification}`,
      `PaO2 ${vitals.pao2} mmHg - ${pao2Classification}`,
      `HCO3 ${vitals.hco3} mEq/L - ${hco3Classification}`,
      `Anion gap ${vitals.anionGap} mEq/L = ${NORMAL_SODIUM} - (${NORMAL_CHLORIDE} + ${vitals.hco3})`,
      `Base excess ${formatSigned(vitals.baseExcess)} mEq/L - ${baseExcessClassification}`,
      `P/F ${vitals.pao2fio2} - ${pfClassification}`,
      `Lactate ${vitals.lactate.toFixed(1)} mmol/L - ${lactateClassification}`,
      `Primary disorder: ${primaryDisorder}`,
      `Compensation: ${compensation}`,
      `Winters expected PaCO2 ${wintersExpectedPaco2Range[0]}-${wintersExpectedPaco2Range[1]} mmHg`,
      `Henderson-Hasselbalch pH ${hendersonHasselbalchPh.toFixed(2)}`,
    ],
    trendGraphMetrics: ['pH', 'PaCO2', 'PaO2', 'HCO3', 'Lactate', 'P/F'],
    wintersExpectedPaco2Range,
  };
}

function classifyPrimaryDisorder(vitals: DerivedVitals): string {
  if (vitals.paco2 > 45 && vitals.ph < 7.35) return 'primary respiratory acidosis';
  if (vitals.paco2 < 35 && vitals.ph > 7.45) return 'primary respiratory alkalosis';
  if (vitals.hco3 < 22 && vitals.ph < 7.35) return 'primary metabolic acidosis';
  if (vitals.hco3 > 26 && vitals.ph > 7.45) return 'primary metabolic alkalosis';
  if (vitals.paco2 > 45 && vitals.hco3 > 26) return 'compensated respiratory acidosis pattern';
  if (vitals.paco2 < 35 && vitals.hco3 < 22) return 'compensated respiratory alkalosis pattern';
  return 'no dominant acid-base disorder';
}

function classifyCompensation(
  vitals: DerivedVitals,
  wintersExpectedPaco2Range: readonly [number, number],
): string {
  if (vitals.paco2 > 45 && vitals.ph < 7.35) {
    const acuteHco3 = 24 + ((vitals.paco2 - 40) / 10) * 1;
    const chronicHco3 = 24 + ((vitals.paco2 - 40) / 10) * 3.5;
    if (Math.abs(vitals.hco3 - acuteHco3) <= 2)
      return 'acute respiratory acidosis, renal compensation pending';
    if (Math.abs(vitals.hco3 - chronicHco3) <= 3) {
      return 'chronic respiratory acidosis with renal compensation over 24-48h';
    }
    return 'mixed acid-base disorder or inappropriate respiratory acidosis compensation';
  }

  if (vitals.hco3 < 22) {
    if (vitals.paco2 < wintersExpectedPaco2Range[0])
      return 'excess respiratory alkalosis beyond Winters formula';
    if (vitals.paco2 > wintersExpectedPaco2Range[1])
      return 'inadequate respiratory compensation by Winters formula';
    return 'appropriate respiratory compensation by Winters formula';
  }

  if (vitals.paco2 < 35 && vitals.ph > 7.45) return 'acute respiratory alkalosis pattern';
  return 'no compensatory abnormality detected';
}

function formatSigned(value: number): string {
  return value > 0 ? `+${value}` : `${value}`;
}
