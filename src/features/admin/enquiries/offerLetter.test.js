import { describe, expect, it } from 'vitest';
import { courseEndDate, feeSummary, letterAmount, sourceList, toFormValues, toPayload, validateOffer } from './offerLetter';

const draft = {
  studentName: 'Priya Sharma',
  address: '12 Main St\nColombo',
  country: 'Sri Lanka',
  courseId: 1,
  courseTitle: 'PG Diploma in Ultrasound',
  studyMode: null,
  startDate: '2026-10-15',
  endDate: '2027-10-15',
  currency: 'AUD',
  tuitionFee: 36000,
  depositAmount: 10000,
  fullPaymentDiscount: 6000,
};

describe('offer letter helpers', () => {
  it('ends the course one duration after it starts', () => {
    expect(courseEndDate('2026-10-15', 12, 'months')).toBe('2027-10-15');
    expect(courseEndDate('2027-01-31', 1, 'months')).toBe('2027-02-28');
    expect(courseEndDate('2026-10-19', 26, 'weeks')).toBe('2027-04-19');
    expect(courseEndDate('', 12, 'months')).toBeNull();
  });

  it('works out both payment options', () => {
    expect(feeSummary({ tuitionFee: '36000', depositAmount: '10000', fullPaymentDiscount: '6000' })).toMatchObject({
      balance: 26000,
      fullPayment: 30000,
      valid: true,
    });
    expect(feeSummary({ tuitionFee: '8000', depositAmount: '10000', fullPaymentDiscount: '' }).valid).toBe(false);
    expect(letterAmount(36000, 'AUD')).toBe('AUD 36,000');
    expect(letterAmount(1250.5, 'AUD')).toBe('AUD 1,250.50');
  });

  it('round-trips the draft through the form', () => {
    expect(toPayload(toFormValues(draft))).toEqual(draft);
    expect(toPayload(toFormValues({ ...draft, address: null, courseId: null, fullPaymentDiscount: 0 }))).toMatchObject({
      address: null,
      courseId: null,
      fullPaymentDiscount: 0,
    });
  });

  it('flags the same mistakes as the API', () => {
    const errors = validateOffer({
      ...toFormValues(draft),
      studentName: ' ',
      endDate: '2026-01-01',
      depositAmount: '40000',
      fullPaymentDiscount: '36000',
    });
    expect(Object.keys(errors).filter((k) => errors[k])).toEqual(['studentName', 'endDate', 'depositAmount', 'fullPaymentDiscount']);
    expect(Object.values(validateOffer(toFormValues(draft))).filter(Boolean)).toEqual([]);
  });

  it('lists where the draft came from', () => {
    expect(sourceList(['enquiry', 'student profile', 'course catalogue'])).toBe(
      'the enquiry, the student profile and the course catalogue',
    );
    expect(sourceList(['enquiry'])).toBe('the enquiry');
  });
});
