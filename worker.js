// CoachPilot Worker -- Phase 1
// Lean coach/client platform: trainer account, client roster, assign a
// program from the shared bundle catalog, client workout logging.
// Deliberately has none of Ironclad/pt-tools' gym-management weight (no
// staff scheduling, HR, EOD reports, inventory, multi-location). Every
// endpoint here is purpose-built and validated -- no generic open /db
// passthrough, unlike the older codebase this was split off from.

const ok = (data, cors) => new Response(JSON.stringify({ ok: true, ...data }), { status: 200, headers: cors });
const bad = (msg, cors) => new Response(JSON.stringify({ ok: false, error: msg }), { status: 200, headers: cors });

async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}
async function makeToken(id, email, role, secret) {
  const payload = btoa(JSON.stringify({ id, email, role, exp: Date.now() + 86400000 * 30 }));
  const sig = (await sha256(payload + secret)).slice(0, 16);
  return payload + '.' + sig;
}
async function verifyToken(token, secret) {
  if (!token) return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  const expected = (await sha256(payload + secret)).slice(0, 16);
  if (sig !== expected) return null;
  try { const d = JSON.parse(atob(payload)); if (d.exp < Date.now()) return null; return d; } catch (e) { return null; }
}

export default {
  async fetch(request, env, ctx) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST,GET,OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Content-Type': 'application/json'
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    const url = new URL(request.url);
    const SECRET = env.JWT_SECRET || 'coachpilot-dev-secret';

    try {
      if (url.pathname === '/health') return ok({ db: !!env.DB }, cors);

      // ── TRAINER AUTH ──────────────────────────────────────────
      if (url.pathname === '/trainer/signup' && request.method === 'POST') {
        if (!env.DB) return bad('No DB', cors);
        const b = await request.json().catch(() => ({}));
        const businessName = (b.business_name || '').trim();
        const fullName = (b.full_name || '').trim();
        const email = (b.email || '').toLowerCase().trim();
        if (!businessName || !fullName || !email || !b.password) return bad('business_name, full_name, email, and password are required', cors);
        if (b.password.length < 8) return bad('Password must be at least 8 characters', cors);

        const existing = await env.DB.prepare('SELECT id FROM trainer_auth WHERE email=?').bind(email).first();
        if (existing) return bad('An account with that email already exists', cors);

        const now = new Date().toISOString();
        const ins = await env.DB.prepare(
          `INSERT INTO trainers (business_name, full_name, email, phone, status, created_at, updated_at) VALUES (?,?,?,?,?,?,?)`
        ).bind(businessName, fullName, email, b.phone || null, 'trial', now, now).run();
        const trainerId = ins.meta.last_row_id;

        const hash = await sha256(b.password);
        await env.DB.prepare(
          `INSERT INTO trainer_auth (trainer_id, email, password_hash, must_change_password, active) VALUES (?,?,?,0,1)`
        ).bind(trainerId, email, hash).run();

        const token = await makeToken(trainerId, email, 'trainer', SECRET);
        return ok({ token, trainer_id: trainerId, business_name: businessName }, cors);
      }

      if (url.pathname === '/trainer/login' && request.method === 'POST') {
        if (!env.DB) return bad('No DB', cors);
        const { email, password } = await request.json().catch(() => ({}));
        if (!email || !password) return bad('email and password required', cors);
        const row = await env.DB.prepare('SELECT * FROM trainer_auth WHERE email=? AND active=1').bind(email.toLowerCase().trim()).first();
        if (!row) return ok({ ok: false, error: 'Invalid email or password' }, cors);
        if (await sha256(password) !== row.password_hash) return ok({ ok: false, error: 'Invalid email or password' }, cors);
        const trainer = await env.DB.prepare('SELECT * FROM trainers WHERE id=?').bind(row.trainer_id).first();
        if (!trainer) return ok({ ok: false, error: 'Trainer record not found' }, cors);
        await env.DB.prepare('UPDATE trainer_auth SET last_login=? WHERE id=?').bind(new Date().toISOString(), row.id).run();
        const token = await makeToken(row.trainer_id, email, 'trainer', SECRET);
        return ok({ token, trainer_id: row.trainer_id, business_name: trainer.business_name, full_name: trainer.full_name, must_change: row.must_change_password }, cors);
      }

      // ── TRAINER: CLIENT ROSTER ───────────────────────────────
      if (url.pathname === '/trainer/clients' && request.method === 'GET') {
        if (!env.DB) return bad('No DB', cors);
        const claims = await verifyToken(url.searchParams.get('token'), SECRET);
        if (!claims || claims.role !== 'trainer') return bad('Unauthorized', cors);
        const rows = await env.DB.prepare('SELECT * FROM clients WHERE trainer_id=? ORDER BY created_at DESC').bind(claims.id).all();
        return ok({ clients: rows.results || [] }, cors);
      }

      if (url.pathname === '/trainer/clients/add' && request.method === 'POST') {
        if (!env.DB) return bad('No DB', cors);
        const b = await request.json().catch(() => ({}));
        const claims = await verifyToken(b.token, SECRET);
        if (!claims || claims.role !== 'trainer') return bad('Unauthorized', cors);
        const firstName = (b.first_name || '').trim();
        if (!firstName) return bad('First name is required', cors);
        if (!b.email && !b.phone) return bad('Email or phone is required', cors);
        const now = new Date().toISOString();
        const ins = await env.DB.prepare(
          `INSERT INTO clients (trainer_id, first_name, last_name, email, phone, status, goal_primary, notes, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)`
        ).bind(claims.id, firstName, b.last_name || null, b.email || null, b.phone || null, 'active', b.goal_primary || null, b.notes || null, now, now).run();
        const clientId = ins.meta.last_row_id;

        // Provision a login for the client right away if an email was
        // given -- temp password returned here for the trainer to hand
        // off directly (no email-sending configured for Phase 1 yet).
        let tempPassword = null;
        if (b.email) {
          tempPassword = Math.random().toString(36).slice(-10);
          const hash = await sha256(tempPassword);
          await env.DB.prepare(
            `INSERT INTO client_auth (client_id, email, password_hash, must_change_password, active) VALUES (?,?,?,1,1)`
          ).bind(clientId, b.email.toLowerCase().trim(), hash).run();
        }
        return ok({ client_id: clientId, temp_password: tempPassword }, cors);
      }

      if (url.pathname === '/trainer/client-detail' && request.method === 'GET') {
        if (!env.DB) return bad('No DB', cors);
        const claims = await verifyToken(url.searchParams.get('token'), SECRET);
        if (!claims || claims.role !== 'trainer') return bad('Unauthorized', cors);
        const clientId = parseInt(url.searchParams.get('client_id'), 10);
        if (!clientId) return bad('client_id required', cors);
        const client = await env.DB.prepare('SELECT * FROM clients WHERE id=? AND trainer_id=?').bind(clientId, claims.id).first();
        if (!client) return bad('Client not found', cors);
        const programs = await env.DB.prepare('SELECT * FROM assigned_programs WHERE client_id=? ORDER BY assigned_at DESC').bind(clientId).all();
        const logs = await env.DB.prepare('SELECT * FROM workout_logs WHERE client_id=? ORDER BY log_date DESC LIMIT 30').bind(clientId).all();
        const sessionLogs = await env.DB.prepare('SELECT * FROM session_logs WHERE client_id=? ORDER BY session_date DESC LIMIT 30').bind(clientId).all();
        return ok({ client, programs: programs.results || [], logs: logs.results || [], sessionLogs: sessionLogs.results || [] }, cors);
      }

      if (url.pathname === '/trainer/assign-program' && request.method === 'POST') {
        if (!env.DB) return bad('No DB', cors);
        const b = await request.json().catch(() => ({}));
        const claims = await verifyToken(b.token, SECRET);
        if (!claims || claims.role !== 'trainer') return bad('Unauthorized', cors);
        const clientId = parseInt(b.client_id, 10);
        if (!clientId || !b.bundle_id || !b.bundle_name) return bad('client_id, bundle_id, bundle_name required', cors);
        const client = await env.DB.prepare('SELECT id FROM clients WHERE id=? AND trainer_id=?').bind(clientId, claims.id).first();
        if (!client) return bad('Client not found', cors);
        // Only one active program per client at a time -- retire any
        // previous assignment rather than stacking them silently.
        await env.DB.prepare('UPDATE assigned_programs SET active=0 WHERE client_id=? AND active=1').bind(clientId).run();
        await env.DB.prepare(
          `INSERT INTO assigned_programs (client_id, trainer_id, bundle_id, bundle_name, notes) VALUES (?,?,?,?,?)`
        ).bind(clientId, claims.id, b.bundle_id, b.bundle_name, b.notes || null).run();
        return ok({ assigned: true }, cors);
      }

      // ── TRAINER: SESSION PACKAGE + TERMS ─────────────────────
      // Sets (or resets) a client's session package -- total sessions,
      // package dates, and the terms/agreement text on file for them.
      // sessions_remaining is always derived from total - used here,
      // never edited directly, so it can't drift out of sync.
      if (url.pathname === '/trainer/client/update-package' && request.method === 'POST') {
        if (!env.DB) return bad('No DB', cors);
        const b = await request.json().catch(() => ({}));
        const claims = await verifyToken(b.token, SECRET);
        if (!claims || claims.role !== 'trainer') return bad('Unauthorized', cors);
        const clientId = parseInt(b.client_id, 10);
        if (!clientId) return bad('client_id required', cors);
        const client = await env.DB.prepare('SELECT sessions_used FROM clients WHERE id=? AND trainer_id=?').bind(clientId, claims.id).first();
        if (!client) return bad('Client not found', cors);
        const sessionsTotal = Math.max(0, parseInt(b.sessions_total, 10) || 0);
        const sessionsRemaining = Math.max(0, sessionsTotal - (client.sessions_used || 0));
        await env.DB.prepare(
          `UPDATE clients SET sessions_total=?, sessions_remaining=?, package_start_date=?, package_end_date=?, terms=?, updated_at=? WHERE id=?`
        ).bind(sessionsTotal, sessionsRemaining, b.package_start_date || null, b.package_end_date || null, b.terms || null, new Date().toISOString(), clientId).run();
        return ok({ updated: true }, cors);
      }

      if (url.pathname === '/trainer/client/log-session' && request.method === 'POST') {
        if (!env.DB) return bad('No DB', cors);
        const b = await request.json().catch(() => ({}));
        const claims = await verifyToken(b.token, SECRET);
        if (!claims || claims.role !== 'trainer') return bad('Unauthorized', cors);
        const clientId = parseInt(b.client_id, 10);
        if (!clientId) return bad('client_id required', cors);
        const client = await env.DB.prepare('SELECT sessions_used, sessions_remaining FROM clients WHERE id=? AND trainer_id=?').bind(clientId, claims.id).first();
        if (!client) return bad('Client not found', cors);
        if ((client.sessions_remaining || 0) <= 0) return bad('No sessions remaining on this client\u2019s package', cors);
        await env.DB.prepare(
          `INSERT INTO session_logs (client_id, trainer_id, session_date, notes) VALUES (?,?,?,?)`
        ).bind(clientId, claims.id, b.session_date || new Date().toISOString().slice(0, 10), b.notes || null).run();
        await env.DB.prepare(
          `UPDATE clients SET sessions_used = sessions_used + 1, sessions_remaining = sessions_remaining - 1, updated_at=? WHERE id=?`
        ).bind(new Date().toISOString(), clientId).run();
        return ok({ logged: true }, cors);
      }

      // ── CLIENT AUTH + APP ─────────────────────────────────────
      if (url.pathname === '/client/login' && request.method === 'POST') {
        if (!env.DB) return bad('No DB', cors);
        const { email, password } = await request.json().catch(() => ({}));
        if (!email || !password) return bad('email and password required', cors);
        const row = await env.DB.prepare('SELECT * FROM client_auth WHERE email=? AND active=1').bind(email.toLowerCase().trim()).first();
        if (!row) return ok({ ok: false, error: 'Invalid email or password' }, cors);
        if (await sha256(password) !== row.password_hash) return ok({ ok: false, error: 'Invalid email or password' }, cors);
        await env.DB.prepare('UPDATE client_auth SET last_login=? WHERE id=?').bind(new Date().toISOString(), row.id).run();
        const token = await makeToken(row.client_id, email, 'client', SECRET);
        return ok({ token, client_id: row.client_id, must_change: row.must_change_password }, cors);
      }

      if (url.pathname === '/client/change-password' && request.method === 'POST') {
        if (!env.DB) return bad('No DB', cors);
        const b = await request.json().catch(() => ({}));
        if (!b.email || !b.old_password || !b.new_password) return bad('missing fields', cors);
        if (b.new_password.length < 8) return bad('New password must be at least 8 characters', cors);
        const row = await env.DB.prepare('SELECT * FROM client_auth WHERE email=? AND active=1').bind(b.email.toLowerCase().trim()).first();
        if (!row) return bad('Not found', cors);
        if (await sha256(b.old_password) !== row.password_hash) return bad('Current password incorrect', cors);
        const hash = await sha256(b.new_password);
        await env.DB.prepare('UPDATE client_auth SET password_hash=?, must_change_password=0 WHERE id=?').bind(hash, row.id).run();
        return ok({ changed: true }, cors);
      }

      if (url.pathname === '/client/me' && request.method === 'GET') {
        if (!env.DB) return bad('No DB', cors);
        const claims = await verifyToken(url.searchParams.get('token'), SECRET);
        if (!claims || claims.role !== 'client') return bad('Unauthorized', cors);
        const client = await env.DB.prepare('SELECT * FROM clients WHERE id=?').bind(claims.id).first();
        if (!client) return bad('Client not found', cors);
        const trainer = await env.DB.prepare('SELECT business_name, full_name, logo_url, accent_color FROM trainers WHERE id=?').bind(client.trainer_id).first();
        const program = await env.DB.prepare('SELECT * FROM assigned_programs WHERE client_id=? AND active=1 ORDER BY assigned_at DESC LIMIT 1').bind(claims.id).first();
        return ok({ client, trainer, program: program || null }, cors);
      }

      if (url.pathname === '/client/log-workout' && request.method === 'POST') {
        if (!env.DB) return bad('No DB', cors);
        const b = await request.json().catch(() => ({}));
        const claims = await verifyToken(b.token, SECRET);
        if (!claims || claims.role !== 'client') return bad('Unauthorized', cors);
        const client = await env.DB.prepare('SELECT trainer_id FROM clients WHERE id=?').bind(claims.id).first();
        if (!client) return bad('Client not found', cors);
        await env.DB.prepare(
          `INSERT INTO workout_logs (client_id, trainer_id, log_date, routine_label, bundle_id, exercises_json) VALUES (?,?,?,?,?,?)`
        ).bind(claims.id, client.trainer_id, b.log_date || new Date().toISOString().slice(0, 10), b.routine_label || null, b.bundle_id || null, JSON.stringify(b.exercises || [])).run();
        return ok({ logged: true }, cors);
      }

      if (url.pathname === '/client/logs' && request.method === 'GET') {
        if (!env.DB) return bad('No DB', cors);
        const claims = await verifyToken(url.searchParams.get('token'), SECRET);
        if (!claims || claims.role !== 'client') return bad('Unauthorized', cors);
        const rows = await env.DB.prepare('SELECT * FROM workout_logs WHERE client_id=? ORDER BY log_date DESC LIMIT 30').bind(claims.id).all();
        return ok({ logs: rows.results || [] }, cors);
      }

      return bad('Not found', cors);
    } catch (e) {
      return bad('Server error: ' + e.message, cors);
    }
  }
};
