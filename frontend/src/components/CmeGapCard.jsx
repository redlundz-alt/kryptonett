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

function formatWeekStart(weekStart) {
  return new Date(`${weekStart}T00:00:00`).toLocaleDateString('nb-NO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatDateTime(value) {
  return new Date(value).toLocaleString('nb-NO');
}

function getNextFridayDate() {
  const date = new Date();
  const daysUntilFriday = (5 - date.getDay() + 7) % 7 || 7;
  date.setDate(date.getDate() + daysUntilFriday);
  return date;
}

function formatNextRegistration() {
  const nextFriday = getNextFridayDate();
  const dateLabel = nextFriday.toLocaleDateString('nb-NO', {
    day: 'numeric',
    month: 'long',
  });
  return `Neste registrering: fredag ${dateLabel} kl 23:10 CET`;
}

const smallGrayText = {
  margin: 0,
  fontSize: 12,
  color: '#888',
  lineHeight: 1.5,
};

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
        <p style={{ margin: '0 0 8px', fontSize: 14, color: '#666' }}>Ingen CME gap denne uken</p>
        <p style={{ ...smallGrayText, marginBottom: 8 }}>
          CME Bitcoin Futures stenger fredag kl 23:00 CET og åpner søndag kl 00:00 CET.
          Gap registreres hvis prisen har beveget seg mellom stengning og åpning.
        </p>
        <p style={smallGrayText}>{formatNextRegistration()}</p>
      </div>
    );
  }

  const weekLabel = currentGap.week_start ? formatWeekStart(currentGap.week_start) : '';
  const registeredAt = currentGap.created_at ? formatDateTime(currentGap.created_at) : '';

  if (currentGap.filled) {
    const filledAt = currentGap.filled_at
      ? formatDateTime(currentGap.filled_at)
      : '';
    return (
      <div style={{ ...cardStyle, borderTop: '3px solid #9ca3af' }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>CME Gap</h2>
        {weekLabel && (
          <p style={{ margin: '0 0 4px', fontSize: 14, color: '#333' }}>Uke: {weekLabel}</p>
        )}
        {registeredAt && (
          <p style={{ margin: '0 0 8px', fontSize: 14, color: '#333' }}>
            Registrert: {registeredAt}
          </p>
        )}
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
      {weekLabel && (
        <p style={{ margin: '0 0 4px', fontSize: 14, color: '#333' }}>Uke: {weekLabel}</p>
      )}
      {registeredAt && (
        <p style={{ margin: '0 0 8px', fontSize: 14, color: '#333' }}>
          Registrert: {registeredAt}
        </p>
      )}
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
