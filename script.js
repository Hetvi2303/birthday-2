// Romantic Birthday Surprise - Master UI/UX Script

// Core state variables
let currentStep = 1;
let selectedStyle = 'classic'; // 'classic' or 'cute'
let audioContext = null;
let musicPlaying = false;
let synthInterval = null;
let micStream = null;
let audioAnalyser = null;
let blowDetectionActive = false;

// Parallax & Background variables
let mouseX = 0;
let mouseY = 0;
let targetMouseX = 0;
let targetMouseY = 0;
let shootingStars = [];

// Hearts emitter variables
let heartInterval = null;

// DOM Elements
const bodyEl = document.body;
const surpriseContainer = document.getElementById('surprise-container');
const daysVal = document.getElementById('days-val');
const hoursVal = document.getElementById('hours-val');
const minsVal = document.getElementById('mins-val');
const peekBtn = document.getElementById('peek-btn');
const themeToggleBtn = document.getElementById('theme-toggle');

// Track mouse for star parallax
document.addEventListener('mousemove', (e) => {
  targetMouseX = (e.clientX - window.innerWidth / 2) * 0.08;
  targetMouseY = (e.clientY - window.innerHeight / 2) * 0.08;
});

// --- 1. Canvas Stars, Parallax & Shooting Stars Background ---
const starsCanvas = document.getElementById('stars-canvas');
const starsCtx = starsCanvas.getContext('2d');
let stars = [];

function resizeCanvas() {
  starsCanvas.width = window.innerWidth;
  starsCanvas.height = window.innerHeight;
  initStars();
}

function initStars() {
  stars = [];
  const layers = [
    { count: 40, speed: 0.1, radius: 0.6 },
    { count: 30, speed: 0.2, radius: 1.0 },
    { count: 15, speed: 0.35, radius: 1.5 }
  ];
  
  layers.forEach(layer => {
    for (let i = 0; i < layer.count; i++) {
      stars.push({
        x: Math.random() * starsCanvas.width,
        y: Math.random() * starsCanvas.height,
        radius: layer.radius + Math.random() * 0.3,
        alpha: Math.random(),
        twinkleSpeed: 0.01 + Math.random() * 0.02,
        layerSpeed: layer.speed
      });
    }
  });
}

