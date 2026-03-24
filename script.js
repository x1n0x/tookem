'use strict';

// ============================================================
// STICKY HEADER — добавляет класс .scrolled при скролле > 80px
// ============================================================
const header = document.getElementById('header');

window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 80);
}, { passive: true });

// ============================================================
// SCROLL LOCK — используется лайтбоксом (iOS Safari fix)
// ============================================================
let savedScrollY = 0;

function lockScroll() {
  savedScrollY = window.scrollY;
  document.body.style.position = 'fixed';
  document.body.style.top      = `-${savedScrollY}px`;
  document.body.style.left     = '0';
  document.body.style.right    = '0';
  document.body.style.overflow = 'hidden';
}

function unlockScroll() {
  document.body.style.position = '';
  document.body.style.top      = '';
  document.body.style.left     = '';
  document.body.style.right    = '';
  document.body.style.overflow = '';
  window.scrollTo(0, savedScrollY);
}

// ============================================================
// INTERSECTION OBSERVER — анимация .fade-up
// ============================================================
const fadeObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      fadeObserver.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.1,
  rootMargin: '0px 0px -40px 0px'
});

// Hero-элементы показываем сразу без observer (они в viewport при загрузке)
const heroFadeEls = document.querySelectorAll('.hero .fade-up');
heroFadeEls.forEach((el, i) => {
  setTimeout(() => el.classList.add('visible'), 150 + i * 120);
});

// Все остальные .fade-up — через Intersection Observer
document.querySelectorAll('.fade-up:not(.hero .fade-up)').forEach(el => {
  fadeObserver.observe(el);
});

// ============================================================
// LIGHTBOX — просмотр галереи на весь экран
// ============================================================
const galleryItems  = document.querySelectorAll('.gallery__item');
const lightbox      = document.getElementById('lightbox');
const lightboxImg   = document.getElementById('lightboxImg');
const lightboxClose = document.getElementById('lightboxClose');
const lightboxPrev  = document.getElementById('lightboxPrev');
const lightboxNext  = document.getElementById('lightboxNext');

// Собираем массив изображений из галереи
const images = Array.from(galleryItems).map(item => {
  const img = item.querySelector('.gallery__img');
  return { src: img.src, alt: img.alt };
});

let currentIndex = 0;

function openLightbox(index) {
  currentIndex = index;
  lightboxImg.src = images[index].src;
  lightboxImg.alt = images[index].alt;
  lightbox.hidden = false;
  lockScroll();
  lightboxClose.focus();
}

function closeLightbox() {
  lightbox.hidden = true;
  unlockScroll();
}

function showPrev() {
  currentIndex = (currentIndex - 1 + images.length) % images.length;
  lightboxImg.src = images[currentIndex].src;
  lightboxImg.alt = images[currentIndex].alt;
}

function showNext() {
  currentIndex = (currentIndex + 1) % images.length;
  lightboxImg.src = images[currentIndex].src;
  lightboxImg.alt = images[currentIndex].alt;
}

// Открытие по клику и Enter/Space
galleryItems.forEach((item, i) => {
  item.addEventListener('click', () => openLightbox(i));
  item.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openLightbox(i);
    }
  });
});

lightboxClose.addEventListener('click', closeLightbox);
lightboxPrev.addEventListener('click', showPrev);
lightboxNext.addEventListener('click', showNext);

// Закрытие по клику на фон
lightbox.addEventListener('click', e => {
  if (e.target === lightbox) closeLightbox();
});

// Клавиатурная навигация в лайтбоксе
document.addEventListener('keydown', e => {
  if (lightbox.hidden) return;
  if (e.key === 'Escape')      closeLightbox();
  if (e.key === 'ArrowLeft')   showPrev();
  if (e.key === 'ArrowRight')  showNext();
});

// Свайп на мобиле
let touchStartX = 0;

lightbox.addEventListener('touchstart', e => {
  touchStartX = e.changedTouches[0].screenX;
}, { passive: true });

lightbox.addEventListener('touchend', e => {
  const delta = e.changedTouches[0].screenX - touchStartX;
  if (Math.abs(delta) > 40) {
    delta < 0 ? showNext() : showPrev();
  }
}, { passive: true });

// ============================================================
// 2GIS КАРТА — Электромир, Алматы
// Координаты из реального 2GIS объекта (go.2gis.com/r4UsK)
// ============================================================
(function () {
  var mapEl = document.getElementById('dgis-map');
  if (!mapEl) return;

  var script = document.createElement('script');
  script.src = 'https://maps.api.2gis.ru/2.0/loader.js?pkg=full';
  script.async = true;
  script.onload = function () {
    DG.then(function () {
      var lat = 43.24763;
      var lng = 76.851545;
      var coords = [lat, lng];
      var map = DG.map('dgis-map', {
        center: coords,
        zoom: 17,
        fullscreenControl: true
      });
      var icon = DG.divIcon({
        className: '',
        html: '<div class="map-marker"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg></div>',
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -44]
      });

      DG.marker(coords, { icon: icon })
        .addTo(map)
        .bindPopup(
          '<div class="map-popup">' +
            '<div class="map-popup__name">Электромир</div>' +
            '<div class="map-popup__addr">ул. Утеген Батыра 7А, Алматы</div>' +
            '<div class="map-popup__actions">' +
              '<a class="map-popup__btn map-popup__btn--call" href="tel:+77017771755">Позвонить</a>' +
              '<a class="map-popup__btn map-popup__btn--wa" href="https://api.whatsapp.com/send/?phone=77017771755" target="_blank" rel="noopener">WhatsApp</a>' +
            '</div>' +
          '</div>'
        )
        .openPopup();
    });
  };
  document.head.appendChild(script);
}());

// Cookie consent
(function () {
  var banner = document.getElementById('cookieBanner');
  var btn    = document.getElementById('cookieAccept');
  if (!banner || !btn) return;

  if (!localStorage.getItem('cookie_ok')) {
    banner.hidden = false;
  }

  btn.addEventListener('click', function () {
    localStorage.setItem('cookie_ok', '1');
    banner.style.animation = 'none';
    banner.style.transition = 'opacity 0.25s, transform 0.25s';
    banner.style.opacity = '0';
    banner.style.transform = 'translateX(-50%) translateY(1rem)';
    setTimeout(function () { banner.hidden = true; }, 260);
  });
}());