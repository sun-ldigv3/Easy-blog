const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const dataDir = path.join(__dirname, 'data');
const dataFile = path.join(dataDir, 'notes.json');

function ensureDataFile() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, JSON.stringify({}));
}

function readAllNotes() {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(dataFile, 'utf8');
    return JSON.parse(raw || '{}');
  } catch (err) {
    console.error('readAllNotes error:', err);
    return {};
  }
}

function writeAllNotes(obj) {
  ensureDataFile();
  fs.writeFileSync(dataFile, JSON.stringify(obj, null, 2));
}

function notesToArray(notesObj) {
  return Object.keys(notesObj).map(id => ({
    id,
    content: notesObj[id].content || '',
    modified: notesObj[id].modified || new Date().toISOString()
  }));
}

// API endpoints
app.get('/api/notes', (req, res) => {
  const notesObj = readAllNotes();
  const arr = notesToArray(notesObj);
  res.json(arr);
});

app.post('/api/notes', (req, res) => {
  const body = req.body || {};
  if (!body.id || typeof body.content === 'undefined') {
    return res.status(400).json({ error: 'Missing id or content' });
  }
  const notesObj = readAllNotes();
  notesObj[body.id] = { content: body.content, modified: new Date().toISOString() };
  writeAllNotes(notesObj);
  res.json({ success: true, message: 'Note saved' });
});

app.delete('/api/notes', (req, res) => {
  const id = req.query.id;
  if (!id) return res.status(400).json({ error: 'Missing id' });
  const notesObj = readAllNotes();
  if (notesObj[id]) delete notesObj[id];
  writeAllNotes(notesObj);
  res.json({ success: true, message: 'Note deleted' });
});

app.get('/api/note', (req, res) => {
  const id = req.query.id;
  if (!id) return res.status(400).send('Missing id');
  const notesObj = readAllNotes();
  res.send(notesObj[id] ? notesObj[id].content : '');
});

app.post('/api/note', (req, res) => {
  const { id, content } = req.body || {};
  if (!id || typeof content === 'undefined') return res.status(400).send('Missing id or content');
  const notesObj = readAllNotes();
  notesObj[id] = { content, modified: new Date().toISOString() };
  writeAllNotes(notesObj);
  res.send('Saved');
});

app.delete('/api/note', (req, res) => {
  const id = req.query.id;
  if (!id) return res.status(400).send('Missing id');
  const notesObj = readAllNotes();
  if (notesObj[id]) delete notesObj[id];
  writeAllNotes(notesObj);
  res.send('Deleted');
});

// Serve static pages
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));

app.get('/', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.get('/update', (req, res) => {
  res.sendFile(path.join(publicDir, 'update.html'));
});

app.listen(PORT, () => {
  console.log(`Easy-blog Node server listening on http://localhost:${PORT}`);
});
