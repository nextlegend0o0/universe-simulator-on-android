/*
  VORTEX ENGINE - CORE LOGIC (V16.1 AAA MASTER)
  Features: Restored Full Celestial Database, Organized Hierarchical Moons, Deep-Space Spacing, AAA Terminal UI
*/

// 1. FULL CELESTIAL DATABASE & ENTITIES
const DATABASE = {
  "Sun": { type: "G-Type Star", facts: ["Perfect sphere of incredibly hot plasma.", "Accounts for 99.86% of total solar mass."] },
  "Mercury": { type: "Terrestrial Planet", facts: ["Extreme temperature fluctuations.", "No atmosphere to trap heat."] },
  "Venus": { type: "Terrestrial Planet", facts: ["Hottest planet in our solar system.", "Rained upon by sulfuric acid clouds."] },
  "Earth": { type: "Terrestrial Planet", facts: ["Only planet confirmed to harbor life.", "71% surface covered in liquid water."] },
  "Mars": { type: "Terrestrial Planet", facts: ["Home to Olympus Mons, the tallest volcano.", "Red dust caused by iron oxide."] },
  "Jupiter": { type: "Gas Giant", facts: ["Largest planet; holds 1,300 Earths.", "Home to the Great Red Spot."] },
  "Saturn": { type: "Gas Giant", facts: ["Famous for complex, beautiful ice rings.", "Low density; would float in water."] },
  "Uranus": { type: "Ice Giant", facts: ["Rotates completely on its side.", "Coldest planetary atmosphere."] },
  "Neptune": { type: "Ice Giant", facts: ["Discovered by mathematical prediction.", "Supersonic winds exceeding 2,000 km/h."] },
  "Magnetic Pulsar": { type: "Neutron Star", facts: ["Ultra-dense collapsed core of a dead star.", "Spins at terrifying velocities emitting intense radiation beams."] },
  "Black Hole": { type: "Singularity", facts: ["Gravitational field so strong nothing escapes.", "Event horizon marks the point of no return."] },
  "Deep Nebula": { type: "Stellar Nursery", facts: ["Vast clouds of cosmic gas and dust.", "Birthplace of new star systems."] }
};

// 2. UI & DOM ELEMENTS
const mainUI = document.getElementById('main-ui');
const navModal = document.getElementById('nav-modal');
const btnNav = document.getElementById('btn-nav');
const btnCloseMenu = document.getElementById('btn-close-menu');

// Toggle Warp Navigation Menu
btnNav.addEventListener('click', () => {
  navModal.classList.add('active');
  mainUI.classList.add('ui-hidden');
});

btnCloseMenu.addEventListener('click', () => {
  navModal.classList.remove('active');
  mainUI.classList.remove('ui-hidden');
});

// Destination Selectors inside Terminal
document.querySelectorAll('.nav-target-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const targetKey = e.target.getAttribute('data-target');
    navModal.classList.remove('active');
    mainUI.classList.remove('ui-hidden');

    if (targetKey === 'solar') {
      targetCamPos.set(0, 40, 150);
      targetLookAt.set(0, 0, 0);
    } else if (targetKey === 'pulsar') {
      // Safely isolated far away in deep space so it doesn't crowd the solar system
      targetCamPos.set(2000, 550, -1900);
      targetLookAt.set(2000, 500, -2000);
    } else if (targetKey === 'blackhole') {
      targetCamPos.set(-2500, 400, 2500);
      targetLookAt.set(-2500, 350, 2400);
    } else if (targetKey === 'nebula') {
      targetCamPos.set(0, 1000, 3500);
      targetLookAt.set(0, 0, 0);
    }
  });
});

// 3. THREE.JS ENGINE SETUP
const container = document.getElementById('webgl-container');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x07090e, 0.0015);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 10000);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0x222222);
scene.add(ambientLight);

const sunLight = new THREE.PointLight(0xffffff, 2.5, 3000, 0.5);
scene.add(sunLight);

// Camera smoothing targets
let targetCamPos = new THREE.Vector3(0, 40, 150);
let targetLookAt = new THREE.Vector3(0, 0, 0);
camera.position.copy(targetCamPos);

// 4. CREATING SOLAR SYSTEM BODIES & HIERARCHICAL MOONS
const sunGeo = new THREE.SphereGeometry(8, 32, 32);
const sunMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
const sunMesh = new THREE.Mesh(sunGeo, sunMat);
scene.add(sunMesh);

