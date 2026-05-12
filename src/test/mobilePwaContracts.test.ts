import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { readSimulatorCss } from './readSimulatorCss';

describe('mobile and PWA contracts', () => {
  it('keeps touch-device responsive rules for phone, tablet, iOS, Android, and foldable layouts', () => {
    const css = readSimulatorCss();

    expect(css).toContain('@media (pointer: coarse)');
    expect(css).toContain('@supports (-webkit-touch-callout: none)');
    expect(css).toContain('@media (hover: none) and (pointer: coarse)');
    expect(css).toContain('(orientation: landscape)');
    expect(css).toContain('(orientation: portrait)');
    expect(css).toContain('@media (max-width: 480px)');
    expect(css).toContain('@media (max-width: 430px) and (pointer: coarse)');
    expect(css).toContain('@media (horizontal-viewport-segments: 2)');
    expect(css).toContain('viewport-segment-right');
    expect(css).toContain("input[type='range']::-webkit-slider-thumb");
    expect(css).toContain("input[type='range']::-moz-range-thumb");
  });

  it('declares installable PWA metadata and mobile viewport behavior', () => {
    const manifest = JSON.parse(readFileSync(`${process.cwd()}/public/manifest.webmanifest`, 'utf8')) as {
      categories: string[];
      display: string;
      display_override: string[];
      icons: Array<{ purpose?: string; sizes: string }>;
      orientation: string;
      shortcuts: unknown[];
      start_url: string;
    };
    const html = readFileSync(`${process.cwd()}/index.html`, 'utf8');

    expect(manifest.start_url).toBe('/');
    expect(manifest.display).toBe('standalone');
    expect(manifest.display_override).toContain('standalone');
    expect(manifest.orientation).toBe('any');
    expect(manifest.categories).toEqual(expect.arrayContaining(['education', 'medical', 'simulation']));
    expect(manifest.icons.some((icon) => icon.sizes === 'any' && icon.purpose?.includes('maskable'))).toBe(
      true,
    );
    expect(manifest.shortcuts).not.toHaveLength(0);
    expect(html).toContain('viewport-fit=cover');
    expect(html).toContain('apple-mobile-web-app-capable');
    expect(html).toContain('mobile-web-app-capable');
  });
});
