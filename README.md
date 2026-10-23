# Orbital Cipher — Free Flight

A free-flight 3D space experience built with Vite and Three.js. It uses the supplied satellite GLB files, a locally bundled Earth texture, an optional live camera backdrop, and a browser-based AES-GCM telemetry mission. Camera access is requested only after tapping **CAMERA**; the app does not use AR.js/Hiro tracking.

## Run locally

1. Open this folder in VS Code.
2. In the integrated terminal, run `npm install` once.
3. Run `npm run dev -- --host 0.0.0.0 --port 5173`.
4. Open [http://localhost:5173/](http://localhost:5173/) in a modern browser.
5. Drag to orbit around the satellite and scroll or pinch to zoom. On a phone, tap **MOTION**, then turn or tilt the phone to look around. Drag and pinch continue to work while motion control is enabled. Select AIM or either AcrimSAT option in the left panel.
6. Tap **CAMERA** to request the rear camera and show a live, translucent camera view behind the 3D satellite and space graphics. Tap it again to stop the camera. The camera is off until you press this button.
7. On a phone, use the **⌄** control on Mission Control to hide the encryption bench and the **MISSION CONTROL** button to bring it back. The mobile layout leaves room for Android's system bars.
8. In Mission Control, edit the telemetry payload if you like, select **Encrypt Packet**, then **Transmit to Ground**, and finally **Run Tamper Challenge**.

The first install needs internet access for the npm packages. The satellite GLBs, Draco decoder, and Earth texture are included locally after that. Web Crypto, phone motion sensors, and camera access need localhost or HTTPS. For a physical phone visiting a server on your computer, use an HTTPS address; the phone's `localhost` is the phone itself. On iOS, Safari asks for motion permission after you tap **MOTION**, and the browser asks for camera permission after you tap **CAMERA**.

## Mission behavior

- Encryption uses the browser's Web Crypto API with AES-256-GCM, a new random 96-bit IV, and a 128-bit authentication tag.
- The encryption key and telemetry remain in the current page's memory. Only the XP score is saved in local storage.
- The transmission is a visual simulation inside the 3D scene; no radio link or external service is contacted.
- The tamper challenge flips one ciphertext bit and demonstrates that AES-GCM rejects the altered packet before releasing plaintext.
- Earth, orbit, and the ground station are visual scale approximations for an educational experience, not live orbital data.

## Assets and attribution

- The AIM and AcrimSAT models were provided by the project owner. Their original source and reuse terms were not supplied with the files.
- Earth surface map: NASA Earth Observatory, [Blue Marble: Next Generation — January base map](https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/base-map/), 5400 × 2700 global JPEG. The map is a satellite-data composite produced by Reto Stöckli and NASA Goddard Space Flight Center.
- Draco decoder files are copied from the installed Three.js package and served locally from `public/draco/`.
