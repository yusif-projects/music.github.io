// --- tiny helpers ---
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const el = (tag, opts = {}) => Object.assign(document.createElement(tag), opts);

// Loads JSON from the inline <script id="site-data"> tag (works from file://)
function loadData() {
  const tag = document.getElementById('site-data');
  if (!tag || !tag.textContent) throw new Error('site-data script tag missing or empty');
  return JSON.parse(tag.textContent);
}

function renderCommon(data) {
  document.title = `${data.artist.name} — Official Site`;

  const brand = $('#brandName');
  if (brand) brand.textContent = data.artist.name;

  const foot = $('#footerArtist');
  if (foot) foot.textContent = data.artist.name;

  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  const bio = $('#bio');
  if (bio) bio.textContent = data.artist.bio;

  const hi = $('#highlights');
  if (hi) {
    hi.innerHTML = '';
    (data.artist.highlights || []).forEach(h =>
      hi.appendChild(el('li', { textContent: '• ' + h }))
    );
  }

  // Only set if the old About iframe still exists
  const video = $('#videoEmbed');
  if (video) video.src = data.artist.video_embed_url || '';
}

function renderHero(data) {
  const latestId = data.artist.hero?.latest_release_id;
  const latest = data.releases.find(r => r.id === latestId) || data.releases[0];
  if (!latest) return;

  const meta = $('#latestReleaseMeta');
  if (meta) meta.textContent = `${latest.title} • ${latest.year}`;

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
  wrap.innerHTML = '';

  allTracks.slice(0, 6).forEach(({ title, duration, release }) => {
    const col = el('div', { className: 'col-md-6 col-lg-4' });

    const ytBtn = release.youtube_video_id
      ? `<a class="btn btn-accent btn-sm mt-2 me-2" href="https://www.youtube.com/watch?v=${release.youtube_video_id}" target="_blank" rel="noreferrer"><i class="bi bi-youtube me-1"></i>YouTube</a>`
      : '';

    const scBtn = release.soundcloud_url
      ? `<a class="btn btn-outline-light btn-sm mt-2" href="${release.soundcloud_url}" target="_blank" rel="noreferrer"><i class="bi bi-soundwave me-1"></i>SoundCloud</a>`
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
          <div class="mt-auto d-flex flex-wrap gap-2">
            ${ytBtn}
            ${scBtn}
          </div>
        </div>
      </div>`;
    wrap.appendChild(col);
  });
}

function renderShows(data) {
  const wrap = $('#showsList');
  const noShows = $('#noShows');
  if (!wrap || !noShows) return;

  wrap.innerHTML = '';
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
                <div class="fw-semibold">${d.toLocaleDateString(undefined, { month: 'short', day: '2-digit' })}</div>
                <div class="text-muted small">${d.getFullYear()}</div>
              </div>
            </div>
            <div class="mt-3 d-flex gap-2 align-items-center mt-auto">
              <span class="chip ${s.status === 'On Sale' ? 'badge-soft' : ''}">${s.status}</span>
              ${s.ticket_url ? `<a class="btn btn-accent btn-sm ms-auto" href="${s.ticket_url}">Tickets</a>` : ''}
            </div>
          </div>
        </div>`;
      wrap.appendChild(col);
    });
  } else {
    noShows.style.display = '';
  }
}

