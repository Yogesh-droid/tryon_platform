import { useState, useEffect } from 'react';
import './App.css';

const API_BASE = 'http://127.0.0.1:8000/api';
const SHOP_SLUG = 'test-boutique';

function App() {
  const [garments, setGarments] = useState([]);
  const [selectedGarment, setSelectedGarment] = useState(null);
  const [personPhoto, setPersonPhoto] = useState(null);
  const [status, setStatus] = useState('idle');
  const [resultUrl, setResultUrl] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetch(`${API_BASE}/shops/${SHOP_SLUG}/garments/`)
      .then((res) => res.json())
      .then(setGarments)
      .catch((err) => console.error('Failed to load garments', err));
  }, []);

  const canGenerate = selectedGarment && personPhoto && status !== 'generating';

  const handleGenerate = async () => {
    setStatus('generating');
    setErrorMsg('');

    const formData = new FormData();
    formData.append('person_image', personPhoto);
    formData.append('garment', selectedGarment);

    const submitRes = await fetch(`${API_BASE}/shops/${SHOP_SLUG}/tryon/`, {
      method: 'POST',
      body: formData,
    });
    const submitData = await submitRes.json();

    if (!submitRes.ok) {
      setStatus('failed');
      setErrorMsg('Something went wrong. Please try again.');
      return;
    }
    pollJob(submitData.id);
  };

  const pollJob = (jobId) => {
    const interval = setInterval(async () => {
      const res = await fetch(`${API_BASE}/tryon/${jobId}/`);
      const data = await res.json();

      if (data.status === 'done') {
        clearInterval(interval);
        setResultUrl(data.result_image);
        setStatus('done');
      } else if (data.status === 'failed') {
        clearInterval(interval);
        setErrorMsg(data.error_message || 'Generation failed. Please try again.');
        setStatus('failed');
      }
    }, 2000);
  };

  const reset = () => {
    setStatus('idle');
    setResultUrl(null);
    setSelectedGarment(null);
    setPersonPhoto(null);
  };

  return (
    <div className="page">
      <h1 className="shop-name">Rita's Boutique</h1>
      <p className="tagline">Pick something, see it on you.</p>

      {status === 'generating' && (
        <div className="loading-state">Generating your try-on…</div>
      )}

      {status === 'done' && resultUrl && (
        <div className="result-reveal">
          <img src={resultUrl} alt="Your try-on result" />
          <button className="try-another" onClick={reset}>Try another piece</button>
        </div>
      )}

      {status === 'failed' && (
        <div className="error-state">{errorMsg}</div>
      )}

      {(status === 'idle') && (
        <div className="garment-grid">
          {garments.map((g) => (
            <div key={g.id}>
              <div
                className={`garment-item ${selectedGarment === g.id ? 'selected' : ''}`}
                onClick={() => setSelectedGarment(g.id)}
              >
                <img src={g.image} alt={g.name} />
              </div>
              <div className="garment-name">{g.name}</div>
            </div>
          ))}
        </div>
      )}

      {status !== 'done' && (
        <div className="action-bar">
          <label className="photo-input-label">
            {personPhoto ? personPhoto.name : 'Add your photo'}
            <input
              type="file"
              accept="image/*"
              capture="user"
              onChange={(e) => setPersonPhoto(e.target.files[0])}
            />
          </label>
          <button className="generate-btn" disabled={!canGenerate} onClick={handleGenerate}>
            {status === 'generating' ? 'Generating…' : 'Try it on'}
          </button>
        </div>
      )}
    </div>
  );
}

export default App;