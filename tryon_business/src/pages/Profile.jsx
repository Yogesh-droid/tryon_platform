import { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { getProfile, updateProfile } from '../api';

export default function Profile() {
  const { token } = useAuth();
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getProfile(token).then(setForm);
  }, [token]);

  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
    setSaved(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    await updateProfile(token, {
      name: form.name,
      owner_phone: form.owner_phone,
      owner_email: form.owner_email,
      free_trials_per_customer: form.free_trials_per_customer,
      charge_customer_per_generation: form.charge_customer_per_generation || null,
    });
    setSaved(true);
  };

  if (!form) return <p className="loading-text">Loading…</p>;

  return (
    <div>
      <h2 className="section-title">Profile</h2>
      <form onSubmit={handleSave} className="profile-form">
        <label>
          Shop name
          <input value={form.name} onChange={(e) => handleChange('name', e.target.value)} />
        </label>
        <label>
          Phone
          <input value={form.owner_phone} onChange={(e) => handleChange('owner_phone', e.target.value)} />
        </label>
        <label>
          Email
          <input value={form.owner_email} onChange={(e) => handleChange('owner_email', e.target.value)} />
        </label>
        <label>
          Free trials per customer
          <input type="number" min="0" value={form.free_trials_per_customer} onChange={(e) => handleChange('free_trials_per_customer', e.target.value)} />
        </label>
        <label>
          Charge your customers per try-on (₹, leave blank for free)
          <input type="number" min="0" step="0.01" value={form.charge_customer_per_generation || ''} onChange={(e) => handleChange('charge_customer_per_generation', e.target.value)} />
        </label>

        <div className="readonly-info">
          <p>Your link: <strong>/try/{form.slug}</strong></p>
          <p>Credit balance: <strong>₹{form.credit_balance}</strong> (top up with us directly)</p>
          <p>Cost per generation to you: <strong>₹{form.cost_per_generation}</strong></p>
        </div>

        <button type="submit">Save changes</button>
        {saved && <p className="saved-msg">Saved.</p>}
      </form>
    </div>
  );
}