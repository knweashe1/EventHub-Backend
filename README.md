# EventHub API

EventHub is a simple RESTful backend API built with Node.js and Express that allows users to create, search, join, update, and delete events.

## Running the API Locally

### Install dependencies

```bash
npm install
```

### Start the server

```bash
node server.js
```

The API will be available at:
http://localhost:3000

## API Endpoints

## Create an Event

POST /events

Request Body

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

Success Response (201 Created)

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

## List / Search Events

GET /events

Optional Query Parameters
activity: case-insensitive substring match
location: case-insensitive substring match
date: YYYY-MM-DD (matches events on that day)

Examples
GET /events
GET /events?activity=basket
GET /events?location=campus
GET /events?date=2025-01-10
GET /events?activity=basket&date=2025-01-10

Returns 200 OK with a list of events sorted by date (earliest first).

## Get a Single Event

GET /events/:id

The ID must be a numeric event ID.

Responses
200 OK if the event exists
404 Not Found if the event does not exist

## Join an Event

POST /events/:id/join

Request Body

```json
{
  "instagramUsername": "guest_ig"
}
```

Behavior
Adds the user to the event if it exists
Prevents duplicate joins
Enforces capacity limits if set

Responses
200 OK with the updated event
400 Bad Request if required data is missing
404 Not Found if the event does not exist
409 Conflict if the event is full or the user already joined

## Update an Event

PUT /events/:id

Updates one or more fields of an existing event. At least one updatable field must be provided.

Request Body (any subset allowed)

```json
{
  "activity": "Basketball",
  "date": "2025-01-12T18:00:00Z",
  "location": "GMU Court B",
  "capacity": 8,
  "instagramUsername": "new_host_ig"
}
```

Update Rules
activity and location cannot be empty
date must be a valid ISO 8601 date string
capacity must be a positive integer or null
capacity cannot be less than the current number of attendees
instagramUsername cannot be empty
If attendees exist, currentAttendees is automatically synchronized

Responses
200 OK returns the updated event
400 Bad Request for invalid input or no fields provided
404 Not Found if the event does not exist

## Delete an Event

DELETE /events/:id

Responses
204 No Content on successful deletion
404 Not Found if the event does not exist

## Testing

The API was developed and tested using Postman. Testing included manual testing of all endpoints, verification of HTTP status codes, validation of response data, and edge case testing for filtering and joining logic.

