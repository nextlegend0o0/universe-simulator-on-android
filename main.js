/* =========================================
   1. CORE DATA: SOLAR SYSTEM ONLY
   ========================================= */
// Exact masses in kilograms and radii in kilometers.
// Object.freeze prevents accidental modification during runtime.
const celestialBodies = Object.freeze({
    "Sun":     { mass: 1.989e30, radius: 696340, type: "Star" },
    "Mercury": { mass: 3.301e23, radius: 2439.7, type: "Planet" },
    "Venus":   { mass: 4.867e24, radius: 6051.8, type: "Planet" },
    "Earth":   { mass: 5.972e24, radius: 6371.0, type: "Planet" },
    "Mars":    { mass: 6.417e23, radius: 3389.5, type: "Planet" },
    "Jupiter": { mass: 1.898e27, radius: 69911,  type: "Planet" },
    "Saturn":  { mass: 5.683e26, radius: 58232,  type: "Planet" },
    "Uranus":  { mass: 8.681e25, radius: 25362,  type: "Planet" },
    "Neptune": { mass: 1.024e26, radius: 24622,  type: "Planet" }
});

let currentTarget = null; // The currently selected planet/star
let cameraLocked = false; // Tracks if the camera is locked to the target

/* =========================================
   2. UTILITY FUNCTIONS
   ========================================= */
// Safely formats mass into standard scientific notation handling positive/negative exponents
function formatMass(mass) {
    const [base, exponent] = mass.toExponential(3).split("e");
    return `${base} × 10^${Number(exponent)} kg`;
}

// Formats numbers with localized commas (e.g., 696,340)
function formatNumber(num) {
    return new Intl.NumberFormat().format(num);
}

/* =========================================
   3. LOADING SCREEN & MENU LOGIC
   ========================================= */
function initializeBootSequence() {
    let progress = 0;
    const progressText = document.getElementById('loading-progress');
    const loadingScreen = document.getElementById('loading-screen');
    const mainMenu = document.getElementById('main-menu');
    const gameUi = document.getElementById('game-ui');

    if (mainMenu) mainMenu.classList.add('hidden');
    if (gameUi) gameUi.classList.add('hidden');

    const interval = setInterval(() => {
        // Smoother, predictable loading progress
        progress = Math.min(progress + 2, 100);
        
        if (progress >= 100) {
            clearInterval(interval);
            
            if (loadingScreen) {
                loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    loadingScreen.classList.add('hidden');
                    if (mainMenu) mainMenu.classList.remove('hidden');
                }, 500);
            }
        }
        if (progressText) progressText.innerText = `${progress}%`;
    }, 50); 
}

/* =========================================
   4. BUTTON BINDINGS & UI CONTROLS
   ========================================= */
// Async fullscreen handling to prevent Promise errors
async function toggleFullscreen() {
    try {
        if (!document.fullscreenElement) {
            await document.documentElement.requestFullscreen();
        } else {
            await document.exitFullscreen();
        }
    } catch (err) {
        console.error(`Error attempting to toggle fullscreen: ${err.message}`);
    }
}

function bindUIControls() {
    // --- MAIN MENU BUTTONS ---
    const btnStartGame = document.getElementById('btn-start-game');
    if (btnStartGame) {
        btnStartGame.addEventListener('click', () => {
            const mainMenu = document.getElementById('main-menu');
            const gameUi = document.getElementById('game-ui');
            if (mainMenu) mainMenu.classList.add('hidden');
            if (gameUi) gameUi.classList.remove('hidden');
            // Trigger engine start/resume here
        });
    }

    // --- FULLSCREEN TOGGLE ---
    const btnFullscreen = document.getElementById('btn-fullscreen');
    if (btnFullscreen) {
        btnFullscreen.addEventListener('click', toggleFullscreen);
    }

    // --- SIDEBAR BUTTONS ---
    const btnDisplay = document.getElementById('btn-display-settings');
    if (btnDisplay) {
        btnDisplay.addEventListener('click', () => {
            console.log("Display settings opened");
        });
    }

    // --- PHOTO MODE ---
    const btnPhoto = document.getElementById('btn-photo-mode');
    if (btnPhoto) {
        btnPhoto.addEventListener('click', () => {
            const gameUi = document.getElementById('game-ui');
            if (gameUi) gameUi.classList.add('hidden');
            
            // Hide cursor for clean screenshots
            document.body.style.cursor = "none";
            console.log("Photo mode activated. Press ESC to exit.");
            
            document.addEventListener('keydown', function escListener(e) {
                if (e.key === 'Escape') {
                    if (gameUi) gameUi.classList.remove('hidden');
                    // Restore cursor
                    document.body.style.cursor = "default";
                    document.removeEventListener('keydown', escListener);
                }
            });
        });
    }

    // --- CAMERA TRACKING (UNLOCK/LOCK VIEW) ---
    const btnTrack = document.getElementById('btn-track-body');
    if (btnTrack) {
        btnTrack.addEventListener('click', () => {
            if (!currentTarget) return;
            
            cameraLocked = !cameraLocked;
            
            if (cameraLocked) {
                btnTrack.innerText = "UNLOCK VIEW";
                btnTrack.classList.add('active');
                console.log(`Camera locked onto ${currentTarget}`);
            } else {
                btnTrack.innerText = "TRACK BODY";
                btnTrack.classList.remove('active');
                console.log("Camera unlocked");
            }
        });
    }
}

/* =========================================
   5. PROPERTIES PANEL UPDATER
   ========================================= */
function selectCelestialBody(bodyName) {
    const data = celestialBodies[bodyName];
    if (!data) return;

    currentTarget = bodyName;
    
    // Safely update DOM elements to prevent runtime errors
    const nameBox = document.getElementById('prop-name');
    const massBox = document.getElementById('prop-mass');
    const radiusBox = document.getElementById('prop-radius');
    const btnTrack = document.getElementById('btn-track-body');

    if (nameBox) nameBox.value = bodyName;
    if (massBox) massBox.value = formatMass(data.mass); 
    if (radiusBox) radiusBox.value = `${formatNumber(data.radius)} km`;
    
    // Reset tracking state visually when selecting a new body
    cameraLocked = false;
    if (btnTrack) {
        btnTrack.innerText = "TRACK BODY";
        btnTrack.classList.remove('active');
    }

    console.log(`Selected: ${bodyName}`);
}

/* =========================================
   6. RENDER LOOP / ENGINE INTEGRATION
   ========================================= */
let fps = 0;
let lastTime = performance.now();

// Calculate and display accurate FPS
function updateFPS(now) {
    fps = Math.round(1000 / (now - lastTime));
    lastTime = now;
    
    // Assuming the FPS text is the first span in the bottom bar
    const fpsText = document.querySelector(".bottom-bar span");
    if (fpsText) fpsText.textContent = fps;
    
    // --- CAMERA SMOOTHING LOGIC (Engine implementation) ---
    if (cameraLocked && currentTarget) {
        // engine logic goes here
        // e.g., camera.position.lerp(target.position, 0.08);
        // e.g., camera.lookAt(target.position);
    }
    
    requestAnimationFrame(updateFPS);
}

/* =========================================
   INITIALIZATION
   ========================================= */
document.addEventListener('DOMContentLoaded', () => {
    initializeBootSequence();
    bindUIControls();
    
    // Start FPS counter
    requestAnimationFrame(updateFPS);
    
    // Auto-select Earth by default for testing
    setTimeout(() => {
        selectCelestialBody("Earth");
    }, 1000);
});
