import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { readSimulatorCss } from '@/test/readSimulatorCss';
import {
  PATIENT_AVATAR_PALETTE,
  getCheekColor,
  getSecretionColor,
  getUnderEyeColor,
} from './patientAvatarPalette';

const CHANNEL_MAX = 255;
const RGB_CHANNEL_COUNT = 3;
const SRGB_LINEAR_THRESHOLD = 0.03928;
const SRGB_LINEAR_DIVISOR = 12.92;
const SRGB_GAMMA_OFFSET = 0.055;
const SRGB_GAMMA_SCALE = 1.055;
const SRGB_GAMMA_EXPONENT = 2.4;
const RED_LUMINANCE_WEIGHT = 0.2126;
const GREEN_LUMINANCE_WEIGHT = 0.7152;
const BLUE_LUMINANCE_WEIGHT = 0.0722;
const CONTRAST_OFFSET = 0.05;
const LOW_SECRETION_BURDEN = 0.05;
const MEDIUM_SECRETION_BURDEN = 0.35;
const HIGH_SECRETION_BURDEN = 0.75;
const WCAG_AAA_CONTRAST_RATIO = 7;

function relativeLuminance(hexColor: string): number {
  const channels = hexColor
    .slice(1)
    .match(/../g)
    ?.map((channel) => parseInt(channel, 16) / CHANNEL_MAX);

  if (!channels || channels.length !== RGB_CHANNEL_COUNT) throw new Error(`Invalid hex color: ${hexColor}`);

  const [red, green, blue] = channels.map((channel) =>
    channel <= SRGB_LINEAR_THRESHOLD
      ? channel / SRGB_LINEAR_DIVISOR
      : ((channel + SRGB_GAMMA_OFFSET) / SRGB_GAMMA_SCALE) ** SRGB_GAMMA_EXPONENT,
  );

  return (
    RED_LUMINANCE_WEIGHT * (red ?? 0) +
    GREEN_LUMINANCE_WEIGHT * (green ?? 0) +
    BLUE_LUMINANCE_WEIGHT * (blue ?? 0)
  );
}

function contrastRatio(foreground: string, background: string): number {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);

  return (
    (Math.max(foregroundLuminance, backgroundLuminance) + CONTRAST_OFFSET) /
    (Math.min(foregroundLuminance, backgroundLuminance) + CONTRAST_OFFSET)
  );
}

describe('patient avatar semantic palette', () => {
  registerPaletteTokenTests();
  registerPaletteFunctionTests();
  registerCssTokenTests();
  registerContrastTests();
});

function registerPaletteTokenTests(): void {
  it('maps clinical status colors to named semantic tokens', () => {
    expect(PATIENT_AVATAR_PALETTE.clinical).toEqual({
      danger: '#ff4545',
      emergency: '#ff3030',
      normal: '#35d27f',
      warning: '#ffd84a',
    });
    expect(PATIENT_AVATAR_PALETTE.lip.normal).toBe('#b96f67');
    expect(PATIENT_AVATAR_PALETTE.lip.blue).toBe('#4d62bc');
    expect(PATIENT_AVATAR_PALETTE.lip.deepBlue).toBe('#273a8f');
    expect(PATIENT_AVATAR_PALETTE.hair).toEqual({
      black: '#242118',
      darkBrown: '#3a2a1d',
      gray: '#8f9699',
    });
    expect(PATIENT_AVATAR_PALETTE.hairHighlight).toEqual({
      black: '#3a3327',
      darkBrown: '#604329',
      gray: '#c4cbce',
    });
    expect(PATIENT_AVATAR_PALETTE.lung).toEqual({
      collapsed: '#2f343d',
      collapsedStroke: '#111827',
      healthy: '#de8384',
      inflamed: '#c94c4f',
      stiff: '#793749',
    });
    expect(PATIENT_AVATAR_PALETTE.pathology).toEqual({
      bleeding: '#c1121f',
      emesis: '#7a4d21',
    });
    expect(PATIENT_AVATAR_PALETTE.outline.patientHighContrast).toBe('#ffe1d4');
    expect(PATIENT_AVATAR_PALETTE.ecgLead).toEqual({
      la: '#1f2937',
      ll: '#e53935',
      ra: '#f8fcff',
      rl: '#35d27f',
      v1: '#8b5a2b',
      v2: '#7c3aed',
      v3: '#2563eb',
      v4: '#0ea5e9',
      v5: '#14b8a6',
      v6: '#f97316',
    });
  });
}

