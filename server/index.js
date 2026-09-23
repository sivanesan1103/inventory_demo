// Small API server: accounts, per-user inventory, custom forms and their responses.
// Data lives in a single JSON file (DATA_FILE), written atomically on every change.
import express from 'express'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT) || 3001
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, 'data', 'db.json')
const SESSION_DAYS = 30
const FIELD_TYPES = ['text', 'textarea', 'number', 'email', 'date', 'select']

// ---------- storage ----------
function load() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))
  } catch {
    return { users: [], sessions: {}, products: {}, forms: [], entries: [] }
  }
}
const db = load()
for (const [token, s] of Object.entries(db.sessions)) if (s.expires < Date.now()) delete db.sessions[token]

function save() {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true })
  const tmp = DATA_FILE + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(db))
  fs.renameSync(tmp, DATA_FILE)
}

const newId = () => crypto.randomUUID()

// ---------- auth helpers ----------
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  return { salt, hash }
}

function checkPassword(password, user) {
  const { hash } = hashPassword(password, user.salt)
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(user.hash, 'hex'))
}

function parseCookies(header = '') {
  return Object.fromEntries(
    header.split(';').map((c) => c.trim().split('=')).filter(([k]) => k).map(([k, v]) => [k, decodeURIComponent(v || '')])
  )
}

function startSession(res, userId) {
  const token = crypto.randomBytes(32).toString('hex')
  db.sessions[token] = { userId, expires: Date.now() + SESSION_DAYS * 864e5 }
  save()
  res.setHeader('Set-Cookie', `sid=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_DAYS * 86400}`)
}

function currentUser(req) {
  const token = parseCookies(req.headers.cookie).sid
  const s = token && db.sessions[token]
  if (!s) return null
  if (s.expires < Date.now()) {
    delete db.sessions[token]
    save()
    return null
  }
  return db.users.find((u) => u.id === s.userId) || null
}

function requireUser(req, res, next) {
  req.user = currentUser(req)
  if (!req.user) return res.status(401).json({ error: 'Please log in.' })
  next()
}

const publicUser = (u) => ({ id: u.id, username: u.username, email: u.email || '' })

// ---------- validation ----------
function cleanFields(fields) {
  if (!Array.isArray(fields)) return []
  return fields
    .map((f) => ({
      id: typeof f.id === 'string' && f.id ? f.id : newId(),
      label: String(f.label || '').trim().slice(0, 200),
      type: FIELD_TYPES.includes(f.type) ? f.type : 'text',
      required: Boolean(f.required),
      options: f.type === 'select' && Array.isArray(f.options)
        ? f.options.map((o) => String(o).trim()).filter(Boolean).slice(0, 100)
        : [],
    }))
    .filter((f) => f.label)
}

function cleanEntry(form, data = {}) {
  const out = {}
  for (const f of form.fields) {
    const v = data[f.id] == null ? '' : String(data[f.id]).trim().slice(0, 5000)
    if (f.required && !v) throw new Error(`"${f.label}" is required.`)
    if (v && f.type === 'number' && !Number.isFinite(Number(v))) throw new Error(`"${f.label}" must be a number.`)
    if (v && f.type === 'select' && !f.options.includes(v)) throw new Error(`"${f.label}" has an invalid choice.`)
    out[f.id] = v
  }
  return out
}

const formSummary = (f) => ({
  ...f,
  entryCount: db.entries.filter((e) => e.formId === f.id).length,
})

// ---------- routes ----------
const app = express()
app.use(express.json({ limit: '2mb' }))

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

app.post('/api/register', (req, res) => {
  const username = String(req.body.username || '').trim().toLowerCase()
  const email = String(req.body.email || '').trim().toLowerCase()
  const password = String(req.body.password || '')
  if (!/^[a-z0-9_.-]{3,30}$/.test(username))
    return res.status(400).json({ error: 'Username must be 3–30 letters, numbers, . _ or -' })
  if (!EMAIL_RE.test(email) || email.length > 200) return res.status(400).json({ error: 'Enter a valid email address.' })
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' })
  if (db.users.some((u) => u.username === username)) return res.status(409).json({ error: 'That username is taken.' })
  if (db.users.some((u) => u.email === email)) return res.status(409).json({ error: 'An account with that email already exists.' })

  const user = { id: newId(), username, email, ...hashPassword(password), createdAt: new Date().toISOString() }
  db.users.push(user)
  db.products[user.id] = []
  startSession(res, user.id)
  res.json(publicUser(user))
})

