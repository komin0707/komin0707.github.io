import type { Scenario } from './scenarios';
import type { DerivedVitals } from './ventilatorTypes';

export function buildScenarioMedicalFindings(scenario: Scenario, vitals: DerivedVitals): readonly string[] {
  const findings: Record<Scenario['type'], readonly string[]> = {
    airwayObstruction: [
      'Obstructive phenotype: asthma/COPD branch requires bedside differentiation',
      'Asthma cue: bronchospasm with high Raw and reversible bronchodilator response expected',
      'COPD cue: former smoker, chronic CO2 retention risk, prolonged expiration',
      `Auto-PEEP ${vitals.autoPeep} cmH2O supports expiratory flow limitation assessment`,
    ],
    ards: [
      'Berlin ARDS: acute onset within 1 week',
      'Berlin ARDS: bilateral opacities on imaging',
      'Berlin ARDS: respiratory failure not fully explained by cardiac failure; PCWP 14 mmHg (<18)',
      `Berlin oxygenation: P/F ${vitals.pao2fio2} on PEEP ${vitals.peep} cmH2O`,
      `Lung protective ventilation: target Vt ${vitals.lungProtectiveTidalVolume} mL, Pplat <30, driving P <15`,
      'Prone positioning cue: improves dorsal recruitment in refractory hypoxemia',
    ],
    normal: ['Reference case: no focal infiltrate, normal compliance, no acute cardiopulmonary event'],
    pneumonia: [
      'Opacity distribution: unilateral right lower lobe infiltrate',
      'Pneumonia category: CAP pattern; VAP/HAP not selected in this preset',
      'Neutrophil predominant leukocytosis expected',
      'Fever pattern active when temperature >=38.0 C',
    ],
    pneumothorax: [
      'Pneumothorax type: simple left pneumothorax with tension-risk monitoring',
      'Tension warning: mediastinal shift risk when hypotension, hypoxemia, or rising pressure develops',
      'Chest tube cue: decompression should improve leak, compliance, and oxygenation',
      `Leak rate ${vitals.leak}% with asymmetric chest motion`,
    ],
    aspirationPneumonia: [
      'Aspiration: dependent right lower lobe infiltrate after gastric content exposure',
      'Chemical pneumonitis plus bacterial superinfection risk',
      'Airway suction and broad aspiration coverage cue',
    ],
    atelectasis: [
      'Atelectasis: low FRC with recruitable shunt physiology',
      `PEEP response cue: optimal PEEP ${vitals.optimalPeep} cmH2O`,
      'Open lung strategy and secretion clearance should improve oxygenation',
    ],
    burnInhalation: [
      'Inhalation injury: facial burn/soot exposure with progressive airway edema risk',
      'Bronchospasm and high Raw cue after smoke exposure',
      'Early airway security and CO/cyanide assessment cue',
    ],
    cardiogenicShock: [
      'Cardiogenic shock: pulmonary edema from elevated left-sided filling pressure',
      'Shock cue: perfusion support and afterload/diuresis decision needed',
      'Cardiac cause is primary driver of oxygenation failure',
    ],
    chronicKidneyDisease: [
      'CKD: metabolic acidosis and volume overload pulmonary edema risk',
      'Renal replacement/ultrafiltration cue when oxygenation worsens',
      'Hyperkalemia and uremic encephalopathy monitoring cue',
    ],
    covidArds: [
      'COVID-19 ARDS: bilateral ground-glass/interstitial infiltrates',
      'Berlin ARDS framework applies with severe shunt physiology',
      'Prone positioning and lung protective ventilation cue',
    ],
    diabeticKetoacidosis: [
      'DKA: high anion-gap metabolic acidosis with Kussmaul compensation',
      'Avoid suppressing compensatory minute ventilation during intubation',
      'Insulin, potassium, and fluid resuscitation cue',
    ],
    diaphragmParalysis: [
      'Diaphragm paralysis: low spontaneous tidal volume with basal atelectasis risk',
      'NIF/VC trend drives ventilatory support need',
      'Noninvasive support or controlled ventilation cue',
    ],
    drowning: [
      'Drowning: surfactant washout and noncardiogenic pulmonary edema',
      'Foamy secretions and hypoxemia can worsen after initial rescue',
      'PEEP and oxygenation support cue',
    ],
    hepaticEncephalopathy: [
      'Hepatic encephalopathy: depressed airway reflexes and aspiration risk',
      'Ammonia/mental status trend drives airway protection decision',
      'Respiratory alkalosis can coexist with liver failure physiology',
    ],
    neuromuscularDisease: [
      'Neuromuscular disease: ALS/GBS pattern with respiratory muscle weakness',
      `NIF ${vitals.negativeInspiratoryForce} cmH2O and VC ${vitals.vitalCapacity} mL guide intubation risk`,
      'Bulbar weakness and secretion clearance cue',
    ],
    opioidOverdose: [
      'Opioid overdose: central hypoventilation with CO2 retention risk',
      'Naloxone response and recurrent respiratory depression cue',
      'Aspiration monitoring after depressed consciousness',
    ],
    paralyticMedication: [
      'Paralytic effect: spontaneous breathing abolished while ventilator synchrony improves',
      'Train-of-four/sedation awareness cue',
      'Loss of cough and secretion clearance requires airway vigilance',
    ],
    postCardiacArrest: [
      'Post-cardiac arrest: hypoxic-ischemic injury risk after ROSC',
      'Target oxygenation and normocapnia while avoiding hyperoxia',
      'Temperature management and hemodynamic support cue',
    ],
    pulmonaryEdema: [
      'Pulmonary edema: bilateral perihilar/alveolar opacities with low compliance',
      'Diuresis/afterload and PEEP response cue',
      'Differentiate cardiogenic from ARDS by cardiac findings',
    ],
    pulmonaryEmbolism: [
      'Pulmonary embolism: acute dead-space increase with V/Q mismatch',
      `Vd/Vt ${Math.round(vitals.deadSpaceFraction * 100)}% supports dead-space burden`,
      'Anticoagulation/thrombolysis decision cue for shock physiology',
    ],
    pulmonaryFibrosis: [
      'Pulmonary fibrosis: restrictive low-compliance mechanics',
      'Diffuse reticular opacity and poor recruitability cue',
      'Avoid excessive pressure; oxygenation may remain difficult',
    ],
    sepsisRespiratoryFailure: [
      'Sepsis respiratory failure: fever, lactate, and vasodilatory shock risk',
      'ARDS evolution and broad-source control cue',
      'Fluid responsiveness must be balanced against pulmonary edema',
    ],
    stroke: [
      'Stroke: impaired airway protection with aspiration risk',
      'Neurologic respiratory pattern and dysphagia cue',
      'Ventilation goal avoids hypoxia and severe hypocapnia',
    ],
    traumaticBrainInjury: [
      'TBI: maintain oxygenation and controlled PaCO2 to protect cerebral perfusion',
      'Avoid hypoxemia, hypotension, and extreme hyperventilation',
      'ICP-risk ventilation cue',
    ],
    traumaticChestInjury: [
      'Traumatic chest injury: pulmonary contusion/flail segment risk',
      'Pain splinting and asymmetric chest movement cue',
      'Monitor for delayed pneumothorax or hemothorax',
    ],
  };

  return findings[scenario.type];
}
