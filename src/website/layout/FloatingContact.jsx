import { CONTACT } from '../content/site';

const BUTTON = {
  position: 'fixed',
  right: '20px',
  width: '60px',
  height: '60px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
  zIndex: 9999,
  textDecoration: 'none',
  cursor: 'pointer',
};

/** Fixed WhatsApp and call buttons in the bottom-right corner of every website page. */
export function FloatingContact() {
  const whatsappUrl = `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(CONTACT.whatsappMessage)}`;
  return (
    <>
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        style={{ ...BUTTON, bottom: '20px', backgroundColor: '#25D366' }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="white" viewBox="0 0 32 32">
          <path d="M16.002 2.986c-7.283 0-13.175 5.893-13.175 13.175 0 2.325.607 4.596 1.759 6.598l-1.845 6.742 6.923-1.812c1.933 1.06 4.119 1.621 6.338 1.621h.001c7.284 0 13.176-5.893 13.176-13.176.001-7.283-5.892-13.176-13.177-13.176zm0 23.91c-1.965 0-3.893-.524-5.567-1.515l-.397-.236-4.105 1.074 1.099-4.004-.259-.412c-1.101-1.755-1.681-3.782-1.681-5.844 0-6.128 4.988-11.116 11.116-11.116 2.972 0 5.768 1.158 7.872 3.261s3.262 4.9 3.262 7.871c0 6.128-4.989 11.117-11.117 11.117zm6.116-8.398c-.335-.167-1.977-.975-2.285-1.086-.307-.112-.531-.167-.755.167s-.867 1.086-1.063 1.309c-.195.223-.39.251-.725.084-.335-.168-1.413-.521-2.69-1.664-1-.893-1.675-1.993-1.87-2.328-.195-.334-.021-.514.146-.681.15-.15.334-.39.501-.584.167-.195.223-.335.334-.557.112-.223.056-.418-.028-.585-.083-.167-.754-1.82-1.032-2.495-.272-.655-.55-.566-.754-.577l-.642-.012c-.223 0-.585.084-.892.418s-1.17 1.144-1.17 2.788 1.198 3.233 1.363 3.456c.167.223 2.36 3.6 5.72 5.048.8.344 1.422.549 1.907.703.801.255 1.53.219 2.106.133.642-.095 1.977-.807 2.258-1.587.279-.781.279-1.451.195-1.587-.084-.134-.306-.218-.642-.384z" />
        </svg>
      </a>
      <a
        href={`tel:${CONTACT.callback}`}
        aria-label="Call MIATA"
        style={{ ...BUTTON, bottom: '95px', backgroundColor: '#0e3159', border: '2px solid white' }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="white" viewBox="0 0 24 24">
          <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011-.24c1.12.37 2.33.57 3.59.57a1 1 0 011 1V20a1 1 0 01-1 1C10.07 21 3 13.93 3 5a1 1 0 011-1h3.5a1 1 0 011 1c0 1.26.2 2.47.57 3.59a1 1 0 01-.24 1l-2.21 2.2z" />
        </svg>
      </a>
    </>
  );
}
