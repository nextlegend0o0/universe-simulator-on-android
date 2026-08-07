/*
  VORTEX ENGINE - CORE LOGIC (main.js)
  Extracted directly from the stable V16 build
*/

// CORE DATABASE
const DATABASE = {
  "Sun": { type: "G-Type Star", facts: ["Perfect sphere of incredibly hot plasma.", "Accounts for 99.86% of total solar system mass.", "Core temperature hits 15 million °C."] },
  "Earth": { type: "Terrestrial Planet", facts: ["Only planet confirmed to harbor life.", "71% surface covered in liquid water.", "Densest planet in the system."] },
  "Jupiter": { type: "Gas Giant", facts: ["Largest planet; holds 1,300 Earths.", "Home to the Great Red Spot.", "Rotates fully in just 10 hours."] },
  "Saturn": { type: "Gas Giant", facts: ["Famous for complex, beautiful ice rings.", "Least dense planet (would float in water).", "Has 146 confirmed moons."] },
  "Neptune": { type: "Ice Giant", facts: ["The most distant major planet in our solar system.", "Discovered by mathematical prediction.", "Dark, cold, and incredibly windy."] },
  "Magnetic Pulsar": { type: "Neutron Star", facts: ["Ultra-dense collapsed core of a dead star.", "Spins at terrifying rates.", "Emits lighthouse-like beams of radiation."] }
};

// UI & FULLSCREEN LOGIC
const mainUI = document.getElementById('main-ui');
const infoPanel = document.getElementById('info-panel');
const btnFreeCam = document.getElementById('btnFreeCam');

function closeInfo() { 
    infoPanel.classList.remove('visible'); 
    mainUI.classList.remove('ui-hidden');
}

function resetCamera() { 
    targetCamPos = new THREE.Vector3(0, 40, 150); 
    targetLookAt = new THREE.Vector3(0, 0, 0); 
    closeInfo(); 
    btnFreeCam.style.display = 'none'; 
}

// Fullscreen Management (Android OS Fix)
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

// THREE.JS SETUP
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

// TEXTURE LOADER
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
    neptune: './2k_neptune.jpg', 
    moon: './2k_moon.jpg' 
};

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

const interactables = []; 

// SKYBOX
const skyGeo = new THREE.SphereGeometry(800000, 64, 64);
const skyMat = new THREE.MeshBasicMaterial({ map: textureLoader.load(TEX.stars), side: THREE.BackSide, depthWrite: false });
scene.add(new THREE.Mesh(skyGeo, skyMat));

// SUN
const solarSystem = new THREE.Group(); 
scene.add(solarSystem);
solarSystem.add(new THREE.AmbientLight(0x333344, 0.4)); 

let currentSun = new THREE.Group(); 
solarSystem.add(currentSun);
const sunCore = new THREE.Mesh(new THREE.SphereGeometry(8.0, 64, 64), new THREE.MeshBasicMaterial({ color: 0xffaa00 }));
sunCore.userData = { name: "Sun", size: 8.0 }; 
interactables.push(sunCore); 
currentSun.add(sunCore);

const sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: softGlowTex, color: 0xff7700, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
sunGlow.scale.set(35, 35, 1); 
currentSun.add(sunGlow);

const sunOuter = new THREE.Sprite(new THREE.SpriteMaterial({ map: softGlowTex, color: 0xff4400, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }));
sunOuter.scale.set(60, 60, 1); 
currentSun.add(sunOuter);

currentSun.add(new THREE.PointLight(0xffffff, 2.5, 10000));

// PLANETS
let planetDataList = [];
const planets = [
  { name: "Earth", radius: 40, speed: 0.005, size: 1.5, type: 'earthMap' }, 
  { name: "Jupiter", radius: 75, speed: 0.002, size: 3.5, type: 'jupiter' }, 
  { name: "Saturn", radius: 110, speed: 0.0014, size: 3.0, type: 'saturn', hasRings: true },
  { name: "Neptune", radius: 150, speed: 0.0008, size: 2.8, type: 'neptune' }
];

