const fs = require('fs');
const geo = JSON.parse(fs.readFileSync('frontend/public/geojson/nepal-constituencies.geojson', 'utf-8'));

// Check all features for missing data
geo.features.forEach((f, i) => {
  const p = f.properties;
  if (p.DISTRICT === null || p.DISTRICT === '' || p.F_CONST === null || p.F_CONST === undefined) {
    console.log('Missing data at index', i, ':', JSON.stringify(p));
  }
});

// Check constituency_key duplicates
const keys = {};
geo.features.forEach((f, i) => {
  const k = f.properties.constituency_key;
  if (keys[k] !== undefined) console.log('Duplicate constituency_key:', k, 'at index', keys[k], 'and', i);
  keys[k] = i;
});

console.log('Total features:', geo.features.length);
console.log('Unique constituency_keys:', Object.keys(keys).length);

// Now check: is the official ECN source (results.election.gov.np) also showing 4?
// The user confirms yes. So this is a source data issue in the ECN GeoJSON.
// Kanchanpur-2 is a MultiPolygon with 2 parts. Let's see their sizes.
const k2 = geo.features.find(f => f.properties.DISTRICT === 'Kanchanpur' && f.properties.F_CONST === 2);
if (k2) {
  console.log('\nKanchanpur-2 geometry type:', k2.geometry.type);
  console.log('Parts:', k2.geometry.coordinates.length);
  k2.geometry.coordinates.forEach((poly, i) => {
    const pts = poly[0];
    // Approximate area using shoelace
    let area = 0;
    for (let j = 0; j < pts.length - 1; j++) {
      area += pts[j][0] * pts[j+1][1] - pts[j+1][0] * pts[j][1];
    }
    area = Math.abs(area) / 2;
    console.log('  Part', i, '- points:', pts.length, ', approx area (deg^2):', area.toFixed(6));
  });
}

// Check what's around that area - maybe the "4th" polygon is actually from a neighboring district
// that looks like it's part of Kanchanpur
// Kanchanpur bounds: lng 80.059 - 80.559, lat 28.552 - 29.137
// Check Dadeldhura-1 which is just north
const dad = geo.features.find(f => f.properties.DISTRICT === 'Dadeldhura' && f.properties.F_CONST === 1);
if (dad) {
  console.log('\nDadeldhura-1 geometry type:', dad.geometry.type);
  if (dad.geometry.type === 'MultiPolygon') {
    console.log('Parts:', dad.geometry.coordinates.length);
    dad.geometry.coordinates.forEach((poly, i) => {
      let minLng=999,maxLng=-999,minLat=999,maxLat=-999;
      poly[0].forEach(c => { if(c[0]<minLng)minLng=c[0]; if(c[0]>maxLng)maxLng=c[0]; if(c[1]<minLat)minLat=c[1]; if(c[1]>maxLat)maxLat=c[1]; });
      console.log('  Part', i, '- points:', poly[0].length, ', bounds: lng', minLng.toFixed(4), '-', maxLng.toFixed(4), ', lat', minLat.toFixed(4), '-', maxLat.toFixed(4));
    });
  }
}
