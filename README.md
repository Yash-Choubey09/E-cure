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

The dedicated sign-in page separates **Buyer** and **Lister** roles. It includes **Demo Buyer** and **Demo Lister** actions for presentations; both create clearly labeled demo sessions without requiring a database user. Buyers get marketplace discovery and reservations, while listers get listing management and publishing tools.

## Deploy

For the planned split deployment, create a Render web service from the repository using [`render.yaml`](./render.yaml), then set its `MONGODB_URI` to a MongoDB Atlas connection string. Create a Vercel project with `client/` as its root directory, set `VITE_API_URL` to the Render service URL, and deploy using [`client/vercel.json`](./client/vercel.json).
