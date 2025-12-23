# EventHub API

EventHub is a simple RESTful backend API built with Node.js and Express that allows users to create, search, join, update, and delete events.

## Tech Stack

- Node.js
- Express
- PostgreSQL
- Prisma ORM

## Running the API Locally

### Install dependencies

```bash
npm install
```
### Database setup

This project uses PostgreSQL

You need a local PostgreSQL server running. During installation, you will set a password for the default postgres user and use the default port (5432).

Create and name database for the project using pgAdmin or psql.

### Environment variables

Database configuration is handled using environment variables.

Create a file named .env in the project root. You can use the example file below as a reference.

Example .env.example file:

DATABASE_URL="postgresql://postgres:<password>@localhost:5432/<DBname>?schema=public"

Replace password with your local PostgreSQL password and DBname with database name.

### Start the server

```bash
node server.js
```

The API will be available at:
http://localhost:3000

## API Endpoints

## Create an Event

POST /events

Request Body:

```json
{
  "activity": "Basketball",
  "date": "2025-01-10T18:00:00Z",
  "location": "GMU Court A",
  "capacity": 6,
  "instagramUsername": "host_ig"
}
```

capacity is optional. If omitted, the event has no attendance limit.

```json
{
  "id": 1,
  "activity": "Basketball",
  "date": "2025-01-10T18:00:00.000Z",
  "location": "GMU Court A",
  "capacity": 6,
  "instagramUsername": "host_ig",
  "attendees": ["host_ig"],
  "currentAttendees": 1
}
```
Responses:

201 Event created successfully and returned in the response body.
400 Required fields are missing, the date is invalid, or capacity is not a valid positive integer.
500 An unexpected server or database error occurs.

## List / Search Events

GET /events

Optional Query Parameters

activity: case-insensitive substring match
location: case-insensitive substring match
date: YYYY-MM-DD (matches events on that day)

Examples:

GET /events
GET /events?activity=basket
GET /events?location=campus
GET /events?date=2025-01-10
GET /events?activity=basket&date=2025-01-10

Response:
200 With a list of events sorted by date (earliest first).

## Get a Single Event

GET /events/:id

The ID must be a numeric event ID.

Responses:

200 The event exists
404 The event does not exist

## Join an Event

POST /events/:id/join

Request Body:

```json
{
  "instagramUsername": "guest_ig"
}
```

Behavior:

Adds the user to the event if it exists
Prevents duplicate joins
Enforces capacity limits if set

Responses:

200 with the updated event
400 Required data is missing
404 The event does not exist
409 The event is full or the user already joined

## Update an Event

PUT /events/:id

Updates one or more fields of an existing event. At least one updatable field must be provided.

Request Body (one or more fields to update):

```json
{
  "activity": "Basketball",
  "date": "2025-01-12T18:00:00Z",
  "location": "GMU Court B",
  "capacity": 8,
  "instagramUsername": "new_host_ig"
}
```

Update Rules:

activity and location cannot be empty
date must be a valid ISO 8601 date string
capacity must be a positive integer or null
capacity cannot be less than the current number of attendees
instagramUsername cannot be empty
If attendees exist, currentAttendees is automatically synchronized

Responses:

200 The updated event
400 Invalid input or no fields provided
404 The event does not exist

## Delete an Event

DELETE /events/:id

Responses:

204 No Content on successful deletion
404 The event does not exist

## Testing

All endpoints were tested using Postman, including validation of request bodies, error handling, and edge cases such as duplicate joins and capacity limits.

Postman collection link:
https://knweashe-2856775.postman.co/workspace/Kareem's-Workspace~7572ff4f-6837-4156-8108-10131373ee67/collection/50885192-93dc1623-b61e-4963-9455-c919a1337731?action=share&creator=50885192

