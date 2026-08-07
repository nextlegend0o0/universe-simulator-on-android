/*
  VORTEX ENGINE - CORE PHYSICS LOGIC (main.js)
  Professional Simulator Architecture
*/

// 1. ENGINE & SCENE SETUP
const container = document.getElementById('webgl-container');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0a0a0c, 0.001);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
container.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxDistance = 50000;
controls.minDistance = 5;

// Lighting
scene.add(new THREE.AmbientLight(0x222222));
const sunLight = new THREE.PointLight(0xffffff, 2.5, 10000);
scene.add(sunLight);

// 2. TEXTURES & VISUALS (Restoring AAA Graphics)
const textureLoader = new THREE.TextureLoader();
textureLoader.setCrossOrigin('anonymous');
const TEX = {
  stars: './2k_stars_milky_way.jpg',
  earthMap: './2k_earth_daymap.jpg',
  jupiter: './2k_jupiter.jpg',
  saturn: './2k_saturn.jpg',
  neptune: './2k_neptune.jpg',
  moon: './2k_moon.jpg'
};

// Procedural Sun Glow
function createGlowTex() {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.2, 'rgba(255,255,255,0.8)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0,0,128,128);
  return new THREE.CanvasTexture(c);
}
const softGlowTex = createGlowTex();

// Skybox
const skyGeo = new THREE.SphereGeometry(40000, 64, 64);
const skyMat = new THREE.MeshBasicMaterial({ map: textureLoader.load(TEX.stars), side: THREE.BackSide, depthWrite: false });
scene.add(new THREE.Mesh(skyGeo, skyMat));

// 3. SIMULATION DATA & ENTITIES
let simulationSpeed = 1.0; // Time-Warp Multiplier
let timeElapsed = 0;
const interactables = [];
let selectedBody = null;

const planetData = [
  { name: "Mercury", dist: 25, size: 0.8, speed: 0.04, type: 'moon', mass: "0.055 Earths" },
  { name: "Venus", dist: 35, size: 1.4, speed: 0.015, type: 'moon', mass: "0.815 Earths" },
  { name: "Earth", dist: 50, size: 1.6, speed: 0.01, type: 'earthMap', mass: "1.000 Earths" },
  { name: "Mars", dist: 65, size: 1.1, speed: 0.008, type: 'moon', mass: "0.107 Earths" },
  { name: "Jupiter", dist: 100, size: 4.5, speed: 0.004, type: 'jupiter', mass: "317.8 Earths", hasMoons: true },
  { name: "Saturn", dist: 140, size: 3.8, speed: 0.002, type: 'saturn', mass: "95.16 Earths", hasRings: true },
  { name: "Neptune", dist: 190, size: 2.8, speed: 0.001, type: 'neptune', mass: "17.15 Earths" }
];

const bodies = [];

// Create Sun
const sunGroup = new THREE.Group();
scene.add(sunGroup);
const sunMesh = new THREE.Mesh(new THREE.SphereGeometry(10, 64, 64), new THREE.MeshBasicMaterial({ color: 0xffaa00 }));
sunMesh.userData = { name: "Sun", mass: "333,000 Earths", radius: "696,340 km" };
interactables.push(sunMesh);
sunGroup.add(sunMesh);

const sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: softGlowTex, color: 0xff7700, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
sunGlow.scale.set(45, 45, 1);
sunGroup.add(sunGlow);

// Create Planets & Tracers
planetData.forEach(data => {
  const pivot = new THREE.Group();
  scene.add(pivot);

  const mat = new THREE.MeshStandardMaterial({ 
    map: textureLoader.load(TEX[data.type] || TEX.moon),
    roughness: 0.6 
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(data.size, 64, 64), mat);
  mesh.position.x = data.dist;
  mesh.userData = { name: data.name, mass: data.mass, speed: data.speed, radius: (data.size * 2000) + " km" };
  pivot.add(mesh);
  interactables.push(mesh);

  // Saturn Rings
  if (data.hasRings) {
    const rMesh = new THREE.Mesh(
      new THREE.TorusGeometry(data.size * 2.2, 0.15, 16, 100), 
      new THREE.MeshStandardMaterial({ color: 0xcda57f, transparent: true, opacity: 0.8 })
    );
    rMesh.rotation.x = Math.PI / 2.1;
    mesh.add(rMesh);
  }

  // Moons (Hierarchical)
  if (data.hasMoons) {
    const moonGroup = new THREE.Group();
    mesh.add(moonGroup);
    for (let i = 0; i < 4; i++) {
      const moon = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 16), new THREE.MeshStandardMaterial({ color: 0xcccccc }));
      moon.userData = { angle: Math.random() * Math.PI * 2, dist: data.size + 2 + (i * 1.2), speed: 0.02 + (i * 0.005) };
      moonGroup.add(moon);
      bodies.push({ isMoon: true, mesh: moon });
    }
  }

  // Orbital Tracers
  const ringGeo = new THREE.RingGeometry(data.dist - 0.2, data.dist + 0.2, 128);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x4daafc, side: THREE.DoubleSide, transparent: true, opacity: 0.08 });
  const orbitLine = new THREE.Mesh(ringGeo, ringMat);
  orbitLine.rotation.x = Math.PI / 2;
  scene.add(orbitLine);

  bodies.push({ isMoon: false, pivot: pivot, mesh: mesh, speed: data.speed });
});

