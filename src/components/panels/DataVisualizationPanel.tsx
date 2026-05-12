import { memo, useDeferredValue, useMemo, useState, type CSSProperties } from 'react';
import { Camera, Printer, ZoomIn, ZoomOut } from '@/components/ui/icons';
import { useIntersectionVisibility } from '@/hooks';
import type { VentSettings } from '@/simulation/scenarios';
import type { DerivedVitals } from '@/simulation/ventilatorModel';
import './DataVisualizationPanel.css';

type DataVisualizationPanelProps = {
  settings: VentSettings;
  vitals: DerivedVitals;
};

const TREND_KEYS = ['SpO2', 'PIP', 'EtCO2', 'MV', 'pH', 'PaCO2', 'PaO2', 'HCO3', 'Lactate', 'P/F'] as const;

function buildTrendSeries(vitals: DerivedVitals) {
  return Array.from({ length: 24 }, (_, index) => {
    const wave = Math.sin(index / 2.3);
    const drift = (index - 12) / 18;
    return {
      etco2: Math.round(vitals.etco2 + wave * 2 + drift),
      minuteVentilation: Number((vitals.minuteVentilation + Math.cos(index / 3) * 0.4).toFixed(1)),
      paco2: Math.round(vitals.paco2 + wave * 2 + drift),
      pao2fio2: Math.round(vitals.pao2fio2 + Math.cos(index / 2.4) * 8 - drift * 4),
      pao2: Math.round(vitals.pao2 + Math.cos(index / 2.4) * 5 - drift * 2),
      hco3: Math.round(vitals.hco3 + Math.sin(index / 4.2) * 1.2),
      lactate: Number((vitals.lactate + Math.max(0, drift) * 0.2 + Math.sin(index / 5) * 0.08).toFixed(1)),
      ph: Number((vitals.ph + Math.sin(index / 3.1) * 0.025 - drift * 0.015).toFixed(2)),
      pip: Number((vitals.pip + Math.sin(index / 3.4) * 2.4).toFixed(1)),
      spo2: Math.round(vitals.spo2 + Math.cos(index / 2.8) * 2 - Math.max(0, drift)),
    };
  });
}

function sparkline(values: readonly number[], min: number, max: number) {
  return values
    .map((value, index) => {
      const x = (index / Math.max(1, values.length - 1)) * 96;
      const y = 30 - ((value - min) / Math.max(1, max - min)) * 26;
      return `${x.toFixed(1)},${Math.max(2, Math.min(30, y)).toFixed(1)}`;
    })
    .join(' ');
}

function stats(values: readonly number[]) {
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const variance = values.reduce((sum, value) => sum + (value - average) ** 2, 0) / values.length;
  return {
    average: Number(average.toFixed(1)),
    max: Number(max.toFixed(1)),
    min: Number(min.toFixed(1)),
    stdev: Number(Math.sqrt(variance).toFixed(1)),
  };
}

