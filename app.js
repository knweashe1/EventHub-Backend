const express = require('express');
const app = express();
const prisma = require('./prismaClient');

app.use(express.json());

// Helper: parse date safely
function parseDate(dateString) {
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
}

// POST /events - create event
app.post('/events', async (req, res) => {
  try {
    const body = req.body;

    const activity = body.activity;
    const date = body.date;
    const location = body.location;
    const capacity = body.capacity;
    const instagramUsername = body.instagramUsername;

    if (!activity || !date || !location || !instagramUsername) {
      return res.status(400).json({
        error: 'activity, date, location, and instagramUsername are required'
      });
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        error: 'date must be a valid ISO 8601 date string'
      });
    }

    let finalCapacity = null;
    if (capacity !== undefined) {
      const capNum = Number(capacity);
      if (!Number.isInteger(capNum) || capNum < 1) {
        return res.status(400).json({
          error: 'capacity must be a positive integer if provided'
        });
      }
      finalCapacity = capNum;
    }

    const event = await prisma.event.create({
      data: {
        activity: activity,
        date: parsedDate,
        location: location,
        capacity: finalCapacity,
        hostInstagram: instagramUsername,
        attendees: [instagramUsername]
      }
    });

    const result = {
      ...event,
      currentAttendees: event.attendees.length
    };

    res.status(201).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /events/:id/join
app.post('/events/:id/join', async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'Invalid event id' });
    }

    const event = await prisma.event.findUnique({
      where: { id: id }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const instagramUsername = req.body.instagramUsername;

    if (!instagramUsername) {
      return res.status(400).json({
        error: 'instagramUsername is required to join'
      });
    }

    let alreadyJoined = false;
    for (let i = 0; i < event.attendees.length; i++) {
      if (event.attendees[i].toLowerCase() === instagramUsername.toLowerCase()) {
        alreadyJoined = true;
        break;
      }
    }

    if (alreadyJoined) {
      return res.status(409).json({
        error: 'User already joined this event'
      });
    }

    if (event.capacity !== null && event.capacity !== undefined) {
      if (event.attendees.length >= event.capacity) {
        return res.status(409).json({ error: 'Event is full' });
      }
    }

    const updatedAttendees = event.attendees.concat(instagramUsername);

    const updatedEvent = await prisma.event.update({
      where: { id: id },
      data: {
        attendees: updatedAttendees
      }
    });

    const result = {
      ...updatedEvent,
      currentAttendees: updatedEvent.attendees.length
    };

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// GET /events - list/search events
app.get('/events', async (req, res) => {
  try {
    const activity = req.query.activity;
    const location = req.query.location;
    const date = req.query.date;

    const events = await prisma.event.findMany();

    let filteredEvents = events.slice();

    if (activity) {
      const activityLower = activity.toLowerCase();
      filteredEvents = filteredEvents.filter(event => {
        return event.activity.toLowerCase().includes(activityLower);
      });
    }

    if (location) {
      const locationLower = location.toLowerCase();
      filteredEvents = filteredEvents.filter(event => {
        return event.location.toLowerCase().includes(locationLower);
      });
    }

    if (date) {
      filteredEvents = filteredEvents.filter(event => {
        const eventDate = new Date(event.date);

        if (isNaN(eventDate.getTime())) {
          return false;
        }

        const year = eventDate.getUTCFullYear();
        const month = String(eventDate.getUTCMonth() + 1).padStart(2, '0');
        const day = String(eventDate.getUTCDate()).padStart(2, '0');

        const eventDateString = year + '-' + month + '-' + day;
        return eventDateString === date;
      });
    }

    filteredEvents.sort((a, b) => {
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();
      return timeA - timeB;
    });

    const result = filteredEvents.map(event => {
      return {
        ...event,
        currentAttendees: event.attendees.length
      };
    });

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /events/:id
app.get('/events/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'Invalid event id' });
    }

    const event = await prisma.event.findUnique({
      where: { id: id }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const result = {
      ...event,
      currentAttendees: event.attendees.length
    };

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// PUT /events/:id - update event
app.put('/events/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'Invalid event id' });
    }

    const existingEvent = await prisma.event.findUnique({
      where: { id: id }
    });

    if (!existingEvent) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const body = req.body;

    const activity = body.activity;
    const date = body.date;
    const location = body.location;
    const capacity = body.capacity;
    const instagramUsername = body.instagramUsername;

    if (
      activity === undefined &&
      date === undefined &&
      location === undefined &&
      capacity === undefined &&
      instagramUsername === undefined
    ) {
      return res.status(400).json({ error: 'No fields provided to update' });
    }

    const updateData = {};

    if (activity !== undefined) {
      if (!activity) {
        return res.status(400).json({ error: 'activity cannot be empty' });
      }
      updateData.activity = activity;
    }

    if (date !== undefined) {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          error: 'date must be a valid ISO 8601 date string'
        });
      }
      updateData.date = parsedDate;
    }

    if (location !== undefined) {
      if (!location) {
        return res.status(400).json({ error: 'location cannot be empty' });
      }
      updateData.location = location;
    }

    if (capacity !== undefined) {
      if (capacity === null) {
        updateData.capacity = null;
      } else {
        const capNum = Number(capacity);
        if (!Number.isInteger(capNum) || capNum < 1) {
          return res.status(400).json({
            error: 'capacity must be a positive integer or null'
          });
        }

        if (existingEvent.attendees.length > capNum) {
          return res.status(400).json({
            error: 'capacity cannot be less than current number of attendees'
          });
        }

        updateData.capacity = capNum;
      }
    }

    if (instagramUsername !== undefined) {
      if (!instagramUsername) {
        return res.status(400).json({
          error: 'instagramUsername cannot be empty'
        });
      }
      updateData.hostInstagram = instagramUsername;
    }

    const updatedEvent = await prisma.event.update({
      where: { id: id },
      data: updateData
    });

    const result = {
      ...updatedEvent,
      currentAttendees: updatedEvent.attendees.length
    };

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// DELETE /events/:id
app.delete('/events/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'Invalid event id' });
    }

    const event = await prisma.event.findUnique({
      where: { id: id }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    await prisma.event.delete({
      where: { id: id }
    });

    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = app;
