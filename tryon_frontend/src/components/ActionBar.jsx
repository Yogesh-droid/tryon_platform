export default function ActionBar({ personPhoto, onPhotoChange, onGenerate, canGenerate, generating }) {
  return (
    <div className="action-bar">
      <div className="action-copy"><span className="action-step">1</span><div><strong>{personPhoto ? 'Selfie selected' : 'Add your selfie'}</strong><small>{personPhoto ? 'Ready to generate' : 'Camera or gallery'}</small></div></div>
      <div className="photo-actions">
        <label className="photo-option"><span>⌾</span> Camera<input type="file" accept="image/*" capture="user" onChange={(e) => onPhotoChange(e.target.files[0])} /></label>
        <label className="photo-option"><span>▧</span> Gallery<input type="file" accept="image/*" onChange={(e) => onPhotoChange(e.target.files[0])} /></label>
      </div>
      <button className="generate-btn" disabled={!canGenerate} onClick={onGenerate}>{generating ? 'Creating…' : 'Generate look  →'}</button>
    </div>
  );
}