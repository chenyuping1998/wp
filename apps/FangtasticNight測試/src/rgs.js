const AMOUNT_SCALE = 1_000_000;

export const fromRgsAmount = amount => Number(amount) / AMOUNT_SCALE;
export const toRgsAmount = amount => Math.round(Number(amount) * AMOUNT_SCALE);

export function createRgsClient(search = window.location.search, request = fetch) {
  const params = new URLSearchParams(search);
  const sessionID = params.get('sessionID');
  const host = params.get('rgs_url');
  if (!sessionID && !host) return null;
  if (!sessionID || !host) throw new Error('Missing Stake Engine sessionID or rgs_url.');

  const origin = new URL(/^https?:\/\//i.test(host) ? host : `https://${host}`);
  if (origin.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(origin.hostname)) {
    throw new Error('Stake Engine RGS must use HTTPS.');
  }

  async function post(path, body) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    let response;
    try {
      response = await request(new URL(path, origin), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionID, ...body }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
    const data = await response.json();
    if (!response.ok || data.error || (data.status?.statusCode && data.status.statusCode !== 'SUCCESS')) {
      throw new Error(data.error?.message || data.status?.statusMessage || `RGS ${path}: ${response.status}`);
    }
    return data;
  }

  return {
    authenticate: () => post('/wallet/authenticate', { language: params.get('lang') || 'en' }),
    play: (mode, currency, bet) => post('/wallet/play', { mode: mode.toUpperCase(), currency, amount: toRgsAmount(bet) }),
    event: eventIndex => post('/bet/event', { event: String(eventIndex) }),
    end: () => post('/wallet/end-round', {}),
  };
}
