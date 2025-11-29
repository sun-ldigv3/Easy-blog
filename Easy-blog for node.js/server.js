const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static public files
app.use(express.static(path.join(__dirname, 'public')));

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'notes.json');

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify({}), 'utf8');
}

function loadNotes() {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw || '{}');
  } catch (e) {
    return {};
  }
}

function saveNotes(notes) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(notes, null, 2), 'utf8');
}

// GET /api/notes -> list all notes
app.get('/api/notes', (req, res) => {
  const notes = loadNotes();
  const arr = Object.keys(notes).map(id => ({ id, content: notes[id].content, modified: notes[id].modified }));
  res.json(arr);
});

// POST /api/notes -> save note { id, content }
app.post('/api/notes', (req, res) => {
  const { id, content } = req.body;
  if (!id || typeof content === 'undefined') return res.status(400).json({ error: 'Missing id or content' });
  const notes = loadNotes();
  notes[id] = { content: String(content), modified: new Date().toISOString() };
  saveNotes(notes);
  res.json({ success: true });
});

// GET /api/note?id= -> get single note
app.get('/api/note', (req, res) => {
  const id = req.query.id;
  if (!id) return res.status(400).send('Missing id');
  const notes = loadNotes();
  res.send(notes[id] ? notes[id].content : '');
});

// DELETE /api/note?id=
app.delete('/api/note', (req, res) => {
  const id = req.query.id;
  if (!id) return res.status(400).send('Missing id');
  const notes = loadNotes();
  if (notes[id]) {
    delete notes[id];
    saveNotes(notes);
    return res.send('Deleted');
  }
  res.status(404).send('Not found');
});

// Fallback: serve index
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Easy-blog local server running on http://localhost:${PORT}`);
});
