import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';

type PatientVisualizationLocators = {
  patientAvatar: Locator;
  patientGraphic: Locator;
};

const SVG_GEOMETRY_TOLERANCE_PX = 1;

async function expectOverlayWithinPatientImage(page: import('@playwright/test').Page, selector: string) {
  const patientBox = await page.getByRole('img', { name: /상태 기반 삽관 환자 이미지/ }).boundingBox();
  const overlayBox = await page.locator(selector).boundingBox();

  expect(patientBox).not.toBeNull();
  expect(overlayBox).not.toBeNull();

  const patient = patientBox!;
  const overlay = overlayBox!;
  expect(overlay.width).toBeGreaterThan(4);
  expect(overlay.height).toBeGreaterThan(4);
  expect(overlay.x).toBeGreaterThanOrEqual(patient.x);
  expect(overlay.y).toBeGreaterThanOrEqual(patient.y);
  expect(overlay.x + overlay.width).toBeLessThanOrEqual(patient.x + patient.width);
  expect(overlay.y + overlay.height).toBeLessThanOrEqual(patient.y + patient.height);
}

async function setSliderValue(page: import('@playwright/test').Page, label: string, value: string) {
  const slider = page.locator('label').filter({ hasText: label }).getByRole('slider');
  await slider.evaluate((element, nextValue) => {
    const input = element as HTMLInputElement;
    input.value = nextValue;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
}

function expectNearWideRatio(box: { width: number; height: number } | null | undefined) {
  expect(box).toBeTruthy();
  expect(box!.width / box!.height).toBeGreaterThan(1.76);
  expect(box!.width / box!.height).toBeLessThan(1.79);
}

async function expectSupinePatientLandmarks(page: import('@playwright/test').Page) {
  const patientBox = await page.getByRole('img', { name: /상태 기반 삽관 환자 이미지/ }).boundingBox();
  const headBox = await page.locator('.head').boundingBox();
  const bodyBox = await page.locator('.body').boundingBox();
  const armPositioningBox = await page.locator('.clinical-arm-positioning').boundingBox();
  const leftFootBox = await page.locator('.foot.left-foot').boundingBox();
  const rightFootBox = await page.locator('.foot.right-foot').boundingBox();

  expect(patientBox).not.toBeNull();
  expect(headBox).not.toBeNull();
  expect(bodyBox).not.toBeNull();
  expect(armPositioningBox).not.toBeNull();
  expect(leftFootBox).not.toBeNull();
  expect(rightFootBox).not.toBeNull();

  const patient = patientBox!;
  const head = headBox!;
  const body = bodyBox!;
  const armPositioning = armPositioningBox!;
  const leftFoot = leftFootBox!;
  const rightFoot = rightFootBox!;

  expect(head.x).toBeGreaterThanOrEqual(patient.x + patient.width * 0.12);
  expect(head.y).toBeGreaterThanOrEqual(patient.y + patient.height * 0.05);
  expect(head.y + head.height).toBeLessThan(patient.y + patient.height * 0.58);
  expect(head.width / patient.width).toBeGreaterThan(0.12);
  expect(head.width / patient.width).toBeLessThan(0.24);

  expect(body.x).toBeGreaterThanOrEqual(patient.x + patient.width * 0.02 - SVG_GEOMETRY_TOLERANCE_PX);
  expect(body.x + body.width).toBeLessThanOrEqual(
    patient.x + patient.width * 0.97 + SVG_GEOMETRY_TOLERANCE_PX,
  );
  expect(body.y + body.height).toBeLessThanOrEqual(patient.y + patient.height + 16);
  expect(armPositioning.x).toBeGreaterThanOrEqual(patient.x);
  expect(armPositioning.x + armPositioning.width).toBeLessThanOrEqual(patient.x + patient.width * 0.86);
  expect(leftFoot.y).toBeGreaterThan(patient.y + patient.height * 0.9);
  expect(rightFoot.y).toBeGreaterThan(patient.y + patient.height * 0.9);
}

test('critical simulator controls update patient state without console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });

  await page.goto('/');
  await expect(page.getByTestId('vent-simulator')).toBeVisible();
  await expect(page.getByText('VENT SIMULATOR 2D')).toBeVisible();

  await page.getByRole('button', { name: 'CPAP' }).click();
  await expect(page.getByRole('button', { name: 'CPAP' })).toHaveClass(/active/);
  await expect(page.getByTestId('patient-avatar')).toHaveAttribute('data-breath-source', 'spontaneous');

  await page.locator('.scenario-select select').selectOption('normal');
  await expect(page.locator('.scenario-select select')).toHaveValue('normal');

  await page.getByRole('button', { name: /^초기화$/ }).click();
  await expect(page.locator('.scenario-select select')).toHaveValue('pneumonia');
  expect(errors).toEqual([]);
});

test('has no critical or serious automated accessibility violations', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('vent-simulator')).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  const seriousViolations = results.violations.filter((violation) =>
    ['critical', 'serious'].includes(violation.impact ?? ''),
  );

  expect(seriousViolations).toEqual([]);
});

