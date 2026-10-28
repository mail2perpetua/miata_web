import { describe, expect, it } from 'vitest';
import { compactNumber, niceTicks } from './chartUtils';

describe('chart axis helpers', () => {
  it('uses whole-number steps for counts', () => {
    expect(niceTicks(2).ticks).toEqual([0, 1, 2]);
    expect(niceTicks(48).ticks.every(Number.isInteger)).toBe(true);
  });

  it('rounds the axis maximum up to a clean value', () => {
    const { top, ticks } = niceTicks(420);
    expect(top).toBeGreaterThanOrEqual(420);
    expect(ticks[0]).toBe(0);
    expect(ticks.at(-1)).toBe(top);
  });

  it('compacts large tick labels', () => {
    expect(compactNumber(950)).toBe('950');
    expect(compactNumber(1500)).toBe('1.5K');
    expect(compactNumber(2_000_000)).toBe('2M');
  });
});
