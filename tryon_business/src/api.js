const API_BASE = 'http://127.0.0.1:8000/api';

function authHeaders(token, json = false) {
  const headers = { Authorization: `Token ${token}` };
  if (json) headers['Content-Type'] = 'application/json';
  return headers;
}

export async function login(username, password) {
  const res = await fetch(`${API_BASE}/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error('Incorrect username or password.');
  return data.token;
}

export async function getProfile(token) {
  const res = await fetch(`${API_BASE}/shop/profile/`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error('Failed to load profile.');
  return res.json();
}

export async function updateProfile(token, fields) {
  const res = await fetch(`${API_BASE}/shop/profile/`, {
    method: 'PATCH',
    headers: authHeaders(token, true),
    body: JSON.stringify(fields),
  });
  if (!res.ok) throw new Error('Failed to update profile.');
  return res.json();
}

export async function getGarments(token) {
  const res = await fetch(`${API_BASE}/shop/garments/`, { headers: authHeaders(token) });
  return res.json();
}

export async function addGarment(token, name, file, prompt = '', file2 = null) {
  const formData = new FormData();
  formData.append('name', name);
  formData.append('image', file);
  if (prompt) formData.append('prompt', prompt);
  if (file2) formData.append('image2', file2);
  
  const res = await fetch(`${API_BASE}/shop/garments/`, {
    method: 'POST',
    headers: authHeaders(token),
    body: formData,
  });
  return res.json();
}

export async function patchGarment(token, id, fields) {
  await fetch(`${API_BASE}/shop/garments/${id}/`, {
    method: 'PATCH',
    headers: authHeaders(token, true),
    body: JSON.stringify(fields),
  });
}

export async function deleteGarment(token, id) {
  await fetch(`${API_BASE}/shop/garments/${id}/`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
}