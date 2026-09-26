import test from 'node:test';
import assert from 'node:assert/strict';
import { slug } from './slug';

test('slug turns a project title into its section anchor', () => {
  assert.equal(slug('Project Oneness Vann'), 'project-oneness-vann');
  assert.equal(slug('Watershed Programme'), 'watershed-programme');
  assert.equal(slug('Sewing & Beautician'), 'sewing-beautician');
});

test('slug trims leading and trailing punctuation', () => {
  assert.equal(slug('  (Adopted) Villages!  '), 'adopted-villages');
});
