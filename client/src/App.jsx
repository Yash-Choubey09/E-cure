import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BadgeCheck, Flower2, Leaf, Menu, PackageCheck, ShieldCheck, Sparkles, X } from 'lucide-react';

const fallbackListings = [
  { _id: 'demo-1', title: 'Refurbished Field Laptop', category: 'Computing', condition: 'Grade A', price: 420, impact: '12.8 kg CO2e avoided', image: 'laptop.jpeg', seller: 'GreenLoop Studio' },
  { _id: 'demo-2', title: 'Modular Smartphone Kit', category: 'Mobile', condition: 'Grade A', price: 185, impact: '4.1 kg CO2e avoided', image: 'smartphone.jpeg', seller: 'Reboot Collective' },
  { _id: 'demo-3', title: 'Enterprise Monitor Pair', category: 'Displays', condition: 'Grade B+', price: 240, impact: '8.7 kg CO2e avoided', image: 'monitor.jpeg', seller: 'Northstar Renewables' }
];

function App() {
  const [listings, setListings] = useState(fallbackListings);
  const [menuOpen, setMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [counts, setCounts] = useState({ phones: 12, laptops: 6, servers: 1 });
  const [auth, setAuth] = useState({ email: '', password: '', name: '' });
  const [isRegister, setIsRegister] = useState(false);

  useEffect(() => {
    fetch('/api/listings').then((response) => response.ok ? response.json() : fallbackListings)
      .then(setListings).catch(() => setListings(fallbackListings));
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
    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(auth) });
    const data = await response.json();
    if (!response.ok) return showToast(data.message || 'Unable to complete that request.');
    localStorage.setItem('eCureSession', JSON.stringify(data));
    setAuthOpen(false);
    showToast(`Welcome back, ${data.user.name}. Your circular console is ready.`);
  }

  return (
    <div className="app-shell">
      <div className="leaf-sprig leaf-sprig-left" aria-hidden="true"><Leaf size={130} /></div>
      <div className="leaf-sprig leaf-sprig-right" aria-hidden="true"><Flower2 size={145} /></div>
      <header className="site-header">
        <a className="brand" href="#home" onClick={() => setMenuOpen(false)}>
          <span className="brand-mark"><Leaf size={19} /></span>
          <span>E-Cure <em>Earth</em><small>circular hardware, beautifully done</small></span>
        </a>
        <button className="menu-button" aria-label="Toggle navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
        <nav className={menuOpen ? 'main-nav is-open' : 'main-nav'}>
          <a href="#story" onClick={() => setMenuOpen(false)}>Our rhythm</a>
          <a href="#ledger" onClick={() => setMenuOpen(false)}>Impact ledger</a>
          <a href="#marketplace" onClick={() => setMenuOpen(false)}>Marketplace</a>
          <button className="button button-dark" onClick={() => setAuthOpen(true)}>Enter console <ArrowRight size={16} /></button>
        </nav>
      </header>

      <main>
        <section className="hero section-wrap" id="home">
          <div className="hero-copy">
            <p className="eyebrow"><Sparkles size={15} /> Floral intelligence for used tech</p>
            <h1>Give good hardware <i>a second season.</i></h1>
            <p className="hero-text">E-Cure Earth makes e-waste feel less like a dead end and more like a living garden: trace every device, recover its value, and keep useful materials in circulation.</p>
            <div className="hero-actions"><a className="button button-primary" href="#marketplace">Explore the garden <ArrowRight size={17} /></a><a className="text-link" href="#ledger">See the impact <span>↘</span></a></div>
            <div className="hero-proof"><span><BadgeCheck size={18} /> Verified chains</span><span><Leaf size={18} /> 98% material recovery</span></div>
          </div>
          <div className="hero-art" aria-label="Illustration of a flourishing circular hardware garden">
            <div className="sun-disc"></div><div className="art-ring ring-one"></div><div className="art-ring ring-two"></div>
            <div className="device-card"><span>SEASON 04</span><strong>RE:USE<br /><i>the future</i></strong><small>Field-tested. Traceable. Loved longer.</small></div>
            <span className="flower flower-one">✽</span><span className="flower flower-two">✿</span><span className="flower flower-three">✾</span>
          </div>
        </section>

        <section className="marquee"><span>REPAIR</span><b>✽</b><span>REUSE</span><b>✽</b><span>RECOVER</span><b>✽</b><span>REPEAT</span></section>

        <section className="story section-wrap" id="story">
          <div><p className="eyebrow"><span className="number">01</span> A softer operating system</p><h2>Make circularity feel <i>natural.</i></h2></div>
          <div className="story-copy"><p>From first pickup to final material recovery, we replace black-box disposal with a calm, accountable flow. Your team gets the story of every asset, not just a receipt at the end.</p><div className="feature-grid"><article><ShieldCheck /><h3>Chain of care</h3><p>Auditable custody and certified data sanitization.</p></article><article><PackageCheck /><h3>Useful again</h3><p>Refurbished devices find their next right owner.</p></article><article><Leaf /><h3>Measured impact</h3><p>Clear carbon and material savings for every cycle.</p></article></div></div>
        </section>

        <section className="ledger section-wrap" id="ledger">
          <div className="ledger-heading"><p className="eyebrow"><span className="number">02</span> Your live impact ledger</p><h2>See the good <i>add up.</i></h2><p>Move the sliders to model your next recovery cycle. These estimates turn avoided waste into a number your whole team can feel.</p></div>
          <div className="calculator">
            {Object.entries({ laptops: 'Laptops', phones: 'Phones', servers: 'Servers' }).map(([key, label]) => <label key={key}><span>{label}<strong>{counts[key]} units</strong></span><input type="range" min="0" max={key === 'servers' ? 10 : 50} value={counts[key]} onChange={(event) => setCounts({ ...counts, [key]: Number(event.target.value) })} /></label>)}
            <div className="metric-row"><div><strong>{impact.co2.toLocaleString()}</strong><span>kg CO2e avoided</span></div><div><strong>{impact.weight.toFixed(1)}</strong><span>kg materials recovered</span></div><div><strong>${impact.value.toLocaleString()}</strong><span>estimated value</span></div></div>
          </div>
        </section>

        <section className="marketplace section-wrap" id="marketplace">
          <div className="section-heading"><div><p className="eyebrow"><span className="number">03</span> The circular marketplace</p><h2>Good tech, <i>new chapters.</i></h2></div><a className="text-link" href="#marketplace">View all pieces <ArrowRight size={16} /></a></div>
          <div className="listing-grid">{listings.map((item) => <article className="listing-card" key={item._id}><div className="listing-image"><img src={`/${item.image}`} alt="" /><span>{item.condition}</span></div><div className="listing-body"><p>{item.category} / {item.seller}</p><h3>{item.title}</h3><div><strong>${item.price}</strong><small>{item.impact}</small></div><button onClick={() => showToast(`${item.title} added to your collection.`)}>Reserve piece <ArrowRight size={15} /></button></div></article>)}</div>
        </section>
      </main>

      <footer className="site-footer section-wrap"><div><a className="brand" href="#home"><span className="brand-mark"><Leaf size={19} /></span><span>E-Cure <em>Earth</em><small>keep the good stuff growing</small></span></a></div><p>Built for a future where every device has another life.</p><span>© 2026 E-Cure Earth</span></footer>
      {toast && <div className="toast"><Leaf size={17} /> {toast}</div>}
      {authOpen && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setAuthOpen(false)}><form className="auth-card" onSubmit={submitAuth}><button type="button" className="modal-close" onClick={() => setAuthOpen(false)}><X /></button><p className="eyebrow"><Flower2 size={15} /> Welcome to the garden</p><h2>{isRegister ? 'Plant your account.' : 'Welcome back.'}</h2>{isRegister && <input required placeholder="Your name" value={auth.name} onChange={(event) => setAuth({ ...auth, name: event.target.value })} />}<input required type="email" placeholder="Email address" value={auth.email} onChange={(event) => setAuth({ ...auth, email: event.target.value })} /><input required minLength="8" type="password" placeholder="Password (8+ characters)" value={auth.password} onChange={(event) => setAuth({ ...auth, password: event.target.value })} /><button className="button button-primary" type="submit">{isRegister ? 'Create account' : 'Sign in'} <ArrowRight size={16} /></button><button type="button" className="switch-auth" onClick={() => setIsRegister(!isRegister)}>{isRegister ? 'Already a member? Sign in' : 'New here? Register your org'}</button></form></div>}
    </div>
  );
}

export default App;
