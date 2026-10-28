import { useState } from 'react';
import { useForm } from '@/hooks/useForm';
import { api } from '@/services/api';
import { CONTACT } from '../content/site';
import { FormMessage } from './FormMessage';
import { ThemeButton } from './SectionTitle';

// Same rules and wording as the original jquery-validate setup on this form.
const REQUIRED = 'This field is required.';
const INVALID_EMAIL = 'Please enter a valid email address.';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMPTY = { name: '', email: '', phone: '', subject: '', message: '' };

function validate(values) {
  const email = values.email.trim();
  return {
    name: values.name.trim() ? null : REQUIRED,
    email: !email ? REQUIRED : EMAIL_PATTERN.test(email) ? null : INVALID_EMAIL,
    subject: values.subject.trim() ? null : REQUIRED,
    message: values.message.trim() ? null : REQUIRED,
  };
}

function Field({ form, name, as: Input = 'input', ...props }) {
  const error = form.errors[name];
  return (
    <>
      <Input
        id={`contact-${name}`}
        name={name}
        value={form.values[name]}
        onChange={form.set(name)}
        className={error ? 'error' : undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `contact-${name}-error` : undefined}
        {...props}
      />
      {error && (
        <label id={`contact-${name}-error`} className="error" htmlFor={`contact-${name}`}>
          {error}
        </label>
      )}
    </>
  );
}

/** "Contact with Us" form: stores the enquiry through the API, which notifies the admissions team. */
export function ContactFormSection() {
  const form = useForm(EMPTY);
  const [sent, setSent] = useState(null);

  const onSubmit = form.submit(async (values) => {
    setSent(null);
    const { data } = await api.post('/enquiries', {
      name: values.name.trim(),
      email: values.email.trim(),
      phone: values.phone.trim() || null,
      subject: values.subject.trim() || null,
      message: values.message.trim(),
    });
    setSent(data.message);
    form.setValues(EMPTY);
  }, validate);

  return (
    <section className="contact-one">
      <div className="container wow fadeInUp" data-wow-delay="300ms">
        <div className="section-title text-center">
          <h2 className="section-title__title">Contact with Us</h2>
        </div>
        <div className="contact-one__form-box text-center">
          <form className="contact-one__form contact-form-validated" onSubmit={onSubmit} noValidate>
            <div className="row">
              <div className="col-md-6">
                <div className="contact-one__input-box">
                  <Field form={form} name="name" type="text" placeholder="Your Name" autoComplete="name" />
                </div>
              </div>
              <div className="col-md-6">
                <div className="contact-one__input-box">
                  <Field form={form} name="email" type="email" placeholder="Email Address" autoComplete="email" />
                </div>
              </div>
              <div className="col-md-6">
                <div className="contact-one__input-box">
                  <Field form={form} name="phone" type="text" placeholder="Phone" autoComplete="tel" />
                </div>
              </div>
              <div className="col-md-6">
                <div className="contact-one__input-box">
                  <Field form={form} name="subject" type="text" placeholder="Subject" />
                </div>
              </div>
              <div className="col-md-12">
                <div className="contact-one__input-box text-message-box">
                  <Field form={form} name="message" as="textarea" placeholder="Write a Message" />
                </div>
                <div className="contact-one__btn-box">
                  <ThemeButton
                    as="button"
                    type="submit"
                    secondary
                    disabled={form.submitting}
                    style={form.submitting ? { opacity: 0.7 } : undefined}
                  >
                    Send a Message
                  </ThemeButton>
                </div>
              </div>
            </div>
          </form>
          {form.formError && <FormMessage error>{form.formError}</FormMessage>}
          {sent && <FormMessage>{sent}</FormMessage>}
        </div>
      </div>
    </section>
  );
}

export function ContactInfoSection() {
  return (
    <section className="contact-info">
      <div className="container">
        <ul className="contact-info__wrapper">
          <li>
            <div className="contact-info__icon">
              <span className="icon-Call"></span>
            </div>
            <p className="contact-info__title">For counselling</p>
            <h4 className="contact-info__text">
              <a href={`tel:${CONTACT.phone}`}>{CONTACT.phone}</a>
            </h4>
            <p className="contact-info__title">For other queries</p>
            <h4 className="contact-info__text">
              <a href={`tel:${CONTACT.officePhone}`}>{CONTACT.officePhone}</a>
            </h4>
          </li>
          <li className="active">
            <div className="contact-info__icon">
              <span className="icon-Email"></span>
            </div>
            <p className="contact-info__title">Send Email</p>
            <h4 className="contact-info__text">
              <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
            </h4>
            <h4 className="contact-info__text">
              <a href={`mailto:${CONTACT.admissionsEmail}`}>{CONTACT.admissionsEmail}</a>
            </h4>
          </li>
          <li>
            <div className="contact-info__icon">
              <span className="icon-Location"></span>
            </div>
            <p className="contact-info__title">Visit Anytime</p>
            <h4 className="contact-info__text">{CONTACT.address}</h4>
          </li>
        </ul>
      </div>
    </section>
  );
}

export function MapSection() {
  return (
    <section className="google-map">
      <iframe
        title="MIATA campus — Level 3, Queen St, Melbourne"
        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3151.795178352432!2d144.95941877569504!3d-37.818266271974345!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6ad642b339bd6f71%3A0xf5cc5c48e07ca88e!2s3%20Queen%20St%2C%20Melbourne%20VIC%203000%2C%20Australia!5e0!3m2!1sen!2sin!4v1791119443532!5m2!1sen!2sin"
        className="google-map__one"
        allowFullScreen
        loading="lazy"
      ></iframe>
    </section>
  );
}
