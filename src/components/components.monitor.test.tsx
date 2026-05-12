import { fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DataVisualizationPanel, MonitorPanel, WaveformChart } from '@/components';
import { buildClinicalAssessments } from '@/simulation/clinicalAssessments';
import { DEFAULT_SETTINGS, SCENARIOS } from '@/simulation/scenarios';
import { calculateSimulation } from '@/simulation/ventilatorModel';

const pneumonia = calculateSimulation(DEFAULT_SETTINGS, SCENARIOS.pneumonia);
const normal = calculateSimulation(DEFAULT_SETTINGS, SCENARIOS.normal);
const originalIntersectionObserver = window.IntersectionObserver;
const MIN_WAVEFORM_POLYLINES = 10;
const IDLE_TIME_REMAINING_MS = 12;
const WARNING_VITAL_COUNT = 4;
let intersectionCallback: IntersectionObserverCallback | null = null;

describe('monitor and waveform component rendering', () => {
  afterEach(() => {
    restoreIntersectionObserver();
    intersectionCallback = null;
  });

  registerMonitorRenderingTests();
  registerDataVisualizationLazyRenderTests();
  registerDataVisualizationSnapshotTests();
  registerVitalClassTests();
});

function restoreIntersectionObserver(): void {
  if (originalIntersectionObserver) {
    Object.defineProperty(window, 'IntersectionObserver', {
      configurable: true,
      value: originalIntersectionObserver,
    });
    return;
  }
  Reflect.deleteProperty(window, 'IntersectionObserver');
}

function registerMonitorRenderingTests(): void {
  it('MonitorPanel and WaveformChart render labels, values, and paused waveform output', () => {
    renderMonitorAndStandaloneWaveform();
    expectMonitorSummary();
    expectTrendVisualizations();
    fireEvent.click(screen.getByRole('tab', { name: 'PIP' }));
    expect(screen.getByRole('img', { name: /PIP sparkline trend/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'PaCO2' }));
    expect(screen.getByRole('img', { name: /PaCO2 sparkline trend/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'PaO2' }));
    expect(screen.getByRole('img', { name: /PaO2 sparkline trend/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'HCO3' }));
    expect(screen.getByRole('img', { name: /HCO3 sparkline trend/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'Lactate' }));
    expect(screen.getByRole('img', { name: /Lactate sparkline trend/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'P/F' }));
    expect(screen.getByRole('img', { name: /P\/F sparkline trend/ })).toBeInTheDocument();
    exerciseTrendToolbar();
    expectClinicalData();
    expectStandaloneWaveformOutput();
    fireEvent.click(screen.getByRole('button', { name: /Standalone zoom in/ }));
    fireEvent.click(screen.getByRole('button', { name: /Standalone history back/ }));
    expect(screen.getByText('5s')).toBeInTheDocument();
    expectMonitorDisplayControls();
    exerciseStandaloneWaveformControls();
  });
}

function renderMonitorAndStandaloneWaveform(): void {
  render(
    <>
      <MonitorPanel
        clinical={pneumonia.clinical}
        isPaused={false}
        scenario={SCENARIOS.pneumonia}
        settings={DEFAULT_SETTINGS}
        vitals={pneumonia.vitals}
      />
      <WaveformChart
        color="#fff"
        isPaused
        kind="volume"
        label="Standalone"
        maxLabel="900"
        minLabel="0"
        scenario={SCENARIOS.normal}
        settings={{ ...DEFAULT_SETTINGS, mode: 'PSV' }}
        unit="(mL)"
        valueLabel="Vt 500"
        vitals={normal.vitals}
      />
    </>,
  );
}

function expectMonitorSummary(): void {
  expect(screen.getByRole('region', { name: '실시간 환자 모니터' })).toHaveAttribute(
    'aria-roledescription',
    'real-time patient monitor',
  );
  expect(screen.getByRole('region', { name: '실시간 환자 모니터' })).toHaveAttribute('aria-busy', 'false');
  expect(screen.getByText('Pressure')).toBeInTheDocument();
  expect(screen.getByText('Ppeak 31.8')).toBeInTheDocument();
  expect(screen.getByText('CO2')).toBeInTheDocument();
  expect(screen.getByText('ECG Lead II')).toBeInTheDocument();
  expect(screen.getByText('SpO2 Pleth')).toBeInTheDocument();
  expect(screen.getByText('IBP')).toBeInTheDocument();
  expect(screen.getByText('CVP')).toBeInTheDocument();
  expect(screen.getByText('PAP')).toBeInTheDocument();
  expect(screen.getByText('EEG/BIS')).toBeInTheDocument();
  expect(screen.getAllByText(/EtCO2/).length).toBeGreaterThan(0);
  expect(screen.getByRole('img', { name: 'ECG Lead II waveform data' })).toBeInTheDocument();
  expect(screen.getByText('추가 모니터링')).toBeInTheDocument();
  expect(screen.getByLabelText('데이터 시각화')).toBeInTheDocument();
}

