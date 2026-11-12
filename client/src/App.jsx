import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BarChart3, BookOpen, CalendarCheck, CheckCircle2, CircleUserRound, ExternalLink, FlaskConical, Leaf, LocateFixed, MapPinned, Menu, Moon, Recycle, Search, ShieldCheck, Sparkles, Sun, Truck, X } from 'lucide-react';
import { apiUrl } from './config';

const demoListings = [
  { _id: 'demo-1', title: 'Refurbished Field Laptop', category: 'Computing', condition: 'Grade A', price: 420, impact: '12.8 kg CO2e avoided', image: 'laptop.jpeg', seller: 'GreenLoop Studio' },
  { _id: 'demo-2', title: 'Modular Smartphone Kit', category: 'Mobile', condition: 'Grade A', price: 185, impact: '4.1 kg CO2e avoided', image: 'smartphone.jpeg', seller: 'Reboot Collective' },
  { _id: 'demo-3', title: 'Enterprise Monitor Pair', category: 'Displays', condition: 'Grade B+', price: 240, impact: '8.7 kg CO2e avoided', image: 'monitor.jpeg', seller: 'Northstar Renewables' }
];

const features = [
  [Truck, 'Find nearby collectors', 'Locate certified collectors, compare availability, and schedule a pickup that fits your day.'],
  [Recycle, 'Give devices another life', 'List working hardware in the circular marketplace instead of sending it to landfill.'],
  [BarChart3, 'Track your impact', 'See devices recycled, CO2 avoided, and green points grow from one calm dashboard.'],
  [ShieldCheck, 'Certified and secure', 'Every partner follows a documented chain of custody and secure data handling.'],
  [CalendarCheck, 'Doorstep pickup', 'Book a convenient collection for your home or business in a few thoughtful clicks.'],
  [Sparkles, 'Earn green points', 'Turn every responsible hand-off into rewards for your next sustainable choice.']
];

const fallbackCollectors = [
  { id: 'fallback-delhi', name: 'EcoTech Recycling Hub', location: 'Delhi NCR', badge: 'R2v3 Certified', lat: 28.6139, lon: 77.209, source: 'E-Cure network' },
  { id: 'fallback-mumbai', name: 'GreenCycle Processing Center', location: 'Mumbai', badge: 'ISO 14001', lat: 19.076, lon: 72.8777, source: 'E-Cure network' },
  { id: 'fallback-bengaluru', name: 'Urban Miners Zero-Waste', location: 'Bengaluru', badge: 'e-Stewards', lat: 12.9716, lon: 77.5946, source: 'E-Cure network' }
];