// Slow down password guessing: max 10 failed logins per IP + account per 15 minutes.
const failedLogins = new Map() // key -> { count, until }
const LOGIN_WINDOW = 15 * 60 * 1000
const MAX_FAILS = 10

function loginBlocked(key) {
  const f = failedLogins.get(key)
  if (!f || f.until < Date.now()) return false
  return f.count >= MAX_FAILS
}

function recordFail(key) {
  const f = failedLogins.get(key)
  if (!f || f.until < Date.now()) failedLogins.set(key, { count: 1, until: Date.now() + LOGIN_WINDOW })
  else f.count++
}

app.post('/api/login', (req, res) => {
  const login = String(req.body.email || '').trim().toLowerCase()
  const key = `${req.headers['x-real-ip'] || req.socket.remoteAddress}|${login}`
  if (loginBlocked(key)) return res.status(429).json({ error: 'Too many failed attempts. Try again in 15 minutes.' })
  // Accounts made before emails were required can still sign in with their username.
  const user = db.users.find((u) => u.email === login) || db.users.find((u) => !u.email && u.username === login)
  if (!user || !checkPassword(String(req.body.password || ''), user)) {
    recordFail(key)
    return res.status(401).json({ error: 'Wrong email or password.' })
  }
  failedLogins.delete(key)
  startSession(res, user.id)
  res.json(publicUser(user))
})

app.post('/api/logout', (req, res) => {
  const token = parseCookies(req.headers.cookie).sid
  if (token && db.sessions[token]) {
    delete db.sessions[token]
    save()
  }
  res.setHeader('Set-Cookie', 'sid=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0')
  res.json({ ok: true })
})

app.get('/api/me', (req, res) => {
  const user = currentUser(req)
  if (!user) return res.status(401).json({ error: 'Not logged in.' })
  res.json(publicUser(user))
})

// Account settings. Both need the current password.
app.put('/api/account/email', requireUser, (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase()
  if (!checkPassword(String(req.body.password || ''), req.user)) return res.status(401).json({ error: 'Current password is wrong.' })
  if (!EMAIL_RE.test(email) || email.length > 200) return res.status(400).json({ error: 'Enter a valid email address.' })
  if (db.users.some((u) => u.email === email && u.id !== req.user.id))
    return res.status(409).json({ error: 'An account with that email already exists.' })
  req.user.email = email
  save()
  res.json(publicUser(req.user))
})

