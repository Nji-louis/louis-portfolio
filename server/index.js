require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const { notifyEmail, notifyWhatsApp } = require('./notifications');

const app = express();
const port = Number(process.env.PORT || 3000);
const production = process.env.NODE_ENV === 'production';
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false' } : undefined, max: 10, idleTimeoutMillis: 30000, connectionTimeoutMillis: 10000 });
const statuses = ['new','contacted','qualified','quoted','negotiation','won','lost','not_fit'];
const cookieName = 'louis_admin_session';

if (production && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) throw new Error('JWT_SECRET must be set to a random value of at least 32 characters in production.');
app.disable('x-powered-by');
app.set('trust proxy', process.env.TRUST_PROXY === 'true' ? 1 : false);
app.use(helmet({ contentSecurityPolicy: { directives: { defaultSrc: ["'self'"], styleSrc: ["'self'", "'unsafe-inline'"], scriptSrc: ["'self'"], imgSrc: ["'self'", 'data:'], connectSrc: ["'self'"], objectSrc: ["'none'"], frameAncestors: ["'none'"] } } }));
app.use(express.json({ limit: '20kb' }));
app.use(express.urlencoded({ extended: false, limit: '20kb' }));
app.use('/server', (_req, res) => res.sendStatus(404));
app.use(express.static(path.join(__dirname, '..'), { index: 'index.html', dotfiles: 'deny', setHeaders(res, filePath) { if (filePath.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache'); } }));
const publicLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 8, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'Too many requests. Please try again later.' } });
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 8, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'Too many login attempts. Try again later.' } });

async function initialize() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required. Configure a PostgreSQL database before starting.');
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(schema);
}
function createToken() {
  const secret = process.env.JWT_SECRET || 'local-development-only-change-this-secret';
  return jwt.sign({ role: 'admin' }, secret, { expiresIn: '8h', issuer: 'louis-portfolio', audience: 'louis-admin' });
}
function auth(req, res, next) {
  const token = req.cookiesToken || (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  try {
    if (!token) throw new Error('missing');
    const claims = jwt.verify(token, process.env.JWT_SECRET || 'local-development-only-change-this-secret', { issuer: 'louis-portfolio', audience: 'louis-admin' });
    if (claims.role !== 'admin') throw new Error('role');
    next();
  } catch { res.status(401).json({ error: 'Please sign in again.' }); }
}
// Small cookie parser avoids adding a dependency-specific parsing layer.
app.use((req, _res, next) => {
  const raw = req.headers.cookie || '';
  const item = raw.split(';').map(v => v.trim()).find(v => v.startsWith(cookieName + '='));
  req.cookiesToken = item ? decodeURIComponent(item.slice(cookieName.length + 1)) : '';
  next();
});
app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'louis-portfolio-leads' }));
app.post('/api/auth/login', loginLimiter, async (req, res) => {
  const { username, password } = req.body || {};
  if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD_HASH || !process.env.JWT_SECRET) return res.status(503).json({ error: 'Admin login is not configured. Set ADMIN_USERNAME, ADMIN_PASSWORD_HASH, and JWT_SECRET.' });
  const userOk = typeof username === 'string' && username === process.env.ADMIN_USERNAME;
  const passOk = typeof password === 'string' && await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH).catch(() => false);
  if (!userOk || !passOk) return res.status(401).json({ error: 'Invalid username or password.' });
  res.cookie(cookieName, createToken(), { httpOnly: true, secure: production, sameSite: 'strict', maxAge: 8 * 60 * 60 * 1000, path: '/' });
  res.json({ ok: true });
});
app.post('/api/auth/logout', (_req, res) => { res.clearCookie(cookieName, { httpOnly: true, secure: production, sameSite: 'strict', path: '/' }); res.json({ ok: true }); });

app.post('/api/leads', publicLimiter, async (req, res) => {
  const b = req.body || {};
  if (typeof b['bot-field'] === 'string' && b['bot-field'].trim()) return res.status(200).json({ ok: true });
  const lead = {
    name: clean(b.name, 100), email: clean(b.email, 254).toLowerCase(), phone: clean(b.phone, 40), country: clean(b.country, 100),
    service: clean(b.service, 120), budget: clean(b.budget, 100), timeline: clean(b.timeline, 100), message: clean(b.message, 5000)
  };
  if (!lead.name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email) || !lead.service || !lead.budget || !lead.timeline || lead.message.length < 5) return res.status(400).json({ error: 'Please provide a valid name, email, service, budget, timeline, and project description.' });
  try {
    const result = await pool.query(`INSERT INTO leads(name,email,phone,country,service,budget,timeline,message) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`, [lead.name, lead.email, lead.phone || null, lead.country || null, lead.service, lead.budget, lead.timeline, lead.message]);
    const saved = result.rows[0];
    // Persist first; notification failures must never erase a lead.
    const [emailResult, waResult] = await Promise.allSettled([notifyEmail(saved), notifyWhatsApp(saved)]);
    const emailStatus = emailResult.status === 'fulfilled' ? emailResult.value.status : 'failed';
    const waStatus = waResult.status === 'fulfilled' ? waResult.value.status : 'failed';
    await pool.query('UPDATE leads SET email_notification_status=$1, whatsapp_notification_status=$2 WHERE id=$3', [emailStatus, waStatus, saved.id]);
    if (emailResult.status === 'rejected') console.error('Lead email notification failed:', emailResult.reason.message);
    if (waResult.status === 'rejected') console.error('Lead WhatsApp notification failed:', waResult.reason.message);
    res.status(201).json({ ok: true, id: saved.id, message: 'Your enquiry was saved. Thank you; we will review it shortly.' });
  } catch (error) { console.error('Lead creation failed:', error.message); res.status(500).json({ error: 'We could not save your enquiry. Please try again or contact us directly.' }); }
});
function clean(value, max) { return typeof value === 'string' ? value.trim().slice(0, max) : ''; }

