/**
 * AYASC — script.js
 * Fixed: loader hides quickly, hero always visible,
 * IntersectionObserver fires correctly for all .anim elements
 */

/* ══════════════════════════
   1. PAGE LOADER
══════════════════════════ */
const loader   = document.getElementById('pageLoader');
const loaderFill = document.getElementById('loaderFill');
const loaderText = document.getElementById('loaderText');

const loaderSteps = [
  { w: '30%',  t: 'Loading assets...' },
  { w: '65%',  t: 'Building network...' },
  { w: '90%',  t: 'Almost ready...' },
  { w: '100%', t: 'Welcome.' },
];

let step = 0;
function advanceLoader() {
  if (!loaderFill) return;
  const s = loaderSteps[step];
  loaderFill.style.width = s.w;
  if (loaderText) loaderText.textContent = s.t;
  step++;
  if (step < loaderSteps.length) {
    setTimeout(advanceLoader, 320);
  } else {
    setTimeout(() => {
      if (loader) loader.classList.add('gone');
      // Start counters only after loader hides
      startCounters();
      // Trigger reveals for anything already in viewport
      triggerVisibleAnims();
    }, 400);
  }
}
// Start loader animation immediately
setTimeout(advanceLoader, 150);

/* ══════════════════════════
   2. CUSTOM CURSOR
══════════════════════════ */
const cur  = document.getElementById('cursor');
const ring = document.getElementById('cursorRing');
let mx = 0, my = 0, rx = 0, ry = 0;

if (cur && ring && window.matchMedia('(pointer:fine)').matches) {
  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    cur.style.left = mx + 'px';
    cur.style.top  = my + 'px';
  });
  (function followRing() {
    rx += (mx - rx) * 0.13;
    ry += (my - ry) * 0.13;
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    requestAnimationFrame(followRing);
  })();

  document.querySelectorAll('a,button,.net-card,.ai-card,.metric,.atype').forEach(el => {
    el.addEventListener('mouseenter', () => {
      cur.style.transform  = 'translate(-50%,-50%) scale(2.2)';
      ring.style.transform = 'translate(-50%,-50%) scale(1.5)';
      ring.style.opacity   = '.2';
    });
    el.addEventListener('mouseleave', () => {
      cur.style.transform  = 'translate(-50%,-50%) scale(1)';
      ring.style.transform = 'translate(-50%,-50%) scale(1)';
      ring.style.opacity   = '.45';
    });
  });
}

/* ══════════════════════════
   3. HERO CANVAS — particles
══════════════════════════ */
(function initHeroCanvas() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, ptcls = [];

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  class P {
    constructor() { this.reset(true); }
    reset(init) {
      this.x  = Math.random() * W;
      this.y  = init ? Math.random() * H : (Math.random() > .5 ? -5 : H + 5);
      this.r  = Math.random() * 1.4 + 0.4;
      this.vx = (Math.random() - .5) * .38;
      this.vy = (Math.random() - .5) * .38;
      this.a  = Math.random() * .45 + .1;
      this.ph = Math.random() * Math.PI * 2;
    }
    update() {
      this.x  += this.vx;
      this.y  += this.vy;
      this.ph += 0.018;
      this.a   = .15 + Math.sin(this.ph) * .12;
      if (this.x < -10 || this.x > W + 10 || this.y < -10 || this.y > H + 10) this.reset(false);
    }
    draw() {
      ctx.globalAlpha = this.a;
      ctx.fillStyle   = '#00ff9d';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function connect() {
    for (let i = 0; i < ptcls.length; i++) {
      for (let j = i + 1; j < ptcls.length; j++) {
        const dx = ptcls[i].x - ptcls[j].x;
        const dy = ptcls[i].y - ptcls[j].y;
        const d  = Math.sqrt(dx * dx + dy * dy);
        if (d < 95) {
          ctx.globalAlpha = (1 - d / 95) * .07;
          ctx.strokeStyle = '#00ff9d';
          ctx.lineWidth   = 0.5;
          ctx.beginPath();
          ctx.moveTo(ptcls[i].x, ptcls[i].y);
          ctx.lineTo(ptcls[j].x, ptcls[j].y);
          ctx.stroke();
        }
      }
    }
  }

  let hMx = 0, hMy = 0;
  document.addEventListener('mousemove', e => { hMx = e.clientX; hMy = e.clientY; });

  function init() {
    ptcls = [];
    const n = Math.min(Math.floor((W * H) / 11000), 90);
    for (let i = 0; i < n; i++) ptcls.push(new P());
  }

  function tick() {
    ctx.clearRect(0, 0, W, H);
    // BG glow
    const g1 = ctx.createRadialGradient(W * .3, H * .4, 0, W * .3, H * .4, Math.max(W,H) * .55);
    g1.addColorStop(0, 'rgba(0,255,157,.05)');
    g1.addColorStop(1, 'transparent');
    ctx.globalAlpha = 1; ctx.fillStyle = g1; ctx.fillRect(0, 0, W, H);
    // Mouse glow
    const g2 = ctx.createRadialGradient(hMx, hMy, 0, hMx, hMy, 180);
    g2.addColorStop(0, 'rgba(0,119,255,.06)');
    g2.addColorStop(1, 'transparent');
    ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H);

    ptcls.forEach(p => { p.update(); p.draw(); });
    ctx.globalAlpha = 1;
    connect();
    ctx.globalAlpha = 1;
    requestAnimationFrame(tick);
  }

  resize(); init(); tick();
  window.addEventListener('resize', () => { resize(); init(); });
})();