function registerPaletteFunctionTests(): void {
  it('maps secretion burden to low, medium, and high clinical colors', () => {
    expect(getSecretionColor(LOW_SECRETION_BURDEN)).toBe(PATIENT_AVATAR_PALETTE.secretion.low);
    expect(getSecretionColor(MEDIUM_SECRETION_BURDEN)).toBe(PATIENT_AVATAR_PALETTE.secretion.medium);
    expect(getSecretionColor(HIGH_SECRETION_BURDEN)).toBe(PATIENT_AVATAR_PALETTE.secretion.high);
  });

  it('maps patient expression and condition to visible face-state colors', () => {
    expect(getCheekColor('stable')).toBe(PATIENT_AVATAR_PALETTE.cheek.stable);
    expect(getCheekColor('worsening')).toBe(PATIENT_AVATAR_PALETTE.cheek.worsening);
    expect(getCheekColor('critical')).toBe(PATIENT_AVATAR_PALETTE.cheek.critical);
    expect(getUnderEyeColor('calm')).toBe(PATIENT_AVATAR_PALETTE.skin.underEye);
    expect(getUnderEyeColor('drowsy')).toBe(PATIENT_AVATAR_PALETTE.skin.underEyeHypoxic);
    expect(getUnderEyeColor('critical')).toBe(PATIENT_AVATAR_PALETTE.skin.underEyeHypoxic);
  });
}

function registerCssTokenTests(): void {
  it('exposes patient-critical colors as CSS custom properties', () => {
    const globalCss = readFileSync(`${process.cwd()}/src/styles/global.css`, 'utf8');

    for (const token of expectedCssTokens()) {
      expect(globalCss).toContain(token);
    }
  });
}

function expectedCssTokens(): string[] {
  return [
    `--clinical-danger: ${PATIENT_AVATAR_PALETTE.clinical.danger};`,
    '--clinical-danger-text: #ff8a80;',
    `--clinical-emergency: ${PATIENT_AVATAR_PALETTE.clinical.emergency};`,
    `--clinical-normal: ${PATIENT_AVATAR_PALETTE.clinical.normal};`,
    `--clinical-warning: ${PATIENT_AVATAR_PALETTE.clinical.warning};`,
    ...expectedAccessibilityCssTokens(),
    ...expectedPatientCssTokens(),
    ...expectedEcgCssTokens(),
  ];
}

function expectedAccessibilityCssTokens(): string[] {
  return [
    '--control-border: #8fa9c4;',
    '--control-hover-border: #c6dcf2;',
    '--control-disabled-border: #8fa9c4;',
    '--clinical-danger-oklch: oklch(',
    '--clinical-emergency-oklch: oklch(',
    '--clinical-normal-oklch: oklch(',
    '--clinical-warning-oklch: oklch(',
    '@media (prefers-color-scheme: light)',
    '@media (prefers-contrast: more)',
    '@media (forced-colors: active)',
    '@media (monochrome)',
    '--panel-bg: #0b1b2d;',
    '--clinical-danger-text: #ff8a80;',
    '--control-hover-border: #c6dcf2;',
    '--clinical-danger: Mark;',
    '--clinical-danger-text: Mark;',
    '--text-main: CanvasText;',
    "[data-palette='colorblind']",
    '--clinical-danger: #d55e00;',
    '--clinical-danger-text: #ff8f3d;',
    '--clinical-normal: #009e73;',
    '--patient-cyanosis-overlay: #7b62d3;',
    "[data-color-vision='protanopia']",
    "[data-color-vision='deuteranopia']",
    "[data-color-vision='tritanopia']",
    "[data-color-vision='achromatopsia']",
    "[data-accessibility-high-contrast='true']",
    "[data-accessibility-inverted='true']",
    "[data-accessibility-easy-read='true']",
    "[data-accessibility-reading-guide='true']::after",
    "[data-accessibility-calm='true']",
  ];
}

