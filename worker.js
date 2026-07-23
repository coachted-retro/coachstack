// CoachPilot Worker — BeroFit Pro
// Landing page at root, hardcoded demo at /demo, full API on all other routes

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Trainer-Token',
};

function json(data, status=200) {
  return new Response(JSON.stringify(data), {
    status, headers: { ...CORS, 'Content-Type': 'application/json' }
  });
}

function genToken(len=32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i=0; i<len; i++) result += chars[Math.floor(Math.random()*chars.length)];
  return result;
}

async function verifyTrainer(request, db) {
  const token = request.headers.get('X-Trainer-Token');
  if (!token) return null;
  if (token === 'BEROFIT_DEMO_2026') return null; // demo handled separately
  const row = await db.prepare(
    'SELECT * FROM trainers WHERE session_token=? AND token_expires > ?'
  ).bind(token, Date.now()).first();
  return row || null;
}

// ── HARDCODED DEMO DATA — no database, no real clients ────────────────────
const DEMO_TOKEN = 'BEROFIT_DEMO_2026';

const DEMO_CLIENTS = [
  {
    id: 'demo_001', trainer_id: 999,
    name: 'Alex Johnson', email: 'alex.johnson@example.com', phone: '555-0101',
    goal: 'Lose 30 pounds and build lean muscle while on Ozempic',
    height: '5ft 11in', weight: 218.5, gender: 'Male', dob: '1985-04-12',
    conditions: 'Type 2 diabetes, on Semaglutide (Ozempic) 0.5mg weekly',
    glp1: 1, status: 'active', check_in_streak: 8,
    start_date: '2026-05-15', sessions_per_week: 3,
    notes: 'GLP-1 appetite suppression active. Focus on muscle preservation. Energy improving week over week.',
    is_ghost: 0, created_at: 1715000000000, last_checkin: 1721600000000
  },
  {
    id: 'demo_002', trainer_id: 999,
    name: 'Sarah Martinez', email: 'sarah.m@example.com', phone: '555-0102',
    goal: 'Full recovery from knee replacement and return to hiking',
    height: '5ft 4in', weight: 162.0, gender: 'Female', dob: '1971-09-28',
    conditions: 'Right knee replacement (March 2026) — 4 months post-op',
    glp1: 0, status: 'active', check_in_streak: 12,
    start_date: '2026-04-10', sessions_per_week: 2,
    notes: 'Post-surgical program active. No impact work. Quad strengthening priority. PT cleared for progressive loading.',
    is_ghost: 0, created_at: 1712700000000, last_checkin: 1721500000000
  },
  {
    id: 'demo_003', trainer_id: 999,
    name: 'Marcus Williams', email: 'marcus.w@example.com', phone: '555-0103',
    goal: 'Add 15 pounds of lean muscle by end of year',
    height: '6ft 1in', weight: 197.0, gender: 'Male', dob: '1993-01-15',
    conditions: null, glp1: 0, status: 'active', check_in_streak: 18,
    start_date: '2026-03-01', sessions_per_week: 5,
    notes: 'Iron Protocol Phase 2. Progressive overload every session. Nutrition compliance 94% this month. PRs trending up.',
    is_ghost: 0, created_at: 1709300000000, last_checkin: 1721650000000
  },
  {
    id: 'demo_004', trainer_id: 999,
    name: 'Jennifer Kim', email: 'jen.kim@example.com', phone: '555-0104',
    goal: 'Manage PCOS symptoms through training and nutrition, lose 20 pounds',
    height: '5ft 3in', weight: 174.5, gender: 'Female', dob: '1989-07-22',
    conditions: 'PCOS — hormone-supportive training and nutrition protocol active',
    glp1: 0, status: 'active', check_in_streak: 6,
    start_date: '2026-06-01', sessions_per_week: 3,
    notes: 'PCOS protocol. Low-glycemic nutrition focus. Strength training 3x per week. Stress management integrated.',
    is_ghost: 0, created_at: 1717200000000, last_checkin: 1721400000000
  }
];

const DEMO_SESSIONS = [
  { id:'ds001', client_id:'demo_001', trainer_id:999, session_date:'2026-07-24', session_time:'09:00', duration_min:60, type:'training', status:'scheduled', client_name:'Alex Johnson', created_at:1721000000000 },
  { id:'ds002', client_id:'demo_002', trainer_id:999, session_date:'2026-07-23', session_time:'10:30', duration_min:45, type:'training', status:'scheduled', client_name:'Sarah Martinez', created_at:1721000000000 },
  { id:'ds003', client_id:'demo_003', trainer_id:999, session_date:'2026-07-22', session_time:'07:00', duration_min:75, type:'training', status:'scheduled', client_name:'Marcus Williams', created_at:1721000000000 },
  { id:'ds004', client_id:'demo_004', trainer_id:999, session_date:'2026-07-25', session_time:'11:00', duration_min:60, type:'checkin', status:'scheduled', client_name:'Jennifer Kim', created_at:1721000000000 },
];

const DEMO_CHECKINS = [
  { id:'dc001', client_id:'demo_001', trainer_id:999, weight:218.5, energy:7, sleep:7, nutrition_compliance:85, mood:8, notes:'Appetite way down this week. Logged all meals. Energy improving.', client_name:'Alex Johnson', created_at:1721200000000 },
  { id:'dc002', client_id:'demo_002', trainer_id:999, weight:162.0, energy:8, sleep:8, nutrition_compliance:90, mood:9, notes:'Knee feeling strong. Completed all sessions. No pain post-workout.', client_name:'Sarah Martinez', created_at:1721100000000 },
  { id:'dc003', client_id:'demo_003', trainer_id:999, weight:197.0, energy:9, sleep:7, nutrition_compliance:94, mood:9, notes:'Hit new bench PR — 265 lbs. Nutrition on point all week.', client_name:'Marcus Williams', created_at:1721300000000 },
  { id:'dc004', client_id:'demo_004', trainer_id:999, weight:174.5, energy:7, sleep:8, nutrition_compliance:88, mood:8, notes:'Cycle more regular this month. Energy better. Keeping carbs low-glycemic.', client_name:'Jennifer Kim', created_at:1721000000000 },
];

