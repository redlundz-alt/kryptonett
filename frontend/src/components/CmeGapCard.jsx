function formatUsd(value) {
  return `$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatSignedUsd(value) {
  const prefix = value >= 0 ? '+' : '-';
  return `${prefix}${formatUsd(value)}`;
}

function formatSignedPct(value) {
  const prefix = value >= 0 ? '+' : '-';
  return `${prefix}${Math.abs(value).toFixed(2)}%`;
}

export default function CmeGapCard({ cmeGap }) {
  const currentGap = cmeGap?.current_gap;
  const cardStyle = {
    backgroundColor: '#fff',
    borderRadius: 8,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)',
    padding: 16,
    marginTop: 16,
    textAlign: 'left',
  };

  if (!currentGap || !currentGap.direction || currentGap.sunday_open == null) {
    return (
      <div style={{ ...cardStyle, borderTop: '3px solid #9ca3af' }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>CME Gap</h2>
        <p style={{ margin: 0, fontSize: 14, color: '#666' }}>Ingen CME gap denne uken</p>
      </div>
    );
  }

  if (currentGap.filled) {
    const filledAt = currentGap.filled_at
      ? new Date(currentGap.filled_at).toLocaleString('nb-NO')
      : '';
    return (
      <div style={{ ...cardStyle, borderTop: '3px solid #9ca3af' }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>CME Gap</h2>
        <p style={{ margin: 0, fontSize: 14, color: '#666' }}>
          Status: Fylt ✅ — {filledAt}
        </p>
      </div>
    );
  }

  const isUp = currentGap.direction === 'up';
  const borderColor = isUp ? '#22c55e' : '#ef4444';
  const headline = isUp
    ? `Gap opp: ${formatSignedUsd(currentGap.gap_size)} (${formatSignedPct(currentGap.gap_pct)})`
    : `Gap ned: ${formatSignedUsd(currentGap.gap_size)} (${formatSignedPct(currentGap.gap_pct)})`;

  return (
    <div style={{ ...cardStyle, borderTop: `3px solid ${borderColor}` }}>
      <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>CME Gap</h2>
      <p style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 'bold', color: borderColor }}>{headline}</p>
      <p style={{ margin: '0 0 4px', fontSize: 14, color: '#333' }}>
        Fredag close: {formatUsd(currentGap.friday_close)}
      </p>
      <p style={{ margin: '0 0 8px', fontSize: 14, color: '#333' }}>
        Søndag open: {formatUsd(currentGap.sunday_open)}
      </p>
      <p style={{ margin: '0 0 4px', fontSize: 14, color: '#666' }}>Status: Ikke fylt ⏳</p>
      <p style={{ margin: 0, fontSize: 14, color: '#666' }}>
        Gap-nivå å fylle: {formatUsd(currentGap.friday_close)} (fredag close)
      </p>
    </div>
  );
}