function expectTrendVisualizations(): void {
  expect(screen.getByRole('img', { name: /SpO2 sparkline trend/ })).toBeInTheDocument();
  expect(screen.getByRole('img', { name: 'P-V loop' })).toBeInTheDocument();
  expect(screen.getByRole('img', { name: 'V-T loop' })).toBeInTheDocument();
  expect(screen.getByRole('img', { name: '1 hour waveform trend' })).toBeInTheDocument();
  expect(screen.getByRole('img', { name: 'monitor P-V loop' })).toBeInTheDocument();
  expect(screen.getByRole('img', { name: 'monitor V-T loop' })).toBeInTheDocument();
  expect(screen.getByLabelText('trend mode 12 and 24 hour windows')).toHaveTextContent('12h24h');
  expect(screen.getByLabelText('시간별 막대 그래프')).toBeInTheDocument();
  expect(screen.getByLabelText('압력-시간 히트맵')).toBeInTheDocument();
}

function exerciseTrendToolbar(): void {
  fireEvent.click(screen.getByRole('button', { name: /Trend zoom in/ }));
  fireEvent.click(screen.getByRole('button', { name: /Save trend snapshot/ }));
  expect(screen.getByText('Snapshot saved')).toBeInTheDocument();
  const printSpy = vi.spyOn(window, 'print').mockImplementation(() => undefined);
  fireEvent.click(screen.getByRole('button', { name: /Print trend report/ }));
  expect(printSpy).toHaveBeenCalled();
  printSpy.mockRestore();
}

function expectClinicalData(): void {
  expect(screen.getByText('ABGA')).toBeInTheDocument();
  expect(screen.getByText('ABG Auto')).toBeInTheDocument();
  expect(screen.getByText('VBG')).toBeInTheDocument();
  expect(screen.getByText('5-lead ECG')).toBeInTheDocument();
  expect(screen.getByText('12-lead ECG')).toBeInTheDocument();
  expect(screen.getByText('EtCO2 Trend')).toBeInTheDocument();
  expect(screen.getByText('Temperature Sites')).toBeInTheDocument();
  expect(screen.getByText('Scenario')).toBeInTheDocument();
  expect(screen.getByText(/unilateral right lower lobe/)).toBeInTheDocument();
  expect(screen.getByText('CBC')).toBeInTheDocument();
  expect(screen.getByText('BMP')).toBeInTheDocument();
  expect(screen.getByText('X-ray')).toBeInTheDocument();
  expect(screen.getByText('ECG')).toBeInTheDocument();
  expect(screen.getByText('Hemodynamics')).toBeInTheDocument();
  expect(screen.getByText('Monitoring')).toBeInTheDocument();
  expect(screen.getByText(/Swan-Ganz/)).toBeInTheDocument();
  expect(screen.getByText(/Glucose:/)).toBeInTheDocument();
  expect(screen.getByText(/Urine:/)).toBeInTheDocument();
  expect(screen.getByText(/Kim Minjun/)).toBeInTheDocument();
  expect(screen.getByText(/Penicillin rash/)).toBeInTheDocument();
}

function expectStandaloneWaveformOutput(): void {
  expect(screen.getByText('Standalone')).toBeInTheDocument();
  expect(document.querySelectorAll('polyline').length).toBeGreaterThanOrEqual(MIN_WAVEFORM_POLYLINES);
  expect(screen.getAllByRole('img', { name: /waveform data/ }).length).toBeGreaterThanOrEqual(
    MIN_WAVEFORM_POLYLINES,
  );
  expect(document.querySelector('.wave-trigger-marker')).toBeInTheDocument();
  expect(document.querySelector('.wave-cycle-marker')).toBeInTheDocument();
  expect(document.querySelector('.waveform-trace')).toHaveAttribute('stroke-width', '2');
  expect(screen.getAllByText(/min .* max .* avg/).length).toBeGreaterThan(0);
  expect(screen.getByLabelText(/Standalone time axis seconds/)).toHaveTextContent('sec');
  expect(screen.getByLabelText(/Standalone analysis tools/)).toHaveTextContent('Speed');
  expect(screen.getByLabelText(/Standalone analysis tools/)).toHaveTextContent('Color');
}