// 4. RAYCASTER & INTERACTION (Selecting Planets)
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// UI Elements mapping
const propWindow = document.getElementById('properties-window');
const propName = document.getElementById('prop-name');
const propMass = document.getElementById('prop-mass');
const propRadius = document.getElementById('prop-radius');
const tutorialOverlay = document.getElementById('tutorial-overlay');

// Change Cursor on hover
window.addEventListener('pointermove', (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(interactables, false);
  
  if (intersects.length > 0) {
    container.classList.add('interactive-cursor');
  } else {
    container.classList.remove('interactive-cursor');
  }
});

// Click to Select
window.addEventListener('pointerdown', (e) => {
  // Ignore clicks on UI elements
  if (e.target.closest('.floating-window') || e.target.closest('#left-toolbar') || e.target.closest('#bottom-bar')) return;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(interactables, false);

  if (intersects.length > 0) {
    const object = intersects[0].object;
    selectedBody = object;

    // Remove Tutorial
    if (tutorialOverlay) tutorialOverlay.classList.add('fade-out');

    // Populate Properties UI
    if (propWindow) {
      propName.value = object.userData.name;
      propMass.value = object.userData.mass || "Unknown";
      propRadius.value = object.userData.radius || "Unknown";
      propWindow.classList.add('open');
    }

    // Smooth Camera focus
    const wPos = new THREE.Vector3();
    object.getWorldPosition(wPos);
    
    // Animate controls target
    controls.target.copy(wPos);
  } else {
    // Deselect
    selectedBody = null;
    if (propWindow) propWindow.classList.remove('open');
    controls.target.set(0,0,0);
  }
});

// 5. CAMERA BOOT SEQUENCE
camera.position.set(0, 80, 250);
controls.target.set(0, 0, 0);

// 6. RENDER LOOP
let lastTime = performance.now();
let frameCount = 0;
let lastFpsTime = 0;
const fpsDisplay = document.getElementById('fps-display');
const timeDisplay = document.getElementById('time-display');

function animate() {
  requestAnimationFrame(animate);
  const now = performance.now();
  
  // Calculate FPS Telemetry
  frameCount++;
  if (now - lastFpsTime >= 1000) {
    if (fpsDisplay) fpsDisplay.innerText = `FPS: ${frameCount}`;
    frameCount = 0;
    lastFpsTime = now;
  }

  // Apply Simulation Speed (Time Warp)
  // Retrieve speed from global slider if available
  const slider = document.getElementById('time-slider');
  if (slider) simulationSpeed = parseFloat(slider.value);

  timeElapsed += simulationSpeed;
  if (timeDisplay) timeDisplay.innerText = `DAY: ${Math.floor(timeElapsed / 100)}`;

  // Update Physics
  sunGroup.rotation.y += 0.002 * simulationSpeed;

  bodies.forEach(body => {
    if (body.isMoon) {
      body.mesh.userData.angle += body.mesh.userData.speed * simulationSpeed;
      body.mesh.position.x = Math.cos(body.mesh.userData.angle) * body.mesh.userData.dist;
      body.mesh.position.z = Math.sin(body.mesh.userData.angle) * body.mesh.userData.dist;
    } else {
      body.mesh.rotation.y += 0.01 * simulationSpeed;
      body.pivot.rotation.y += body.speed * simulationSpeed;
    }
  });

  // Track selected body with camera
  if (selectedBody) {
    const wPos = new THREE.Vector3();
    selectedBody.getWorldPosition(wPos);
    controls.target.lerp(wPos, 0.1);
  }

  controls.update();
  renderer.render(scene, camera);
}
animate();

// Handle Window Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