function updateAndDrawStars() {
  starsCtx.clearRect(0, 0, starsCanvas.width, starsCanvas.height);
  
  // Interpolate mouse coordinates for fluid movement
  mouseX += (targetMouseX - mouseX) * 0.05;
  mouseY += (targetMouseY - mouseY) * 0.05;
  
  starsCtx.fillStyle = 'rgba(255, 255, 255, 1)';
  
  // Render stars with parallax offset
  stars.forEach(star => {
    star.alpha += star.twinkleSpeed;
    if (star.alpha > 1 || star.alpha < 0) {
      star.twinkleSpeed = -star.twinkleSpeed;
    }
    
    // Position offset by layer speed and mouse coordinates
    const sx = (star.x + mouseX * star.layerSpeed + starsCanvas.width) % starsCanvas.width;
    const sy = (star.y + mouseY * star.layerSpeed + starsCanvas.height) % starsCanvas.height;
    
    starsCtx.save();
    starsCtx.globalAlpha = Math.max(0.15, star.alpha);
    starsCtx.beginPath();
    starsCtx.arc(sx, sy, star.radius, 0, Math.PI * 2);
    starsCtx.fill();
    starsCtx.restore();
  });
  
  // Handle shooting stars
  if (Math.random() < 0.003 && shootingStars.length < 2) {
    shootingStars.push({
      x: Math.random() * starsCanvas.width * 0.6,
      y: 0,
      length: 80 + Math.random() * 70,
      speed: 12 + Math.random() * 8,
      angle: Math.PI / 6 + Math.random() * (Math.PI / 12), // fall at ~30 deg
      opacity: 1
    });
  }
  
  shootingStars.forEach((star, index) => {
    const dx = Math.cos(star.angle) * star.speed;
    const dy = Math.sin(star.angle) * star.speed;
    
    // Draw fading trail
    const grad = starsCtx.createLinearGradient(star.x, star.y, star.x - dx * 2, star.y - dy * 2);
    grad.addColorStop(0, `rgba(255, 255, 255, ${star.opacity})`);
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    starsCtx.strokeStyle = grad;
    starsCtx.lineWidth = 1.5;
    starsCtx.lineCap = 'round';
    starsCtx.beginPath();
    starsCtx.moveTo(star.x, star.y);
    starsCtx.lineTo(star.x - Math.cos(star.angle) * star.length, star.y - Math.sin(star.angle) * star.length);
    starsCtx.stroke();
    
    // Advance physics
    star.x += dx;
    star.y += dy;
    star.opacity -= 0.015;
    
    if (star.opacity <= 0 || star.x > starsCanvas.width || star.y > starsCanvas.height) {
      shootingStars.splice(index, 1);
    }
  });
  
  requestAnimationFrame(updateAndDrawStars);
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();
updateAndDrawStars();

// --- 2. Canvas Confetti Particle Physics ---
const confettiCanvas = document.getElementById('confetti-canvas');
const confettiCtx = confettiCanvas.getContext('2d');
let confettiParticles = [];

function resizeConfetti() {
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeConfetti);
resizeConfetti();

function createConfetti() {
  confettiParticles = [];
  const colors = selectedStyle === 'classic' 
    ? ['#ffd700', '#ec4899', '#8b5cf6', '#a78bfa', '#e0f2fe', '#fff'] 
    : ['#ff758c', '#ff7eb3', '#ffaec1', '#fff0f3', '#ffd15c', '#3ade86'];
    
  for (let i = 0; i < 150; i++) {
    confettiParticles.push({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2 - 40,
      vx: (Math.random() - 0.5) * 14,
      vy: (Math.random() - 0.85) * 16,
      radius: 4 + Math.random() * 7,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 8,
      opacity: 1,
      gravity: 0.2,
      drag: 0.98,
      shape: Math.random() > 0.4 ? 'circle' : 'rect'
    });
  }
  animateConfetti();
}

function animateConfetti() {
  if (confettiParticles.length === 0) return;
  confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  
  let active = false;
  confettiParticles.forEach(p => {
    if (p.opacity > 0) {
      p.vx *= p.drag;
      p.vy *= p.drag;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.opacity -= 0.008;
      p.rotation += p.rotationSpeed;
      
      confettiCtx.save();
      confettiCtx.globalAlpha = Math.max(0, p.opacity);
      confettiCtx.fillStyle = p.color;
      confettiCtx.translate(p.x, p.y);
      confettiCtx.rotate((p.rotation * Math.PI) / 180);
      
      if (p.shape === 'circle') {
        confettiCtx.beginPath();
        confettiCtx.arc(0, 0, p.radius, 0, Math.PI * 2);
        confettiCtx.fill();
      } else {
        confettiCtx.fillRect(-p.radius, -p.radius * 0.6, p.radius * 2, p.radius * 1.2);
      }
      confettiCtx.restore();
      
      active = true;
    }
  });
  
  if (active) {
    requestAnimationFrame(animateConfetti);
  } else {
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  }
}

// --- 3. SVGs & Interactive Master Bunny SVG template ---
const bunnySVG = `
<svg viewBox="0 0 160 160" width="100%" height="100%" class="bunny-couple-svg">
  <!-- Bunny Left -->
  <g class="bunny-left master-bunny" transform="translate(10, 15)">
    <ellipse cx="50" cy="90" rx="25" ry="30" fill="#ffffff" stroke="#f0f0f0" stroke-width="1.5" class="bunny-body" />
    
    <!-- Ears -->
    <g class="ear ear-left-twitch">
      <ellipse cx="40" cy="45" rx="8" ry="22" fill="#ffffff" stroke="#f0f0f0" stroke-width="1.5" transform="rotate(-10, 40, 45)" />
      <ellipse cx="40" cy="47" rx="4" ry="16" fill="#ffd0e0" transform="rotate(-10, 40, 47)" />
    </g>
    <g class="ear ear-right-twitch">
      <ellipse cx="58" cy="43" rx="8" ry="22" fill="#ffffff" stroke="#f0f0f0" stroke-width="1.5" transform="rotate(5, 58, 43)" />
      <ellipse cx="58" cy="45" rx="4" ry="16" fill="#ffd0e0" transform="rotate(5, 58, 45)" />
    </g>
    
    <!-- Cheeks & Eyes -->
    <circle cx="42" cy="78" r="3.5" fill="#ffd0e0" class="blush" />
    <circle cx="58" cy="78" r="3.5" fill="#ffd0e0" class="blush" />
    
    <!-- Blinking Eyes -->
    <ellipse cx="45" cy="74" rx="2" ry="2" fill="#333333" class="bunny-eye" />
    <ellipse cx="55" cy="74" rx="2" ry="2" fill="#333333" class="bunny-eye" />
    
    <!-- Nose -->
    <polygon points="50,77 48,75 52,75" fill="#ff7da7" />
  </g>
  
  <!-- Bunny Right -->
  <g class="bunny-right master-bunny" transform="translate(45, 15)">
    <ellipse cx="60" cy="90" rx="25" ry="30" fill="#fcf8f5" stroke="#ece5e0" stroke-width="1.5" class="bunny-body" />
    
    <!-- Ears -->
    <g class="ear ear-left-twitch">
      <ellipse cx="52" cy="43" rx="8" ry="22" fill="#fcf8f5" stroke="#ece5e0" stroke-width="1.5" transform="rotate(-5, 52, 43)" />
      <ellipse cx="52" cy="45" rx="4" ry="16" fill="#ffd0e0" transform="rotate(-5, 52, 45)" />
    </g>
    <g class="ear ear-right-twitch">
      <ellipse cx="70" cy="45" rx="8" ry="22" fill="#fcf8f5" stroke="#ece5e0" stroke-width="1.5" transform="rotate(10, 70, 45)" />
      <ellipse cx="70" cy="47" rx="4" ry="16" fill="#ffd0e0" transform="rotate(10, 70, 47)" />
    </g>
    
    <!-- Cheeks & Eyes -->
    <circle cx="52" cy="78" r="3.5" fill="#ffd0e0" class="blush" />
    <circle cx="68" cy="78" r="3.5" fill="#ffd0e0" class="blush" />
    
    <!-- Blinking Eyes -->
    <ellipse cx="55" cy="74" rx="2" ry="2" fill="#333333" class="bunny-eye" />
    <ellipse cx="65" cy="74" rx="2" ry="2" fill="#333333" class="bunny-eye" />
    
    <!-- Nose -->
    <polygon points="60,77 58,75 62,75" fill="#ff7da7" />
  </g>

  <!-- Pulsing Red Heart -->
  <path d="M 80,105 C 70,85 45,90 60,115 L 80,135 L 100,115 C 115,90 90,85 80,105 Z" fill="#ff3366" class="heart-pulse-master" />
</svg>
`;

// Inject Master Bunny SVGs
document.getElementById('bunny-svg-2').innerHTML = bunnySVG;
document.getElementById('bunny-svg-3').innerHTML = bunnySVG;
document.getElementById('bunny-svg-4').innerHTML = bunnySVG;
document.getElementById('bunny-svg-5').innerHTML = bunnySVG;

// Cake SVGs (Classic Galaxy vs Cute Strawberry Pink) with Knife & Slicing Clip-Paths
const classicCakeSVG = `
<svg viewBox="0 0 200 200" width="100%" height="100%" id="cake-svg" class="hover-float-cake">
  <defs>
    <linearGradient id="galaxyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e1b4b" />
      <stop offset="50%" stop-color="#311042" />
      <stop offset="100%" stop-color="#0f0728" />
    </linearGradient>
    <linearGradient id="galaxyTopGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2d1b4e" />
      <stop offset="100%" stop-color="#12072b" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>
    <linearGradient id="metalGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#e2e8f0" />
      <stop offset="50%" stop-color="#94a3b8" />
      <stop offset="100%" stop-color="#cbd5e1" />
    </linearGradient>
    
    <!-- Clip Paths for cutting cake -->
    <clipPath id="main-cake-clip">
      <path d="M 0,0 L 200,0 L 200,200 L 0,200 Z M 100,75 L 100,180 L 170,145 L 150,60 Z" clip-rule="evenodd" />
    </clipPath>
    <clipPath id="slice-clip">
      <polygon points="100,75 100,180 170,145 150,60" />
    </clipPath>
  </defs>

  <!-- Dotted gold ring & stand plate -->
  <circle cx="100" cy="110" r="75" fill="none" stroke="url(#goldGrad)" stroke-width="1.5" stroke-dasharray="8 6" opacity="0.6" />
  <ellipse cx="100" cy="165" rx="70" ry="12" fill="#2c2842" stroke="#d97706" stroke-width="2" />
  <path d="M 50,165 L 50,175 Q 100,185 150,175 L 150,165 Z" fill="#1b172e" />

  <!-- Cut walls (inside the gap, visible only when slice pulls away) -->
  <g class="cut-interior-walls">
    <!-- Center Cut Wall (Left wall of the gap) -->
    <polygon points="100,75 105,80 105,165 100,165" fill="#f59e0b" opacity="0.5" />
    <!-- Top tier interior -->
    <path d="M 100,75 L 100,110 L 104,111 L 104,77 Z" fill="#2d1b4e" />
    <path d="M 100,90 L 100,93 L 104,94 L 104,91 Z" fill="#ffd700" /> <!-- Gold filling stripe -->
    <!-- Bottom tier interior -->
    <path d="M 100,110 L 100,150 L 104,152 L 104,112 Z" fill="#1e1b4b" />
    <path d="M 100,128 L 100,133 L 104,134 L 104,129 Z" fill="#ec4899" /> <!-- Pink cream filling stripe -->

    <!-- Diagonal Cut Wall (Right wall of the gap, facing left) -->
    <!-- Top tier diagonal interior -->
    <polygon points="100,75 100,110 135,115 135,80" fill="#1b172e" />
    <polygon points="100,90 100,93 135,95 135,92" fill="#ffd700" />
    <!-- Bottom tier diagonal interior -->
    <polygon points="100,110 100,150 150,150 150,120" fill="#0f0728" />
    <polygon points="100,128 100,133 150,133 150,128" fill="#ec4899" />
  </g>

  <!-- MAIN CAKE (Clipped to exclude slice) -->
  <g id="main-cake-group" clip-path="url(#main-cake-clip)">
    <!-- Bottom Tier -->
    <path d="M 45,110 L 45,150 Q 100,165 155,150 L 155,110 Z" fill="url(#galaxyGrad)" />
    <ellipse cx="100" cy="110" rx="55" ry="12" fill="#1d1645" />
    <path d="M 45,110 Q 55,125 65,110 Q 75,130 85,110 Q 100,132 115,110 Q 130,126 140,110 Q 150,120 155,110 Q 155,115 155,115 Q 100,128 45,115 Z" fill="#d97706" opacity="0.9" />
    
    <!-- Top Tier -->
    <path d="M 60,75 L 60,110 Q 100,120 140,110 L 140,75 Z" fill="url(#galaxyTopGrad)" />
    <ellipse cx="100" cy="75" rx="40" ry="10" fill="#291e52" />
    
    <!-- Decorative Toppings -->
    <g class="cake-topping" style="transform-origin: 75px 135px;">
      <circle cx="75" cy="135" r="3" fill="#ffd700" />
    </g>
    <g class="cake-topping" style="transform-origin: 125px 130px;">
      <circle cx="125" cy="130" r="3.5" fill="#ffd700" />
    </g>
    <g class="cake-topping" style="transform-origin: 110px 142px;">
      <circle cx="110" cy="142" r="2.5" fill="#fff" />
    </g>
    <g class="cake-topping" style="transform-origin: 90px 95px;">
      <circle cx="90" cy="95" r="2.5" fill="#fff" />
    </g>
  </g>
  
  <!-- CAKE SLICE (Clipped to include slice, moves on cut) -->
  <g id="cake-slice-group" class="cake-slice-group" clip-path="url(#slice-clip)">
    <!-- Bottom Tier -->
    <path d="M 45,110 L 45,150 Q 100,165 155,150 L 155,110 Z" fill="url(#galaxyGrad)" />
    <ellipse cx="100" cy="110" rx="55" ry="12" fill="#1d1645" />
    <path d="M 45,110 Q 55,125 65,110 Q 75,130 85,110 Q 100,132 115,110 Q 130,126 140,110 Q 150,120 155,110 Q 155,115 155,115 Q 100,128 45,115 Z" fill="#d97706" opacity="0.9" />
    
    <!-- Top Tier -->
    <path d="M 60,75 L 60,110 Q 100,120 140,110 L 140,75 Z" fill="url(#galaxyTopGrad)" />
    <ellipse cx="100" cy="75" rx="40" ry="10" fill="#291e52" />
    
    <!-- Toppings on slice -->
    <g class="cake-topping" style="transform-origin: 125px 130px;">
      <circle cx="125" cy="130" r="3.5" fill="#ffd700" />
    </g>
    <g class="cake-topping" style="transform-origin: 110px 142px;">
      <circle cx="110" cy="142" r="2.5" fill="#fff" />
    </g>

    <!-- Cut walls of the slice itself (moves with the slice) -->
    <polygon points="100,75 99,80 99,165 100,165" fill="#f59e0b" opacity="0.5" />
    <path d="M 100,75 L 100,110 L 99,111 L 99,77 Z" fill="#2d1b4e" />
    <path d="M 100,90 L 100,93 L 99,94 L 99,91 Z" fill="#ffd700" />
    <path d="M 100,110 L 100,150 L 99,152 L 99,112 Z" fill="#1e1b4b" />
    <path d="M 100,128 L 100,133 L 99,134 L 99,129 Z" fill="#ec4899" />
  </g>
  
  <!-- CANDLES (1-4 remain static, 5 moves with slice) -->
  <g class="candles-static-group">
    <!-- Candle 1 -->
    <g class="candle-body-group" id="candle-1-group" style="transform-origin: 77px 69px;">
      <rect x="75" y="45" width="4" height="24" fill="#a78bfa" rx="1" />
      <path id="flame-1" class="candle-flame hidden" d="M 77,33 Q 80,42 77,45 Q 74,42 77,33 Z" fill="#f59e0b" />
    </g>
    <!-- Candle 2 -->
    <g class="candle-body-group" id="candle-2-group" style="transform-origin: 89px 67px;">
      <rect x="87" y="42" width="4" height="25" fill="#60a5fa" rx="1" />
      <path id="flame-2" class="candle-flame hidden" d="M 89,30 Q 92,39 89,42 Q 86,39 89,30 Z" fill="#f59e0b" />
    </g>
    <!-- Candle 3 -->
    <g class="candle-body-group" id="candle-3-group" style="transform-origin: 100px 66px;">
      <rect x="98" y="40" width="4" height="26" fill="#f472b6" rx="1" />
      <path id="flame-3" class="candle-flame hidden" d="M 100,27 Q 103,37 100,40 Q 97,37 100,27 Z" fill="#f59e0b" />
    </g>
    <!-- Candle 4 -->
    <g class="candle-body-group" id="candle-4-group" style="transform-origin: 111px 67px;">
      <rect x="109" y="42" width="4" height="25" fill="#34d399" rx="1" />
      <path id="flame-4" class="candle-flame hidden" d="M 111,30 Q 114,39 111,42 Q 108,39 111,30 Z" fill="#f59e0b" />
    </g>
  </g>
  
  <!-- Candle 5 (placed in slice group wrapper) -->
  <g class="cake-slice-group">
    <g class="candle-body-group" id="candle-5-group" style="transform-origin: 123px 69px;">
      <rect x="121" y="45" width="4" height="24" fill="#fb7185" rx="1" />
      <path id="flame-5" class="candle-flame hidden" d="M 123,33 Q 126,42 123,45 Q 120,42 123,33 Z" fill="#f59e0b" />
    </g>
  </g>

  <!-- Interactive Slicing Knife -->
  <g id="cake-knife" class="cake-knife">
    <path d="M 97,-25 L 103,-25 L 103,20 Q 100,28 97,20 Z" fill="url(#metalGrad)" stroke="#94a3b8" stroke-width="0.5" />
    <path d="M 97,-25 L 99,-25 L 99,20 Z" fill="#ffffff" opacity="0.4" />
    <rect x="98.5" y="-55" width="3" height="30" fill="#78350f" rx="1" />
    <circle cx="100" cy="-45" r="0.6" fill="#cbd5e1" />
    <circle cx="100" cy="-35" r="0.6" fill="#cbd5e1" />
  </g>
</svg>
`;

const cuteCakeSVG = `
<svg viewBox="0 0 200 200" width="100%" height="100%" id="cake-svg" class="hover-float-cake">
  <defs>
    <linearGradient id="pinkCakeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ff7da7" />
      <stop offset="100%" stop-color="#ffaec1" />
    </linearGradient>
    <linearGradient id="pinkCakeTopGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffeef2" />
      <stop offset="100%" stop-color="#ffdbe3" />
    </linearGradient>
    <linearGradient id="metalGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#e2e8f0" />
      <stop offset="50%" stop-color="#94a3b8" />
      <stop offset="100%" stop-color="#cbd5e1" />
    </linearGradient>
    
    <!-- Clip Paths for cutting cake -->
    <clipPath id="main-cake-clip">
      <path d="M 0,0 L 200,0 L 200,200 L 0,200 Z M 100,75 L 100,180 L 170,145 L 150,60 Z" clip-rule="evenodd" />
    </clipPath>
    <clipPath id="slice-clip">
      <polygon points="100,75 100,180 170,145 150,60" />
    </clipPath>
  </defs>

  <!-- Plate stand -->
  <ellipse cx="100" cy="165" rx="70" ry="12" fill="#ffdbe3" stroke="#ff7fa4" stroke-width="2" />

  <!-- Cut walls (inside the gap, visible only when slice pulls away) -->
  <g class="cut-interior-walls">
    <!-- Center Cut Wall (Left wall of the gap) -->
    <polygon points="100,75 103,78 103,165 100,165" fill="#ff7fa4" opacity="0.4" />
    <!-- Top tier interior -->
    <path d="M 100,75 L 100,110 L 103,111 L 103,77 Z" fill="#ffeef2" />
    <path d="M 100,90 L 100,93 L 103,94 L 103,91 Z" fill="#ff4365" /> <!-- Strawberry jam layer -->
    <!-- Bottom tier interior -->
    <path d="M 100,110 L 100,150 L 103,152 L 103,112 Z" fill="#ffdbe3" />
    <path d="M 100,128 L 100,133 L 103,134 L 103,129 Z" fill="#ff4365" />

    <!-- Diagonal Cut Wall -->
    <!-- Top tier diagonal interior -->
    <polygon points="100,75 100,110 135,115 135,80" fill="#fff0f3" />
    <polygon points="100,90 100,93 135,95 135,92" fill="#ff4365" />
    <!-- Bottom tier diagonal interior -->
    <polygon points="100,110 100,150 150,150 150,120" fill="#ffaec1" />
    <polygon points="100,128 100,133 150,133 150,128" fill="#ff4365" />
  </g>

  <!-- MAIN CAKE (Clipped to exclude slice) -->
  <g id="main-cake-group" clip-path="url(#main-cake-clip)">
    <!-- Bottom Tier -->
    <path d="M 45,110 L 45,150 Q 100,165 155,150 L 155,110 Z" fill="url(#pinkCakeGrad)" />
    <ellipse cx="100" cy="110" rx="55" ry="12" fill="#ffaec1" />
    <path d="M 45,110 Q 55,123 65,110 Q 75,126 85,110 Q 100,128 115,110 Q 130,123 140,110 Q 150,118 155,110 Q 155,115 155,115 Q 100,126 45,115 Z" fill="#ffffff" opacity="0.95" />
    
    <!-- Top Tier -->
    <path d="M 60,75 L 60,110 Q 100,120 140,110 L 140,75 Z" fill="url(#pinkCakeTopGrad)" />
    <ellipse cx="100" cy="75" rx="40" ry="10" fill="#fff0f3" />
    
    <!-- Cherries toppings -->
    <g class="cake-topping" style="transform-origin: 100px 73px;">
      <circle cx="100" cy="73" r="6" fill="#ff4365" />
      <path d="M 98,67 Q 100,60 102,67 Z" fill="#2d963f" />
    </g>
    <g class="cake-topping" style="transform-origin: 75px 75px;">
      <circle cx="75" cy="75" r="5" fill="#ff4365" />
      <path d="M 74,70 Q 76,64 78,70 Z" fill="#2d963f" />
    </g>
    <g class="cake-topping" style="transform-origin: 125px 75px;">
      <circle cx="125" cy="75" r="5" fill="#ff4365" />
      <path d="M 124,70 Q 126,64 128,70 Z" fill="#2d963f" />
    </g>
  </g>
  
  <!-- CAKE SLICE (Clipped to include slice, moves on cut) -->
  <g id="cake-slice-group" class="cake-slice-group" clip-path="url(#slice-clip)">
    <!-- Bottom Tier -->
    <path d="M 45,110 L 45,150 Q 100,165 155,150 L 155,110 Z" fill="url(#pinkCakeGrad)" />
    <ellipse cx="100" cy="110" rx="55" ry="12" fill="#ffaec1" />
    <path d="M 45,110 Q 55,123 65,110 Q 75,126 85,110 Q 100,128 115,110 Q 130,123 140,110 Q 150,118 155,110 Q 155,115 155,115 Q 100,126 45,115 Z" fill="#ffffff" opacity="0.95" />
    
    <!-- Top Tier -->
    <path d="M 60,75 L 60,110 Q 100,120 140,110 L 140,75 Z" fill="url(#pinkCakeTopGrad)" />
    <ellipse cx="100" cy="75" rx="40" ry="10" fill="#fff0f3" />
    
    <!-- Toppings on slice -->
    <g class="cake-topping" style="transform-origin: 125px 75px;">
      <circle cx="125" cy="75" r="5" fill="#ff4365" />
      <path d="M 124,70 Q 126,64 128,70 Z" fill="#2d963f" />
    </g>

    <!-- Slice internal cut wall (moves with slice) -->
    <polygon points="100,75 99,78 99,165 100,165" fill="#ff7fa4" opacity="0.4" />
    <path d="M 100,75 L 100,110 L 99,111 L 99,77 Z" fill="#ffeef2" />
    <path d="M 100,90 L 100,93 L 99,94 L 99,91 Z" fill="#ff4365" />
    <path d="M 100,110 L 100,150 L 99,152 L 99,112 Z" fill="#ffdbe3" />
    <path d="M 100,128 L 100,133 L 99,134 L 99,129 Z" fill="#ff4365" />
  </g>
  
  <!-- CANDLES (1-4 static, 5 moves with slice) -->
  <g class="candles-static-group">
    <!-- Candle 1 -->
    <g class="candle-body-group" id="candle-1-group" style="transform-origin: 77px 69px;">
      <rect x="75" y="45" width="4" height="24" fill="#ff9ebb" rx="1" />
      <path id="flame-1" class="candle-flame hidden" d="M 77,33 Q 80,42 77,45 Q 74,42 77,33 Z" fill="#ff5376" />
    </g>
    <!-- Candle 2 -->
    <g class="candle-body-group" id="candle-2-group" style="transform-origin: 89px 67px;">
      <rect x="87" y="42" width="4" height="25" fill="#ffd15c" rx="1" />
      <path id="flame-2" class="candle-flame hidden" d="M 89,30 Q 92,39 89,42 Q 86,39 89,30 Z" fill="#ff5376" />
    </g>
    <!-- Candle 3 -->
    <g class="candle-body-group" id="candle-3-group" style="transform-origin: 100px 66px;">
      <rect x="98" y="40" width="4" height="26" fill="#7bf0ff" rx="1" />
      <path id="flame-3" class="candle-flame hidden" d="M 100,27 Q 103,37 100,40 Q 97,37 100,27 Z" fill="#ff5376" />
    </g>
    <!-- Candle 4 -->
    <g class="candle-body-group" id="candle-4-group" style="transform-origin: 111px 67px;">
      <rect x="109" y="42" width="4" height="25" fill="#ffd15c" rx="1" />
      <path id="flame-4" class="candle-flame hidden" d="M 111,30 Q 114,39 111,42 Q 108,39 111,30 Z" fill="#ff5376" />
    </g>
  </g>
  
  <!-- Candle 5 (moves with slice) -->
  <g class="cake-slice-group">
    <g class="candle-body-group" id="candle-5-group" style="transform-origin: 123px 69px;">
      <rect x="121" y="45" width="4" height="24" fill="#ff9ebb" rx="1" />
      <path id="flame-5" class="candle-flame hidden" d="M 123,33 Q 126,42 123,45 Q 120,42 123,33 Z" fill="#ff5376" />
    </g>
  </g>

  <!-- Knife overlay -->
  <g id="cake-knife" class="cake-knife">
    <path d="M 97,-25 L 103,-25 L 103,20 Q 100,28 97,20 Z" fill="url(#metalGrad)" stroke="#94a3b8" stroke-width="0.5" />
    <path d="M 97,-25 L 99,-25 L 99,20 Z" fill="#ffffff" opacity="0.4" />
    <rect x="98.5" y="-55" width="3" height="30" fill="#78350f" rx="1" />
    <circle cx="100" cy="-45" r="0.6" fill="#cbd5e1" />
    <circle cx="100" cy="-35" r="0.6" fill="#cbd5e1" />
  </g>
</svg>
`;

let cakeState = {
  decorated: false,
  lit: false,
  blown: false,
  sliced: false
};

const cakeWrapper = document.getElementById('cake-wrapper');
function updateCakeSVG() {
  if (!cakeWrapper) return;
  cakeWrapper.innerHTML = selectedStyle === 'classic' ? classicCakeSVG : cuteCakeSVG;
  
  // Restore visual state
  if (cakeState.decorated) {
    document.querySelectorAll('.cake-topping').forEach(t => t.classList.add('visible'));
    document.querySelectorAll('.candle-body-group').forEach(c => c.classList.add('visible'));
  }
  if (cakeState.lit && !cakeState.blown) {
    document.querySelectorAll('.candle-flame').forEach(f => f.classList.remove('hidden'));
  }
  if (cakeState.blown) {
    document.querySelectorAll('.candle-flame').forEach(f => {
      f.classList.remove('lit');
      f.classList.add('hidden');
    });
  }
  if (cakeState.sliced) {
    const cakeSvg = document.getElementById('cake-svg');
    if (cakeSvg) {
      cakeSvg.classList.add('sliced');
    }
  }
}
updateCakeSVG();

// --- 4. Countdown Ticking Engine ---
function updateCountdown() {
  if (!daysVal) return;
  let days = parseInt(daysVal.innerText);
  let hours = parseInt(hoursVal.innerText);
  let mins = parseInt(minsVal.innerText);
  
  if (mins > 0) {
    mins--;
  } else {
    mins = 59;
    if (hours > 0) {
      hours--;
    } else {
      hours = 23;
      if (days > 0) {
        days--;
      }
    }
  }
  
  daysVal.innerText = String(days).padStart(2, '0');
  hoursVal.innerText = String(hours).padStart(2, '0');
  minsVal.innerText = String(mins).padStart(2, '0');
}
setInterval(updateCountdown, 60000);

peekBtn.addEventListener('click', () => {
  playChime();
  transitionToStep(2);
});

// --- 5. Fluid Steps Navigation with Page Animations ---
function transitionToStep(stepNum) {
  const currentStepEl = document.getElementById(`step-${currentStep}`);
  const nextStepEl = document.getElementById(`step-${stepNum}`);
  
  if (currentStepEl && nextStepEl) {
    // Add sliding scale animation styles dynamically
    currentStepEl.style.transform = 'scale(0.95) translateY(-20px)';
    currentStepEl.style.opacity = '0';
    
    setTimeout(() => {
      currentStepEl.classList.remove('active');
      
      // Setup entrance state of next slide
      nextStepEl.style.transform = 'scale(1.05) translateY(20px)';
      nextStepEl.classList.add('active');
      
      // Request repaint to trigger smooth transition
      nextStepEl.offsetWidth; 
      
      nextStepEl.style.transform = 'scale(1) translateY(0)';
      currentStep = stepNum;
      
      // Custom hooks on entering steps
      if (stepNum === 9) {
        startHeartsEmitter();
      } else {
        stopHeartsEmitter();
      }
    }, 250);
  }
}

document.querySelectorAll('.next-step-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    playChime();
    const nextVal = parseInt(btn.getAttribute('data-next'));
    
    if (btn.id === 'btn-turn-lights') {
      surpriseContainer.style.background = selectedStyle === 'classic' 
        ? 'radial-gradient(circle at top, #20134e 0%, #06040d 100%)'
        : 'radial-gradient(circle at top, #36173a 0%, #0a040b 100%)';
    }
    
    transitionToStep(nextVal);
  });
});

