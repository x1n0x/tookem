'use strict';

// ============================================================
// STICKY HEADER — добавляет класс .scrolled при скролле > 80px
// ============================================================
const header = document.getElementById('header');

function syncHeaderShadow() {
  header.classList.toggle('scrolled', window.scrollY > 80);
}

if (header) {
  window.addEventListener('scroll', syncHeaderShadow, { passive: true });
  // Перезагрузка посреди страницы / переход по якорю — состояние сразу актуальное
  syncHeaderShadow();
}

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
// БУРГЕР-МЕНЮ — мобильная навигация (оверлей .header__nav.open)
// ============================================================
const navToggle = document.getElementById('navToggle');
const nav = document.getElementById('nav');

function setMenu(open) {
  nav.classList.toggle('open', open);
  if (header) header.classList.toggle('menu-open', open);
  navToggle.classList.toggle('active', open);
  navToggle.setAttribute('aria-expanded', String(open));
  navToggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  if (open) { lockScroll(); } else { unlockScroll(); }
}

if (navToggle && nav) {
  navToggle.addEventListener('click', () => setMenu(!nav.classList.contains('open')));

  // Выбор пункта закрывает оверлей (иначе якорь скроллит под ним)
  nav.addEventListener('click', e => {
    if (e.target.closest('a') && nav.classList.contains('open')) setMenu(false);
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && nav.classList.contains('open')) {
      setMenu(false);
      navToggle.focus();
    }
  });

  // Поворот/ресайз в десктоп: закрываем оверлей и снимаем scroll-lock
  const desktopMq = window.matchMedia('(min-width: 1100px)');
  const onDesktopSwitch = e => {
    if (e.matches && nav.classList.contains('open')) setMenu(false);
  };
  if (desktopMq.addEventListener) {
    desktopMq.addEventListener('change', onDesktopSwitch);
  } else {
    desktopMq.addListener(onDesktopSwitch); // старые Safari
  }
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

// Все остальные .fade-up — через Intersection Observer.
// Сложный селектор внутри :not() ломает querySelectorAll в старых браузерах,
// поэтому фильтруем через closest — работает везде, где есть IntersectionObserver.
document.querySelectorAll('.fade-up').forEach(el => {
  if (!el.closest('.hero')) fadeObserver.observe(el);
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
  // В сетке — лёгкое превью, в лайтбоксе — полный размер из data-full
  return { src: img.dataset.full || img.src, alt: img.alt };
});

let currentIndex = 0;
let lightboxOpener = null; // элемент, с которого открыли лайтбокс — вернём на него фокус

// Лайтбокс есть только на страницах с галереей — на продуктовых страницах пропускаем
const hasLightbox = lightbox && lightboxImg && lightboxClose && lightboxPrev && lightboxNext;

function openLightbox(index, opener) {
  currentIndex = index;
  // Safari не фокусирует кнопки по клику — источник передаём явно
  lightboxOpener = opener || document.activeElement;
  lightboxImg.src = images[index].src;
  lightboxImg.alt = images[index].alt;
  lightbox.hidden = false;
  lockScroll();
  lightboxClose.focus();
}

function closeLightbox() {
  lightbox.hidden = true;
  unlockScroll();
  if (lightboxOpener && typeof lightboxOpener.focus === 'function') {
    lightboxOpener.focus();
  }
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

if (hasLightbox) {
  // Карточки — настоящие кнопки: клик и клавиатура работают нативно
  document.querySelectorAll('.gallery__btn').forEach((btn, i) => {
    btn.addEventListener('click', () => openLightbox(i, btn));
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
    // Ловушка фокуса: Tab не должен уходить за пределы модального окна
    if (e.key === 'Tab') {
      const focusables = [lightboxClose, lightboxPrev, lightboxNext];
      const idx = focusables.indexOf(document.activeElement);
      if (e.shiftKey && (idx <= 0)) {
        e.preventDefault();
        focusables[focusables.length - 1].focus();
      } else if (!e.shiftKey && idx === focusables.length - 1) {
        e.preventDefault();
        focusables[0].focus();
      } else if (idx === -1) {
        e.preventDefault();
        focusables[0].focus();
      }
    }
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
}

// ============================================================
// 2GIS КАРТА — Электромир, Алматы
// Координаты из реального 2GIS объекта (go.2gis.com/r4UsK)
// ============================================================
(function () {
  var mapEl = document.getElementById('dgis-map');
  if (!mapEl) return;

  var mapLoaded = false;

  function loadMap() {
    if (mapLoaded) return;
    mapLoaded = true;

  var script = document.createElement('script');
  script.src = 'https://maps.api.2gis.ru/2.0/loader.js?pkg=full';
  script.async = true;
  // API недоступен (блокировщик, сбой сети) — прячем пустой серый блок,
  // ссылки «Открыть в 2ГИС / Яндекс Карты» над картой остаются
  script.onerror = function () {
    mapLoaded = false;
    mapEl.style.display = 'none';
  };
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
  }

  // Загружаем тяжёлый API карты (~500 КБ) только когда блок приближается к вьюпорту
  if ('IntersectionObserver' in window) {
    var mapObserver = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) {
        mapObserver.disconnect();
        loadMap();
      }
    }, { rootMargin: '600px 0px' });
    mapObserver.observe(mapEl);
  } else {
    loadMap();
  }
}());

