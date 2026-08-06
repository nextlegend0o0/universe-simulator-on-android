/* 
  VORTEX ENGINE - CORE LOGIC (V16.1 MASTER)
  Features: Restored GPU-Safe Sun, Orbital Moons, AAA Auto-Hide UI
*/
// 1. CORE DATABASE
const DATABASE = {
  "Sun": { type: "G-Type Star", facts: ["Perfect sphere of incredibly hot plasma.", "Accounts for 99.86% of total solar system mass.", "Core temperature hits 15 million °C."] },
  "Earth": { type: "Terrestrial Planet", facts: ["Only planet confirmed to harbor life.", "71% surface covered in liquid water.", "Densest planet in the system."] },
  "Jupiter": { type: "Gas Giant", facts: ["Largest planet; holds 1,300 Earths.", "Home to the Great Red Spot.", "Rotates fully in just 10 hours."] },
  "Saturn": { type: "Gas Giant", facts: ["Famous for complex, beautiful ice rings.", "Least dense planet (would float in water).", "Has 146 confirmed moons."] },
  "Neptune": { type: "Ice Giant", facts: ["The most distant major planet in our solar system.", "Discovered by mathematical prediction.", "Dark, cold, and incredibly windy."] },
  "Magnetic Pulsar": { type: "Neutron Star", facts: ["Ultra-dense collapsed core of a dead star.", "Spins at terrifying rates.", "Emits lighthouse-like beams of radiation."] }
};
// 2. UI & DOM ELEMENTS
const mainUI = document.getElementById('main-ui');
const infoPanel = document.getElementById('info-panel');
const btnFreeCam = document.getElementById('btnFreeCam');
const navModal = document.getElementById('nav-modal');
// Close Info Panel & Restore Main UI
document.getElementById('btnCloseInfo').addEventListener('click', () => {
    infoPanel.classList.remove('visible');
    mainUI.classList.remove('ui-hidden'); 
});
// Free Cam Button (Disengage)
btnFreeCam.addEventListener('click', () => {
    targetCamPos = new THREE.Vector3(0, 40, 150);
    targetLookAt = new THREE.Vector3(0, 0, 0);
    infoPanel.classList.remove('visible');
    mainUI.classList.remove('ui-hidden');
    btnFreeCam.style.display = 'none';
});
// Navigation Menu Logic
document.getElementById('btnMenuToggle').addEventListener('click', () => {
    navModal.classList.add('active');
    mainUI.classList.add('ui-hidden'); // Hide HUD while menu is open
});
document.getElementById('btnCloseMenu').addEventListener('click', () => {
    navModal.classList.remove('active');
    mainUI.classList.remove('ui-hidden');
});
document.querySelectorAll('.nav-btn[data-target]').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const target = e.target.getAttribute('data-target');
        navModal.classList.remove('active');
        mainUI.classList.remove('ui-hidden');        
        if (target === 'home') {
            targetCamPos = new THREE.Vector3(0, 80, 200);
            targetLookAt = new THREE.Vector3(0, 0, 0);
        } else if (target === 'vela') {
            targetCamPos = new THREE.Vector3(2000, 550, -1900);
            targetLookAt = new THREE.Vector3(2000, 500, -2000);
        }
    });
});
// 3. FULLSCREEN (Android OS Fix)
function enterFullscreen() {
    const d = document.documentElement;
    if (d.requestFullscreen) d.requestFullscreen().catch(()=>{});
    if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(()=>{});
}
document.getElementById('landscape-prompt').addEventListener('click', function() {
    this.style.display = 'none';
    enterFullscreen();
});
document.getElementById('resume-prompt').addEventListener('click', function() {
    this.style.display = 'none';
    enterFullscreen();
});
document.addEventListener('fullscreenchange', () => {
    const resumePrompt = document.getElementById('resume-prompt');
    const initPrompt = document.getElementById('landscape-prompt');
    if (!document.fullscreenElement && initPrompt.style.display === 'none') {
        resumePrompt.style.display = 'flex';
    }
});
// 4. THREE.JS ENGINE SETUP
const container = document.getElementById('webgl-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
container.appendChild(renderer.domElement);
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxDistance = 100000;
controls.minDistance = 5;
// 5. TEXTURE LOADER & BOOT SEQUENCE
const manager = new THREE.LoadingManager();
manager.onLoad = function () {
    const ls = document.getElementById('loading-screen');
    ls.classList.add('fade-out');
    setTimeout(() => ls.remove(), 1000);
    animate();
};
const textureLoader = new THREE.TextureLoader(manager);
textureLoader.setCrossOrigin('anonymous');
const TEX = {
    stars: './2k_stars_milky_way.jpg',
    earthMap: './2k_earth_daymap.jpg',
    jupiter: './2k_jupiter.jpg',
    saturn: './2k_saturn.jpg',
    neptune: './2k_neptune.jpg', // Ensure you uploaded this 2K texture to your GitHub
    moon: './2k_moon.jpg'
};
const interactables = [];
// 6. CRISP 4K/2K SKYBOX (No White Blobs)
const skyGeo = new THREE.SphereGeometry(800000, 64, 64);
const skyMat = new THREE.MeshBasicMaterial({ map: textureLoader.load(TEX.stars), side: THREE.BackSide, depthWrite: false });
scene.add(new THREE.Mesh(skyGeo, skyMat));
// 7. RESTORED SUN (Mobile GPU Safe - Layered Meshes instead of Canvas)
const solarSystem = new THREE.Group(); scene.add(solarSystem);
solarSystem.add(new THREE.AmbientLight(0x222233, 0.6));
let currentSun = new THREE.Group(); solarSystem.add(currentSun);
// Sun Core
const sunCore = new THREE.Mesh(new THREE.SphereGeometry(8.0, 64, 64), new THREE.MeshBasicMaterial({ color: 0xffaa00 }));
sunCore.userData = { name: "Sun", size: 8.0 };
interactables.push(sunCore); currentSun.add(sunCore);
// Sun Volumetric Layers (GPU friendly AdditiveBlending meshes)
const glow1 = new THREE.Mesh(
    new THREE.SphereGeometry(9.5, 32, 32),
    new THREE.MeshBasicMaterial({ color: 0xff7700, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, side: THREE.BackSide })
);
currentSun.add(glow1);
const glow2 = new THREE.Mesh(
    new THREE.SphereGeometry(12.0, 32, 32),
    new THREE.MeshBasicMaterial({ color: 0xff3300, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, side: THREE.BackSide })
);
currentSun.add(glow2);
// Master Light
currentSun.add(new THREE.PointLight(0xffffff, 2.5, 10000));
// 8. PLANETS & MOONS RESTORED
let planetDataList = [];
const planets = [
  { name: "Earth", radius: 40, speed: 0.005, size: 1.5, type: 'earthMap', moons: 1 },
  { name: "Jupiter", radius: 75, speed: 0.002, size: 3.5, type: 'jupiter', moons: 4 },
  { name: "Saturn", radius: 110, speed: 0.0014, size: 3.0, type: 'saturn', hasRings: true, moons: 4 },
  { name: "Neptune", radius: 150, speed: 0.0008, size: 2.8, type: 'neptune', moons: 0 }
];
planets.forEach(p => {
  // Orbit Lines
  const ringGeo = new THREE.BufferGeometry(); const points = [];
  for (let i = 0; i <= 100; i++) { const t = (i/100)*Math.PI*2; points.push(new THREE.Vector3(Math.cos(t)*p.radius, 0, Math.sin(t)*p.radius)); }
  ringGeo.setFromPoints(points);
  const orbitLine = new THREE.Line(ringGeo, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false }));
  solarSystem.add(orbitLine);
  // Pivot & Mesh
  const pivot = new THREE.Group(); solarSystem.add(pivot);
  let pMat = new THREE.MeshPhongMaterial({ map: textureLoader.load(TEX[p.type] || TEX.moon), shininess: 5 });
  const pMesh = new THREE.Mesh(new THREE.SphereGeometry(p.size, 64, 64), pMat);
  pMesh.position.x = p.radius;
  pMesh.userData = { name: p.name, size: p.size };
  pivot.add(pMesh); p.pivot = pivot; p.mesh = pMesh;
  interactables.push(pMesh); planetDataList.push(p);
  // Rings
  if (p.hasRings) {
      const rMesh = new THREE.Mesh(new THREE.TorusGeometry(p.size * 2.2, 0.1, 32, 100), new THREE.MeshPhongMaterial({ color: 0xcd853f, transparent: true, opacity: 0.8 }));
      rMesh.rotation.x = Math.PI / 2.1;
      pMesh.add(rMesh);
  }
  // Restored Moons Spawner
  p.moonList = [];
  if (p.moons > 0) {
      const moonTex = textureLoader.load(TEX.moon);
      for(let m = 0; m < p.moons; m++) {
          const moonPivot = new THREE.Group();
          pMesh.add(moonPivot); // Attach pivot to planet so it travels with it
          const moonMesh = new THREE.Mesh(
              new THREE.SphereGeometry(p.size * 0.2, 16, 16),
              new THREE.MeshPhongMaterial({ map: moonTex })
          );
          // Stagger distance based on loop index
          const mDist = p.size * 1.5 + (m * 0.8);
          moonMesh.position.set(mDist, 0, 0);
          moonPivot.add(moonMesh);
          // Randomize orbital speeds slightly
          p.moonList.push({ pivot: moonPivot, speed: 0.02 + (Math.random() * 0.03) });
      }
  }
});
// 9. PULSAR (Restored)
const pulsarGroup = new THREE.Group(); pulsarGroup.position.set(2000, 500, -2000); scene.add(pulsarGroup);
const nStar = new THREE.Mesh(new THREE.SphereGeometry(3, 32, 32), new THREE.MeshBasicMaterial({ color: 0xffffff }));
nStar.userData = { name: "Magnetic Pulsar", size: 15 }; interactables.push(nStar); pulsarGroup.add(nStar);
const pAura = new THREE.Mesh(new THREE.SphereGeometry(12, 32, 32), new THREE.MeshBasicMaterial({ color: 0x55aaff, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, side: THREE.BackSide }));
pulsarGroup.add(pAura);
const jetGeo = new THREE.CylinderGeometry(0.5, 15, 1500, 32, 1, true);
const jetMat = new THREE.MeshBasicMaterial({ color: 0x4488ff, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
const pJet1 = new THREE.Mesh(jetGeo, jetMat); pJet1.position.y = 750; pulsarGroup.add(pJet1);
const pJet2 = new THREE.Mesh(jetGeo, jetMat); pJet2.position.y = -750; pJet2.rotation.x = Math.PI; pulsarGroup.add(pJet2);
for(let i=0; i<4; i++) {
    let torus = new THREE.Mesh(new THREE.TorusGeometry(15 + (i*6), 0.2, 32, 100), new THREE.MeshBasicMaterial({color: 0x00ffff, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending}));
    torus.rotation.y = (Math.PI / 4) * i; torus.rotation.x = Math.PI / 2.2; pulsarGroup.add(torus);
}
// 10. INTERACTION (Raycaster)
const raycaster = new THREE.Raycaster(); const mouse = new THREE.Vector2();
let targetCamPos = null; let targetLookAt = null;
window.addEventListener('pointerdown', (event) => {
    if(event.target.tagName === 'BUTTON' || event.target.closest('.hud-panel') || event.target.closest('#info-panel') || event.target.closest('.nav-menu')) return;
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(interactables, false);
    if(intersects.length > 0) {
        const mesh = intersects[0].object;
        const name = mesh.userData.name;
        if(DATABASE[name]) {
            document.getElementById('infoTitle').textContent = name;
            document.getElementById('infoType').textContent = DATABASE[name].type;
            const list = document.getElementById('infoFactsList'); list.innerHTML = '';
            DATABASE[name].facts.forEach(f => { let li = document.createElement('li'); li.textContent = f; list.appendChild(li); });
            // AUTO HIDE UI ENGAGE
            infoPanel.classList.add('visible');
            mainUI.classList.add('ui-hidden');
            btnFreeCam.style.display = 'block';
        }
        const wPos = new THREE.Vector3(); mesh.getWorldPosition(wPos); targetLookAt = wPos.clone();
        const safeDist = Math.max(mesh.userData.size * 4, 20);
        targetCamPos = new THREE.Vector3(wPos.x + safeDist, wPos.y + (safeDist*0.5), wPos.z + safeDist);
        controls.target.copy(targetLookAt);
    }
});
// INITIAL BOOT CAMERA
targetCamPos = new THREE.Vector3(0, 40, 150);
targetLookAt = new THREE.Vector3(0, 0, 0);
controls.target.copy(targetLookAt);
// 11. ANIMATION LOOP
function animate() {
  requestAnimationFrame(animate);
  sunCore.rotation.y += 0.002;
  glow1.rotation.y -= 0.003;
  glow2.rotation.y += 0.001;
  pulsarGroup.rotation.z += 0.08; pulsarGroup.rotation.y += 0.04;
  planetDataList.forEach(p => {
      p.mesh.rotation.y += 0.01;
      p.pivot.rotation.y += p.speed;

      // Animate Moons
      if (p.moonList) {
          p.moonList.forEach(moon => {
              moon.pivot.rotation.y += moon.speed;
          });
      }
  });
  if (targetCamPos && targetLookAt) {
      camera.position.lerp(targetCamPos, 0.05);
      if (camera.position.distanceTo(targetCamPos) < 0.5) { targetCamPos = null; targetLookAt = null; }
  }
  controls.update();
  renderer.render(scene, camera);
}
// 12. RESPONSIVE RESIZING
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
