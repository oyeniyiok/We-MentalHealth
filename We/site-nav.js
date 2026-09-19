/* ==========================================================================
   We Mental Health — shared site navigation behaviour
   Load this as a NORMAL script (no defer) at the end of <body>, BEFORE the
   Google Translate element.js tag — element.js calls googleTranslateElementInit
   the moment it loads, so that function has to already exist.
   ========================================================================== */
(function () {
  'use strict';

  /* Languages offered in the picker. Auto-detect only switches to one of these,
     so the dropdown can always show the language the visitor is actually reading. */
  var SUPPORTED = ['en', 'fr', 'es', 'pt', 'sw'];

  var topbar = document.getElementById('topbar');
  var menuToggle = document.getElementById('menu-toggle');
  var navOverlay = document.getElementById('nav-overlay');

  /* ----------------------------------------------------------------------
     Top bar: solid once scrolled. Pages without a photo hero opt out by
     carrying .always-solid, so the bar never floats over cream.
     ---------------------------------------------------------------------- */
  if (topbar && !topbar.classList.contains('always-solid')) {
    var onScroll = function () {
      topbar.classList.toggle('solid', window.scrollY > 80);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ----------------------------------------------------------------------
     Menu open/close
     ---------------------------------------------------------------------- */
  function setMenu(open) {
    if (!navOverlay || !menuToggle) return;
    navOverlay.classList.toggle('open', open);
    menuToggle.classList.toggle('open', open);
    menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (topbar) topbar.classList.toggle('menu-open', open);
    document.body.style.overflow = open ? 'hidden' : '';

    if (open) {
      var first = navOverlay.querySelector('a, select');
      if (first) first.focus();
    }
  }

  function closeMenu() { setMenu(false); }

  if (menuToggle && navOverlay) {
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-controls', 'nav-overlay');

    menuToggle.addEventListener('click', function () {
      setMenu(!navOverlay.classList.contains('open'));
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && navOverlay.classList.contains('open')) {
        closeMenu();
        menuToggle.focus();
      }
    });

    /* Keep tabbing inside the open menu (the toggle is the last stop) */
    navOverlay.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab' || !navOverlay.classList.contains('open')) return;
      var items = navOverlay.querySelectorAll('a, select');
      if (!items.length) return;
      var first = items[0];
      var last = menuToggle;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    });
    menuToggle.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab' || e.shiftKey || !navOverlay.classList.contains('open')) return;
      var first = navOverlay.querySelector('a, select');
      if (first) { e.preventDefault(); first.focus(); }
    });
  }

  /* ----------------------------------------------------------------------
     Links. Same-page anchors (#about on the homepage) scroll smoothly;
     everything else just closes the menu and navigates normally.
     ---------------------------------------------------------------------- */
  var onIndex = /(^|\/)(index\.html)?$/i.test(window.location.pathname);

  Array.prototype.forEach.call(document.querySelectorAll('.nav-overlay a, a.nav-link'), function (link) {
    link.addEventListener('click', function (e) {
      var href = link.getAttribute('href') || '';
      var hashOnly = href.charAt(0) === '#';
      var indexHash = /^index\.html#/i.test(href);

      /* An index.html#about link clicked while already on the homepage should
         scroll, not reload the page. */
      if (hashOnly || (indexHash && onIndex)) {
        var id = href.slice(href.indexOf('#') + 1);
        var target = (id === 'top' || id === 'home' || id === '')
          ? null
          : document.getElementById(id);

        if (target || id === 'top' || id === 'home' || id === '') {
          e.preventDefault();
          closeMenu();
          var top = target ? target.getBoundingClientRect().top + window.pageYOffset - 76 : 0;
          window.scrollTo({ top: top, behavior: 'smooth' });
          if (history.replaceState) {
            history.replaceState(null, '', id ? '#' + id : window.location.pathname);
          }
          return;
        }
      }
      closeMenu();
    });
  });

  /* ----------------------------------------------------------------------
     Mark the current page in the menu
     ---------------------------------------------------------------------- */
  (function markCurrent() {
    var here = window.location.pathname.split('/').pop().toLowerCase() || 'index.html';
    var hash = window.location.hash.toLowerCase();

    Array.prototype.forEach.call(document.querySelectorAll('.nav-group a'), function (a) {
      var raw = (a.getAttribute('href') || '').toLowerCase();
      var hashAt = raw.indexOf('#');
      var path = hashAt === -1 ? raw : raw.slice(0, hashAt);
      var frag = hashAt === -1 ? '' : raw.slice(hashAt);

      /* index.html, index.html#about and index.html#contact all share a path,
         so a plain path match would light up four links at once. */
      if (path && path === here && frag === hash) {
        a.setAttribute('aria-current', 'page');
      }
    });
  })();

  /* ======================================================================
     Google Translate
     ====================================================================== */

  /* element.js needs this on window before it loads */
  window.googleTranslateElementInit = function () {
    if (!window.google || !google.translate) return;
    new google.translate.TranslateElement(
      { pageLanguage: 'en', layout: google.translate.TranslateElement.InlineLayout.SIMPLE },
      'google_translate_element'
    );
  };

  /* The widget needs a mount point on every page; create it if absent */
  if (!document.getElementById('google_translate_element')) {
    var mount = document.createElement('div');
    mount.id = 'google_translate_element';
    document.body.appendChild(mount);
  }

  /* --------------------------------------------------------------------
     Translate injects its toolbar after this script runs and nudges <body>
     down to clear it. site-nav.css hides every markup version we know of;
     this removes the bar outright and undoes the offset, so a new version
     with different class names still cannot show up at the top of the page.
     Only Translate's own chrome is touched — never the translated text.
     -------------------------------------------------------------------- */
  (function hideTranslateBar() {
    function strip() {
      var bars = document.querySelectorAll(
        'iframe.skiptranslate, .goog-te-banner-frame, #goog-gt-tt, .goog-te-balloon-frame'
      );
      for (var i = 0; i < bars.length; i++) {
        if (bars[i].parentNode) bars[i].parentNode.removeChild(bars[i]);
      }
      if (document.body && document.body.style.top && document.body.style.top !== '0px') {
        document.body.style.top = '0px';
      }
      if (document.documentElement.style.marginTop) {
        document.documentElement.style.marginTop = '';
      }
    }

    strip();

    if (window.MutationObserver) {
      var observer = new MutationObserver(strip);
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class']
      });
      /* Translate settles within a few seconds; stop watching after that
         so we are not observing the whole document for the page's life. */
      setTimeout(function () { observer.disconnect(); strip(); }, 8000);
    } else {
      var ticks = 0;
      var timer = setInterval(function () {
        strip();
        if (++ticks > 40) clearInterval(timer);
      }, 200);
    }
  })();

  function getCookie(name) {
    var match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : null;
  }

  function setLanguage(lang) {
    var hostname = window.location.hostname;
    document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=' + hostname;
    if (lang !== 'en') {
      document.cookie = 'googtrans=/en/' + lang + '; path=/';
      document.cookie = 'googtrans=/en/' + lang + '; path=/; domain=' + hostname;
    }
    try { localStorage.setItem('wmh_lang_decided', '1'); } catch (e) {}
    location.reload();
  }

  var select = document.getElementById('lang-select');
  if (select) {
    var current = getCookie('googtrans');
    current = current ? current.split('/').pop() : 'en';
    select.value = SUPPORTED.indexOf(current) !== -1 ? current : 'en';
    select.addEventListener('change', function () { setLanguage(this.value); });
  }

  /* Auto-detect once per visitor, never overriding a manual choice, and only
     into a language the picker can represent. */
  (function autoDetect() {
    var decided = false;
    try { decided = localStorage.getItem('wmh_lang_decided') === '1'; } catch (e) {}
    if (decided || getCookie('googtrans')) return;

    var browserLang = (navigator.language || navigator.userLanguage || 'en')
      .split('-')[0].toLowerCase();

    if (browserLang === 'en' || SUPPORTED.indexOf(browserLang) === -1) {
      try { localStorage.setItem('wmh_lang_decided', '1'); } catch (e) {}
      return;
    }
    setLanguage(browserLang);
  })();
})();
