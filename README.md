# DevTrack

DevTrack is a full-stack project management and team collaboration platform built for demonstrating practical React, Node.js, Express, and MongoDB development.

DevTrack includes JWT authentication, project and task management, team membership, comments, filtering, profile updates, and a responsive dashboard.

## Technology Stack

- React and Vite
- Tailwind CSS
- Axios, React Router DOM, and Lucide React
- Node.js and Express
- MongoDB and Mongoose
- bcrypt and JSON Web Tokens

## Architecture

```text
React Frontend
      |
      v
REST API
      |
      v
Node.js + Express
      |
      v
MongoDB Atlas
```

## Installation and Commands

From the repository root:

```bash
npm run build:client
npm install --prefix client
npm install --prefix server
```

The server requires a local `server/.env` copied from `server/.env.example`. A MongoDB connection is required before starting the server. During development, run the client and server in separate terminals:

```bash
npm run dev:client
npm run dev:server
```

Run the automated API checks with:

```bash
npm --prefix server test
```

To load the optional demo workspace:

```bash
npm --prefix server run seed
```

Demo login: `demo@devtrack.com` / `Demo123!`. Run the seed command only in a development database; it replaces data owned by that demo account.

The API health endpoint will be available at `http://localhost:5000/api/health`.

## Environment Variables

Client variables are documented in `client/.env.example`. Server variables are documented in `server/.env.example`. Real `.env` files are ignored by Git.

## Folder Structure

```text
DevTrack/
├── client/
│   ├── src/
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
├── server/
│   ├── config/db.js
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── .gitignore
├── package.json
└── README.md
```

## API Overview

Authentication uses `POST /api/auth/register`, `POST /api/auth/login`, and protected `GET /api/auth/me`. Protected project, task, comment, and user routes are grouped under `/api/projects`, `/api/tasks`, `/api/comments`, and `/api/users`.

Protected `GET /api/activity` returns the latest activity for projects the current user belongs to. Activity records are created when projects, tasks, members, and comments change.

## Deployment

Deploy the client to Vercel and the server to Render. Configure `VITE_API_URL` in Vercel and `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRE`, and `CLIENT_URL` in Render. MongoDB Atlas supplies the production database.

The repository includes `render.yaml` for the backend service and `client/vercel.json` so refreshing a client-side route works on Vercel. For Vercel, set the root directory to `client`, build command to `npm run build`, and output directory to `dist`.

## Screenshots

Add application screenshots here before publishing the project portfolio entry.

## Future Improvements

Add drag-and-drop task movement, activity history, file attachments, email invitations, automated tests, and role-based project permissions.
