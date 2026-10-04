
/* Hot Miami local play shell — fake RGS over window.fetch. NEVER SHIPPED.
 *
 * This is the copy of record. The live one is dist/playtest/stub.js, which is
 * outside any repo — this file exists so the rig survives a scratch directory
 * being cleaned.
 *
 * The shell is: everything in `build/` copied to dist/playtest/, then these two
 * lines inserted at the top of <head> in index.html:
 *
 *   <script src="./stub-data.js"></script>
 *   <script src="./stub.js"></script>
 *
 * stub-data.js is ~12MB of real published books and is generated, so it is not
 * in the repo. It defines window.__STUB_DATA__ (books + pools per mode) and
 * window.__STUB_CATALOGUE__ (named book ids: maxWin, scatter3/4/5, collector,
 * deadWithFrames).
 *
 * ALWAYS open the shell with the query string, or rgsUrl is empty, the URL
 * becomes https:///wallet/authenticate, the regex below cannot strip an origin
 * that is not there, the request escapes to a real fetch and the screen shows
 * only "TypeError: Failed to fetch":
 *
 *   http://localhost:4190/?hmdebug=1&rgs_url=stub.local&sessionID=playtest&currency=USD&lang=en
 *
 * Replay mode needs more: see design/probe_replay.mjs.
 */
