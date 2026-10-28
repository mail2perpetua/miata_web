import { describe, expect, it } from 'vitest';
import * as v from './validation';

describe('client-side validation (mirrors the API rules)', () => {
  it('requires 8+ characters with a letter and a number', () => {
    expect(v.password('short1')).toMatch(/at least 8/);
    expect(v.password('allletters')).toMatch(/number/);
    expect(v.password('12345678')).toMatch(/letter/);
    expect(v.password('Ultra2026')).toBeNull();
  });

  it('validates email and phone formats', () => {
    expect(v.email('not-an-email')).toMatch(/valid email/);
    expect(v.email('arun@miata.local')).toBeNull();
    expect(v.phone('+61 400 111 222')).toBeNull();
    expect(v.phone('abc')).toMatch(/valid phone/);
    expect(v.phone('')).toBeNull();
  });

  it('checks required fields and matching passwords', () => {
    expect(v.required('  ', 'Name')).toBe('Name is required');
    expect(v.matches('a', 'b')).toMatch(/do not match/);
  });
});
