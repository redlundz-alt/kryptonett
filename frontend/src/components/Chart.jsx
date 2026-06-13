import { useEffect, useMemo, useRef } from 'react';
import { CandlestickSeries, LineSeries, createChart } from 'lightweight-charts';

function getEmaConfig(selectedStrategies) {
  if (!selectedStrategies?.length) {
    return null;
  }

  switch (selectedStrategies[0]) {
    case 'ema_crossover':
      return {
        fastKey: 'ema9',
        slowKey: 'ema21',
        fastLabel: 'EMA 9',
        slowLabel: 'EMA 21',
      };
    case 'macd':
      return {
        fastKey: 'ema12',
        slowKey: 'ema26',
        fastLabel: 'EMA 12',
        slowLabel: 'EMA 26',
        computeMissing: true,
      };
    case 'rsi_strategy':
      return null;
    case 'golden_cross':
      return {
        fastKey: 'ema50',
        slowKey: 'ema200',
        fastLabel: 'EMA 50',
        slowLabel: 'EMA 200',
      };
    default:
      return null;
  }
}

function computeEmaValues(candles, period) {
  const values = [];

  for (let i = 0; i < candles.length; i += 1) {
    if (i < period - 1) {
      values.push(null);
    } else if (i === period - 1) {
      const sum = candles.slice(0, period).reduce((total, candle) => total + candle.close, 0);
      values.push(sum / period);
    } else {
      const multiplier = 2 / (period + 1);
      values.push(candles[i].close * multiplier + values[i - 1] * (1 - multiplier));
    }
  }

  return values;
}

function LegendItem({ color, label }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#666' }}>
      <span
        style={{
          display: 'inline-block',
          width: 16,
          height: 3,
          backgroundColor: color,
          borderRadius: 1,
        }}
      />
      {label}
    </span>
  );
}

export default function Chart({ candles, selectedStrategies }) {
  const containerRef = useRef(null);
  const candlestickRef = useRef(null);
  const fastLineRef = useRef(null);
  const slowLineRef = useRef(null);
  const emaConfig = useMemo(
    () => getEmaConfig(selectedStrategies),
    [selectedStrategies],
  );

  useEffect(() => {
    const chart = createChart(containerRef.current, {
      autoSize: true,
    });
    candlestickRef.current = chart.addSeries(CandlestickSeries);
    fastLineRef.current = chart.addSeries(LineSeries, { color: '#f59e0b', lineWidth: 2 });
    slowLineRef.current = chart.addSeries(LineSeries, { color: '#3b82f6', lineWidth: 2 });

    return () => {
      chart.remove();
      candlestickRef.current = null;
      fastLineRef.current = null;
      slowLineRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!candles.length || !candlestickRef.current || !fastLineRef.current || !slowLineRef.current) {
      return;
    }

    candlestickRef.current.setData(
      candles.map((c) => ({
        time: c.time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      })),
    );

    if (!emaConfig) {
      fastLineRef.current.setData([]);
      slowLineRef.current.setData([]);
      return;
    }

    let enrichedCandles = candles;

    if (emaConfig.computeMissing) {
      const ema12 = computeEmaValues(candles, 12);
      const ema26 = computeEmaValues(candles, 26);
      enrichedCandles = candles.map((candle, index) => ({
        ...candle,
        ema12: ema12[index],
        ema26: ema26[index],
      }));
    }

    const fastData = enrichedCandles
      .filter((c) => c[emaConfig.fastKey] != null)
      .map((c) => ({ time: c.time, value: c[emaConfig.fastKey] }));
    const slowData = enrichedCandles
      .filter((c) => c[emaConfig.slowKey] != null)
      .map((c) => ({ time: c.time, value: c[emaConfig.slowKey] }));

    fastLineRef.current.setData(fastData);
    slowLineRef.current.setData(slowData);
  }, [candles, emaConfig]);

  return (
    <div>
      <div ref={containerRef} style={{ width: '100%', height: 400 }} />
      {emaConfig && (
        <div style={{ display: 'flex', gap: 16, marginTop: 8, justifyContent: 'center' }}>
          <LegendItem color="#f59e0b" label={emaConfig.fastLabel} />
          <LegendItem color="#3b82f6" label={emaConfig.slowLabel} />
        </div>
      )}
    </div>
  );
}
