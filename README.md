# DevTrack

DevTrack is a full-stack project management application built for teams that need to plan work, assign responsibilities, track tasks, and keep an internal record of project changes. The app combines a React frontend with an Express and MongoDB backend, giving users a modern dashboard experience with role-based access control, activity logs, comments, and protected project workspaces.

## Project Summary

This project is designed to function like a lightweight SaaS project tracker. It is focused on the core collaboration workflow that most teams need:

- Create and manage projects
- Invite or add team members to each project
- Assign tasks to users and update task progress
- Track work by status and priority
- Add comments to tasks for collaboration
- Record activity so project changes are visible
- Restrict actions based on roles and ownership
- Provide a clean dashboard for overview and quick access

It is well-suited for portfolio work, internal tooling demos, and learning how to build a full-stack application with secure authentication and business logic in a real-world structure.

## Why This Project Exists

DevTrack demonstrates the combination of a client-facing application and a secure backend API. Instead of a single app with local state only, the project uses:

- A client application for the UI and interactions
- An API layer for authentication and business logic
- A MongoDB database for persistent data storage
- JWT-based access control for protected routes
- Role-based permissions for team operations

This makes it a practical example of how a production-style SaaS app is split into separate frontend and backend responsibilities.

## Features

### Authentication and Session Handling

- User registration and login
- Password hashing with bcrypt
- Short-lived JWT access tokens with rotating, database-backed refresh sessions
- Protected frontend routes
- Backend protection for sensitive API endpoints
- Current user retrieval and automatic access-token refresh

### Project Management

- Create new projects
- Update project title, description, and status
- Delete projects if you are the owner
- View all projects the user belongs to
- Add and remove project members
- Assign project roles such as Admin, Manager, and Member
- Prevent unauthorized users from accessing restricted project data

### Task Management

- Create tasks under a project
- Update task title, description, status, priority, assignee, and dates
- View project-specific task lists
- Search and filter tasks by project, status, priority, or keyword
- Delete tasks as authorized

### Collaboration

- Leave comments on tasks
- View comments by task
- Control comment deletion permissions based on ownership and project authority
- Track actions performed by users in activity history

### Activity and Reporting

- Store activity records for key actions
- Log project creation, updates, member changes, task updates, and comments
- Display recent activity for project users
- Provide dashboard summaries for project activity and work status

### Dashboard Experience

- Overview of accessible projects
- Simple summary metrics for active work
- Project progress awareness
- Quick access to task and project information
- Responsive layout for different screen sizes

### Demo / Seed Data

- Seed five demo users, ten shared projects, and 75 tasks (15 created by each user)
- Give every user membership in all projects, with each user owning/administering two
- Populate demo tasks, comments, and activity for quick testing
- Helpful for local development and portfolio demonstrations

## Tech Stack

### Frontend

- React 19
- Vite
- React Router DOM
- Axios
- Tailwind CSS
- Lucide React icons
- Socket.IO client

### Backend

- Node.js
- Express 5
- MongoDB with Mongoose
- JWT authentication
- bcrypt
- CORS and dotenv
- Socket.IO
- Supertest and Node test runner

## Architecture

```text
User Browser
   |
   | HTTP requests + HttpOnly access/refresh cookies
   v
React Frontend
   |
   | Axios API calls
   v
Express API
   |
   | Authentication middleware
   | Role checks
   | Controllers and route handling
   v
MongoDB
   |
   | Mongoose models and collections
   v
Users, RefreshSessions, Projects, Tasks, Comments, Activity
```

The frontend is responsible for user interactions, page flow, rendering, and client-side state. The server is responsible for validating requests, enforcing authorization rules, processing business logic, and writing to MongoDB.

Socket.IO uses the same HttpOnly JWT cookie as the HTTP API. A socket can join a project room only after the server confirms membership, and project events are emitted only to that room.

## Project Structure

