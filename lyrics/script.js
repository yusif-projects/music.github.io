import * as json from '../data/data.json' with { type: 'json' };
import releasesJson from '../data/releases.json' with { type: 'json' };

const data = { ...json.default, releases: releasesJson };
const BASE = 'https://www.joeinthestudio.com';

document.getElementById('year').textContent = new Date().getFullYear();

const params = new URLSearchParams(window.location.search);
const songId = params.get('song');

if (songId) {
  showSong(songId);
} else {
  showHub();
}

function showHub() {
  const grid = document.getElementById('song-grid');

  (data.releases || []).forEach(r => {
    const col = document.createElement('div');
    col.className = 'col-sm-6 col-lg-4';
    col.innerHTML = `
      <a href="?song=${r.id}" class="lyrics-card-link">
        <div class="card h-100">
          <img src="../${r.cover}" class="card-img-top" alt="${r.title} cover" loading="lazy">
          <div class="card-body">
            <h5 class="card-title mb-1">${r.title}</h5>
            <span class="lyrics-song-meta">${r.type} · ${r.year}</span>
          </div>
        </div>
      </a>`;
    grid.appendChild(col);
  });
}

function showSong(id) {
  const r = (data.releases || []).find(r => r.id === id);

  if (!r) {
    document.getElementById('lyrics-hub').classList.remove('d-none');
    showHub();
    return;
  }

  // Update page metadata for SEO
  const title = `${r.title} Lyrics — Joe in the Studio`;
  const desc  = `Read the lyrics for "${r.title}" by Joe in the Studio (${r.year}).`;
  document.getElementById('page-title').textContent         = title;
  document.getElementById('page-desc').content             = desc;
  document.getElementById('og-title').content              = title;
  document.getElementById('og-desc').content               = desc;
  document.getElementById('page-canonical').href           = `${BASE}/lyrics/?song=${r.id}`;

  // Show song view, hide hub
  document.getElementById('lyrics-hub').classList.add('d-none');
  const view = document.getElementById('lyrics-view');
  view.classList.remove('d-none');

  const ytBtn = r.youtube_video_id
    ? `<a href="https://www.youtube.com/watch?v=${r.youtube_video_id}" target="_blank" rel="noreferrer" class="btn btn-accent me-2 mb-2"><i class="bi bi-youtube me-1"></i>Watch on YouTube</a>`
    : '';
  const scBtn = r.soundcloud_url
    ? `<a href="${r.soundcloud_url}" target="_blank" rel="noreferrer" class="btn btn-outline-light mb-2"><i class="bi bi-soundwave me-1"></i>Listen on SoundCloud</a>`
    : '';

  const lyricsHtml = (r.lyrics || 'Lyrics coming soon.')
    .split('\n\n')
    .map(block => {
      const lines = block.split('\n').map(l => `<span>${l}</span>`).join('\n');
      return `<p class="mb-4">${lines}</p>`;
    })
    .join('');

  document.getElementById('song-content').innerHTML = `
    <div class="row justify-content-center">
      <div class="col-lg-7 col-xl-6">
        <div class="d-flex align-items-center gap-3 mb-5">
          <img src="../${r.cover}" alt="${r.title}" style="width:72px; border-radius:8px; flex-shrink:0;">
          <div>
            <h1 class="h3 mb-0">${r.title}</h1>
            <p class="lyrics-song-meta mb-0">Joe in the Studio · ${r.year}</p>
          </div>
        </div>
        <div class="lyrics-text mb-5">${lyricsHtml}</div>
        <div>${ytBtn}${scBtn}</div>
      </div>
    </div>`;
}
