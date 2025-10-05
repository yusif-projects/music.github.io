// ========================= main.js =========================
// Tiny helpers
import * as json from '../data/data.json' with {type: 'json'};


const $ = (sel, ctx = document) => ctx.querySelector(sel);
const el = (tag, opts = {}) => Object.assign(document.createElement(tag), opts);

// Safe storage (won't throw in Safari Private Mode)
const storage = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* ignore */ } }
};

// Safe text/html setters (older Safari friendly)
const setText = (node, text) => { if (node) node.textContent = text ?? ''; };
const setHTML = (node, html) => { if (node) node.innerHTML = html ?? ''; };

// i18n state
let LANG = 'en';
let I18N = {};
const t = (key) => (I18N[LANG] && I18N[LANG][key]) || (I18N.en && I18N.en[key]) || '';

// ---- Language routing (URL-first, storage as fallback) ----
function getLangFromUrl() {
  const u = new URL(window.location.href);
  const q = (u.searchParams.get('lang') || '').toLowerCase();
  if (q === 'en' || q === 'az') return q;
  return null;
}
function markActiveFlag() {
  const en = $('#langLinkEN') || $('#langBtnEN');
  const az = $('#langLinkAZ') || $('#langBtnAZ');
  en?.classList.toggle('active', LANG === 'en');
  az?.classList.toggle('active', LANG === 'az');
}
function setLang(lang, data, persist = true) {
  LANG = (lang === 'az') ? 'az' : 'en';
  if (persist) storage.set('lang', LANG);
  document.documentElement.lang = LANG;
  markActiveFlag();
  // Static labels + About copy
  applyStaticI18n(data);
  renderCommon(data);
  // Rebuild dynamic sections
  clearRendered();
  renderHero(data);
  renderTracks(data);
  renderShows(data);
  renderReleases(data);
  renderContactSocials(data);
  renderYouTubeRecent(data);
  renderInstagram(data);
  renderAboutCarousel(data);
}

// ---- Data loading / clearing ----
function loadData() {
  return json.default;
}
function clearRendered() {
  ['#tracks', '#showsList', '#releases', '#ytGrid', '#igGrid'].forEach(sel => {
    const node = $(sel);
    if (node) node.innerHTML = '';
  });
}

// ====================== CAROUSEL HELPERS ======================
const carouselRegistry = new Map();
let carouselResizeBound = false;

function updateCarouselButtons(state) {
  const { viewport, prev, next } = state;
  if (!viewport || !prev || !next) return;

  const maxScroll = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
  const scrollable = maxScroll > 1;
  const tolerance = 1;
  const atStart = viewport.scrollLeft <= tolerance;
  const atEnd = viewport.scrollLeft >= (maxScroll - tolerance);

  const hidePrev = !scrollable || atStart;
  const hideNext = !scrollable || atEnd;

  prev.classList.toggle('d-none', hidePrev);
  next.classList.toggle('d-none', hideNext);

  prev.disabled = hidePrev;
  next.disabled = hideNext;
}

function scrollCarouselBy(state, direction) {
  const { viewport, track } = state;
  if (!viewport || !track) return;

  const first = track.querySelector(':scope > *');
  if (!first) return;

  const style = window.getComputedStyle(track);
  const gap = parseFloat(style.columnGap || style.gap || '0') || 0;
  const itemWidth = first.getBoundingClientRect().width;
  const amount = direction * (itemWidth + gap);

  viewport.scrollBy({ left: amount, behavior: 'smooth' });
}