function expectedPatientCssTokens(): string[] {
  return [
    `--patient-lip-normal: ${PATIENT_AVATAR_PALETTE.lip.normal};`,
    `--patient-lip-blue: ${PATIENT_AVATAR_PALETTE.lip.blue};`,
    `--patient-lip-deep-blue: ${PATIENT_AVATAR_PALETTE.lip.deepBlue};`,
    `--patient-lung-healthy: ${PATIENT_AVATAR_PALETTE.lung.healthy};`,
    `--patient-lung-inflamed: ${PATIENT_AVATAR_PALETTE.lung.inflamed};`,
    `--patient-lung-stiff: ${PATIENT_AVATAR_PALETTE.lung.stiff};`,
    `--patient-lung-collapsed: ${PATIENT_AVATAR_PALETTE.lung.collapsed};`,
    `--patient-lung-collapsed-stroke: ${PATIENT_AVATAR_PALETTE.lung.collapsedStroke};`,
    `--patient-outline: ${PATIENT_AVATAR_PALETTE.outline.patient};`,
    `--patient-outline-high-contrast: ${PATIENT_AVATAR_PALETTE.outline.patientHighContrast};`,
    `--pathology-bleeding: ${PATIENT_AVATAR_PALETTE.pathology.bleeding};`,
    `--pathology-emesis: ${PATIENT_AVATAR_PALETTE.pathology.emesis};`,
    `--patient-secretion-low: ${PATIENT_AVATAR_PALETTE.secretion.low};`,
    `--patient-secretion-medium: ${PATIENT_AVATAR_PALETTE.secretion.medium};`,
    `--patient-secretion-high: ${PATIENT_AVATAR_PALETTE.secretion.high};`,
  ];
}

function expectedEcgCssTokens(): string[] {
  return [
    `--ecg-lead-ra: ${PATIENT_AVATAR_PALETTE.ecgLead.ra};`,
    `--ecg-lead-la: ${PATIENT_AVATAR_PALETTE.ecgLead.la};`,
    `--ecg-lead-ll: ${PATIENT_AVATAR_PALETTE.ecgLead.ll};`,
    `--ecg-lead-rl: ${PATIENT_AVATAR_PALETTE.ecgLead.rl};`,
    `--ecg-lead-v1: ${PATIENT_AVATAR_PALETTE.ecgLead.v1};`,
    `--ecg-lead-v2: ${PATIENT_AVATAR_PALETTE.ecgLead.v2};`,
    `--ecg-lead-v3: ${PATIENT_AVATAR_PALETTE.ecgLead.v3};`,
    `--ecg-lead-v4: ${PATIENT_AVATAR_PALETTE.ecgLead.v4};`,
    `--ecg-lead-v5: ${PATIENT_AVATAR_PALETTE.ecgLead.v5};`,
    `--ecg-lead-v6: ${PATIENT_AVATAR_PALETTE.ecgLead.v6};`,
  ];
}

function registerContrastTests(): void {
  it('keeps danger text colors above WCAG AAA contrast on clinical panels', () => {
    const darkPanelBackground = '#0b1b2d';
    const lightPanelBackground = '#dcecf8';

    expect(contrastRatio('#ff8a80', darkPanelBackground)).toBeGreaterThanOrEqual(WCAG_AAA_CONTRAST_RATIO);
    expect(contrastRatio('#ffb4a8', darkPanelBackground)).toBeGreaterThanOrEqual(WCAG_AAA_CONTRAST_RATIO);
    expect(contrastRatio('#ff8f3d', darkPanelBackground)).toBeGreaterThanOrEqual(WCAG_AAA_CONTRAST_RATIO);
    expect(contrastRatio('#8f170f', lightPanelBackground)).toBeGreaterThanOrEqual(WCAG_AAA_CONTRAST_RATIO);
  });

  it('renders collapsed lung and patient outline from semantic CSS tokens', () => {
    const simulatorCss = readSimulatorCss();

    expect(simulatorCss).toContain('.anatomy-lung.collapsed');
    expect(simulatorCss).toContain('fill: var(--patient-lung-collapsed);');
    expect(simulatorCss).toContain('stroke: var(--patient-lung-collapsed-stroke);');
    expect(simulatorCss).toContain('.lung-detail.collapsed .lung-fill');
    expect(simulatorCss).toContain('stroke: var(--patient-outline);');
  });
}
