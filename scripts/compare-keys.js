const fs = require('fs');

// Read GeoJSON
const geo = JSON.parse(fs.readFileSync('frontend/public/geojson/nepal-constituencies.geojson', 'utf-8'));

const ECN = {
  chitawan: 'chitwan', kabhrepalanchok: 'kavrepalanchok', kapilbastu: 'kapilvastu',
  makawanpur: 'makwanpur', tanahu: 'tanahun',
  nawalparasi_w: 'nawalparasi west', 'nawalparasi_w.': 'nawalparasi west',
  nawalparasi_e: 'nawalparasi east', 'nawalparasi_e.': 'nawalparasi east',
  rukum_w: 'rukum west', 'rukum_w.': 'rukum west',
  rukum_e: 'rukum east', 'rukum_e.': 'rukum east',
};

const geoKeys = new Set(geo.features.map(f => {
  const p = f.properties || {};
  const dist = (p.DISTRICT || '').toLowerCase().trim();
  return (ECN[dist] || dist) + '-' + p.F_CONST;
}));

// Read API keys from file
const apiKeys = fs.readFileSync('scripts/api-keys.txt', 'utf-8').trim().split('\n').map(s => s.trim());
const apiSet = new Set(apiKeys);

const inGeoNotApi = [...geoKeys].filter(k => !apiSet.has(k)).sort();
const inApiNotGeo = apiKeys.filter(k => !geoKeys.has(k)).sort();

console.log('GeoJSON keys:', geoKeys.size);
console.log('API keys:', apiSet.size);
console.log('\nIn GeoJSON but NOT in API (' + inGeoNotApi.length + '):');
inGeoNotApi.forEach(k => console.log('  ' + k));
console.log('\nIn API but NOT in GeoJSON (' + inApiNotGeo.length + '):');
inApiNotGeo.forEach(k => console.log('  ' + k));
