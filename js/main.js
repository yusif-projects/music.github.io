// --- tiny helpers ---
const $ = (sel, ctx=document) => ctx.querySelector(sel);
const el = (tag, opts={}) => Object.assign(document.createElement(tag), opts);

// Load JSON (same-origin). Use a local server when developing.
async function loadData() {
  const res = await fetch('data/site-data.json', { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load site-data.json');
  return res.json();
}

function renderCommon(data) {
  document.title = `${data.artist.name} — Official Site`;
  $('#brandName').textContent = data.artist.name;
  $('#footerArtist').textContent = data.artist.name;
  $('#year').textContent = new Date().getFullYear();
  $('#bio').textContent = data.artist.bio;
  const hi = $('#highlights');
  (data.artist.highlights || []).forEach(h => hi.appendChild(el('li', { textContent: '• ' + h })));
  $('#videoEmbed').src = data.artist.video_embed_url;
}

function renderHero(data) {
  const latestId = data.artist.hero?.latest_release_id;
  const latest = data.releases.find(r => r.id === latestId) || data.releases[0];
  if (!latest) return;
  $('#latestReleaseMeta').textContent = `${latest.title} • ${latest.year}`;
  const player = $('#latestPlayer');
  player.src = latest.audio_url || latest.tracks?.[0]?.audio_url || '';
  const platWrap = $('#latestPlatforms');
  (latest.platforms || []).forEach(p => {
    const a = el('a', { href: p.url, target: '_blank', rel: 'noreferrer', className: 'chip link-muted' });
    a.innerHTML = `<i class="bi bi-box-arrow-up-right me-1"></i>${p.name}`;
    platWrap.appendChild(a);
  });
}

function renderTracks(data) {
  const wrap = $('#tracks');
  const allTracks = data.releases.flatMap(r => (r.tracks || []).map(t => ({ ...t, release: r })));
  allTracks.slice(0, 6).forEach(({ title, duration, audio_url, release }) => {
    const col = el('div', { className: 'col-md-6 col-lg-4' });
    col.innerHTML = `
      <div class="card h-100">
        <img src="${release.cover}" class="card-img-top" alt="${release.title} cover" loading="lazy"/>
        <div class="card-body d-flex flex-column">
          <div class="d-flex justify-content-between align-items-center mb-1">
            <span class="small text-muted">${release.title} • ${release.year}</span>
            <span class="small chip">${release.type}</span>
          </div>
          <h5 class="card-title mb-2">${title}</h5>
          <audio controls preload="none" class="mt-auto"></audio>
        </div>
      </div>`;
    col.querySelector('audio').src = audio_url || '';
    wrap.appendChild(col);
  });
}

function renderShows(data) {
  const wrap = $('#showsList');
  const noShows = $('#noShows');
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
          <div class="mt-auto d-flex gap-2 flex-wrap">
            ${(r.platforms || []).map(p => `<a class="chip link-muted" href="${p.url}" target="_blank" rel="noreferrer"><i class="bi bi-box-arrow-up-right me-1"></i>${p.name}</a>`).join('')}
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

// boot
(async () => {
  try {
    const data = await loadData();
    renderCommon(data);
    renderHero(data);
    renderTracks(data);
    renderShows(data);
    renderReleases(data);
    renderContactSocials(data);
  } catch (e) {
    console.error(e);
  }
})();