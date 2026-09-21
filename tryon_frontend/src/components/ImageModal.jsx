import { useState } from 'react';

export default function ImageModal({ src, alt }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <img 
        src={src} 
        alt={alt} 
        onClick={() => setIsOpen(true)} 
        style={{ cursor: 'zoom-in', width: '100%', display: 'block', maxHeight: '66vh', objectFit: 'contain' }}
      />
      
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'zoom-out',
            padding: '20px'
          }}
        >
          <img 
            src={src} 
            alt={alt} 
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              borderRadius: '8px'
            }} 
          />
        </div>
      )}
    </>
  );
}
