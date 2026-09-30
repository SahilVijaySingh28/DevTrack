# DevTrack

DevTrack is a production-style project management and team collaboration platform. It features a polished landing page, interactive Kanban boards, role-based access control (RBAC), audit activity trails, and real-time project metrics — built with a complete JavaScript full-stack: React, Vite, Tailwind CSS, Node.js, Express, MongoDB, and JWT authentication.

## Features

- **Landing page** — Animated hero section, interactive app preview tabs (Kanban, Metrics, RBAC, Audit Log), features grid, and call-to-action before login
- User registration, login, logout, and session restoration
- JWT-protected API and frontend routes
- bcrypt password hashing with passwords excluded from normal responses
- Project creation, editing, status changes, and deletion
- Project team member search, adding, removal, and role management
- Project roles: `Admin`, `Manager`, and `Member`
- Task creation, editing, deletion, assignment, priorities, statuses, and due dates
- Kanban-style task board with `Todo`, `In Progress`, and `Completed` columns
- Task search and filtering by title, project, status, and priority
- Task comments with ownership and project-owner deletion permissions
- Persisted activity history for project, task, member, and comment changes
- Dashboard statistics, completion progress, recent projects, and due-soon tasks
- Profile editing with avatar URL support and initials fallback
- Responsive desktop, tablet, and mobile layouts
- Loading, error, empty, success, and disabled-submit states
- Repeatable demo seed data
- Automated API tests using Node.js test runner and Supertest

## Technology Stack

### Frontend

- React 19 with functional components and hooks
- Vite
- React Router DOM
- Axios
- Tailwind CSS v4
- Lucide React icons

### Backend

- Node.js
- Express 5
- MongoDB Atlas or local MongoDB
- Mongoose
- bcrypt
- jsonwebtoken
- cors and dotenv
- Supertest and Node's built-in test runner

## Architecture

```text
React Frontend
      |
      | Axios HTTP requests with JWT
      v
REST API
      |
      | Express routers, controllers, middleware
      v
Node.js + Express
      |
      | Mongoose models and queries
      v
MongoDB Atlas
```

The frontend is responsible for routing, forms, state, API integration, and user feedback. The backend owns validation, authentication, authorization, business logic, and persistence. MongoDB stores users, projects, tasks, comments, and activity records.

## Project Structure

```text
DevTrack/
├── client/
│   ├── public/
│   │   ├── favicon.svg
│   │   └── icons.svg
│   ├── src/
│   │   ├── api/
│   │   │   ├── axios.js
│   │   │   └── socket.js
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── AttachmentPicker.jsx
│   │   │   │   └── AvatarStack.jsx
│   │   │   └── layout/Layout.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   ├── auth-context.js
│   │   │   └── useAuth.js
│   │   ├── pages/
│   │   │   ├── Landing.jsx        <- new landing page (entry point)
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── ProjectDetails.jsx
│   │   │   ├── Projects.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── Register.jsx
│   │   │   └── Tasks.jsx
│   │   ├── routes/ProtectedRoute.jsx
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .env.example
│   ├── package.json
│   ├── vercel.json
│   └── vite.config.js
├── server/
│   ├── config/db.js
│   ├── controllers/
│   │   ├── activityController.js
│   │   ├── authController.js
│   │   ├── commentController.js
│   │   ├── projectController.js
│   │   ├── taskController.js
│   │   └── userController.js
│   ├── middleware/authMiddleware.js
│   ├── middleware/errorMiddleware.js
│   ├── models/
│   │   ├── Activity.js
│   │   ├── Comment.js
│   │   ├── Project.js
│   │   ├── Task.js
│   │   └── User.js
│   ├── routes/
│   │   ├── activityRoutes.js
│   │   ├── authRoutes.js
│   │   ├── commentDeleteRoutes.js
│   │   ├── commentRoutes.js
│   │   ├── projectRoutes.js
│   │   ├── taskRoutes.js
│   │   └── userRoutes.js
│   ├── test/api.test.js
│   ├── utils/
│   │   ├── generateToken.js
│   │   ├── recordActivity.js
│   │   └── socket.js
│   ├── .env.example
│   ├── package.json
│   ├── seed.js
│   └── server.js
├── .gitignore
├── package.json
├── render.yaml
└── README.md
```

## Requirements

- Node.js 20 or newer recommended
- npm
- MongoDB Atlas account or local MongoDB instance
- Git for version control

## Installation

From the repository root:

```powershell
npm install --prefix client
npm install --prefix server
Copy-Item server\.env.example server\.env
Copy-Item client\.env.example client\.env
```

Edit `server/.env` and set a valid MongoDB connection string and JWT secret. The client default API URL is already configured for local development.

## Environment Variables

### Server: `server/.env`

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/devtrack?retryWrites=true&w=majority
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
```

### Client: `client/.env`

```env
VITE_API_URL=http://localhost:5000/api
```

Never commit `.env` files. The `.gitignore` excludes them while allowing `.env.example` templates.

## Running Locally

Start the backend from the repository root:

```powershell
npm run dev:server
```

Start the frontend in a second terminal:

```powershell
npm run dev:client
```

Open `http://localhost:5173`. You will land on the **Landing page** first. The backend health endpoint is `http://localhost:5000/api/health`.

If the terminal is already inside `server`, use `npm run dev` instead of `npm run dev:server`.

## Demo Data

