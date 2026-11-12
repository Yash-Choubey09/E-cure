import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BarChart3, CalendarCheck, CheckCircle2, CircleUserRound, Leaf, Menu, Recycle, ShieldCheck, Sparkles, Truck, X } from 'lucide-react';

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

function App() {
  const [listings, setListings] = useState(demoListings);
  const [menuOpen, setMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [toast, setToast] = useState('');
  const [auth, setAuth] = useState({ email: '', password: '', name: '' });
  const [counts, setCounts] = useState({ phones: 12, laptops: 6, servers: 1 });

  useEffect(() => {
    fetch('/api/listings')
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
    const endpoint = authMode === 'register' ? '/api/auth/register' : '/api/auth/login';
    const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(auth) });
    const data = await response.json();
    if (!response.ok) return showToast(data.message || 'Unable to complete that request.');
    localStorage.setItem('eCureSession', JSON.stringify(data));
    setAuthOpen(false);
    showToast(`Welcome, ${data.user.name}. Your green console is ready.`);
  }

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" /><div className="ambient ambient-two" /><div className="grid-glow" />
      <header className="site-header">
        <a className="brand" href="#home" onClick={() => setMenuOpen(false)}><span className="brand-mark"><Leaf size={19} /></span><span>E-Cure <em>Earth</em><small>smart e-waste management</small></span></a>
        <button className="menu-button" aria-label="Toggle navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
        <nav className={menuOpen ? 'main-nav is-open' : 'main-nav'}>
          <a href="#about" onClick={() => setMenuOpen(false)}>Why us</a><a href="#process" onClick={() => setMenuOpen(false)}>How it works</a><a href="#impact" onClick={() => setMenuOpen(false)}>Impact</a><a href="#marketplace" onClick={() => setMenuOpen(false)}>Marketplace</a>
          <button className="button button-primary button-small" onClick={() => setAuthOpen(true)}><CircleUserRound size={15} /> Sign in</button>
        </nav>
      </header>

      <main>
        <section className="hero section-wrap" id="home">
          <div className="hero-copy reveal"><p className="eyebrow"><span className="eyebrow-dot" /> India&apos;s smart e-waste management platform</p><h1>Turn e-waste into <span>sustainable</span> impact.</h1><p className="hero-text">Connect with certified recyclers, extend the life of your devices, and track your contribution to a greener planet — one device at a time.</p><div className="hero-actions"><button className="button button-primary button-large" onClick={() => setAuthOpen(true)}>Get started free <ArrowRight size={17} /></button><a className="button button-secondary button-large" href="#marketplace">View marketplace</a></div><div className="hero-stats"><div><strong>10,000+</strong><span>devices recycled</span></div><div><strong>25,000kg</strong><span>CO2 saved</span></div><div><strong>500</strong><span>green members</span></div></div></div>
          <div className="hero-visual reveal" aria-label="E-waste recovery illustration"><div className="hero-image-card"><img src="/hero-image.jpg" alt="E-waste recycling" /><div className="hero-img-overlay" /></div><div className="hero-floating-badge"><span className="badge-orb">✦</span><div><strong>Carbon neutral</strong><small>Certified recycling process</small></div></div><div className="orbit orbit-one"><span className="orbit-dot"><Leaf size={15} /></span></div><div className="orbit orbit-two"><span className="orbit-dot"><Recycle size={16} /></span></div><div className="hero-cube cube-one" /><div className="hero-cube cube-two" /></div>
        </section>

        <section className="stats-strip"><div className="section-wrap stats-grid"><div><strong>10,000+</strong><span>Devices processed</span></div><div><strong>50+</strong><span>Certified recyclers</span></div><div><strong>25,000kg</strong><span>CO2 emissions saved</span></div><div><strong>98%</strong><span>Customer satisfaction</span></div></div></section>

        <section className="section-wrap section-block" id="about"><div className="section-intro reveal"><p className="eyebrow">Why E-Cure Earth</p><h2>Everything you need to <span>recycle right.</span></h2><p>Our all-in-one platform makes responsible e-waste disposal simple, trackable, and rewarding.</p></div><div className="feature-grid">{features.map(([Icon, title, copy], index) => <article className="glass-card feature-card reveal" style={{ '--delay': `${index * 70}ms` }} key={title}><div className="feature-icon"><Icon size={21} /></div><h3>{title}</h3><p>{copy}</p></article>)}</div></section>

        <section className="process-section section-block" id="process"><div className="section-wrap"><div className="section-intro reveal"><p className="eyebrow">How it works</p><h2>Simple <span>three-step</span> process.</h2><p>From your doorstep to certified recycling — we handle everything.</p></div><div className="process-grid">{[['01', 'collection.jpg', 'Schedule collection', 'Book free doorstep pickup or drop off your e-waste at a certified collector center.'], ['02', 'processing.jpg', 'Safe processing', 'Devices are dismantled, data is permanently wiped, and materials are separated.'], ['03', 'recycling.jpg', 'Track your impact', 'Get your environmental report — CO2 saved, materials recovered, and points earned.']].map(([number, image, title, copy]) => <article className="process-card glass-card reveal" key={number}><span className="process-number">{number}</span><img src={`/${image}`} alt="" /><h3>{title}</h3><p>{copy}</p></article>)}</div></div></section>

        <section className="impact-section section-block" id="impact"><div className="section-wrap impact-layout"><div className="section-intro reveal"><p className="eyebrow">Your live impact ledger</p><h2>See the good <span>add up.</span></h2><p>Model your next recovery cycle and turn avoided waste into a number your whole team can feel.</p></div><div className="calculator glass-card reveal">{Object.entries({ laptops: 'Laptops', phones: 'Phones', servers: 'Servers' }).map(([key, label]) => <label key={key}><span>{label}<b>{counts[key]} units</b></span><input type="range" min="0" max={key === 'servers' ? 10 : 50} value={counts[key]} onChange={(event) => setCounts({ ...counts, [key]: Number(event.target.value) })} /></label>)}<div className="metric-row"><div><strong>{impact.co2.toLocaleString()}</strong><small>kg CO2e avoided</small></div><div><strong>{impact.weight.toFixed(1)}</strong><small>kg materials recovered</small></div><div><strong>${impact.value.toLocaleString()}</strong><small>estimated value</small></div></div></div></div></section>

        <section className="section-wrap section-block" id="marketplace"><div className="market-heading"><div className="section-intro reveal"><p className="eyebrow">Circular marketplace</p><h2>Buy & sell <span>used electronics.</span></h2><p>Give great tech a second life and make sustainable choices that feel effortless.</p></div><button className="button button-secondary" onClick={() => showToast('Marketplace is loading the latest verified devices.')}>Browse all <ArrowRight size={16} /></button></div><div className="listing-grid">{listings.map((item) => <article className="listing-card glass-card reveal" key={item._id}><div className="listing-image"><img src={`/${item.image}`} alt="" /><span>{item.condition}</span></div><div className="listing-body"><p>{item.category} / {item.seller}</p><h3>{item.title}</h3><div><strong>${item.price}</strong><small>{item.impact}</small></div><button onClick={() => showToast(`${item.title} added to your collection.`)}>Reserve piece <ArrowRight size={15} /></button></div></article>)}</div></section>

        <section className="cta-section"><div className="section-wrap reveal"><p className="eyebrow">The future is recoverable</p><h2>Ready to make a <span>difference?</span></h2><p>Join thousands of responsible people and businesses already building a greener planet.</p><button className="button button-primary button-large" onClick={() => setAuthOpen(true)}>Start for free <ArrowRight size={17} /></button></div></section>
      </main>

      <footer className="site-footer section-wrap"><a className="brand" href="#home"><span className="brand-mark"><Leaf size={19} /></span><span>E-Cure <em>Earth</em><small>grow a circular future</small></span></a><p>© 2026 E-Cure Earth. Responsible technology, responsibly handled.</p><div className="footer-links"><a href="#about">About</a><a href="#process">Mission</a><a href="#marketplace">Marketplace</a></div></footer>
      {toast && <div className="toast"><CheckCircle2 size={17} /> {toast}</div>}
      {authOpen && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setAuthOpen(false)}><form className="auth-card glass-card" onSubmit={submitAuth}><button type="button" className="modal-close" onClick={() => setAuthOpen(false)}><X /></button><p className="eyebrow"><Leaf size={15} /> Welcome to the green network</p><h2>{authMode === 'register' ? 'Plant your account.' : 'Welcome back.'}</h2>{authMode === 'register' && <input required placeholder="Your name" value={auth.name} onChange={(event) => setAuth({ ...auth, name: event.target.value })} />}<input required type="email" placeholder="Email address" value={auth.email} onChange={(event) => setAuth({ ...auth, email: event.target.value })} /><input required minLength="8" type="password" placeholder="Password (8+ characters)" value={auth.password} onChange={(event) => setAuth({ ...auth, password: event.target.value })} /><button className="button button-primary" type="submit">{authMode === 'register' ? 'Create account' : 'Sign in'} <ArrowRight size={16} /></button><button type="button" className="switch-auth" onClick={() => setAuthMode(authMode === 'register' ? 'login' : 'register')}>{authMode === 'register' ? 'Already a member? Sign in' : 'New here? Register your org'}</button></form></div>}
    </div>
  );
}

export default App;