const DEMO_TRAINER = {
  id: 999, email: 'demo@berofitpro.com', name: 'Demo Coach',
  status: 'active', trial_end: 9999999999999,
  brand_name: 'BeroFit Pilot', brand_tagline: 'See the platform in action',
  brand_color: '#2563eb', brand_secondary: '#1e40af', brand_accent: '#f59e0b',
  trial_days_left: 14
};

function isDemo(request) {
  const token = request.headers.get('X-Trainer-Token');
  return token === DEMO_TOKEN;
}

// ── LANDING PAGE HTML ─────────────────────────────────────────────────────
const LANDING_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>BeroFit Pro — Enterprise Fitness Platform</title>
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--navy:#1A2A4A;--gold:#C9A84C;--gold2:#E8C068;--white:#fff;--gray:#94A3B8;--dark:#0D1525;--green:#059669}
html{scroll-behavior:smooth}
body{font-family:'Inter',sans-serif;background:var(--dark);color:var(--white);overflow-x:hidden}
nav{position:fixed;top:0;left:0;right:0;z-index:100;display:flex;align-items:center;justify-content:space-between;padding:16px 48px;background:rgba(13,21,37,.92);backdrop-filter:blur(12px);border-bottom:1px solid rgba(201,168,76,.2)}
.nav-brand{font-family:'Oswald',sans-serif;font-size:1.5rem;font-weight:700;color:#fff;letter-spacing:.08em}
.nav-brand span{color:var(--gold)}
.nav-links{display:flex;gap:28px;align-items:center}
.nav-links a{color:var(--gray);text-decoration:none;font-size:.88rem;font-weight:500;transition:color .2s}
.nav-links a:hover{color:#fff}
.nav-cta{background:var(--gold)!important;color:var(--dark)!important;padding:10px 22px;border-radius:6px;font-weight:700!important}
.hero{min-height:100vh;display:flex;align-items:center;justify-content:center;flex-direction:column;text-align:center;padding:120px 24px 80px;background:radial-gradient(ellipse 80% 60% at 50% 0%,rgba(26,42,74,.8) 0%,transparent 70%),linear-gradient(180deg,#0D1525 0%,#111c35 100%);position:relative;overflow:hidden}
.hero::before{content:'';position:absolute;inset:0;background-image:linear-gradient(rgba(201,168,76,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(201,168,76,.04) 1px,transparent 1px);background-size:80px 80px}
.hero-eyebrow{font-size:.78rem;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:var(--gold);margin-bottom:20px;display:flex;align-items:center;gap:12px}
.hero-eyebrow::before,.hero-eyebrow::after{content:'';width:40px;height:1px;background:var(--gold);opacity:.5}
.hero h1{font-family:'Oswald',sans-serif;font-size:clamp(3rem,8vw,6rem);font-weight:700;line-height:.95;margin-bottom:12px}
.hero h1 span{color:var(--gold)}
.hero-sub{font-size:clamp(1rem,2.5vw,1.2rem);color:var(--gray);max-width:580px;line-height:1.7;margin:20px auto 40px}
.hero-actions{display:flex;gap:16px;flex-wrap:wrap;justify-content:center}
.btn-primary{background:var(--gold);color:var(--dark);padding:16px 36px;border-radius:6px;font-weight:700;font-size:.95rem;letter-spacing:.06em;text-decoration:none;transition:all .2s;display:inline-block}
.btn-primary:hover{background:var(--gold2);transform:translateY(-2px)}
.btn-secondary{background:transparent;color:#fff;padding:16px 36px;border-radius:6px;border:1px solid rgba(255,255,255,.2);font-weight:500;font-size:.95rem;text-decoration:none;transition:all .2s;display:inline-block}
.btn-secondary:hover{border-color:var(--gold);color:var(--gold)}
.hero-proof{margin-top:64px;display:flex;gap:48px;align-items:center;justify-content:center;flex-wrap:wrap}
.proof-num{font-family:'Oswald',sans-serif;font-size:2.2rem;font-weight:700;color:var(--gold);line-height:1}
.proof-label{font-size:.75rem;color:var(--gray);letter-spacing:.1em;margin-top:4px}
.gold-divider{height:2px;background:linear-gradient(90deg,transparent,var(--gold),transparent)}
section{padding:90px 24px}
.container{max-width:1100px;margin:0 auto}
.section-eyebrow{font-size:.72rem;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:var(--gold);margin-bottom:12px}
.section-title{font-family:'Oswald',sans-serif;font-size:clamp(2rem,4vw,2.8rem);font-weight:700;margin-bottom:14px;line-height:1.1}
.section-sub{font-size:1rem;color:var(--gray);max-width:540px;line-height:1.7;margin-bottom:56px}
.tiers{background:#0a1020}
.tiers-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:24px}
.tier-card{background:var(--navy);border:1px solid rgba(201,168,76,.15);border-radius:16px;padding:28px 24px;transition:all .3s;position:relative;overflow:visible}
.tier-card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:var(--gold);border-radius:16px 16px 0 0;opacity:0;transition:opacity .3s}
.tier-card:hover{transform:translateY(-4px);border-color:rgba(201,168,76,.4)}
.tier-card:hover::before,.tier-card.featured::before{opacity:1}
.tier-card.featured{border-color:var(--gold);background:linear-gradient(145deg,var(--navy),#1e3060)}
.tier-badge{font-size:.65rem;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:var(--dark);background:var(--gold);padding:3px 10px;border-radius:100px;display:inline-block;margin-bottom:16px}
.tier-name{font-family:'Oswald',sans-serif;font-size:1.4rem;font-weight:700;margin-bottom:6px}
.tier-desc{font-size:.82rem;color:var(--gray);margin-bottom:20px;line-height:1.5}
.tier-price{font-family:'Oswald',sans-serif;font-size:1.8rem;font-weight:700;color:var(--gold);line-height:1.2;margin-bottom:4px;word-break:keep-all;white-space:nowrap}
.tier-price-label{font-size:.72rem;color:var(--gray);margin-bottom:20px}
.tier-features{list-style:none}
.tier-features li{font-size:.82rem;color:#94A3B8;padding:5px 0;border-bottom:1px solid rgba(255,255,255,.05);display:flex;align-items:flex-start;gap:8px}
.tier-features li::before{content:'checkmark';color:var(--green);font-weight:700;flex-shrink:0}
.leg-banner{background:linear-gradient(135deg,#1a2a4a,#1e3060);border:1px solid rgba(201,168,76,.3);border-radius:12px;padding:32px;margin-top:48px;text-align:center}
.leg-banner h3{font-family:'Oswald',sans-serif;font-size:1.6rem;color:var(--gold);margin-bottom:8px}
.leg-banner p{color:var(--gray);font-size:.9rem;margin-bottom:24px}
.leg-prices{display:flex;gap:32px;justify-content:center;flex-wrap:wrap}
.leg-price{text-align:center}
.leg-price .name{font-size:.75rem;color:var(--gray);letter-spacing:.1em;text-transform:uppercase;margin-bottom:4px}
.leg-price .price{font-family:'Oswald',sans-serif;font-size:1.8rem;color:#fff;font-weight:700}
.leg-price .was{font-size:.75rem;color:#475569;text-decoration:line-through}
.diff{background:var(--dark)}
.diff-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:28px}
.diff-card{padding:28px;border-radius:12px;background:rgba(26,42,74,.3);border:1px solid rgba(255,255,255,.06)}
.diff-icon{font-size:1.8rem;margin-bottom:14px}
.diff-title{font-family:'Oswald',sans-serif;font-size:1.15rem;font-weight:600;margin-bottom:8px}
.diff-text{font-size:.85rem;color:var(--gray);line-height:1.7}
.compare{background:#0a1020}
.compare-table{width:100%;border-collapse:collapse}
.compare-table th{background:var(--navy);color:var(--gold);font-family:'Oswald',sans-serif;font-size:.9rem;font-weight:600;letter-spacing:.08em;padding:14px 16px;text-align:left}
.compare-table td{padding:12px 16px;font-size:.85rem;color:var(--gray);border-bottom:1px solid rgba(255,255,255,.04)}
.compare-table td:first-child{color:#fff;font-weight:500}
.compare-table tr:nth-child(even) td{background:rgba(255,255,255,.02)}
.yes{color:#059669!important;font-weight:700}
.no{color:#475569!important}
.cta-section{background:linear-gradient(135deg,var(--navy) 0%,#1e3060 100%);text-align:center;padding:100px 24px;position:relative;overflow:hidden}
.cta-section::before{content:'';position:absolute;inset:0;background-image:linear-gradient(rgba(201,168,76,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(201,168,76,.05) 1px,transparent 1px);background-size:60px 60px}
.cta-section h2{font-family:'Oswald',sans-serif;font-size:clamp(2.2rem,5vw,3.2rem);font-weight:700;margin-bottom:14px;position:relative}
.cta-section p{color:var(--gray);margin-bottom:36px;font-size:1rem;position:relative;max-width:540px;margin-left:auto;margin-right:auto;line-height:1.6}
.cta-links{display:flex;gap:16px;justify-content:center;flex-wrap:wrap;position:relative}
footer{background:#060d1a;padding:36px 24px;text-align:center;border-top:1px solid rgba(201,168,76,.1)}
footer p{font-size:.8rem;color:var(--gray)}
footer a{color:var(--gold);text-decoration:none}
@media(max-width:768px){nav{padding:14px 20px}.nav-links{display:none}section{padding:60px 16px}.hero{padding:100px 16px 60px}.hero-proof{gap:24px}}
</style>
</head>
<body>
<nav>
  <div class="nav-brand">BERO<span>FIT</span> PRO</div>
  <div class="nav-links">
    <a href="#tiers">Products</a>
    <a href="#why">Why BeroFit</a>
    <a href="#compare">Compare</a>
    <a href="/demo">Live Demo</a>
    <a href="mailto:ted@berofitpro.com" class="nav-cta">Get Started</a>
  </div>
</nav>

<section class="hero">
  <div class="hero-eyebrow">Enterprise Fitness Platform Ecosystem</div>
  <h1>ONE PLATFORM.<br><span>EVERY GYM.</span><br>EVERY COACH.</h1>
  <p class="hero-sub">From solo personal trainers to multi-location franchise operators. BeroFit Pro is the only platform built to serve every level of the fitness industry from one unified stack. Live today.</p>
  <div class="hero-actions">
    <a href="/demo" class="btn-primary">See the Live Demo</a>
    <a href="https://myironcladfit.com/assessment" class="btn-secondary">Client Experience</a>
  </div>
  <div class="hero-proof">
    <div><div class="proof-num">$49</div><div class="proof-label">Flat Monthly — Pilot</div></div>
    <div><div class="proof-num">0%</div><div class="proof-label">Revenue Share</div></div>
    <div><div class="proof-num">14</div><div class="proof-label">Day Free Trial</div></div>
    <div><div class="proof-num">4</div><div class="proof-label">Product Tiers</div></div>
  </div>
</section>

<div class="gold-divider"></div>

<section class="tiers" id="tiers">
  <div class="container">
    <div class="section-eyebrow">Product Tiers</div>
    <h2 class="section-title">One ecosystem. Four entry points.</h2>
    <p class="section-sub">Start where you are. Grow into the next tier when you are ready. Every product works standalone and integrates seamlessly when combined.</p>
    <div class="tiers-grid">
      <div class="tier-card">
        <span class="tier-badge">Tier 1</span>
        <div class="tier-name">BeroFit Club</div>
        <div class="tier-desc">Complete gym operating system for single-location independent facilities.</div>
        <div class="tier-price">$199</div>
        <div class="tier-price-label">per month</div>
        <ul class="tier-features">
          <li>Membership management and billing</li>
          <li>Class scheduling and waitlist</li>
          <li>Staff and shift management</li>
          <li>AI churn prediction</li>
          <li>Floor traffic heat map</li>
          <li>Club community and challenges</li>
          <li>Online store built in</li>
        </ul>
      </div>
      <div class="tier-card featured">
        <span class="tier-badge">Tier 2 — Most Popular</span>
        <div class="tier-name">BeroFit Pilot</div>
        <div class="tier-desc">The complete coaching platform for personal trainers and independent coaches.</div>
        <div class="tier-price">$49</div>
        <div class="tier-price-label">per month — unlimited clients</div>
        <ul class="tier-features">
          <li>Unlimited client management</li>
          <li>AI Smart Program Builder</li>
          <li>GLP-1 and peptide protocols</li>
          <li>Live workout logging</li>
          <li>Nutrition and meal planning</li>
          <li>White-label branding</li>
          <li>3 coaching delivery tiers</li>
          <li>Assessment funnel included</li>
          <li>Built-in online store</li>
        </ul>
      </div>
      <div class="tier-card">
        <span class="tier-badge">Tier 3</span>
        <div class="tier-name">BeroFit Suite</div>
        <div class="tier-desc">Club and Pilot combined. One database, one dashboard, one billing system.</div>
        <div class="tier-price">$349</div>
        <div class="tier-price-label">per month — unlimited trainers</div>
        <ul class="tier-features">
          <li>Everything in Club and Pilot</li>
          <li>Unified member-to-client pipeline</li>
          <li>Combined billing and scheduling</li>
          <li>Cross-platform revenue reporting</li>
          <li>Unlimited trainer seats</li>
        </ul>
      </div>
      <div class="tier-card">
        <span class="tier-badge">Enterprise</span>
        <div class="tier-name">BeroFit Enterprise</div>
        <div class="tier-desc">Single pane of glass for franchises, chains, and regional operators.</div>
        <div class="tier-price">Custom</div>
        <div class="tier-price-label">from $2,500/mo — up to 10 locations</div>
        <ul class="tier-features">
          <li>All locations, one dashboard</li>
          <li>Cross-location member management</li>
          <li>Regional operator hierarchy</li>
          <li>Bulk operations across all locations</li>
          <li>API access and BI integration</li>
        </ul>
      </div>
    </div>
    <div class="leg-banner">
      <h3>1st Phorm Legionnaire Pricing</h3>
      <p>Permanent family pricing — locked in for the life of your account. Not a promo. Not a trial.</p>
      <div class="leg-prices">
        <div class="leg-price"><div class="name">BeroFit Pilot</div><div class="price">$29<span style="font-size:1rem">/mo</span></div><div class="was">$49/mo standard</div></div>
        <div class="leg-price"><div class="name">BeroFit Club</div><div class="price">$129<span style="font-size:1rem">/mo</span></div><div class="was">$199/mo standard</div></div>
        <div class="leg-price"><div class="name">BeroFit Suite</div><div class="price">$249<span style="font-size:1rem">/mo</span></div><div class="was">$349/mo standard</div></div>
      </div>
    </div>
  </div>
</section>

<section class="diff" id="why">
  <div class="container">
    <div class="section-eyebrow">Why BeroFit</div>
    <h2 class="section-title">Built different. Priced different.</h2>
    <p class="section-sub">Five things no competitor offers simultaneously — all built into the platform from day one.</p>
    <div class="diff-grid">
      <div class="diff-card"><div class="diff-icon">💰</div><div class="diff-title">Flat Fee. Zero Revenue Share.</div><div class="diff-text">One price regardless of client count or revenue. We take 0% of what you earn. No per-client fees. No transaction percentages. No annual contracts required.</div></div>
      <div class="diff-card"><div class="diff-icon">💊</div><div class="diff-title">GLP-1 and Condition-Specific</div><div class="diff-text">The only platform with dedicated GLP-1 and peptide protocol support, plus 12 condition-specific program tracks. Built for how clients actually live in 2026.</div></div>
      <div class="diff-card"><div class="diff-icon">🐻</div><div class="diff-title">Native Community Architecture</div><div class="diff-text">Three-tier community with BEAR Points gamification, challenges, live audio rooms, and accountability pairing built in from day one.</div></div>
      <div class="diff-card"><div class="diff-icon">🎨</div><div class="diff-title">White-Label From Day One</div><div class="diff-text">Your name, your logo, your colors on everything clients see. BeroFit is invisible. This is infrastructure, not just software.</div></div>
      <div class="diff-card"><div class="diff-icon">🏋️</div><div class="diff-title">Live Workout Logging</div><div class="diff-text">Coaches log sets on the gym floor in real time. Weight, reps, form notes, every exercise, every session as it happens.</div></div>
      <div class="diff-card"><div class="diff-icon">🏪</div><div class="diff-title">Built-In Store and Affiliate</div><div class="diff-text">Branded online store with print-on-demand fulfillment and supplement affiliate integration. Passive revenue streams built into every account.</div></div>
    </div>
  </div>
</section>

<section class="compare" id="compare">
  <div class="container">
    <div class="section-eyebrow">Competitive Comparison</div>
    <h2 class="section-title">See the difference.</h2>
    <p class="section-sub">BeroFit Pilot at $49/month against what trainers are currently overpaying for.</p>
    <div style="overflow-x:auto">
      <table class="compare-table">
        <thead><tr><th>Feature</th><th>Trainerize</th><th>TrueCoach</th><th>Mindbody</th><th style="color:#E8C068">BeroFit Pilot</th></tr></thead>
        <tbody>
          <tr><td>Monthly cost</td><td>$99-$166</td><td>$129-$166</td><td>$199+</td><td class="yes">$49 flat</td></tr>
          <tr><td>Unlimited clients</td><td class="no">No</td><td class="no">No</td><td class="no">No</td><td class="yes">Yes</td></tr>
          <tr><td>0% revenue share</td><td class="yes">Yes</td><td class="yes">Yes</td><td class="no">No — 2.9%+</td><td class="yes">Yes</td></tr>
          <tr><td>GLP-1 protocols</td><td class="no">No</td><td class="no">No</td><td class="no">No</td><td class="yes">Yes</td></tr>
          <tr><td>AI program builder</td><td class="no">No</td><td class="no">No</td><td class="no">No</td><td class="yes">Yes</td></tr>
          <tr><td>Live workout logging</td><td class="no">No</td><td>Basic</td><td class="no">No</td><td class="yes">Yes</td></tr>
          <tr><td>Native community</td><td class="no">No</td><td class="no">No</td><td class="no">No</td><td class="yes">Yes</td></tr>
          <tr><td>White-label branding</td><td>Paid add-on</td><td class="no">No</td><td class="no">No</td><td class="yes">Included</td></tr>
          <tr><td>Built-in store</td><td class="no">No</td><td class="no">No</td><td class="no">No</td><td class="yes">Yes</td></tr>
          <tr><td>Free trial, no CC</td><td class="no">No</td><td class="no">No</td><td class="no">No</td><td class="yes">14 days</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</section>

<section class="cta-section">
  <div class="container">
    <h2>The platform is live.<br><span style="color:var(--gold)">See it right now.</span></h2>
    <p>No demo call needed. No sales rep. Click below and walk through the real platform in action.</p>
    <div class="cta-links">
      <a href="/demo" class="btn-primary">Live Demo</a>
      <a href="https://myironcladfit.com/assessment" class="btn-secondary">Client Assessment</a>
      <a href="mailto:ted@berofitpro.com" class="btn-secondary">Contact Ted</a>
    </div>
  </div>
</section>

<footer>
  <p>BeroFit Pro &nbsp;·&nbsp; <a href="mailto:ted@berofitpro.com">ted@berofitpro.com</a> &nbsp;·&nbsp; 267.421.6336</p>
  <p style="margin-top:8px;font-size:.72rem;color:#475569">© 2026 BeroFit Pro. All rights reserved.</p>
</footer>
</body>
</html>`;

// ── DEMO APP HTML ─────────────────────────────────────────────────────────
const DEMO_APP_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>BeroFit Pilot — Live Demo</title>
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--navy:#1A2A4A;--gold:#C9A84C;--white:#fff;--light:#F1F5F9;--gray:#64748B;--dark:#0F172A;--dark2:#1e293b;--green:#10b981;--red:#ef4444}
body{font-family:'Inter',sans-serif;background:var(--light);color:var(--dark);min-height:100vh;display:flex}
.sidebar{position:fixed;left:0;top:0;bottom:0;width:260px;background:var(--dark);display:flex;flex-direction:column;z-index:100}
.sidebar-brand{padding:24px 20px;border-bottom:1px solid rgba(255,255,255,.1)}
.brand-name{font-family:'Oswald',sans-serif;font-size:1.1rem;font-weight:700;color:var(--white);letter-spacing:.05em}
.brand-sub{font-size:.72rem;color:#94A3B8;margin-top:2px}
.demo-badge{background:rgba(201,168,76,.2);border:1px solid rgba(201,168,76,.4);color:var(--gold);font-size:.65rem;font-weight:700;letter-spacing:.1em;padding:3px 8px;border-radius:4px;display:inline-block;margin-top:8px}
.sidebar-nav{flex:1;padding:16px 12px;overflow-y:auto}
.nav-item{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:8px;color:#94A3B8;font-size:.88rem;font-weight:500;cursor:pointer;transition:all .15s;margin-bottom:2px;border:none;background:none;width:100%;text-align:left}
.nav-item:hover,.nav-item.active{background:linear-gradient(135deg,#2563eb,#1e40af);color:#fff}
.main{margin-left:260px;min-height:100vh;display:flex;flex-direction:column}
.topbar{background:#fff;border-bottom:1px solid #e2e8f0;padding:0 32px;height:64px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:50}
.topbar-title{font-size:1.1rem;font-weight:800;color:var(--dark)}
.page-body{flex:1;padding:32px}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:28px}
.stat-card{background:#fff;border-radius:12px;padding:20px;box-shadow:0 1px 8px rgba(0,0,0,.06)}
.stat-val{font-size:1.8rem;font-weight:900;color:var(--dark);line-height:1}
.stat-lbl{font-size:.75rem;color:var(--gray);text-transform:uppercase;letter-spacing:.06em;margin-top:4px}
.card{background:#fff;border-radius:12px;padding:24px;box-shadow:0 1px 8px rgba(0,0,0,.06);margin-bottom:20px}
.card-title{font-size:1rem;font-weight:800;color:var(--dark);margin-bottom:16px;display:flex;justify-content:space-between;align-items:center}
.clients-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px}
.client-card{background:#fff;border-radius:12px;padding:18px;box-shadow:0 1px 8px rgba(0,0,0,.06);border:2px solid transparent;cursor:pointer;transition:all .2s}
.client-card:hover{border-color:#2563eb;transform:translateY(-2px)}
.client-header{display:flex;align-items:center;gap:12px;margin-bottom:12px}
.avatar{width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#2563eb,#1e40af);display:flex;align-items:center;justify-content:center;color:#fff;font-size:1.1rem;font-weight:800}
.client-name{font-size:.95rem;font-weight:700;color:var(--dark)}
.client-goal{font-size:.78rem;color:var(--gray);margin-top:2px}
.pill{font-size:.68rem;padding:3px 8px;border-radius:100px;font-weight:600;display:inline-block}
.pill-green{background:#d1fae5;color:#065f46}
.pill-blue{background:#dbeafe;color:#1e40af}
.pill-yellow{background:#fef3c7;color:#92400e}
.streak{font-size:.78rem;color:var(--gold);font-weight:700}
.session-item{display:flex;align-items:center;gap:14px;padding:12px 0;border-bottom:1px solid #f1f5f9}
.session-item:last-child{border-bottom:none}
.session-date{text-align:center;min-width:44px}
.session-day{font-size:.62rem;color:var(--gray);text-transform:uppercase;font-weight:700}
.session-d{font-size:1.2rem;font-weight:900;color:var(--dark);line-height:1}
.session-info{flex:1}
.session-client{font-size:.88rem;font-weight:700;color:var(--dark)}
.session-meta{font-size:.75rem;color:var(--gray);margin-top:2px}
.demo-banner{background:linear-gradient(135deg,#1A2A4A,#1e3060);border-radius:12px;padding:16px 20px;margin-bottom:24px;display:flex;align-items:center;justify-content:space-between}
.demo-banner-text{color:#94A3B8;font-size:.82rem}
.demo-banner-text strong{color:var(--gold)}
.back-link{color:#2563eb;font-size:.82rem;text-decoration:none;font-weight:600}
.back-link:hover{text-decoration:underline}
@media(max-width:768px){.sidebar{display:none}.main{margin-left:0}.stats{grid-template-columns:1fr 1fr}}
</style>
</head>
<body>
<nav class="sidebar">
  <div class="sidebar-brand">
    <div class="brand-name">BeroFit Pilot</div>
    <div class="brand-sub">Powered by BeroFit Pro</div>
    <div class="demo-badge">LIVE DEMO</div>
  </div>
  <div class="sidebar-nav">
    <button class="nav-item active" onclick="showPage('dashboard')">📊 Dashboard</button>
    <button class="nav-item" onclick="showPage('clients')">👥 Clients</button>
    <button class="nav-item" onclick="showPage('schedule')">📅 Schedule</button>
    <button class="nav-item" onclick="showPage('programs')">💪 Programs</button>
    <button class="nav-item" onclick="showPage('nutrition')">🥗 Nutrition</button>
    <button class="nav-item" onclick="showPage('checkins')">✅ Check-ins</button>
    <button class="nav-item" onclick="showPage('community')">🐻 Bear Den</button>
    <button class="nav-item" onclick="showPage('store')">🏪 Store</button>
    <button class="nav-item" onclick="showPage('brand')">🎨 My Brand</button>
  </div>
  <div style="padding:16px 12px;border-top:1px solid rgba(255,255,255,.1)">
    <div style="font-size:.72rem;color:#475569;margin-bottom:4px">Demo Account</div>
    <div style="font-size:.82rem;color:#94A3B8">demo@berofitpro.com</div>
    <a href="/" style="display:block;margin-top:12px;font-size:.78rem;color:var(--gold);text-decoration:none">← Back to berofitpro.com</a>
  </div>
</nav>

<div class="main">
  <div class="topbar">
    <div class="topbar-title" id="page-title">Dashboard</div>
    <div style="display:flex;align-items:center;gap:12px">
      <span style="font-size:.8rem;color:var(--gray)">Demo Coach</span>
      <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#2563eb,#1e40af);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:.8rem">D</div>
    </div>
  </div>

  <div class="page-body">
    <div class="demo-banner">
      <div class="demo-banner-text">You are viewing a <strong>live demo</strong> of BeroFit Pilot. All clients shown are fictional. <a href="mailto:ted@berofitpro.com" style="color:var(--gold)">Contact Ted</a> to start your free 14-day trial.</div>
      <a href="/" class="back-link" style="color:var(--gold);white-space:nowrap;margin-left:16px">berofitpro.com →</a>
    </div>

    <!-- DASHBOARD -->
    <div id="page-dashboard">
      <div class="stats">
        <div class="stat-card"><div style="font-size:1.5rem;margin-bottom:8px">👥</div><div class="stat-val">4</div><div class="stat-lbl">Active Clients</div></div>
        <div class="stat-card"><div style="font-size:1.5rem;margin-bottom:8px">📅</div><div class="stat-val">3</div><div class="stat-lbl">Sessions This Week</div></div>
        <div class="stat-card"><div style="font-size:1.5rem;margin-bottom:8px">✅</div><div class="stat-val">4</div><div class="stat-lbl">Check-ins This Month</div></div>
        <div class="stat-card"><div style="font-size:1.5rem;margin-bottom:8px">🔥</div><div class="stat-val">11</div><div class="stat-lbl">Avg Check-in Streak</div></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
        <div class="card">
          <div class="card-title">Upcoming Sessions</div>
          <div class="session-item"><div class="session-date"><div class="session-day">Thu</div><div class="session-d">24</div></div><div class="session-info"><div class="session-client">Alex Johnson</div><div class="session-meta">9:00 AM · 60 min · Training</div></div><span class="pill pill-green">Confirmed</span></div>
          <div class="session-item"><div class="session-date"><div class="session-day">Wed</div><div class="session-d">23</div></div><div class="session-info"><div class="session-client">Sarah Martinez</div><div class="session-meta">10:30 AM · 45 min · Training</div></div><span class="pill pill-green">Confirmed</span></div>
          <div class="session-item"><div class="session-date"><div class="session-day">Fri</div><div class="session-d">25</div></div><div class="session-info"><div class="session-client">Jennifer Kim</div><div class="session-meta">11:00 AM · 60 min · Check-in</div></div><span class="pill pill-green">Confirmed</span></div>
        </div>
        <div class="card">
          <div class="card-title">Recent Check-ins</div>
          <div class="session-item"><div class="avatar" style="width:36px;height:36px;font-size:.85rem">AJ</div><div class="session-info"><div class="session-client">Alex Johnson</div><div class="session-meta">Energy 7/10 · Nutrition 85% · Weight 218.5 lbs</div></div></div>
          <div class="session-item"><div class="avatar" style="width:36px;height:36px;font-size:.85rem">SM</div><div class="session-info"><div class="session-client">Sarah Martinez</div><div class="session-meta">Energy 8/10 · Nutrition 90% · Weight 162 lbs</div></div></div>
          <div class="session-item"><div class="avatar" style="width:36px;height:36px;font-size:.85rem">MW</div><div class="session-info"><div class="session-client">Marcus Williams</div><div class="session-meta">Energy 9/10 · Nutrition 94% · Weight 197 lbs</div></div></div>
        </div>
      </div>
    </div>

    <!-- CLIENTS -->
    <div id="page-clients" style="display:none">
      <div style="margin-bottom:20px"><h2 style="font-size:1.2rem;font-weight:800">Your Clients</h2><p style="font-size:.85rem;color:var(--gray);margin-top:4px">Click any client to view their full profile</p></div>
      <div class="clients-grid">
        <div class="client-card" onclick="alert('Full client profile — programs, nutrition, progress photos, check-ins, chat — all in the live platform.')">
          <div class="client-header"><div class="avatar">AJ</div><div><div class="client-name">Alex Johnson</div><div class="client-goal">Lose 30 lbs on Ozempic, build lean muscle</div></div></div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px"><span class="pill pill-blue">GLP-1</span><span class="pill pill-yellow">Type 2 Diabetes</span><span class="pill pill-green">Active</span></div>
          <div class="streak">🔥 8-week streak · 218.5 lbs</div>
        </div>
        <div class="client-card" onclick="alert('Full client profile — programs, nutrition, progress photos, check-ins, chat — all in the live platform.')">
          <div class="client-header"><div class="avatar">SM</div><div><div class="client-name">Sarah Martinez</div><div class="client-goal">Knee replacement recovery, return to hiking</div></div></div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px"><span class="pill pill-yellow">Post-Surgical</span><span class="pill pill-green">Active</span></div>
          <div class="streak">🔥 12-week streak · 162 lbs</div>
        </div>
        <div class="client-card" onclick="alert('Full client profile — programs, nutrition, progress photos, check-ins, chat — all in the live platform.')">
          <div class="client-header"><div class="avatar">MW</div><div><div class="client-name">Marcus Williams</div><div class="client-goal">Add 15 lbs lean muscle by year end</div></div></div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px"><span class="pill pill-green">Active</span></div>
          <div class="streak">🔥 18-week streak · 197 lbs</div>
        </div>
        <div class="client-card" onclick="alert('Full client profile — programs, nutrition, progress photos, check-ins, chat — all in the live platform.')">
          <div class="client-header"><div class="avatar">JK</div><div><div class="client-name">Jennifer Kim</div><div class="client-goal">Manage PCOS, lose 20 lbs</div></div></div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px"><span class="pill pill-yellow">PCOS Protocol</span><span class="pill pill-green">Active</span></div>
          <div class="streak">🔥 6-week streak · 174.5 lbs</div>
        </div>
      </div>
    </div>

    <!-- OTHER PAGES -->
    <div id="page-schedule" style="display:none">
      <div class="card"><div class="card-title">Upcoming Sessions</div>
        <div class="session-item"><div class="session-date"><div class="session-day">Wed</div><div class="session-d">23</div></div><div class="session-info"><div class="session-client">Sarah Martinez</div><div class="session-meta">10:30 AM · 45 min · Training · Post-surgical protocol</div></div></div>
        <div class="session-item"><div class="session-date"><div class="session-day">Thu</div><div class="session-d">24</div></div><div class="session-info"><div class="session-client">Alex Johnson</div><div class="session-meta">9:00 AM · 60 min · Training · GLP-1 muscle preservation</div></div></div>
        <div class="session-item"><div class="session-date"><div class="session-day">Fri</div><div class="session-d">25</div></div><div class="session-info"><div class="session-client">Jennifer Kim</div><div class="session-meta">11:00 AM · 60 min · Monthly check-in · PCOS protocol review</div></div></div>
      </div>
    </div>
    <div id="page-programs" style="display:none"><div class="card" style="text-align:center;padding:60px"><div style="font-size:3rem;margin-bottom:16px">💪</div><h3 style="font-size:1.2rem;font-weight:800;margin-bottom:8px">AI Program Builder</h3><p style="color:var(--gray)">Input client goals, conditions, equipment, and schedule. Full 12-week program generated in seconds. Available in the full platform.</p></div></div>
    <div id="page-nutrition" style="display:none"><div class="card" style="text-align:center;padding:60px"><div style="font-size:3rem;margin-bottom:16px">🥗</div><h3 style="font-size:1.2rem;font-weight:800;margin-bottom:8px">Nutrition and Meal Planning</h3><p style="color:var(--gray)">Full macro tracking, 93+ recipes, GLP-1 meal structures, grocery list generator, and Ask the Chef AI. Available in the full platform.</p></div></div>
    <div id="page-checkins" style="display:none">
      <div class="card"><div class="card-title">Recent Check-ins</div>
        <div class="session-item"><div class="avatar" style="width:40px;height:40px;font-size:.9rem">AJ</div><div class="session-info"><div class="session-client">Alex Johnson</div><div class="session-meta">Weight 218.5 · Energy 7/10 · Sleep 7/10 · Nutrition 85%</div><div style="font-size:.78rem;color:var(--gray);margin-top:4px">Appetite way down this week. Logged all meals. Energy improving.</div></div></div>
        <div class="session-item"><div class="avatar" style="width:40px;height:40px;font-size:.9rem">SM</div><div class="session-info"><div class="session-client">Sarah Martinez</div><div class="session-meta">Weight 162 · Energy 8/10 · Sleep 8/10 · Nutrition 90%</div><div style="font-size:.78rem;color:var(--gray);margin-top:4px">Knee feeling strong. Completed all sessions. No pain post-workout.</div></div></div>
        <div class="session-item"><div class="avatar" style="width:40px;height:40px;font-size:.9rem">MW</div><div class="session-info"><div class="session-client">Marcus Williams</div><div class="session-meta">Weight 197 · Energy 9/10 · Sleep 7/10 · Nutrition 94%</div><div style="font-size:.78rem;color:var(--gray);margin-top:4px">Hit new bench PR — 265 lbs. Nutrition on point all week.</div></div></div>
        <div class="session-item"><div class="avatar" style="width:40px;height:40px;font-size:.9rem">JK</div><div class="session-info"><div class="session-client">Jennifer Kim</div><div class="session-meta">Weight 174.5 · Energy 7/10 · Sleep 8/10 · Nutrition 88%</div><div style="font-size:.78rem;color:var(--gray);margin-top:4px">Cycle more regular this month. Energy better. Keeping carbs low-glycemic.</div></div></div>
      </div>
    </div>
    <div id="page-community" style="display:none"><div class="card" style="text-align:center;padding:60px"><div style="font-size:3rem;margin-bottom:16px">🐻</div><h3 style="font-size:1.2rem;font-weight:800;margin-bottom:8px">Bear Den Community</h3><p style="color:var(--gray)">Club feed, BEAR Points gamification, challenges, accountability pairing, and the BeroFit network. Available in the full platform.</p></div></div>
    <div id="page-store" style="display:none"><div class="card" style="text-align:center;padding:60px"><div style="font-size:3rem;margin-bottom:16px">🏪</div><h3 style="font-size:1.2rem;font-weight:800;margin-bottom:8px">Built-In Store</h3><p style="color:var(--gray)">Branded merch store with print-on-demand fulfillment and supplement affiliate integration. Zero inventory. Available in the full platform.</p></div></div>
    <div id="page-brand" style="display:none"><div class="card" style="text-align:center;padding:60px"><div style="font-size:3rem;margin-bottom:16px">🎨</div><h3 style="font-size:1.2rem;font-weight:800;margin-bottom:8px">White-Label Your Brand</h3><p style="color:var(--gray)">Your name, your logo, your colors on everything your clients see. BeroFit stays invisible. Set up in minutes. Available in the full platform.</p></div></div>
  </div>
</div>

<script>
function showPage(name) {
  document.querySelectorAll('[id^="page-"]').forEach(p => p.style.display = 'none');
  document.getElementById('page-' + name).style.display = 'block';
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  event.currentTarget.classList.add('active');
  const titles = {dashboard:'Dashboard',clients:'Clients',schedule:'Schedule',programs:'Programs',nutrition:'Nutrition',checkins:'Check-ins',community:'Bear Den',store:'Store',brand:'My Brand'};
  document.getElementById('page-title').textContent = titles[name] || name;
}
</script>
</body>
</html>`;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    const db = env.DB;

    if (method === 'OPTIONS') return new Response('', { headers: CORS });

    // ── ROOT — marketing landing page ─────────────────────────────
    if ((path === '/' || path === '') && method === 'GET') {
      return new Response(LANDING_HTML, {
        headers: { 'Content-Type': 'text/html;charset=utf-8', 'Cache-Control': 'public,max-age=300' }
      });
    }

    // ── /demo — fully self-contained, NO real client data ─────────
    if (path === '/demo' && method === 'GET') {
      return new Response(DEMO_APP_HTML, {
        headers: { 'Content-Type': 'text/html;charset=utf-8', 'Cache-Control': 'no-cache' }
      });
    }

    // ── DEMO API INTERCEPT — hardcoded responses ──────────────────
    if (isDemo(request)) {
      if (path === '/auth/me') return json(DEMO_TRAINER);
      if (path === '/clients') return json(DEMO_CLIENTS);
      if (path === '/sessions') return json(DEMO_SESSIONS);
      if (path === '/checkins') return json(DEMO_CHECKINS);
      if (path === '/dashboard') return json({
        total_clients: 4, active_clients: 4, sessions_today: 1,
        upcoming_sessions: DEMO_SESSIONS,
        needs_attention: [],
        trial_end: 9999999999999, trial_days_left: 14
      });
      return json({ error: 'Demo mode' }, 403);
    }

    // ── AUTH ──────────────────────────────────────────────────────
    if (path === '/auth/request' && method === 'POST') {
      const { email } = await request.json();
      if (!email) return json({ error: 'Email required' }, 400);
      const emailLower = email.toLowerCase().trim();
      const magicToken = genToken(48);
      const expires = Date.now() + (15 * 60 * 1000);
      let trainer = await db.prepare('SELECT * FROM trainers WHERE email=?').bind(emailLower).first();
      if (!trainer) {
        const trialEnd = Date.now() + (14 * 24 * 60 * 60 * 1000);
        await db.prepare(`INSERT INTO trainers (email,magic_token,magic_expires,trial_end,created_at,status,brand_name,brand_color,brand_secondary) VALUES (?,?,?,?,?,?,?,?,?)`)
          .bind(emailLower,magicToken,expires,trialEnd,Date.now(),'trial','My Coaching Brand','#2563eb','#1e40af').run();
      } else {
        await db.prepare('UPDATE trainers SET magic_token=?,magic_expires=? WHERE email=?').bind(magicToken,expires,emailLower).run();
      }
      const magicLink = `${url.origin}/auth/verify?token=${magicToken}`;
      return json({ success: true, magic_link: magicLink, message: 'Magic link sent' });
    }

    if (path === '/auth/verify' && method === 'GET') {
      const token = url.searchParams.get('token');
      if (!token) return json({ error: 'Token required' }, 400);
      const trainer = await db.prepare('SELECT * FROM trainers WHERE magic_token=? AND magic_expires > ?').bind(token,Date.now()).first();
      if (!trainer) return json({ error: 'Invalid or expired link' }, 401);
      const sessionToken = genToken(64);
      const sessionExpires = Date.now() + (30 * 24 * 60 * 60 * 1000);
      await db.prepare(`UPDATE trainers SET session_token=?,token_expires=?,magic_token=NULL,magic_expires=NULL WHERE id=?`).bind(sessionToken,sessionExpires,trainer.id).run();
      return Response.redirect(`${url.origin}/app?session=${sessionToken}`, 302);
    }

    if (path === '/auth/logout' && method === 'POST') {
      const trainer = await verifyTrainer(request, db);
      if (trainer) await db.prepare('UPDATE trainers SET session_token=NULL,token_expires=NULL WHERE id=?').bind(trainer.id).run();
      return json({ success: true });
    }

    if (path === '/auth/me' && method === 'GET') {
      const trainer = await verifyTrainer(request, db);
      if (!trainer) return json({ error: 'Unauthorized' }, 401);
      const { session_token, magic_token, ...safe } = trainer;
      return json(safe);
    }

    if (path === '/clients' && method === 'GET') {
      const trainer = await verifyTrainer(request, db);
      if (!trainer) return json({ error: 'Unauthorized' }, 401);
      const clients = await db.prepare('SELECT * FROM clients WHERE trainer_id=? ORDER BY created_at DESC').bind(trainer.id).all();
      return json(clients.results || []);
    }

    if (path === '/dashboard' && method === 'GET') {
      const trainer = await verifyTrainer(request, db);
      if (!trainer) return json({ error: 'Unauthorized' }, 401);
      const total = await db.prepare('SELECT COUNT(*) as n FROM clients WHERE trainer_id=? AND is_ghost=0').bind(trainer.id).first();
      const active = await db.prepare('SELECT COUNT(*) as n FROM clients WHERE trainer_id=? AND status=? AND is_ghost=0').bind(trainer.id,'active').first();
      const today = new Date().toISOString().split('T')[0];
      const todaySessions = await db.prepare('SELECT COUNT(*) as n FROM sessions WHERE trainer_id=? AND session_date=?').bind(trainer.id,today).first();
      return json({
        total_clients: total?.n||0, active_clients: active?.n||0,
        sessions_today: todaySessions?.n||0,
        upcoming_sessions: [], needs_attention: [],
        trial_end: trainer.trial_end||9999999999999, trial_days_left: 14,
      });
    }

    return json({ error: 'Not found' }, 404);
  }
};
