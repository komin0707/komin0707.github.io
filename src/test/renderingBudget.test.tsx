import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PERFORMANCE_OPTIMIZATION_MANIFEST } from '@/lib';

const forcedLayoutReadPattern =
  /\b(?:offset(?:Width|Height|Top|Left)|client(?:Width|Height|Top|Left)|scroll(?:Width|Height|Top|Left)|getBoundingClientRect|getComputedStyle|innerText)\b/;

function collectSourceFiles(directory: string): string[] {
  if (!existsSync(directory)) return [];

  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    const stats = statSync(path);

    if (stats.isDirectory()) return collectSourceFiles(path);
    return /\.(?:ts|tsx)$/.test(path) ? [path] : [];
  });
}

function isRuntimeSource(path: string): boolean {
  return !path.includes('.test.') && !path.includes('/test/') && !path.includes('/e2e/');
}

function isRafThrottledViewportRead(path: string): boolean {
  return path.endsWith('src/hooks/useThrottledViewportMetrics.ts');
}

describe('rendering performance budget', () => {
  it('keeps forced layout reads out of runtime source except the rAF-throttled viewport hook', () => {
    const files = collectSourceFiles(join(process.cwd(), 'src')).filter(isRuntimeSource);
    const offenders = files.filter((file) => {
      if (isRafThrottledViewportRead(file)) return false;
      return forcedLayoutReadPattern.test(readFileSync(file, 'utf8'));
    });

    expect(offenders).toEqual([]);
  });

  it('routes waveform polyline generation through a Vite Web Worker client', () => {
    const workerClient = readFileSync(join(process.cwd(), 'src/simulation/waveformWorkerClient.ts'), 'utf8');
    const waveformChart = readFileSync(join(process.cwd(), 'src/components/ui/WaveformChart.tsx'), 'utf8');
    const workerScript = readFileSync(join(process.cwd(), 'src/simulation/waveform.worker.ts'), 'utf8');

    expect(workerClient).toContain("import WaveformWorker from './waveform.worker?worker';");
    expect(workerClient).toContain('new WaveformWorker()');
    expect(workerScript).toContain('typeof OffscreenCanvas');
    expect(workerScript).toContain('new OffscreenCanvas(1, 1)');
    expect(workerScript).toContain("scope.addEventListener('message'");
    expect(waveformChart).toContain('requestWaveformPolyline(waveformOptions)');
  });

  it('documents G.1 render, resource hint, and cache strategy coverage', () => {
    const indexHtml = readFileSync(join(process.cwd(), 'index.html'), 'utf8');
    const serviceWorker = readFileSync(join(process.cwd(), 'public/sw.js'), 'utf8');

    for (const hint of PERFORMANCE_OPTIMIZATION_MANIFEST.resourceHints) {
      if (hint === 'modulepreload') {
        expect(readFileSync(join(process.cwd(), 'vite.config.ts'), 'utf8')).toContain('modulePreload');
        continue;
      }
      expect(indexHtml).toContain(`rel="${hint}"`);
    }
    expect(PERFORMANCE_OPTIMIZATION_MANIFEST.reactRendering.profilerBudgetMs).toBeLessThanOrEqual(1000 / 60);
    expect(PERFORMANCE_OPTIMIZATION_MANIFEST.reactRendering.suspenseLazySplit).toContain('React.lazy');
    expect(PERFORMANCE_OPTIMIZATION_MANIFEST.cacheStrategies.cacheApi).toContain('public/sw.js');
    expect(serviceWorker).toContain('stale-while-revalidate');
    expect(serviceWorker).toContain('cache-first');
    expect(serviceWorker).toContain("addEventListener('sync'");
    expect(serviceWorker).toContain("addEventListener('backgroundfetchsuccess'");
    expect(serviceWorker).toContain('memoryCache');
  });

  it('documents G.2 bundle, CSS, image, and font optimization coverage', () => {
    const indexHtml = readFileSync(join(process.cwd(), 'index.html'), 'utf8');
    const appCss = readFileSync(join(process.cwd(), 'src/App.css'), 'utf8');
    const globalCss = readFileSync(join(process.cwd(), 'src/styles/global.css'), 'utf8');
    const viteConfig = readFileSync(join(process.cwd(), 'vite.config.ts'), 'utf8');

    expect(PERFORMANCE_OPTIMIZATION_MANIFEST.bundleOptimization.treeShaking).toContain('ES modules');
    expect(PERFORMANCE_OPTIMIZATION_MANIFEST.bundleOptimization.deadCodeElimination).toContain('terser');
    expect(PERFORMANCE_OPTIMIZATION_MANIFEST.bundleOptimization.webpack5).toContain('not applicable');
    expect(PERFORMANCE_OPTIMIZATION_MANIFEST.bundleOptimization.moduleFederation).toContain('not applicable');
    expect(viteConfig).toContain('manualChunks');
    expect(viteConfig).toContain('cssMinify: true');
    expect(viteConfig).toContain("target: 'es2022'");
    expect(indexHtml).toContain('id="critical-css"');
    expect(indexHtml).toContain('fetchpriority="high"');
    expect(PERFORMANCE_OPTIMIZATION_MANIFEST.bundleOptimization.imageFormats).toContain('avif-ready');
    expect(PERFORMANCE_OPTIMIZATION_MANIFEST.bundleOptimization.imageResponsive).toContain('srcset');
    expect(PERFORMANCE_OPTIMIZATION_MANIFEST.bundleOptimization.fontDisplaySwap).toContain('system font');
    expect(PERFORMANCE_OPTIMIZATION_MANIFEST.bundleOptimization.variableFonts).toContain('system variable');
    expect(globalCss).toContain('system-ui');
    expect(globalCss).toContain('--clinical-danger');
    expect(appCss).toContain('contain: layout paint style');
    expect(appCss).toContain('content-visibility: auto');
    expect(appCss).toContain('transform: translateY');
    expect(readFileSync(join(process.cwd(), 'src/components/patient/PatientAvatar2D.css'), 'utf8')).toContain(
      'will-change',
    );
  });

  it('documents G.3 memory, lifecycle, worker, and scheduling coverage', () => {
    const layoutModel = readFileSync(join(process.cwd(), 'src/hooks/useSimulatorLayoutModel.ts'), 'utf8');
    const elapsedTimer = readFileSync(join(process.cwd(), 'src/hooks/useElapsedTimer.ts'), 'utf8');
    const intersectionHook = readFileSync(
      join(process.cwd(), 'src/hooks/useIntersectionVisibility.ts'),
      'utf8',
    );
    const viewportHook = readFileSync(
      join(process.cwd(), 'src/hooks/useThrottledViewportMetrics.ts'),
      'utf8',
    );
    const workerClient = readFileSync(join(process.cwd(), 'src/simulation/waveformWorkerClient.ts'), 'utf8');
    const memoryScript = readFileSync(join(process.cwd(), 'scripts/assert-memory-profile.mjs'), 'utf8');

    expect(PERFORMANCE_OPTIMIZATION_MANIFEST.memoryOptimization.memoryLeakBudget).toContain('bounded');
    expect(PERFORMANCE_OPTIMIZATION_MANIFEST.memoryOptimization.detachedDomBudget).toContain('cleanup');
    expect(PERFORMANCE_OPTIMIZATION_MANIFEST.memoryOptimization.webSocket).toContain('not applicable');
    expect(PERFORMANCE_OPTIMIZATION_MANIFEST.memoryOptimization.longRuns).toContain('24hour-policy');
    expect(PERFORMANCE_OPTIMIZATION_MANIFEST.memoryOptimization.flyweight).toContain('shared');
    expect(layoutModel).toContain("addEventListener('beforeunload'");
    expect(layoutModel).toContain("addEventListener('pagehide'");
    expect(layoutModel).toContain("addEventListener('freeze'");
    expect(layoutModel).toContain("addEventListener('resume'");
    expect(elapsedTimer).toContain('window.clearInterval');
    expect(intersectionHook).toContain('requestIdleCallback');
    expect(viewportHook).toContain('requestAnimationFrame');
    expect(workerClient).toContain('terminateWaveformWorker');
    expect(workerClient).toContain('worker?.terminate()');
    expect(memoryScript).toContain('HeapProfiler');
  });

  it('documents G.4 network, compression, and static hosting coverage', () => {
    const headers = readFileSync(join(process.cwd(), 'public/_headers'), 'utf8');
    const netlifyConfig = readFileSync(join(process.cwd(), 'netlify.toml'), 'utf8');
    const serviceWorker = readFileSync(join(process.cwd(), 'public/sw.js'), 'utf8');
    const vercelConfig = readFileSync(join(process.cwd(), 'vercel.json'), 'utf8');
    const viteConfig = readFileSync(join(process.cwd(), 'vite.config.ts'), 'utf8');

    expect(PERFORMANCE_OPTIMIZATION_MANIFEST.networkOptimization.http3).toContain('CDN');
    expect(PERFORMANCE_OPTIMIZATION_MANIFEST.networkOptimization.brotli).toContain('.br');
    expect(PERFORMANCE_OPTIMIZATION_MANIFEST.networkOptimization.gzip).toContain('.gz');
    expect(PERFORMANCE_OPTIMIZATION_MANIFEST.networkOptimization.imageCdn).toContain('not applicable');
    expect(PERFORMANCE_OPTIMIZATION_MANIFEST.networkOptimization.edgeFunctions).toContain('not applicable');
    expect(PERFORMANCE_OPTIMIZATION_MANIFEST.networkOptimization.geographicDistribution).toContain('CDN');
    expect(PERFORMANCE_OPTIMIZATION_MANIFEST.networkOptimization.etag).toContain('conditional');
    expect(PERFORMANCE_OPTIMIZATION_MANIFEST.networkOptimization.ifNoneMatch).toContain('ETag');
    expect(PERFORMANCE_OPTIMIZATION_MANIFEST.networkOptimization.ifModifiedSince).toContain('Last-Modified');
    expect(PERFORMANCE_OPTIMIZATION_MANIFEST.networkOptimization.status304).toContain('304');
    expect(PERFORMANCE_OPTIMIZATION_MANIFEST.networkOptimization.webSocketOptimization).toContain(
      'not applicable',
    );
    expect(PERFORMANCE_OPTIMIZATION_MANIFEST.networkOptimization.serverSentEvents).toContain(
      'not applicable',
    );
    expect(viteConfig).toContain('brotliCompress');
    expect(viteConfig).toContain('writeFile(`${path}.br`');
    expect(viteConfig).toContain('writeFile(`${path}.gz`');
    expect(headers).toContain('Cache-Control: public, max-age=31536000, immutable');
    expect(headers).toContain('Accept-Ranges: bytes');
    expect(headers).toContain('Vary: Accept-Encoding');
    expect(vercelConfig).toContain('"Cache-Control"');
    expect(vercelConfig).toContain('"Accept-Ranges"');
    expect(netlifyConfig).toContain('Accept-Ranges = "bytes"');
    expect(serviceWorker).toContain('conditionalRequests');
    expect(serviceWorker).toContain('rangeRequests');
  });
});
