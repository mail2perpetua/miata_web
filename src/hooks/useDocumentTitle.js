import { useEffect } from 'react';

/** Sets the tab title: "Page · MIATA Portal" in the dashboards, "Page · MIATA" on the website. */
export function useDocumentTitle(title, { site = false } = {}) {
  useEffect(() => {
    const brand = site ? 'MIATA' : 'MIATA Portal';
    document.title = title ? `${title} · ${brand}` : brand;
  }, [title, site]);
}
