// --- tiny helpers ---
const $ = (sel, ctx=document) => ctx.querySelector(sel);
const el = (tag, opts={}) => Object.assign(document.createElement(tag), opts);

// Loads JSON from the inline <script id="site-data"> tag (works from file://)
function loadData() {
  const tag = document.getElementById('site-data');
  if (!tag || !tag.textContent) throw new Error('site-data script tag missing or empty');
  return JSON.parse(tag.textContent);
}

function renderCommon(data) {
  document.title = `${data.artist.name} — Official Site`;
  $('#brandName').textContent = data.artist.name;
  $('#footerArtist').textContent = data.artist.name;
  $('#year').textContent = new Date().getFullYear();
  $('#bio').textContent = data.artist.bio;
  const hi = $('#highlights');
  (data.artist.highlights || []).forEach(h => hi.appendChild(el('li', { textContent: '• ' + h })));
  $('#videoEmbed').src = data.artist.video_embed_url || '';
}

function renderHero(data) {
  const latestId = data.artist.hero?.latest_release_id;
  const latest = data.releases.find(r => r.id === latestId) || data.releases[0];
  if (!latest) return;
  $('#latestReleaseMeta').textContent = `${latest.title} • ${latest.year}`;
  const yt = $('#latestYouTube');
  if (yt) {
    yt.src = latest.youtube_video_id
      ? `https://www.youtube.com/embed/${latest.youtube_video_id}`
      : (data.artist.video_embed_url || '');
  }
}

function renderTracks(data) {
  const wrap = $('#tracks');
  if (!wrap) return;
  const allTracks = data.releases.flatMap(r => (r.tracks || []).map(t => ({ ...t, release: r })));
  allTracks.slice(0, 6).forEach(({ title, duration, release }) => {
    const col = el('div', { className: 'col-md-6 col-lg-4' });
    const ytBtn = release.youtube_video_id
      ? `<a class="btn btn-accent btn-sm mt-2" href="https://www.youtube.com/watch?v=${release.youtube_video_id}" target="_blank" rel="noreferrer"><i class="bi bi-youtube me-1"></i>Watch on YouTube</a>`
      : '';
    col.innerHTML = `
      <div class="card h-100">
        <img src="${release.cover}" class="card-img-top" alt="${release.title} cover" loading="lazy"/>
        <div class="card-body d-flex flex-column">
          <div class="d-flex justify-content-between align-items-center mb-1">
            <span class="small text-muted">${release.title} • ${release.year}</span>
            <span class="small chip">${release.type}</span>
          </div>
          <h5 class="card-title mb-1">${title}</h5>
          <div class="text-muted small mb-2">${duration || ''}</div>
          <div class="mt-auto">${ytBtn}</div>
        </div>
      </div>`;
    wrap.appendChild(col);
  });
}

function renderShows(data) {
  const wrap = $('#showsList');
  const noShows = $('#noShows');
  if (!wrap || !noShows) return;
  if (data.shows?.length) {
    noShows.style.display = 'none';
    data.shows.forEach(s => {
      const d = new Date(s.date + 'T00:00:00');
      const col = el('div', { className: 'col-md-6 col-lg-4' });
      col.innerHTML = `
        <div class="card h-100">
          <div class="card-body d-flex flex-column">
            <div class="d-flex justify-content-between">
              <div>
                <div class="fw-semibold">${s.city}</div>
                <div class="text-muted small">${s.venue}</div>
              </div>
              <div class="text-end">
                <div class="fw-semibold">${d.toLocaleDateString(undefined,{month:'short', day:'2-digit'})}</div>
                <div class="text-muted small">${d.getFullYear()}</div>
              </div>
            </div>
            <div class="mt-3 d-flex gap-2 align-items-center mt-auto">
              <span class="chip ${s.status==='On Sale' ? 'badge-soft' : ''}">${s.status}</span>
              ${s.ticket_url ? `<a class="btn btn-accent btn-sm ms-auto" href="${s.ticket_url}">Tickets</a>` : ''}
            </div>
          </div>
        </div>`;
      wrap.appendChild(col);
    });
  }
}

