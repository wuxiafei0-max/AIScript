import { generateScriptAPI } from './api.js';
import { parseAIResponse, smartFallback, emptyResult } from './parser.js';
import { analytics } from './analytics.js';

// ── GSAP Animations ────────────────────────
gsap.registerPlugin(ScrollTrigger);

const heroEls = ['#hero-badge', '#hero-headline', '#hero-sub', '#hero-cta'];
gsap.fromTo(heroEls,
  { opacity: 0, y: 40 },
  { opacity: 1, y: 0, duration: 1, stagger: 0.12, ease: 'power3.out', delay: 0.2 }
);

gsap.fromTo('#input-card',
  { opacity: 0, y: 50 },
  { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
    scrollTrigger: { trigger: '#input-card', start: 'top 85%', once: true }
  }
);

gsap.fromTo('#how-header',
  { opacity: 0, y: 30 },
  { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out',
    scrollTrigger: { trigger: '#how-header', start: 'top 80%', once: true }
  }
);

gsap.fromTo('#steps-grid .step-card',
  { opacity: 0, y: 40 },
  { opacity: 1, y: 0, duration: 0.7, stagger: 0.12, ease: 'power3.out',
    scrollTrigger: { trigger: '#steps-grid', start: 'top 80%', once: true }
  }
);

gsap.fromTo('#trust-row .trust-badge',
  { opacity: 0, scale: 0.9 },
  { opacity: 1, scale: 1, duration: 0.5, stagger: 0.08, ease: 'back.out(1.5)',
    scrollTrigger: { trigger: '#trust-row', start: 'top 85%', once: true }
  }
);

gsap.fromTo('#final-cta',
  { opacity: 0, y: 40 },
  { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
    scrollTrigger: { trigger: '#final-cta', start: 'top 80%', once: true }
  }
);

ScrollTrigger.create({
  start: 'top -60',
  onToggle: self => {
    document.getElementById('navbar').style.padding = self.isActive ? '10px 24px' : '16px 24px';
  }
});

// ── Generate handler ───────────────────────
async function handleGenerate() {
  const topic = document.getElementById('input-topic').value.trim();
  const platform = document.getElementById('input-platform').value;
  const tone = document.getElementById('input-tone').value;

  if (!topic) {
    shakeInput();
    return;
  }

  analytics.track('generate_click');

  setLoading(true);
  hideDemoOutput();

  try {
    const text = await generateScriptAPI(topic, platform, tone);
    const parsed = parseAIResponse(text) || smartFallback(text) || emptyResult();
    renderOutput(parsed);
  } catch (err) {
    console.warn('[Hookly] AI call failed, using fallback:', err.message);
    const fallback = generateFallback(topic, platform, tone);
    renderOutput(fallback);
  } finally {
    setLoading(false);
  }
}

function generateFallback(topic, platform, tone) {
  const t = topic.toLowerCase();
  const toneMap = {
    'Funny': 'Wait, nobody told me',
    'Educational': "Here's what nobody teaches you about",
    'Viral': "The truth about"
  };
  const opener = toneMap[tone] || "The truth about";

  return {
    hooks: [
      `${opener} ${t} that's changing everything...`,
      `I tried ${t} for 30 days. Here's what actually happened.`,
      `Stop doing ${t} like this. Seriously.`
    ],
    script: `[HOOK - 0:00]
${opener} ${t} nobody's talking about.

[BODY - 0:05]
Most people approach ${t} completely wrong.
They do too much, too fast — and wonder why it doesn't stick.

Here's the formula that actually works:

Step 1: Start smaller than you think. Embarrassingly small.
Step 2: Focus on consistency, not intensity.
Step 3: Track one metric. Just one.

[CLOSE - 0:45]
The goal isn't perfection. It's progress.
If you do this for 21 days, come back and tell me what changed.

Follow for more ${platform}-ready tips on ${t}.`,
    caption: `Nobody told me ${t} could be this simple 👇\n\nSave this if you're starting out — you'll thank yourself later.\n\n#${t.replace(/\s+/g,'')} #${platform.toLowerCase()} #viral #tips #howto #fyp #trending`
  };
}

