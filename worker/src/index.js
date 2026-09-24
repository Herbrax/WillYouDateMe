// The little API behind the post-it.
//
// Three things happen here and nothing else:
//   POST /submit   nickname + a plan   -> writes data/dateMMN.json, returns the id
//   POST /unlock   id + nickname       -> returns the plan and a short-lived token
//   PUT  /date     token + a plan      -> rewrites that file, 409 if it moved
//
// The nickname lives in env.NICKNAME, the GitHub token in env.GH_TOKEN. Neither
// is ever sent to the browser, and no response ever confirms that an id exists
// unless the nickname was right.

const MAX = { message: 2000, day: 40, time: 40, label: 80 };
const TOKEN_TTL_MS = 15 * 60 * 1000;

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');

    if (request.method === 'OPTIONS') return cors(new Response(null, { status: 204 }), env, origin);

    let res;
    try {
      const { pathname } = new URL(request.url);
      if (pathname === '/submit' && request.method === 'POST') res = await submit(request, env);
      else if (pathname === '/unlock' && request.method === 'POST') res = await unlock(request, env);
      else if (pathname === '/date' && request.method === 'PUT') res = await saveEdit(request, env);
      else res = json({ error: 'not found' }, 404);
    } catch (err) {
      console.error(err);
      res = json({ error: 'something broke' }, 500);
    }

    return cors(res, env, origin);
  },
};

/* ---------------------------------------------------------------- routes -- */

async function submit(request, env) {
  if (!(await allow(request, env, 'submit'))) return json({ error: 'slow down' }, 429);

  const body = await readJson(request);
  if (!body) return json({ error: 'bad request' }, 400);
  if (!(await nicknameOk(body.nickname, env))) return shoo();

  const plan = clean(body.date);
  if (!plan) return json({ error: 'bad request' }, 400);

  const now = new Date().toISOString();
  const record = { ...plan, createdAt: now, updatedAt: now };

  // Claim the next free id. A PUT with no sha fails with 422 if the path already
  // exists, so a collision costs us a retry instead of someone else's plan.
  let n = await highestId(env);
  for (let attempt = 0; attempt < 6; attempt++) {
    const id = `${monthPrefix()}${++n}`;
    const res = await putFile(env, path(env, id), { ...record, id }, null, `add ${id}`);
    if (res.ok) return json({ id });
    if (res.status !== 422) return json({ error: 'could not save' }, 502);
  }
  return json({ error: 'could not save' }, 503);
}

async function unlock(request, env) {
  if (!(await allow(request, env, 'unlock'))) return json({ error: 'slow down' }, 429);

  const body = await readJson(request);
  if (!body) return json({ error: 'bad request' }, 400);

  const id = normaliseId(body.id);
  const nickOk = await nicknameOk(body.nickname, env);

  // A wrong nickname and a missing id look identical from out here, so the
  // endpoint can't be used to find out which ids are real.
  if (!id || !nickOk) return notFound();

  const file = await getFile(env, path(env, id));
  if (!file) return notFound();

  const token = await sign(env, { id, sha: file.sha, exp: Date.now() + TOKEN_TTL_MS });
  return json({ id, date: file.json, token });
}

