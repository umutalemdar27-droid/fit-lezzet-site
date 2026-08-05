// FIT & LEZZET — CMS İÇERİK YÜKLEYİCİ
// Bu script data/*.json dosyalarını okuyup sayfadaki ilgili alanlara basar.
// Decap CMS panelinden bu JSON'lar değiştirildiğinde site otomatik güncellenir.

function fadeInList(container) {
  const items = container.children;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.animation = 'fadeUp 0.6s ease forwards';
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  [...items].forEach(el => { el.style.opacity = '0'; obs.observe(el); });
}

function vcardHTML(item, tur) {
  const cls = tur === 'fitness' ? 'vcard-tur' : 'vcard-yes';
  const thumbCls = tur === 'fitness' ? 'vt-t' : 'vt-y';
  const lens = tur === 'fitness' ? `<div class="mini360" tabindex="0"><div class="mini360-frame"><video class="mini360-video" data-video="${item.video_url || ''}" muted loop playsinline preload="none"></video><span class="mini360-figure">🧍</span><div class="mini360-ring"><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div><span class="mini360-tag">360° yakında</span></div></div>` : '';
  return `<div class="vcard ${cls}"><div class="vcard-thumb ${thumbCls}">${item.emoji}<span class="vcard-dur">${item.sure}</span>${lens}</div><div class="vcard-info"><h3>${item.baslik}</h3><p>${item.aciklama}</p></div></div>`;
}

function lifehackHTML(item) {
  return `<div class="lifehack-kart"><div class="lh-dur">${item.sure}</div><div class="lh-icon">${item.emoji}</div><h3>${item.baslik}</h3><p>${item.aciklama}</p><span class="lh-badge">0 TL malzeme</span></div>`;
}

async function loadList(url, containerId, renderFn, tur, limit) {
  const container = document.getElementById(containerId);
  if (!container) return;
  try {
    const res = await fetch(url);
    const json = await res.json();
    let data = json.items || [];
    if (limit) data = data.slice(0, limit);
    container.innerHTML = data.map(item => renderFn(item, tur)).join('');
    // mini360 lens'leri aktive et (dinamik eklendiği için ana script'ten sonra tekrar bağlanmalı)
    container.querySelectorAll('.mini360').forEach(lens => {
      const frame = lens.querySelector('.mini360-frame');
      const video = lens.querySelector('.mini360-video');
      const src = video.dataset.video;
      if (!src) return;
      const activate = () => { if (video.src !== src) video.src = src; video.currentTime = 0; video.play().catch(()=>{}); video.classList.add('mv-ready'); };
      const deactivate = () => { video.pause(); video.classList.remove('mv-ready'); };
      frame.addEventListener('mouseenter', activate);
      frame.addEventListener('mouseleave', deactivate);
      frame.addEventListener('focus', activate);
      frame.addEventListener('blur', deactivate);
    });
    fadeInList(container);
  } catch (e) {
    container.innerHTML = '<p style="opacity:0.4;font-weight:600">İçerik yüklenemedi.</p>';
    console.error('Liste yüklenemedi:', url, e);
  }
}

async function loadSiteInfo() {
  try {
    const res = await fetch('data/site.json');
    const s = await res.json();
    document.querySelectorAll('[data-role="whatsapp-link"]').forEach(a => a.href = `https://wa.me/${s.whatsapp_no}`);
    document.querySelectorAll('[data-role="email-link"]').forEach(a => a.href = `mailto:${s.email}`);
    document.querySelectorAll('[data-role="instagram-link"]').forEach(a => a.href = s.instagram_url);
    document.querySelectorAll('[data-role="youtube-link"]').forEach(a => a.href = s.youtube_url);
    document.querySelectorAll('[data-role="tiktok-link"]').forEach(a => a.href = s.tiktok_url);
    document.querySelectorAll('[data-role="email-text"]').forEach(el => el.textContent = s.email);
  } catch (e) {
    console.error('Site bilgisi yüklenemedi:', e);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadSiteInfo();
  loadList('data/fitness.json', 'fitnessList', vcardHTML, 'fitness', null);
  loadList('data/tarifler.json', 'tariflerList', vcardHTML, 'tarifler', null);
  loadList('data/lifehack.json', 'lifehackList', lifehackHTML, null, null);
  loadList('data/fitness.json', 'fitnessTeaser', vcardHTML, 'fitness', 2);
  loadList('data/tarifler.json', 'tariflerTeaser', vcardHTML, 'tarifler', 2);
  loadList('data/lifehack.json', 'lifehackTeaser', lifehackHTML, null, 2);
});
