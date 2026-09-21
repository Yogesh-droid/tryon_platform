export default function GarmentGrid({ garments, selectedId, onSelect }) {
  return (
    <div className="garment-picker">
      <div className="picker-heading"><span>Selected garment</span><small>Tap to change</small></div>
      <div className="garment-strip">
        {garments.map((g) => (
          <button key={g.id} className={`garment-item ${selectedId === g.id ? 'selected' : ''}`} onClick={() => onSelect(g.id)}>
            <img src={g.image} alt={g.name} /><span>{g.name}</span>{selectedId === g.id && <i>✓</i>}
          </button>
        ))}
      </div>
    </div>
  );
}