function resetSurpriseFlow() {
  const envelope = document.getElementById('heart-envelope');
  if (envelope) envelope.classList.remove('open');
  
  const promptEl = document.getElementById('envelope-prompt');
  if (promptEl) promptEl.style.opacity = '1';
  
  const titleEl = document.getElementById('envelope-main-title');
  if (titleEl) titleEl.innerText = "A Message From My Heart";
  
  const letterModal = document.getElementById('letter-modal');
  if (letterModal) {
    letterModal.classList.remove('active');
  }
  clearTypewriter();
  
  stopSynthesizer();
  stopHeartsEmitter();
  
  // Reset balloons
  poppedBalloonsCount = 0;
  document.querySelectorAll('.balloon').forEach(b => {
    b.classList.remove('popped');
    b.style.display = 'block';
  });
  
  document.querySelectorAll('.popped-word').forEach(w => {
    w.classList.remove('show');
  });
  
  const goCakeBtn = document.getElementById('go-to-cake-btn');
  if (goCakeBtn) goCakeBtn.classList.remove('show');
  
  const cakeBtn = document.getElementById('cake-action-btn');
  if (cakeBtn) {
    cakeBtn.innerText = "DECORATE THE CAKE";
    cakeBtn.className = "btn-primary";
    cakeBtn.style.opacity = '1';
    cakeBtn.style.pointerEvents = 'auto';
    cakeBtn.disabled = false;
    // Bind back to starting decorate callback
    cakeBtn.onclick = null; 
  }
  
  stopMicStream();
  
  // Reset cake state
  cakeState = {
    decorated: false,
    lit: false,
    blown: false,
    sliced: false
  };
  updateCakeSVG();
}