// Planet Data Setup (Distance, Size, Speed)
const planetData = [
  { name: "Mercury", dist: 16, size: 0.8, speed: 0.04, color: 0x888888 },
  { name: "Venus", dist: 24, size: 1.4, speed: 0.015, color: 0xe3bb76 },
  { name: "Earth", dist: 35, size: 1.6, speed: 0.01, color: 0x2277ff },
  { name: "Mars", dist: 48, size: 1.1, speed: 0.008, color: 0xc1440e },
  { name: "Jupiter", dist: 70, size: 3.5, speed: 0.004, color: 0xd4a373, hasMoons: true },
  { name: "Saturn", dist: 95, size: 2.8, speed: 0.002, color: 0xf4e2bb, hasMoons: true },
  { name: "Uranus", dist: 120, size: 2.0, speed: 0.0012, color: 0x77ddff },
  { name: "Neptune", dist: 145, size: 1.9, speed: 0.001, color: 0x3333cc }
];

const planets = [];

planetData.forEach(data => {
  const pivot = new THREE.Group();
  scene.add(pivot);

  const meshGeo = new THREE.SphereGeometry(data.size, 32, 32);
  const meshMat = new THREE.MeshStandardMaterial({ color: data.color, roughness: 0.8 });
  const mesh = new THREE.Mesh(meshGeo, meshMat);
  mesh.position.x = data.dist;
  pivot.add(mesh);

  // Fix Moon Swarming: Parent moons to a clean local group relative to the planet
  if (data.hasMoons) {
    const moonGroup = new THREE.Group();
    mesh.add(moonGroup);

    for (let i = 0; i < 3; i++) {
      const moonGeo = new THREE.SphereGeometry(0.25, 16, 16);
      const moonMat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
      const moon = new THREE.Mesh(moonGeo, moonMat);
      
      // Flat, organized orbital distribution around the planet's equator
      const moonDist = data.size + 1.5 + (i * 0.8);
      moon.userData = { angle: Math.random() * Math.PI * 2, dist: moonDist, speed: 0.03 + (i * 0.01) };
      moonGroup.add(moon);
      planets.push({ isMoon: true, mesh: moon, parentData: data });
    }
  }

  // Orbital Ring Guide lines
  const ringGeo = new THREE.RingGeometry(data.dist - 0.1, data.dist + 0.1, 64);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.05 });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 2;
  scene.add(ring);

  planets.push({ isMoon: false, mesh: mesh, pivot: pivot, speed: data.speed });
});

// 5. DEEP SPACE ANCHORS (Pulsar & Black Hole placed far away)
const pulsarGroup = new THREE.Group();
pulsarGroup.position.set(2000, 500, -2000);
scene.add(pulsarGroup);

const pulsarGeo = new THREE.SphereGeometry(5, 32, 32);
const pulsarMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
pulsarGroup.add(new THREE.Mesh(pulsarGeo, pulsarMat));

const bhGroup = new THREE.Group();
bhGroup.position.set(-2500, 350, 2400);
scene.add(bhGroup);

const bhGeo = new THREE.SphereGeometry(12, 32, 32);
const bhMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
bhGroup.add(new THREE.Mesh(bhGeo, bhMat));

// Background Starfield Particles
const starsGeo = new THREE.BufferGeometry();
const starCount = 3000;
const starPos = new Float32Array(starCount * 3);
for(let i = 0; i < starCount * 3; i++) {
  starPos[i] = (Math.random() - 0.5) * 8000;
}
starsGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
const starsMat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.5, transparent: true, opacity: 0.7 });
const starField = new THREE.Points(starsGeo, starsMat);
scene.add(starField);

// 6. ANIMATION LOOP
function animate() {
  requestAnimationFrame(animate);

  // Rotate Planets & Cleanly orbit moons
  planets.forEach(item => {
    if (item.isMoon) {
      item.mesh.userData.angle += item.mesh.userData.speed;
      item.mesh.position.x = Math.cos(item.mesh.userData.angle) * item.mesh.userData.dist;
      item.mesh.position.z = Math.sin(item.mesh.userData.angle) * item.mesh.userData.dist;
    } else {
      item.pivot.rotation.y += item.speed * 0.5;
    }
  });

  // Spin Pulsar
  pulsarGroup.rotation.y += 0.05;

  // Smooth cinematic camera lerp
  camera.position.lerp(targetCamPos, 0.05);
  camera.lookAt(targetLookAt);

  renderer.render(scene, camera);
}
animate();

// Handle Window Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
