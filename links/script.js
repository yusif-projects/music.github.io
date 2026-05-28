import * as json from '../data/data.json' with { type: 'json' };
import releasesJson from '../data/releases.json' with { type: 'json' };

const data = { ...json.default, releases: releasesJson };
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

// Music section — releases with streaming links
const musicLinks = (data.releases || []).flatMap(r => {
  const items = [];
  if (r.spotify_url)     items.push({ name: `${r.title} on Spotify`,     url: r.spotify_url,     icon: 'bi-spotify'  });
  if (r.apple_music_url) items.push({ name: `${r.title} on Apple Music`, url: r.apple_music_url, icon: 'bi-music-note-beamed' });
  if (r.soundcloud_url)  items.push({ name: `${r.title} on SoundCloud`,  url: r.soundcloud_url,  icon: 'bi-soundwave' });
  return items;
});

if (musicLinks.length) {
  addLabel('Music');
  musicLinks.forEach(l => addLink(l.name, l.url, l.icon));
}

// Socials section
const socials = data.socials || [];
if (socials.length) {
  addLabel('Follow');
  socials.forEach(s => addLink(s.name, s.url, s.icon));
}
