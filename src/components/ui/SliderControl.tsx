import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type WheelEvent,
} from 'react';
import './SliderControl.css';

const SLIDER_DEBOUNCE_MS = 80;

type SliderControlProps = {
  defaultValue?: number;
  disabled?: boolean | undefined;
  dangerHigh?: number | undefined;
  dangerLow?: number | undefined;
  label: string;
  locked?: boolean | undefined;
  max: number;
  min: number;
  onChange: (value: number) => void;
  recommendedMax?: number | undefined;
  recommendedMin?: number | undefined;
  step: number;
  suffix?: string;
  value: number;
};

export function SliderControl({
  dangerHigh,
  dangerLow,
  defaultValue,
  disabled = false,
  label,
  locked = false,
  max,
  min,
  onChange,
  recommendedMax,
  recommendedMin,
  step,
  suffix,
  value,
}: SliderControlProps) {
  const rangeId = useId();
  const debounceTimer = useRef<number | null>(null);
  const pendingValue = useRef<number | null>(null);
  const [mobileKeyboardVisible, setMobileKeyboardVisible] = useState(false);
  const [valueHistory, setValueHistory] = useState<number[]>([]);
  const clampValue = (nextValue: number) => Math.min(max, Math.max(min, nextValue));
  const safeValue = Number.isFinite(value) ? clampValue(value) : min;
  const progress = `${((safeValue - min) / (max - min)) * 100}%`;
  const recommendedStart = `${(((recommendedMin ?? min) - min) / (max - min)) * 100}%`;
  const recommendedEnd = `${(((recommendedMax ?? max) - min) / (max - min)) * 100}%`;
  const lowDangerEnd = `${(((dangerLow ?? min) - min) / (max - min)) * 100}%`;
  const highDangerStart = `${(((dangerHigh ?? max) - min) / (max - min)) * 100}%`;
  const isDisabled = disabled || locked;
  const unit = suffix?.trim() || label.match(/\(([^)]+)\)/)?.[1] || '';
  const tickMarks = useMemo(
    () =>
      Array.from({ length: 11 }, (_, index) => ({
        kind: index % 5 === 0 ? 'major' : 'minor',
        left: `${index * 10}%`,
      })),
    [],
  );

  // prettier-ignore
  useEffect(() => () => {
    if (debounceTimer.current !== null) window.clearTimeout(debounceTimer.current);
  }, []);

  // prettier-ignore
  const commitValue = (nextValue: number) => {
    if (isDisabled) return; const clampedValue = clampValue(nextValue); if (debounceTimer.current !== null) { window.clearTimeout(debounceTimer.current); debounceTimer.current = null; } pendingValue.current = null; setValueHistory((items) => items.at(-1) === clampedValue ? items : [...items.slice(-4), clampedValue]); onChange(clampedValue);
  };

  // prettier-ignore
  const commitDebouncedValue = (nextValue: number) => {
    if (isDisabled) return; pendingValue.current = clampValue(nextValue); if (debounceTimer.current !== null) window.clearTimeout(debounceTimer.current); debounceTimer.current = window.setTimeout(() => { debounceTimer.current = null; if (pendingValue.current !== null) { const committedValue = pendingValue.current; setValueHistory((items) => items.at(-1) === committedValue ? items : [...items.slice(-4), committedValue]); onChange(committedValue); pendingValue.current = null; } }, SLIDER_DEBOUNCE_MS);
  };

  // prettier-ignore
  const handleChange = (nextValue: string | number, options: { debounce?: boolean } = {}) => {
    const parsed = Number(nextValue); if (!Number.isFinite(parsed)) return; if (options.debounce) { commitDebouncedValue(parsed); return; } commitValue(parsed);
  };

  const adjustBy = (delta: number) => handleChange(Number((safeValue + delta).toFixed(2)));
  const adjustByPointer = (event: MouseEvent<HTMLButtonElement>, direction: 1 | -1) => {
    adjustBy(direction * (event.altKey ? step / 10 : step));
  };
  const snapEndpoint = (event: PointerEvent<HTMLInputElement>) => {
    const parsed = Number(event.currentTarget.value);
    if (!Number.isFinite(parsed)) return;
    if (parsed - min <= step) handleChange(min);
    if (max - parsed <= step) handleChange(max);
  };
  // prettier-ignore
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const fineStep = event.shiftKey ? step / 10 : step; const largeStep = step * 10; if (event.key === 'ArrowUp' || event.key === 'ArrowRight') { event.preventDefault(); adjustBy(fineStep); } else if (event.key === 'ArrowDown' || event.key === 'ArrowLeft') { event.preventDefault(); adjustBy(-fineStep); } else if (event.key === 'PageUp') { event.preventDefault(); adjustBy(largeStep); } else if (event.key === 'PageDown') { event.preventDefault(); adjustBy(-largeStep); } else if (event.key === 'Home') { event.preventDefault(); handleChange(min); } else if (event.key === 'End') { event.preventDefault(); handleChange(max); }
  };
  const handleWheel = (event: WheelEvent<HTMLInputElement>) => {
    if (document.activeElement !== event.currentTarget) return;
    event.preventDefault();
    adjustBy((event.deltaY < 0 ? step : -step) * (event.shiftKey ? 10 : 1));
  };

  // prettier-ignore
  return (
    <label className={`slider-control ${isDisabled ? 'disabled' : ''}`} data-locked={locked} data-mobile-keyboard={mobileKeyboardVisible ? 'visible' : 'hidden'} data-touch-target="large" htmlFor={rangeId} onDoubleClick={() => handleChange(defaultValue ?? min)} style={{ '--danger-high-start': highDangerStart, '--danger-low-end': lowDangerEnd, '--recommended-end': recommendedEnd, '--recommended-start': recommendedStart, '--slider-progress': progress } as CSSProperties} title={`${label} controls. Double tap resets to default. Arrow keys adjust; Page keys make larger changes.`}>
      <span className="slider-row"><span>{label}</span><strong>{safeValue.toFixed(step < 1 ? 1 : 0)}{suffix}</strong></span>
      <span className="slider-unit" title={`${label} unit`}>{unit}</span>
      <button aria-label={`${label} decrease`} className="slider-nudge" disabled={isDisabled} type="button" onClick={(event) => adjustByPointer(event, -1)}>-</button>
      <input aria-disabled={isDisabled} data-drag-constraint={label.toLowerCase().includes('time') ? 'time-axis' : 'value-axis'} data-touch-drag-accuracy="step-clamped-debounced" data-touch-multi-finger="delegated-to-shell" disabled={isDisabled} id={rangeId} max={max} min={min} onChange={(event) => handleChange(event.target.value, { debounce: true })} onKeyDown={handleKeyDown} onPointerUp={snapEndpoint} onWheel={handleWheel} step={step} type="range" value={safeValue} />
      <button aria-label={`${label} increase`} className="slider-nudge" disabled={isDisabled} type="button" onClick={(event) => adjustByPointer(event, 1)}>+</button>
      <input aria-label={`${label} numeric value`} className="slider-number" disabled={isDisabled} enterKeyHint="done" inputMode={step < 1 ? 'decimal' : 'numeric'} max={max} min={min} onBlur={() => setMobileKeyboardVisible(false)} onChange={(event) => handleChange(event.target.value)} onFocus={() => setMobileKeyboardVisible(true)} onKeyDown={handleKeyDown} step={step} type="number" value={safeValue} />
      <span className="slider-ticks" aria-hidden="true">{tickMarks.map((tick) => <i className={tick.kind} key={tick.left} style={{ left: tick.left }} />)}</span>
      <span className="slider-history" title={`${label} last values`}>Last {valueHistory.slice(-5).join(' / ') || safeValue}</span>
      <span className="slider-limits"><span>{min}</span><span>{max}</span></span>
    </label>
  );
}
