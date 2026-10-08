import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAULT_AWARDS } from './awards';
import { groupRecognitions, recognitionCategory } from './recognition';

test('the archive partitions every record exactly once', () => {
  const groups = groupRecognitions(DEFAULT_AWARDS);
  assert.equal(groups.tweets.length, 14);
  assert.equal(groups.awards.length, 24);
  assert.equal(groups.press.length, 2);
  assert.deepEqual(Object.values(groups).flat().map(item => item.id).sort(), DEFAULT_AWARDS.map(item => item.id).sort());
});

test('legacy publications preserve curated sections and CMS can reclassify a record', () => {
  const news = DEFAULT_AWARDS.find(item => item.id === 'zee-news-covid-centre-2021')!;
  assert.equal(recognitionCategory({ ...news, category: undefined }), 'press');
  assert.equal(recognitionCategory({ ...news, category: 'tweets' }), 'tweets');
  assert.equal(recognitionCategory({ id: 'new-certificate', title: 'Certificate', awardedBy: 'Institution', year: '' }), 'awards');
});
