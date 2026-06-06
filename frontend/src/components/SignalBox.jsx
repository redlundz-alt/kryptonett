export default function SignalBox({ signal }) {
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

  return (
    <div style={{ backgroundColor, padding: 16, borderRadius: 8, color: '#fff' }}>
      {signal.awaiting_confirmation && (
        <p style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 'bold' }}>⏳ Venter på bekreftelse</p>
      )}
      <p style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 'bold' }}>{signal.signal}</p>
      <p style={{ margin: '0 0 12px' }}>{signal.condition}</p>
      <p style={{ margin: '0 0 4px' }}>Pris: {signal.current_price.toFixed(2)}</p>
      <p style={{ margin: '0 0 4px' }}>EMA 9: {signal.ema9.toFixed(2)}</p>
      <p style={{ margin: '0 0 4px' }}>EMA 21: {signal.ema21.toFixed(2)}</p>
      <p style={{ margin: '0 0 4px' }}>Avstand: {signal.distance_pct.toFixed(2)}%</p>
      <p style={{ margin: '0 0 4px' }}>Trend: {signal.trend}</p>
      <p style={{ margin: '0 0 4px' }}>Crossover-pris: {signal.crossover_price.toFixed(2)}</p>
      {signal.strength && <p style={{ margin: '0 0 4px' }}>Styrke: {signal.strength}</p>}
      {signal.rsi != null && <p style={{ margin: 0 }}>RSI: {signal.rsi}</p>}
    </div>
  );
}