test('screen reader tree exposes readable content in logical order', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('vent-simulator')).toBeVisible();

  const snapshot = await page.locator('main').ariaSnapshot({ depth: 4 });
  const requiredContent = [
    'link "본문으로 이동"',
    'heading "VENT SIMULATOR 2D"',
    'navigation "Ventilator mode"',
    'heading "설정 (SETTINGS)"',
    'group "환기 설정값"',
    'heading "환자 상태 (PATIENT CONDITION)"',
    'img "상태 기반 삽관 환자 이미지',
    'heading "폐 상태 (LUNG STATUS)"',
    'heading "알람 (ALARMS)"',
    'alert:',
    'heading "실시간 모니터링"',
    'region "데이터 시각화"',
    'region "시나리오 처치"',
    'region "모드 안전 상태"',
    'region "사용자 인터랙션"',
    'combobox "시나리오"',
    'textbox "시뮬레이션 JSON"',
    'status: 시뮬레이터 로드 완료',
  ];

  for (const content of requiredContent) {
    expect(snapshot).toContain(content);
  }

  expect(snapshot).not.toMatch(/(?:button|link|img|textbox|combobox|slider) ""/);

  const orderedContent = [
    'heading "VENT SIMULATOR 2D"',
    'heading "설정 (SETTINGS)"',
    'heading "환자 상태 (PATIENT CONDITION)"',
    'heading "폐 상태 (LUNG STATUS)"',
    'heading "알람 (ALARMS)"',
    'heading "실시간 모니터링"',
    'region "시나리오 처치"',
    'region "모드 안전 상태"',
    'region "사용자 인터랙션"',
    'text: 시뮬레이션 시간',
  ];

  const positions = orderedContent.map((content) => snapshot.indexOf(content));
  expect(positions.every((position) => position >= 0)).toBe(true);
  expect([...positions].sort((left, right) => left - right)).toEqual(positions);
});

test('desktop first viewport presents the patient and clinical panels', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(page.getByTestId('vent-simulator')).toBeVisible();

  const viewport = page.viewportSize();
  expect(viewport).not.toBeNull();

  await expectInViewport(page.getByRole('heading', { name: /환자 상태/ }), viewport!);
  await expectInViewport(page.getByRole('img', { name: /상태 기반 삽관 환자 이미지/ }), viewport!);
  await expectInViewport(page.getByRole('heading', { name: /실시간 모니터링/ }), viewport!);
  await expectInViewport(page.getByRole('heading', { name: /폐 상태/ }), viewport!);
  await expectInViewport(page.getByRole('heading', { name: /알람/ }), viewport!);

  const patientGraphicBox = await page.getByRole('img', { name: /상태 기반 삽관 환자 이미지/ }).boundingBox();
  expect(patientGraphicBox?.width).toBeGreaterThan(500);
  expect(patientGraphicBox?.height).toBeGreaterThan(250);
});

test('patient visualization remains visible as SVG across states', async ({ page }) => {
  const locators = await openPatientVisualization(page);

  await expectNormalPatientVisualization(page, locators);
  await expectRespiratoryAndOxygenationStates(page, locators.patientAvatar);
  await expectPneumoniaVisualization(page, locators.patientAvatar);
  await expectArdsAndPneumothoraxVisualization(page, locators.patientAvatar);
  await expectResponsivePatientVisualization(page, locators.patientGraphic);
});

