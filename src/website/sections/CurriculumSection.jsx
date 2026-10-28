import { useLayoutEffect, useRef, useState } from 'react';
import { SectionTitle } from './SectionTitle';

const SLIDE_MS = 400; // jQuery slideUp/slideDown default used by the original accordion
const POINT_STYLE = { position: 'relative', paddingLeft: '20px', color: '#5A7184' };
const BULLET_STYLE = {
  position: 'absolute',
  left: '0',
  top: '10px',
  width: '6px',
  height: '6px',
  backgroundColor: '#25a9a0',
  borderRadius: '50%',
};
const BADGE_STYLE = {
  backgroundColor: '#25a9a0',
  color: 'white',
  fontSize: '14px',
  padding: '0px 15px',
  borderRadius: '20px',
  fontWeight: 'bold',
};

/** Accordion body that slides open and closed like the original jQuery accordion. */
function SlidePanel({ open, children }) {
  const ref = useRef(null);
  const mounted = useRef(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!mounted.current) {
      mounted.current = true;
      el.style.display = open ? '' : 'none';
      return undefined;
    }
    el.style.display = '';
    const { paddingTop, paddingBottom } = getComputedStyle(el);
    const height = `${el.scrollHeight}px`;
    const closed = { height: '0px', paddingTop: '0px', paddingBottom: '0px', overflow: 'hidden' };
    const expanded = { height, paddingTop, paddingBottom, overflow: 'hidden' };
    const animation = el.animate(open ? [closed, expanded] : [expanded, closed], { duration: SLIDE_MS, easing: 'ease-in-out' });
    animation.onfinish = () => {
      if (!open) el.style.display = 'none';
    };
    return () => animation.cancel();
  }, [open]);

  return (
    <div className="accrodion-content" ref={ref}>
      {children}
    </div>
  );
}

/** One programme phase on the Courses page: heading plus an accordion of its modules. */
export function CurriculumSection({ phase }) {
  const [openIndex, setOpenIndex] = useState(0);
  const toggle = (index) => setOpenIndex((current) => (current === index ? null : index));

  return (
    <section className="accrodion-one" style={{ padding: '0px 0 100px' }}>
      <div className="container">
        <SectionTitle tagline={phase.tagline} title={phase.title} centered />
        <div className="accrodion-one__wrapper eduact-accrodion">
          {phase.modules.map((module, index) => (
            <div key={module.title} className={`accrodion${openIndex === index ? ' active' : ''}`}>
              <span className="accrodion__icon" onClick={() => toggle(index)}></span>
              <div
                className="accrodion-title"
                role="button"
                tabIndex={0}
                aria-expanded={openIndex === index}
                onClick={() => toggle(index)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), toggle(index))}
              >
                {module.badge ? (
                  <h4 style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    {module.title} <span style={BADGE_STYLE}>{module.badge}</span>
                  </h4>
                ) : (
                  <h4>{module.title}</h4>
                )}
              </div>
              <SlidePanel open={openIndex === index}>
                <div className="inner">
                  <ul style={{ listStyle: 'none', paddingLeft: '10px', margin: '0' }}>
                    {module.points.map((point, i) => (
                      <li key={point} style={i < module.points.length - 1 ? { ...POINT_STYLE, marginBottom: '15px' } : POINT_STYLE}>
                        <span style={BULLET_STYLE}></span> {point}
                      </li>
                    ))}
                  </ul>
                </div>
              </SlidePanel>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
