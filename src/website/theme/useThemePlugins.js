import { useLayoutEffect, useRef } from 'react';
import { loadThemePlugins } from './themeAssets';

// React port of the original theme script (assets/js/eduact.js), limited to what the MIATA pages use.
// Each behaviour is set up for the elements under one root and torn down again on unmount, so moving
// between pages never leaves carousels, observers or listeners behind.

const parseOptions = (value) => (typeof value === 'object' ? value : JSON.parse(value || '{}'));

/** Scroll reveal, as WOW.js did it: hidden until the element enters the viewport, then the animate.css animation runs. */
function revealOnScroll(elements) {
  if (!elements.length) return undefined;
  const pending = new Map(); // element → its original style attribute (restored if it is never revealed)
  const observer = new IntersectionObserver((entries) => {
    for (const { target, isIntersecting } of entries) {
      if (!isIntersecting) continue;
      observer.unobserve(target);
      const { animationName } = pending.get(target);
      pending.delete(target);
      target.style.visibility = 'visible';
      target.style.animationName = animationName;
      target.classList.add('animated');
    }
  });
  for (const el of elements) {
    pending.set(el, { style: el.getAttribute('style'), animationName: el.style.animationName });
    const { wowDuration, wowDelay, wowIteration } = el.dataset;
    el.style.visibility = 'hidden';
    if (wowDuration) el.style.animationDuration = wowDuration;
    if (wowDelay) el.style.animationDelay = wowDelay;
    if (wowIteration) el.style.animationIterationCount = wowIteration;
    el.style.animationName = 'none';
    observer.observe(el);
  }
  return () => {
    observer.disconnect();
    for (const [el, { style }] of pending) {
      if (style === null) el.removeAttribute('style');
      else el.setAttribute('style', style);
    }
  };
}

/** Fact counters: count from the current text up to data-stop over data-speed ms once visible. */
function countUp(boxes) {
  if (!boxes.length) return undefined;
  let stopped = false;
  const running = new Map(); // box → original text, until the count finishes
  const observer = new IntersectionObserver((entries) => {
    for (const { target: box, isIntersecting } of entries) {
      if (!isIntersecting) continue;
      observer.unobserve(box);
      const text = box.querySelector('.count-text');
      if (!text || box.classList.contains('counted')) continue;
      box.classList.add('counted');
      running.set(box, text.textContent);
      const from = parseFloat(text.textContent) || 0;
      const to = Number(text.dataset.stop) || 0;
      const duration = Number(text.dataset.speed) || 0;
      const start = performance.now();
      const step = (now) => {
        if (stopped) return;
        const progress = duration ? Math.min(1, (now - start) / duration) : 1;
        text.textContent = String(progress < 1 ? Math.floor(from + (to - from) * progress) : to);
        if (progress < 1) requestAnimationFrame(step);
        else running.delete(box);
      };
      requestAnimationFrame(step);
    }
  });
  boxes.forEach((box) => observer.observe(box));
  return () => {
    stopped = true;
    observer.disconnect();
    for (const [box, original] of running) {
      box.classList.remove('counted');
      box.querySelector('.count-text').textContent = original;
    }
  };
}

/** Lets a column's content bleed to the viewport edge (the home page hero carousel). */
function stretchColumns(elements) {
  if (!elements.length) return undefined;
  const apply = () => {
    const viewport = document.documentElement.clientWidth;
    for (const el of elements) {
      el.style.marginLeft = '';
      el.style.marginRight = '';
      const row = el.closest('.row');
      const col = el.closest('[class^="col-"]');
      if (!row || !col) continue;
      const box = el.getBoundingClientRect();
      const rowBox = row.getBoundingClientRect();
      const colBox = col.getBoundingClientRect();
      const rowStyle = getComputedStyle(row);
      const elStyle = getComputedStyle(el);
      const rowLeft = rowBox.left + (parseFloat(rowStyle.paddingLeft) || 0);
      const rowRight = viewport - rowBox.right + (parseFloat(rowStyle.paddingRight) || 0);
      let left = 0;
      let right = 0;
      if (Math.round(rowLeft) === Math.round(colBox.left)) left = (parseFloat(elStyle.marginLeft) || 0) - box.left;
      if (Math.round(rowRight) === Math.round(viewport - colBox.right))
        right = (parseFloat(elStyle.marginRight) || 0) - (viewport - box.right);
      el.style.marginLeft = `${left}px`;
      el.style.marginRight = `${right}px`;
    }
  };
  apply();
  window.addEventListener('resize', apply);
  return () => {
    window.removeEventListener('resize', apply);
    for (const el of elements) {
      el.style.marginLeft = '';
      el.style.marginRight = '';
    }
  };
}

/** Owl carousels, the video popup, hover tilt and parallax page headers (jQuery / vendor plugins). */
function vendorPlugins(pick) {
  const $ = window.jQuery;
  const carousels = pick('.eduact-owl__carousel');
  carousels.forEach((el) => $(el).owlCarousel(parseOptions(el.dataset.owlOptions)));

  const popups = pick('.video-popup');
  if (popups.length) {
    $(popups).magnificPopup({ type: 'iframe', mainClass: 'mfp-fade', removalDelay: 160, preloader: true, fixedContentPos: false });
  }

  const tilts = pick('.eduact-tilt');
  tilts.forEach((el) => $(el).tilt(parseOptions(el.dataset.tiltOptions)));

  const parallax = pick('[data-jarallax]');
  if (parallax.length) window.jarallax(parallax);

  return () => {
    carousels.forEach((el) => $(el).trigger('destroy.owl.carousel'));
    if (popups.length) {
      $(popups).off('click.magnificPopup');
      $.magnificPopup.close();
    }
    tilts.forEach((el) => $(el).tilt.destroy.call($(el)));
    if (parallax.length) window.jarallax(parallax, 'destroy');
  };
}

/**
 * Applies the theme behaviour to the markup under the returned ref.
 * `exclude` skips elements inside a matching ancestor (the layout leaves page content to the page itself).
 */
export function useThemePlugins(exclude) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return undefined;
    const pick = (selector) => [...root.querySelectorAll(selector)].filter((el) => !exclude || !el.closest(exclude));
    // Reveal runs before the first paint so animated elements never flash into view.
    const cleanups = [
      revealOnScroll(pick('.wow')),
      countUp(pick('.count-box')),
      stretchColumns(pick('.row .eduact-stretch-element-inside-column')),
    ];
    let active = true;
    loadThemePlugins()
      .then(() => active && cleanups.push(vendorPlugins(pick)))
      .catch((err) => console.warn(`[website] ${err.message}`));
    return () => {
      active = false;
      cleanups.forEach((cleanup) => cleanup?.());
    };
  }, [exclude]);

  return ref;
}
