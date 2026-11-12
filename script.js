// ==========================================================================
// E-CURE EARTH | BOTANICAL LUXURY JAVASCRIPT LOGIC
// Clean OpenStreetMap Tiles, Interactive User Experience, Session Handling
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    initSmoothScroll();
    initMobileNav();
    initLeafletMap();
    initEsgCalculator();
    initMarketplaceActions();
    initCollectorActions();
    checkAuthSession();
});

// --- MOBILE NAVIGATION TOGGLE ---
function initMobileNav() {
    const toggleBtn = document.querySelector('.mobile-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (toggleBtn && navLinks) {
        toggleBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });

        // Close mobile nav when clicking a link
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
            });
        });
    }
}

// --- TOAST NOTIFICATIONS ---
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icon = type === 'success' ? 'fa-circle-check' : 'fa-circle-info';
    toast.innerHTML = `<i class="fas ${icon}"></i> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// --- 1. SMOOTH SCROLLING ---
function initSmoothScroll() {
    const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
    const sections = document.querySelectorAll('section[id]');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const targetId = link.getAttribute('href');
            if (targetId && targetId !== '#') {
                e.preventDefault();
                const targetEl = document.querySelector(targetId);
                if (targetEl) {
                    targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        });
    });

    window.addEventListener('scroll', () => {
        let scrollY = window.pageYOffset;
        sections.forEach(current => {
            const sectionHeight = current.offsetHeight;
            const sectionTop = current.offsetTop - 150;
            const sectionId = current.getAttribute('id');
            const correspondingLink = document.querySelector(`.nav-links a[href*="${sectionId}"]`);

            if (correspondingLink) {
                if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                    correspondingLink.classList.add('active');
                } else {
                    correspondingLink.classList.remove('active');
                }
            }
        });
    });
}

// --- 2. LEAFLET MAP (STANDARD OPENSTREETMAP PUBLIC TILES - GUARANTEED TO LOAD) ---
function initLeafletMap() {
    const mapContainer = document.getElementById('map-embedded');
    if (!mapContainer || typeof L === 'undefined') return;

    // Standard OpenStreetMap coordinates for multi-region depot view
    const map = L.map('map-embedded').setView([40.730610, -73.935242], 11);

    // Standard open OpenStreetMap API tiles with no auth tokens required
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    const collectors = [
        { name: "EcoTech Metallurgy Hub", lat: 40.750610, lng: -73.945242, address: "104 Industrial Parkway, North Tech District" },
        { name: "GreenCycle Precious Metallurgy", lat: 40.712776, lng: -74.005974, address: "520 Circular Boulevard, Central Metro Hub" },
        { name: "Urban Miners Zero-Waste Depot", lat: 40.678177, lng: -73.944160, address: "89 Eco Commerce Way, South Zone" }
    ];

    collectors.forEach(c => {
        const marker = L.circleMarker([c.lat, c.lng], {
            radius: 8,
            fillColor: "#eab308",
            color: "#142a1f",
            weight: 2,
            opacity: 1,
            fillOpacity: 0.95
        }).addTo(map);

        marker.bindPopup(`
            <div style="font-family:'Plus Jakarta Sans',sans-serif;color:#142a1f;padding:4px;min-width:180px;">
                <b style="color:#142a1f;font-size:13px;display:block;margin-bottom:4px;">${c.name}</b>
                <span style="font-size:11px;color:#475569;display:block;margin-bottom:6px;">${c.address}</span>
                <span style="display:inline-block;font-size:10px;font-weight:700;color:#142a1f;background:#fef08a;padding:2px 8px;border-radius:12px;border:1px solid #eab308;">
                    ✓ R2v3 Certified Depot
                </span>
            </div>
        `);
    });
}

// --- 3. SESSION MANAGEMENT & AUTH STATE ---
function checkAuthSession() {
    const session = JSON.parse(localStorage.getItem('userSession'));
    const guestActions = document.getElementById('nav-guest-actions');
    const userActions = document.getElementById('nav-user-actions');
    const logoutBtn = document.getElementById('nav-logout-btn');

    if (session && session.loggedIn) {
        if (guestActions) guestActions.style.display = 'none';
        if (userActions) userActions.style.display = 'flex';
    } else {
        if (guestActions) guestActions.style.display = 'flex';
        if (userActions) userActions.style.display = 'none';
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('userSession');
            checkAuthSession();
            showToast('Signed out of executive console.', 'info');
        });
    }
}

// --- 4. INTERACTIVE ESG CARBON CALCULATOR ---
function initEsgCalculator() {
    const sliderLaptops = document.getElementById('slider-laptops');
    const sliderPhones = document.getElementById('slider-phones');
    const sliderServers = document.getElementById('slider-servers');

    const countLaptops = document.getElementById('count-laptops-val');
    const countPhones = document.getElementById('count-phones-val');
    const countServers = document.getElementById('count-servers-val');

    const resCo2 = document.getElementById('res-co2');
    const resWeight = document.getElementById('res-weight');
    const resCash = document.getElementById('res-cash');

    if (!sliderLaptops || !sliderPhones || !sliderServers) return;

    function updateCalculations() {
        const laptops = parseInt(sliderLaptops.value);
        const phones = parseInt(sliderPhones.value);
        const servers = parseInt(sliderServers.value);

        if (countLaptops) countLaptops.textContent = `${laptops} units`;
        if (countPhones) countPhones.textContent = `${phones} units`;
        if (countServers) countServers.textContent = `${servers} units`;

        const totalCo2 = (laptops * 35) + (phones * 8) + (servers * 120);
        const totalWeight = (laptops * 2.5) + (phones * 0.2) + (servers * 15.0);
        const totalCash = (laptops * 180) + (phones * 75) + (servers * 600);

        if (resCo2) resCo2.textContent = `${totalCo2.toLocaleString()} kg`;
        if (resWeight) resWeight.textContent = `${totalWeight.toFixed(1)} kg`;
        if (resCash) resCash.textContent = `$${totalCash.toLocaleString()} USD`;
    }

    sliderLaptops.addEventListener('input', updateCalculations);
    sliderPhones.addEventListener('input', updateCalculations);
    sliderServers.addEventListener('input', updateCalculations);
    updateCalculations();
}

// --- 5. MARKETPLACE ACTIONS & MODAL ---
function initMarketplaceActions() {
    const filterBtns = document.querySelectorAll('.market-pill-btn');
    const items = document.querySelectorAll('.market-item-card');
    const openModalBtn = document.getElementById('btn-open-list-modal');
    const modal = document.getElementById('modal-new-listing');
    const closeModalBtn = document.getElementById('modal-close-btn');
    const formNewListing = document.getElementById('form-modal-new-listing');
    const cardsContainer = document.getElementById('market-cards-container');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.getAttribute('data-filter');

            items.forEach(card => {
                const category = card.getAttribute('data-category');
                if (filter === 'all' || category === filter) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });

    document.addEventListener('click', (e) => {
        if (e.target && e.target.closest('.buy-item-btn')) {
            const btn = e.target.closest('.buy-item-btn');
            const name = btn.getAttribute('data-name');
            const price = btn.getAttribute('data-price');
            showToast(`Acquisition order placed for "${name}" ($${price}). Manifest generated!`, 'success');
        }
    });

    if (openModalBtn && modal) {
        openModalBtn.addEventListener('click', () => modal.style.display = 'flex');
    }
    if (closeModalBtn && modal) {
        closeModalBtn.addEventListener('click', () => modal.style.display = 'none');
    }
    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });

    if (formNewListing) {
        formNewListing.addEventListener('submit', (e) => {
            e.preventDefault();
            const title = document.getElementById('modal-item-title').value;
            const price = document.getElementById('modal-item-price').value;
            const cat = document.getElementById('modal-item-category').value;
            const desc = document.getElementById('modal-item-desc').value;

            const newCard = document.createElement('div');
            newCard.className = 'glass-panel market-item-card';
            newCard.setAttribute('data-category', cat);
            newCard.innerHTML = `
                <div class="market-thumb">
                    <img src="laptop.jpeg" alt="${title}">
                    <span class="market-price-tag">$${price}</span>
                </div>
                <div class="market-body">
                    <h4>${title}</h4>
                    <p>${desc}</p>
                    <div class="market-meta">
                        <span><i class="fas fa-location-dot"></i> Central Depot</span>
                        <span><i class="fas fa-shield-check"></i> Verified</span>
                    </div>
                    <button class="btn btn-primary buy-item-btn" data-name="${title}" data-price="${price}" style="width: 100%;"><i class="fas fa-handshake"></i> Acquire Unit</button>
                </div>
            `;

            if (cardsContainer) cardsContainer.prepend(newCard);
            modal.style.display = 'none';
            formNewListing.reset();
            showToast(`"${title}" published to circular exchange!`, 'success');
        });
    }
}

// --- 6. COLLECTOR INTAKE ACTIONS ---
function initCollectorActions() {
    const bookBtns = document.querySelectorAll('.book-intake-btn');
    bookBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const hub = btn.getAttribute('data-hub');
            showToast(`Intake reservation confirmed for "${hub}". Dispatch team notified!`, 'success');
        });
    });
}