// --- 6. Autoplay Music & Balloon Popping Engine ---
let poppedBalloonsCount = 0;

function playPopSound() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  const now = audioContext.currentTime;
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(450, now);
  osc.frequency.exponentialRampToValueAtTime(10, now + 0.1);
  
  gain.gain.setValueAtTime(0.25, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
  
  osc.connect(gain);
  gain.connect(audioContext.destination);
  osc.start();
  osc.stop(now + 0.1);
}

function createSparkExplosion(x, y) {
  const container = document.getElementById('step-7');
  const colors = selectedStyle === 'classic' 
    ? ['#ffd700', '#ec4899', '#8b5cf6', '#00f0ff', '#fff'] 
    : ['#ff758c', '#ff7eb3', '#ffaec1', '#fff', '#ffd15c'];
  
  for (let i = 0; i < 16; i++) {
    const spark = document.createElement('div');
    spark.className = 'pop-spark';
    spark.style.left = `${x}px`;
    spark.style.top = `${y}px`;
    spark.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    
    // Physics trajectories (outward velocity & angle)
    const angle = Math.random() * Math.PI * 2;
    const distance = 40 + Math.random() * 60;
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance;
    
    spark.style.setProperty('--tx', `${tx}px`);
    spark.style.setProperty('--ty', `${ty}px`);
    
    container.appendChild(spark);
    
    setTimeout(() => {
      spark.remove();
    }, 600);
  }
}