```text
DevTrack/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .env.example
│   ├── package.json
│   ├── vercel.json
│   └── vite.config.js
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── test/
│   ├── utils/
│   ├── .env.example
│   ├── package.json
│   ├── seed.js
│   └── server.js
├── .gitignore
├── package.json
├── render.yaml
├── README.md
└── client/README.md
```

## Key Files

### Root

- `package.json` contains the root scripts for starting the frontend and backend
- `render.yaml` configures deployment for the backend service

### Client

- `client/src/App.jsx` wires the app routes and auth provider
- `client/src/pages/*` contains the route pages
- `client/src/context/AuthContext.jsx` handles login state and auth context
- `client/src/api/axios.js` centralizes API communication

### Server

- `server/server.js` creates the Express app and mounts API routes
- `server/controllers/*` hold route logic for auth, projects, tasks, comments, and users
- `server/middleware/authMiddleware.js` validates JWT tokens
- `server/models/*` define the MongoDB documents and schemas
- `server/routes/*` define the backend endpoints
- `server/seed.js` populates demo data
- `server/test/api.test.js` verifies a few important behaviors

## Prerequisites

Before running DevTrack locally, make sure you have the following installed:

- Node.js 20 or newer
- npm
- MongoDB running locally or a MongoDB Atlas cluster
- Git

## Installation

From the repository root, install each app separately:

```powershell
npm install --prefix client
npm install --prefix server
```

Then create the environment files:

```powershell
Copy-Item server\.env.example server\.env
Copy-Item client\.env.example client\.env
```

## Environment Variables

### Server configuration

