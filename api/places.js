export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return res.status(500).json({ error: 'API key not configured' });
  const { type, query, lat, lng, radius = '40000' } = req.query;
  try {
    if (type === 'geocode') {
      const r = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${key}`);
      const d = await r.json();
      if (d.results?.[0]) {
        const loc = d.results[0].geometry.location;
        return res.status(200).json({ lat: loc.lat, lng: loc.lng, display: d.results[0].formatted_address });
      }
      return res.status(404).json({ error: 'Not found' });
    }
    if (type === 'nearby') {
      const r = await fetch(`https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&keyword=car+wash&key=${key}`);
      const d = await r.json();
      const results = (d.results||[]).map(p => ({
        name: p.name, address: p.vicinity,
        lat: p.geometry.location.lat, lng: p.geometry.location.lng,
        rating: p.rating||null, reviewCount: p.user_ratings_total||0,
        placeId: p.place_id, website: '', phone: '', source: 'google'
      }));
      // Also fetch next page if token exists
      return res.status(200).json({ results, nextToken: d.next_page_token||null });
    }
    if (type === 'textsearch') {
      const r = await fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${key}`);
      const d = await r.json();
      const results = (d.results||[]).map(p => ({
        name: p.name, address: p.formatted_address,
        lat: p.geometry.location.lat, lng: p.geometry.location.lng,
        rating: p.rating||null, reviewCount: p.user_ratings_total||0,
        placeId: p.place_id, website: '', phone: '', source: 'google'
      }));
      return res.status(200).json({ results });
    }
    return res.status(400).json({ error: 'Invalid type' });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
