/* eslint-disable */
export const displayMap = (locations) => {
  mapboxgl.accessToken = 'pk.eyJ1Ijoia2hpdHJ1a2hpbmEiLCJhIjoiY2x3aXpxZWE0MGMybzJrbGFtdGI2dWo4NCJ9.M61Gkh-SvGw3V81lnPL8Fw';
  const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/khitrukhina/clwizt8qs00nx01pna7hb32qb',
    scrollZoom: false,
    // center: [lng, lat],
    // zoom: 4
    // interactive: false
  });
  const bounds = new mapboxgl.LngLatBounds();
  locations.forEach(loc => {
    // create marker
    const el = document.createElement('div');
    el.className = 'marker';
    // add marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    }).setLngLat(loc.coordinates).addTo(map);
    // add popup
    new mapboxgl.Popup({
      offset: 30,
    }).setLngLat(loc.coordinates).setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`).addTo(map)
    // include current location
    bounds.extend(loc.coordinates);
    // move and zoom to markers initially
    map.fitBounds(bounds, {
      padding: { top: 200, bottom: 150, left: 100, right: 100 },
    });
  });
}