function renderReleases(data) {
  const wrap = $('#releases');
  data.releases.forEach(r => {
    const col = el('div', { className: 'col-md-6 col-lg-4' });
    col.innerHTML = `
      <div class="card h-100">
        <img src="${r.cover}" class="card-img-top" alt="${r.title} cover" loading="lazy"/>
        <div class="card-body d-flex flex-column">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <h5 class="card-title mb-0">${r.title}</h5>
            <span class="chip">${r.type} • ${r.year}</span>
          </div>
          <ul class="list-unstyled small mb-3">
            ${(r.tracks || []).map(t => `<li>• ${t.title} <span class="text-muted">${t.duration || ''}</span></li>`).join('')}
          </ul>
          <div class="mt-auto">
            ${r.youtube_video_id ? `<a class="btn btn-accent btn-sm" href="https://www.youtube.com/watch?v=${r.youtube_video_id}" target="_blank" rel="noreferrer"><i class="bi bi-youtube me-1"></i>Watch on YouTube</a>` : ''}
          </div>
        </div>
      </div>`;
    wrap.appendChild(col);
  });
}

function renderContactSocials(data) {
  const c = data.contacts;
  $('#contactInfo').innerHTML = `
    <div class="d-flex flex-column gap-2">
      <div><i class="bi bi-envelope me-2"></i><a class="link-muted" href="mailto:${c.email}">${c.email}</a></div>
      <div><i class="bi bi-person-badge me-2"></i>${c.manager}</div>
      <div><i class="bi bi-geo-alt me-2"></i>${c.location}</div>
    </div>`;
  const sWrap = $('#socials');
  (data.socials || []).forEach(s => {
    const a = el('a', { href: s.url, target: '_blank', rel: 'noreferrer', className: 'btn btn-outline-light btn-sm' });
    a.innerHTML = `<i class="bi ${s.icon} me-1"></i>${s.name}`;
    sWrap.appendChild(a);
  });
}

function renderYouTubeRecent(data) {
  const ids = data.youtube_videos || [];
  const grid = $('#ytGrid');
  const channelUrl = data.artist.channels?.youtube_channel_url || '#';
  const link = $('#youtubeChannelLink');
  if (link) link.href = channelUrl;
  ids.slice(0,6).forEach(id => {
    const col = el('div', { className: 'col-md-6 col-lg-4' });
    col.innerHTML = `
      <div class="card h-100">
        <div class="ratio ratio-16x9">
          <iframe src="https://www.youtube.com/embed/${id}" title="YouTube video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen loading="lazy"></iframe>
        </div>
      </div>`;
    grid.appendChild(col);
  });
}

function renderInstagram(data) {
  const posts = data.instagram_posts || [];
  const grid = $('#igGrid');
  const profile = data.artist.channels?.instagram_url || '#';
  const link = $('#instagramProfileLink');
  if (link) link.href = profile;
  posts.slice(0,6).forEach(url => {
    const col = el('div', { className: 'col-md-6 col-lg-4' });
    col.innerHTML = `
      <div class="card h-100">
        <blockquote class="instagram-media" data-instgrm-permalink="${url}" data-instgrm-version="14" style="margin:0 auto; width:100%;"></blockquote>
      </div>`;
    grid.appendChild(col);
  });
  if (window.instgrm && window.instgrm.Embeds) {
    window.instgrm.Embeds.process();
  }
}

// boot
(() => {
  try {
    const data = loadData();
    renderCommon(data);
    renderHero(data);
    renderTracks(data);
    renderShows(data);
    renderReleases(data);
    renderContactSocials(data);
    renderYouTubeRecent(data);
    renderInstagram(data);
  } catch (e) {
    console.error(e);
  }
})();
