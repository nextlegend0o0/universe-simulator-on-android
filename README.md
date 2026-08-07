# 🌌 Vortex Engine V16.1 PRO

> A high-performance, browser-based 3D celestial physics simulator optimized for mobile touchscreens.

Vortex Engine is a custom-built, lightweight 3D space simulation running directly in the browser. Built on a modular Three.js architecture, it renders our solar system and deep-space anomalies with high-fidelity graphics and real-time orbital mechanics. 

---

## 🚀 Live Demo
**Play the Simulation:** [Vortex Engine on GitHub Pages](https://nextlegend0o0.github.io/universe-simulator-on-android/)

---

## ⚙️ Core Features

* **Interactive Raycasting:** Tap any celestial body to instantly lock the cinematic camera and pull up real-time telemetry (Mass, Radius, Velocity).
* **Dynamic Time-Warp:** Manipulate the fabric of time. Pause the simulation or accelerate orbital mechanics to watch planets whip around the sun via the custom slider interface.
* **AAA "Pro Simulator" UI:** A heavy-duty, data-driven user interface featuring draggable floating panels, tabbed navigation, and a live bottom telemetry bar tracking FPS and active render bodies.
* **High-Fidelity Graphics:** Features 4K texture mapping, volumetric procedural glowing auras for stars, and neon orbital tracers.
* **Deep Space Entities:** Navigate beyond the local solar system to discover custom-built anomalies, including a highly magnetized Neutron Pulsar and a Supermassive Black Hole.
* **Mobile-First Optimization:** Built specifically for Android browsers with integrated OS-level fullscreen locks, touch-drag camera damping, and landscape orientation enforcement.

---

## 🛠️ Technical Architecture

This engine was completely refactored from a static HTML layout into a professional, modular 3-file system to maximize deployment stability and code cleanliness.

* **Language Breakdown:** JavaScript (~50%), CSS (~38%), HTML (~12%)
* **Rendering Engine:** WebGL via Three.js (r128)
* **Camera System:** Customized `OrbitControls.js` with cinematic lerping and touch-damping.
* **Deployment:** Hosted directly on GitHub Pages using branch-based deployment to bypass Jekyll processing bottlenecks.

---

## 📂 File Structure

* `index.html` - The core application shell, UI scaffolding, and cache-busting entry point.
* `style.css` - The master stylesheet dictating the dark-glass, neon-accented physics simulator aesthetic.
* `main.js` - The heavy-duty engine logic, handling the render loop, celestial math, UI event listeners, and raycaster interactions.

---

## 📜 Development Status
**Current Version:** V16.1 STABLE (Pro Simulator Build)
**Status:** System Nominal. All celestial bodies active.
