function normalizeSignal(signal) {
  if (signal.awaiting_confirmation || signal.signal === 'AWAITING_CONFIRMATION') {
    return 'AWAITING';
  }
  return signal.signal;
}

export default function ConfluenceBox({ signals }) {
  if (!signals || signals.length === 0) {
    return null;
  }

  const normalized = signals.map(normalizeSignal);
  const longCount = normalized.filter((s) => s === 'LONG').length;
  const shortCount = normalized.filter((s) => s === 'SHORT').length;
  const neutralCount = normalized.filter((s) => s === 'NEUTRAL').length;
  const allSame = normalized.every((s) => s === normalized[0]);

  let backgroundColor = '#9ca3af';
  let headline = 'Ingen klar confluence';
  let detail = `LONG: ${longCount} · SHORT: ${shortCount} · NEUTRAL: ${neutralCount}`;

  if (allSame && normalized[0] === 'LONG') {
    backgroundColor = '#22c55e';
    headline = 'Samlet signal: LONG';
    detail = `${longCount} strategi(er) enige`;
  } else if (allSame && normalized[0] === 'SHORT') {
    backgroundColor = '#ef4444';
    headline = 'Samlet signal: SHORT';
    detail = `${shortCount} strategi(er) enige`;
  } else if (allSame && normalized[0] === 'NEUTRAL') {
    backgroundColor = '#9ca3af';
    headline = 'Samlet signal: NEUTRAL';
    detail = `${neutralCount} strategi(er) enige`;
  } else if (allSame && normalized[0] === 'AWAITING') {
    backgroundColor = '#eab308';
    headline = 'Samlet signal: Venter på bekreftelse';
    detail = `${signals.length} strategi(er) venter`;
  }

  return (
    <div
      style={{
        backgroundColor,
        color: '#fff',
        padding: 16,
        borderRadius: 8,
        marginTop: 16,
      }}
    >
      <p style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 'bold' }}>{headline}</p>
      <p style={{ margin: 0, fontSize: 14 }}>{detail}</p>
    </div>
  );
}
