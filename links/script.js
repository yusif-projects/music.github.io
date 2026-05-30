import * as json from '../data/data.json' with { type: 'json' };

const data = json.default;
const list = document.getElementById('links-list');

function addLabel(text) {
  const p = document.createElement('p');
  p.className = 'links-section-label';
  p.textContent = text;
  list.appendChild(p);
}

function addLink(name, url, icon) {
  if (!url) return;
  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.rel = 'noreferrer noopener';
  a.className = 'links-link-btn';
  a.innerHTML = `<i class="bi ${icon || ''} me-2"></i>${name}`;
  list.appendChild(a);
}

// Platforms section — artist pages on streaming services
const platforms = data.platforms || [];
if (platforms.length) {
  addLabel('Listen On');
  platforms.forEach(p => addLink(p.name, p.url, p.icon));
}

// Socials section
const socials = data.socials || [];
if (socials.length) {
  addLabel('Follow');
  socials.forEach(s => addLink(s.name, s.url, s.icon));
}
