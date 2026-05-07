const express = require('express');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

const SECRET = 'poc-geheim-sleutel';

// Nep-gebruikers (in productie: uit MongoDB)
const USERS = [
  { id: 1, email: 'speler@school.be',     password: '1234', rol: 'speler' },
  { id: 2, email: 'leerkracht@school.be', password: '1234', rol: 'leerkracht' },
  { id: 3, email: 'beheerder@school.be',  password: '1234', rol: 'beheerder' },
];

// Middleware: controleer JWT
function vereisToken(req, res, next) {
  const header = req.headers['authorization'];
  if (!header) return res.status(401).json({ fout: 'Geen token meegegeven' });

  const token = header.split(' ')[1];
  try {
    req.gebruiker = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ fout: 'Token ongeldig of verlopen' });
  }
}

// Middleware: controleer rol
function vereisRol(...rollen) {
  return (req, res, next) => {
    if (!rollen.includes(req.gebruiker.rol)) {
      return res.status(403).json({ fout: `Toegang geweigerd. Vereist: ${rollen.join(' of ')}` });
    }
    next();
  };
}

// POST /login — geeft JWT terug
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = USERS.find(u => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ fout: 'Onbekende gebruiker of fout wachtwoord' });

  const token = jwt.sign(
    { id: user.id, email: user.email, rol: user.rol },
    SECRET,
    { expiresIn: '1h' }
  );

  res.json({ token, rol: user.rol, email: user.email });
});

// GET /mijn-profiel — voor iedereen die ingelogd is
app.get('/mijn-profiel', vereisToken, (req, res) => {
  res.json({ bericht: 'Profiel opgehaald', gebruiker: req.gebruiker });
});

// GET /voortgang — alleen voor leerkracht en beheerder
app.get('/voortgang', vereisToken, vereisRol('leerkracht', 'beheerder'), (req, res) => {
  res.json({ bericht: 'Voortgang van leerlingen', data: [
    { naam: 'Jan', levels_voltooid: 5 },
    { naam: 'Marie', levels_voltooid: 8 },
  ]});
});

// GET /levels/beheer — alleen voor beheerder
app.get('/levels/beheer', vereisToken, vereisRol('beheerder'), (req, res) => {
  res.json({ bericht: 'Beheerderspaneel: alle levels', data: [
    { id: 1, naam: 'Eerste Stappen', gepubliceerd: true },
    { id: 2, naam: 'Loops', gepubliceerd: false },
  ]});
});

// Serveer de frontend
app.get('/', (req, res) => res.send(HTML));

app.listen(3000, () => console.log('PoC Authenticatie draait op poort 3000'));

