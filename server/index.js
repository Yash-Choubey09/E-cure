require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const app = express();
const port = process.env.PORT || 5000;
const clientDist = path.join(__dirname, '..', 'client', 'dist');

app.use(cors());
app.use(express.json({ limit: '1mb' }));

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false }
}, { timestamps: true });

const listingSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  condition: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  impact: { type: String, required: true, trim: true },
  image: { type: String, default: 'laptop.jpeg' },
  seller: { type: String, required: true, trim: true }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const Listing = mongoose.model('Listing', listingSchema);

const fallbackListings = [
  { _id: 'demo-1', title: 'Refurbished Field Laptop', category: 'Computing', condition: 'Grade A', price: 420, impact: '12.8 kg CO2e avoided', image: 'laptop.jpeg', seller: 'GreenLoop Studio' },
  { _id: 'demo-2', title: 'Modular Smartphone Kit', category: 'Mobile', condition: 'Grade A', price: 185, impact: '4.1 kg CO2e avoided', image: 'smartphone.jpeg', seller: 'Reboot Collective' },
  { _id: 'demo-3', title: 'Enterprise Monitor Pair', category: 'Displays', condition: 'Grade B+', price: 240, impact: '8.7 kg CO2e avoided', image: 'monitor.jpeg', seller: 'Northstar Renewables' }
];

function createToken(user) {
  return jwt.sign({ id: user._id.toString(), name: user.name, email: user.email }, process.env.JWT_SECRET || 'development-secret', { expiresIn: '7d' });
}

function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'A signed-in session is required.' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'development-secret');
    next();
  } catch {
    return res.status(401).json({ message: 'Your session has expired. Please sign in again.' });
  }
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'demo-mode' });
});

app.get('/api/listings', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return res.json(fallbackListings);
    const listings = await Listing.find().sort({ createdAt: -1 }).limit(24).lean();
    res.json(listings.length ? listings : fallbackListings);
  } catch (error) {
    res.status(500).json({ message: 'Unable to load marketplace listings.', error: error.message });
  }
});

app.post('/api/listings', requireAuth, async (req, res) => {
  const { title, category, condition, price, impact, image } = req.body;
  if (!title || !category || !condition || !Number.isFinite(Number(price)) || !impact) {
    return res.status(400).json({ message: 'Title, category, condition, price, and impact are required.' });
  }
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ message: 'Marketplace writes require a connected MongoDB database.' });
  }
  try {
    const listing = await Listing.create({
      title, category, condition, price: Number(price), impact, image: image || 'laptop.jpeg', seller: req.user.name
    });
    res.status(201).json(listing);
  } catch (error) {
    res.status(500).json({ message: 'Unable to publish this listing.', error: error.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password || password.length < 8) {
    return res.status(400).json({ message: 'Name, email, and a password of 8+ characters are required.' });
  }
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ message: 'Registration requires a connected MongoDB database.' });
  }
  try {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: 'An account with that email already exists.' });
    const user = await User.create({ name, email, password: await bcrypt.hash(password, 12) });
    res.status(201).json({ token: createToken(user), user: { name: user.name, email: user.email } });
  } catch (error) {
    res.status(500).json({ message: 'Unable to create your account.', error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ message: 'Sign in requires a connected MongoDB database.' });
  }
  try {
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Email or password is incorrect.' });
    }
    res.json({ token: createToken(user), user: { name: user.name, email: user.email } });
  } catch (error) {
    res.status(500).json({ message: 'Unable to sign you in.', error: error.message });
  }
});

app.post('/api/auth/demo-login', (req, res) => {
  const user = { _id: 'demo-user', name: 'Demo Explorer', email: 'demo@ecure.earth' };
  res.json({ token: createToken(user), user: { name: user.name, email: user.email }, demo: true });
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(clientDist));
  app.get('*', (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/e-cure-earth')
  .then(() => console.log('MongoDB connected'))
  .catch(() => console.warn('MongoDB unavailable: running read-only marketplace demo mode'));

app.listen(port, () => console.log(`E-Cure Earth API listening on http://localhost:${port}`));