app.put('/api/account/password', requireUser, (req, res) => {
  const next = String(req.body.newPassword || '')
  if (!checkPassword(String(req.body.password || ''), req.user)) return res.status(401).json({ error: 'Current password is wrong.' })
  if (next.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters.' })
  Object.assign(req.user, hashPassword(next))
  // Log out every other device.
  const current = parseCookies(req.headers.cookie).sid
  for (const [token, s] of Object.entries(db.sessions)) {
    if (s.userId === req.user.id && token !== current) delete db.sessions[token]
  }
  save()
  res.json({ ok: true })
})

// Inventory: the client sends the whole list, same as it did with localStorage.
app.get('/api/products', requireUser, (req, res) => res.json(db.products[req.user.id] || []))

app.put('/api/products', requireUser, (req, res) => {
  if (!Array.isArray(req.body)) return res.status(400).json({ error: 'Expected a list of products.' })
  db.products[req.user.id] = req.body.slice(0, 10000)
  save()
  res.json({ ok: true })
})

// Inventory field setup: hide optional built-in fields, add custom ones.
const OPTIONAL_PRODUCT_FIELDS = ['category', 'sku', 'supplier']
const PRODUCT_FIELD_TYPES = ['text', 'number', 'date', 'select']

function inventoryFields(userId) {
  return db.inventoryFields?.[userId] || { hidden: [], custom: [] }
}

app.get('/api/inventory-fields', requireUser, (req, res) => res.json(inventoryFields(req.user.id)))

app.put('/api/inventory-fields', requireUser, (req, res) => {
  const hidden = Array.isArray(req.body.hidden) ? req.body.hidden.filter((k) => OPTIONAL_PRODUCT_FIELDS.includes(k)) : []
  const custom = cleanFields(req.body.custom)
    .slice(0, 30)
    .map(({ id, label, type, options }) => ({
      id: id.replace(/[^\w-]/g, '').slice(0, 40) || newId(),
      label,
      type: PRODUCT_FIELD_TYPES.includes(type) ? type : 'text',
      options,
    }))
  db.inventoryFields ??= {}
  db.inventoryFields[req.user.id] = { hidden: [...new Set(hidden)], custom }
  save()
  res.json(db.inventoryFields[req.user.id])
})

// Forms (owner only)
const ownForm = (req, res) => {
  const form = db.forms.find((f) => f.id === req.params.id && f.userId === req.user.id)
  if (!form) res.status(404).json({ error: 'Form not found.' })
  return form
}

app.get('/api/forms', requireUser, (req, res) => {
  res.json(db.forms.filter((f) => f.userId === req.user.id).map(formSummary))
})

app.post('/api/forms', requireUser, (req, res) => {
  const title = String(req.body.title || '').trim().slice(0, 200)
  if (!title) return res.status(400).json({ error: 'Form title is required.' })
  const fields = cleanFields(req.body.fields)
  if (!fields.length) return res.status(400).json({ error: 'Add at least one field.' })
  const form = {
    id: newId(),
    userId: req.user.id,
    title,
    description: String(req.body.description || '').trim().slice(0, 1000),
    fields,
    createdAt: new Date().toISOString(),
  }
  db.forms.push(form)
  save()
  res.json(formSummary(form))
})

app.put('/api/forms/:id', requireUser, (req, res) => {
  const form = ownForm(req, res)
  if (!form) return
  const title = String(req.body.title || '').trim().slice(0, 200)
  const fields = cleanFields(req.body.fields)
  if (!title) return res.status(400).json({ error: 'Form title is required.' })
  if (!fields.length) return res.status(400).json({ error: 'Add at least one field.' })
  Object.assign(form, { title, description: String(req.body.description || '').trim().slice(0, 1000), fields })
  save()
  res.json(formSummary(form))
})

app.delete('/api/forms/:id', requireUser, (req, res) => {
  const form = ownForm(req, res)
  if (!form) return
  db.forms = db.forms.filter((f) => f !== form)
  db.entries = db.entries.filter((e) => e.formId !== form.id)
  save()
  res.json({ ok: true })
})

// Responses: view, add and delete. There is deliberately no edit route.
app.get('/api/forms/:id/entries', requireUser, (req, res) => {
  const form = ownForm(req, res)
  if (!form) return
  res.json(db.entries.filter((e) => e.formId === form.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
})

function addEntry(form, data, res) {
  try {
    const entry = { id: newId(), formId: form.id, data: cleanEntry(form, data), createdAt: new Date().toISOString() }
    db.entries.push(entry)
    save()
    res.json(entry)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}

app.post('/api/forms/:id/entries', requireUser, (req, res) => {
  const form = ownForm(req, res)
  if (form) addEntry(form, req.body, res)
})

app.delete('/api/entries/:id', requireUser, (req, res) => {
  const entry = db.entries.find((e) => e.id === req.params.id)
  const form = entry && db.forms.find((f) => f.id === entry.formId && f.userId === req.user.id)
  if (!form) return res.status(404).json({ error: 'Response not found.' })
  db.entries = db.entries.filter((e) => e !== entry)
  save()
  res.json({ ok: true })
})

// Public share link: anyone with the link can see and submit the form.
app.get('/api/public/forms/:id', (req, res) => {
  const form = db.forms.find((f) => f.id === req.params.id)
  if (!form) return res.status(404).json({ error: 'Form not found.' })
  const { id, title, description, fields } = form
  res.json({ id, title, description, fields })
})

app.post('/api/public/forms/:id/entries', (req, res) => {
  const form = db.forms.find((f) => f.id === req.params.id)
  if (!form) return res.status(404).json({ error: 'Form not found.' })
  addEntry(form, req.body, res)
})

app.listen(PORT, '127.0.0.1', () => console.log(`API listening on http://127.0.0.1:${PORT}`))
