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

// POST /events/:id/join
app.post('/events/:id/join', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Invalid event id' });
  }

  const event = events.find(e => e.id === id);
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }

  const { instagramUsername } = req.body;
  if (!instagramUsername) {
    return res.status(400).json({ error: 'instagramUsername is required to join' });
  }

  const alreadyJoined = event.attendees.some(
    ig => ig.toLowerCase() === instagramUsername.toLowerCase()
  );
  if (alreadyJoined) {
    return res.status(409).json({ error: 'User already joined this event' });
  }

  if (event.capacity !== null && event.attendees.length >= event.capacity) {
    return res.status(409).json({ error: 'Event is full' });
  }

  event.attendees.push(instagramUsername);
  event.currentAttendees = event.attendees.length;

  res.json(event);
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

app.put('/events/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Invalid event id' });
  }

  const event = events.find(e => e.id === id);
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }

  const { activity, date, location, capacity, instagramUsername } = req.body;

  if (activity !== undefined) event.activity = activity;
  if (date !== undefined) event.date = new Date(date).toISOString();
  if (location !== undefined) event.location = location;

  if (capacity !== undefined) {
    if (capacity === null) {
      event.capacity = null;
    } else {
      const capNum = Number(capacity);
      if (!Number.isInteger(capNum) || capNum < event.attendees.length) {
        return res.status(400).json({ error: 'Invalid capacity value' });
      }
      event.capacity = capNum;
    }
  }

  if (instagramUsername !== undefined) {
    event.instagramUsername = instagramUsername;
  }

  event.currentAttendees = event.attendees.length;
  res.json(event);
});

// DELETE /events/:id
app.delete('/events/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Invalid event id' });
  }

  const index = events.findIndex(e => e.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Event not found' });
  }

  events.splice(index, 1);
  res.status(204).send();
});

module.exports = app;