function initBalloons() {
  document.querySelectorAll('.balloon').forEach(balloon => {
    balloon.addEventListener('click', (e) => {
      if (balloon.classList.contains('popped')) return;
      
      balloon.classList.add('popped');
      poppedBalloonsCount++;
      
      playPopSound();
      
      // Calculate coordinates relative to step container
      const rect = balloon.getBoundingClientRect();
      const parentRect = balloon.parentElement.getBoundingClientRect();
      const x = rect.left + rect.width / 2 - parentRect.left + balloon.parentElement.offsetLeft;
      const y = rect.top + rect.height / 2 - parentRect.top + balloon.parentElement.offsetTop;
      
      createSparkExplosion(x, y);
      
      // Reveal single word with delay
      const wordId = balloon.getAttribute('data-word');
      const wordEl = document.getElementById(`word-${wordId}`);
      if (wordEl) {
        setTimeout(() => {
          wordEl.classList.add('show');
        }, 150);
      }
      
      // Show progress button once all 4 popped
      if (poppedBalloonsCount === 4) {
        setTimeout(() => {
          const goCakeBtn = document.getElementById('go-to-cake-btn');
          if (goCakeBtn) goCakeBtn.classList.add('show');
        }, 800);
      }
    });
  });
}
initBalloons();

function startAutoplayMusic() {
  if (audioContext && musicPlaying) return;
  
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  
  startSynthesizer();
}

