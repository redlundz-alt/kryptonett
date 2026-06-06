function signalColor(signal) {
  if (signal === 'LONG') return '#22c55e';
  if (signal === 'SHORT') return '#ef4444';
  return '#9ca3af';
}

function outcomeColor(outcome) {
  if (outcome === 'WIN') return '#22c55e';
  if (outcome === 'LOSS') return '#ef4444';
  return '#9ca3af';
}

function formatOutcome(outcome) {
  if (outcome === 'WIN' || outcome === 'LOSS') return outcome;
  return 'Avventer';
}

export default function History({ history }) {
  if (!history || history.length === 0) {
    return null;
  }

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th style={{ textAlign: 'left', padding: '8px 4px', borderBottom: '1px solid #ccc' }}>Tidspunkt</th>
          <th style={{ textAlign: 'left', padding: '8px 4px', borderBottom: '1px solid #ccc' }}>Strategi</th>
          <th style={{ textAlign: 'left', padding: '8px 4px', borderBottom: '1px solid #ccc' }}>Signal</th>
          <th style={{ textAlign: 'left', padding: '8px 4px', borderBottom: '1px solid #ccc' }}>Pris</th>
          <th style={{ textAlign: 'left', padding: '8px 4px', borderBottom: '1px solid #ccc' }}>Utfall</th>
        </tr>
      </thead>
      <tbody>
        {history.map((entry) => {
          const outcome = formatOutcome(entry.outcome);
          return (
            <tr key={entry.id}>
              <td style={{ padding: '8px 4px', borderBottom: '1px solid #eee' }}>
                {new Date(entry.timestamp * 1000).toLocaleString('nb-NO')}
              </td>
              <td style={{ padding: '8px 4px', borderBottom: '1px solid #eee' }}>{entry.strategy}</td>
              <td style={{ padding: '8px 4px', borderBottom: '1px solid #eee', color: signalColor(entry.signal) }}>
                {entry.signal}
              </td>
              <td style={{ padding: '8px 4px', borderBottom: '1px solid #eee' }}>
                {entry.price.toFixed(2)}
              </td>
              <td style={{ padding: '8px 4px', borderBottom: '1px solid #eee', color: outcomeColor(entry.outcome) }}>
                {outcome}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
