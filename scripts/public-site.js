/* Public pages are rendered at build time. Only these controls need JavaScript. */
(() => {
  const menu = document.querySelector('.menu');
  const navigation = document.getElementById('navigation');
  const header = document.querySelector('header');
  const desktop = matchMedia('(min-width: 1281px)');
  const isOpen = () => menu?.getAttribute('aria-expanded') === 'true';
  const fitMenu = () => {
    if (!isOpen() || !navigation || !header) return;
    const bar = document.querySelector('.mobile-bar');
    const barHeight = bar && getComputedStyle(bar).display !== 'none' ? bar.getBoundingClientRect().height : 0;
    const height = window.visualViewport?.height || innerHeight;
    navigation.style.maxHeight = Math.max(44, height - header.getBoundingClientRect().bottom - barHeight - 8) + 'px';
  };
  const setOpen = (open, returnFocus = false) => {
    if (!menu || !navigation) return;
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    navigation.classList.toggle('open', open);
    if (open) fitMenu();
    else navigation.style.removeProperty('max-height');
    if (returnFocus) menu.focus();
  };
  menu?.addEventListener('click', () => setOpen(!isOpen()));
  navigation?.addEventListener('click', event => {
    if (event.target.closest('a')) setOpen(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && isOpen()) setOpen(false, true);
  });
  document.addEventListener('pointerdown', event => {
    if (isOpen() && !navigation.contains(event.target) && !menu.contains(event.target)) setOpen(false);
  });
  desktop.addEventListener('change', () => { if (desktop.matches) setOpen(false); else fitMenu(); });
  window.addEventListener('resize', fitMenu, { passive: true });
  window.addEventListener('scroll', fitMenu, { passive: true });
  window.visualViewport?.addEventListener('resize', fitMenu, { passive: true });
  if (window.ResizeObserver && header) {
    const observer = new ResizeObserver(fitMenu);
    observer.observe(header);
    const bar = document.querySelector('.mobile-bar');
    if (bar) observer.observe(bar);
  }
  const notice = document.querySelector('[data-privacy-notice]');
  const dismiss = document.querySelector('[data-privacy-dismiss]');
  // Persist only dismissal preference, never health or contact information.
  let dismissed = false;
  try { dismissed = localStorage.getItem('smc-privacy-notice-v1') === 'dismissed'; } catch {}
  if (notice && !dismissed) notice.hidden = false;
  dismiss?.addEventListener('click', () => {
    notice.hidden = true;
    try { localStorage.setItem('smc-privacy-notice-v1', 'dismissed'); } catch {}
  });
  const filters = [...document.querySelectorAll('[data-service-filter]')];
  const cards = [...document.querySelectorAll('[data-service-category]')];
  const status = document.querySelector('[data-service-status]');
  filters.forEach(button => button.addEventListener('click', () => {
    const category = button.dataset.serviceFilter;
    filters.forEach(filter => filter.setAttribute('aria-pressed', String(filter === button)));
    cards.forEach(card => { card.hidden = category !== 'all' && card.dataset.serviceCategory !== category; });
    if (status) status.textContent = category === 'all' ? 'Showing all service categories' : 'Showing ' + button.textContent.trim();
  }));
})();