(function () {
  var DATA = window.__STUB_DATA__;
  var MUL = 1000000;
  var balance = 1000 * MUL;          // 1,000.00 to play with
  // Honour ?currency= from the page URL. The RGS is authoritative about this in
  // real play, so a stub that always says USD makes one whole compliance surface
  // untestable: social currencies (XGC/XSC/XEC) must render as GC/SC with no "$"
  // prefix, and with the stub hardcoded there was no way to see whether they did.
  var currency = 'USD';
  try {
    var requested = new URLSearchParams(location.search).get('currency');
    if (requested) currency = requested;
  } catch (e) {}
  var forced = null;
  var stats = { rounds: 0, byMode: {}, wagered: 0, won: 0 };
  var current = null;                // the round in flight
  var roundSeq = 1;

  function pick(mode) {
    var m = DATA[mode] || DATA.BASE;
    var id = forced;
    forced = null;
    if (id == null || !m.books[String(id)]) {
      id = m.pool[Math.floor(Math.random() * m.pool.length)];
    }
    return m.books[String(id)];
  }

  function ladder() {
    var levels = [];
    // A plausible ladder in API units: 0.10 up to 100.00.
    [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100].forEach(function (v) {
      levels.push(Math.round(v * MUL));
    });
    return levels;
  }

  function json(body) {
    return Promise.resolve(new Response(JSON.stringify(body), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    }));
  }

  var routes = {
    '/wallet/authenticate': function () {
      return json({
        status: { statusCode: 'SUCCESS', statusMessage: 'ok' },
        balance: { amount: balance, currency: currency },
        // No round to resume. Set `active: true` with a state array here to
        // exercise the resume path.
        round: null,
        config: {
          minBet: Math.round(0.1 * MUL),
          maxBet: Math.round(100 * MUL),
          stepBet: Math.round(0.1 * MUL),
          defaultBetLevel: Math.round(1 * MUL),
          betLevels: ladder(),
          betModes: {},
          jurisdiction: {
            socialCasino: false, disabledFullscreen: false, disabledTurbo: false,
            disabledSuperTurbo: false, disabledAutoplay: false,
            disabledSlamstop: false, disabledSpacebar: false,
            disabledBuyFeature: false, displayNetPosition: false,
            displayRTP: false, displaySessionTimer: false, minimumRoundDuration: 0
          }
        }
      });
    },

    '/wallet/play': function (body) {
      var mode = body.mode || 'BASE';
      var m = DATA[mode] || DATA.BASE;
      var stake = body.amount;                 // already in API units
      var cost = stake * m.cost;
      if (cost > balance) {
        return json({ error: { code: 'ERR_IPB', message: 'insufficient balance' } });
      }
      balance -= cost;
      var book = pick(mode);
      // payoutMultiplier in books is hundredths (100 = 1x), quoted against the
      // BASE stake, not the cost of a bought mode.
      var mult = Number(book.payoutMultiplier) / 100;
      var payout = Math.round(stake * mult);
      current = { payout: payout, mode: mode };
      stats.rounds += 1;
      stats.wagered += cost;
      stats.byMode[mode] = (stats.byMode[mode] || 0) + 1;
      return json({
        status: { statusCode: 'SUCCESS', statusMessage: 'ok' },
        balance: { amount: balance, currency: currency },
        round: {
          roundID: roundSeq++,
          amount: stake,
          payout: payout,
          payoutMultiplier: mult,
          active: true,
          mode: mode,
          state: book.events
        }
      });
    },

    '/bet/event': function () {
      return json({ status: { statusCode: 'SUCCESS', statusMessage: 'ok' },
                    balance: { amount: balance, currency: currency } });
    },

    '/wallet/end-round': function () {
      if (current) {
        balance += current.payout;
        stats.won += current.payout;
        current = null;
      }
      return json({ status: { statusCode: 'SUCCESS', statusMessage: 'ok' },
                    balance: { amount: balance, currency: currency } });
    }
  };

  // ?forceBook=<id> — force a specific book without touching the console, so a
  // scenario can be handed to someone as a plain link.
  try {
    var fb = new URLSearchParams(location.search).get('forceBook');
    if (fb !== null && fb !== '') { forced = Number(fb); console.log('[stub] forceBook', forced); }
  } catch (e) {}

  var realFetch = window.fetch.bind(window);
  window.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : (input && input.url) || '';
    var path = url.replace(/^https?:\/\/[^/]+/, '').split('?')[0];

    if (path.indexOf('/bet/replay/') === 0) {
      // /bet/replay/{game}/{version}/{mode}/{event}
      //   parts = ['bet','replay',game,version,mode,event]
      //
      // TWO bugs lived here until replay mode was actually run for the first time
      // (2026-08-20), because nothing had ever exercised this path:
      //
      //  1. mode/event were read from parts[3]/parts[4] — the version and the
      //     mode — so every request fell back to the first BASE book and a bonus
      //     replay could not be reproduced at all.
      //  2. the body was wrapped in `{ status, round: {...} }` like /wallet/play.
      //     The real endpoint returns the round FLAT: `Authenticate.svelte`
      //     spreads the response straight into `stateBet.betToResume`, and
      //     GoBananas' own replay harness (design/make_replay_harness.mjs, the
      //     rig used to verify the game that passed review) answers flat too.
      //     Wrapped, `betToResume.state` was undefined and the start card showed
      //     "Payout Multiplier 0x / Total Win $0.00" for a winning round.
      var parts = path.split('/').filter(Boolean);
      var mode = (parts[4] || 'base').toUpperCase();
      var m = DATA[mode] || DATA.BASE;
      var id = Number(parts[5]);
      var book = m.books[String(id)] || m.books[String(m.pool[0])];
      // books quote payoutMultiplier in hundredths (100 = 1x), same as
      // /wallet/play above; the page's ?amount= is the stake it was recorded at.
      var mult = Number(book.payoutMultiplier) / 100;
      var stake = MUL;
      try { stake = Number(new URLSearchParams(location.search).get('amount')) || MUL; } catch (e) {}
      console.log('[stub] replay', mode, 'book', id, 'x' + mult);
      return json({
        id: id,
        payoutMultiplier: mult,
        payout: Math.round(stake * mult),
        state: book.events
      });
    }

    var route = routes[path];
    if (!route) return realFetch(input, init);
    var body = {};
    try { body = JSON.parse((init && init.body) || '{}'); } catch (e) {}
    console.log('[stub]', path, body.mode || '');
    return route(body);
  };

  window.__stub = {
    force: function (id) { forced = id; return 'next round: book ' + id; },
    stats: function () {
      return { rounds: stats.rounds, byMode: stats.byMode,
               balance: balance / MUL, wagered: stats.wagered / MUL,
               won: stats.won / MUL,
               rtpSoFar: stats.wagered ? stats.won / stats.wagered : 0 };
    },
    catalogue: function () { return window.__STUB_CATALOGUE__; },
    setBalance: function (v) { balance = v * MUL; return balance / MUL; }
  };
  console.log('[stub] fake RGS installed;', Object.keys(DATA).join(', '));
})();