/* ══════════════════════════
   4. AI CANVAS — neural net
══════════════════════════ */
(function initAiCanvas() {
  const canvas = document.getElementById('aiCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, nodes = [];

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
    buildNodes();
  }

  function buildNodes() {
    nodes = [];
    const layers = [3, 5, 5, 3];
    layers.forEach((count, li) => {
      const x = (W / (layers.length + 1)) * (li + 1);
      for (let ni = 0; ni < count; ni++) {
        nodes.push({
          x, y: (H / (count + 1)) * (ni + 1),
          layer: li, total: layers.length,
          ph: Math.random() * Math.PI * 2,
          sp: .015 + Math.random() * .02
        });
      }
    });
  }

  function tick() {
    ctx.clearRect(0, 0, W, H);
    // Connections
    nodes.forEach(a => {
      nodes.forEach(b => {
        if (b.layer === a.layer + 1) {
          ctx.globalAlpha = .06 + .03 * Math.sin(a.ph);
          ctx.strokeStyle = '#0077ff';
          ctx.lineWidth   = .7;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      });
    });
    // Nodes
    nodes.forEach(n => {
      n.ph += n.sp;
      const sz = 4 + Math.sin(n.ph) * 2;
      const al = .35 + Math.sin(n.ph) * .25;
      ctx.globalAlpha = al;
      ctx.fillStyle = n.layer === 0 ? '#00ff9d' : n.layer === n.total - 1 ? '#ff6b6b' : '#0077ff';
      ctx.beginPath(); ctx.arc(n.x, n.y, sz, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
    requestAnimationFrame(tick);
  }

  resize(); tick();
  window.addEventListener('resize', resize);
})();

/* ══════════════════════════
   5. NAV — scroll + active
══════════════════════════ */
const nav      = document.getElementById('nav');
const navLinks = document.querySelectorAll('.nav-link');
const sections = [...document.querySelectorAll('section[id]')];

function updateNav() {
  const y = window.scrollY;
  if (nav) nav.classList.toggle('scrolled', y > 50);
  let cur = '';
  sections.forEach(s => { if (y >= s.offsetTop - 130) cur = s.id; });
  navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + cur));
}
window.addEventListener('scroll', updateNav, { passive: true });
updateNav();

/* ══════════════════════════
   6. HAMBURGER
══════════════════════════ */
const burger   = document.getElementById('hamburger');
const navMenu  = document.getElementById('navLinks');

if (burger && navMenu) {
  burger.addEventListener('click', () => {
    const open = navMenu.classList.toggle('open');
    const spans = burger.querySelectorAll('span');
    spans[0].style.transform = open ? 'rotate(45deg) translate(5px,5px)' : '';
    spans[1].style.opacity   = open ? '0' : '';
    spans[2].style.transform = open ? 'rotate(-45deg) translate(5px,-5px)' : '';
  });
  navMenu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      navMenu.classList.remove('open');
      burger.querySelectorAll('span').forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
    });
  });
}

/* ══════════════════════════
   7. SCROLL REVEAL — IntersectionObserver
══════════════════════════ */
const animEls = document.querySelectorAll('.anim');

const revealObs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      revealObs.unobserve(e.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

animEls.forEach(el => revealObs.observe(el));

// Also force-reveal anything already in viewport on load
function triggerVisibleAnims() {
  animEls.forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) {
      el.classList.add('visible');
    }
  });
}

/* ══════════════════════════
   8. COUNTER ANIMATION
══════════════════════════ */
function startCounters() {
  document.querySelectorAll('.counter').forEach(el => {
    const target = parseInt(el.dataset.to, 10);
    let cur = 0;
    const step = Math.max(1, Math.ceil(target / 60));
    const iv = setInterval(() => {
      cur = Math.min(cur + step, target);
      el.textContent = cur;
      if (cur >= target) clearInterval(iv);
    }, 28);
  });
}

/* ══════════════════════════
   9. PHONE BAR FILLS
══════════════════════════ */
function animBars() {
  document.querySelectorAll('.ph-fill[data-w]').forEach(el => {
    const w = el.dataset.w + '%';
    setTimeout(() => { el.style.width = w; }, 300);
  });
}

const barObs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { animBars(); barObs.disconnect(); } });
}, { threshold: 0.3 });
const phoneWrap = document.querySelector('.phone-wrap');
if (phoneWrap) barObs.observe(phoneWrap);