function mapEmbedUrl(lat, lon) {
  const delta = 0.12;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${lon - delta}%2C${lat - delta}%2C${lon + delta}%2C${lat + delta}&layer=mapnik&marker=${lat}%2C${lon}`;
}

function getBrowserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Geolocation is not supported by this browser.'));
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ lat: coords.latitude, lon: coords.longitude }),
      () => reject(new Error('Location access was not available. Search by city or postcode instead.')),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  });
}

async function fetchWithTimeout(url, options = {}, timeout = 10000) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    window.clearTimeout(timer);
  }
}

function distanceInKm(from, to) {
  const radians = (value) => value * Math.PI / 180;
  const latDelta = radians(to.lat - from.lat);
  const lonDelta = radians(to.lon - from.lon);
  const a = Math.sin(latDelta / 2) ** 2 + Math.cos(radians(from.lat)) * Math.cos(radians(to.lat)) * Math.sin(lonDelta / 2) ** 2;
  return Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function CollectorMap() {
  const [query, setQuery] = useState('');
  const [center, setCenter] = useState({ lat: 20.5937, lon: 78.9629 });
  const [collectors, setCollectors] = useState(fallbackCollectors);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  async function searchCollectors(event, useCurrentLocation = false) {
    event?.preventDefault();
    setLoading(true);
    setError('');
    let location = null;
    try {
      location = useCurrentLocation || !query.trim() ? await getBrowserLocation() : null;
      if (!location) {
        const geocodeResponse = await fetchWithTimeout(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query.trim())}`, { headers: { Accept: 'application/json' } });
        if (!geocodeResponse.ok) throw new Error('The location search service is unavailable.');
        const places = await geocodeResponse.json();
        if (!places.length) throw new Error('That location could not be found. Try a nearby city or postcode.');
        location = { lat: Number(places[0].lat), lon: Number(places[0].lon) };
      }

      const overpassQuery = `[out:json][timeout:20];(nwr["amenity"="recycling"](around:15000,${location.lat},${location.lon});nwr["shop"~"electronics|computer|mobile_phone"](around:15000,${location.lat},${location.lon}););out center tags;`;
      const placesResponse = await fetchWithTimeout(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`, { headers: { Accept: 'application/json' } }, 15000);
      if (!placesResponse.ok) throw new Error('The local seller directory is temporarily unavailable.');
      const placesData = await placesResponse.json();
      const results = placesData.elements.map((place) => {
        const lat = place.lat ?? place.center?.lat;
        const lon = place.lon ?? place.center?.lon;
        const tags = place.tags || {};
        return { id: `${place.type}-${place.id}`, name: tags.name || 'Local electronics seller', location: tags['addr:city'] || tags['addr:street'] || 'Nearby', badge: tags.amenity === 'recycling' ? 'Recycling point' : 'Electronics seller', lat, lon, distance: distanceInKm(location, { lat, lon }), source: 'OpenStreetMap' };
      }).filter((place) => Number.isFinite(place.lat) && Number.isFinite(place.lon)).sort((a, b) => a.distance - b.distance).slice(0, 6);
      setCenter(location);
      setCollectors(results);
      setSearched(true);
      if (!results.length) setError('No sellers or recycling points were found within 15 km. Try a wider city search.');
    } catch (requestError) {
      if (location) {
        try {
          const fallbackQuery = query.trim() ? `electronics recycling ${query.trim()}` : `electronics recycling near ${location.lat},${location.lon}`;
          const directoryResponse = await fetchWithTimeout(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&addressdetails=1&q=${encodeURIComponent(fallbackQuery)}`, { headers: { Accept: 'application/json' } });
          if (directoryResponse.ok) {
            const directoryPlaces = await directoryResponse.json();
            const directoryResults = directoryPlaces.map((place) => ({ id: `nominatim-${place.place_id}`, name: place.name || 'Local electronics seller', location: place.display_name?.split(',').slice(0, 2).join(',') || 'Nearby', badge: 'OpenStreetMap directory', lat: Number(place.lat), lon: Number(place.lon), distance: distanceInKm(location, { lat: Number(place.lat), lon: Number(place.lon) }), source: 'OpenStreetMap' })).filter((place) => Number.isFinite(place.lat) && Number.isFinite(place.lon));
            if (directoryResults.length) {
              setCenter(location);
              setCollectors(directoryResults);
              setSearched(true);
              return;
            }
          }
        } catch {
          // Keep the primary directory error when the secondary public endpoint also fails.
        }
      }
      setError(requestError.name === 'AbortError' ? 'The seller directory took too long to respond. Please try again or search another location.' : requestError.message || 'Unable to find local sellers right now.');
      setCollectors(fallbackCollectors);
    } finally {
      setLoading(false);
    }
  }

  return <div className="collector-tool">
    <form className="collector-search" onSubmit={searchCollectors}>
      <div className="search-field"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search city or postcode" aria-label="Search city or postcode" /></div>
      <button className="button button-primary" type="submit" disabled={loading}>{loading ? 'Searching...' : 'Find sellers'}</button>
      <button className="button button-secondary location-button" type="button" onClick={(event) => searchCollectors(event, true)} disabled={loading}><LocateFixed size={15} /> Use my location</button>
    </form>
    {error && <p className="collector-error" role="status">{error}</p>}
    <div className="collector-layout">
      <div className="collector-map glass-card">
        <iframe title="OpenStreetMap seller map" src={mapEmbedUrl(center.lat, center.lon)} loading="lazy" />
        <a className="map-credit" href={`https://www.openstreetmap.org/?mlat=${center.lat}&mlon=${center.lon}#map=12/${center.lat}/${center.lon}`} target="_blank" rel="noreferrer">Open larger map <ExternalLink size={12} /></a>
      </div>
      <div className="collector-list">
        {collectors.map((collector) => <a className="collector-row glass-card" href={`https://www.openstreetmap.org/?mlat=${collector.lat}&mlon=${collector.lon}#map=17/${collector.lat}/${collector.lon}`} target="_blank" rel="noreferrer" key={collector.id}><span className="collector-icon"><ShieldCheck size={18} /></span><div><strong>{collector.name}</strong><small>{collector.location} · {collector.badge}{collector.distance !== undefined ? ` · ${collector.distance} km away` : ''}</small><em>{collector.source}</em></div><ExternalLink size={15} /></a>)}
        {!collectors.length && searched && <div className="collector-empty glass-card">No matching sellers yet. Try another location.</div>}
      </div>
    </div>
  </div>;
}

