const express = require('express');
const app = express();

app.use(express.json());

// In-memory storage
let events = [];
let nextEventId = 1;

// Helper: parse date
function parseDate(value) {
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
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
      error: 'date must be a valid ISO date string'
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

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

