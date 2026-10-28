export function moveItem(items, sourceId, targetId, after = false) {
  const sourceIndex = items.findIndex((item) => item.id === sourceId);
  const targetIndex = items.findIndex((item) => item.id === targetId);
  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return items;

  const next = [...items];
  const [item] = next.splice(sourceIndex, 1);
  let insertIndex = targetIndex + Number(after);
  if (sourceIndex < insertIndex) insertIndex -= 1;
  next.splice(insertIndex, 0, item);
  return next;
}

export function moveItemBy(items, itemId, delta) {
  const index = items.findIndex((item) => item.id === itemId);
  const target = index + delta;
  if (index < 0 || target < 0 || target >= items.length) return items;
  return moveItem(items, itemId, items[target].id, delta > 0);
}