function HomePage({ navigate }) {
  const [listings, setListings] = useState(demoListings);
  const [menuOpen, setMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [toast, setToast] = useState('');
  const [auth, setAuth] = useState({ email: '', password: '', name: '' });
  const [counts, setCounts] = useState({ phones: 12, laptops: 6, servers: 1 });
  const [session, setSession] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('eCureSession')) || null;
    } catch {
      return null;
    }
  });

  const [theme, setTheme] = useState(() => localStorage.getItem('eCureTheme') || 'light');

  useEffect(() => {
    document.body.classList.toggle('light-theme', theme === 'light');
    localStorage.setItem('eCureTheme', theme);
  }, [theme]);

  useEffect(() => {
    fetch(apiUrl('/api/listings'))
      .then((response) => response.ok ? response.json() : demoListings)
      .then(setListings)
      .catch(() => setListings(demoListings));
  }, []);

  useEffect(() => {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add('is-visible'));
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

    const hero = document.querySelector('.hero-visual');
    const moveHero = (event) => {
      if (!hero || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const bounds = hero.getBoundingClientRect();
      const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 8;
      const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * -8;
      hero.style.setProperty('--tilt-x', `${y}deg`);
      hero.style.setProperty('--tilt-y', `${x}deg`);
    };
    window.addEventListener('mousemove', moveHero);
    return () => {
      revealObserver.disconnect();
      window.removeEventListener('mousemove', moveHero);
    };
  }, []);

  const impact = useMemo(() => ({
    co2: counts.phones * 8 + counts.laptops * 35 + counts.servers * 120,
    weight: counts.phones * 0.2 + counts.laptops * 2.5 + counts.servers * 15,
    value: counts.phones * 75 + counts.laptops * 180 + counts.servers * 600
  }), [counts]);

  function showToast(message) {
    setToast(message);
    window.setTimeout(() => setToast(''), 3500);
  }

  async function submitAuth(event) {
    event.preventDefault();
    const endpoint = apiUrl(authMode === 'register' ? '/api/auth/register' : '/api/auth/login');
    const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(auth) });
    const data = await response.json();
    if (!response.ok) return showToast(data.message || 'Unable to complete that request.');
    localStorage.setItem('eCureSession', JSON.stringify(data));
    setSession(data);
    setAuthOpen(false);
    showToast(`Welcome, ${data.user.name}. Your green console is ready.`);
  }

  async function demoLogin() {
    try {
      const response = await fetch(apiUrl('/api/auth/demo-login'), { method: 'POST' });
      const data = await response.json();
      if (!response.ok) return showToast(data.message || 'Demo login is unavailable.');
      localStorage.setItem('eCureSession', JSON.stringify(data));
      setSession(data);
      setAuthOpen(false);
      showToast('Demo mode active. Welcome, Demo Explorer.');
    } catch {
      showToast('The server is unavailable. Please try again in a moment.');
    }
  }

  function signOut() {
    localStorage.removeItem('eCureSession');
    setSession(null);
    showToast('You have been signed out.');
  }

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" /><div className="ambient ambient-two" /><div className="grid-glow" />
      <header className="site-header">
        <a className="brand" href="#home" onClick={() => setMenuOpen(false)}><span className="brand-mark"><Leaf size={19} /></span><span>E-Cure <em>Earth</em><small>smart e-waste management</small></span></a>
        <button className="menu-button" aria-label="Toggle navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
        <nav className={menuOpen ? 'main-nav is-open' : 'main-nav'}>
          <a href="#manual" onClick={() => setMenuOpen(false)}>Manual</a><a href="#capabilities" onClick={() => setMenuOpen(false)}>Capabilities</a><a href="#carbon-calculator" onClick={() => setMenuOpen(false)}>Carbon Calculator</a><a href="/marketplace" onClick={(event) => { event.preventDefault(); navigate('/marketplace'); }}>Marketplace</a><a href="#collectors-map" onClick={() => setMenuOpen(false)}>Collectors Map</a><a href="#science" onClick={() => setMenuOpen(false)}>Science</a>
          <button className="theme-toggle" aria-label="Toggle color theme" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}</button>
          {session ? <><button className="session-pill" onClick={() => navigate('/dashboard')}><CircleUserRound size={15} /> {session.user.name}</button><button className="button button-secondary button-small" onClick={signOut}>Sign out</button></> : <button className="button button-primary button-small" onClick={() => navigate('/login')}><CircleUserRound size={15} /> Sign in</button>}
        </nav>
      </header>

      <main>
        <section className="hero section-wrap" id="home">
          <div className="hero-copy reveal"><p className="eyebrow"><span className="eyebrow-dot" /> India&apos;s smart e-waste management platform</p><h1>Turn e-waste into <span>sustainable</span> impact.</h1><p className="hero-text">Connect with certified recyclers, extend the life of your devices, and track your contribution to a greener planet — one device at a time.</p>          <div className="hero-actions"><button className="button button-primary button-large" onClick={() => navigate('/login')}>Get started free <ArrowRight size={17} /></button><a className="button button-secondary button-large" href="/marketplace" onClick={(event) => { event.preventDefault(); navigate('/marketplace'); }}>View marketplace</a></div><div className="hero-stats"><div><strong>10,000+</strong><span>devices recycled</span></div><div><strong>25,000kg</strong><span>CO2 saved</span></div><div><strong>500</strong><span>green members</span></div></div></div>
          <div className="hero-visual reveal" aria-label="E-waste recovery illustration"><div className="hero-image-card"><img src="/hero-image.jpg" alt="E-waste recycling" /><div className="hero-img-overlay" /></div><div className="hero-floating-badge"><span className="badge-orb">✦</span><div><strong>Carbon neutral</strong><small>Certified recycling process</small></div></div><div className="orbit orbit-one"><span className="orbit-dot"><Leaf size={15} /></span></div><div className="orbit orbit-two"><span className="orbit-dot"><Recycle size={16} /></span></div><div className="hero-cube cube-one" /><div className="hero-cube cube-two" /></div>
        </section>

        <section className="stats-strip"><div className="section-wrap stats-grid"><div><strong>10,000+</strong><span>Devices processed</span></div><div><strong>50+</strong><span>Certified recyclers</span></div><div><strong>25,000kg</strong><span>CO2 emissions saved</span></div><div><strong>98%</strong><span>Customer satisfaction</span></div></div></section>

        <section className="section-wrap section-block manual-section" id="manual"><div className="section-intro reveal"><p className="eyebrow"><BookOpen size={15} /> User manual</p><h2>A calmer way to <span>recycle right.</span></h2><p>Start with a device, choose the right next step, and let E-Cure Earth keep the evidence organized.</p></div><div className="manual-grid">{[['01', 'Register your device', 'Add a device or choose one from the marketplace. Every item gets a simple, traceable identity.'], ['02', 'Choose its next life', 'Book a certified pickup, list it for reuse, or find a local drop-off point.'], ['03', 'Read your impact', 'Return to your dashboard for a clear report on carbon, materials, and circular value.']].map(([number, title, copy]) => <article className="manual-step glass-card reveal" key={number}><span>{number}</span><div><h3>{title}</h3><p>{copy}</p></div><ArrowRight size={17} /></article>)}</div></section>

        <section className="section-wrap section-block" id="capabilities"><div className="section-intro reveal"><p className="eyebrow"><Sparkles size={15} /> Platform capabilities</p><h2>Everything you need to <span>recycle right.</span></h2><p>One connected system for collectors, buyers, listers, and sustainability teams.</p></div><div className="feature-grid">{features.map(([Icon, title, copy], index) => <article className="glass-card feature-card reveal" style={{ '--delay': `${index * 70}ms` }} key={title}><div className="feature-icon"><Icon size={21} /></div><h3>{title}</h3><p>{copy}</p></article>)}</div></section>

        <section className="process-section section-block" id="process"><div className="section-wrap"><div className="section-intro reveal"><p className="eyebrow">How it works</p><h2>Simple <span>three-step</span> process.</h2><p>From your doorstep to certified recycling — we handle everything.</p></div><div className="process-grid">{[['01', 'collection.jpg', 'Schedule collection', 'Book free doorstep pickup or drop off your e-waste at a certified collector center.'], ['02', 'processing.jpg', 'Safe processing', 'Devices are dismantled, data is permanently wiped, and materials are separated.'], ['03', 'recycling.jpg', 'Track your impact', 'Get your environmental report — CO2 saved, materials recovered, and points earned.']].map(([number, image, title, copy]) => <article className="process-card glass-card reveal" key={number}><span className="process-number">{number}</span><img src={`/${image}`} alt="" /><h3>{title}</h3><p>{copy}</p></article>)}</div></div></section>

        <section className="impact-section section-block" id="carbon-calculator"><div className="section-wrap impact-layout"><div className="section-intro reveal"><p className="eyebrow"><BarChart3 size={15} /> Carbon calculator</p><h2>See the good <span>add up.</span></h2><p>Model your next recovery cycle and turn avoided waste into a number your whole team can feel.</p></div><div className="calculator glass-card reveal">{Object.entries({ laptops: 'Laptops', phones: 'Phones', servers: 'Servers' }).map(([key, label]) => <label key={key}><span>{label}<b>{counts[key]} units</b></span><input type="range" min="0" max={key === 'servers' ? 10 : 50} value={counts[key]} onChange={(event) => setCounts({ ...counts, [key]: Number(event.target.value) })} /></label>)}<div className="metric-row"><div><strong>{impact.co2.toLocaleString()}</strong><small>kg CO2e avoided</small></div><div><strong>{impact.weight.toFixed(1)}</strong><small>kg materials recovered</small></div><div><strong>${impact.value.toLocaleString()}</strong><small>estimated value</small></div></div></div></div></section>

        <section className="section-wrap section-block collectors-section" id="collectors-map"><div className="section-intro reveal"><p className="eyebrow"><MapPinned size={15} /> Live seller directory</p><h2>Find a seller <span>near you.</span></h2><p>Search real nearby electronics sellers and recycling points using OpenStreetMap data, then open directions in a larger map.</p></div><CollectorMap /></section>

        <section className="science-section section-block" id="science"><div className="section-wrap science-layout"><div className="section-intro reveal"><p className="eyebrow"><FlaskConical size={15} /> The science of circularity</p><h2>Less waste. <span>More useful life.</span></h2><p>Keeping a device in use avoids the embedded carbon of manufacturing a replacement and recovers valuable materials from the loop.</p></div><div className="science-cards"><article className="science-card reveal"><strong>70%</strong><span>of a device&apos;s carbon footprint can happen before it reaches your hands.</span></article><article className="science-card reveal"><strong>17.4kg</strong><span>of e-waste was generated per person globally in the last measured year.</span></article><article className="science-card reveal"><strong>98%</strong><span>material recovery is possible when devices enter a certified process.</span></article></div></div></section>

        <section className="section-wrap section-block" id="marketplace"><div className="market-heading"><div className="section-intro reveal"><p className="eyebrow">Circular marketplace</p><h2>Buy & sell <span>used electronics.</span></h2><p>Give great tech a second life and make sustainable choices that feel effortless.</p></div><button className="button button-secondary" onClick={() => navigate('/marketplace')}>Browse all <ArrowRight size={16} /></button></div><div className="listing-grid">{listings.map((item) => <article className="listing-card glass-card reveal" key={item._id}><div className="listing-image"><img src={`/${item.image}`} alt="" /><span>{item.condition}</span></div><div className="listing-body"><p>{item.category} / {item.seller}</p><h3>{item.title}</h3><div><strong>${item.price}</strong><small>{item.impact}</small></div><button onClick={() => showToast(`${item.title} added to your collection.`)}>Reserve piece <ArrowRight size={15} /></button></div></article>)}</div></section>

        <section className="cta-section"><div className="section-wrap reveal"><p className="eyebrow">The future is recoverable</p><h2>Ready to make a <span>difference?</span></h2><p>Join thousands of responsible people and businesses already building a greener planet.</p><button className="button button-primary button-large" onClick={() => navigate('/login')}>Start for free <ArrowRight size={17} /></button></div></section>
      </main>

      <footer className="site-footer section-wrap"><a className="brand" href="#home"><span className="brand-mark"><Leaf size={19} /></span><span>E-Cure <em>Earth</em><small>grow a circular future</small></span></a><p>© 2026 E-Cure Earth. Responsible technology, responsibly handled.</p><div className="footer-links"><a href="#capabilities">Capabilities</a><a href="#science">Science</a><a href="#marketplace">Marketplace</a></div></footer>
      {toast && <div className="toast"><CheckCircle2 size={17} /> {toast}</div>}
      {authOpen && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setAuthOpen(false)}><form className="auth-card glass-card" onSubmit={submitAuth}><button type="button" className="modal-close" onClick={() => setAuthOpen(false)}><X /></button><p className="eyebrow"><Leaf size={15} /> Welcome to the green network</p><h2>{authMode === 'register' ? 'Plant your account.' : 'Welcome back.'}</h2>{authMode === 'register' && <input required placeholder="Your name" value={auth.name} onChange={(event) => setAuth({ ...auth, name: event.target.value })} />}<input required type="email" placeholder="Email address" value={auth.email} onChange={(event) => setAuth({ ...auth, email: event.target.value })} /><input required minLength="8" type="password" placeholder="Password (8+ characters)" value={auth.password} onChange={(event) => setAuth({ ...auth, password: event.target.value })} /><button className="button button-primary" type="submit">{authMode === 'register' ? 'Create account' : 'Sign in'} <ArrowRight size={16} /></button>{authMode === 'login' && <><div className="auth-divider"><span>or</span></div><button type="button" className="button demo-button" onClick={demoLogin}>Continue with demo account</button><p className="demo-hint">No database account required</p></>}<button type="button" className="switch-auth" onClick={() => setAuthMode(authMode === 'register' ? 'login' : 'register')}>{authMode === 'register' ? 'Already a member? Sign in' : 'New here? Register your org'}</button></form></div>}
    </div>
  );
}

