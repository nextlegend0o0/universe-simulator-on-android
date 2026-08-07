/* =========================================
   1. CORE DATA: SOLAR SYSTEM ONLY
   ========================================= */
// Exact masses in kilograms and radii in kilometers.
// All nebulas, black holes, and pulsars have been removed.
const celestialBodies = {
    "Sun":     { mass: 1.989e30, radius: 696340, type: "Star" },
    "Mercury": { mass: 3.301e23, radius: 2439.7, type: "Planet" },
    "Venus":   { mass: 4.867e24, radius: 6051.8, type: "Planet" },
    "Earth":   { mass: 5.972e24, radius: 6371.0, type: "Planet" },
    "Mars":    { mass: 6.417e23, radius: 3389.5, type: "Planet" },
    "Jupiter": { mass: 1.898e27, radius: 69911,  type: "Planet" },
    "Saturn":  { mass: 5.683e26, radius: 58232,  type: "Planet" },
    "Uranus":  { mass: 8.681e25, radius: 25362,  type: "Planet" },
    "Neptune": { mass: 1.024e26, radius: 24622,  type: "Planet" }
};

let currentTarget = null; // The currently selected planet/star
let cameraLocked = false; // Tracks if the camera is locked to the target

/* =========================================
   2. UTILITY FUNCTIONS
   ========================================= */
// Formats mass into standard scientific notation (e.g., 1.989 × 10^30 kg)
// This replaces the old "Earths" calculation.
function formatMass(massInKg) {
    const exponential = massInKg.toExponential(3); // "1.989e+30"
    const parts = exponential.split('e+');
    if (parts.length === 2) {
        return `${parts[0]} × 10^${parts[1]} kg`;
    }
    return `${massInKg} kg`;
}

// Formats numbers with commas (e.g., 696,340)
function formatNumber(num) {
    return num.toLocaleString('en-US');
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

    // Hide Game UI and Menu initially
    mainMenu.classList.add('hidden');
    gameUi.classList.add('hidden');

    // Simulate Asset Loading (Replace with actual engine asset loading events)
    const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 15) + 5;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            
            // Fade out loading screen, reveal Main Menu
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.classList.add('hidden');
                mainMenu.classList.remove('hidden');
            }, 500); // Matches CSS transition time
        }
        progressText.innerText = `${progress}%`;
    }, 200);
}

/* =========================================
   4. BUTTON BINDINGS & UI CONTROLS
   ========================================= */
function bindUIControls() {
    // --- MAIN MENU BUTTONS ---
    const btnStartGame = document.getElementById('btn-start-game');
    if (btnStartGame) {
        btnStartGame.addEventListener('click', () => {
            document.getElementById('main-menu').classList.add('hidden');
            document.getElementById('game-ui').classList.remove('hidden');
            // Trigger engine start/resume here
        });
    }

    // --- FULLSCREEN TOGGLE ---
    const btnFullscreen = document.getElementById('btn-fullscreen');
    if (btnFullscreen) {
        btnFullscreen.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(err => {
                    console.log(`Error attempting to enable fullscreen: ${err.message}`);
                });
            } else {
                document.exitFullscreen();
            }
        });
    }

    // --- SIDEBAR "DISPLAY" AND "PHOTO" BUTTONS ---
    const btnDisplay = document.getElementById('btn-display-settings');
    if (btnDisplay) {
        btnDisplay.addEventListener('click', () => {
            // Logic to open display settings modal/tab
            console.log("Display settings opened");
        });
    }

    const btnPhoto = document.getElementById('btn-photo-mode');
    if (btnPhoto) {
        btnPhoto.addEventListener('click', () => {
            // Hide UI elements to take a clean screenshot
            document.getElementById('game-ui').classList.add('hidden');
            console.log("Photo mode activated. Press ESC to exit.");
            // Listen for ESC to bring UI back
            document.addEventListener('keydown', function escListener(e) {
                if (e.key === 'Escape') {
                    document.getElementById('game-ui').classList.remove('hidden');
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
                // Insert Engine logic to parent camera to currentTarget
                console.log(`Camera locked onto ${currentTarget}`);
            } else {
                btnTrack.innerText = "TRACK BODY";
                btnTrack.classList.remove('active');
                // Insert Engine logic to free camera
                console.log("Camera unlocked");
            }
        });
    }
}

/* =========================================
   5. PROPERTIES PANEL UPDATER
   ========================================= */
// Call this function when the user clicks a planet in the engine
function selectCelestialBody(bodyName) {
    const data = celestialBodies[bodyName];
    if (!data) return;

    currentTarget = bodyName;
    
    // Update DOM elements in the Properties panel
    document.getElementById('prop-name').value = bodyName;
    
    // FIX: Show exact mass instead of Earths
    document.getElementById('prop-mass').value = formatMass(data.mass); 
    
    document.getElementById('prop-radius').value = `${formatNumber(data.radius)} km`;
    
    // Reset tracking state visually when selecting a new body
    cameraLocked = false;
    const btnTrack = document.getElementById('btn-track-body');
    if (btnTrack) {
        btnTrack.innerText = "TRACK BODY";
        btnTrack.classList.remove('active');
    }

    console.log(`Selected: ${bodyName}`);
}

/* =========================================
   INITIALIZATION
   ========================================= */
document.addEventListener('DOMContentLoaded', () => {
    initializeBootSequence();
    bindUIControls();
    
    // Example: Select Earth by default once loaded
    setTimeout(() => {
        selectCelestialBody("Earth");
    }, 1000);
});