function renderReleases(data) {
  const wrap = $('#releases');
  if (!wrap) return;

  wrap.innerHTML = '';
  data.releases.forEach(r => {
    const ytBtn = r.youtube_video_id
      ? `<a class="btn btn-accent btn-sm me-2" href="https://www.youtube.com/watch?v=${r.youtube_video_id}" target="_blank" rel="noreferrer"><i class="bi bi-youtube me-1"></i>YouTube</a>`
      : '';

    const scBtn = r.soundcloud_url
      ? `<a class="btn btn-outline-light btn-sm" href="${r.soundcloud_url}" target="_blank" rel="noreferrer"><i class="bi bi-soundwave me-1"></i>SoundCloud</a>`
      : '';

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
          <div class="mt-auto d-flex flex-wrap gap-2">
            ${ytBtn}
            ${scBtn}
          </div>
        </div>
      </div>`;
    wrap.appendChild(col);
  });
}

function renderContactSocials(data) {
  const c = data.contacts || {};
  const info = $('#contactInfo');
  if (info) {
    info.innerHTML = `
      <div class="d-flex flex-column gap-2">
        <div><i class="bi bi-envelope me-2"></i><a class="link-muted" href="mailto:${c.email || ''}">${c.email || ''}</a></div>
        <div><i class="bi bi-person-badge me-2"></i>${c.manager || ''}</div>
        <div><i class="bi bi-geo-alt me-2"></i>${c.location || ''}</div>
      </div>`;
  }

  const sWrap = $('#socials');
  if (sWrap) {
    sWrap.innerHTML = '';
    (data.socials || []).forEach(s => {
      const a = el('a', { href: s.url, target: '_blank', rel: 'noreferrer', className: 'btn btn-outline-light btn-sm' });
      a.innerHTML = `<i class="bi ${s.icon} me-1"></i>${s.name}`;
      sWrap.appendChild(a);
    });
  }
}

function renderYouTubeRecent(data) {
  const grid = $('#ytGrid');
  if (!grid) return;

  grid.innerHTML = '';
  const ids = data.youtube_videos || data.youtube_recent || [];
  const channelUrl = data.artist.channels?.youtube_channel_url || '#';
  const link = $('#youtubeChannelLink');
  if (link) link.href = channelUrl;

  ids.slice(0, 6).forEach(id => {
    const col = el('div', { className: 'col-md-6 col-lg-4' });
    col.innerHTML = `
      <div class="card h-100">
        <div class="ratio ratio-16x9">
          <iframe src="https://www.youtube.com/embed/${id}" title="YouTube video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen loading="lazy"></iframe>
        </div>
      </div>`;
    grid.appendChild(col);
  });
}

function renderInstagram(data) {
  const grid = $('#igGrid');
  if (!grid) return;

  grid.innerHTML = '';
  const posts = data.instagram_posts || [];
  const profile = data.artist.channels?.instagram_url || '#';
  const link = $('#instagramProfileLink');
  if (link) link.href = profile;

  posts.slice(0, 6).forEach(url => {
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

function renderAboutCarousel(data) {
  const carousel = document.getElementById('aboutCarousel');
  if (!carousel) return;

  const inner = carousel.querySelector('.carousel-inner');
  const indicators = carousel.querySelector('.carousel-indicators');
  if (!inner) return;

  const photos = (data.artist.about_photos || []).filter(Boolean);
  inner.innerHTML = '';
  if (indicators) indicators.innerHTML = '';

  // If no photos, hide controls/indicators and bail gracefully
  if (!photos.length) {
    carousel.querySelector('.carousel-control-prev')?.classList.add('d-none');
    carousel.querySelector('.carousel-control-next')?.classList.add('d-none');
    indicators?.classList.add('d-none');
    return;
  }

  photos.forEach((src, i) => {
    // slide
    const item = el('div', { className: `carousel-item h-100${i === 0 ? ' active' : ''}` });
    item.innerHTML = `
      <img src="${src}" class="d-block w-100 h-100 object-cover" alt="About photo ${i + 1}" loading="lazy">
    `;
    inner.appendChild(item);

    // dot
    if (indicators) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.setAttribute('data-bs-target', '#aboutCarousel');
      btn.setAttribute('data-bs-slide-to', String(i));
      btn.setAttribute('aria-label', `Slide ${i + 1}`);
      if (i === 0) {
        btn.className = 'active';
        btn.setAttribute('aria-current', 'true');
      }
      indicators.appendChild(btn);
    }
  });

  // Hide controls if only one image
  const single = photos.length === 1;
  carousel.querySelector('.carousel-control-prev')?.classList.toggle('d-none', single);
  carousel.querySelector('.carousel-control-next')?.classList.toggle('d-none', single);
  indicators?.classList.toggle('d-none', single);
}

// boot
(() => {
  try {
    const data = loadData();
    renderCommon(data);
    renderAboutCarousel(data);      // <-- new
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