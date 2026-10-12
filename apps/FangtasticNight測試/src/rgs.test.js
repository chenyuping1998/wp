import assert from 'node:assert/strict';
import test from 'node:test';
import { createRgsClient, fromRgsAmount, toRgsAmount } from './rgs.js';

test('Stake Engine round requests use the launched session and integer amounts', async () => {
  const calls = [];
  const request = async (url, options) => {
    calls.push({ path: url.pathname, body: JSON.parse(options.body) });
    return { ok: true, json: async () => ({ status: { statusCode: 'SUCCESS' }, balance: { amount: 123_000_000, currency: 'USD' }, round: { active: true, state: [{ type: 'totalWin', payoutMultiplier: 0 }] } }) };
  };
  const rgs = createRgsClient('?sessionID=abc123&rgs_url=example.com&lang=zh', request);
  await rgs.authenticate();
  await rgs.play('night', 'USD', 0.2);
  await rgs.event(0);
  await rgs.end();
  assert.deepEqual(calls, [
    { path: '/wallet/authenticate', body: { sessionID: 'abc123', language: 'zh' } },
    { path: '/wallet/play', body: { sessionID: 'abc123', mode: 'NIGHT', currency: 'USD', amount: 200_000 } },
    { path: '/bet/event', body: { sessionID: 'abc123', event: '0' } },
    { path: '/wallet/end-round', body: { sessionID: 'abc123' } },
  ]);
  assert.equal(fromRgsAmount(123_000_000), 123);
  assert.equal(toRgsAmount(0.1), 100_000);
});

test('RGS failures cannot be mistaken for a completed round', async () => {
  const rgs = createRgsClient('?sessionID=abc&rgs_url=example.com', async () => ({
    ok: true,
    json: async () => ({ status: { statusCode: 'ERR_IPB', statusMessage: 'Insufficient balance' } }),
  }));
  await assert.rejects(rgs.play('base', 'USD', 1), /Insufficient balance/);
});
