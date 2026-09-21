import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../AuthContext';
import { getGarments, addGarment, patchGarment, deleteGarment } from '../api';

export default function Catalog() {
  const { token } = useAuth();
  const [garments, setGarments] = useState([]);
  const [selectedGarment, setSelectedGarment] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [file, setFile] = useState(null);
  const [file2, setFile2] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewUrl2, setPreviewUrl2] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const fileInputRef2 = useRef(null);

  const load = () => getGarments(token).then(setGarments).catch(() => setError('Could not load your catalog.'));

  useEffect(() => {
    getGarments(token).then(setGarments).catch(() => setError('Could not load your catalog.'));
  }, [token]);

  const openAdd = () => {
    setError('');
    setName('');
    setPrompt('');
    setFile(null);
    setFile2(null);
    setPreviewUrl('');
    setPreviewUrl2('');
    setShowAddForm(true);
  };

  const closeAdd = () => {
    setShowAddForm(false);
    setPreviewUrl('');
    setPreviewUrl2('');
  };

  const handleFileChange = (event) => {
    const nextFile = event.target.files?.[0];
    if (!nextFile) return;
    setFile(nextFile);
    setPreviewUrl(URL.createObjectURL(nextFile));
  };

  const handleFileChange2 = (event) => {
    const nextFile = event.target.files?.[0];
    if (!nextFile) return;
    setFile2(nextFile);
    setPreviewUrl2(URL.createObjectURL(nextFile));
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!name.trim() || !file) {
      setError('Add a garment name and image to continue.');
      return;
    }
    setIsSaving(true);
    setError('');
    try {
      await addGarment(token, name.trim(), file, prompt.trim(), file2);
      closeAdd();
      load();
    } catch {
      setError('The garment could not be added. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    if (!selectedGarment.name.trim()) return;
    setIsSaving(true);
    try {
      await patchGarment(token, selectedGarment.id, {
        name: selectedGarment.name.trim(),
        prompt: selectedGarment.prompt || '',
        is_active: selectedGarment.is_active,
      });
      setSelectedGarment(null);
      load();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedGarment || !window.confirm(`Remove ${selectedGarment.name} from your catalog?`)) return;
    setIsSaving(true);
    await deleteGarment(token, selectedGarment.id);
    setSelectedGarment(null);
    setIsSaving(false);
    load();
  };

  const handleModalKeyDown = (event) => {
    if (event.key === 'Escape') {
      setSelectedGarment(null);
      closeAdd();
    }
  };

  return (
    <div className="catalog-page">
      <div className="catalog-heading">
        <div>
          <p className="eyebrow">Your collection</p>
          <h2 className="page-title">Catalog</h2>
          <p className="page-intro">Manage the pieces customers can try on in your storefront.</p>
        </div>
        <button className="primary-button add-button" onClick={openAdd}><span>+</span> Add garment</button>
      </div>

      <div className="catalog-toolbar">
        <span>{garments.length} {garments.length === 1 ? 'piece' : 'pieces'} in your catalog</span>
        <span className="toolbar-note">Click a garment to edit</span>
      </div>

      {error && <p className="inline-error">{error}</p>}
      {garments.length === 0 ? (
        <button className="empty-catalog" onClick={openAdd}>
          <span className="empty-icon">+</span>
          <strong>Start your catalog</strong>
          <span>Add your first garment to make it available for virtual try-on.</span>
        </button>
      ) : (
        <div className="garment-grid">
          {garments.map((garment) => (
            <button
              className={`garment-card ${garment.is_active ? '' : 'is-inactive'}`}
              key={garment.id}
              onClick={() => setSelectedGarment(garment)}
            >
              <span className="garment-image-wrap">
                <img src={garment.image} alt={garment.name} />
                <span className={`status-pill ${garment.is_active ? '' : 'off'}`}>
                  {garment.is_active ? 'Live' : 'Hidden'}
                </span>
              </span>
              <span className="garment-card-footer">
                <span className="garment-card-name">{garment.name}</span>
                <span className="edit-mark">Edit <span aria-hidden="true">↗</span></span>
              </span>
            </button>
          ))}
          <button className="add-card" onClick={openAdd}>
            <span className="add-card-icon">+</span>
            <strong>Add another garment</strong>
            <span>Upload a new piece</span>
          </button>
        </div>
      )}

      {showAddForm && (
        <div className="modal-backdrop" onKeyDown={handleModalKeyDown} onClick={closeAdd} role="presentation">
          <form className="modal-card add-modal" onSubmit={handleAdd} onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div><p className="eyebrow">New addition</p><h3>Add a garment</h3></div>
              <button type="button" className="icon-button" onClick={closeAdd} aria-label="Close dialog">×</button>
            </div>
            <label className="field-label">Garment name<input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Linen wrap dress" /></label>
            <label className="field-label">Gemini Prompt (Optional)<textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="e.g. Drape this dress exactly like this..." style={{ width: '100%', padding: '8px', minHeight: '60px' }} /></label>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <button type="button" className={`upload-zone ${previewUrl ? 'has-preview' : ''}`} onClick={() => fileInputRef.current?.click()} style={{ minHeight: '120px' }}>
                  {previewUrl ? <img src={previewUrl} alt="New garment preview" /> : <><span className="upload-icon">↑</span><strong>Main Image</strong><span>Required</span></>}
                </button>
                <input ref={fileInputRef} className="visually-hidden" type="file" accept="image/*" onChange={handleFileChange} />
              </div>
              <div style={{ flex: 1 }}>
                <button type="button" className={`upload-zone ${previewUrl2 ? 'has-preview' : ''}`} onClick={() => fileInputRef2.current?.click()} style={{ minHeight: '120px' }}>
                  {previewUrl2 ? <img src={previewUrl2} alt="Second garment preview" /> : <><span className="upload-icon">↑</span><strong>Second Image</strong><span>Optional</span></>}
                </button>
                <input ref={fileInputRef2} className="visually-hidden" type="file" accept="image/*" onChange={handleFileChange2} />
              </div>
            </div>
            
            {error && <p className="inline-error">{error}</p>}
            <div className="modal-actions"><button type="button" className="secondary-button" onClick={closeAdd}>Cancel</button><button type="submit" className="primary-button" disabled={isSaving}>{isSaving ? 'Adding...' : 'Add to catalog'}</button></div>
          </form>
        </div>
      )}

      {selectedGarment && (
        <div className="modal-backdrop" onKeyDown={handleModalKeyDown} onClick={() => setSelectedGarment(null)} role="presentation">
          <form className="modal-card detail-modal" onSubmit={handleUpdate} onClick={(event) => event.stopPropagation()}>
            <div className="detail-image"><img src={selectedGarment.image} alt={selectedGarment.name} /></div>
            <div className="detail-content">
              <div className="modal-header"><div><p className="eyebrow">Garment details</p><h3>Edit piece</h3></div><button type="button" className="icon-button" onClick={() => setSelectedGarment(null)} aria-label="Close dialog">×</button></div>
              <label className="field-label">Name<input autoFocus value={selectedGarment.name} onChange={(event) => setSelectedGarment({ ...selectedGarment, name: event.target.value })} /></label>
              <label className="field-label">Gemini Prompt (Optional)<textarea value={selectedGarment.prompt || ''} onChange={(event) => setSelectedGarment({ ...selectedGarment, prompt: event.target.value })} style={{ width: '100%', padding: '8px', minHeight: '60px' }} /></label>
              <label className="visibility-row"><span><strong>Available for try-on</strong><small>Show this piece on your public storefront</small></span><input type="checkbox" checked={selectedGarment.is_active} onChange={(event) => setSelectedGarment({ ...selectedGarment, is_active: event.target.checked })} /></label>
              <div className="modal-actions"><button type="button" className="danger-button" onClick={handleDelete} disabled={isSaving}>Delete</button><button type="submit" className="primary-button" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save changes'}</button></div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}