app.get('/admin', (_req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'admin', 'index.html')));
app.get('/admin/admin.css', (_req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'admin', 'admin.css')));
app.get('/admin/app.js', (_req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'admin', 'app.js')));
app.get('/api/admin/me', auth, (_req, res) => res.json({ ok: true, username: process.env.ADMIN_USERNAME }));
app.get('/api/admin/summary', auth, async (_req, res) => {
  try {
    const { rows } = await pool.query(`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status='new')::int AS new, COUNT(*) FILTER (WHERE status IN ('contacted','qualified','quoted','negotiation'))::int AS active, COUNT(*) FILTER (WHERE status='won')::int AS won, COUNT(*) FILTER (WHERE status='lost')::int AS lost, COUNT(*) FILTER (WHERE next_follow_up < CURRENT_DATE AND status NOT IN ('won','lost','not_fit'))::int AS overdue, COALESCE(SUM(quote_amount) FILTER (WHERE status='won'),0)::numeric AS won_value FROM leads`);
    res.json(rows[0]);
  } catch (e) { console.error(e.message); res.status(500).json({ error: 'Could not load summary.' }); }
});
app.get('/api/admin/leads', auth, async (req, res) => {
  try {
    const status = clean(req.query.status, 30); const q = clean(req.query.q, 100);
    const values = []; let where = [];
    if (status && statuses.includes(status)) { values.push(status); where.push(`status=$${values.length}`); }
    if (q) { values.push(`%${q.replace(/[\\%_]/g, '\\$&')}%`); where.push(`(name ILIKE $${values.length} OR email ILIKE $${values.length} OR service ILIKE $${values.length} OR message ILIKE $${values.length})`); }
    const sql = `SELECT id,name,email,phone,country,service,budget,timeline,message,source,status,quote_amount,currency,next_follow_up,notes,email_notification_status,whatsapp_notification_status,created_at,updated_at FROM leads ${where.length ? 'WHERE '+where.join(' AND ') : ''} ORDER BY created_at DESC LIMIT 500`;
    const { rows } = await pool.query(sql, values); res.json(rows);
  } catch (e) { console.error(e.message); res.status(500).json({ error: 'Could not load leads.' }); }
});
app.patch('/api/admin/leads/:id', auth, async (req, res) => {
  const id = Number(req.params.id); if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ error: 'Invalid lead ID.' });
  const b = req.body || {}; const updates = []; const values = [];
  const fields = { status: v => typeof v === 'string' && statuses.includes(v), quote_amount: v => v === null || (v !== '' && Number.isFinite(Number(v)) && Number(v) >= 0), next_follow_up: v => v === null || v === '' || (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)), notes: v => typeof v === 'string' && v.length <= 5000 };
  for (const [field, validate] of Object.entries(fields)) if (Object.hasOwn(b, field)) {
    if (!validate(b[field])) return res.status(400).json({ error: `Invalid ${field}.` });
    values.push(field === 'quote_amount' ? (b[field] === '' ? null : b[field]) : (b[field] === '' ? null : b[field])); updates.push(`${field}=$${values.length}`);
  }
  if (!updates.length) return res.status(400).json({ error: 'No editable fields supplied.' });
  updates.push('updated_at=NOW()'); values.push(id);
  try { const r = await pool.query(`UPDATE leads SET ${updates.join(', ')} WHERE id=$${values.length} RETURNING id,status,quote_amount,next_follow_up,notes,updated_at`, values); if (!r.rowCount) return res.status(404).json({ error: 'Lead not found.' }); res.json(r.rows[0]); }
  catch (e) { console.error(e.message); res.status(500).json({ error: 'Could not update lead.' }); }
});
app.get('/api/admin/notification-config', auth, (_req, res) => res.json({ email: Boolean(process.env.SMTP_HOST && process.env.NOTIFY_EMAIL), whatsapp: Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_NOTIFY_TO), whatsappTemplate: Boolean(process.env.WHATSAPP_TEMPLATE_NAME) }));
app.get('/api/admin/*', (_req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'admin', 'index.html')));
app.use((err, _req, res, _next) => { console.error(err.message); res.status(500).json({ error: 'Unexpected server error.' }); });

initialize().then(() => app.listen(port, () => console.log(`Louis Portfolio platform listening on port ${port}`))).catch(err => { console.error('Startup failed:', err.message); process.exit(1); });
process.on('SIGTERM', async () => { await pool.end(); process.exit(0); });