// ─── Inline HTML frontend ────────────────────────────────────────────────────
const HTML = `<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="UTF-8">
<title>PoC 5 — Authenticatie (JWT)</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Space+Grotesk:wght@400;600;700&display=swap');
  :root {
    --bg: #0d0f14; --surface: #13161e; --surface2: #1a1e2a;
    --border: #252a38; --accent: #00e5ff; --success: #39ff8a;
    --error: #ff4f70; --warn: #f8cc82;
    --text: #e2e8f0; --muted: #6b7a99;
    --mono: 'JetBrains Mono', monospace;
    --sans: 'Space Grotesk', sans-serif;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: var(--bg); color: var(--text); font-family: var(--sans); min-height: 100vh; }

  header { padding: 18px 32px; border-bottom: 1px solid var(--border); background: var(--surface); display: flex; align-items: center; gap: 12px; }
  header h1 { font-size: 1rem; font-weight: 700; }
  header h1 span { color: var(--accent); }
  .badge { margin-left: auto; font-family: var(--mono); font-size: 0.7rem; color: var(--accent); background: rgba(0,229,255,0.08); border: 1px solid rgba(0,229,255,0.2); padding: 4px 10px; border-radius: 4px; }

  main { display: grid; grid-template-columns: 360px 1fr; gap: 0; height: calc(100vh - 57px); }

  .panel { padding: 28px; border-right: 1px solid var(--border); overflow-y: auto; display: flex; flex-direction: column; gap: 24px; background: var(--surface); }
  .right { border-right: none; background: var(--bg); padding: 28px; overflow-y: auto; display: flex; flex-direction: column; gap: 16px; }

  .section-title { font-family: var(--mono); font-size: 0.65rem; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: var(--muted); margin-bottom: 12px; }

  .user-card { border: 1px solid var(--border); border-radius: 8px; padding: 14px; cursor: pointer; transition: all 0.15s; background: var(--surface2); }
  .user-card:hover { border-color: var(--accent); }
  .user-card.active { border-color: var(--accent); background: rgba(0,229,255,0.06); }
  .user-card .rol { font-family: var(--mono); font-size: 0.7rem; padding: 2px 8px; border-radius: 4px; display: inline-block; margin-bottom: 6px; }
  .rol.speler { background: rgba(57,255,138,0.1); color: var(--success); }
  .rol.leerkracht { background: rgba(248,204,130,0.1); color: var(--warn); }
  .rol.beheerder { background: rgba(0,229,255,0.1); color: var(--accent); }
  .user-card .email { font-size: 0.85rem; font-weight: 600; margin-bottom: 2px; }
  .user-card .pass { font-size: 0.75rem; color: var(--muted); font-family: var(--mono); }

  .btn { width: 100%; padding: 11px; border: none; border-radius: 7px; cursor: pointer; font-family: var(--sans); font-size: 0.85rem; font-weight: 600; transition: all 0.15s; }
  .btn-primary { background: var(--accent); color: #0d0f14; }
  .btn-primary:hover { background: #33eeff; }
  .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }

  .endpoint-btn { width: 100%; text-align: left; padding: 12px 14px; border: 1px solid var(--border); background: var(--surface2); border-radius: 8px; cursor: pointer; font-family: var(--sans); font-size: 0.82rem; color: var(--text); transition: all 0.15s; display: flex; align-items: center; gap: 10px; }
  .endpoint-btn:hover { border-color: var(--accent); color: var(--accent); }
  .endpoint-btn:disabled { opacity: 0.35; cursor: not-allowed; }
  .method { font-family: var(--mono); font-size: 0.7rem; background: rgba(0,229,255,0.1); color: var(--accent); padding: 2px 7px; border-radius: 4px; }

  .result-box { border-radius: 8px; border: 1px solid var(--border); overflow: hidden; }
  .result-header { padding: 10px 14px; font-family: var(--mono); font-size: 0.72rem; display: flex; align-items: center; gap: 8px; background: var(--surface); }
  .result-header.ok { border-bottom: 1px solid var(--success); color: var(--success); }
  .result-header.err { border-bottom: 1px solid var(--error); color: var(--error); }
  .result-header.info { border-bottom: 1px solid var(--border); color: var(--muted); }
  pre { padding: 14px; font-family: var(--mono); font-size: 0.72rem; line-height: 1.6; background: var(--bg); color: #a8b8d8; overflow-x: auto; }

  .token-box { background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; padding: 12px; font-family: var(--mono); font-size: 0.68rem; color: var(--muted); word-break: break-all; line-height: 1.5; }
  .token-box span.h { color: var(--warn); }
  .token-box span.p { color: var(--success); }
  .token-box span.s { color: var(--error); }

  .dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; display: inline-block; }
  .empty-state { color: var(--muted); font-size: 0.82rem; font-family: var(--mono); padding: 20px; text-align: center; }
</style>
</head>
<body>
<header>
  <h1>PoC 5 — <span>Authenticatie</span></h1>
  <div class="badge">JWT · Role-based access</div>
</header>
<main>
  <div class="panel">
    <div>
      <div class="section-title">1. Kies een gebruiker</div>
      <div style="display:flex;flex-direction:column;gap:8px">
        <div class="user-card" onclick="selectUser('speler@school.be','speler')">
          <span class="rol speler">speler</span>
          <div class="email">speler@school.be</div>
          <div class="pass">wachtwoord: 1234</div>
        </div>
        <div class="user-card" onclick="selectUser('leerkracht@school.be','leerkracht')">
          <span class="rol leerkracht">leerkracht</span>
          <div class="email">leerkracht@school.be</div>
          <div class="pass">wachtwoord: 1234</div>
        </div>
        <div class="user-card" onclick="selectUser('beheerder@school.be','beheerder')">
          <span class="rol beheerder">beheerder</span>
          <div class="email">beheerder@school.be</div>
          <div class="pass">wachtwoord: 1234</div>
        </div>
      </div>
    </div>

    <div>
      <div class="section-title">2. Log in</div>
      <button class="btn btn-primary" id="loginBtn" onclick="login()" disabled>Inloggen & JWT ophalen</button>
    </div>

    <div>
      <div class="section-title">3. Test endpoints</div>
      <div style="display:flex;flex-direction:column;gap:8px">
        <button class="endpoint-btn" id="btn-profiel" onclick="roepAan('/mijn-profiel','Mijn Profiel')" disabled>
          <span class="method">GET</span> /mijn-profiel <span style="margin-left:auto;font-size:0.7rem;color:var(--muted)">alle rollen</span>
        </button>
        <button class="endpoint-btn" id="btn-voortgang" onclick="roepAan('/voortgang','Voortgang leerlingen')" disabled>
          <span class="method">GET</span> /voortgang <span style="margin-left:auto;font-size:0.7rem;color:var(--warn)">leerkracht+</span>
        </button>
        <button class="endpoint-btn" id="btn-beheer" onclick="roepAan('/levels/beheer','Beheerderspaneel')" disabled>
          <span class="method">GET</span> /levels/beheer <span style="margin-left:auto;font-size:0.7rem;color:var(--accent)">beheerder</span>
        </button>
      </div>
    </div>
  </div>

  <div class="right" id="results">
    <div class="empty-state">← Kies een gebruiker en log in</div>
  </div>
</main>

<script>
  let selectedEmail = null;
  let token = null;

  function selectUser(email, rol) {
    selectedEmail = email;
    document.querySelectorAll('.user-card').forEach(c => c.classList.remove('active'));
    event.currentTarget.classList.add('active');
    document.getElementById('loginBtn').disabled = false;
    token = null;
    ['btn-profiel','btn-voortgang','btn-beheer'].forEach(id => document.getElementById(id).disabled = true);
    document.getElementById('results').innerHTML = '<div class="empty-state">← Klik op "Inloggen" om een JWT te ontvangen</div>';
  }

  async function login() {
    const res = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: selectedEmail, password: '1234' })
    });
    const data = await res.json();
    token = data.token;

    const parts = token.split('.');
    const payload = JSON.parse(atob(parts[1]));

    document.getElementById('results').innerHTML = \`
      <div class="section-title" style="font-family:var(--mono);font-size:0.65rem;letter-spacing:0.15em;text-transform:uppercase;color:var(--muted)">JWT Token ontvangen</div>
      <div class="token-box">
        <span class="h">\${parts[0]}</span>.<span class="p">\${parts[1]}</span>.<span class="s">\${parts[2]}</span>
      </div>
      <div class="result-box">
        <div class="result-header ok"><span class="dot"></span> Token gedecodeerd</div>
        <pre>\${JSON.stringify(payload, null, 2)}</pre>
      </div>
      <div class="empty-state" style="padding:8px">← Test nu de endpoints</div>
    \`;

    ['btn-profiel','btn-voortgang','btn-beheer'].forEach(id => document.getElementById(id).disabled = false);
  }

  async function roepAan(pad, label) {
    const res = await fetch(pad, { headers: { 'Authorization': 'Bearer ' + token } });
    const data = await res.json();
    const ok = res.ok;

    const box = document.createElement('div');
    box.className = 'result-box';
    box.innerHTML = \`
      <div class="result-header \${ok ? 'ok' : 'err'}">
        <span class="dot"></span> \${res.status} \${ok ? '✓' : '✗'} — \${label}
      </div>
      <pre>\${JSON.stringify(data, null, 2)}</pre>
    \`;

    const results = document.getElementById('results');
    const empty = results.querySelector('.empty-state');
    if (empty) empty.remove();
    results.appendChild(box);
    box.scrollIntoView({ behavior: 'smooth' });
  }
</script>
</body>
</html>`;
