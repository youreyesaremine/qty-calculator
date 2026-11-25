/* حاسبة الكميات — تسجيل الدخول (Cloudflare Pages Function)
   الرمز يُقرأ من المتغير السري SITE_PIN في Cloudflare
   عدّاد المحاولات الخاطئة يُحفظ في KV باسم SYNC (إن وُجد) */

const COOKIE = 'qc_sess';
const IDLE_SEC = 60 * 60;        // خروج بعد 60 دقيقة بدون نشاط
const MAX_FAIL = 5;              // عدد المحاولات الخاطئة
const BLOCK_SEC = 10 * 60;       // مدة المنع
const KV_PREFIX = 'qc:fail:';
const PUBLIC = new Set(['/manifest.webmanifest', '/icon-192.png', '/icon-512.png',
  '/icon-maskable-512.png', '/apple-touch-icon.png', '/favicon.ico', '/sw.js']);
const LOGO = 'data:image/png;base64,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';

const enc = new TextEncoder();
const now = () => Math.floor(Date.now() / 1000);

function normDigits(s) {
  return String(s || '')
    .replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (c) => String(c.charCodeAt(0) - 0x06F0))
    .replace(/\s+/g, '');
}

async function hmac(pin, msg) {
  const key = await crypto.subtle.importKey('raw', enc.encode('qc|' + pin), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(msg));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
function safeEq(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
async function makeCookie(pin) {
  const ts = String(now());
  return `${COOKIE}=${ts}.${await hmac(pin, ts)}; Path=/; HttpOnly; Secure; SameSite=Lax`;
}
const clearCookie = `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;

function getCookie(req) {
  const h = req.headers.get('Cookie') || '';
  for (const part of h.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === COOKIE) return v.join('=');
  }
  return '';
}
async function sessionAge(req, pin) {
  const v = getCookie(req);
  const m = /^(\d{9,12})\.([0-9a-f]{64})$/.exec(v);
  if (!m) return null;
  if (!safeEq(await hmac(pin, m[1]), m[2])) return null;
  return now() - Number(m[1]);
}

function redirect(to, cookie) {
  const h = new Headers({ Location: to, 'Cache-Control': 'no-store' });
  if (cookie) h.append('Set-Cookie', cookie);
  return new Response(null, { status: 302, headers: h });
}

async function failState(env, ip) {
  if (!env.SYNC) return { n: 0, until: 0 };
  try { return (await env.SYNC.get(KV_PREFIX + ip, 'json')) || { n: 0, until: 0 }; }
  catch (_) { return { n: 0, until: 0 }; }
}
async function saveFail(env, ip, st) {
  if (!env.SYNC) return;
  try { await env.SYNC.put(KV_PREFIX + ip, JSON.stringify(st), { expirationTtl: BLOCK_SEC }); } catch (_) {}
}
async function clearFail(env, ip) {
  if (!env.SYNC) return;
  try { await env.SYNC.delete(KV_PREFIX + ip); } catch (_) {}
}

function loginPage(msg, blocked) {
  const html = `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#03170c"><meta name="robots" content="noindex">
<link rel="manifest" href="/manifest.webmanifest"><link rel="apple-touch-icon" href="/apple-touch-icon.png">
<title>حاسبة الكميات — Sign in</title>
<style>
*{box-sizing:border-box}html,body{margin:0;height:100%}
body{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;
background:radial-gradient(120% 80% at 50% 0%,#0d3a22 0%,#04110a 60%);color:#e6f2ea;
font:16px/1.5 "Segoe UI",Tahoma,"Noto Sans Arabic",Roboto,Arial,sans-serif}
.box{width:100%;max-width:360px;text-align:center}
img{width:132px;height:132px;display:block;margin:0 auto 14px;filter:drop-shadow(0 6px 18px rgba(0,0,0,.45))}
h1{margin:0 0 22px;font-size:26px;font-weight:800}
input{width:100%;min-height:62px;border-radius:16px;border:1.5px solid #1f4a32;background:#06170e;color:#fff;
text-align:center;font:800 30px Roboto,Arial,sans-serif;letter-spacing:12px;outline:none;direction:ltr}
input:focus{border-color:#34d27f;box-shadow:0 0 0 4px rgba(52,210,127,.18)}
input:disabled{opacity:.5}
button{width:100%;min-height:56px;margin-top:12px;border:0;border-radius:16px;background:#34d27f;color:#04140b;
font:800 18px Roboto,Arial,sans-serif;cursor:pointer}
button:disabled{background:#1a3a28;color:#8fae9b}
.msg{min-height:24px;margin-top:12px;font-size:14px;color:#ff8a8f}
.ft{margin-top:26px;font-size:12px;color:#6f907c;font-family:Roboto,Arial,sans-serif}
</style></head><body><div class="box">
<img src="${LOGO}" alt="SOMO">
<h1>حاسبة الكميات</h1>
<form method="POST" action="/login" id="f" autocomplete="off">
<input id="pin" name="pin" type="password" inputmode="numeric" maxlength="4" placeholder="••••" aria-label="الرمز" ${blocked ? 'disabled' : 'autofocus'} required>
<button type="submit" ${blocked ? 'disabled' : ''}>Sign in</button>
</form>
<div class="msg">${msg || ''}</div>
<div class="ft">Eng.M.S</div>
</div>
<script>
try{sessionStorage.removeItem('qc_in')}catch(e){}
var p=document.getElementById('pin');
p.addEventListener('input',function(){var v=p.value.replace(/[\\u0660-\\u0669]/g,function(c){return c.charCodeAt(0)-1632}).replace(/[\\u06F0-\\u06F9]/g,function(c){return c.charCodeAt(0)-1776}).replace(/\\D/g,'');if(v!==p.value)p.value=v});
</script></body></html>`;
  return new Response(html, {
    status: blocked ? 429 : 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' },
  });
}

export async function onRequest(context) {
  const { request: req, env, next } = context;
  const url = new URL(req.url);
  const path = url.pathname;
  const pin = normDigits(env.SITE_PIN || '');

  if (!pin) return new Response('SITE_PIN is not set in Cloudflare', { status: 500 });

  if (PUBLIC.has(path)) return next();

  if (path === '/logout') return redirect('/login', clearCookie);

  if (path === '/login') {
    const ip = req.headers.get('CF-Connecting-IP') || 'unknown';
    let st = await failState(env, ip);
    const blockedFor = st.until > now() ? st.until - now() : 0;
    if (blockedFor) {
      return loginPage(`تم المنع بسبب المحاولات الخاطئة. حاول بعد ${Math.ceil(blockedFor / 60)} دقيقة`, true);
    }
    if (req.method !== 'POST') return loginPage('');

    let given = '';
    try { given = normDigits((await req.formData()).get('pin')); } catch (_) {}
    if (given && safeEq(await hmac(pin, 'chk:' + given), await hmac(pin, 'chk:' + pin))) {
      await clearFail(env, ip);
      return new Response(null, {
        status: 303,
        headers: { Location: '/?in=1', 'Set-Cookie': await makeCookie(pin), 'Cache-Control': 'no-store' },
      });
    }
    st = { n: (st.until ? 0 : st.n) + 1, until: 0 };
    if (st.n >= MAX_FAIL) {
      st.until = now() + BLOCK_SEC;
      await saveFail(env, ip, st);
      return loginPage(`تم المنع ${BLOCK_SEC / 60} دقائق بسبب ${MAX_FAIL} محاولات خاطئة`, true);
    }
    await saveFail(env, ip, st);
    return loginPage(`الرمز غير صحيح — المحاولات المتبقية: ${MAX_FAIL - st.n}`);
  }

  const age = await sessionAge(req, pin);
  const isApi = path.startsWith('/api/');
  if (age === null || age > IDLE_SEC || age < -60) {
    if (isApi) {
      return new Response('{"ok":false}', { status: 401, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Set-Cookie': clearCookie } });
    }
    return redirect('/login', age === null ? null : clearCookie);
  }

  if (path === '/api/ping') {
    return new Response('{"ok":true}', { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Set-Cookie': await makeCookie(pin) } });
  }

  const res = await next();
  const out = new Response(res.body, res);
  out.headers.append('Set-Cookie', await makeCookie(pin));
  out.headers.set('Cache-Control', 'no-cache');
  return out;
}
