import { useEffect, useState } from 'react';

function secondsUntilNextClose(timeframe) {
  let intervalMs;
  switch (timeframe) {
    case '15m':
      intervalMs = 15 * 60 * 1000;
      break;
    case '4h':
      intervalMs = 4 * 60 * 60 * 1000;
      break;
    case '1d':
      intervalMs = 24 * 60 * 60 * 1000;
      break;
    default:
      intervalMs = 60 * 60 * 1000;
  }

  const now = Date.now();
  const next = Math.ceil(now / intervalMs) * intervalMs;
  const remainingMs = next - now;
  return remainingMs === 0 ? intervalMs / 1000 : Math.ceil(remainingMs / 1000);
}

function formatCountdown(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default function SignalBox({ signal }) {
  const [countdown, setCountdown] = useState('00:00');

  useEffect(() => {
    function updateCountdown() {
      setCountdown(formatCountdown(secondsUntilNextClose(signal.timeframe || '1h')));
    }

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [signal?.timeframe]);

  if (!signal) {
    return null;
  }

  const backgroundColor = signal.awaiting_confirmation
    ? '#eab308'
    : signal.signal === 'LONG'
      ? '#22c55e'
      : signal.signal === 'SHORT'
        ? '#ef4444'
        : '#9ca3af';

  const showBearishWarning =
    signal.signal === 'NEUTRAL' &&
    signal.trend === 'Bearish' &&
    signal.current_price > signal.crossover_price;

  const showBullishWarning =
    signal.signal === 'NEUTRAL' &&
    signal.trend === 'Bullish' &&
    signal.current_price < signal.crossover_price;

  return (
    <div style={{ backgroundColor, padding: 16, borderRadius: 8, color: '#fff' }}>
      {signal.awaiting_confirmation && (
        <p style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 'bold' }}>⏳ Venter på bekreftelse</p>
      )}
      <p style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 'bold' }}>{signal.signal}</p>
      <p style={{ margin: '0 0 8px' }}>Neste candle om: {countdown}</p>
      {showBearishWarning && (
        <p style={{ margin: '0 0 8px', padding: 8, backgroundColor: '#f97316', borderRadius: 4 }}>
          ⚠️ Pris over crossover-nivå — venter på candle close
        </p>
      )}
      {showBullishWarning && (
        <p style={{ margin: '0 0 8px', padding: 8, backgroundColor: '#f97316', borderRadius: 4 }}>
          ⚠️ Pris under crossover-nivå — venter på candle close
        </p>
      )}
      <p style={{ margin: '0 0 12px' }}>{signal.condition}</p>
      <p style={{ margin: '0 0 4px' }}>Pris: {signal.current_price.toFixed(2)}</p>
      <p style={{ margin: '0 0 4px' }}>EMA 9: {signal.ema9.toFixed(2)}</p>
      <p style={{ margin: '0 0 4px' }}>EMA 21: {signal.ema21.toFixed(2)}</p>
      <p style={{ margin: '0 0 4px' }}>Avstand: {signal.distance_pct.toFixed(2)}%</p>
      <p style={{ margin: '0 0 4px' }}>Trend: {signal.trend}</p>
      <p style={{ margin: '0 0 4px' }}>Crossover-pris: {signal.crossover_price.toFixed(2)}</p>
      {signal.rsi != null && <p style={{ margin: '0 0 4px' }}>RSI: {signal.rsi}</p>}
      {signal.strength && signal.signal !== 'NEUTRAL' && (
        <p style={{ margin: 0 }}>Styrke: {signal.strength}</p>
      )}
    </div>
  );
}