test('patient avatar visual regression stays within baseline', async ({ page }) => {
  await page.goto('/');
  await page.locator('.scenario-select select').selectOption('normal');
  await page.addStyleTag({ content: '.condition-card { visibility: hidden !important; }' });
  await expect(page.getByTestId('patient-avatar')).toBeVisible();
  await expect(page.getByTestId('patient-avatar')).toHaveScreenshot('patient-avatar-normal.png', {
    animations: 'disabled',
    maxDiffPixelRatio: 0.01,
  });
});

test('full simulator interaction surface works across controls, input methods, and runtime signals', async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  await page.goto('/');
  await expect(page.getByTestId('vent-simulator')).toBeVisible();

  await exerciseModeScenarioAndSliderControls(page);
  await exerciseCriticalApneaAndTimerControls(page);
  await exerciseKeyboardHelpAndPauseShortcuts(page);
  await exercisePointerTouchAndResponsiveControls(page);
  await exerciseOfflineResetAndRuntimeMetrics(page, consoleErrors);
});

async function expectInViewport(
  locator: Locator,
  viewport: Readonly<{ width: number; height: number }>,
): Promise<void> {
  await expect(locator).toBeVisible();
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width);
  expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height);
}

async function openPatientVisualization(page: Page): Promise<PatientVisualizationLocators> {
  await page.goto('/');
  const patientAvatar = page.getByTestId('patient-avatar');
  const patientGraphic = page.getByRole('img', { name: /상태 기반 삽관 환자 이미지/ });
  const patientSvg = patientAvatar.locator('svg.patient-avatar-svg');
  await expect(patientAvatar).toBeVisible();
  await expect(patientGraphic).toBeVisible();
  await expect(patientSvg).toBeVisible();
  const desktopBox = await patientGraphic.boundingBox();
  expect(desktopBox?.width).toBeGreaterThan(500);
  expect(desktopBox?.height).toBeGreaterThan(280);
  expectNearWideRatio(desktopBox);
  return { patientAvatar, patientGraphic };
}

async function expectNormalPatientVisualization(
  page: Page,
  { patientAvatar, patientGraphic }: PatientVisualizationLocators,
): Promise<void> {
  await page.locator('.scenario-select select').selectOption('normal');
  await expect(patientAvatar).toHaveAttribute('data-condition', 'stable');
  await expect(patientAvatar).toHaveAttribute('data-alarm-level', 'none');
  await expect(patientAvatar).toHaveAttribute('data-breath-pattern', 'regular');
  await expect(patientAvatar).toHaveAttribute('data-breath-source', 'mechanical');
  await expect(patientAvatar).toHaveAttribute('data-tube-pressure-warning', 'false');
  await expect(patientAvatar).toHaveCSS('box-shadow', /53, 210, 127/);
  await expect(patientGraphic).toHaveClass(/patient-avatar/);
  await expect(patientAvatar.locator('svg.patient-avatar-svg')).toHaveAttribute('aria-hidden', 'true');
  await expectSupinePatientLandmarks(page);
  await expect(page.locator('.facial-state-marker')).toHaveAttribute('stroke-opacity', '0.12');
  await expect(page.locator('.cheek').first()).toHaveAttribute('fill', '#d99482');
  await expect(page.locator('.deterioration-image')).toHaveCount(0);
}

async function expectRespiratoryAndOxygenationStates(page: Page, patientAvatar: Locator): Promise<void> {
  await setSliderValue(page, 'Respiratory Rate (/min)', '4');
  await expect(patientAvatar).toHaveAttribute('data-breath-pattern', 'apnea');
  await expect(page.locator('.apnea-time-badge')).toContainText(/APNEA/);
  await setSliderValue(page, 'Respiratory Rate (/min)', '16');
  await expect(patientAvatar).toHaveAttribute('data-breath-pattern', 'regular');
  await setSliderValue(page, 'FiO2 (%)', '21');
  await expect(patientAvatar).toHaveAttribute('data-condition', 'watch');
  await expect(patientAvatar).toHaveAttribute('data-expression', 'strained');
  await expect(patientAvatar).toHaveAttribute('data-alarm-level', 'none');
  await setSliderValue(page, 'FiO2 (%)', '40');
}

