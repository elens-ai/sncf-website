import test from 'node:test';
import assert from 'node:assert/strict';
import { youtubeId } from './youtube';

test('project films accept standard, shared, embed, short and live YouTube links', () => {
  for (const source of ['M7lc1UVf-VE', 'https://www.youtube.com/watch?v=M7lc1UVf-VE&t=5', 'https://youtu.be/M7lc1UVf-VE?si=test', 'https://www.youtube-nocookie.com/embed/M7lc1UVf-VE', 'https://youtube.com/shorts/M7lc1UVf-VE', 'https://youtube.com/live/M7lc1UVf-VE']) {
    assert.equal(youtubeId(source), 'M7lc1UVf-VE');
  }
});
test('project films reject unrelated hosts, HTML, playlists and malformed ids', () => {
  for (const source of [null, '', 'https://youtube.com.evil.test/watch?v=M7lc1UVf-VE', 'https://evil.test/embed/M7lc1UVf-VE', 'javascript:alert(1)', '<iframe src="x">', 'https://youtube.com/playlist?list=123', 'https://youtube.com/watch?v=bad']) assert.equal(youtubeId(source), null);
});
