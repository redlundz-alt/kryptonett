export default function StrategySelector({ strategies, selected, onChange }) {
  function toggleStrategy(id) {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
      {strategies.map(({ id, name }) => (
        <label key={id} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={selected.includes(id)}
            onChange={() => toggleStrategy(id)}
          />
          {name}
        </label>
      ))}
    </div>
  );
}
