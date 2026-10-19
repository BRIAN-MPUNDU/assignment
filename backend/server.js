require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { run, get, all, initializeDatabase } = require('./db');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const VALID_STATUSES = ['Upcoming', 'Ongoing', 'Completed', 'Cancelled'];
const REQUIRED_FIELDS = ['event_title', 'category', 'description', 'venue', 'event_date', 'organizer'];

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));

function validateNotice(body) {
  const errors = [];
  for (const field of REQUIRED_FIELDS) {
    if (typeof body[field] !== 'string' || !body[field].trim()) errors.push(`${field} is required and must be text.`);
  }
  if (body.event_title && body.event_title.trim().length > 150) errors.push('event_title must be 150 characters or fewer.');
  if (body.category && body.category.trim().length > 60) errors.push('category must be 60 characters or fewer.');
  if (body.venue && body.venue.trim().length > 150) errors.push('venue must be 150 characters or fewer.');
  if (body.organizer && body.organizer.trim().length > 120) errors.push('organizer must be 120 characters or fewer.');
  if (body.event_date && !/^\d{4}-\d{2}-\d{2}$/.test(body.event_date)) errors.push('event_date must use YYYY-MM-DD format.');
  if (body.status !== undefined && !VALID_STATUSES.includes(body.status)) errors.push(`status must be one of: ${VALID_STATUSES.join(', ')}.`);
  return errors;
}
function clean(body) {
  return {
    event_title: body.event_title.trim(), category: body.category.trim(),
    description: body.description.trim(), venue: body.venue.trim(),
    event_date: body.event_date.trim(), organizer: body.organizer.trim(),
    status: body.status || 'Upcoming'
  };
}
function parseId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

app.get('/api/health', (req, res) => res.json({ success: true, message: 'School Event Noticeboard API is running.' }));

// GET all records: GET /api/notices
app.get('/api/notices', async (req, res, next) => {
  try {
    const rows = await all('SELECT * FROM notices ORDER BY event_date ASC, id DESC');
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) { next(error); }
});

// GET one record: GET /api/notices/:id
app.get('/api/notices/:id', async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: 'ID must be a positive integer.' });
    const row = await get('SELECT * FROM notices WHERE id = ?', [id]);
    if (!row) return res.status(404).json({ success: false, message: `Notice with ID ${id} was not found.` });
    res.json({ success: true, data: row });
  } catch (error) { next(error); }
});

// POST create: POST /api/notices
app.post('/api/notices', async (req, res, next) => {
  try {
    const errors = validateNotice(req.body || {});
    if (errors.length) return res.status(400).json({ success: false, message: 'Please correct the supplied fields.', errors });
    const n = clean(req.body);
    const result = await run(`INSERT INTO notices (event_title, category, description, venue, event_date, organizer, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)`, [n.event_title, n.category, n.description, n.venue, n.event_date, n.organizer, n.status]);
    const created = await get('SELECT * FROM notices WHERE id = ?', [result.id]);
    res.status(201).json({ success: true, message: 'Notice created successfully.', data: created });
  } catch (error) { next(error); }
});

// PUT update: PUT /api/notices/:id
app.put('/api/notices/:id', async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: 'ID must be a positive integer.' });
    const existing = await get('SELECT id FROM notices WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ success: false, message: `Notice with ID ${id} was not found.` });
    const errors = validateNotice(req.body || {});
    if (errors.length) return res.status(400).json({ success: false, message: 'Please correct the supplied fields.', errors });
    const n = clean(req.body);
    await run(`UPDATE notices SET event_title = ?, category = ?, description = ?, venue = ?, event_date = ?,
      organizer = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [n.event_title, n.category, n.description, n.venue, n.event_date, n.organizer, n.status, id]);
    const updated = await get('SELECT * FROM notices WHERE id = ?', [id]);
    res.json({ success: true, message: 'Notice updated successfully.', data: updated });
  } catch (error) { next(error); }
});

// DELETE record: DELETE /api/notices/:id
app.delete('/api/notices/:id', async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: 'ID must be a positive integer.' });
    const existing = await get('SELECT * FROM notices WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ success: false, message: `Notice with ID ${id} was not found.` });
    await run('DELETE FROM notices WHERE id = ?', [id]);
    res.json({ success: true, message: 'Notice deleted successfully.', data: existing });
  } catch (error) { next(error); }
});

// Unknown API routes and all errors still return JSON.
app.use('/api', (req, res) => res.status(404).json({ success: false, message: 'API route not found.' }));
app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ success: false, message: 'An unexpected server error occurred.' });
});

initializeDatabase().then(() => {
  app.listen(PORT, () => console.log(`School Event Noticeboard running at http://localhost:${PORT}`));
}).catch((error) => {
  console.error('Database initialization failed:', error);
  process.exit(1);
});
