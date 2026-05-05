/* =========================================================
   True Cross Relic Geospatial Explorer — app.js
   ========================================================= */

'use strict';

// ── Colour palettes ──────────────────────────────────────────
const SHAPE_COLOURS = [
  '#e8734a','#c8973a','#a4c85a','#5ab8c8','#8a5ae8',
  '#e85a8a','#4ae87a','#e8c84a','#5a78e8','#c85a5a',
  '#7ae8c8','#e88a3a','#3ae8c8','#c83ae8','#78c85a',
  '#e84a5a','#5ac878','#8ac8e8','#e8a45a','#a45ae8',
];

const MATERIAL_COLOURS = [
  '#ffd700','#c0c0c0','#cd7f32','#b5e61d','#99d9ea',
  '#ff7f27','#e8734a','#7fc97f','#beaed4','#fdc086',
  '#a6cee3','#1f78b4','#b2df8a','#33a02c','#fb9a99',
  '#e31a1c','#fdbf6f','#ff7f00','#cab2d6','#6a3d9a',
];

const DEFAULT_COLOUR = '#c8973a';

// ── Map initialisation ───────────────────────────────────────
const map = L.map('map', {
  center: [46.5, 12.0],
  zoom: 5,
  zoomControl: true,
});

// Historic / no-border tile layer (Stamen Watercolor via Stadia — medieval-looking)
// Falls back to a clean light layer without modern boundaries
const tileLayer = L.tileLayer(
  'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png',
  {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, © <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19,
  }
);
tileLayer.addTo(map);

// ── State ────────────────────────────────────────────────────
let allRelics = [];
let activeMode = 'location';        // 'location' | 'shape' | 'material'
let selectedShapes = new Set();
let selectedMaterials = new Set();
let selectedCountries = new Set();
let yearRange = [1150, 1259];

let shapeColourMap = {};
let materialColourMap = {};

let clusterGroup = L.markerClusterGroup({
  chunkedLoading: true,
  maxClusterRadius: 40,
  spiderfyOnMaxZoom: true,
  showCoverageOnHover: false,
});
map.addLayer(clusterGroup);

// ── Load data ────────────────────────────────────────────────
fetch('relics.json')
  .then(r => r.json())
  .then(data => {
    allRelics = data;
    init();
  })
  .catch(err => {
    console.error('Failed to load relics.json:', err);
    document.getElementById('result-count-box').textContent =
      'Error loading data. Ensure relics.json is in the same folder.';
  });

// ── Init ─────────────────────────────────────────────────────
function init() {
  buildColourMaps();
  buildSlider();
  buildChecklistFor('shape', getUniqueValues('shape'), 'shape-list', 'shape-search', selectedShapes);
  buildChecklistFor('material', getUniqueValues('material'), 'material-list', 'material-search', selectedMaterials);
  buildChecklistFor('country', getUniqueValues('country'), 'country-list', 'country-search', selectedCountries);
  setupModeRadios();
  setupResetBtn();
  renderMarkers();
}

// ── Colour maps ──────────────────────────────────────────────
function buildColourMaps() {
  const shapes = getUniqueValues('shape');
  shapes.forEach((s, i) => { shapeColourMap[s] = SHAPE_COLOURS[i % SHAPE_COLOURS.length]; });

  const mats = getUniqueValues('material');
  mats.forEach((m, i) => { materialColourMap[m] = MATERIAL_COLOURS[i % MATERIAL_COLOURS.length]; });
}

function colourFor(relic) {
  if (activeMode === 'shape') return shapeColourMap[relic.shape] || DEFAULT_COLOUR;
  if (activeMode === 'material') return materialColourMap[relic.material] || DEFAULT_COLOUR;
  return DEFAULT_COLOUR;
}

// ── Unique values ────────────────────────────────────────────
function getUniqueValues(field) {
  const vals = allRelics
    .map(r => (r[field] || '').trim())
    .filter(Boolean);
  return [...new Set(vals)].sort((a, b) => a.localeCompare(b));
}

// ── Slider ───────────────────────────────────────────────────
function buildSlider() {
  const slider = document.getElementById('time-slider');
  noUiSlider.create(slider, {
    start: [1150, 1259],
    connect: true,
    range: { min: 1150, max: 1259 },
    step: 1,
    tooltips: [
      { to: v => v < 1190 ? 'c. ' + Math.round(v) : String(Math.round(v)),
        from: Number },
      { to: v => String(Math.round(v)), from: Number }
    ],
    format: { to: v => Math.round(v), from: Number }
  });

  const minLabel = document.getElementById('time-min-label');
  const maxLabel = document.getElementById('time-max-label');

  slider.noUiSlider.on('update', (values) => {
    yearRange = [parseInt(values[0]), parseInt(values[1])];
    minLabel.textContent = yearRange[0] < 1190 ? 'c. ' + yearRange[0] : yearRange[0];
    maxLabel.textContent = yearRange[1];
    renderMarkers();
  });
}