function expectMonitorDisplayControls(): void {
  expect(screen.getByRole('button', { name: 'Pause monitor screen' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Pause monitor screen' })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
  expect(screen.getByRole('button', { name: 'Fullscreen monitor' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Fullscreen monitor' })).toHaveAttribute('aria-pressed', 'false');
  expect(screen.getByRole('button', { name: 'Print monitor screen' })).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: 'Std standard monitor view' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  expect(screen.getByRole('tab', { name: 'Multi waveform view' })).toHaveAttribute('aria-selected', 'false');
  expect(screen.getByRole('tab', { name: 'Minimize monitor view' })).toHaveAttribute(
    'aria-selected',
    'false',
  );
  expect(screen.getByRole('button', { name: 'Custom monitor layout' })).toBeInTheDocument();
  expect(document.querySelector('[data-waveform-kind="pressure"] .wave-title span')).toHaveStyle({
    color: 'var(--wave-pressure)',
  });
  expect(document.querySelector('[data-waveform-kind="flow"] .wave-title span')).toHaveStyle({
    color: 'var(--wave-flow)',
  });
  expect(document.querySelector('[data-waveform-kind="volume"] .wave-title span')).toHaveStyle({
    color: 'var(--wave-volume)',
  });
  expect(document.querySelector('[data-waveform-kind="co2"] .wave-title span')).toHaveStyle({
    color: 'var(--wave-co2)',
  });
}

function exerciseStandaloneWaveformControls(): void {
  fireEvent.click(screen.getByRole('button', { name: 'Standalone freeze waveform' }));
  expect(document.querySelector('[data-waveform-label="Standalone"]')).toHaveClass('frozen-wave');
  fireEvent.click(screen.getByRole('button', { name: 'Standalone toggle grid' }));
  expect(document.querySelector('[data-waveform-label="Standalone"]')).toHaveAttribute(
    'data-grid-visible',
    'false',
  );
  fireEvent.click(screen.getByRole('button', { name: 'Standalone caliper measure' }));
  expect(document.querySelector('[data-waveform-label="Standalone"]')).toHaveAttribute(
    'data-caliper-active',
    'true',
  );
  expect(document.querySelector('.wave-caliper')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Standalone toggle labels' }));
  expect(document.querySelector('[data-waveform-label="Standalone"]')).toHaveAttribute(
    'data-labels-visible',
    'false',
  );
  fireEvent.change(screen.getByLabelText('Standalone scroll speed'), { target: { value: '2' } });
  expect(document.querySelector('[data-waveform-label="Standalone"]')).toHaveAttribute(
    'data-scroll-speed',
    '2',
  );
}

function registerDataVisualizationLazyRenderTests(): void {
  it('DataVisualizationPanel lazy-renders trend table after intersection', () => {
    const lazyRender = setupLazyRenderMocks();

    render(<DataVisualizationPanel settings={DEFAULT_SETTINGS} vitals={normal.vitals} />);
    expect(screen.getByText('Trend data table loads when visible.')).toBeInTheDocument();
    expect(screen.queryByText('SpO2 trend data')).not.toBeInTheDocument();

    const observedElement = lazyRender.observe.mock.calls[0]?.[0] as Element | undefined;
    expect(observedElement).toBeInstanceOf(Element);
    act(() => {
      intersectionCallback?.(
        [{ isIntersecting: true, target: observedElement } as IntersectionObserverEntry],
        lazyRender.callbackObserver,
      );
    });

    expect(lazyRender.requestIdleCallback).toHaveBeenCalledWith(expect.any(Function), { timeout: 250 });
    expect(screen.queryByText('SpO2 trend data')).not.toBeInTheDocument();
    act(() => {
      lazyRender.getIdleCallback()?.({
        didTimeout: false,
        timeRemaining: () => IDLE_TIME_REMAINING_MS,
      });
    });

    expect(screen.getByText('SpO2 trend data')).toBeInTheDocument();
    expect(lazyRender.disconnect).toHaveBeenCalled();
  });
}

function registerDataVisualizationSnapshotTests(): void {
  it('DataVisualizationPanel saves snapshots when blob URLs are unavailable', () => {
    const originalCreateObjectUrl = URL.createObjectURL;
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: undefined });

    render(<DataVisualizationPanel settings={DEFAULT_SETTINGS} vitals={normal.vitals} />);
    fireEvent.click(screen.getByRole('button', { name: /Save trend snapshot/ }));

    expect(screen.getByText('Snapshot saved')).toBeInTheDocument();
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: originalCreateObjectUrl });
  });

  it('DataVisualizationPanel clicks a generated download link outside jsdom user agents', () => {
    const originalUserAgent = navigator.userAgent;
    const linkClickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    Object.defineProperty(navigator, 'userAgent', { configurable: true, value: 'Chrome' });

    render(<DataVisualizationPanel settings={DEFAULT_SETTINGS} vitals={normal.vitals} />);
    fireEvent.click(screen.getByRole('button', { name: /Save trend snapshot/ }));

    expect(linkClickSpy).toHaveBeenCalledTimes(1);
    Object.defineProperty(navigator, 'userAgent', { configurable: true, value: originalUserAgent });
    linkClickSpy.mockRestore();
  });
}

function setupLazyRenderMocks(): {
  callbackObserver: IntersectionObserver;
  disconnect: ReturnType<typeof vi.fn>;
  getIdleCallback: () => IdleRequestCallback | null;
  observe: ReturnType<typeof vi.fn>;
  requestIdleCallback: ReturnType<typeof vi.fn>;
} {
  let idleCallback: IdleRequestCallback | null = null;
  const observe = vi.fn();
  const disconnect = vi.fn();
  const requestIdleCallback = vi.fn((callback: IdleRequestCallback) => {
    idleCallback = callback;
    return 1;
  });
  const callbackObserver = buildCallbackObserver(observe, disconnect);

  installIntersectionObserverMock(observe, disconnect);
  Object.defineProperty(window, 'requestIdleCallback', { configurable: true, value: requestIdleCallback });
  Object.defineProperty(window, 'cancelIdleCallback', { configurable: true, value: vi.fn() });

  return {
    callbackObserver,
    disconnect,
    getIdleCallback: () => idleCallback,
    observe,
    requestIdleCallback,
  };
}

function buildCallbackObserver(
  observe: IntersectionObserver['observe'],
  disconnect: IntersectionObserver['disconnect'],
): IntersectionObserver {
  return {
    disconnect,
    observe,
    root: null,
    rootMargin: '120px',
    scrollMargin: '0px',
    takeRecords: () => [],
    thresholds: [],
    unobserve: vi.fn(),
  };
}

function installIntersectionObserverMock(
  observe: IntersectionObserver['observe'],
  disconnect: IntersectionObserver['disconnect'],
): void {
  class MockIntersectionObserver implements IntersectionObserver {
    readonly root = null;
    readonly rootMargin = '120px';
    readonly scrollMargin = '0px';
    readonly thresholds = [];
    disconnect = disconnect;
    observe = observe;
    takeRecords = (): IntersectionObserverEntry[] => [];
    unobserve = vi.fn();

    constructor(callback: IntersectionObserverCallback) {
      intersectionCallback = callback;
    }
  }

  Object.defineProperty(window, 'IntersectionObserver', {
    configurable: true,
    value: MockIntersectionObserver,
  });
}

function registerVitalClassTests(): void {
  it('MonitorPanel distinguishes normal, warning, and danger vital classes', () => {
    const warningVitals = {
      ...normal.vitals,
      spo2: 92,
      heartRate: 105,
      etco2: 48,
      totalRR: 25,
    };
    const warningClinical = buildClinicalAssessments({
      alarms: [],
      condition: 'watch',
      scenario: SCENARIOS.normal,
      vitals: warningVitals,
    });
    const { container } = render(
      <MonitorPanel
        clinical={warningClinical}
        isPaused={false}
        scenario={SCENARIOS.normal}
        settings={DEFAULT_SETTINGS}
        vitals={warningVitals}
      />,
    );

    expect(container.querySelectorAll('.vital .warning-text')).toHaveLength(WARNING_VITAL_COUNT);
    expect(container.querySelectorAll('.vital .danger-text')).toHaveLength(0);
  });
}
