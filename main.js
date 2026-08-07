/* =========================================
   SPACE SIMULATION V16.2 - MASTER PHYSICS 
   Merges ChatGPT Logic Audits with Three.js Rendering
   ========================================= */

// 1. CACHED DOM ELEMENTS (ChatGPT Audit #8: Avoid Repeated Lookups)
const UI = {
    container: document.getElementById('webgl-container'),
    loadingScreen: document.getElementById('loading-screen'),
    loadingProgress: document.getElementById('loading-progress'),
    mainMenu: document.getElementById('main-menu'),
    gameUi: document.getElementById('game-ui'),
    fpsText: document.getElementById('fps-display'),
    propWindow: document.getElementById('properties-window'),
    propName: document.getElementById('prop-name'),
    propMass: document.getElementById('prop-mass'),
    propRadius: document.getElementById('prop-radius'),
    btnStart: document.getElementById('btn-start-game'),
    btnFullscreen: document.getElementById('btn-fullscreen')
};

// 2. CELESTIAL DATA (ChatGPT Audit #2: Deep Freeze)
const celestialBodies = {
    "Sun":     { mass: 1.989e30, radius: 696340, dist: 0,   size: 10,  speed: 0,      type: "none" },
    "Mercury": { mass: 3.301e23, radius: 2439.7, dist: 25,  size: 0.8, speed: 0.04,   type: "mercury" },
    "Venus":   { mass: 4.867e24, radius: 6051.8, dist: 35,  size: 1.4, speed: 0.015,  type: "venus" },
    "Earth":   { mass: 5.972e24, radius: 6371.0, dist: 50,  size: 1.6, speed: 0.01,   type: "earthMap" },
    "Mars":    { mass: 6.417e23, radius: 3389.5, dist: 65,  size: 1.1, speed: 0.008,  type: "mars" },
    "Jupiter": { mass: 1.898e27, radius: 69911,  dist: 100, size: 4.5, speed: 0.004,  type: "jupiter", hasMoons: true },
    "Saturn":  { mass: 5.683e26, radius: 58232,  dist: 140, size: 3.8, speed: 0.002,  type: "saturn",  hasRings: true },
    "Uranus":  { mass: 8.681e25, radius: 25362,  dist: 170, size: 2.2, speed: 0.0015, type: "uranus" },
    "Neptune": { mass: 1.024e26, radius: 24622,  dist: 200, size: 2.1, speed: 0.001,  type: "neptune" }
};
Object.values(celestialBodies).forEach(Object.freeze);
Object.freeze(celestialBodies);

// 3. STATE MANAGEMENT (ChatGPT Audit #9: Structured Camera Data)
const engineState = {
    isPaused: false,
    simulationSpeed: 1.0,
    photoMode: false
};

const cameraState = {
    locked: false,
    target: null,
    smoothness: 0.08
};

// Formatting Utilities
function formatMass(mass) {
    const [base, exponent] = mass.toExponential(3).split("e");
    return `${base} × 10^${Number(exponent)} kg`;
}
function formatNumber(num) {
    return new Intl.NumberFormat().format(num);
}

// 4. THREE.JS SCENE SETUP (Restoring the missing 3D Engine!)
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0a0a0c, 0.001);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100000);
camera.position.set(0, 100, 250);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
if (UI.container) UI.container.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxDistance = 50000;
controls.minDistance = 5;

// Lighting & Skybox
scene.add(new THREE.AmbientLight(0x222222));
scene.add(new THREE.PointLight(0xffffff, 2.5, 10000));

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
scene.add(new THREE.Mesh(
    new THREE.SphereGeometry(40000, 64, 64),
    new THREE.MeshBasicMaterial({ map: textureLoader.load(TEX.stars), side: THREE.BackSide, depthWrite: false })
));

// 5. BUILD SOLAR SYSTEM
const interactables = [];
const renderBodies = [];
const sunGroup = new THREE.Group();
scene.add(sunGroup);

const sunMesh = new THREE.Mesh(new THREE.SphereGeometry(10, 64, 64), new THREE.MeshBasicMaterial({ color: 0xffaa00 }));
sunMesh.userData = { name: "Sun" };
interactables.push(sunMesh);
sunGroup.add(sunMesh);

