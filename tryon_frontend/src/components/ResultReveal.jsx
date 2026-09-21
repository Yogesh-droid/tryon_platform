export default function ResultReveal({ resultUrl, selectedGarment, similarGarments, recentGarmentIds, onSelectGarment, onTryAnother }) {
  const recent = recentGarmentIds.map((id) => similarGarments.find((garment) => garment.id === id)).filter(Boolean);
  const recommendations = [...recent, ...similarGarments.filter((garment) => !recentGarmentIds.includes(garment.id))].slice(0, 4);

  return (
    <div className="result-reveal">
      <div className="result-heading"><div><p className="eyebrow">Your try-on</p><h1>{selectedGarment?.name || 'Your new look'}</h1></div><button className="share-button" onClick={() => navigator.share?.({ title: 'My virtual try-on', url: resultUrl })}>↗ Share</button></div>
      <div className="result-image-wrap"><img src={resultUrl} alt="Your try-on result" /><span>AI preview</span></div>
      <button className="try-another" onClick={onTryAnother}>← Try another selfie</button>
      {recommendations.length > 0 && <section className="similar-section"><div className="similar-heading"><div><p className="eyebrow">Keep exploring</p><h2>More pieces you may like</h2></div><span>From this collection</span></div><div className="similar-grid">{recommendations.map((garment) => <button key={garment.id} onClick={() => onSelectGarment(garment.id)}><img src={garment.image} alt={garment.name} /><span>{garment.name}</span></button>)}</div></section>}
    </div>
  );
}