// ── Checklists ───────────────────────────────────────────────
function buildChecklistFor(type, values, listId, searchId, selectedSet) {
  const list = document.getElementById(listId);
  const search = document.getElementById(searchId);

  function render(filter = '') {
    list.innerHTML = '';
    values.forEach(val => {
      if (filter && !val.toLowerCase().includes(filter.toLowerCase())) return;
      const count = allRelics.filter(r => (r[type]||'').trim() === val).length;
      const label = document.createElement('label');
      label.className = 'check-label';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = selectedSet.has(val);
      cb.addEventListener('change', () => {
        if (cb.checked) selectedSet.add(val);
        else selectedSet.delete(val);
        renderMarkers();
        if (type === 'shape' || type === 'material') updateLegend();
      });
      const text = document.createTextNode(val);
      const badge = document.createElement('span');
      badge.className = 'check-count';
      badge.textContent = count;
      label.appendChild(cb);
      label.appendChild(text);
      label.appendChild(badge);
      list.appendChild(label);
    });
  }

  render();
  search.addEventListener('input', () => render(search.value));
}

// ── Mode radios ──────────────────────────────────────────────
function setupModeRadios() {
  document.querySelectorAll('input[name="mode"]').forEach(radio => {
    radio.addEventListener('change', () => {
      activeMode = radio.value;
      document.querySelectorAll('.radio-label').forEach(l => l.classList.remove('active-label'));
      radio.closest('.radio-label').classList.add('active-label');
      updateLegend();
      renderMarkers();
    });
  });
}

// ── Legend ───────────────────────────────────────────────────
function updateLegend() {
  const section = document.getElementById('legend-section');
  const legendList = document.getElementById('legend-list');

  if (activeMode === 'location') {
    section.style.display = 'none';
    return;
  }

  section.style.display = 'block';
  legendList.innerHTML = '';

  const colourMap = activeMode === 'shape' ? shapeColourMap : materialColourMap;
  const selected = activeMode === 'shape' ? selectedShapes : selectedMaterials;

  // Show active selection if any, else all
  const entries = Object.entries(colourMap).filter(([k]) => selected.size === 0 || selected.has(k));
  const shown = entries.slice(0, 20);

  shown.forEach(([label, colour]) => {
    const item = document.createElement('div');
    item.className = 'legend-item';
    const dot = document.createElement('div');
    dot.className = 'legend-dot';
    dot.style.background = colour;
    item.appendChild(dot);
    item.appendChild(document.createTextNode(label));
    legendList.appendChild(item);
  });

  if (entries.length > 20) {
    const more = document.createElement('div');
    more.style.cssText = 'font-size:10px;color:#6a5840;padding-top:4px;font-family:Arial,sans-serif;';
    more.textContent = `+ ${entries.length - 20} more…`;
    legendList.appendChild(more);
  }
}

// ── Filter relics ────────────────────────────────────────────
function filteredRelics() {
  return allRelics.filter(r => {
    // Must have coordinates
    if (r.lat == null || r.lon == null) return false;

    // Year filter
    const yr = r.year_numeric;
    if (yr != null) {
      if (yr < yearRange[0] || yr > yearRange[1]) return false;
    }

    // Shape filter
    if (selectedShapes.size > 0 && !selectedShapes.has((r.shape || '').trim())) return false;

    // Material filter
    if (selectedMaterials.size > 0 && !selectedMaterials.has((r.material || '').trim())) return false;

    // Country filter
    if (selectedCountries.size > 0 && !selectedCountries.has((r.country || '').trim())) return false;

    return true;
  });
}

// ── Render markers ───────────────────────────────────────────
function renderMarkers() {
  clusterGroup.clearLayers();

  const relics = filteredRelics();
  document.getElementById('result-count').textContent = relics.length;

  // Jitter duplicate coords
  const coordCount = {};
  relics.forEach(r => {
    const key = `${r.lat},${r.lon}`;
    coordCount[key] = (coordCount[key] || 0) + 1;
  });
  const coordIdx = {};

  relics.forEach(r => {
    const colour = colourFor(r);
    const key = `${r.lat},${r.lon}`;
    coordIdx[key] = (coordIdx[key] || 0) + 1;
    const total = coordCount[key];

    // Jitter if stacked
    let lat = r.lat, lon = r.lon;
    if (total > 1) {
      const angle = ((coordIdx[key] - 1) / total) * 2 * Math.PI;
      const radius = 0.08 * (1 + Math.floor((coordIdx[key] - 1) / total));
      lat += radius * Math.cos(angle);
      lon += radius * Math.sin(angle);
    }

    const size = 14;
    const icon = L.divIcon({
      className: '',
      html: `<div class="custom-dot" style="
        width:${size}px;height:${size}px;
        background:${colour};
        border:2px solid ${lighten(colour,40)};
        box-shadow: 0 0 6px rgba(0,0,0,0.5);
        border-radius:50%;
      "></div>`,
      iconSize: [size, size],
      iconAnchor: [size/2, size/2],
      popupAnchor: [0, -size/2],
    });

    const marker = L.marker([lat, lon], { icon });
    marker.bindPopup(buildPopupHTML(r), { maxWidth: 300 });
    marker.on('popupopen', () => {
      const btn = document.querySelector('.popup-detail-btn[data-id="' + r.id + '"]');
      if (btn) btn.addEventListener('click', () => showDetailPanel(r));
    });
    clusterGroup.addLayer(marker);
  });
}