Run the seed command against a development database:

```powershell
npm --prefix server run seed
```

Demo credentials:

```text
Email: demo@devtrack.com
Password: Demo123!
```

The seed script replaces records owned by the demo account. It should not be used against a production database.

## Frontend Routes

```text
/              <- Landing page (public entry point)
/login         <- Sign in
/register      <- Create account
/dashboard     <- protected
/projects      <- protected
/projects/:id  <- protected
/tasks         <- protected
/profile       <- protected
```

Unauthenticated users visiting protected routes are redirected to `/`. The Login and Register pages include a "Back to Home Page" button to return to the landing page.

## REST API

All endpoints use the `/api` base path. Protected endpoints require:

```http
Authorization: Bearer YOUR_JWT
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
POST   /api/tasks
GET    /api/tasks/:id
PUT    /api/tasks/:id
DELETE /api/tasks/:id
```

Supported filters:

```text
/api/tasks?project=PROJECT_ID
/api/tasks?status=Todo
/api/tasks?priority=High
/api/tasks?search=dashboard
```

### Comments, users, and activity

```text
GET    /api/tasks/:taskId/comments
POST   /api/tasks/:taskId/comments
DELETE /api/comments/:id
GET    /api/users?search=name-or-email
PUT    /api/users/profile
GET    /api/activity
```

API errors use:

```json
{
  "success": false,
  "message": "Descriptive error message"
}
```

## Role-Based Access Control

Roles are stored per project membership:

- `Admin`: project owner; can update/delete projects, manage members, and change roles.
- `Manager`: can update projects and manage members.
- `Member`: can view the project and work with tasks and comments.

The project owner is always normalized to `Admin`. New members default to `Member`. The backend enforces permissions independently of frontend controls.

## Authentication and Security

1. The client submits credentials to the Express API.
2. The User model hashes new passwords with bcrypt before saving.
3. Login compares submitted passwords with `bcrypt.compare()`.
4. The server signs a JWT containing the user ID.
5. Axios automatically sends the JWT in the Bearer header.
6. Express middleware verifies the token and attaches `request.user`.
7. Controllers enforce membership and RBAC permissions.
8. Environment variables keep secrets out of source control.

For a higher-security production session design, replace local-storage JWTs with secure HttpOnly cookies and add CSRF protection.

## Activity History

Activity records are persisted in MongoDB for project creation/updates, task creation/updates/deletion, member changes, and comment changes. The dashboard loads the latest activity for projects the authenticated user belongs to.

## Testing

Run automated API tests:

```powershell
npm --prefix server test
```

The suite covers health checks, protected routes, registration validation, 404 handling, and project owner role normalization.

Run frontend checks:

```powershell
npm run build:client
npm --prefix client run lint
```

## Deployment

### MongoDB Atlas

Create a database user, allow the deployment service network access, and copy the driver connection string. Use a strong password and URL-encode special characters in the password.

### Render Backend

The repository includes `render.yaml`.

```text
Root directory: server
Runtime: Node
Build command: npm install
Start command: npm start
```

Configure:

```env
NODE_ENV=production
MONGODB_URI=your-atlas-connection-string
JWT_SECRET=your-production-secret
JWT_EXPIRE=7d
CLIENT_URL=https://your-vercel-domain.vercel.app
```

Verify `https://your-render-service.onrender.com/api/health`.

### Vercel Frontend

The repository includes `client/vercel.json` for SPA route refreshes.

```text
Root directory: client
Framework: Vite
Build command: npm run build
Output directory: dist
```

Configure:

```env
VITE_API_URL=https://your-render-service.onrender.com/api
```

After deployment, update Render's `CLIENT_URL` to the exact Vercel origin without a route suffix such as `/login`.

Pushing to the `main` branch automatically triggers a redeploy on both Vercel (frontend) and Render (backend).

## Git and GitHub

Useful commits include:

```text
Initial project setup
Add MongoDB database configuration
Implement user authentication
Add JWT authorization middleware
Create project REST APIs
Create task and comment APIs
Build responsive dashboard UI
Add project RBAC
Add activity history and API tests
Add landing page with hero, interactive preview, and features grid
Prepare application for deployment
```

Never commit `.env` files, MongoDB credentials, JWT secrets, `node_modules`, or unnecessary build output.

## Interview Talking Points

- **Landing page UX:** Glassmorphic dark-mode design with animated hero, tabbed interactive app preview, and clear call-to-action flow before login.
- **React:** reusable component-based UI and state-driven rendering.
- **Node.js and Express:** JavaScript across the stack with simple REST routing and middleware.
- **MongoDB:** flexible document storage mapped to JavaScript objects through Mongoose.
- **bcrypt:** prevents plain-text password storage and securely compares login attempts.
- **JWT:** stateless authentication for protected API routes.
- **Axios:** centralized API communication and automatic authorization headers.
- **Security:** password hashing, JWT verification, protected routes, RBAC, validation, CORS, environment variables, and centralized errors.

## Screenshots

Add screenshots of the landing page, login page, dashboard, project details, Kanban board, and profile page before publishing the project in a portfolio.

## Future Improvements

- WebSocket or Socket.IO real-time updates
- HttpOnly cookie-based sessions
- Email invitations and password reset
- File attachments and notifications
- Advanced reporting and filters
- CI pipeline with coverage and deployment previews
- End-to-end browser tests
