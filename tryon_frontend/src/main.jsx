import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import TryOnPage from './pages/TryOnPage';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/try/:shopSlug/:garmentId?" element={<TryOnPage />} />
        <Route path="*" element={<div style={{ padding: 20 }}>Link not found.</div>} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);