// Global click to initiate audio context
document.addEventListener('click', startAutoplayMusic, { once: true });
document.addEventListener('touchstart', startAutoplayMusic, { once: true });

function startSynthesizer() {
  if (musicPlaying) return;
  musicPlaying = true;
  
  const birthdayMelody = [
    ['C4', 300], ['C4', 150], ['D4', 450], ['C4', 450], ['F4', 450], ['E4', 900],
    ['C4', 300], ['C4', 150], ['D4', 450], ['C4', 450], ['G4', 450], ['F4', 900],
    ['C4', 300], ['C4', 150], ['C5', 450], ['A4', 450], ['F4', 450], ['E4', 450], ['D4', 450],
    ['Bb4', 300], ['Bb4', 150], ['A4', 450], ['F4', 450], ['G4', 450], ['F4', 900]
  ];
  
  const noteFreqs = {
    'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23,
    'G4': 392.00, 'A4': 440.00, 'Bb4': 466.16, 'C5': 523.25
  };
  
  let index = 0;
  
  function playNextNote() {
    if (!musicPlaying) return;
    
    const [note, duration] = birthdayMelody[index];
    playSynthTone(noteFreqs[note], duration / 1000);
    
    index = (index + 1) % birthdayMelody.length;
    synthInterval = setTimeout(playNextNote, duration + 100);
  }
  
  playNextNote();
}

function playSynthTone(freq, duration) {
  if (!audioContext) return;
  
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  
  // Custom synth timbre depending on visual style
  osc.type = selectedStyle === 'classic' ? 'triangle' : 'sine';
  osc.frequency.setValueAtTime(freq, audioContext.currentTime);
  
  gain.gain.setValueAtTime(0.06, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration - 0.05);
  
  osc.connect(gain);
  gain.connect(audioContext.destination);
  
  osc.start();
  osc.stop(audioContext.currentTime + duration);
}

function stopSynthesizer() {
  musicPlaying = false;
  if (synthInterval) {
    clearTimeout(synthInterval);
  }
}

function playChime() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  const now = audioContext.currentTime;
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(523.25, now);
  osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.15);
  
  gain.gain.setValueAtTime(0.06, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
  
  osc.connect(gain);
  gain.connect(audioContext.destination);
  osc.start();
  osc.stop(now + 0.2);
}

// Helper to synthesize a magical sparkle sound effect for toppings and candles appearing
function playSparkleSound(freq) {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  const now = audioContext.currentTime;
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, now);
  osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.1);
  
  gain.gain.setValueAtTime(0.02, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
  
  osc.connect(gain);
  gain.connect(audioContext.destination);
  osc.start();
  osc.stop(now + 0.1);
}

// Helper to synthesize a swift knife slicing sound effect
function playSliceSound() {
  if (!audioContext) return;
  const bufferSize = audioContext.sampleRate * 0.15;
  const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
  const data = buffer.getChannelData(0);
  
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  
  const noise = audioContext.createBufferSource();
  noise.buffer = buffer;
  
  const filter = audioContext.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 1000;
  filter.Q.value = 2.0;
  
  const gain = audioContext.createGain();
  gain.gain.setValueAtTime(0.08, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.15);
  
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(audioContext.destination);
  
  noise.start();
}