async function saveEdit(request, env) {
  if (!(await allow(request, env, 'edit'))) return json({ error: 'slow down' }, 429);

  const body = await readJson(request);
  if (!body) return json({ error: 'bad request' }, 400);

  const claim = await verify(env, body.token);
  if (!claim) return json({ error: 'that link expired — unlock it again' }, 401);

  const plan = clean(body.date);
  if (!plan) return json({ error: 'bad request' }, 400);

  const current = await getFile(env, path(env, claim.id));
  if (!current) return notFound();

  const record = {
    ...current.json,
    ...plan,
    id: claim.id,
    createdAt: current.json?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // claim.sha is the blob we showed them. If it no longer matches, someone
  // edited in the meantime and we refuse rather than overwrite.
  const res = await putFile(env, path(env, claim.id), record, claim.sha, `edit ${claim.id}`);
  if (res.status === 409 || res.status === 422) {
    return json({ error: 'this plan changed while you had it open — reload' }, 409);
  }
  if (!res.ok) return json({ error: 'could not save' }, 502);

  return json({ id: claim.id, date: record });
}

/* ------------------------------------------------------------- the lock --- */

async function nicknameOk(given, env) {
  if (typeof given !== 'string' || !env.NICKNAME) return false;
  // Same forgiveness the page has always had: trim and lowercase both sides.
  return timingSafeEqual(given.trim().toLowerCase(), env.NICKNAME.trim().toLowerCase());
}

function timingSafeEqual(a, b) {
  const enc = new TextEncoder();
  const x = enc.encode(a);
  const y = enc.encode(b);
  // Compare a fixed number of bytes so the loop length leaks nothing.
  let diff = x.length ^ y.length;
  const len = Math.max(x.length, y.length);
  for (let i = 0; i < len; i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

/* ---------------------------------------------------------------- tokens -- */

async function hmacKey(env) {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(env.TOKEN_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

async function sign(env, claim) {
  const payload = b64url(new TextEncoder().encode(JSON.stringify(claim)));
  const mac = await crypto.subtle.sign('HMAC', await hmacKey(env), new TextEncoder().encode(payload));
  return `${payload}.${b64url(new Uint8Array(mac))}`;
}

async function verify(env, token) {
  if (typeof token !== 'string' || !token.includes('.')) return null;
  const [payload, mac] = token.split('.', 2);

  // Everything in here is parsing attacker-supplied text: base64 that isn't
  // base64 throws, and so does JSON that isn't JSON. All of it means "no".
  try {
    const ok = await crypto.subtle.verify(
      'HMAC',
      await hmacKey(env),
      unb64url(mac),
      new TextEncoder().encode(payload),
    );
    if (!ok) return null;

    const claim = JSON.parse(new TextDecoder().decode(unb64url(payload)));
    if (!claim?.exp || Date.now() > claim.exp) return null;
    if (!normaliseId(claim.id) || typeof claim.sha !== 'string') return null;
    return claim;
  } catch {
    return null;
  }
}

/* ---------------------------------------------------------------- github -- */

function path(env, id) {
  // id is already through normaliseId, so this can only ever be data/dateNNN.json.
  return `${env.DATA_DIR || 'data'}/${id}.json`;
}

function gh(env, suffix) {
  return `https://api.github.com/repos/${env.GH_OWNER}/${env.GH_REPO}/${suffix}`;
}

function ghHeaders(env) {
  return {
    authorization: `Bearer ${env.GH_TOKEN}`,
    accept: 'application/vnd.github+json',
    'x-github-api-version': '2022-11-28',
    // GitHub rejects API calls with no User-Agent.
    'user-agent': 'willyoudateme-worker',
  };
}

async function getFile(env, filePath) {
  const res = await fetch(gh(env, `contents/${filePath}`), { headers: ghHeaders(env) });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`github ${res.status} reading ${filePath}`);

  const body = await res.json();
  let parsed = null;
  try {
    parsed = JSON.parse(new TextDecoder().decode(unb64(body.content)));
  } catch {
    /* a file we can't parse is treated as empty rather than fatal */
  }
  return { sha: body.sha, json: parsed };
}

function putFile(env, filePath, record, sha, message) {
  const content = b64(new TextEncoder().encode(`${JSON.stringify(record, null, 2)}\n`));
  return fetch(gh(env, `contents/${filePath}`), {
    method: 'PUT',
    headers: { ...ghHeaders(env), 'content-type': 'application/json' },
    body: JSON.stringify({ message, content, ...(sha ? { sha } : {}) }),
  });
}

// Highest counter used this month, so the next id carries on from it.
async function highestId(env) {
  const dir = env.DATA_DIR || 'data';
  const res = await fetch(gh(env, `contents/${dir}`), { headers: ghHeaders(env) });
  if (res.status === 404) return 0; // first plan ever — the folder isn't there yet
  if (!res.ok) throw new Error(`github ${res.status} listing ${dir}`);

  const prefix = monthPrefix();
  let top = 0;
  for (const entry of await res.json()) {
    const m = entry.name?.match(/^date(\d{2})(\d+)\.json$/);
    if (!m || `date${m[1]}` !== prefix) continue;
    top = Math.max(top, Number(m[2]));
  }
  return top;
}

/* ------------------------------------------------------------ validation -- */

function monthPrefix() {
  return `date${String(new Date().getUTCMonth() + 1).padStart(2, '0')}`;
}

// Accepts "091", "date091", " 09 1 " is not a thing — three or more digits, or
// the same with the prefix already attached. Everything else is nothing.
function normaliseId(raw) {
  if (typeof raw !== 'string') return null;
  const m = raw.trim().toLowerCase().match(/^(?:date)?(\d{2})(\d{1,4})$/);
  return m ? `date${m[1]}${m[2]}` : null;
}

function str(value, max) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length && trimmed.length <= max ? trimmed : null;
}

// Only the known fields survive. Anything else the browser sends is dropped.
function clean(date) {
  if (!date || typeof date !== 'object') return null;

  const day = str(date.day, MAX.day);
  const time = str(date.time, MAX.time);
  if (!day || !time) return null;

  const message = typeof date.message === 'string' ? date.message.trim().slice(0, MAX.message) : '';
  const label = str(date.label, MAX.label);

  // The pretty strings above are what a person reads; these two are what the
  // edit page needs to put the day and time pickers back where they were.
  const dayISO = /^\d{4}-\d{2}-\d{2}$/.test(date.dayISO) ? date.dayISO : null;
  const timeISO = /^\d{2}:\d{2}$/.test(date.timeISO) ? date.timeISO : null;

  return { day, time, dayISO, timeISO, message, label: label ?? null };
}

async function readJson(request) {
  if (!request.headers.get('content-type')?.includes('application/json')) return null;
  // A plan is small. Anything big is not a plan.
  const raw = await request.text();
  if (!raw || raw.length > 8000) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/* ----------------------------------------------------------- rate limits -- */

async function allow(request, env, bucket) {
  if (!env.RATE_LIMIT) return true; // binding not configured — don't lock anyone out
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const { success } = await env.RATE_LIMIT.limit({ key: `${bucket}:${ip}` });
  return success;
}

/* ------------------------------------------------------------ plumbing --- */

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

// Wrong nickname on the way in — the page already knows how to be rude about it.
const shoo = () => json({ error: 'wrong nickname' }, 403);
const notFound = () => json({ error: 'no such plan' }, 404);

function cors(res, env, origin) {
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  const headers = new Headers(res.headers);

  if (origin && allowed.includes(origin)) {
    headers.set('access-control-allow-origin', origin);
    headers.set('vary', 'Origin');
    headers.set('access-control-allow-methods', 'POST, PUT, OPTIONS');
    headers.set('access-control-allow-headers', 'content-type');
    headers.set('access-control-max-age', '86400');
  }
  return new Response(res.body, { status: res.status, headers });
}

// Exposed so the bits with no network in them can be tested on their own.
export const _internals = { sign, verify, normaliseId, clean, timingSafeEqual };

const b64 = (bytes) => btoa(String.fromCharCode(...bytes));
const unb64 = (s) => Uint8Array.from(atob(s.replace(/\s/g, '')), (c) => c.charCodeAt(0));
const b64url = (bytes) => b64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64url = (s) => unb64(s.replace(/-/g, '+').replace(/_/g, '/'));
