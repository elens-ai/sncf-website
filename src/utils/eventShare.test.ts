import test from 'node:test';
import assert from 'node:assert/strict';
import type { ResolvedEvent } from './events';
import { googleCalendarHref, outlookCalendarHref, shareHref, shareText } from './eventShare';

const moment = (date: Date | null): ResolvedEvent => ({
  event: { id: 'world-water-day', title: 'World Water Day', kind: date ? 'annual' : 'ongoing', month: 3, day: 22, tag: 'United Nations', blurb: 'Clean-up work, & awareness.', pillarId: 'projects' },
  date, days: date ? 10 : null, accentA: '#0d6a8c', accentB: '#6ac8ed',
});
const url = 'https://sncf.elens.in/?invite=world-water-day';

test('a calendar entry is all-day on the next date, ending the day after, even across a month or year', () => {
  const google = new URL(googleCalendarHref(moment(new Date(2026, 11, 31)), url)!);
  assert.equal(google.searchParams.get('dates'), '20261231/20270101');
  assert.equal(google.searchParams.get('text'), 'World Water Day');
  assert.ok(google.searchParams.get('details')!.endsWith(url), 'the invitation travels with the entry');
  const outlook = new URL(outlookCalendarHref(moment(new Date(2027, 2, 22)), url)!);
  assert.equal(outlook.searchParams.get('startdt'), '2027-03-22');
  assert.equal(outlook.searchParams.get('enddt'), '2027-03-23');
  assert.equal(outlook.searchParams.get('allday'), 'true');
});

test('a year-round programme has no calendar entry', () => {
  assert.equal(googleCalendarHref(moment(null), url), null);
  assert.equal(outlookCalendarHref(moment(null), url), null);
});

test('every share carries the invitation, encoded once', () => {
  const text = shareText(moment(new Date(2027, 2, 22)), 'Monday, 22 March 2027');
  assert.equal(text, 'World Water Day — Monday, 22 March 2027. Clean-up work, & awareness.');
  const whatsapp = new URL(shareHref('whatsapp', url, 'World Water Day', text));
  assert.equal(whatsapp.searchParams.get('text'), `${text}\n${url}`);
  assert.equal(new URL(shareHref('facebook', url, 'World Water Day', text)).searchParams.get('u'), url);
  assert.equal(new URL(shareHref('x', url, 'World Water Day', text)).searchParams.get('url'), url);
  assert.ok(shareHref('email', url, 'World Water Day', text).startsWith('mailto:?subject=World%20Water%20Day&body='));
});
