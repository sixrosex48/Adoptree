import assert from 'node:assert/strict';
import test from 'node:test';
import { createPreview } from './app';
import { species, zones } from './data';

test('catalog references remain valid', () => {
  assert.ok(species.length > 0);
  assert.ok(zones.length > 0);
  assert.ok(zones.every((zone) => zone.coordinates.length === 2));
});

test('preview does not represent a charge or a planting', () => {
  const preview = createPreview({ speciesId: species[0].id, zoneId: zones[0].id, name: 'Mi árbol' });
  assert.equal(preview.charged, false);
  assert.equal(preview.plantedAt, null);
  assert.equal(preview.amountUsd, 5);
});

test('preview rejects unknown zones and invalid names', () => {
  assert.throws(() => createPreview({ speciesId: species[0].id, zoneId: 'desconocida', name: 'Mi árbol' }));
  assert.throws(() => createPreview({ speciesId: species[0].id, zoneId: zones[0].id, name: ' ' }));
});
