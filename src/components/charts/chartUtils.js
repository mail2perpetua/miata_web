import { useEffect, useRef, useState } from 'react';

/** Width of an element, kept current with ResizeObserver (charts redraw to fit their card). */
export function useElementWidth() {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width];
}

/** Round axis maximum and ~4 clean ticks (0 / 50 / 100 …). */
export function niceTicks(maxValue, count = 4) {
  const max = Math.max(maxValue, 1);
  const raw = max / count;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  // Counts are whole numbers, so steps never go below 1 (no 0.5 ticks).
  const step = Math.max(1, [1, 2, 5, 10].map((m) => m * magnitude).find((s) => s >= raw) ?? raw);
  const top = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = 0; v <= top + step / 2; v += step) ticks.push(Math.round(v * 100) / 100);
  return { top, ticks };
}

export const compactNumber = (n) =>
  n >= 1_000_000 ? `${+(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${+(n / 1000).toFixed(1)}K` : `${n}`;
