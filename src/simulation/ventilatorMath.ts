export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const finiteOr = (value: number, fallback: number) => (Number.isFinite(value) ? value : fallback);
