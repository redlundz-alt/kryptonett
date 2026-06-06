export default function Statistics({ statistics }) {
  if (!statistics || Object.keys(statistics).length === 0) {
    return null;
  }

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th style={{ textAlign: 'left', padding: '8px 4px', borderBottom: '1px solid #ccc' }}>Strategi</th>
          <th style={{ textAlign: 'left', padding: '8px 4px', borderBottom: '1px solid #ccc' }}>Totalt</th>
          <th style={{ textAlign: 'left', padding: '8px 4px', borderBottom: '1px solid #ccc' }}>Wins</th>
          <th style={{ textAlign: 'left', padding: '8px 4px', borderBottom: '1px solid #ccc' }}>Losses</th>
          <th style={{ textAlign: 'left', padding: '8px 4px', borderBottom: '1px solid #ccc' }}>Win rate</th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(statistics).map(([strategy, stats]) => (
          <tr key={strategy}>
            <td style={{ padding: '8px 4px', borderBottom: '1px solid #eee' }}>{strategy}</td>
            <td style={{ padding: '8px 4px', borderBottom: '1px solid #eee' }}>{stats.total}</td>
            <td style={{ padding: '8px 4px', borderBottom: '1px solid #eee' }}>{stats.wins}</td>
            <td style={{ padding: '8px 4px', borderBottom: '1px solid #eee' }}>{stats.losses}</td>
            <td style={{ padding: '8px 4px', borderBottom: '1px solid #eee' }}>
              {(stats.win_rate * 100).toFixed(1)}%
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
