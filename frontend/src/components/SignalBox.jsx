export default function SignalBox({ signal }) {
  if (!signal) {
    return null;
  }

  const backgroundColor =
    signal.signal === 'LONG'
      ? '#22c55e'
      : signal.signal === 'SHORT'
        ? '#ef4444'
        : '#9ca3af';

  return (
    <div style={{ backgroundColor, padding: 16, borderRadius: 8, color: '#fff' }}>
      <p style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 'bold' }}>{signal.signal}</p>
      <p style={{ margin: '0 0 12px' }}>{signal.condition}</p>
      <p style={{ margin: '0 0 4px' }}>Pris: {signal.current_price.toFixed(2)}</p>
      <p style={{ margin: '0 0 4px' }}>EMA 9: {signal.ema9.toFixed(2)}</p>
      <p style={{ margin: 0 }}>EMA 21: {signal.ema21.toFixed(2)}</p>
    </div>
  );
}
