// ========================= main.js =========================
// Artist website for Joe in the Studio
// Data-driven, bilingual (EN/AZ), responsive static site

import * as json from '../data/data.json' with {type: 'json'};
import releasesJson from '../data/releases.json' with {type: 'json'};

// ====================== UTILITY HELPERS ======================
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

// ====================== I18N / LANGUAGE ======================
let LANG = 'en';
let I18N = {};
const t = (key) => (I18N[LANG] && I18N[LANG][key]) || (I18N.en && I18N.en[key]) || '';

// Language routing (URL-first, storage as fallback)
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
  renderReleases(data);
  renderContactSocials(data);
  renderYouTubeRecent(data);
  renderInstagram(data);
  renderAboutCarousel(data);
  // Update SEO tags for language change
  updateSEOTags(data);
}

// ====================== DATA MANAGEMENT ======================
function loadData() {
  if (!json?.default) {
    throw new Error('Failed to load data.json');
  }
  return { ...json.default, releases: releasesJson };
}

function clearRendered() {
  ['#releases', '#ytGrid', '#igGrid'].forEach(sel => {
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

// ====================== RENDER FUNCTIONS ======================
function renderCommon(data) {
  if (!data?.artist) return;

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
    const list = (LANG === 'az' && data.artist.highlights_az) 
      ? data.artist.highlights_az 
      : (data.artist.highlights || []);
    list.forEach(h => hi.appendChild(el('li', { textContent: '• ' + h })));
  }
  
  // Update SEO tags dynamically
  updateSEOTags(data);
}

function applyStaticI18n(/*data*/) {
  const d = document;
  // Navbar labels
  setText(d.querySelector('a[href="#discography"]'), t('nav_discography'));
  setText(d.querySelector('a[href="lyrics/"]'), t('nav_lyrics'));
  setText(d.querySelector('a[href="#about"]'), t('nav_about'));
  setText(d.querySelector('a[href="#contact"]'), t('nav_contact'));

  // Hero text + CTAs
  setText($('#heroEyebrow'), t('hero_eyebrow'));
setText($('#heroHeadline'), t('hero_headline'));
  setText($('#heroSub'), t('hero_sub'));

  const listenBtn = d.querySelector('a[href="#discography"].btn');
  if (listenBtn) setHTML(listenBtn, `<i class="bi bi-play-fill me-1"></i> ${t('cta_listen')}`);

  const watchBtn = d.querySelector('a[href="#youtube"].btn');
  if (watchBtn) setHTML(watchBtn, `<i class="bi bi-youtube me-1"></i> ${t('cta_watch')}`);

  const linksBtn = $('#ctaLinks');
  if (linksBtn) setHTML(linksBtn, `<i class="bi bi-grid-3x3-gap me-1"></i> ${t('cta_links')}`);

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

  // Footer line
  const footerNote = d.querySelector('footer .container div:last-child');
  setText(footerNote, t('footer_built'));
}

function renderReleases(data) {
  const wrap = $('#releases');
  if (!wrap || !data?.releases?.length) return;
  
  wrap.innerHTML = '';
  data.releases.forEach(r => {
    const spotifyBtn = r.spotify_url
      ? `<a class="btn btn-accent btn-sm" href="${r.spotify_url}" target="_blank" rel="noreferrer"><i class="bi bi-spotify me-1"></i>${t('btn_spotify')}</a>`
      : '';
    const appleMusicBtn = r.apple_music_url
      ? `<a class="btn btn-outline-light btn-sm" href="${r.apple_music_url}" target="_blank" rel="noreferrer"><i class="bi bi-music-note me-1"></i>${t('btn_apple_music')}</a>`
      : '';

    const lyricsBtn = r.lyrics
      ? `<a class="btn btn-outline-light btn-sm" href="lyrics/?song=${r.id}"><i class="bi bi-music-note-list me-1"></i>${t('btn_lyrics')}</a>`
      : '';
    const descHtml = r.description
      ? `<p class="text-muted small mb-3" style="flex-grow:0">${r.description}</p>`
      : '';

    const item = el('div', { className: 'carousel-card' });
    const altText = `${r.title} by Joe in the Studio - Album Cover Art ${r.year}`;
    const titleText = `${r.title} by Joe in the Studio - Music Release ${r.year}`;
    item.innerHTML = `
      <div class="card h-100">
        <div class="release-img-wrap">
          <div class="vinyl-disc"></div>
          <img src="${r.cover}" class="card-img-top" alt="${altText}" title="${titleText}" loading="lazy"/>
        </div>
        <div class="card-body d-flex flex-column">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <h5 class="card-title mb-0">${r.title}</h5>
            <span class="chip ms-2 flex-shrink-0">${r.year}</span>
          </div>
          ${descHtml}
          <div class="mt-auto d-flex flex-wrap gap-2">
            ${spotifyBtn}
            ${appleMusicBtn}
            ${lyricsBtn}
          </div>
        </div>
      </div>`;
    wrap.appendChild(item);
  });

  setupCarousel('releases');
}

function renderContactSocials(data) {
  if (!data) return;

  // Contacts by language
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
  if (sWrap && Array.isArray(data.socials)) {
    sWrap.innerHTML = '';
    data.socials.forEach(s => {
      if (!s?.url || !s?.name) return;
      const a = el('a', { 
        href: s.url, 
        target: '_blank', 
        rel: 'noreferrer', 
        className: 'btn btn-outline-light btn-sm' 
      });
      a.innerHTML = `<i class="bi ${s.icon || ''} me-1"></i>${s.name}`;
      sWrap.appendChild(a);
    });
  }
}

function renderYouTubeRecent(data) {
  const grid = $('#ytGrid');
  if (!grid || !data) return;
  
  grid.innerHTML = '';
  const ids = data.youtube_videos || data.youtube_recent || [];
  const channelUrl = data.artist?.channels?.youtube_channel_url || '#';
  const link = $('#youtubeChannelLink');
  if (link) link.href = channelUrl;

  ids.slice(0, 10).forEach(id => {
    if (!id) return;
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
  const grid = $('#igGrid');
  if (!grid || !data) return;
  
  grid.innerHTML = '';
  const posts = data.instagram_posts || [];
  const profile = data.artist?.channels?.instagram_url || '#';
  const link = $('#instagramProfileLink');
  if (link) link.href = profile;

  posts.slice(0, 10).forEach(url => {
    if (!url) return;
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
  const carousel = $('#aboutCarousel');
  if (!carousel || !data?.artist) return;
  
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
    // SEO-optimized alt text with keywords for Google Images
    const altText = `Joe in the Studio - Behind the scenes photo ${i + 1} - Music artist and producer`;
    const titleText = `Joe in the Studio - Studio session and music production photo ${i + 1}`;
    item.innerHTML = `<img src="${src}" class="d-block w-100 h-100 object-cover" alt="${altText}" title="${titleText}" loading="lazy">`;
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

// ====================== SEO OPTIMIZATION ======================
function updateSEOTags(data) {
  if (!data?.artist) return;
  
  const artistName = data.artist.name;
  const bio = (LANG === 'az' && data.artist.bio_az) ? data.artist.bio_az : data.artist.bio;
  const baseUrl = 'https://www.joeinthestudio.com';
  const currentUrl = baseUrl + window.location.pathname + (LANG === 'az' ? '?lang=az' : (LANG === 'en' ? '?lang=en' : ''));
  const canonicalUrl = baseUrl + window.location.pathname + (LANG === 'az' ? '?lang=az' : '');
  const imageUrl = `${baseUrl}/Assets/logo.jpg`;
  
  // Update title
  document.title = `${artistName} — Official Site`;
  
  // Update meta description
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) {
    metaDesc.content = bio.substring(0, 160);
  }
  
  // Update canonical URL
  const canonical = document.getElementById('canonical-url');
  if (canonical) {
    canonical.href = canonicalUrl;
  }
  
  // Update language alternates
  const altEn = document.getElementById('hreflang-en');
  const altAz = document.getElementById('hreflang-az');
  if (altEn) altEn.href = `${baseUrl}?lang=en`;
  if (altAz) altAz.href = `${baseUrl}?lang=az`;
  
  // Update Open Graph tags
  const ogTitle = document.getElementById('og-title');
  const ogDesc = document.getElementById('og-description');
  const ogImage = document.getElementById('og-image');
  const ogUrl = document.getElementById('og-url');
  
  if (ogTitle) ogTitle.content = `${artistName} — Official Site`;
  if (ogDesc) ogDesc.content = bio.substring(0, 200);
  if (ogImage) ogImage.content = imageUrl;
  if (ogUrl) ogUrl.content = currentUrl;
  
  // Update Twitter tags
  const twTitle = document.getElementById('twitter-title');
  const twDesc = document.getElementById('twitter-description');
  const twImage = document.getElementById('twitter-image');
  const twUrl = document.getElementById('twitter-url');
  
  if (twTitle) twTitle.content = `${artistName} — Official Site`;
  if (twDesc) twDesc.content = bio.substring(0, 200);
  if (twImage) twImage.content = imageUrl;
  if (twUrl) twUrl.content = currentUrl;
  
  // Update structured data
  const structuredData = document.getElementById('structured-data');
  if (structuredData && data.artist.channels) {
    const socialLinks = [
      data.artist.channels.youtube_channel_url,
      data.artist.channels.instagram_url
    ].filter(Boolean);
    
    // Add all social links from data.socials if available
    if (data.socials && Array.isArray(data.socials)) {
      data.socials.forEach(s => {
        if (s?.url && !socialLinks.includes(s.url)) {
          socialLinks.push(s.url);
        }
      });
    }
    
    // Collect all album cover images for image schema
    const albumImages = (data.releases || []).map(r => ({
      "@type": "ImageObject",
      "url": `${baseUrl}/${r.cover}`,
      "caption": `${r.title} by ${artistName} - Album Cover ${r.year}`,
      "name": `${r.title} by ${artistName}`
    }));
    
    // Collect about photos
    const aboutImages = (data.artist.about_photos || []).map((src, i) => ({
      "@type": "ImageObject",
      "url": `${baseUrl}/${src}`,
      "caption": `${artistName} - Behind the scenes studio photo ${i + 1}`,
      "name": `${artistName} Studio Photo ${i + 1}`
    }));
    
    // Combine all images: logo, album covers, and about photos
    const allImages = [
      {
        "@type": "ImageObject",
        "url": imageUrl,
        "caption": `${artistName} - Official Logo and Profile Picture`,
        "name": `${artistName} Logo`
      },
      ...albumImages,
      ...aboutImages
    ];
    
    structuredData.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "MusicGroup",
      "name": artistName,
      "url": baseUrl,
      "image": allImages,
      "description": bio,
      "sameAs": socialLinks
    });
  }
}

// ========================= BOOT =========================
(() => {
  try {
    const data = loadData();
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
    // Support button variants (no page reload)
    $('#langBtnEN')?.addEventListener('click', (e) => { e.preventDefault(); setLang('en', data); });
    $('#langBtnAZ')?.addEventListener('click', (e) => { e.preventDefault(); setLang('az', data); });

    // Initial render
    markActiveFlag();
    applyStaticI18n(data);
    renderCommon(data);
    renderReleases(data);
    renderContactSocials(data);
    renderYouTubeRecent(data);
    renderInstagram(data);
    renderAboutCarousel(data);

    // Subtle hero parallax
    const heroEl = document.querySelector('.hero');
    if (heroEl) {
      window.addEventListener('scroll', () => {
        heroEl.style.backgroundPositionY = `${window.scrollY * 0.25}px`;
      }, { passive: true });
    }

  } catch (e) {
    console.error('Failed to initialize application:', e);
    // Show user-friendly error message
    const body = document.body;
    if (body) {
      body.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 2rem; text-align: center;">
          <div>
            <h1>Error Loading Site</h1>
            <p>Please refresh the page or contact support if the problem persists.</p>
          </div>
        </div>
      `;
    }
  }
})();