// Spawns grey smoke particles rising from wick coordinates
function spawnSmokeParticles(x, y) {
  const container = document.getElementById('cake-wrapper');
  if (!container) return;
  
  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      const smoke = document.createElement('div');
      smoke.className = 'smoke-particle';
      smoke.style.left = `${x}px`;
      smoke.style.top = `${y}px`;
      
      const sx = (Math.random() - 0.5) * 35; // random horizontal sway
      smoke.style.setProperty('--sx', `${sx}px`);
      
      container.appendChild(smoke);
      
      setTimeout(() => {
        smoke.remove();
      }, 1500);
    }, i * 150);
  }
}

// Sequential Cake decoration pop-in, candle growth, and candle lighting
function startDecorationSequence() {
  cakeActionBtn.innerText = "DECORATING...";
  cakeActionBtn.disabled = true;
  cakeActionBtn.style.pointerEvents = "none";
  cakeActionBtn.style.opacity = "0.7";
  
  // 1. Show toppings/decorations
  const toppings = document.querySelectorAll('.cake-topping');
  toppings.forEach((top, idx) => {
    setTimeout(() => {
      top.classList.add('visible');
      playSparkleSound(800 + idx * 80);
    }, idx * 180);
  });
  
  // 2. Show candles growing out
  const toppingsTime = toppings.length * 180;
  const candles = document.querySelectorAll('.candle-body-group');
  candles.forEach((candle, idx) => {
    setTimeout(() => {
      candle.classList.add('visible');
      playSparkleSound(600 + idx * 70);
    }, toppingsTime + 150 + idx * 220);
  });
  
  // 3. Light flames with major pentatonic scale tones
  const candlesTime = toppingsTime + 150 + candles.length * 220;
  const flames = [
    { id: 'flame-1', freq: 523.25 }, // C5
    { id: 'flame-2', freq: 587.33 }, // D5
    { id: 'flame-3', freq: 659.25 }, // E5
    { id: 'flame-4', freq: 783.99 }, // G5
    { id: 'flame-5', freq: 1046.50 } // C6
  ];
  
  flames.forEach((flame, idx) => {
    setTimeout(() => {
      const el = document.getElementById(flame.id);
      if (el) {
        el.classList.remove('hidden');
        el.classList.add('lit');
        playSynthTone(flame.freq, 0.4);
      }
    }, candlesTime + 300 + idx * 300);
  });
  
  const totalTime = candlesTime + 300 + flames.length * 300;
  setTimeout(() => {
    cakeState.decorated = true;
    cakeState.lit = true;
    
    cakeActionBtn.innerText = "BLOW THE CANDLES";
    cakeActionBtn.disabled = false;
    cakeActionBtn.style.pointerEvents = "auto";
    cakeActionBtn.style.opacity = "1";
    initMicrophoneBlowDetection();
  }, totalTime + 100);
}

// --- 7. Decorating, Microphone & Candle Blowing Engine ---
const cakeActionBtn = document.getElementById('cake-action-btn');
if (cakeActionBtn) {
  cakeActionBtn.addEventListener('click', () => {
    const status = cakeActionBtn.innerText;
    
    if (status === "DECORATE THE CAKE") {
      playChime();
      startDecorationSequence();
    } else if (status === "BLOW THE CANDLES") {
      playChime();
      blowOutCandles();
    } else if (status === "CUT THE CAKE") {
      playChime();
      cutCakeAnimation();
    }
  });
}

function blowOutCandles() {
  document.querySelectorAll('.candle-flame').forEach(f => {
    f.classList.remove('lit');
    f.classList.add('hidden');
  });
  
  playWindBlowSound();
  stopMicStream();
  
  // Confetti burst on blow out!
  createConfetti();
  
  // Spawn smoke particles rising from wicks
  const candleTips = [
    { x: 77, y: 45 },
    { x: 89, y: 42 },
    { x: 100, y: 40 },
    { x: 111, y: 42 },
    { x: 123, y: 45 }
  ];
  candleTips.forEach(tip => {
    spawnSmokeParticles(tip.x, tip.y);
  });
  
  cakeState.blown = true;
  if (cakeActionBtn) cakeActionBtn.innerText = "CUT THE CAKE";
}

function cutCakeAnimation() {
  const cakeSvg = document.getElementById('cake-svg');
  const knife = document.getElementById('cake-knife');
  
  if (!cakeSvg || !knife) return;
  
  cakeActionBtn.innerText = "CUTTING...";
  cakeActionBtn.disabled = true;
  cakeActionBtn.style.pointerEvents = "none";
  cakeActionBtn.style.opacity = "0.7";
  
  // 1. Activate knife slicing movements
  knife.classList.add('active');
  
  // Play slice sound on first cut (at 0.8s)
  setTimeout(() => {
    playSliceSound();
  }, 800);
  
  // Play slice sound on second cut (at 1.6s)
  setTimeout(() => {
    playSliceSound();
  }, 1600);
  
  // 2. Trigger slice slide-out displacement (at 2.2s)
  setTimeout(() => {
    cakeSvg.classList.add('sliced');
    cakeState.sliced = true;
    playChime();
    createConfetti();
  }, 2200);
  
  // 3. Transition button to final greeting state
  setTimeout(() => {
    cakeActionBtn.innerText = "SPECIAL MESSAGE";
    cakeActionBtn.disabled = false;
    cakeActionBtn.style.pointerEvents = "auto";
    cakeActionBtn.style.opacity = "1";
    
    // Bind click to next screen transition
    cakeActionBtn.onclick = () => {
      playChime();
      transitionToStep(9);
    };
  }, 3200);
}

function playWindBlowSound() {
  if (!audioContext) return;
  const bufferSize = audioContext.sampleRate * 0.4;
  const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
  const data = buffer.getChannelData(0);
  
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  
  const noise = audioContext.createBufferSource();
  noise.buffer = buffer;
  
  const filter = audioContext.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 350;
  
  const gain = audioContext.createGain();
  gain.gain.setValueAtTime(0.2, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.4);
  
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(audioContext.destination);
  
  noise.start();
}

function initMicrophoneBlowDetection() {
  const micStatus = document.getElementById('mic-status');
  navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    .then(stream => {
      micStream = stream;
      audioAnalyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(audioAnalyser);
      audioAnalyser.fftSize = 256;
      
      const bufferLength = audioAnalyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      if (micStatus) micStatus.classList.remove('hidden');
      blowDetectionActive = true;
      
      function checkBlowVolume() {
        if (!blowDetectionActive) return;
        audioAnalyser.getByteFrequencyData(dataArray);
        
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        let average = sum / bufferLength;
        
        if (average > 65) {
          blowOutCandles();
        } else {
          requestAnimationFrame(checkBlowVolume);
        }
      }
      checkBlowVolume();
    })
    .catch(err => {
      console.warn("Microphone not available: ", err);
    });
}

