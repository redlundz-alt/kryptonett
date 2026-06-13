function directionColor(direction) {
  if (direction === 'up') return '#22c55e';
  if (direction === 'down') return '#ef4444';
  return '#9ca3af';
}

function formatDirection(direction) {
  if (direction === 'up') return 'Opp';
  if (direction === 'down') return 'Ned';
  return '—';
}

function formatUsd(value) {
  if (value == null) return '—';
  return `$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function CmeGapHistory({ cmeGap }) {
  const history = cmeGap?.history ?? [];

  if (history.length === 0) {
    return null;
  }

  return (
    <div style={{ marginTop: 16 }}>
      <h2 style={{ margin: '0 0 8px' }}>CME Gap historikk</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '8px 4px', borderBottom: '1px solid #ccc' }}>Uke</th>
            <th style={{ textAlign: 'left', padding: '8px 4px', borderBottom: '1px solid #ccc' }}>Retning</th>
            <th style={{ textAlign: 'left', padding: '8px 4px', borderBottom: '1px solid #ccc' }}>Gap størrelse ($)</th>
            <th style={{ textAlign: 'left', padding: '8px 4px', borderBottom: '1px solid #ccc' }}>Gap %</th>
            <th style={{ textAlign: 'left', padding: '8px 4px', borderBottom: '1px solid #ccc' }}>Status</th>
            <th style={{ textAlign: 'left', padding: '8px 4px', borderBottom: '1px solid #ccc' }}>Fylt tidspunkt</th>
          </tr>
        </thead>
        <tbody>
          {history.map((entry) => (
            <tr key={entry.id}>
              <td style={{ padding: '8px 4px', borderBottom: '1px solid #eee' }}>{entry.week_start}</td>
              <td style={{ padding: '8px 4px', borderBottom: '1px solid #eee', color: directionColor(entry.direction) }}>
                {formatDirection(entry.direction)}
              </td>
              <td style={{ padding: '8px 4px', borderBottom: '1px solid #eee' }}>
                {formatUsd(entry.gap_size)}
              </td>
              <td style={{ padding: '8px 4px', borderBottom: '1px solid #eee' }}>
                {entry.gap_pct != null ? `${entry.gap_pct.toFixed(2)}%` : '—'}
              </td>
              <td style={{ padding: '8px 4px', borderBottom: '1px solid #eee' }}>
                {entry.filled ? 'Fylt ✅' : 'Ikke fylt ⏳'}
              </td>
              <td style={{ padding: '8px 4px', borderBottom: '1px solid #eee' }}>
                {entry.filled_at ? new Date(entry.filled_at).toLocaleString('nb-NO') : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
