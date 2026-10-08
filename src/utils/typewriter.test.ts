import { test } from 'node:test';
import assert from 'node:assert/strict';
import { typewriterLines } from './typewriter';

test('Hindi typing preserves graphemes, line order and the five second completion', () => {
  const input = ['मानव को हो मानव प्यारा', 'इक दूजे का बने सहारा'];
  const rows = typewriterLines(input, 5000);
  assert.deepEqual(rows.map(row => row.map(letter => letter.text).join('')), input);
  assert.ok(rows[0].some(letter => letter.text === 'मा'));
  assert.ok(rows[1][0].at > rows[0].at(-1)!.at);
  assert.equal(rows[1].at(-1)!.at, 5000);
});
