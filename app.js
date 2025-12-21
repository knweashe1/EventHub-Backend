const express = require('express');
const app = express();

app.use(express.json());

// In-memory "database" for events
let events = [];
let nextEventId = 1;

// Helper: parse date safely
function parseDate(dateString) {
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
}

// POST /events - create event
app.post('/events', (req, res) => {
  const { activity, date, location, instagramUsername } = req.body;

  if (!activity || !date || !location || !instagramUsername) {
    return res.status(400).json({
      error: 'activity, date, location, and instagramUsername are required'
    });
  }

  const parsedDate = parseDate(date);
  if (!parsedDate) {
    return res.status(400).json({
      error: 'date must be a valid ISO 8601 date string'
    });
  }

  const newEvent = {
    id: nextEventId++,
    activity,
    date: parsedDate.toISOString(),
    location,
    instagramUsername
  };

  events.push(newEvent);
  res.status(201).json(newEvent);
});

// GET /events - list/search
app.get('/events', (req, res) => {
  const { activity, location, date } = req.query;
  let filtered = events.slice();

  if (activity) {
    filtered = filtered.filter(e =>
      e.activity.toLowerCase().includes(activity.toLowerCase())
    );
  }

  if (location) {
    filtered = filtered.filter(e =>
      e.location.toLowerCase().includes(location.toLowerCase())
    );
  }

  if (date) {
    filtered = filtered.filter(e => e.date.slice(0, 10) === date);
  }

  filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
  res.json(filtered);
});

// GET /events/:id
app.get('/events/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Invalid event id' });
  }

  const event = events.find(e => e.id === id);
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }

  res.json(event);
});

module.exports = app;