function getStoredSession() {
  try {
    return JSON.parse(localStorage.getItem('eCureSession')) || null;
  } catch {
    return null;
  }
}

function ThemeToggle() {
  const [theme, setTheme] = useState(() => localStorage.getItem('eCureTheme') || 'light');
  useEffect(() => {
    document.body.classList.toggle('light-theme', theme === 'light');
    localStorage.setItem('eCureTheme', theme);
  }, [theme]);
  return <button className="theme-toggle" aria-label="Toggle color theme" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}</button>;
}

function ProductCard({ item, onReserve }) {
  return <article className="listing-card glass-card"><div className="listing-image"><img src={`/${item.image}`} alt="" /><span>{item.condition}</span></div><div className="listing-body"><p>{item.category} / {item.seller}</p><h3>{item.title}</h3><div><strong>${item.price}</strong><small>{item.impact}</small></div><button onClick={onReserve}>Reserve piece <ArrowRight size={15} /></button></div></article>;
}

function LoginPage({ navigate }) {
  const [role, setRole] = useState('buyer');
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const response = await fetch(apiUrl(endpoint), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, role }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to continue.');
      localStorage.setItem('eCureSession', JSON.stringify(data));
      navigate('/dashboard');
    } catch (requestError) {
      setError(requestError.message || 'The server is unavailable.');
    } finally {
      setBusy(false);
    }
  }

  async function demoLogin(demoRole) {
    setBusy(true);
    setError('');
    try {
      const response = await fetch(apiUrl('/api/auth/demo-login'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: demoRole }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Demo login is unavailable.');
      localStorage.setItem('eCureSession', JSON.stringify(data));
      navigate('/dashboard');
    } catch (requestError) {
      setError(requestError.message || 'The server is unavailable.');
    } finally {
      setBusy(false);
    }
  }

  return <div className="auth-page"><div className="auth-topbar"><div className="auth-brand" onClick={() => navigate('/')}><span className="brand-mark"><Leaf size={19} /></span><span>E-Cure <em>Earth</em><small>smart e-waste management</small></span></div><ThemeToggle /></div><div className="auth-layout"><div className="auth-visual"><p className="eyebrow"><Sparkles size={15} /> Join the circular network</p><h1>One login.<br /><span>Two ways</span> to make impact.</h1><p>Buy responsibly, list useful tech, and keep every device moving toward its next best life.</p><div className="auth-visual-orbit"><Recycle size={65} /></div></div><form className="auth-card glass-card auth-form" onSubmit={submit}><p className="eyebrow"><CircleUserRound size={15} /> {mode === 'register' ? 'Create your account' : 'Secure member access'}</p><h2>{mode === 'register' ? 'Create your account.' : 'Welcome back.'}</h2><div className="role-switch"><button type="button" className={role === 'buyer' ? 'active' : ''} onClick={() => setRole('buyer')}><Recycle size={16} /> Buyer</button><button type="button" className={role === 'lister' ? 'active' : ''} onClick={() => setRole('lister')}><Sparkles size={16} /> Lister</button></div>{mode === 'register' && <input required placeholder="Full name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />}<input required type="email" placeholder="Email address" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /><input required minLength="8" type="password" placeholder="Password (8+ characters)" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />{error && <p className="form-error">{error}</p>}<button disabled={busy} className="button button-primary button-large" type="submit">{busy ? 'Please wait...' : mode === 'register' ? 'Create account' : `Sign in as ${role}`} <ArrowRight size={16} /></button><div className="auth-divider"><span>demo access</span></div><div className="demo-actions"><button type="button" disabled={busy} className="button demo-button" onClick={() => demoLogin('buyer')}>Demo Buyer</button><button type="button" disabled={busy} className="button demo-button" onClick={() => demoLogin('lister')}>Demo Lister</button></div><button type="button" className="switch-auth" onClick={() => setMode(mode === 'register' ? 'login' : 'register')}>{mode === 'register' ? 'Already registered? Sign in' : 'New here? Create an account'}</button><button type="button" className="back-home" onClick={() => navigate('/')}>Back to home</button></form></div></div>;
}

function DashboardPage({ navigate }) {
  const session = getStoredSession();
  if (!session) return <LoginPage navigate={navigate} />;
  const isLister = session.user.role === 'lister';
  return <div className="workspace"><WorkspaceNav navigate={navigate} session={session} active="dashboard" /><main className="workspace-main"><div className="workspace-heading"><div><p className="eyebrow">Good morning, {session.user.name}</p><h1>Your impact <span>dashboard.</span></h1><p>Everything important about your circular activity, in one calm view.</p></div><span className="role-badge"><CircleUserRound size={15} /> {isLister ? 'Lister account' : 'Buyer account'}</span></div><div className="dashboard-stats"><div className="dashboard-stat"><span>Devices {isLister ? 'listed' : 'collected'}</span><strong>{isLister ? '18' : '24'}</strong><small>+12% this month</small></div><div className="dashboard-stat"><span>CO2 avoided</span><strong>{isLister ? '184' : '426'} kg</strong><small>Verified impact</small></div><div className="dashboard-stat"><span>Green points</span><strong>{isLister ? '2,840' : '1,260'}</strong><small>Redeemable rewards</small></div><div className="dashboard-stat"><span>Account status</span><strong>Active</strong><small>Since November 2026</small></div></div><div className="dashboard-grid"><section className="dashboard-panel glass-card"><div className="panel-heading"><div><p className="eyebrow">Latest activity</p><h2>Your circular rhythm</h2></div><button className="text-button">View all <ArrowRight size={14} /></button></div>{['Certified pickup completed', isLister ? 'New listing approved' : 'Marketplace reserve confirmed', 'Impact certificate generated'].map((activity, index) => <div className="activity-row" key={activity}><span className="activity-icon"><CheckCircle2 size={17} /></span><div><strong>{activity}</strong><small>{index === 0 ? 'Today, 10:42 AM' : `${index + 1} days ago`} · Verified by E-Cure Earth</small></div><span className="activity-status">Complete</span></div>)}</section><section className="dashboard-panel glass-card quick-panel"><p className="eyebrow">Quick actions</p><h2>Make your next move.</h2><button className="quick-action" onClick={() => navigate(isLister ? '/marketplace?create=1' : '/marketplace')}><span>{isLister ? <Sparkles /> : <Recycle />}</span><div><strong>{isLister ? 'List a device' : 'Explore marketplace'}</strong><small>{isLister ? 'Give hardware a new owner' : 'Find your next refurbished piece'}</small></div><ArrowRight size={16} /></button><button className="quick-action" onClick={() => navigate('/#impact')}><span><BarChart3 /></span><div><strong>Calculate impact</strong><small>Model your next recovery cycle</small></div><ArrowRight size={16} /></button></section></div></main></div>;
}

function WorkspaceNav({ navigate, session, active }) {
  function signOut() {
    localStorage.removeItem('eCureSession');
    navigate('/');
  }
  return <header className="workspace-nav"><button className="workspace-brand" onClick={() => navigate('/')}><span className="brand-mark"><Leaf size={18} /></span>E-Cure <em>Earth</em></button><nav><button className={active === 'dashboard' ? 'active' : ''} onClick={() => navigate('/dashboard')}><BarChart3 size={15} /> Dashboard</button><button className={active === 'marketplace' ? 'active' : ''} onClick={() => navigate('/marketplace')}><Recycle size={15} /> Marketplace</button><button onClick={() => navigate('/')}><ArrowRight size={15} /> Home</button></nav><ThemeToggle /><div className="workspace-user"><span>{session.user.name}</span><button onClick={signOut}>Sign out</button></div></header>;
}

function MarketplacePage({ navigate }) {
  const session = getStoredSession();
  const [listings, setListings] = useState(demoListings);
  const [showForm, setShowForm] = useState(new URLSearchParams(window.location.search).get('create') === '1');
  const [form, setForm] = useState({ title: '', category: 'Computing', condition: 'Grade A', price: '', impact: '' });
  const [message, setMessage] = useState('');
  useEffect(() => {
    fetch(apiUrl('/api/listings')).then((response) => response.ok ? response.json() : demoListings).then(setListings).catch(() => setListings(demoListings));
  }, []);
  const isLister = session?.user?.role === 'lister';
  async function publish(event) {
    event.preventDefault();
    const response = await fetch(apiUrl('/api/listings'), { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.token || ''}` }, body: JSON.stringify({ ...form, image: 'laptop.jpeg' }) });
    const data = await response.json();
    if (!response.ok) return setMessage(data.message || 'Unable to publish listing.');
    setListings([data, ...listings]);
    setForm({ title: '', category: 'Computing', condition: 'Grade A', price: '', impact: '' });
    setShowForm(false);
    setMessage('Your listing is now live.');
  }
  return <div className="workspace"><WorkspaceNav navigate={navigate} session={session || { user: { name: 'Guest' } }} active="marketplace" /><main className="workspace-main"><div className="workspace-heading marketplace-heading"><div><p className="eyebrow">Verified circular commerce</p><h1>The <span>marketplace.</span></h1><p>Quality devices, transparent impact, and a better next chapter for every piece of hardware.</p></div>{isLister ? <button className="button button-primary" onClick={() => setShowForm(!showForm)}><Sparkles size={16} /> {showForm ? 'Close form' : 'List a device'}</button> : <span className="role-badge"><Recycle size={15} /> Buyer view</span>}</div>{message && <div className="workspace-message">{message}</div>}{showForm && isLister && <form className="listing-form glass-card" onSubmit={publish}><p className="eyebrow">Lister studio</p><h2>Publish a new device.</h2><div className="form-grid"><input required placeholder="Listing title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /><input required placeholder="Category" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} /><input required placeholder="Condition" value={form.condition} onChange={(event) => setForm({ ...form, condition: event.target.value })} /><input required type="number" min="0" placeholder="Price (USD)" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} /><input required className="wide-input" placeholder="Impact statement, e.g. 8.5 kg CO2e avoided" value={form.impact} onChange={(event) => setForm({ ...form, impact: event.target.value })} /></div><button className="button button-primary" type="submit">Publish listing <ArrowRight size={15} /></button></form>}<div className="marketplace-toolbar"><span>{listings.length} verified pieces</span><span>Secure chain of custody · 30-day support</span></div><div className="listing-grid workspace-listings">{listings.map((item) => <ProductCard key={item._id} item={item} onReserve={() => setMessage(session ? `${item.title} reserved for ${session.user.name}.` : 'Sign in as a buyer to reserve a piece.')} />)}</div></main></div>;
}

function App() {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);
  function navigate(nextPath) {
    const nextUrl = new URL(nextPath, window.location.origin);
    window.history.pushState({}, '', nextUrl);
    setPath(nextUrl.pathname);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  if (path === '/login') return <LoginPage navigate={navigate} />;
  if (path === '/dashboard') return <DashboardPage navigate={navigate} />;
  if (path === '/marketplace') return <MarketplacePage navigate={navigate} />;
  return <HomePage navigate={navigate} />;
}

export default App;
