import { useState, useEffect } from 'react';
import './App.css';

const API_BASE = 'http://127.0.0.1:8000/api';

function App() {
  const [token, setToken] = useState(localStorage.getItem('shop_token'));
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [shop, setShop] = useState(null);
  const [garments, setGarments] = useState([]);
  const [newGarmentName, setNewGarmentName] = useState('');
  const [newGarmentFile, setNewGarmentFile] = useState(null);

  useEffect(() => {
    if (token) {
      loadDashboard();
      loadGarments();
    }
  }, [token]);

  const loadDashboard = async () => {
    const res = await fetch(`${API_BASE}/shop/dashboard/`, {
      headers: { Authorization: `Token ${token}` },
    });
    if (res.ok) setShop(await res.json());
  };

  const loadGarments = async () => {
    const res = await fetch(`${API_BASE}/shop/garments/`, {
      headers: { Authorization: `Token ${token}` },
    });
    if (res.ok) setGarments(await res.json());
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    const res = await fetch(`${API_BASE}/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setLoginError('Invalid username or password.');
      return;
    }
    localStorage.setItem('shop_token', data.token);
    setToken(data.token);
  };

  const handleLogout = () => {
    localStorage.removeItem('shop_token');
    setToken(null);
    setShop(null);
  };

  const handleAddGarment = async (e) => {
    e.preventDefault();
    if (!newGarmentName || !newGarmentFile) return;

    const formData = new FormData();
    formData.append('name', newGarmentName);
    formData.append('image', newGarmentFile);

    const res = await fetch(`${API_BASE}/shop/garments/`, {
      method: 'POST',
      headers: { Authorization: `Token ${token}` },
      body: formData,
    });
    if (res.ok) {
      setNewGarmentName('');
      setNewGarmentFile(null);
      loadGarments();
    }
  };

  const toggleGarmentActive = async (garment) => {
    await fetch(`${API_BASE}/shop/garments/${garment.id}/`, {
      method: 'PATCH',
      headers: {
        Authorization: `Token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ is_active: !garment.is_active }),
    });
    loadGarments();
  };

  const deleteGarment = async (garmentId) => {
    await fetch(`${API_BASE}/shop/garments/${garmentId}/`, {
      method: 'DELETE',
      headers: { Authorization: `Token ${token}` },
    });
    loadGarments();
  };

  if (!token) {
    return (
      <div className="login-page">
        <h1 className="brand">Panel</h1>
        <form onSubmit={handleLogin} className="login-form">
          <input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit">Log in</button>
          {loginError && <p className="error">{loginError}</p>}
        </form>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dash-header">
        <h1 className="brand">{shop?.name || 'Loading…'}</h1>
        <button className="logout" onClick={handleLogout}>Log out</button>
      </header>

      {shop && (
        <div className="stats-row">
          <div className="stat">
            <span className="stat-label">Credit balance</span>
            <span className="stat-value">₹{shop.credit_balance}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Cost per generation</span>
            <span className="stat-value">₹{shop.cost_per_generation}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Free trials/customer</span>
            <span className="stat-value">{shop.free_trials_per_customer}</span>
          </div>
        </div>
      )}

      <section className="catalog-section">
        <h2>Your catalog</h2>
        <div className="garment-list">
          {garments.map((g) => (
            <div key={g.id} className="garment-row">
              <img src={g.image} alt={g.name} />
              <span className="garment-row-name">{g.name}</span>
              <button onClick={() => toggleGarmentActive(g)}>
                {g.is_active ? 'Hide' : 'Show'}
              </button>
              <button className="delete" onClick={() => deleteGarment(g.id)}>Delete</button>
            </div>
          ))}
        </div>

        <form onSubmit={handleAddGarment} className="add-garment-form">
          <input
            placeholder="Garment name"
            value={newGarmentName}
            onChange={(e) => setNewGarmentName(e.target.value)}
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setNewGarmentFile(e.target.files[0])}
          />
          <button type="submit">Add to catalog</button>
        </form>
      </section>
    </div>
  );
}

export default App;