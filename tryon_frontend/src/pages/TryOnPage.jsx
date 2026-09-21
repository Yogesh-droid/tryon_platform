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
      const jobId = await submitTryOn(shopSlug, personPhoto, selectedGarment);
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

  if (shopNotFound) {
    return (
      <div className="page">
        <p>This shop link isn't available. Please check with the store.</p>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="store-header">
        <div className="store-mark">R</div>
        <div><p className="store-kicker">Rita's Boutique</p><p className="store-location">Virtual fitting room</p></div>
      </header>

      {status === 'generating' && <div className="loading-state"><span className="loading-orbit" /><strong>Creating your look</strong><span>This usually takes a few seconds.</span></div>}
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