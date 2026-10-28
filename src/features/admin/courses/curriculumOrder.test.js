import { describe, expect, it } from 'vitest';
import { moveItem, moveItemBy } from './curriculumOrder';

const items = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];
const ids = (list) => list.map((item) => item.id);

describe('curriculum ordering', () => {
  it('moves a module or lesson before or after a drop target', () => {
    expect(ids(moveItem(items, 1, 3))).toEqual([2, 1, 3, 4]);
    expect(ids(moveItem(items, 1, 3, true))).toEqual([2, 3, 1, 4]);
    expect(ids(moveItem(items, 4, 2))).toEqual([1, 4, 2, 3]);
    expect(ids(moveItem(items, 4, 2, true))).toEqual([1, 2, 4, 3]);
  });

  it('supports keyboard movement by one position and leaves boundary moves unchanged', () => {
    expect(ids(moveItemBy(items, 2, -1))).toEqual([2, 1, 3, 4]);
    expect(ids(moveItemBy(items, 2, 1))).toEqual([1, 3, 2, 4]);
    expect(moveItemBy(items, 1, -1)).toBe(items);
    expect(moveItemBy(items, 4, 1)).toBe(items);
  });

  it('leaves the order unchanged for missing or identical items', () => {
    expect(moveItem(items, 1, 1)).toBe(items);
    expect(moveItem(items, 9, 2)).toBe(items);
    expect(moveItem(items, 1, 9)).toBe(items);
  });
});