function setupCarousel(trackId) {
  const track = document.getElementById(trackId);
  if (!track) return;

  const shell = track.closest('.carousel-shell');
  if (!shell) return;

  const viewport = shell.querySelector('.carousel-window');
  const prev = shell.querySelector('.carousel-btn-prev');
  const next = shell.querySelector('.carousel-btn-next');
  if (!viewport || !prev || !next) return;

  let state = carouselRegistry.get(shell);
  if (!state) {
    state = { shell, track, viewport, prev, next };
    carouselRegistry.set(shell, state);
  }

  state.track = track;
  state.viewport = viewport;
  state.prev = prev;
  state.next = next;

  state.update = () => updateCarouselButtons(state);

  viewport.scrollLeft = 0;

  if (!state.bound) {
    prev.addEventListener('click', () => {
      scrollCarouselBy(state, -1);
      window.requestAnimationFrame(() => state.update());
    });
    next.addEventListener('click', () => {
      scrollCarouselBy(state, 1);
      window.requestAnimationFrame(() => state.update());
    });
    viewport.addEventListener('scroll', () => {
      window.requestAnimationFrame(() => state.update());
    }, { passive: true });
    state.bound = true;
  }

  state.update();

  if (!carouselResizeBound) {
    window.addEventListener('resize', () => {
      carouselRegistry.forEach(s => s.update?.());
    });
    carouselResizeBound = true;
  }
}

// ======================== RENDERERS ========================
function renderCommon(data) {
  document.title = `${data.artist.name} — Official Site`;
  setText($('#brandName'), data.artist.name);
  setText($('#footerArtist'), data.artist.name);
  setText($('#year'), new Date().getFullYear());

  // Bio / Highlights (AZ fallback-aware)
  const bioText = (LANG === 'az' && data.artist.bio_az) ? data.artist.bio_az : data.artist.bio;
  setText($('#bio'), bioText);

  const hi = $('#highlights');
  if (hi) {
    hi.innerHTML = '';
    const list = (LANG === 'az' && data.artist.highlights_az) ? data.artist.highlights_az : (data.artist.highlights || []);
    list.forEach(h => hi.appendChild(el('li', { textContent: '• ' + h })));
  }

  // If old iframe exists, keep it functional
  const video = $('#videoEmbed');
  if (video) video.src = data.artist.video_embed_url || '';
}

function applyStaticI18n(/*data*/) {
  const d = document;
  // Navbar labels
  setText(d.querySelector('a[href="#discography"]'), t('nav_discography'));
  setText(d.querySelector('a[href="#about"]'), t('nav_about'));
  setText(d.querySelector('a[href="#contact"]'), t('nav_contact'));

  // Hero text + CTAs
  setText($('#heroBadge'), t('hero_badge'));
  setText($('#heroHeadline'), t('hero_headline'));
  setText($('#heroSub'), t('hero_sub'));

  const listenBtn = d.querySelector('a[href="#discography"].btn');
  if (listenBtn) setHTML(listenBtn, `<i class="bi bi-play-fill me-1"></i> ${t('cta_listen')}`);

  const watchBtn = d.querySelector('a[href="#youtube"].btn');
  if (watchBtn) setHTML(watchBtn, `<i class="bi bi-youtube me-1"></i> ${t('cta_watch')}`);

  // Section titles/links
  setText(d.querySelector('#discography .section-title'), t('section_discography'));
  setText(d.querySelector('#youtube .section-title'), t('section_youtube'));
  setText(d.querySelector('#instagram .section-title'), t('section_instagram'));
  setText($('#youtubeChannelLink'), t('see_all'));
  setText($('#instagramProfileLink'), t('open_profile'));
  setText(d.querySelector('#about .section-title'), t('section_about'));
  setText(d.querySelector('#contact .section-title'), t('contact'));

  // Contact card titles/subtitle
  const contactCardTitle = $('#contact .card-title');
  setText(contactCardTitle, t('bookings_press'));
  const contactSub = $('#contact .text-muted.small');
  setText(contactSub, t('bookings_sub'));

  // Follow card header (2nd card title under #contact)
  const titles = d.querySelectorAll('#contact .card-title');
  if (titles.length > 1) setText(titles[1], t('follow'));

  // Latest release chip label if present
  setText($('#selected-release-stack'), t('selected_release'));

  // Footer line
  const footerNote = d.querySelector('footer .container div:last-child');
  setText(footerNote, t('footer_built'));
}

