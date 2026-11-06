// Portfolio interactions: section navigation, clickable project cards,
// email compose / copy, and the mobile menu. No libraries.
(function () {
  'use strict';

  var header = document.querySelector('.site-header');
  var menuToggle = document.querySelector('.menu-toggle');
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.main-nav a[href^="#"]'));
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. Menu click → scroll to section ---------- */
  function setMenu(open) {
    header.classList.toggle('menu-open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
    menuToggle.querySelector('.material-symbols-outlined').textContent = open ? 'close' : 'menu';
  }

  function scrollToSection(id) {
    var target = document.getElementById(id);
    if (!target) return;
    var top = id === 'home' ? 0 : target.getBoundingClientRect().top + window.pageYOffset - header.offsetHeight;
    window.scrollTo({ top: top, behavior: reduceMotion ? 'auto' : 'smooth' });
    if (history.replaceState) history.replaceState(null, '', '#' + id);
  }

  document.querySelectorAll('a[data-nav]').forEach(function (link) {
    link.addEventListener('click', function (event) {
      var id = link.getAttribute('href').slice(1);
      if (!document.getElementById(id)) return;
      event.preventDefault();
      setMenu(false);
      scrollToSection(id);
    });
  });

  menuToggle.addEventListener('click', function () {
    setMenu(!header.classList.contains('menu-open'));
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && header.classList.contains('menu-open')) {
      setMenu(false);
      menuToggle.focus();
    }
  });
  document.addEventListener('click', function (event) {
    if (header.classList.contains('menu-open') && !header.contains(event.target)) setMenu(false);
  });
  window.matchMedia('(min-width: 768px)').addEventListener('change', function (mq) {
    if (mq.matches) setMenu(false);
  });

  // Highlight the menu item of the section currently in view.
  var sections = navLinks
    .map(function (link) { return document.getElementById(link.getAttribute('href').slice(1)); })
    .filter(Boolean);

  function updateActiveLink() {
    var marker = window.pageYOffset + header.offsetHeight + window.innerHeight * 0.3;
    var current = sections[0];
    sections.forEach(function (section) {
      if (section.offsetTop <= marker) current = section;
    });
    if (window.innerHeight + window.pageYOffset >= document.documentElement.scrollHeight - 2) {
      current = sections[sections.length - 1];
    }
    navLinks.forEach(function (link) {
      var active = link.getAttribute('href') === '#' + current.id;
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  }

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      updateActiveLink();
      ticking = false;
    });
  }, { passive: true });
  window.addEventListener('resize', updateActiveLink);
  updateActiveLink();

  /* ---------- 2. Project card click → related link ---------- */
  document.querySelectorAll('.project-card[data-href]').forEach(function (card) {
    var url = card.getAttribute('data-href');
    var title = card.querySelector('.project-title');
    card.setAttribute('role', 'link');
    card.setAttribute('tabindex', '0');
    if (title) card.setAttribute('aria-label', title.textContent.trim() + ' – 프로젝트 링크 열기');

    function openCard() { window.open(url, '_blank', 'noopener'); }

    card.addEventListener('click', function (event) {
      if (event.target.closest('a')) return; // inner links handle themselves
      if (window.getSelection && String(window.getSelection())) return; // allow selecting text
      openCard();
    });
    card.addEventListener('keydown', function (event) {
      if (event.target !== card) return;
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openCard();
      }
    });
  });

  /* ---------- 3. Email → mail compose window ---------- */
  var EMAIL = 'myeongchungyang@gmail.com';

  document.querySelectorAll('[data-copy]').forEach(function (button) {
    var label = button.querySelector('.copy-label');
    button.addEventListener('click', function () {
      var text = button.getAttribute('data-copy');
      var done = function (ok) {
        label.textContent = ok ? '복사됨!' : '복사 실패';
        setTimeout(function () { label.textContent = '복사'; }, 2000);
      };
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
      } else {
        var area = document.createElement('textarea');
        area.value = text;
        area.setAttribute('readonly', '');
        area.style.position = 'fixed';
        area.style.opacity = '0';
        document.body.appendChild(area);
        area.select();
        var ok = false;
        try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
        document.body.removeChild(area);
        done(ok);
      }
    });
  });

  // The quick message form has no server: it opens a pre-filled email draft.
  var form = document.getElementById('contact-form');
  var feedback = document.getElementById('form-feedback');
  var error = document.getElementById('form-error');

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var name = form.elements.name;
    var email = form.elements.email;
    var message = form.elements.message;
    var invalid = [name, email, message].filter(function (field) { return !field.checkValidity() || !field.value.trim(); });

    [name, email, message].forEach(function (field) {
      field.setAttribute('aria-invalid', String(invalid.indexOf(field) !== -1));
    });
    feedback.hidden = true;
    if (invalid.length) {
      error.hidden = false;
      invalid[0].focus();
      return;
    }
    error.hidden = true;

    var topic = form.querySelector('input[name="topic"]:checked').value;
    var subject = '[' + topic + '] ' + name.value.trim() + '님의 메시지';
    var body = [
      '보낸 사람: ' + name.value.trim(),
      '회신 이메일: ' + email.value.trim(),
      '문의 유형: ' + topic,
      '',
      message.value.trim()
    ].join('\n');

    window.location.href = 'mailto:' + EMAIL +
      '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(body);
    feedback.hidden = false;
  });
})();