/* ══════════════════════════
   10. NETWORK SVG LINES
══════════════════════════ */
function drawNetLines() {
  const svg     = document.getElementById('connSvg');
  const netSec  = document.getElementById('network');
  if (!svg || !netSec) return;

  const phone = netSec.querySelector('.net-phone');
  const cards = netSec.querySelectorAll('.net-card');
  if (!phone || !cards.length) return;

  svg.innerHTML = '';
  const base = svg.parentElement.getBoundingClientRect();
  const pRect = phone.getBoundingClientRect();
  const cx = pRect.left - base.left + pRect.width / 2;
  const cy = pRect.top  - base.top  + pRect.height / 2;

  cards.forEach((card, i) => {
    const r  = card.getBoundingClientRect();
    const tx = r.left - base.left + r.width / 2;
    const ty = r.top  - base.top  + r.height / 2;
    const mx = (cx + tx) / 2;

    // Line
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const d    = `M${cx},${cy} Q${mx},${cy} ${tx},${ty}`;
    path.setAttribute('d', d);
    path.setAttribute('stroke', '#00ff9d');
    path.setAttribute('stroke-width', '1');
    path.setAttribute('fill', 'none');
    const len = 350;
    path.setAttribute('stroke-dasharray', len);
    path.setAttribute('stroke-dashoffset', len);

    const anim = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
    anim.setAttribute('attributeName', 'stroke-dashoffset');
    anim.setAttribute('from', len);
    anim.setAttribute('to', '0');
    anim.setAttribute('dur', '1.2s');
    anim.setAttribute('begin', `${i * 0.22}s`);
    anim.setAttribute('fill', 'freeze');
    path.appendChild(anim);

    // Travelling dot
    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('r', '3');
    dot.setAttribute('fill', '#00ff9d');
    dot.setAttribute('opacity', '.7');
    const mot = document.createElementNS('http://www.w3.org/2000/svg', 'animateMotion');
    mot.setAttribute('path', d);
    mot.setAttribute('dur', '2.2s');
    mot.setAttribute('repeatCount', 'indefinite');
    mot.setAttribute('begin', `${i * 0.4}s`);
    dot.appendChild(mot);

    svg.appendChild(path);
    svg.appendChild(dot);
  });
}

const netObs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { setTimeout(drawNetLines, 400); netObs.disconnect(); } });
}, { threshold: 0.3 });
const netSec = document.getElementById('network');
if (netSec) netObs.observe(netSec);
window.addEventListener('resize', () => {
  clearTimeout(window._resizeTimer);
  window._resizeTimer = setTimeout(drawNetLines, 200);
});

/* ══════════════════════════
   11. SMOOTH ANCHOR SCROLL
══════════════════════════ */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const t = document.querySelector(a.getAttribute('href'));
    if (t) {
      e.preventDefault();
      window.scrollTo({ top: t.offsetTop - 78, behavior: 'smooth' });
    }
  });
});

/* ══════════════════════════
   12. CONTACT FORM
══════════════════════════ */
const form   = document.getElementById('contactForm');
const subBtn = document.getElementById('submitBtn');
if (form && subBtn) {
  form.addEventListener('submit', e => {
    e.preventDefault();
    subBtn.textContent = 'Sending...';
    subBtn.disabled    = true;
    subBtn.style.opacity = '.65';
    setTimeout(() => {
      subBtn.textContent   = '✓ Message Sent!';
      subBtn.style.background = '#00cc7a';
      subBtn.style.opacity    = '1';
      setTimeout(() => {
        subBtn.textContent      = 'Send Message →';
        subBtn.style.background = '';
        subBtn.disabled         = false;
        form.reset();
      }, 3000);
    }, 1500);
  });
}

/* ══════════════════════════
   13. LOGO GLITCH HOVER
══════════════════════════ */
const logoLink = document.querySelector('.nav-logo-link');
if (logoLink) {
  logoLink.addEventListener('mouseenter', () => {
    const svg = logoLink.querySelector('.nav-logo-svg');
    if (svg) {
      svg.style.filter = 'drop-shadow(2px 0 #ff0066) drop-shadow(-2px 0 #00ffff) drop-shadow(0 0 10px rgba(0,255,157,.8))';
      setTimeout(() => { svg.style.filter = ''; }, 180);
    }
  });
}

/* ══════════════════════════
   14. SUBTLE HERO PARALLAX
══════════════════════════ */
let ticking = false;
window.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(() => {
      const y = window.scrollY;
      const content = document.querySelector('.hero-content');
      if (content && y < window.innerHeight) {
        // Only subtle — don't hide content
        content.style.transform = `translateY(${y * 0.18}px)`;
      }
      ticking = false;
    });
    ticking = true;
  }
}, { passive: true });

/* ══════════════════════════
   DEV LOG
══════════════════════════ */
console.log('%c AYASC ', 'background:#00ff9d;color:#050811;font-family:monospace;font-size:20px;font-weight:800;padding:4px 12px;border-radius:2px;');
console.log('%c Digital Transformation — All systems live.', 'color:#6b7280;font-family:monospace;font-size:11px;');