function setLoading(on) {
  const btn = document.getElementById('btn-generate');
  const label = document.getElementById('btn-label');
  if (on) {
    btn.classList.add('loading');
    label.innerHTML = '<span class="loading-dots"><span></span><span></span><span></span></span> Generating...';
  } else {
    btn.classList.remove('loading');
    label.textContent = 'Generate Viral Script →';
  }
}

function hideDemoOutput() {
  const demo = document.getElementById('demo-output');
  gsap.to(demo, { opacity: 0, y: -10, duration: 0.3, onComplete: () => demo.style.display = 'none' });
}

function renderOutput(data) {
  const hooksEl = document.getElementById('hooks-content');
  hooksEl.innerHTML = data.hooks.map((h, i) => `
    <div class="hook-item">
      <div class="hook-num">${i + 1}</div>
      <div class="hook-text">${escapeHtml(h)}</div>
    </div>
  `).join('');

  document.getElementById('script-content').textContent = data.script;

  const captionRaw = data.caption || '';
  document.getElementById('caption-content').innerHTML = captionRaw
    .split('\n').map(line =>
      line.replace(/#(\w+)/g, '<span class="hashtag">#$1</span>')
    ).join('<br/>');

  const wrap = document.getElementById('output-wrap');
  wrap.classList.add('visible');
  wrap.style.display = 'block';

  const blocks = [
    document.getElementById('out-hooks'),
    document.getElementById('out-script'),
    document.getElementById('out-caption')
  ];

  blocks.forEach((block, i) => {
    setTimeout(() => {
      block.classList.add('revealed');
    }, i * 180);
  });

  setTimeout(() => {
    wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}

// ── Copy buttons ───────────────────────────
function copySection(section) {
  let text = '';
  if (section === 'hooks') {
    const items = document.querySelectorAll('#hooks-content .hook-text');
    text = Array.from(items).map((el, i) => `Hook ${i+1}: ${el.textContent}`).join('\n');
  } else if (section === 'script') {
    text = document.getElementById('script-content').textContent;
  } else if (section === 'caption') {
    text = document.getElementById('caption-content').innerText;
  }

  if (!text) return;

  navigator.clipboard.writeText(text).then(() => {
    const btnMap = { hooks: 0, script: 1, caption: 2 };
    const btns = document.querySelectorAll('.copy-btn');
    const btn = btns[btnMap[section]];
    if (btn) {
      const orig = btn.innerHTML;
      btn.classList.add('copied');
      btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20,6 9,17 4,12"/></svg> Copied!`;
      setTimeout(() => {
        btn.classList.remove('copied');
        btn.innerHTML = orig;
      }, 2000);
    }
  });
}

// ── Shake input if empty ───────────────────
function shakeInput() {
  const el = document.getElementById('input-topic');
  el.style.borderColor = '#F87171';
  el.style.boxShadow = '0 0 0 3px rgba(248,113,113,0.2)';
  gsap.fromTo(el, { x: -6 }, { x: 0, duration: 0.4, ease: 'elastic.out(1, 0.3)', clearProps: 'x' });
  gsap.to(el, { x: 6, duration: 0.08, yoyo: true, repeat: 5 });
  el.focus();
  setTimeout(() => {
    el.style.borderColor = '';
    el.style.boxShadow = '';
  }, 1500);
}

// ── Utility ────────────────────────────────
function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Enter key on topic ─────────────────────
document.getElementById('input-topic').addEventListener('keydown', e => {
  if (e.key === 'Enter') handleGenerate();
});

// ── Floating background particles ─────────
(function() {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:0;opacity:0.35;';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  let W, H, particles;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  function initParticles() {
    particles = Array.from({ length: 40 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.5 + 0.5,
      dx: (Math.random() - 0.5) * 0.3,
      dy: -(Math.random() * 0.4 + 0.1),
      alpha: Math.random() * 0.5 + 0.1,
      color: Math.random() > 0.5 ? '99,102,241' : '139,92,246'
    }));
  }
  initParticles();

  function tick() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      p.x += p.dx;
      p.y += p.dy;
      if (p.y < -4) { p.y = H + 4; p.x = Math.random() * W; }
      if (p.x < -4) p.x = W + 4;
      if (p.x > W + 4) p.x = -4;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color},${p.alpha})`;
      ctx.fill();
    });
    requestAnimationFrame(tick);
  }
  tick();
})();

// ── Expose globals for inline onclick handlers ──
window.handleGenerate = handleGenerate;
window.copySection = copySection;
