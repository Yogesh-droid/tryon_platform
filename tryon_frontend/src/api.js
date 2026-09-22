const API_BASE = 'http://127.0.0.1:8000/api';

export async function getGarments(shopSlug) {
  const res = await fetch(`${API_BASE}/shops/${shopSlug}/garments/`);
  if (res.status === 404) return { notFound: true };
  const data = await res.json();
  const baseUrl = API_BASE.replace('/api', '');
  data.forEach(g => {
    if (g.image && g.image.startsWith('/')) {
      g.image = baseUrl + g.image;
    }
  });
  return { garments: data };
}

export async function submitTryOn(shopSlug, personImage, garmentId, selectedSize = '', userMeasurements = {}) {
  const formData = new FormData();
  formData.append('person_image', personImage);
  formData.append('garment', garmentId);
  if (selectedSize) formData.append('selected_size', selectedSize);
  if (Object.keys(userMeasurements).length > 0) {
    formData.append('user_measurements', JSON.stringify(userMeasurements));
  }

  const res = await fetch(`${API_BASE}/shops/${shopSlug}/tryon/`, {
    method: 'POST',
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error('Something went wrong. Please try again.');
  return data.id;
}

export async function pollTryOnJob(jobId) {
  const res = await fetch(`${API_BASE}/tryon/${jobId}/`);
  const data = await res.json();
  const baseUrl = API_BASE.replace('/api', '');
  if (data.result_image && data.result_image.startsWith('/')) {
    data.result_image = baseUrl + data.result_image;
  }
  return data;
}