async function expectPneumoniaVisualization(page: Page, patientAvatar: Locator): Promise<void> {
  await page.locator('.scenario-select select').selectOption('pneumonia');
  await expect(patientAvatar).toHaveAttribute('data-condition', 'worsening');
  await expect(patientAvatar).toHaveAttribute('data-alarm-level', 'critical');
  await expect(patientAvatar).toHaveAttribute('data-breath-pattern', 'tachypnea');
  await expect(patientAvatar).toHaveAttribute('data-tube-pressure-warning', 'true');
  await expect(patientAvatar).toHaveClass(/alarm-glow/);
  await expect(patientAvatar).toHaveCSS('box-shadow', /255, 69, 69/);
  await expect(patientAvatar.locator('svg.patient-avatar-svg')).toHaveCSS('animation-name', /alarm-shake/);
  await expect(page.locator('.facial-state-marker')).toHaveAttribute('stroke-opacity', '0.42');
  await expect(page.locator('.cheek').first()).toHaveAttribute('fill', '#4d62bc');
  await expectPneumoniaAnimations(page);
  await expectPatientEffectOverlays(page);
}

async function expectPneumoniaAnimations(page: Page): Promise<void> {
  await expect(page.locator('.skin-overlay').first()).toHaveCSS('transition-property', /opacity/);
  await expect(page.locator('.mouth-opening')).toHaveCSS('transition-property', /opacity/);
  await expect(page.locator('.effect-tube-warning')).toHaveCSS('opacity', /0\.[1-9]|1/);
  await expect(page.locator('.effect-asynchrony-jolt.shoulder')).toHaveCSS(
    'animation-name',
    /asynchrony-jolt/,
  );
  await expect(page.locator('.chest-motion')).toHaveCSS('animation-name', /chest-breathe/);
  await expect(page.locator('.chest-motion')).toHaveCSS('animation-duration', /1\.59s/);
  await expect(page.locator('.effect-breath-chest')).toHaveCSS('animation-name', /patient-breathe/);
  await expect(page.locator('.vent-circuit.inspiration-tube')).toHaveCSS(
    'animation-name',
    /circuit-(vibration|inflation)/,
  );
  await expect(page.locator('.humidifier-condensate circle').first()).toHaveCSS(
    'animation-name',
    /condensate-shimmer/,
  );
  await expect(page.locator('.inspiratory-flow')).toHaveCSS('animation-name', /flow-dash/);
  await expect(page.locator('.expiratory-flow')).toHaveCSS('animation-direction', /reverse/);
  await expect(page.locator('.blink-lid.left')).toHaveCSS('animation-name', /eye-blink/);
  await expect(page.locator('.secretion').first()).toHaveCSS('animation-name', /secretion-bubble/);
  await expect(page.locator('.sweat path').first()).toHaveCSS('animation-name', /sweat-drop/);
  await expect(page.locator('.effect-alarm-ring.ring-a')).toHaveCSS('animation-name', /alarm-ring-pulse/);
  await expect(page.locator('.effect-alarm-ring.ring-a')).toHaveCSS('animation-duration', /0\.85s/);
}

async function expectPatientEffectOverlays(page: Page): Promise<void> {
  await expectOverlayWithinPatientImage(page, '.effect-breath-chest');
  await expectOverlayWithinPatientImage(page, '.effect-cyanosis.face');
  await expectOverlayWithinPatientImage(page, '.effect-lip-cyanosis');
  await expectOverlayWithinPatientImage(page, '.effect-lung-consolidation.left');
  await expectOverlayWithinPatientImage(page, '.effect-alarm-ring.ring-a');
  await expectOverlayWithinPatientImage(page, '.effect-lung-haze.left');
  await expectOverlayWithinPatientImage(page, '.effect-tube-warning');
}