Object.keys(celestialBodies).forEach(key => {
    if (key === "Sun") return;
    const data = celestialBodies[key];
    
    const pivot = new THREE.Group();
    scene.add(pivot);

    const mat = new THREE.MeshStandardMaterial({ map: textureLoader.load(TEX[data.type] || TEX.moon), roughness: 0.6 });
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(data.size, 64, 64), mat);
    mesh.position.x = data.dist;
    mesh.userData = { name: key };
    pivot.add(mesh);
    interactables.push(mesh);

    // Orbit Tracers
    const ringGeo = new THREE.RingGeometry(data.dist - 0.2, data.dist + 0.2, 128);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x4daafc, side: THREE.DoubleSide, transparent: true, opacity: 0.08 });
    const orbitLine = new THREE.Mesh(ringGeo, ringMat);
    orbitLine.rotation.x = Math.PI / 2;
    scene.add(orbitLine);

    renderBodies.push({ pivot, mesh, speed: data.speed });
});

// 6. RAYCASTER & INTERACTION (ChatGPT Audit #5 & #10: Safe Lookup & Error Handling)
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('pointermove', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    
    if (raycaster.intersectObjects(interactables, false).length > 0) {
        UI.container.classList.add('interactive-cursor');
    } else {
        UI.container.classList.remove('interactive-cursor');
    }
});

window.addEventListener('pointerdown', (e) => {
    // Block raycaster if clicking on a UI panel
    if (e.target.closest('.floating-window') || e.target.closest('#left-toolbar') || e.target.closest('#bottom-bar') || e.target.closest('#main-menu')) return;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(interactables, false);

    if (intersects.length > 0) {
        const bodyName = intersects[0].object.userData.name;
        
        if (!(bodyName in celestialBodies)) {
            console.warn(`Unknown celestial body: ${bodyName}`);
            return;
        }

        const data = celestialBodies[bodyName];
        cameraState.target = intersects[0].object;
        cameraState.locked = true;

        if (UI.propWindow) {
            UI.propName.value = bodyName;
            UI.propMass.value = formatMass(data.mass);
            UI.propRadius.value = `${formatNumber(data.radius)} km`;
            UI.propWindow.classList.add('open');
        }
    } else {
        cameraState.locked = false;
        cameraState.target = null;
        if (UI.propWindow) UI.propWindow.classList.remove('open');
        controls.target.set(0, 0, 0);
    }
});

// 7. EVENT LISTENERS (ChatGPT Audits #4, #13, #14: Resize, Focus & Fullscreen Fixes)
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

document.addEventListener("visibilitychange", () => {
    engineState.isPaused = document.hidden;
});

if (UI.btnFullscreen) {
    UI.btnFullscreen.addEventListener('click', async () => {
        if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
        } else if (document.exitFullscreen) {
            await document.exitFullscreen();
        }
    });
}

// 8. RENDER LOOP (ChatGPT Audit #1: 1-Second Average FPS Fix)
let frameCount = 0;
let fps = 0;
let lastFPSUpdate = performance.now();

function animate(now) {
    requestAnimationFrame(animate);
    
    // Halt physics if user minimizes the app
    if (engineState.isPaused) return;

    // Stable FPS Calculation
    frameCount++;
    if (now - lastFPSUpdate >= 1000) {
        fps = frameCount;
        frameCount = 0;
        lastFPSUpdate = now;
        if (UI.fpsText) UI.fpsText.textContent = `FPS: ${fps}`;
    }

    // Planetary Rotations
    sunGroup.rotation.y += 0.002 * engineState.simulationSpeed;
    renderBodies.forEach(body => {
        body.mesh.rotation.y += 0.01 * engineState.simulationSpeed;
        body.pivot.rotation.y += body.speed * engineState.simulationSpeed;
    });

    // Smooth Camera Tracking
    if (cameraState.locked && cameraState.target) {
        const wPos = new THREE.Vector3();
        cameraState.target.getWorldPosition(wPos);
        controls.target.lerp(wPos, cameraState.smoothness);
    }

    controls.update();
    renderer.render(scene, camera);
}

// 9. BOOT SEQUENCE
function initializeBootSequence() {
    let progress = 0;
    
    const interval = setInterval(() => {
        progress = Math.min(progress + 5, 100);
        if (UI.loadingProgress) UI.loadingProgress.innerText = `${progress}%`;
        
        if (progress >= 100) {
            clearInterval(interval);
            if (UI.loadingScreen) {
                UI.loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    UI.loadingScreen.classList.add('hidden');
                    if (UI.mainMenu) UI.mainMenu.classList.remove('hidden');
                }, 500);
            }
        }
    }, 50); 
}

if (UI.btnStart) {
    UI.btnStart.addEventListener('click', () => {
        if (UI.mainMenu) UI.mainMenu.classList.add('hidden');
        if (UI.gameUi) UI.gameUi.classList.remove('hidden');
    });
}

// Launch Game
document.addEventListener('DOMContentLoaded', () => {
    initializeBootSequence();
    requestAnimationFrame(animate);
});
