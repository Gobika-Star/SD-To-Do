# Taskflow Todo App

A small full-stack todo application built with Node.js, Express, and a browser-based frontend.

## Features

- User registration and login with JWT authentication
- Add, complete, and delete personal tasks
- Responsive dashboard UI
- In-memory data storage for users and tasks

## Requirements

- Node.js 18 or newer
- npm

## Run Locally

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The app is available at [http://localhost:3000](http://localhost:3000).

The production-style start command is also available:

```bash
npm start
```

## Project Structure

```text
server.js              Express server and API routes
public/index.html      Registration and login page
public/dashboard.html  Todo dashboard page
public/dashboard.js    Dashboard behavior and API integration
```

## API Routes

| Method | Route | Description | Auth |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Register a user | No |
| `POST` | `/api/auth/login` | Log in and receive a JWT | No |
| `GET` | `/api/todos` | Get the current user's tasks | Bearer token |
| `POST` | `/api/todos` | Create a task | Bearer token |
| `PUT` | `/api/todos/:id` | Toggle task completion | Bearer token |
| `DELETE` | `/api/todos/:id` | Delete a task | Bearer token |

## Notes

Data is stored in memory, so users and tasks are cleared whenever the server restarts. The JWT secret is currently defined in `server.js` for local development and should be moved to an environment variable before production use.
