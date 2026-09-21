import { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { getProfile } from '../api';

export default function Overview() {
  const { token } = useAuth();
  const [shop, setShop] = useState(null);

  useEffect(() => {
    getProfile(token).then(setShop).catch(console.error);
  }, [token]);

  if (!shop) return <p className="loading-text">Loading…</p>;

  return (
    <div>
      <h2 className="section-title">{shop.name}</h2>
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
          <span className="stat-label">Free trials</span>
          <span className="stat-value">{shop.free_trials_per_customer}</span>
        </div>
      </div>
    </div>
  );
}