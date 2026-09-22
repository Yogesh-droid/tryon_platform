import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getGarments, submitTryOn, pollTryOnJob } from '../api';
import GarmentGrid from '../components/GarmentGrid';
import ActionBar from '../components/ActionBar';
import ResultReveal from '../components/ResultReveal';

export default function TryOnPage() {
  const { shopSlug, garmentId: pathGarmentId } = useParams();
  const [garments, setGarments] = useState([]);
  const [shopNotFound, setShopNotFound] = useState(false);
  const [selectedGarment, setSelectedGarment] = useState(null);
  const [personPhoto, setPersonPhoto] = useState(null);
  const [personPreview, setPersonPreview] = useState('');
  const [status, setStatus] = useState('idle'); // idle | generating | done | failed
  const [resultUrl, setResultUrl] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedSizeOverride, setSelectedSizeOverride] = useState('');
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [recentGarmentIds, setRecentGarmentIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`recent-tryons-${shopSlug}`)) || []; } catch { return []; }
  });

  useEffect(() => {
    getGarments(shopSlug).then((res) => {
      if (res.notFound) setShopNotFound(true);
      else {
        setGarments(res.garments);
        const requestedId = pathGarmentId || new URLSearchParams(window.location.search).get('garment');
        const requestedGarment = res.garments.find((garment) => String(garment.id) === requestedId);
        setSelectedGarment(requestedGarment?.id || res.garments[0]?.id || null);
      }
    });
  }, [shopSlug, pathGarmentId]);

  useEffect(() => {
    let timer;
    if (status === 'generating') {
      setTimeElapsed(0);
      timer = setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [status]);

  const canGenerate = selectedGarment && personPhoto && status !== 'generating';

  const handlePhotoChange = (file) => {
    if (!file) return;
    setPersonPhoto(file);
    setPersonPreview(URL.createObjectURL(file));
    setErrorMsg('');
  };

  const handleGenerate = async () => {
    setStatus('generating');
    setErrorMsg('');
    try {
      const { chest, shoulder } = getEstimatedMeasurements();
      const jobId = await submitTryOn(shopSlug, personPhoto, selectedGarment, activeSize, { chest, shoulder });
      pollJob(jobId);
    } catch (err) {
      setStatus('failed');
      setErrorMsg(err.message);
    }
  };

  const pollJob = (jobId) => {
    const interval = setInterval(async () => {
      const data = await pollTryOnJob(jobId);
      if (data.status === 'done') {
        clearInterval(interval);
        setResultUrl(data.result_image);
        setStatus('done');
        const updatedRecent = [selectedGarment, ...recentGarmentIds.filter((id) => id !== selectedGarment)].slice(0, 5);
        setRecentGarmentIds(updatedRecent);
        localStorage.setItem(`recent-tryons-${shopSlug}`, JSON.stringify(updatedRecent));
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
    setPersonPhoto(null);
    setPersonPreview('');
    setErrorMsg('');
  };

  
  const [sizeProfile, setSizeProfile] = useState(() => {
    try { return JSON.parse(localStorage.getItem('size-profile')) || { chest: '', shoulder: '', height: '', weight: '' }; } catch { return { chest: '', shoulder: '', height: '', weight: '' }; }
  });

  const updateSizeProfile = (field, val) => {
    const next = { ...sizeProfile, [field]: val };
    setSizeProfile(next);
    localStorage.setItem('size-profile', JSON.stringify(next));
  };

  const getEstimatedMeasurements = () => {
    let chest = parseFloat(sizeProfile.chest) || 0;
    let shoulder = parseFloat(sizeProfile.shoulder) || 0;
    
    // Fallback: Estimate from Height/Weight if explicit measurements are missing
    if (!chest) {
        const weight = parseFloat(sizeProfile.weight) || 0;
        if (weight > 0) {
            if (weight < 130) chest = 34;
            else if (weight < 150) chest = 38;
            else if (weight < 180) chest = 40;
            else if (weight < 210) chest = 44;
            else chest = 48;
        }
    }
    return { chest, shoulder };
  };

  const getRecommendedSize = () => {
    const garment = garments.find(g => g.id === selectedGarment);
    if (!garment || !garment.sizes_available || garment.sizes_available.length === 0) return null;
    
    const { chest, shoulder } = getEstimatedMeasurements();
    if (!chest && !shoulder) return null;
    
    const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
    const sortedSizes = [...garment.sizes_available].sort((a, b) => sizeOrder.indexOf(a) - sizeOrder.indexOf(b));

    for (const size of sortedSizes) {
      const measurements = garment.size_measurements?.[size];
      if (!measurements) continue;
      
      const gChest = parseFloat(measurements.chest) || 0;
      const gShoulder = parseFloat(measurements.shoulder) || 0;

      if ((!chest || gChest >= chest) && (!shoulder || gShoulder >= shoulder)) {
        return size;
      }
    }
    return sortedSizes[sortedSizes.length - 1];
  };

  const activeSize = selectedSizeOverride || getRecommendedSize();


  if (shopNotFound) {
    return (
      <div className="page">
        <p>This shop link isn't available. Please check with the store.</p>
      </div>
    );
  }

  const ESTIMATED_TIME = 25; // seconds
  const progressPercent = Math.min((timeElapsed / ESTIMATED_TIME) * 100, 95);

  return (
    <div className="page">
      <header className="store-header">
        <div className="store-mark">R</div>
        <div><p className="store-kicker">Rita's Boutique</p><p className="store-location">Virtual fitting room</p></div>
      </header>

      {status === 'generating' && (
        <div className="loading-state">
          <span className="loading-orbit" />
          <strong>Creating your look</strong>
          <span style={{ marginTop: '4px', fontSize: '14px', color: '#666' }}>
            {timeElapsed}s / ~{ESTIMATED_TIME}s estimated
          </span>
          <div style={{ width: '100%', maxWidth: '240px', height: '6px', background: '#e0e0e0', borderRadius: '4px', overflow: 'hidden', marginTop: '16px' }}>
            <div style={{ height: '100%', background: '#222', width: `${progressPercent}%`, transition: 'width 1s linear' }} />
          </div>
        </div>
      )}
      {status === 'done' && resultUrl && (
        <ResultReveal
          resultUrl={resultUrl}
          selectedGarment={garments.find((garment) => garment.id === selectedGarment)}
          similarGarments={garments.filter((garment) => garment.id !== selectedGarment)}
          recentGarmentIds={recentGarmentIds}
          onSelectGarment={(id) => { setSelectedGarment(id); reset(); }}
          onTryAnother={reset}
        />
      )}
      {status === 'failed' && <div className="error-state"><strong>We couldn't create that look.</strong><span>{errorMsg}</span><button onClick={() => setStatus('idle')}>Try again</button></div>}

      {status === 'idle' && <>
        <section className="tryon-intro">
          <p className="eyebrow">Your selected piece</p>
          <h1>See it on you.</h1>
          <p>Upload a selfie and we'll create a realistic preview of this look.</p>
        </section>

        <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
          <p style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 'bold' }}>Find your perfect fit (Optional)</p>
          <p style={{ margin: '0 0 15px 0', fontSize: '12px', color: '#555' }}>Enter height and weight, OR specific measurements.</p>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <label style={{ flex: 1, fontSize: '12px' }}>
              Height (ft/in)
              <input type="text" placeholder="e.g. 5'8" style={{ width: '100%', padding: '8px', marginTop: '4px', border: '1px solid #ccc', borderRadius: '4px' }} value={sizeProfile.height} onChange={(e) => updateSizeProfile('height', e.target.value)} />
            </label>
            <label style={{ flex: 1, fontSize: '12px' }}>
              Weight (lbs)
              <input type="number" placeholder="e.g. 150" style={{ width: '100%', padding: '8px', marginTop: '4px', border: '1px solid #ccc', borderRadius: '4px' }} value={sizeProfile.weight} onChange={(e) => updateSizeProfile('weight', e.target.value)} />
            </label>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <label style={{ flex: 1, fontSize: '12px' }}>
              Chest (in)
              <input type="number" placeholder="e.g. 38" style={{ width: '100%', padding: '8px', marginTop: '4px', border: '1px solid #ccc', borderRadius: '4px' }} value={sizeProfile.chest} onChange={(e) => updateSizeProfile('chest', e.target.value)} />
            </label>
            <label style={{ flex: 1, fontSize: '12px' }}>
              Shoulder (in)
              <input type="number" placeholder="e.g. 17" style={{ width: '100%', padding: '8px', marginTop: '4px', border: '1px solid #ccc', borderRadius: '4px' }} value={sizeProfile.shoulder} onChange={(e) => updateSizeProfile('shoulder', e.target.value)} />
            </label>
          </div>
          {getRecommendedSize() && (
            <div style={{ marginTop: '15px', padding: '10px', background: 'var(--coral)', color: 'white', borderRadius: '4px', fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
              ✨ Recommended Size: {getRecommendedSize()}
            </div>
          )}
          
          {(garments.find(g => g.id === selectedGarment)?.sizes_available?.length > 0) && (
            <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #ddd' }}>
               <p style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: 'bold' }}>Which size do you want to try on?</p>
               <div style={{ display: 'flex', gap: '8px' }}>
                 {garments.find(g => g.id === selectedGarment).sizes_available.map(sz => (
                    <button 
                      key={sz} 
                      onClick={() => setSelectedSizeOverride(sz)}
                      style={{ 
                        padding: '8px 16px', 
                        borderRadius: '20px', 
                        border: '1px solid',
                        borderColor: activeSize === sz ? 'var(--coral)' : '#ccc',
                        background: activeSize === sz ? 'var(--coral)' : 'transparent',
                        color: activeSize === sz ? 'white' : '#333',
                        fontWeight: activeSize === sz ? 'bold' : 'normal',
                        cursor: 'pointer'
                      }}
                    >
                      {sz}
                    </button>
                 ))}
               </div>
               <p style={{ margin: '10px 0 0 0', fontSize: '11px', color: '#666' }}>If you choose a larger size, the AI will simulate a looser fit!</p>
            </div>
          )}
        </div>

        <GarmentGrid garments={garments} selectedId={selectedGarment} onSelect={setSelectedGarment} />
        {personPreview && <div className="photo-preview"><img src={personPreview} alt="Your selected selfie" /><div><strong>Selfie ready</strong><span>{personPhoto.name}</span></div><button onClick={() => { setPersonPhoto(null); setPersonPreview(''); }} aria-label="Remove selfie">×</button></div>}
      </>}

      {status !== 'done' && (
        <ActionBar
          personPhoto={personPhoto}
          onPhotoChange={handlePhotoChange}
          onGenerate={handleGenerate}
          canGenerate={canGenerate}
          generating={status === 'generating'}
          selectedGarment={garments.find((garment) => garment.id === selectedGarment)}
        />
      )}
    </div>
  );
}