/* Decorative motion and smooth scroll reveal. Never reads or stores participant text. */
(() => {
  'use strict';
  const scene = document.querySelector('.encounter-scene');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(pointer: fine)');

  if (scene) {
    let frame = 0;
    function reset() {
      cancelAnimationFrame(frame);
      frame = 0;
      scene.style.removeProperty('--rx');
      scene.style.removeProperty('--ry');
    }
    scene.addEventListener('pointermove', event => {
      if (reduced.matches || !fine.matches || frame) return;
      const rect = scene.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - .5;
      const y = (event.clientY - rect.top) / rect.height - .5;
      frame = requestAnimationFrame(() => {
        scene.style.setProperty('--rx', `${-y * 12}deg`);
        scene.style.setProperty('--ry', `${x * 16}deg`);
        frame = 0;
      });
    });
    scene.addEventListener('pointerleave', reset);
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) entry.target.classList.toggle('motion-paused', !entry.isIntersecting || document.hidden);
    });
    observer.observe(scene);
    document.addEventListener('visibilitychange', () => {
      scene.classList.toggle('motion-paused', document.hidden);
      if (document.hidden) reset();
    });
    reduced.addEventListener('change', reset);
    window.addEventListener('pagehide', () => { reset(); observer.disconnect(); });
  }

  // Smooth Scroll Reveal Observer
  function initScrollReveal() {
    const revealEls = document.querySelectorAll('.reveal-on-scroll');
    if (!revealEls.length) return;
    if (reduced.matches || !('IntersectionObserver' in window)) {
      revealEls.forEach(el => el.classList.add('is-revealed'));
      return;
    }
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });
    revealEls.forEach(el => revealObserver.observe(el));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScrollReveal);
  } else {
    initScrollReveal();
  }
})();