async function expectArdsAndPneumothoraxVisualization(page: Page, patientAvatar: Locator): Promise<void> {
  await page.locator('.scenario-select select').selectOption('ards');
  await setSliderValue(page, 'PEEP (cmH2O)', '20');
  await setSliderValue(page, 'Tidal Volume (mL)', '1000');
  await setSliderValue(page, 'Flow (L/min)', '100');
  await expect(patientAvatar).toHaveAttribute('data-condition', 'critical');
  await expect(patientAvatar).toHaveAttribute('data-expression', 'critical');
  await expect(page.locator('.head')).toHaveAttribute('data-pupil-state', 'dilated');
  await expect(page.locator('.chest-motion')).toHaveCSS('animation-name', /gasping-chest-breathe/);
  await expect(page.locator('.gown-breath-fold')).toHaveCSS('animation-name', /gasping-chest-breathe/);
  await page.locator('.scenario-select select').selectOption('pneumothorax');
  await expect(patientAvatar).toHaveAttribute('data-left-chest-reduced', 'true');
  await expect(page.locator('.anatomy-lung.collapsed.left')).toHaveCSS('fill', 'rgb(47, 52, 61)');
  await expect(page.locator('.anatomy-lung.collapsed.left')).toHaveCSS('stroke', 'rgb(17, 24, 39)');
}

async function expectResponsivePatientVisualization(page: Page, patientGraphic: Locator): Promise<void> {
  await expectMobilePatientLayout(page, patientGraphic);
  await page.setViewportSize({ width: 768, height: 1024 });
  expectNearWideRatio(await patientGraphic.boundingBox());
  await expectLargeViewportPatientLayout(page, patientGraphic);
}

async function expectMobilePatientLayout(page: Page, patientGraphic: Locator): Promise<void> {
  await page.setViewportSize({ width: 375, height: 844 });
  const mobileBox = await patientGraphic.boundingBox();
  const conditionBox = await page.locator('.condition-card').boundingBox();
  expect(mobileBox?.width).toBeGreaterThan(320);
  expect(mobileBox?.height).toBeGreaterThan(180);
  expectNearWideRatio(mobileBox);
  expect(conditionBox?.y).toBeGreaterThan((mobileBox?.y ?? 0) + (mobileBox?.height ?? 0));
  await expectSupinePatientLandmarks(page);
  await expectPatientEffectOverlays(page);
}

async function expectLargeViewportPatientLayout(page: Page, patientGraphic: Locator): Promise<void> {
  for (const viewport of [
    { width: 1280, height: 720, minWidth: 500, minHeight: 280 },
    { width: 1440, height: 900, minWidth: 600, minHeight: 330 },
    { width: 1920, height: 1080, minWidth: 700, minHeight: 390 },
    { width: 3840, height: 2160, minWidth: 900, minHeight: 500 },
  ]) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    const box = await patientGraphic.boundingBox();
    expect(box?.width).toBeGreaterThan(viewport.minWidth);
    expect(box?.height).toBeGreaterThan(viewport.minHeight);
    expectNearWideRatio(box);
    await expectOverlayWithinPatientImage(page, '.effect-breath-chest');
    await expectOverlayWithinPatientImage(page, '.effect-tube-warning');
  }
}

async function exerciseModeScenarioAndSliderControls(page: Page): Promise<void> {
  for (const mode of ['A/C', 'V/C', 'P/C', 'PSV', 'CPAP', 'BiPAP', 'SIMV', 'APRV', 'HFOV', 'NIV']) {
    await page.getByRole('button', { name: mode }).click();
    await expect(page.getByRole('button', { name: mode })).toHaveClass(/active/);
  }

  for (const scenario of ['normal', 'pneumonia', 'ards', 'airwayObstruction', 'pneumothorax']) {
    await page.locator('.scenario-select select').selectOption(scenario);
    await expect(page.getByTestId('patient-avatar')).toBeVisible();
  }

  for (const [label, value] of [
    ['FiO2 (%)', '21'],
    ['Tidal Volume (mL)', '900'],
    ['Respiratory Rate (/min)', '4'],
    ['PEEP (cmH2O)', '18'],
    ['Inspiratory Time (sec)', '2'],
    ['Flow (L/min)', '90'],
    ['Trigger (L/min)', '10'],
  ] as const) {
    await setSliderValue(page, label, value);
    await expect(page.locator('label').filter({ hasText: label }).getByRole('slider')).toHaveValue(value);
  }
}