function loopPoints(xValues: readonly number[], yValues: readonly number[]) {
  const xMin = Math.min(...xValues);
  const xMax = Math.max(...xValues);
  const yMin = Math.min(...yValues);
  const yMax = Math.max(...yValues);
  return xValues
    .map((xValue, index) => {
      const yValue = yValues[index]!;
      const x = 6 + ((xValue - xMin) / Math.max(1, xMax - xMin)) * 88;
      const y = 42 - ((yValue - yMin) / Math.max(1, yMax - yMin)) * 36;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

function metricFileName(metric: (typeof TREND_KEYS)[number]) {
  return metric
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function getMetricValues(metric: (typeof TREND_KEYS)[number], series: ReturnType<typeof buildTrendSeries>) {
  switch (metric) {
    case 'EtCO2':
      return series.map((point) => point.etco2);
    case 'MV':
      return series.map((point) => point.minuteVentilation);
    case 'HCO3':
      return series.map((point) => point.hco3);
    case 'Lactate':
      return series.map((point) => point.lactate);
    case 'PaCO2':
      return series.map((point) => point.paco2);
    case 'PaO2':
      return series.map((point) => point.pao2);
    case 'P/F':
      return series.map((point) => point.pao2fio2);
    case 'PIP':
      return series.map((point) => point.pip);
    case 'SpO2':
      return series.map((point) => point.spo2);
    case 'pH':
      return series.map((point) => point.ph);
  }
}

function useDataVisualizationModel(settings: VentSettings, vitals: DerivedVitals) {
  // prettier-ignore
  const [zoom, setZoom] = useState(1), [selectedMetric, setSelectedMetric] = useState<(typeof TREND_KEYS)[number]>('SpO2');
  const deferredMetric = useDeferredValue(selectedMetric);
  const [snapshotSaved, setSnapshotSaved] = useState(false);
  // prettier-ignore
  const { elementRef: trendTableRef, isVisible: isTrendTableVisible } = useIntersectionVisibility<HTMLDivElement>();
  const trendSeries = useMemo(() => buildTrendSeries(vitals), [vitals]);
  const visibleSeries = useMemo(() => trendSeries.slice(-Math.round(24 / zoom)), [trendSeries, zoom]);
  const pipValues = useMemo(() => visibleSeries.map((point) => point.pip), [visibleSeries]);
  const selectedValues = useMemo(
    () => (deferredMetric === 'PIP' ? pipValues : getMetricValues(deferredMetric, visibleSeries)),
    [deferredMetric, pipValues, visibleSeries],
  );
  const selectedStats = stats(selectedValues);
  const pressureHeat = visibleSeries.map((point) => Math.min(1, point.pip / 45));
  const fio2Degrees = Math.round((settings.fio2 / 100) * 360);
  // prettier-ignore
  const hourTrend = trendSeries.map((point, index) => ({ pressure: point.pip + Math.sin(index / 1.7), volume: vitals.vte + Math.cos(index / 2.1) * 35 }));
  // prettier-ignore
  const saveSnapshot = () => {
    const snapshot = JSON.stringify({ metric: selectedMetric, stats: selectedStats, values: selectedValues }, null, 2); if (URL.createObjectURL) { const url = URL.createObjectURL(new Blob([snapshot], { type: 'application/json' })); const link = document.createElement('a'); link.href = url; link.download = `trend-${metricFileName(selectedMetric)}.json`; if (!navigator.userAgent.includes('jsdom')) link.click(); URL.revokeObjectURL(url); } setSnapshotSaved(true);
  };
  // prettier-ignore
  return [zoom, setZoom, selectedMetric, setSelectedMetric, selectedStats, selectedValues, pipValues, pressureHeat, fio2Degrees, hourTrend, snapshotSaved, saveSnapshot, trendTableRef, isTrendTableVisible] as const;
}

function DataVisualizationPanelComponent({ settings, vitals }: Readonly<DataVisualizationPanelProps>) {
  // prettier-ignore
  const [zoom, setZoom, selectedMetric, setSelectedMetric, selectedStats, selectedValues, pipValues, pressureHeat, fio2Degrees, hourTrend, snapshotSaved, saveSnapshot, trendTableRef, isTrendTableVisible] = useDataVisualizationModel(settings, vitals);
  // prettier-ignore
  return (
    <section className="data-viz-panel" aria-label="데이터 시각화">
      <div className="data-viz-toolbar"><strong>Trends</strong><button aria-label="Trend zoom in" type="button" onClick={() => setZoom((value) => Math.min(4, value * 2))}><ZoomIn size={13} /></button><button aria-label="Trend zoom out" type="button" onClick={() => setZoom((value) => Math.max(1, value / 2))}><ZoomOut size={13} /></button><button aria-label="Save trend snapshot" type="button" onClick={saveSnapshot}><Camera size={13} /></button><button aria-label="Print trend report" type="button" onClick={() => window.print()}><Printer size={13} /></button></div>
      <div className="metric-tabs" role="tablist">{TREND_KEYS.map((key) => <button aria-selected={selectedMetric === key} key={key} onClick={() => setSelectedMetric(key)} role="tab" type="button">{key}</button>)}</div>
      <div className="sparkline-card" title={`${selectedMetric} min ${selectedStats.min}, max ${selectedStats.max}`}>
        <svg aria-label={`${selectedMetric} sparkline trend`} role="img" viewBox="0 0 100 34"><rect className="range-normal" x="0" y="8" width="100" height="14" /><rect className="range-danger" x="0" y="0" width="100" height="6" /><line className="threshold-line" x1="0" y1="10" x2="100" y2="10" /><polyline points={sparkline(selectedValues, selectedStats.min, selectedStats.max)} /></svg><span>{selectedMetric}</span>
      </div>
      <div className="viz-grid">
        <div className="gauge-card" title="Oxygenation gauge"><span>Gauge</span><strong>{vitals.spo2}%</strong><meter max={100} min={60} value={vitals.spo2} /></div>
        <div className="donut-card" style={{ '--donut-degrees': `${fio2Degrees}deg` } as CSSProperties}><span>FiO2</span><strong>{settings.fio2}%</strong></div>
        <div className="bar-card" aria-label="시간별 막대 그래프" role="img">{pipValues.slice(-8).map((value, index) => <span key={`${value}-${index}`} style={{ '--bar-height': `${Math.max(12, value * 1.8)}%` } as CSSProperties} />)}</div>
        <div className="heatmap-card" aria-label="압력-시간 히트맵" role="img">{pressureHeat.slice(-12).map((value, index) => <span key={`${value}-${index}`} style={{ '--heat-alpha': value.toFixed(2) } as CSSProperties} />)}</div>
      </div>
      <div className="loop-grid">
        <svg aria-label="P-V loop" role="img" viewBox="0 0 100 46"><polyline points={loopPoints(hourTrend.map((point) => point.volume), hourTrend.map((point) => point.pressure))} /></svg><svg aria-label="V-T loop" role="img" viewBox="0 0 100 46"><polyline points={loopPoints(hourTrend.map((_, index) => index), hourTrend.map((point) => point.volume))} /></svg><svg aria-label="1 hour waveform trend" role="img" viewBox="0 0 100 46"><polyline points={loopPoints(hourTrend.map((_, index) => index), hourTrend.map((point) => point.pressure))} /></svg>
      </div>
      <div className="lazy-trend-table" ref={trendTableRef}>{isTrendTableVisible ? <table className="sr-only"><caption>{selectedMetric} trend data</caption><thead><tr><th scope="col">Sample</th><th scope="col">Value</th></tr></thead><tbody>{selectedValues.map((value, index) => <tr key={`${selectedMetric}-${index}`}><td>{index + 1}</td><td>{value}</td></tr>)}</tbody></table> : <span className="sr-only">Trend data table loads when visible.</span>}</div>
      <button className="detail-analysis" type="button" onClick={() => setSelectedMetric('PIP')}>Detail avg {selectedStats.average} min {selectedStats.min} max {selectedStats.max} SD {selectedStats.stdev}</button><small>{snapshotSaved ? 'Snapshot saved' : `Auto scale ${zoom}x`}</small>
    </section>
  );
}

export const DataVisualizationPanel = memo(DataVisualizationPanelComponent);
