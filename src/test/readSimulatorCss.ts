import { readFileSync } from 'node:fs';

const SIMULATOR_CSS_FILES = [
  'src/App.css',
  'src/App.responsive.css',
  'src/components/ui/Header.css',
  'src/components/ui/BottomBar.css',
  'src/components/ui/SliderControl.css',
  'src/components/panels/Panel.css',
  'src/components/panels/SettingsPanel.css',
  'src/components/panels/PatientConditionPanel.css',
  'src/components/panels/LungStatusPanel.css',
  'src/components/panels/AlarmPanel.css',
  'src/components/panels/MonitorPanel.css',
  'src/components/panels/DataVisualizationPanel.css',
  'src/components/panels/ScenarioInterventionPanel.css',
  'src/components/panels/ModeSafetyPanel.css',
  'src/components/patient/PatientAvatar2D.css',
  'src/components/patient/styles/PatientAvatarBreathing.css',
  'src/components/patient/styles/PatientAvatarPathology.css',
  'src/components/patient/styles/PatientAvatarAnatomy.css',
  'src/components/patient/styles/PatientAvatarSvgDetails.css',
  'src/components/patient/styles/PatientAvatarAnimations.css',
];

/** Reads simulator stylesheets as a single string for CSS source assertions. */
export function readSimulatorCss() {
  return SIMULATOR_CSS_FILES.map((path) => readFileSync(`${process.cwd()}/${path}`, 'utf8')).join('\n');
}
