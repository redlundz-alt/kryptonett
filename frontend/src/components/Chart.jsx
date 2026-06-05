import { useEffect, useRef } from 'react';
import { CandlestickSeries, LineSeries, createChart } from 'lightweight-charts';

export default function Chart({ candles }) {
  const containerRef = useRef(null);
  const candlestickRef = useRef(null);
  const ema9Ref = useRef(null);
  const ema21Ref = useRef(null);

  useEffect(() => {
    const chart = createChart(containerRef.current, {
      autoSize: true,
    });
    candlestickRef.current = chart.addSeries(CandlestickSeries);
    ema9Ref.current = chart.addSeries(LineSeries, { color: '#f59e0b', lineWidth: 2 });
    ema21Ref.current = chart.addSeries(LineSeries, { color: '#3b82f6', lineWidth: 2 });

    return () => {
      chart.remove();
      candlestickRef.current = null;
      ema9Ref.current = null;
      ema21Ref.current = null;
    };
  }, []);

  useEffect(() => {
    if (!candles.length || !candlestickRef.current) {
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

    const emaCandles = candles.filter((c) => c.ema9 != null && c.ema21 != null);

    ema9Ref.current.setData(
      emaCandles.map((c) => ({ time: c.time, value: c.ema9 })),
    );
    ema21Ref.current.setData(
      emaCandles.map((c) => ({ time: c.time, value: c.ema21 })),
    );
  }, [candles]);

  return <div ref={containerRef} style={{ width: '100%', height: 400 }} />;
}
