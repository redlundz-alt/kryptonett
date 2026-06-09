const cardStyle = {
  backgroundColor: '#fff',
  borderRadius: 8,
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)',
  padding: 16,
  color: '#333',
  textAlign: 'left',
  cursor: 'pointer',
  border: 'none',
  width: '100%',
};

const TOOLS = [
  {
    id: 'position-kalkulator',
    title: 'Position Size Kalkulator',
    description: 'Beregn riktig posisjonsstørrelse basert på kontostørrelse, risiko og stop loss',
  },
];

export default function Verktoy({ onNavigate }) {
  return (
    <div>
      <h1 style={{ margin: '0 0 16px', fontSize: 22 }}>Verktøy</h1>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
          gap: 16,
        }}
      >
        {TOOLS.map(({ id, title, description }) => (
          <button
            key={id}
            type="button"
            onClick={() => onNavigate(id)}
            style={cardStyle}
          >
            <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>{title}</h2>
            <p style={{ margin: 0, fontSize: 14, color: '#666', lineHeight: 1.5 }}>{description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
