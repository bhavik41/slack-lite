# Slack Lite (Full Stack)

- React + Vite frontend
- Node + Express + Socket.io backend
- MongoDB (Mongoose)

## Requirements
- Node.js >= 18
- MongoDB running locally on `mongodb://127.0.0.1:27017`

## Run
From `slack-lite`:

```bash
npm install
npm run dev
```

Server runs on `http://localhost:4000`
Client runs on `http://localhost:5173`

## Features
- 1:1 and group chat rooms
- Online/offline presence
- Message history persisted in MongoDB
- Typing indicator using Socket.io


## Installation
```bash
npm install
cp .env.example .env
npm run dev
```

## API
- `POST /api/auth/register` — create account
- `POST /api/auth/login` — login
- `GET /api/channels` — list channels
- `POST /api/messages` — send message

## Roadmap
- [ ] Voice channels
- [ ] Video calls
- [ ] App integrations
- [ ] Mobile app

![Status](https://img.shields.io/badge/status-active-brightgreen)