function renderHero(data) {
  const selectedId = data.artist.hero?.selected_release_id;
  const selected = data.releases.find(r => r.id === selectedId) || data.releases[0];
  if (!selected) return;

  setText($('#selectedReleaseMeta'), `${selected.title} • ${selected.year}`);

  const yt = $('#latestYouTube');
  if (yt) {
    yt.src = selected.youtube_video_id
      ? `https://www.youtube.com/embed/${selected.youtube_video_id}`
      : (data.artist.video_embed_url || '');
  }
}

function renderTracks(data) {
  const wrap = $('#tracks'); if (!wrap) return;
  const allTracks = data.releases.flatMap(r => (r.tracks || []).map(t => ({ ...t, release: r })));
  wrap.innerHTML = '';
  allTracks.slice(0, 6).forEach(({ title, duration, release }) => {
    const col = el('div', { className: 'col-md-6 col-lg-4' });

    const ytBtn = release.youtube_video_id
      ? `<a class="btn btn-accent btn-sm mt-2 me-2" href="https://www.youtube.com/watch?v=${release.youtube_video_id}" target="_blank" rel="noreferrer"><i class="bi bi-youtube me-1"></i>${t('btn_youtube')}</a>`
      : '';

    const scBtn = release.soundcloud_url
      ? `<a class="btn btn-outline-light btn-sm mt-2" href="${release.soundcloud_url}" target="_blank" rel="noreferrer"><i class="bi bi-soundwave me-1"></i>${t('btn_soundcloud')}</a>`
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
                <div class="fw-semibold">${d.toLocaleDateString(LANG === 'az' ? 'az' : undefined, { month: 'short', day: '2-digit' })}</div>
                <div class="text-muted small">${d.getFullYear()}</div>
              </div>
            </div>
            <div class="mt-3 d-flex gap-2 align-items-center mt-auto">
              <span class="chip ${s.status === 'On Sale' ? 'badge-soft' : ''}">${s.status}</span>
              ${s.ticket_url ? `<a class="btn btn-accent btn-sm ms-auto" href="${s.ticket_url}">${t('cta_listen')}</a>` : ''}
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
  const wrap = $('#releases'); if (!wrap) return;
  wrap.innerHTML = '';
  data.releases.forEach(r => {
    const ytBtn = r.youtube_video_id
      ? `<a class="btn btn-accent btn-sm me-2" href="https://www.youtube.com/watch?v=${r.youtube_video_id}" target="_blank" rel="noreferrer"><i class="bi bi-youtube me-1"></i>${t('btn_youtube')}</a>`
      : '';
    const scBtn = r.soundcloud_url
      ? `<a class="btn btn-outline-light btn-sm" href="${r.soundcloud_url}" target="_blank" rel="noreferrer"><i class="bi bi-soundwave me-1"></i>${t('btn_soundcloud')}</a>`
      : '';

    const item = el('div', { className: 'carousel-card' });
    item.innerHTML = `
      <div class="card h-100">
        <img src="${r.cover}" class="card-img-top" alt="${r.title} cover" loading="lazy"/>
        <div class="card-body d-flex flex-column">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <h5 class="card-title mb-0">${r.title}</h5>
            <span class="chip">${r.year}</span>
          </div>
          <div class="mt-auto d-flex flex-wrap gap-2">
            ${ytBtn}
            ${scBtn}
          </div>
        </div>
      </div>`;
    wrap.appendChild(item);
  });

  setupCarousel('releases');
}

function renderContactSocials(data) {
  // contacts by language
  const c = (LANG === 'az' && data.contacts_az) ? data.contacts_az : (data.contacts || {});
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
  const grid = $('#ytGrid'); if (!grid) return;
  grid.innerHTML = '';
  const ids = data.youtube_videos || data.youtube_recent || [];
  const channelUrl = data.artist.channels?.youtube_channel_url || '#';
  const link = $('#youtubeChannelLink'); if (link) link.href = channelUrl;

  ids.slice(0, 6).forEach(id => {
    const item = el('div', { className: 'carousel-card' });
    item.innerHTML = `
      <div class="card h-100">
        <div class="ratio ratio-16x9">
          <iframe src="https://www.youtube.com/embed/${id}" title="YouTube video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen loading="lazy"></iframe>
        </div>
      </div>`;
    grid.appendChild(item);
  });

  setupCarousel('ytGrid');
}

function renderInstagram(data) {
  const grid = $('#igGrid'); if (!grid) return;
  grid.innerHTML = '';
  const posts = data.instagram_posts || [];
  const profile = data.artist.channels?.instagram_url || '#';
  const link = $('#instagramProfileLink'); if (link) link.href = profile;

  posts.slice(0, 6).forEach(url => {
    const item = el('div', { className: 'carousel-card' });
    item.innerHTML = `
      <div class="card h-100">
        <blockquote class="instagram-media" data-instgrm-permalink="${url}" data-instgrm-version="14" data-instgrm-theme="dark" style="margin:0 auto; width:100%;"></blockquote>
      </div>`;
    grid.appendChild(item);
  });

  if (window.instgrm && window.instgrm.Embeds) window.instgrm.Embeds.process();

  setupCarousel('igGrid');
}

function renderAboutCarousel(data) {
  const carousel = $('#aboutCarousel'); if (!carousel) return;
  const inner = carousel.querySelector('.carousel-inner');
  const indicators = carousel.querySelector('.carousel-indicators');
  if (!inner) return;

  const photos = (data.artist.about_photos || []).filter(Boolean);
  inner.innerHTML = ''; if (indicators) indicators.innerHTML = '';

  if (!photos.length) {
    carousel.querySelector('.carousel-control-prev')?.classList.add('d-none');
    carousel.querySelector('.carousel-control-next')?.classList.add('d-none');
    indicators?.classList.add('d-none');
    return;
  }

  photos.forEach((src, i) => {
    const item = el('div', { className: `carousel-item h-100${i === 0 ? ' active' : ''}` });
    item.innerHTML = `<img src="${src}" class="d-block w-100 h-100 object-cover" alt="About photo ${i + 1}" loading="lazy">`;
    inner.appendChild(item);

    if (indicators) {
      const btn = el('button');
      btn.type = 'button';
      btn.setAttribute('data-bs-target', '#aboutCarousel');
      btn.setAttribute('data-bs-slide-to', String(i));
      btn.setAttribute('aria-label', `Slide ${i + 1}`);
      if (i === 0) { btn.className = 'active'; btn.setAttribute('aria-current', 'true'); }
      indicators.appendChild(btn);
    }
  });

  const single = photos.length === 1;
  carousel.querySelector('.carousel-control-prev')?.classList.toggle('d-none', single);
  carousel.querySelector('.carousel-control-next')?.classList.toggle('d-none', single);
  indicators?.classList.toggle('d-none', single);
}

// ========================= BOOT =========================
(() => {
  try {
    const data = loadData();
    console.log(data);
    I18N = data.i18n || {};

    // Determine language: URL > stored > EN (and persist URL choice)
    const urlLang = getLangFromUrl();              // 'en' | 'az' | null
    const stored = storage.get('lang');           // 'en' | 'az' | null

    LANG = urlLang || stored || 'en';

    // If a URL param was provided, store it as the new preference
    if (urlLang && urlLang !== stored) {
      storage.set('lang', urlLang);
    }

    document.documentElement.lang = LANG;

    // Wire flags (works for link or button variants)
    const hash = window.location.hash || '';
    const linkEN = $('#langLinkEN'); const linkAZ = $('#langLinkAZ');
    if (linkEN) linkEN.href = `?lang=en${hash}`;
    if (linkAZ) linkAZ.href = `?lang=az${hash}`;
    // If you kept old button IDs, support them too (no page reload)
    $('#langBtnEN')?.addEventListener('click', (e) => { e.preventDefault(); setLang('en', data); });
    $('#langBtnAZ')?.addEventListener('click', (e) => { e.preventDefault(); setLang('az', data); });



    // Initial render
    markActiveFlag();
    applyStaticI18n(data);
    renderCommon(data);
    renderHero(data);
    renderTracks(data);
    renderShows(data);
    renderReleases(data);
    renderContactSocials(data);
    renderYouTubeRecent(data);
    renderInstagram(data);
    renderAboutCarousel(data);

  } catch (e) {
    console.error(e);
  }
})();
