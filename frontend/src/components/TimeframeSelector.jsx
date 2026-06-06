const TIMEFRAMES = [
  { value: '15m', label: '15m' },
  { value: '1h', label: '1H' },
  { value: '4h', label: '4H' },
  { value: '1d', label: '1D' },
];

export default function TimeframeSelector({ selectedTimeframe, onSelect }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
      {TIMEFRAMES.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          onClick={() => onSelect(value)}
          style={{
            padding: '8px 16px',
            border: selectedTimeframe === value ? '2px solid #333' : '1px solid #ccc',
            borderRadius: 4,
            backgroundColor: selectedTimeframe === value ? '#333' : '#fff',
            color: selectedTimeframe === value ? '#fff' : '#333',
            fontWeight: selectedTimeframe === value ? 'bold' : 'normal',
            cursor: 'pointer',
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
