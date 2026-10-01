import test from 'node:test';
import assert from 'node:assert/strict';
import { checkRegistry } from '../../scripts/cms-registry';

/* Every CMS text/image slot must be one the site actually reads, and every slot
   the site reads must be offered in the CMS. Fix with: npm run cms:registry -- --write */
test('the CMS slot registry matches the code that reads it', () => {
  const result = checkRegistry();
  assert.deepEqual(result.missingCopy, [], 'text the site reads but the CMS does not offer');
  assert.deepEqual(result.staleCopy, [], 'text slots nothing on the site reads');
  assert.deepEqual(result.missingAssets, [], 'images the site reads but the CMS does not offer');
  assert.deepEqual(result.staleAssets, [], 'image slots nothing on the site reads');
});
