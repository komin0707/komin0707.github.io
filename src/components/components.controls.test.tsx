import { fireEvent, render, screen, within } from '@testing-library/react';
import { act } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Header, ScenarioSelector, SettingsPanel, SliderControl } from '@/components';
import { DEFAULT_SETTINGS } from '@/simulation/scenarios';

const SLIDER_DEBOUNCE_MS = 80;
const SETTINGS_SLIDER_COUNT = 7;

const flushSliderDebounce = (): void => {
  act(() => {
    vi.advanceTimersByTime(SLIDER_DEBOUNCE_MS);
  });
};

describe('component controls', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  registerHeaderTests();
  registerSliderTests();
  registerSettingsPanelTests();
  registerScenarioSelectorTests();
});

function registerHeaderTests(): void {
  it('Header marks the active mode and emits mode changes', () => {
    const onModeChange = vi.fn();
    const onPaletteToggle = vi.fn();
    render(
      <Header
        isColorblindPalette={false}
        mode="AC"
        onModeChange={onModeChange}
        onPaletteToggle={onPaletteToggle}
      />,
    );

    expect(screen.getByRole('button', { name: 'A/C' })).toHaveClass('active');
    fireEvent.mouseEnter(screen.getByRole('button', { name: 'PSV' }));
    expect(screen.getByText(/Preview PSV/)).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole('navigation', { name: 'Ventilator mode' }), { key: 'ArrowRight' });
    fireEvent.click(screen.getByRole('button', { name: 'P/C' }));
    expect(onModeChange).toHaveBeenCalledWith('PC');
    expect(screen.getByRole('button', { name: 'P/C' })).toHaveAttribute('data-confirmed', 'true');
    for (const mode of [
      'A/C',
      'V/C',
      'P/C',
      'PSV',
      'CPAP',
      'BiPAP',
      'SIMV',
      'APRV',
      'HFOV',
      'NIV',
      'PRVC',
      'VS',
      'ASV',
      'NAVA',
      'PAV',
      'SmartCare',
      'IntelliVent',
    ]) {
      expect(screen.getByRole('button', { name: mode })).toBeInTheDocument();
    }
    expect(screen.getByRole('button', { name: '색맹 친화 팔레트' })).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(screen.getByRole('button', { name: '색맹 친화 팔레트' }));
    expect(onPaletteToggle).toHaveBeenCalledTimes(1);
  });

  it('Header exposes English locale controls and dispatches language changes', () => {
    const onLocaleToggle = vi.fn();
    const onLocaleChange = vi.fn();
    const onLocaleAutoDetect = vi.fn();
    render(
      <Header
        isColorblindPalette={false}
        locale="en"
        onLocaleAutoDetect={onLocaleAutoDetect}
        onLocaleChange={onLocaleChange}
        mode="AC"
        onLocaleToggle={onLocaleToggle}
        onModeChange={() => undefined}
        onPaletteToggle={() => undefined}
      />,
    );

    expect(screen.getByRole('button', { name: 'Colorblind-friendly palette' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Switch language to Korean' }));
    expect(onLocaleToggle).toHaveBeenCalledTimes(1);
    fireEvent.change(screen.getByRole('combobox', { name: 'Language selection' }), {
      target: { value: 'ja' },
    });
    expect(onLocaleChange).toHaveBeenCalledWith('ja');
    fireEvent.change(screen.getByRole('combobox', { name: 'Language selection' }), {
      target: { value: 'auto' },
    });
    expect(onLocaleAutoDetect).toHaveBeenCalledTimes(1);
  });
}

function registerSliderTests(): void {
  registerSliderMainTest();
  registerSliderCleanupTest();
  registerSliderClearedPendingTest();
  registerSliderInvalidValueTest();
}

function registerSliderMainTest(): void {
  it('SliderControl exposes bounds, value, progress style, and change callback', () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    const { rerender } = render(
      <SliderControl label="PEEP" min={0} max={20} step={1} value={5} onChange={onChange} />,
    );
    const slider = screen.getByRole('slider');

    expectSliderBoundsAndProgress(slider);
    expect(screen.getByTitle('PEEP unit')).toBeInTheDocument();
    expect(document.querySelectorAll('.slider-ticks i')).toHaveLength(11);
    expect(screen.getByText('PEEP').closest('label')).toHaveAttribute('data-touch-target', 'large');
    expect(slider).toHaveAttribute('data-touch-drag-accuracy', 'step-clamped-debounced');
    expect(slider).toHaveAttribute('data-touch-multi-finger', 'delegated-to-shell');
    exerciseSliderPointerAndKeyboard(slider, onChange);
    exerciseSliderWheelAndNumberInput(slider, onChange);
    fireEvent.click(screen.getByRole('button', { name: 'PEEP increase' }));
    fireEvent.click(screen.getByRole('button', { name: 'PEEP decrease' }));
    fireEvent.click(screen.getByRole('button', { name: 'PEEP increase' }), { altKey: true });
    expect(onChange).toHaveBeenCalledWith(5.1);
    fireEvent.change(slider, { target: { value: '1' } });
    fireEvent.pointerUp(slider);
    expect(onChange).toHaveBeenCalledWith(0);
    expect(slider).toHaveAttribute('data-drag-constraint', 'value-axis');
    fireEvent.doubleClick(screen.getByText('PEEP').closest('label') as HTMLElement);
    expect(onChange).toHaveBeenCalledWith(0);

    rerender(
      <SliderControl
        label="Trigger"
        min={0.5}
        max={15}
        step={0.1}
        suffix=" L/min"
        value={Number.NaN}
        onChange={onChange}
      />,
    );
    expect(screen.getByText('0.5 L/min')).toBeInTheDocument();
    expect(screen.getByText('Trigger').closest('label')).toHaveStyle({ '--slider-progress': '0%' });
  });
}

function registerSliderCleanupTest(): void {
  it('SliderControl clears pending debounce work on cleanup', () => {
    vi.useFakeTimers();
    const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');
    const onChange = vi.fn();
    const { unmount } = render(
      <SliderControl label="Trigger" min={0} max={20} step={1} value={5} onChange={onChange} />,
    );

    fireEvent.change(screen.getByRole('slider'), { target: { value: '7' } });
    unmount();

    expect(onChange).not.toHaveBeenCalled();
    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
    vi.useRealTimers();
  });
}

function registerSliderClearedPendingTest(): void {
  it('SliderControl ignores stale debounce callbacks after an immediate commit clears pending value', () => {
    vi.useFakeTimers();
    const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout').mockImplementation(() => undefined);
    const onChange = vi.fn();
    render(<SliderControl label="PEEP" min={0} max={20} step={1} value={5} onChange={onChange} />);

    fireEvent.change(screen.getByRole('slider'), { target: { value: '8' } });
    fireEvent.change(screen.getByRole('spinbutton', { name: 'PEEP numeric value' }), {
      target: { value: '9' },
    });
    flushSliderDebounce();

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(9);
    clearTimeoutSpy.mockRestore();
    vi.useRealTimers();
  });
}

function registerSliderInvalidValueTest(): void {
  it('SliderControl ignores parsed values that are not finite', () => {
    const onChange = vi.fn();
    render(<SliderControl label="PEEP" min={0} max={20} step={1} value={5} onChange={onChange} />);
    const isFiniteSpy = vi.spyOn(Number, 'isFinite').mockReturnValue(false);

    fireEvent.change(screen.getByRole('spinbutton', { name: 'PEEP numeric value' }), {
      target: { value: '9' },
    });

    expect(onChange).not.toHaveBeenCalled();
    isFiniteSpy.mockRestore();
  });
}

function registerSettingsPanelTests(): void {
  it('SettingsPanel renders all ventilator controls and routes typed updates', () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    render(<SettingsPanel settings={DEFAULT_SETTINGS} onChange={onChange} />);

    const settingsForm = screen.getByRole('complementary', { name: '인공호흡기 설정 폼' });
    expect(settingsForm).toBeInTheDocument();
    expect(screen.getAllByRole('slider')).toHaveLength(SETTINGS_SLIDER_COUNT);
    changeSettingsSlider('FiO2 (%)', '80');
    changeSettingsSlider('Tidal Volume (mL)', '420');
    changeSettingsSlider('Respiratory Rate (/min)', '22');
    changeSettingsSlider('PEEP (cmH2O)', '10');
    changeSettingsSlider('Inspiratory Time (sec)', '1.5');
    changeSettingsSlider('Flow (L/min)', '70');
    changeSettingsSlider('Trigger (L/min)', '3.5');
    flushSliderDebounce();

    expect(onChange).toHaveBeenCalledWith('fio2', 80);
    expect(onChange).toHaveBeenCalledWith('tidalVolume', 420);
    expect(onChange).toHaveBeenCalledWith('respiratoryRate', 22);
    expect(onChange).toHaveBeenCalledWith('peep', 10);
    expect(onChange).toHaveBeenCalledWith('inspiratoryTime', 1.5);
    expect(onChange).toHaveBeenCalledWith('flow', 70);
    expect(onChange).toHaveBeenCalledWith('trigger', 3.5);
    expect(screen.getByRole('button', { name: /환자 상태/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /알람 설정/ })).toBeInTheDocument();
    expect(screen.getByLabelText('settings change audit log')).toHaveTextContent('trigger');
    expect(screen.getByRole('button', { name: 'Undo settings change' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Undo settings change' })).toHaveAttribute('aria-disabled');
    expect(screen.getByRole('button', { name: 'Redo settings change' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Export settings audit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Minimize settings panel' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Fullscreen settings panel' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(screen.getByPlaceholderText('optional change reason')).toHaveAttribute('aria-required', 'false');
    expect(screen.getByRole('status', { name: 'settings change audit log' })).toHaveAttribute(
      'aria-relevant',
      'additions text',
    );
    expect(screen.getByLabelText('Settings presets')).toHaveTextContent('ARDSCOPDNormal');

    fireEvent.change(screen.getByPlaceholderText('optional change reason'), {
      target: { value: 'weaning trial' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Undo settings change' }));
    expect(onChange).toHaveBeenCalledWith('trigger', DEFAULT_SETTINGS.trigger);
    fireEvent.click(screen.getByRole('button', { name: 'Redo settings change' }));
    expect(onChange).toHaveBeenCalledWith('trigger', 3.5);
    fireEvent.keyDown(settingsForm, { ctrlKey: true, key: 'z' });
    expect(onChange).toHaveBeenCalledWith('trigger', DEFAULT_SETTINGS.trigger);
    fireEvent.keyDown(settingsForm, { ctrlKey: true, key: 'y' });
    expect(onChange).toHaveBeenCalledWith('trigger', 3.5);
    fireEvent.keyDown(settingsForm, { ctrlKey: true, key: 'Z', shiftKey: true });
    expect(onChange).toHaveBeenCalledWith('trigger', 3.5);
    fireEvent.click(screen.getByRole('button', { name: 'ARDS' }));
    expect(onChange).toHaveBeenCalledWith('peep', 12);

    const exportButton = screen.getByRole('button', { name: 'Export settings audit' });
    fireEvent.click(exportButton);
    expect(exportButton).toHaveClass('success');

    fireEvent.click(screen.getByRole('button', { name: 'Admin settings lock' }));
    expect(screen.getByText('FiO2 (%)').closest('label')).toHaveAttribute('data-locked', 'true');
    expect(screen.getAllByRole('slider')[0]).toBeDisabled();
  });
}

function registerScenarioSelectorTests(): void {
  it('ScenarioSelector emits scenario type changes', () => {
    const onChange = vi.fn();
    render(<ScenarioSelector value="pneumonia" onChange={onChange} />);

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'ards' } });
    expect(onChange).toHaveBeenCalledWith('ards');

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'not-a-scenario' } });
    expect(onChange).toHaveBeenCalledTimes(1);
  });
}

function expectSliderBoundsAndProgress(slider: HTMLElement): void {
  const label = screen.getByText('PEEP').closest('label');
  expect(label).toHaveStyle({ '--slider-progress': '25%' });
  expect(slider).toHaveAttribute('min', '0');
  expect(slider).toHaveAttribute('max', '20');
}

function exerciseSliderPointerAndKeyboard(slider: HTMLElement, onChange: ReturnType<typeof vi.fn>): void {
  fireEvent.change(slider, { target: { value: '12' } });
  fireEvent.change(slider, { target: { value: '13' } });
  fireEvent.keyDown(slider, { key: 'End' });
  flushSliderDebounce();
  expect(onChange).toHaveBeenCalledWith(20);
  fireEvent.change(slider, { target: { value: '25' } });
  flushSliderDebounce();
  fireEvent.change(slider, { target: { value: '-5' } });
  flushSliderDebounce();
  fireEvent.keyDown(slider, { key: 'ArrowRight' });
  fireEvent.keyDown(slider, { key: 'ArrowLeft', shiftKey: true });
  fireEvent.keyDown(slider, { key: 'PageUp' });
  fireEvent.keyDown(slider, { key: 'PageDown' });
  fireEvent.keyDown(slider, { key: 'Home' });
  fireEvent.keyDown(slider, { key: 'End' });
  expect(onChange).toHaveBeenCalledWith(20);
  expect(onChange).toHaveBeenCalledWith(0);
  expect(onChange).toHaveBeenCalledWith(6);
  expect(onChange).toHaveBeenCalledWith(4.9);
  expect(onChange).toHaveBeenCalledWith(15);
}

function exerciseSliderWheelAndNumberInput(slider: HTMLElement, onChange: ReturnType<typeof vi.fn>): void {
  fireEvent.wheel(slider, { deltaY: 1 });
  expect(onChange).not.toHaveBeenCalledWith(4);
  slider.focus();
  fireEvent.wheel(slider, { deltaY: -1 });
  expect(onChange).toHaveBeenCalledWith(6);
  fireEvent.wheel(slider, { deltaY: 1 });
  expect(onChange).toHaveBeenCalledWith(4);
  const numericInput = screen.getByRole('spinbutton', { name: 'PEEP numeric value' });
  expect(numericInput).toHaveAttribute('inputmode', 'numeric');
  expect(numericInput).toHaveAttribute('enterkeyhint', 'done');
  fireEvent.focus(numericInput);
  expect(screen.getByText('PEEP').closest('label')).toHaveAttribute('data-mobile-keyboard', 'visible');
  fireEvent.blur(numericInput);
  expect(screen.getByText('PEEP').closest('label')).toHaveAttribute('data-mobile-keyboard', 'hidden');
  fireEvent.change(numericInput, { target: { value: '11' } });
  expect(onChange).toHaveBeenCalledWith(11);
}

function changeSettingsSlider(label: string, value: string): void {
  fireEvent.change(within(screen.getByText(label).closest('label')!).getByRole('slider'), {
    target: { value },
  });
}
