// The parts with no network in them. Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { _internals as I } from '../src/index.js';

const env = { TOKEN_SECRET: 'test-secret' };
const claim = (over = {}) => ({ id: 'date091', sha: 'abc123', exp: Date.now() + 60_000, ...over });

test('a signed token verifies and comes back intact', async () => {
  const back = await I.verify(env, await I.sign(env, claim()));
  assert.equal(back.id, 'date091');
  assert.equal(back.sha, 'abc123');
});

test('a token is worthless under a different secret', async () => {
  const token = await I.sign(env, claim());
  assert.equal(await I.verify({ TOKEN_SECRET: 'other' }, token), null);
});

test('an expired token is refused', async () => {
  assert.equal(await I.verify(env, await I.sign(env, claim({ exp: Date.now() - 1 }))), null);
});

test('tampering with either half is caught', async () => {
  const [payload, sig] = (await I.sign(env, claim())).split('.');
  assert.equal(await I.verify(env, `${payload}x.${sig}`), null);
  assert.equal(await I.verify(env, `${payload}.${sig.slice(0, -2)}AA`), null);
});

test('a token with no sha is refused', async () => {
  assert.equal(await I.verify(env, await I.sign(env, { id: 'date091', exp: Date.now() + 60_000 })), null);
});

test('garbage is refused', async () => {
  for (const junk of ['xxx', '', null, 'a.b.c']) assert.equal(await I.verify(env, junk), null);
});

test('ids are accepted in the forms a person would type', () => {
  assert.equal(I.normaliseId('091'), 'date091');
  assert.equal(I.normaliseId('date091'), 'date091');
  assert.equal(I.normaliseId(' DATE0912 '), 'date0912');
});

test('anything that could escape the data folder is nothing', () => {
  for (const bad of ['../../index', 'date09/../x', '091.json', '09abc', '0-1', '09', '', null, 42]) {
    assert.equal(I.normaliseId(bad), null, `${bad} should not parse`);
  }
});

test('only the known fields survive cleaning', () => {
  const out = I.clean({ day: ' Friday ', time: '8pm', message: 'hi', label: 'dinner', evil: 'x', id: 'date999' });
  assert.deepEqual(out, { day: 'Friday', time: '8pm', message: 'hi', label: 'dinner' });
});

test('a plan with no day or time is not a plan', () => {
  assert.equal(I.clean({ time: '8pm' }), null);
  assert.equal(I.clean({ day: '   ', time: '8pm' }), null);
  assert.equal(I.clean(null), null);
});

test('a runaway message is truncated, a missing one is empty', () => {
  assert.equal(I.clean({ day: 'Fri', time: '8pm', message: 'a'.repeat(5000) }).message.length, 2000);
  assert.equal(I.clean({ day: 'Fri', time: '8pm' }).message, '');
});

test('the nickname comparison matches only on the whole word', () => {
  assert.ok(I.timingSafeEqual('mo', 'mo'));
  assert.ok(!I.timingSafeEqual('mo', 'mom'));
  assert.ok(!I.timingSafeEqual('', 'mo'));
  assert.ok(!I.timingSafeEqual('mo', 'xx'));
});