function stopMicStream() {
  blowDetectionActive = false;
  const micStatus = document.getElementById('mic-status');
  if (micStatus) micStatus.classList.add('hidden');
  if (micStream) {
    micStream.getTracks().forEach(track => track.stop());
    micStream = null;
  }
}

// --- 8. Typewriter Effect Engine ---
let typewriterTimeouts = [];

function getLetterItems(modal) {
  return [
    { el: modal.querySelector('.letter-salutation'), text: 'My Dearest Husband,' },
    { el: modal.querySelectorAll('.letter-text-line')[0], text: 'Happy birthday! 🎂' },
    { el: modal.querySelectorAll('.letter-text-line')[1], text: 'Every day, I thank God for bringing you into my life. You are not just my husband; you are my best friend, my greatest support, and the most beautiful part of my world.' },
    { el: modal.querySelectorAll('.letter-text-line')[2], text: 'Thank you for loving me, supporting me, and standing beside me through every joy and challenge. You make me feel valued, understood, and deeply loved. I am grateful not only for the man you are today but for the wonderful person you continue to be every day.' },
    { el: modal.querySelector('.letter-signoff'), text: 'I love you so much... 🫶🏻💗' }
  ].filter(item => item.el);
}

function clearTypewriter() {
  typewriterTimeouts.forEach(t => clearTimeout(t));
  typewriterTimeouts = [];
  
  const letterModal = document.getElementById('letter-modal');
  if (!letterModal) return;
  
  const items = getLetterItems(letterModal);
  items.forEach(item => {
    item.el.innerText = item.text;
    item.el.style.opacity = '1';
    item.el.style.transform = 'translateY(0)';
  });
}

function runTypewriter() {
  typewriterTimeouts.forEach(t => clearTimeout(t));
  typewriterTimeouts = [];
  
  const letterModal = document.getElementById('letter-modal');
  if (!letterModal) return;
  
  const items = getLetterItems(letterModal);
  
  // Hide all elements initially
  items.forEach(item => {
    item.el.innerText = '';
    item.el.style.opacity = '0';
    item.el.style.transform = 'translateY(10px)';
    item.el.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
  });
  
  let itemIndex = 0;
  
  function typeNextLine() {
    if (itemIndex >= items.length) return;
    
    const item = items[itemIndex];
    item.el.style.opacity = '1';
    item.el.style.transform = 'translateY(0)';
    
    let charIndex = 0;
    const text = item.text;
    
    function typeChar() {
      if (charIndex < text.length) {
        // Show text with trailing heart cursor during typing
        item.el.innerText = text.substring(0, charIndex + 1) + '❤';
        charIndex++;
        // Type slightly faster for longer text paragraphs
        const delay = text.length > 80 ? 15 : 30;
        const t = setTimeout(typeChar, delay);
        typewriterTimeouts.push(t);
      } else {
        // Remove trailing heart cursor when done typing this line
        item.el.innerText = text;
        itemIndex++;
        const t = setTimeout(typeNextLine, 250);
        typewriterTimeouts.push(t);
      }
    }
    
    typeChar();
  }
  
  // Start typing
  typeNextLine();
}

// --- 8. Envelope Letter Sequence ---
const envelope = document.getElementById('heart-envelope');
const letterModal = document.getElementById('letter-modal');
const closeLetterBtn = document.getElementById('close-letter-btn');
const bunnyCoupleModal = document.getElementById('bunny-couple-modal');

if (bunnyCoupleModal) {
  bunnyCoupleModal.innerHTML = bunnySVG;
}

if (envelope) {
  envelope.addEventListener('click', () => {
    if (!envelope.classList.contains('open')) {
      envelope.classList.add('open');
      const promptEl = document.getElementById('envelope-prompt');
      if (promptEl) promptEl.style.opacity = '0';
      const titleEl = document.getElementById('envelope-main-title');
      if (titleEl) titleEl.innerText = "With All My Love";
      
      setTimeout(() => {
        createConfetti();
        playChime();
        
        // Show the letter modal after the letter slides up
        setTimeout(() => {
          if (letterModal) {
            letterModal.classList.add('active');
            runTypewriter();
          }
        }, 850);
      }, 700);
    } else {
      // Reopen the modal when clicking the opened envelope
      if (letterModal) {
        letterModal.classList.add('active');
        runTypewriter();
      }
    }
  });
}

if (closeLetterBtn) {
  closeLetterBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (letterModal) {
      letterModal.classList.remove('active');
    }
    clearTypewriter();
    playChime();
  });
}

// --- 9. Master Hearts Spawning Emitter ---
function startHeartsEmitter() {
  if (heartInterval) return;
  
  const stepContainer = document.getElementById('step-9');
  
  heartInterval = setInterval(() => {
    if (currentStep !== 9) {
      stopHeartsEmitter();
      return;
    }
    
    const heart = document.createElement('div');
    heart.className = 'floating-heart-particle';
    heart.innerText = ['❤️', '💖', '💝', '💕', '💗'][Math.floor(Math.random() * 5)];
    
    // Stagger particle positions
    const startX = 20 + Math.random() * 60; // relative percentage
    const scale = 0.6 + Math.random() * 0.8;
    const duration = 3 + Math.random() * 3; // travel time
    const vx = (Math.random() - 0.5) * 80;
    
    heart.style.left = `${startX}%`;
    heart.style.transform = `scale(${scale})`;
    heart.style.setProperty('--vx', `${vx}px`);
    heart.style.animation = `heart-rise ${duration}s forwards linear`;
    
    stepContainer.appendChild(heart);
    
    setTimeout(() => {
      heart.remove();
    }, duration * 1000);
  }, 450);
}

function stopHeartsEmitter() {
  if (heartInterval) {
    clearInterval(heartInterval);
    heartInterval = null;
  }
}

// --- 10. Floating Theme Switcher Transition ---
if (themeToggleBtn) {
  themeToggleBtn.addEventListener('click', () => {
    playChime();
    const iconSpan = themeToggleBtn.querySelector('.icon');
    const labelSpan = themeToggleBtn.querySelector('.label');
    
    if (selectedStyle === 'classic') {
      selectedStyle = 'cute';
      bodyEl.className = 'theme-cute';
      if (iconSpan) iconSpan.innerText = '🎈';
      if (labelSpan) labelSpan.innerText = 'Cute';
    } else {
      selectedStyle = 'classic';
      bodyEl.className = 'theme-classic';
      if (iconSpan) iconSpan.innerText = '✨';
      if (labelSpan) labelSpan.innerText = 'Classic';
    }
    
    // Smooth transition light background glow recalculation
    if (currentStep === 7 || currentStep === 8) {
      surpriseContainer.style.background = selectedStyle === 'classic' 
        ? 'radial-gradient(circle at top, #20134e 0%, #06040d 100%)'
        : 'radial-gradient(circle at top, #36173a 0%, #0a040b 100%)';
    }
    updateCakeSVG();
  });
}