// ── Popup HTML ───────────────────────────────────────────────
function buildPopupHTML(r) {
  const title = r.building || r.city || 'Unknown location';
  const loc = [r.city, r.country].filter(Boolean).join(', ');
  const year = r.year || '—';

  let chips = '';
  if (r.shape) chips += `<span class="popup-chip">✦ ${r.shape}</span>`;
  if (r.material) chips += `<span class="popup-chip">⚗ ${r.material}</span>`;

  return `
    <div>
      <div class="popup-title">${esc(title)}</div>
      <div class="popup-location">${esc(loc)} · ${esc(year)}</div>
      ${chips ? '<div style="margin-bottom:6px;">' + chips + '</div>' : ''}
      <button class="popup-detail-btn" data-id="${r.id}">View full record ›</button>
    </div>
  `;
}

// ── Detail panel ─────────────────────────────────────────────
function showDetailPanel(r) {
  const panel = document.getElementById('detail-panel');
  const content = document.getElementById('detail-content');

  const rows = [
    ['Year', r.year],
    ['Month / Day', [r.month, r.day].filter(Boolean).join(' ')],
    ['Building / Site', r.building],
    ['City / Diocese', r.city],
    ['Country / Region', r.country],
    ['Shape', r.shape],
    ['Material', r.material],
    ['People Mentioned', r.people],
    ['Other Notes', r.notes],
    ['Inscription', r.inscription],
  ].filter(([, v]) => v);

  let rowsHTML = rows.map(([label, val]) => `
    <div class="detail-row">
      <span class="detail-label">${esc(label)}</span>
      <span class="detail-value">${esc(val)}</span>
    </div>
  `).join('');

  const sourceHTML = r.source
    ? `<div class="detail-source"><strong>Source:</strong> ${esc(r.source)}</div>`
    : '';

  content.innerHTML = `
    <div class="detail-id">Catalogue no. ${esc(String(r.id || ''))}</div>
    <div class="detail-title">${esc(r.building || r.city || 'Unknown')}</div>
    <div class="detail-location">${esc([r.city, r.country].filter(Boolean).join(', '))}</div>
    <hr class="detail-divider">
    ${rowsHTML}
    ${sourceHTML}
  `;

  panel.classList.remove('hidden');
}

document.getElementById('detail-close').addEventListener('click', () => {
  document.getElementById('detail-panel').classList.add('hidden');
});

// ── Sidebar toggle ───────────────────────────────────────────
document.getElementById('sidebar-toggle').addEventListener('click', () => {
  const sb = document.getElementById('sidebar');
  const mp = document.getElementById('map');
  const openBtn = document.getElementById('sidebar-open-btn');
  sb.classList.add('collapsed');
  mp.classList.add('expanded');
  openBtn.style.display = 'flex';
  map.invalidateSize();
});

document.getElementById('sidebar-open-btn').addEventListener('click', () => {
  const sb = document.getElementById('sidebar');
  const mp = document.getElementById('map');
  const openBtn = document.getElementById('sidebar-open-btn');
  sb.classList.remove('collapsed');
  mp.classList.remove('expanded');
  openBtn.style.display = 'none';
  map.invalidateSize();
});

// ── Reset ────────────────────────────────────────────────────
function setupResetBtn() {
  document.getElementById('reset-btn').addEventListener('click', () => {
    // Reset slider
    document.getElementById('time-slider').noUiSlider.set([1150, 1259]);

    // Reset mode
    activeMode = 'location';
    document.querySelectorAll('input[name="mode"]').forEach(r => {
      r.checked = r.value === 'location';
      r.closest('.radio-label').classList.toggle('active-label', r.value === 'location');
    });

    // Clear all sets
    selectedShapes.clear();
    selectedMaterials.clear();
    selectedCountries.clear();

    // Uncheck all checkboxes
    document.querySelectorAll('.check-label input[type="checkbox"]').forEach(cb => {
      cb.checked = false;
    });

    // Clear searches
    ['shape-search','material-search','country-search'].forEach(id => {
      document.getElementById(id).value = '';
      document.getElementById(id).dispatchEvent(new Event('input'));
    });

    updateLegend();
    renderMarkers();
  });
}

// ── Helpers ──────────────────────────────────────────────────
function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function lighten(hex, amount) {
  const num = parseInt(hex.replace('#',''), 16);
  const r = Math.min(255, (num >> 16) + amount);
  const g = Math.min(255, ((num >> 8) & 0xff) + amount);
  const b = Math.min(255, (num & 0xff) + amount);
  return `rgb(${r},${g},${b})`;
}