planets.forEach(p => {
  const ringGeo = new THREE.BufferGeometry(); 
  const points = [];
  for (let i = 0; i <= 100; i++) { 
      const t = (i/100)*Math.PI*2; 
      points.push(new THREE.Vector3(Math.cos(t)*p.radius, 0, Math.sin(t)*p.radius)); 
  }
  ringGeo.setFromPoints(points); 
  const orbitLine = new THREE.Line(ringGeo, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false }));
  solarSystem.add(orbitLine);
  
  const pivot = new THREE.Group(); 
  solarSystem.add(pivot);
  let pMat = new THREE.MeshPhongMaterial({ map: textureLoader.load(TEX[p.type] || TEX.moon), shininess: 5 });
  const pMesh = new THREE.Mesh(new THREE.SphereGeometry(p.size, 64, 64), pMat);
  pMesh.position.x = p.radius; 
  pMesh.userData = { name: p.name, size: p.size }; 
  pivot.add(pMesh); 
  p.pivot = pivot; 
  p.mesh = pMesh; 
  interactables.push(pMesh); 
  planetDataList.push(p);
  
  if (p.hasRings) {
      const rMesh = new THREE.Mesh(new THREE.TorusGeometry(p.size * 2.2, 0.1, 16, 100), new THREE.MeshPhongMaterial({ color: 0xcd853f, transparent: true, opacity: 0.8 }));
      rMesh.rotation.x = Math.PI / 2.1; 
      pMesh.add(rMesh);
  }
});

// PULSAR
const pulsarGroup = new THREE.Group(); 
pulsarGroup.position.set(2000, 500, -2000); 
scene.add(pulsarGroup);
const nStar = new THREE.Mesh(new THREE.SphereGeometry(3, 32, 32), new THREE.MeshBasicMaterial({ color: 0xffffff }));
nStar.userData = { name: "Magnetic Pulsar", size: 15 }; 
interactables.push(nStar); 
pulsarGroup.add(nStar);

const pAura = new THREE.Sprite(new THREE.SpriteMaterial({ map: softGlowTex, color: 0x55aaff, transparent: true, blending: THREE.AdditiveBlending }));
pAura.scale.set(40, 40, 1); 
pulsarGroup.add(pAura);

const jetGeo = new THREE.CylinderGeometry(0.5, 15, 1500, 32, 1, true); 
const jetMat = new THREE.MeshBasicMaterial({ color: 0x4488ff, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
const pJet1 = new THREE.Mesh(jetGeo, jetMat); 
pJet1.position.y = 750; 
pulsarGroup.add(pJet1); 
const pJet2 = new THREE.Mesh(jetGeo, jetMat); 
pJet2.position.y = -750; 
pJet2.rotation.x = Math.PI; 
pulsarGroup.add(pJet2);

for(let i=0; i<4; i++) { 
    let torus = new THREE.Mesh(new THREE.TorusGeometry(15 + (i*6), 0.2, 16, 100), new THREE.MeshBasicMaterial({color: 0x00ffff, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending})); 
    torus.rotation.y = (Math.PI / 4) * i; 
    torus.rotation.x = Math.PI / 2.2; 
    pulsarGroup.add(torus); 
}

// INTERACTION LOGIC
const raycaster = new THREE.Raycaster(); 
const mouse = new THREE.Vector2();
let targetCamPos = null; 
let targetLookAt = null;

window.addEventListener('pointerdown', (event) => {
    if(event.target.tagName === 'BUTTON' || event.target.closest('.hud-panel') || event.target.closest('#info-panel')) return;
    
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
            const list = document.getElementById('infoFactsList'); 
            list.innerHTML = '';
            DATABASE[name].facts.forEach(f => { 
                let li = document.createElement('li'); 
                li.textContent = f; 
                list.appendChild(li); 
            });
            
            infoPanel.classList.add('visible'); 
            mainUI.classList.add('ui-hidden'); 
            btnFreeCam.style.display = 'block';
        }
        
        const wPos = new THREE.Vector3(); 
        mesh.getWorldPosition(wPos); 
        targetLookAt = wPos.clone();
        const safeDist = Math.max(mesh.userData.size * 4, 20); 
        targetCamPos = new THREE.Vector3(wPos.x + safeDist, wPos.y + (safeDist*0.5), wPos.z + safeDist);
        controls.target.copy(targetLookAt);
    }
});

// BOOT CAMERA
targetCamPos = new THREE.Vector3(0, 40, 150); 
targetLookAt = new THREE.Vector3(0, 0, 0);
controls.target.copy(targetLookAt);

function animate() {
  requestAnimationFrame(animate);
  
  sunCore.rotation.y += 0.002; 
  pulsarGroup.rotation.z += 0.08; 
  pulsarGroup.rotation.y += 0.04;
  
  planetDataList.forEach(p => { 
      p.mesh.rotation.y += 0.01;
      p.pivot.rotation.y += p.speed;
  });

  if (targetCamPos && targetLookAt) {
      camera.position.lerp(targetCamPos, 0.05); 
      if (camera.position.distanceTo(targetCamPos) < 0.5) { 
          targetCamPos = null; 
          targetLookAt = null; 
      }
  }
  
  controls.update(); 
  renderer.render(scene, camera);
}

window.addEventListener('resize', () => { 
    camera.aspect = window.innerWidth / window.innerHeight; 
    camera.updateProjectionMatrix(); 
    renderer.setSize(window.innerWidth, window.innerHeight); 
});
