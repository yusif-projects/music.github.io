#!/usr/bin/env node
'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT      = path.join(__dirname, '..');
const BASE      = 'https://www.joeinthestudio.com';
const releases  = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/releases.json'), 'utf8'));
const siteData  = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/data.json'), 'utf8'));

// Replace content between <!-- GEN:key:START --> and <!-- GEN:key:END -->
function inject(file, key, content) {
  const start = `<!-- GEN:${key}:START -->`;
  const end   = `<!-- GEN:${key}:END -->`;
  let html = fs.readFileSync(file, 'utf8');
  const si = html.indexOf(start);
  const ei = html.indexOf(end);
  if (si === -1 || ei === -1) throw new Error(`Markers GEN:${key} not found in ${path.relative(ROOT, file)}`);
  html = html.slice(0, si + start.length) + '\n' + content + '\n' + html.slice(ei);
  fs.writeFileSync(file, html, 'utf8');
  console.log(`  Updated ${key} in ${path.relative(ROOT, file)}`);
}

function indent(json, spaces) {
  const pad = ' '.repeat(spaces);
  return JSON.stringify(json, null, 2).split('\n').map(l => pad + l).join('\n');
}

// ── index.html — JSON-LD (MusicGroup + tracks) ────────────────────────────────

const musicGroupLd = {
  '@context': 'https://schema.org',
  '@type': 'MusicGroup',
  name: 'Joe in the Studio',
  alternateName: 'Yusif Aliyev',
  url: BASE + '/',
  image: BASE + '/Assets/logo.jpg',
  description: "Joe in the Studio is the stage name of Yusif Aliyev, a multi-instrumentalist and songwriter crafting music that feels like it could've been pressed on vinyl in the late 60s but still speaks to today. Armed with guitars, piano, bass, and drums — plus a knack for raw storytelling — every note is written, recorded, and produced solo in his small home studio.",
  foundingLocation: { '@type': 'Place', name: 'Baku, Azerbaijan' },
  genre: ['Indie Rock', 'Singer-Songwriter', 'Indie Pop'],
  sameAs: [
    ...(siteData.platforms || []).map(p => p.url).filter(Boolean),
    ...(siteData.socials || []).map(s => s.url).filter(Boolean),
  ],
  member: { '@type': 'Person', name: 'Yusif Aliyev', sameAs: BASE + '/' },
  ...(siteData.influences?.length && {
    influencedBy: siteData.influences.map(inf => ({
      '@type': 'MusicGroup',
      name: inf.name,
      ...(inf.url && { url: inf.url }),
    })),
  }),
  track: releases.map(r => ({
    '@type': 'MusicRecording',
    name: r.title,
    datePublished: String(r.year),
    ...(r.spotify_url && { url: r.spotify_url }),
    inAlbum: {
      '@type': 'MusicAlbum',
      albumProductionType: 'SingleRelease',
      name: r.title,
      datePublished: String(r.year),
    },
    recordingOf: {
      '@type': 'MusicComposition',
      name: r.title,
      ...(r.songwriter && { lyricist: { '@type': 'Person', name: r.songwriter } }),
    },
  })),
};

inject(
  path.join(ROOT, 'index.html'),
  'JSONLD',
  `  <script type="application/ld+json" id="structured-data">\n${indent(musicGroupLd, 2)}\n  </script>`,
);

// ── index.html — noscript fallback ────────────────────────────────────────────

const homeItems = releases.map(r => {
  const links = [];
  if (r.spotify_url)       links.push(`<a href="${r.spotify_url}">Spotify</a>`);
  if (r.apple_music_url)   links.push(`<a href="${r.apple_music_url}">Apple Music</a>`);
  if (r.youtube_music_url) links.push(`<a href="${r.youtube_music_url}">YouTube Music</a>`);
  const suffix = links.length ? ' — ' + links.join(' | ') : '';
  return `            <li><strong>${r.title}</strong> (${r.year}, ${r.type})${suffix}</li>`;
}).join('\n');

inject(
  path.join(ROOT, 'index.html'),
  'NOSCRIPT',
  `        <noscript>\n          <ul style="list-style:none;padding:0;margin-top:1rem;">\n${homeItems}\n          </ul>\n        </noscript>`,
);

// ── lyrics/index.html — JSON-LD (CollectionPage + full lyrics) ────────────────

const collectionLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Lyrics — Joe in the Studio',
  url: BASE + '/lyrics/',
  description: 'Full lyrics for all songs by Joe in the Studio (Yusif Aliyev).',
  author: { '@type': 'Person', name: 'Yusif Aliyev', alternateName: 'Joe in the Studio' },
  hasPart: releases
    .filter(r => r.lyrics)
    .map(r => ({
      '@type': 'MusicRecording',
      name: r.title,
      datePublished: String(r.year),
      url: `${BASE}/lyrics/?song=${r.id}`,
      lyrics: { '@type': 'CreativeWork', text: r.lyrics },
    })),
};

inject(
  path.join(ROOT, 'lyrics/index.html'),
  'JSONLD',
  `  <script type="application/ld+json">\n${indent(collectionLd, 2)}\n  </script>`,
);

// ── lyrics/index.html — noscript fallback ─────────────────────────────────────

const lyricsItems = releases.map(r =>
  `        <li><a href="?song=${r.id}"><strong>${r.title}</strong></a> — ${r.type}, ${r.year}</li>`,
).join('\n');

inject(
  path.join(ROOT, 'lyrics/index.html'),
  'NOSCRIPT',
  `    <noscript>\n      <ul style="list-style:none;padding:0;margin-top:1rem;">\n${lyricsItems}\n      </ul>\n    </noscript>`,
);

console.log('SEO generation complete.');
