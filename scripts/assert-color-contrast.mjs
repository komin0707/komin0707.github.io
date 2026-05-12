const pairs = [
  ['main text AAA', '#eaf3ff', '#07111f', 7],
  ['muted text AAA', '#c6dcf2', '#0b1b2d', 7],
  ['danger text AAA', '#ff8a80', '#0b1b2d', 7],
  ['normal status AAA', '#35d27f', '#07111f', 7],
  ['warning status AAA', '#ffd84a', '#07111f', 7],
  ['focus outline non-text AAA', '#1689ff', '#07111f', 4.5],
  ['active button', '#ffffff', '#0f5bac', 4.5],
  ['dark non-text control border AAA', '#8fa9c4', '#0b1b2d', 4.5],
  ['dark hover border AAA', '#c6dcf2', '#0b1b2d', 4.5],
  ['dark disabled border AAA', '#8fa9c4', '#132337', 4.5],
  ['dark disabled text AAA', '#c6dcf2', '#132337', 7],
  ['light text AAA', '#10263d', '#eaf3fb', 7],
  ['light muted text AAA', '#294a62', '#eaf3fb', 7],
  ['light non-text control border AAA', '#2f5673', '#eaf3fb', 4.5],
  ['light hover border AAA', '#1f4864', '#eaf3fb', 4.5],
  ['light disabled border AAA', '#2f5673', '#dcecf8', 4.5],
  ['high contrast main AAA', '#ffffff', '#000000', 7],
];

const failures = pairs
  .map(([label, foreground, background, minimum]) => ({
    label,
    minimum,
    ratio: contrastRatio(foreground, background),
  }))
  .filter(({ minimum, ratio }) => ratio < minimum);

if (failures.length > 0) {
  const formatted = failures
    .map(({ label, minimum, ratio }) => `${label}: ${ratio.toFixed(2)} < ${minimum}`)
    .join('\n');
  throw new Error(`Color contrast budget failed:\n${formatted}`);
}

function contrastRatio(foreground, background) {
  const lighter = Math.max(relativeLuminance(foreground), relativeLuminance(background));
  const darker = Math.min(relativeLuminance(foreground), relativeLuminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

function relativeLuminance(color) {
  const [red, green, blue] = parseHex(color).map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });

  return red * 0.2126 + green * 0.7152 + blue * 0.0722;
}

function parseHex(color) {
  const value = color.replace('#', '');
  return [0, 2, 4].map((offset) => Number.parseInt(value.slice(offset, offset + 2), 16));
}
