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

  (data.releases || [])
    .filter(r => r.lyrics && r.lyrics.trim())
    .sort((a, b) => a.title.localeCompare(b.title))
    .forEach(r => {
      const item = document.createElement('a');
      item.href = `?song=${r.id}`;
      item.className = 'lyrics-list-item';
      item.innerHTML = `
        <img src="../${r.cover}" class="lyrics-list-cover" alt="${r.title}" loading="lazy">
        <div class="lyrics-list-info">
          <span class="lyrics-list-title">${r.title}</span>
          <span class="lyrics-song-meta">${r.type} · ${r.year}${r.songwriter !== 'Yusif Aliyev' ? ' · Cover' : ''}</span>
        </div>
        <i class="bi bi-chevron-right lyrics-list-chevron"></i>`;
      grid.appendChild(item);
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

  const spotifyBtn = r.spotify_url
    ? `<a href="${r.spotify_url}" target="_blank" rel="noreferrer" class="btn btn-sm lyrics-stream-btn lyrics-stream-spotify"><i class="bi bi-spotify me-1"></i>Spotify</a>`
    : '';
  const appleMusicBtn = r.apple_music_url
    ? `<a href="${r.apple_music_url}" target="_blank" rel="noreferrer" class="btn btn-sm lyrics-stream-btn lyrics-stream-apple"><i class="bi bi-apple me-1"></i>Apple Music</a>`
    : '';
  const youtubeMusicBtn = r.youtube_music_url
    ? `<a href="${r.youtube_music_url}" target="_blank" rel="noreferrer" class="btn btn-sm lyrics-stream-btn lyrics-stream-youtube"><i class="bi bi-youtube me-1"></i>YouTube Music</a>`
    : '';
  const streamBtns = (spotifyBtn || appleMusicBtn || youtubeMusicBtn)
    ? `<div class="d-flex flex-wrap gap-2 mt-3">${spotifyBtn}${appleMusicBtn}${youtubeMusicBtn}</div>`
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
        <div class="lyrics-song-header d-flex align-items-start gap-3 mb-5">
          <img src="../${r.cover}" alt="${r.title}" class="lyrics-song-cover">
          <div>
            <h1 class="h3 mb-1">${r.title}</h1>
            <p class="lyrics-song-meta mb-0">Joe in the Studio · ${r.year}</p>
            <p class="lyrics-song-meta" style="opacity:0.65;">Written by ${r.songwriter}</p>
            ${streamBtns}
          </div>
        </div>
        <div class="lyrics-text">${lyricsHtml}</div>
      </div>
    </div>`;
}
