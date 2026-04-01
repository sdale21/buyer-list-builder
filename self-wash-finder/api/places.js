export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return res.status(500).json({ error: 'API key not configured' });
  const { type, query, lat, lng, radius = '8000', keyword } = req.query;
  try {
    if (type === 'mapskey') {
      return res.status(200).json({ key });
    }
    if (type === 'nearby') {
      const kw = keyword || 'self serve car wash';
      const r = await fetch(`https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&keyword=${encodeURIComponent(kw)}&key=${key}`);
      const d = await r.json();
      const results = (d.results || []).map(p => ({
        name: p.name,
        address: p.vicinity,
        lat: p.geometry.location.lat,
        lng: p.geometry.location.lng,
        rating: p.rating || null,
        reviewCount: p.user_ratings_total || 0,
        placeId: p.place_id,
        website: '',
        source: 'google'
      }));
      return res.status(200).json({ results });
    }
    if (type === 'details') {
      const { placeId } = req.query;
      const r = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=website,formatted_phone_number,url&key=${key}`);
      const d = await r.json();
      return res.status(200).json({
        website: d.result?.website || '',
        phone: d.result?.formatted_phone_number || '',
        url: d.result?.url || ''
      });
    }
    return res.status(400).json({ error: 'Invalid type' });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
