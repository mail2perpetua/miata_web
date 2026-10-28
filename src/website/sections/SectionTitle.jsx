/** The theme's section heading: optional tagline (with the arrow ornament) above the title. */
export function SectionTitle({ tagline, title, centered = false, className = '', ...rest }) {
  return (
    <div className={`section-title${centered ? ' text-center' : ''}${className ? ` ${className}` : ''}`} {...rest}>
      {tagline && (
        <h5 className="section-title__tagline">
          {tagline} <TaglineArrow />
        </h5>
      )}
      <h2 className="section-title__title">{title}</h2>
    </div>
  );
}

export function TaglineArrow() {
  return (
    <svg className="arrow-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 55 13">
      <g clipPath="url(#clip0_324_36194)">
        <path d="M10.5406 6.49995L0.700562 12.1799V8.56995L4.29056 6.49995L0.700562 4.42995V0.819946L10.5406 6.49995Z"></path>
        <path d="M25.1706 6.49995L15.3306 12.1799V8.56995L18.9206 6.49995L15.3306 4.42995V0.819946L25.1706 6.49995Z"></path>
        <path d="M39.7906 6.49995L29.9506 12.1799V8.56995L33.5406 6.49995L29.9506 4.42995V0.819946L39.7906 6.49995Z"></path>
        <path d="M54.4206 6.49995L44.5806 12.1799V8.56995L48.1706 6.49995L44.5806 4.42995V0.819946L54.4206 6.49995Z"></path>
      </g>
    </svg>
  );
}

/** The theme's main call-to-action button (renders a router Link, a plain link or a button). */
export function ThemeButton({ as: Component = 'a', secondary = false, arrow = true, className = '', children, ...props }) {
  return (
    <Component className={`eduact-btn${secondary ? ' eduact-btn-second' : ''}${className ? ` ${className}` : ''}`} {...props}>
      <span className="eduact-btn__curve"></span>
      {children}
      {arrow && <i className="icon-arrow"></i>}
    </Component>
  );
}
