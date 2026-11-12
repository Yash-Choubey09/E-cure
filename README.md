# E-Cure Earth

E-Cure Earth is a full-stack MERN circular hardware marketplace and impact ledger.

## Stack

- **React + Vite** in `client/`
- **Express** API in `server/`
- **MongoDB + Mongoose** for accounts and marketplace listings
- **JWT + bcryptjs** for account sessions

## Run locally

1. Copy `.env.example` to `.env` and set `MONGODB_URI` and `JWT_SECRET`.
2. Install dependencies with `npm install` and `npm --prefix client install`.
3. Start both applications with `npm run dev`.

The React client runs at `http://localhost:5173` and proxies `/api` requests to the Express server at `http://localhost:5000`. If MongoDB is unavailable, the marketplace remains available in read-only demo mode; registration, login, and publishing listings require MongoDB.

The original static pages and media remain in the repository as legacy references while the React client becomes the primary application experience.
