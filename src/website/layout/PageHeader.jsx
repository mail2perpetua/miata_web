import { PAGE_BANNERS } from '../content/site';

/**
 * Parallax title banner at the top of inner pages. `banner` is one of PAGE_BANNERS (the photo that matches the page);
 * `variant="two"` is the sign-in style, which defaults to the portal photo.
 *
 * The photo is passed as CSS variables on the section (see website.css), not as an inline style on the image element:
 * the theme's parallax plugin moves that element and does not restore its inline style when it is re-initialised.
 */
export function PageHeader({ title, variant, banner = variant === 'two' ? PAGE_BANNERS.portal : PAGE_BANNERS.notFound }) {
  return (
    <section
      className={`page-header page-header--photo${variant === 'two' ? ' page-header--bg-two' : ''}`}
      style={{ '--page-header-image': `url(${banner.image})`, '--page-header-position': banner.position }}
      data-jarallax=""
      data-speed="0.3"
      data-imgposition="50% -100%"
    >
      <div className="page-header__bg jarallax-img"></div>
      <div className="page-header__overlay"></div>
      <div className="container text-center">
        <h2 className="page-header__title">{title}</h2>
      </div>
    </section>
  );
}