async function exerciseCriticalApneaAndTimerControls(page: Page): Promise<void> {
  await page.locator('.scenario-select select').selectOption('normal');
  await setSliderValue(page, 'Respiratory Rate (/min)', '4');
  await setSliderValue(page, 'Trigger (L/min)', '0.5');
  await expect(page.getByTestId('patient-avatar')).toHaveAttribute('data-breath-pattern', 'apnea');
  await expect(page.locator('.apnea-time-badge')).toContainText(/APNEA/);
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.locator('.alarm-panel li.critical').first()).toBeVisible();

  await page.getByRole('button', { name: /중지/ }).click();
  const pausedTime = await page.locator('.bottom-bar strong').first().textContent();
  await page.waitForTimeout(1100);
  await expect(page.locator('.bottom-bar strong').first()).toHaveText(pausedTime ?? '');
  await page.getByRole('button', { name: '재개' }).click();
  await expect(page.locator('.bottom-bar strong').first()).not.toHaveText(pausedTime ?? '');
}

async function exerciseKeyboardHelpAndPauseShortcuts(page: Page): Promise<void> {
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toBeVisible();
  const focusBeforeHelp = await page.locator(':focus').textContent();
  await page.keyboard.press('?');
  await expect(page.getByRole('dialog', { name: '키보드 단축키 도움말' })).toBeVisible();
  await expect(page.getByRole('link', { name: '본문 이동' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('button', { name: '닫기' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: '본문 이동' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator(':focus')).toContainText(focusBeforeHelp ?? '');
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  });
  await page.keyboard.press('Space');
  await expect(page.getByRole('button', { name: '재개' })).toBeVisible();
}

async function exercisePointerTouchAndResponsiveControls(page: Page): Promise<void> {
  const normalScenarioButton = page
    .getByRole('region', { name: '사용자 인터랙션' })
    .locator('button')
    .filter({ hasText: /^normal$/ })
    .first();
  await normalScenarioButton.scrollIntoViewIfNeeded();
  await normalScenarioButton.hover();
  await normalScenarioButton.click({ force: true });
  await page.dispatchEvent('[data-testid="vent-simulator"]', 'touchstart', {
    touches: [
      {
        clientX: 20,
        clientY: 20,
        identifier: 1,
        target: await page.locator('[data-testid="vent-simulator"]').elementHandle(),
      },
    ],
  });
  await page.dispatchEvent('[data-testid="vent-simulator"]', 'touchend', {
    changedTouches: [
      {
        clientX: 80,
        clientY: 24,
        identifier: 1,
        target: await page.locator('[data-testid="vent-simulator"]').elementHandle(),
      },
    ],
  });

  await page.setViewportSize({ width: 844, height: 375 });
  await expect(page.getByTestId('patient-avatar')).toBeVisible();
  await page.setViewportSize({ width: 375, height: 844 });
  await expect(page.getByTestId('patient-avatar')).toBeVisible();
}

async function exerciseOfflineResetAndRuntimeMetrics(page: Page, consoleErrors: string[]): Promise<void> {
  await page.context().setOffline(true);
  await page.getByRole('button', { name: /^초기화$/ }).click();
  await expect(page.locator('.scenario-select select')).toHaveValue('pneumonia');
  await page.context().setOffline(false);

  const paintMs = await page.evaluate(() => {
    const firstPaint = performance.getEntriesByName('first-paint')[0]?.startTime;
    return firstPaint ?? performance.now();
  });
  const frameDeltaMs = await page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        requestAnimationFrame((first) => requestAnimationFrame((second) => resolve(second - first)));
      }),
  );
  const heapBytes = await page.evaluate(() => {
    type PerformanceWithMemory = Performance & { memory?: { usedJSHeapSize: number } };
    return (performance as PerformanceWithMemory).memory?.usedJSHeapSize ?? 0;
  });

  expect(paintMs).toBeLessThan(5_000);
  expect(frameDeltaMs).toBeLessThan(100);
  expect(heapBytes).toBeGreaterThanOrEqual(0);
  expect(consoleErrors).toEqual([]);
}
