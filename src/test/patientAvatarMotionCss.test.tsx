import { describe, expect, it } from 'vitest';
import { readSimulatorCss } from './readSimulatorCss';

const simulatorCss = readSimulatorCss();
const compositorSafeAnimationProperties = new Set(['opacity', 'transform']);

function getKeyframeDeclarationNames(cssText: string): string[] {
  const declarationNames: string[] = [];
  const keyframePattern = /@keyframes\s+[-\w]+\s*\{/g;
  let keyframeMatch: RegExpExecArray | null = keyframePattern.exec(cssText);

  while (keyframeMatch) {
    let depth = 1;
    let index = keyframePattern.lastIndex;
    const blockStart = index;

    while (index < cssText.length && depth > 0) {
      if (cssText[index] === '{') {
        depth += 1;
      }
      if (cssText[index] === '}') {
        depth -= 1;
      }
      index += 1;
    }

    const block = cssText.slice(blockStart, index - 1);
    const declarationPattern = /([a-z-]+)\s*:/g;
    let declarationMatch: RegExpExecArray | null = declarationPattern.exec(block);

    while (declarationMatch) {
      const [, propertyName] = declarationMatch;
      if (propertyName) {
        declarationNames.push(propertyName);
      }
      declarationMatch = declarationPattern.exec(block);
    }

    keyframePattern.lastIndex = index;
    keyframeMatch = keyframePattern.exec(cssText);
  }

  return declarationNames;
}

describe('patient avatar motion CSS', () => {
  registerCriticalMotionCssTests();
  registerCyanosisCssTests();
  registerAnimationTimingCssTests();
  registerKeyframeBudgetTests();
});

function registerCriticalMotionCssTests(): void {
  it('keeps critical gasping, apnea, and reduced-motion controls in source CSS', () => {
    expectCssTokens([
      '@keyframes gasping-chest-breathe',
      '@keyframes kussmaul-chest-breathe',
      '@keyframes cheyne-stokes-breathe',
      '@keyframes biot-breathe',
      '@keyframes apneustic-breathe',
      '@keyframes pursed-lip-exhale',
      '@keyframes sigh-breathe',
      '@keyframes agonal-breathe',
      '@keyframes apnea-recovery-flash',
      ".patient-avatar[data-breath-pattern='gasping'] .chest-motion",
      ".patient-avatar[data-breath-pattern='kussmaul'] .chest-motion",
      ".patient-avatar[data-breath-pattern='cheyne-stokes'] .chest-motion",
      ".patient-avatar[data-breath-pattern='biot'] .chest-motion",
      ".patient-avatar[data-breath-pattern='apneustic'] .chest-motion",
      ".patient-avatar[data-scenario='airwayObstruction'] .effect-pursed-lip-breath",
      ".patient-avatar[data-breath-pattern='sighing'] .chest-motion",
      ".patient-avatar[data-breath-pattern='agonal'] .chest-motion",
      ".patient-avatar[data-breath-pattern='gasping'] .gown-breath-fold",
      ".patient-avatar[data-breath-pattern='tachypnea'] .chest-motion",
      ".patient-avatar[data-breath-pattern='bradypnea'] .chest-motion",
      ".patient-avatar[data-breath-pattern='apnea'] .chest-motion",
      ".patient-avatar[data-breath-pattern='apnea'] .vent-circuit",
      ".patient-avatar[data-breath-pattern='apnea'] .flow-arrow",
      ".patient-avatar[data-tube-pressure-warning='true'] .clinical-decompensation-posture",
      '.apnea-time-badge',
      '@keyframes patient-bucking',
      '@keyframes trigger-double-pulse',
      '@keyframes wasted-trigger-fade',
      '@keyframes auto-trigger-flicker',
      '@keyframes cycling-cue',
      '@keyframes hold-marker',
      '@keyframes circuit-inflation',
      '@keyframes circuit-collapse',
      ".patient-avatar[data-trigger-mode='double-trigger'] .effect-double-trigger",
      ".patient-avatar[data-trigger-mode='wasted-trigger'] .effect-wasted-trigger",
      ".patient-avatar[data-trigger-mode='auto-trigger'] .effect-auto-trigger",
      ".patient-avatar[data-inspiratory-hold='true'] .effect-inspiratory-hold",
      ".patient-avatar[data-expiratory-hold='true'] .effect-expiratory-hold",
      'animation-play-state: paused;',
      '@media (prefers-reduced-motion: reduce)',
      'animation-duration: 0.001ms !important;',
      'animation-iteration-count: 1 !important;',
      'transition-duration: 0.001ms !important;',
    ]);
  });
}

function registerCyanosisCssTests(): void {
  it('keeps staged cyanosis filters distinct for worsening and critical patients', () => {
    expect(simulatorCss).toContain(".patient-avatar[data-skin-tone='cyanotic'] .skin-overlay");
    expect(simulatorCss).toContain('filter: saturate(1.18);');
    expect(simulatorCss).toContain(".patient-avatar[data-skin-tone='severelyCyanotic'] .skin-overlay");
    expect(simulatorCss).toContain('filter: saturate(1.45) contrast(1.08);');
    expect(simulatorCss).toContain(".patient-avatar[data-lip-color='deepBlue'] .effect-lip-cyanosis");
    expect(simulatorCss).toContain('filter: blur(0.3px) saturate(1.55);');
  });
}

function registerAnimationTimingCssTests(): void {
  it('keeps patient-state animations tied to breath speed and compositor-friendly properties', () => {
    expect(simulatorCss).toContain('animation: patient-breathe var(--breath-speed) ease-in-out infinite;');
    expect(simulatorCss).toContain('--visual-inspiration-duration: 1.5s;');
    expect(simulatorCss).toContain('--visual-expiration-duration: 3s;');
    expect(simulatorCss).toContain('transform var(--visual-inspiration-duration) ease-out');
    expect(simulatorCss).toContain('opacity var(--visual-expiration-duration) ease-in');
    expect(simulatorCss).toContain('animation: chest-breathe var(--breath-speed) ease-in-out infinite;');
    expect(simulatorCss).toContain('animation: circuit-vibration var(--breath-speed) ease-in-out infinite;');
    expect(simulatorCss).toContain('animation: flow-dash var(--breath-speed) linear infinite;');
    expect(simulatorCss).toContain(
      'animation: secretion-bubble calc(var(--breath-speed) * 1.4) ease-in-out infinite;',
    );
    expect(simulatorCss).toContain('animation: sweat-drop 2.8s ease-in-out infinite;');
    expect(simulatorCss).toContain('animation: eye-blink 4.2s ease-in-out infinite;');
    expect(simulatorCss).toContain('animation: alarm-pulse var(--alarm-speed) infinite;');
    expect(simulatorCss).toContain('animation: alarm-ring-pulse var(--alarm-speed) ease-out infinite;');
    expect(simulatorCss).toContain(
      'animation: apnea-recovery-flash calc(var(--breath-speed) * 1.1) ease-out 1;',
    );
    expect(simulatorCss).toContain('animation-delay: calc(var(--breath-speed) * -0.45);');
    expect(simulatorCss).toContain('animation-delay: 0.28s;');
    expect(simulatorCss).toContain('transition:');
    expect(simulatorCss).toContain('will-change: transform, opacity;');
    expect(simulatorCss).toContain('will-change: opacity, transform;');
    expect(simulatorCss).toContain('will-change: transform;');
    expect(simulatorCss).toContain('will-change: opacity;');
  });
}

function registerKeyframeBudgetTests(): void {
  it('limits keyframe animations to transform and opacity', () => {
    const animatedProperties = getKeyframeDeclarationNames(simulatorCss);

    expect(animatedProperties.length).toBeGreaterThan(0);
    expect(animatedProperties.every((property) => compositorSafeAnimationProperties.has(property))).toBe(
      true,
    );
  });
}

function expectCssTokens(tokens: readonly string[]): void {
  for (const token of tokens) {
    expect(simulatorCss).toContain(token);
  }
}