// ============================================================
// ФОРМА ЗАЯВКИ — без бэкенда: собирает письмо и открывает
// почтовый клиент на info@tookem.kz
// ============================================================
(function () {
  var form = document.getElementById('requestForm');
  if (!form) return;

  var status = document.getElementById('requestFormStatus');
  var button = form.querySelector('button[type="submit"]');

  function showStatus(html, isError) {
    status.innerHTML = html;
    status.classList.toggle('is-error', isError);
    status.hidden = false;
  }

  // Сервер не принял заявку — не теряем её: тот же текст в WhatsApp или письмом
  function showFallback(data) {
    var text =
      'Заявка с сайта tookem.kz\n' +
      'Имя / компания: ' + data.get('name') + '\n' +
      'Контакт: ' + data.get('contact') + '\n\n' +
      data.get('message');
    var wa = 'https://api.whatsapp.com/send/?phone=77017771755&text=' + encodeURIComponent(text);
    var mail = 'mailto:info@tookem.kz?subject=' + encodeURIComponent('Заявка с сайта tookem.kz') +
      '&body=' + encodeURIComponent(text);
    showStatus(
      'Заявка не отправилась с сайта. Ваш текст сохранён — отправьте его ' +
      '<a href="' + wa + '" target="_blank" rel="noopener noreferrer">в WhatsApp</a> или ' +
      '<a href="' + mail + '">письмом на info@tookem.kz</a>, либо позвоните: ' +
      '<a href="tel:+77017771755">+7 701 777 17 55</a>.',
      true
    );
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var data = new FormData(form);
    button.disabled = true;
    status.hidden = true;

    fetch(form.action, { method: 'POST', body: data })
      .then(function (res) { return res.json(); })
      .then(function (json) {
        if (!json.ok) throw new Error(json.error);
        form.reset();
        showStatus('Заявка отправлена. Свяжемся с вами по указанному контакту.', false);
        form.dispatchEvent(new Event('request-sent'));
      })
      .catch(function () { showFallback(data); })
      .then(function () { button.disabled = false; });
  });
}());

// ============================================================
// ЦЕЛИ АНАЛИТИКИ — клики по контактам и отправка формы.
// Уходят и в Метрику (reachGoal), и в GA4 (event) с одним именем.
// ============================================================
(function () {
  function goal(name) {
    try {
      if (typeof ym === 'function') ym(97753570, 'reachGoal', name);
      if (typeof gtag === 'function') gtag('event', name);
    } catch (e) {}
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a') : null;
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (href.indexOf('tel:') === 0) goal('click_phone');
    else if (href.indexOf('mailto:') === 0) goal('click_email');
    else if (href.indexOf('api.whatsapp.com') !== -1) goal('click_whatsapp');
  });

  var requestFormGoal = document.getElementById('requestForm');
  if (requestFormGoal) {
    // Цель — только когда заявка реально ушла на сервер
    requestFormGoal.addEventListener('request-sent', function () { goal('form_submit'); });
  }
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
    // Согласие получено — разрешаем GA4 использовать куки аналитики
    if (typeof gtag === 'function') {
      gtag('consent', 'update', { analytics_storage: 'granted' });
    }
    // Снимаем CSS-анимацию — иначе она блокирует transition
    banner.style.animation = 'none';
    // Форс-reflow: браузер фиксирует текущее состояние (opacity:1)
    void banner.offsetWidth;
    // Теперь transition отработает плавно
    banner.classList.add('is-hiding');
    banner.addEventListener('transitionend', function () {
      banner.hidden = true;
    }, { once: true });
    // Страховка: если transitionend не сработал (reduced motion, скрытая вкладка)
    setTimeout(function () { banner.hidden = true; }, 700);
  });
}());