Create `server/.env` with values like:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/devtrack?replicaSet=rs0
REDIS_URL=
JWT_ACCESS_SECRET=replace-with-a-unique-random-access-secret-at-least-32-bytes
JWT_REFRESH_SECRET=replace-with-a-different-random-refresh-secret-at-least-32-bytes
JWT_ACCESS_EXPIRE=15m
JWT_REFRESH_EXPIRE=10d
CLIENT_URL=http://localhost:5173
```

### Client configuration

Create `client/.env` with:

```env
VITE_API_URL=http://localhost:5000/api
```

### Notes

- `MONGODB_URI` must point to a MongoDB replica set (including Atlas) because writes use multi-document transactions
- For local development, start MongoDB with replica set mode enabled and initialize the set as `rs0`
- Configure `REDIS_URL` when running more than one API instance so Socket.IO rooms and events are shared across instances
- `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` must be different, random values of at least 32 bytes
- Generate each secret separately with `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` and keep them private
- Access JWTs default to 15 minutes; refresh JWTs default to 10 days and rotate on use
- `CLIENT_URL` must match your frontend origin during local or production development
- Never commit `.env` files to Git

## Running the Application

### Start the backend

```powershell
npm run dev:server
```

The backend runs on port 5000 by default.

### Start the frontend

Open a second terminal and run:

```powershell
npm run dev:client
```

This starts the Vite dev server. By default, the app is available at:

```text
http://localhost:5173
```

### Health check

You can confirm the backend is running with:

```text
http://localhost:5000/api/health
```

The expected response is:

```json
{
  "success": true,
  "message": "DevTrack API is running"
}
```

## Demo Data

The project includes a seed script that creates five demo users, ten projects shared by all five users, and 75 tasks. Each user owns two projects (and is therefore an Admin on those projects) and creates 15 tasks.

Run:

```powershell
npm --prefix server run seed
```

All demo accounts use the same password:

```text
Password: Demo123!
```

Demo accounts:

```text
demo@devtrack.com
demo2@devtrack.com
demo3@devtrack.com
demo4@devtrack.com
demo5@devtrack.com
```

The seed script replaces only its generated demo projects and their tasks, comments, and activity. It also replaces the original sample projects for `demo@devtrack.com` and revokes refresh sessions for the five demo accounts when resetting their passwords. Already-issued access tokens can remain valid until they expire. Run it only against a development/demo database; all five accounts have the same known password.

## Core Data Model

### User

A user has:

- name
- email
- password hash
- avatar
- createdAt / updatedAt

### Project

Each project is associated with:

- title
- description
- status
- owner
- members
- memberRoles
- timestamps

### Task

Each task contains:

- title
- description
- project
- status
- priority
- createdBy
- assignedTo
- dueDate
- timestamps

### Comment

Comments include:

- task
- user
- message
- HTTPS attachment references
- timestamps

### Activity

Activity logs track actions like:

- project created
- project updated
- task created
- task updated
- task deleted
- member added
- member removed
- comment added

## Application Routes

### Public route

```text
/            Landing page
/login       Login
/register    Register account
```

### Protected routes

```text
/dashboard
/projects
/projects/:id
/tasks
/profile
```

Unauthenticated users are redirected away from protected pages and sent back to the landing page.

## Authentication and Authorization Model

DevTrack uses JWT-based authentication stored in an HttpOnly cookie. In production the cookie is marked Secure and uses SameSite=None for the separate frontend and API origins.

### Authentication flow

1. A user registers or logs in.
2. The server checks the submitted credentials.
3. The server hashes passwords before storing them.
4. The backend sets a JWT in an HttpOnly cookie.
5. The browser sends that cookie with API and Socket.IO requests.
6. The server verifies the token in protected routes.
7. User identity is attached to the request for authorization checks.

### Authorization rules

The project role model is:

- Admin: project owner; can manage the project and change roles
- Manager: can manage project operations and members
- Member: can access project content and collaborate on tasks

The project owner is always normalized to Admin, and permissions are enforced on the backend rather than only in the UI.

## API Reference

The API is mounted under `/api`. Protected HTTP endpoints use the `devtrack_token` HttpOnly cookie. State-changing requests must include the configured frontend `Origin`.
API responses use `Cache-Control: no-store`; entity tags are disabled so API requests are not answered with `304 Not Modified`.

### Health

```text
GET /api/health
GET /api/ready
```

### Authentication

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

### Projects

```text
GET    /api/projects
POST   /api/projects
GET    /api/projects/:id
PUT    /api/projects/:id
DELETE /api/projects/:id
POST   /api/projects/:id/members
DELETE /api/projects/:id/members/:userId
PUT    /api/projects/:id/members/:userId/role
```

### Tasks

```text
GET    /api/tasks
GET    /api/tasks/summary
GET    /api/tasks/stats
POST   /api/tasks
GET    /api/tasks/:id
PUT    /api/tasks/:id
DELETE /api/tasks/:id
```

Supported task filtering examples:

```text
/api/tasks?project=PROJECT_ID
/api/tasks?status=Todo
/api/tasks?priority=High
/api/tasks?search=dashboard
/api/tasks?page=2&limit=50
```

Task and project list responses include pagination metadata. The maximum page size is 100.
The summary and stats endpoints use database aggregation rather than loading all tasks into the browser.
Task title searches retain substring matching and are bounded by a two-second database execution limit.

### Comments

```text
GET  /api/tasks/:taskId/comments
POST /api/tasks/:taskId/comments
DELETE /api/comments/:id
```

Comment reads return the newest 20 comments by default, with a `pagination.nextCursor` for loading older comments:

```text
GET /api/tasks/:taskId/comments?limit=20
GET /api/tasks/:taskId/comments?limit=20&before=COMMENT_ID
```

The maximum comment page size is 100. Comments are returned in chronological order within each page.

### Users

```text
GET /api/users?project=PROJECT_ID&search=name-or-email
PUT /api/users/profile
```

Member search requires an Admin or Manager role in the specified project and excludes users who are already project members.

### Activity

```text
GET /api/activity
```

## Typical API Response Format

Success response:

```json
{
  "success": true,
  "message": "Operation completed successfully"
}
```

Error response:

```json
{
  "success": false,
  "message": "Descriptive error message"
}
```

## Testing

Run the automated backend tests:

```powershell
npm --prefix server test
```

The test suite checks:

- health endpoint health
- protected route rejection without auth
- validation on registration
- 404 handling for unknown routes
- project owner role normalization

Run frontend validation:

```powershell
npm run build:client
npm --prefix client run lint
```

## Deployment

### Render Backend

This repo includes a `render.yaml` file for a Node backend deployment.

Recommended production environment variables:

```env
NODE_ENV=production
MONGODB_URI=your-atlas-or-hosted-mongodb-connection-string
JWT_ACCESS_SECRET=your-unique-access-signing-secret
JWT_REFRESH_SECRET=your-different-refresh-signing-secret
JWT_ACCESS_EXPIRE=15m
JWT_REFRESH_EXPIRE=10d
CLIENT_URL=https://your-vercel-domain.vercel.app
```

### Vercel Frontend

The frontend is configured to be deployed as a Vite app.

Recommended environment variable:

```env
VITE_API_URL=https://your-render-service.onrender.com/api
```

### Deployment Notes

- Keep the backend and frontend origins aligned with the CORS config
- Set the exact frontend domain in `CLIENT_URL`
- Use a production MongoDB connection string, not a local dev database
- Ensure `server/.env` values are never committed to Git

## Security Notes

- Passwords are hashed before being saved
- Short-lived access JWTs and rotating refresh tokens are stored in HttpOnly cookies; refresh-token hashes are stored in MongoDB
- Refresh sessions are revoked on logout, and reuse of a rotated token revokes its session family
- Refreshes are serialized across tabs in browsers that support the Web Locks API
- Changing either JWT signing secret invalidates existing sessions; users must sign in again
- Protected HTTP requests refresh expired access tokens automatically; Socket.IO is disconnected at token expiry and refreshes before reconnecting
- Socket.IO project rooms are membership-authorized and project-scoped
- Socket.IO uses a Redis adapter when `REDIS_URL` is configured; without it, run a single API instance
- Authenticated user records are cached for 30 seconds and project membership checks for 15 seconds; Redis shares the cache across instances when configured, otherwise the cache is bounded per process
- User profile changes and project membership changes invalidate their related cache entries
- State-changing HTTP requests require an exact trusted origin
- Login attempts are limited to 10 per 15 minutes, registrations to 5 per hour, and refreshes to 30 per 15 minutes per client IP; successful login and refresh requests do not count, while registrations do
- Authentication limits use an in-memory per-process store. For multiple API instances, configure a shared rate-limit store before scaling out
- In production, Express trusts one reverse-proxy hop for client IP detection; adjust this if the deployment uses a different proxy topology
- Input validation is enforced on the backend
- Role permission checks are performed server-side
- CORS restricts API access to the configured frontend origin
- Task list responses are paginated; dashboard counts are aggregated by the API
- Task, comment, and activity writes are transactional; configure MongoDB as a replica set
- Attachments are HTTPS URL references, not file uploads or base64 data stored in MongoDB
- Secrets are stored in environment variables instead of source files

## Troubleshooting

### MongoDB connection errors

Check that:

- MongoDB is running as a replica set locally or the Atlas connection string is valid
- The connection string includes the proper credentials and database name
- The network allows access in Atlas or your hosting environment

### JWT auth errors

Check that:

- Login or registration sets the `devtrack_token` HttpOnly cookie
- The browser accepts the `devtrack_token` HttpOnly cookie and the frontend origin matches `CLIENT_URL`
- The token is not expired
- `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` are set, different, and at least 32 bytes
- Access and refresh token expiry settings are valid (`15m` and `10d` by default)

### Frontend not loading after login

Check that:

- `VITE_API_URL` points to the correct backend base URL
- The backend is running
- The frontend dev server is running on port 5173
- The browser is not blocked by CORS issues

### Seed script issues

Make sure:

- `MONGODB_URI` is configured before running the seed script
- You are using a development database
- You understand that the seed script replaces its generated demo data

## Future Improvements

Potential enhancements include:

- Password reset and email verification
- Advanced reporting and analytics
- Team invitations and permission invite workflows
- CI/CD pipeline with automated checks and previews
- End-to-end UI testing
- Managed object storage for private attachments and upload workflows

## License

This project is intended for learning, portfolio use, and local development unless otherwise specified by the repository owner.
