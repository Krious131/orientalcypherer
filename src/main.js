import './styles.css';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const ships = [
  { id: 'aim', name: 'AIM', full: 'Aeronomy of Ice in the Mesosphere', type: 'Atmospheric science', file: '/models/aim.glb', hue: 'cyan' },
  { id: 'acrim-a', name: 'ACRIMSAT · A', full: 'Active Cavity Radiometer Irradiance Monitor', type: 'Solar irradiance', file: '/models/acrimsat-a.glb', hue: 'gold' },
  { id: 'acrim-b', name: 'ACRIMSAT · B', full: 'Active Cavity Radiometer Irradiance Monitor', type: 'Solar irradiance', file: '/models/acrimsat-b.glb', hue: 'blue' },
];

document.querySelector('#app').innerHTML = `
  <main class="experience">
    <video id="camera-feed" autoplay muted playsinline aria-hidden="true"></video>
    <canvas id="space-canvas" aria-label="Interactive 3D space scene"></canvas>
    <div class="vignette" aria-hidden="true"></div>
    <header class="topbar">
      <a class="brand" href="#"><span class="brand-icon">OC</span><span>ORBITAL <b>CIPHER</b><small>MISSION SYSTEMS / FREE FLIGHT</small></span></a>
      <div class="live"><i></i> SIMULATION LIVE <span class="divider">/</span> EARTH ORBIT</div>
      <div class="header-right"><span class="level-chip">LEVEL <b id="level">01</b></span><span class="xp-chip"><b id="xp">0</b> XP</span><button class="motion-toggle" id="motion-toggle" aria-label="Enable phone motion controls" aria-pressed="false" title="Enable phone motion controls">◉ <span>MOTION</span></button><button class="motion-toggle camera-toggle" id="camera-toggle" aria-label="Start live camera background" aria-pressed="false" title="Show the live camera behind the space overlay">▧ <span>CAMERA</span></button><button class="icon-button" id="fullscreen" aria-label="Toggle fullscreen" title="Toggle fullscreen">⛶</button></div>
    </header>
    <section class="ship-panel glass">
      <div class="section-kicker">01 / SPACECRAFT</div><h1>Choose your<br /><em>spacecraft.</em></h1>
      <p class="muted intro">Inspect satellites in free flight, or use the live camera as the backdrop.</p>
      <div id="ship-list" class="ship-list"></div>
      <div class="control-hint"><span class="mouse-glyph">↗</span><span><b>DRAG</b> to orbit <i>·</i> <b>SCROLL</b> to zoom<br /><small>Touch: drag and pinch · Phone: tap ◉ then turn</small></span></div>
    </section>
    <aside class="mission-panel glass" id="mission-panel">
      <div class="mission-heading"><div><div class="section-kicker">02 / ENCRYPTION MISSION</div><h2>Secure the signal.</h2></div><span class="mission-number">01</span><button class="mission-collapse" id="mission-collapse" aria-label="Hide encryption bench" title="Hide encryption bench">⌄</button></div>
      <p class="mission-copy">Telemetry is exposed in transit. Encrypt a packet, send it to the ground station, then test the link against tampering.</p>
      <div class="mission-track"><span class="track-fill" id="track-fill"></span><i class="track-dot active" id="step-1"></i><i class="track-dot" id="step-2"></i><i class="track-dot" id="step-3"></i></div>
      <div class="step-labels"><span>ENCRYPT</span><span>TRANSMIT</span><span>VERIFY</span></div>
      <label class="field-label" for="message">TELEMETRY PAYLOAD <span>UTF-8</span></label>
      <textarea id="message" maxlength="140" rows="2">RESTORE TELEMETRY / AUTHENTICATE SIGNAL</textarea>
      <button class="action primary" id="encrypt"><span class="action-icon">⌑</span> ENCRYPT PACKET <span class="arrow">↗</span></button>
      <div class="packet" id="packet" hidden>
        <div class="packet-row"><span>ALGORITHM</span><b>AES-256-GCM</b></div>
        <div class="packet-row"><span>RANDOM IV · 96 BIT</span><code id="iv-value">—</code></div>
        <div class="packet-row"><span>CIPHERTEXT</span><code id="cipher-value">—</code></div>
        <div class="packet-row"><span>AUTH TAG · 128 BIT</span><code id="tag-value">—</code></div>
        <div class="packet-note"><i></i> Key generated locally · never sent</div>
      </div>
      <button class="action secondary" id="transmit" disabled><span class="action-icon">⌁</span> TRANSMIT TO GROUND <span class="arrow">↗</span></button>
      <div class="mission-result" id="result" aria-live="polite">Awaiting secure packet.</div>
      <button class="tamper-button" id="tamper" disabled>↯ &nbsp; RUN TAMPER CHALLENGE <span>+50 XP</span></button>
      <div class="mission-foot"><span>MISSION REWARD</span><b>+100 XP</b><button id="reset" title="Restart mission">↻</button></div>
    </aside>
    <button class="mission-reopen" id="mission-reopen" aria-controls="mission-panel" aria-expanded="true"><span>▤</span> MISSION CONTROL</button>
    <div class="scene-caption"><span class="caption-mark">◎</span><div><b id="ship-caption">AIM · SCIENCE ORBITER</b><small>EARTH · 3D SIMULATION</small></div></div>
    <div class="toast" id="toast" role="status" aria-live="polite"></div>
    <div class="loading" id="loading"><span class="loader"></span><b>INITIALIZING ORBIT</b><small>Loading local spacecraft and Earth imagery…</small></div>
    <footer class="bottom-note">FREE FLIGHT SIMULATION <span>·</span> DRAG TO EXPLORE <span>·</span> NO CAMERA OR MARKER REQUIRED</footer>
  </main>`;

const canvas = document.querySelector('#space-canvas');
const cameraFeed = document.querySelector('#camera-feed');
const cameraToggle = document.querySelector('#camera-toggle');
const experience = document.querySelector('.experience');
const missionCollapse = document.querySelector('#mission-collapse');
const missionReopen = document.querySelector('#mission-reopen');
function setMissionPanelOpen(open) {
  experience.classList.toggle('mission-collapsed', !open);
  missionReopen.setAttribute('aria-expanded', String(open));
  missionCollapse.setAttribute('aria-expanded', String(open));
  missionCollapse.setAttribute('aria-label', open ? 'Hide encryption bench' : 'Show encryption bench');
}
missionCollapse.addEventListener('click', () => setMissionPanelOpen(false));
missionReopen.addEventListener('click', () => setMissionPanelOpen(true));

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.13;
renderer.setClearColor(0x000000, 0);

const scene = new THREE.Scene();
const spaceBackground = new THREE.Color('#030712');
const spaceFog = new THREE.FogExp2('#030712', 0.0016);
scene.background = spaceBackground;
scene.fog = spaceFog;
const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 550);
camera.position.set(0, 1.8, 13.7);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.055;
controls.minDistance = 5.2;
controls.maxDistance = 27;
controls.maxPolarAngle = Math.PI * 0.82;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.32;

// Phone orientation adds a calibrated view offset while OrbitControls stays active underneath.
// Thus mouse/touch drag and zoom continue to work exactly as before.
const motionButton = document.querySelector('#motion-toggle');
const deviceEuler = new THREE.Euler();
const deviceQuaternion = new THREE.Quaternion();
const inverseScreenQuaternion = new THREE.Quaternion();
const screenAxis = new THREE.Vector3(0, 0, 1);
const cameraCorrection = new THREE.Quaternion(-Math.SQRT1_2, 0, 0, Math.SQRT1_2);
const sensorBaseline = new THREE.Quaternion();
const sensorRelative = new THREE.Quaternion();
const sensorAngles = new THREE.Euler(0, 0, 0, 'YXZ');
const sensorOffset = { yaw: 0, pitch: 0 };
let motionEnabled = false;
let sensorReady = false;
let sensorEvents = 0;
let screenAngle = 0;
const orientationHandler = (event) => {
  if (event.alpha == null && event.beta == null && event.gamma == null) return;
  sensorEvents++;
  deviceEuler.set(THREE.MathUtils.degToRad(event.beta || 0), THREE.MathUtils.degToRad(event.alpha || 0), -THREE.MathUtils.degToRad(event.gamma || 0), 'YXZ');
  deviceQuaternion.setFromEuler(deviceEuler);
  deviceQuaternion.multiply(cameraCorrection);
  inverseScreenQuaternion.setFromAxisAngle(screenAxis, -THREE.MathUtils.degToRad(screenAngle));
  deviceQuaternion.multiply(inverseScreenQuaternion);
  if (!sensorReady) {
    sensorBaseline.copy(deviceQuaternion);
    sensorReady = true;
    return;
  }
  sensorRelative.copy(sensorBaseline).invert().multiply(deviceQuaternion).normalize();
  sensorAngles.setFromQuaternion(sensorRelative, 'YXZ');
  // Keep the motion mapping intuitive and comfortably limited for small hand movements.
  sensorOffset.yaw = THREE.MathUtils.clamp(sensorAngles.y, -Math.PI * 0.47, Math.PI * 0.47);
  sensorOffset.pitch = THREE.MathUtils.clamp(sensorAngles.x, -Math.PI * 0.32, Math.PI * 0.32);
};
const updateScreenAngle = () => {
  screenAngle = Number(window.screen?.orientation?.angle ?? window.orientation ?? 0);
  if (motionEnabled) {
    sensorReady = false;
    sensorOffset.yaw = 0;
    sensorOffset.pitch = 0;
  }
};
updateScreenAngle();
window.screen?.orientation?.addEventListener?.('change', updateScreenAngle);
function stopPhoneMotion() {
  window.removeEventListener('deviceorientation', orientationHandler, true);
  motionEnabled = false;
  sensorReady = false;
  sensorEvents = 0;
  sensorOffset.yaw = 0;
  sensorOffset.pitch = 0;
  controls.autoRotate = true;
  motionButton.classList.remove('enabled');
  motionButton.setAttribute('aria-pressed', 'false');
  motionButton.setAttribute('aria-label', 'Enable phone motion controls');
  motionButton.title = 'Enable phone motion controls';
  motionButton.innerHTML = '◉ <span>MOTION</span>';
}
motionButton.addEventListener('click', async () => {
  if (motionEnabled) {
    stopPhoneMotion();
    toast('Phone motion off. Drag, scroll, and pinch controls are still available.');
    return;
  }
  if (!('DeviceOrientationEvent' in window)) {
    toast('This browser has no phone orientation sensor. Drag and pinch still work.');
    return;
  }
  try {
    // iOS Safari requires this permission request to happen directly in a button tap.
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      const permission = await DeviceOrientationEvent.requestPermission();
      if (permission !== 'granted') {
        toast('Motion access was not granted. Drag and pinch controls remain available.');
        return;
      }
    }
    updateScreenAngle();
    sensorReady = false;
    sensorEvents = 0;
    sensorOffset.yaw = 0;
    sensorOffset.pitch = 0;
    window.addEventListener('deviceorientation', orientationHandler, true);
    motionEnabled = true;
    controls.autoRotate = false;
    motionButton.classList.add('enabled');
    motionButton.setAttribute('aria-pressed', 'true');
    motionButton.setAttribute('aria-label', 'Disable phone motion controls');
    motionButton.title = 'Phone motion controls are on';
    motionButton.innerHTML = '◉ <span>ON</span>';
    setTimeout(() => {
      if (motionEnabled && sensorEvents === 0) {
        stopPhoneMotion();
        toast('No phone motion readings received. Open this on a motion-enabled phone over HTTPS or localhost.');
      } else if (motionEnabled) {
        toast('Phone motion on. Turn your phone to look around; drag and pinch still work.');
      }
    }, 1400);
  } catch (error) {
    console.warn('Phone motion permission could not be enabled:', error);
    toast('Phone motion could not start. Drag and pinch controls are still available.');
  }
});

scene.add(new THREE.HemisphereLight(0xa8ccff, 0x11131d, 1.05));
const sun = new THREE.DirectionalLight(0xffe7c4, 4.1);
sun.position.set(-18, 24, 22);
scene.add(sun);
const fill = new THREE.DirectionalLight(0x579dff, 1.15);
fill.position.set(18, -2, -8);
scene.add(fill);

// Deep field: deterministic-looking stars at varied distances plus subtle colored nebula clouds.
const starCount = 6200;
const starPositions = new Float32Array(starCount * 3);
const starColors = new Float32Array(starCount * 3);
const starSizes = new Float32Array(starCount);
const colorChoices = [new THREE.Color('#ffffff'), new THREE.Color('#93c5fd'), new THREE.Color('#f7d9b1'), new THREE.Color('#becaff')];
for (let i = 0; i < starCount; i++) {
  const radius = 135 + Math.random() * 140;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  starPositions.set([radius * Math.sin(phi) * Math.cos(theta), radius * Math.cos(phi), radius * Math.sin(phi) * Math.sin(theta)], i * 3);
  const c = colorChoices[Math.floor(Math.random() * colorChoices.length)];
  starColors.set([c.r, c.g, c.b], i * 3);
  starSizes[i] = 0.55 + Math.random() * 1.9;
}
const starGeo = new THREE.BufferGeometry();
starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
starGeo.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));
const starMat = new THREE.PointsMaterial({ size: 0.7, vertexColors: true, transparent: true, opacity: 0.92, sizeAttenuation: true, depthWrite: false });
scene.add(new THREE.Points(starGeo, starMat));

const nebula = new THREE.Mesh(new THREE.SphereGeometry(330, 32, 24), new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false,
  vertexShader: `varying vec3 vDir; void main(){ vDir=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader: `varying vec3 vDir; float hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);} float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.0-2.0);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);} void main(){vec3 d=normalize(vDir); float n=noise(d*5.0)+0.45*noise(d*11.0); float cloud=smoothstep(0.77,1.3,n); vec3 c=mix(vec3(0.008,0.014,0.04),vec3(0.035,0.09,0.21),cloud); c+=vec3(0.10,0.035,0.18)*smoothstep(0.93,1.35,n)*smoothstep(-0.1,0.65,d.x); gl_FragColor=vec4(c,1.0);}`
}));
scene.add(nebula);

// Optional camera passthrough: the space scene becomes transparent so the 3D overlay
// composites over live surroundings. The camera starts only after the user taps the control.
let cameraStream = null;
cameraToggle.addEventListener('click', async () => {
  if (cameraStream) {
    cameraStream.getTracks().forEach((track) => track.stop());
    cameraStream = null;
    cameraFeed.pause();
    cameraFeed.srcObject = null;
    experience.classList.remove('camera-active');
    scene.background = spaceBackground;
    scene.fog = spaceFog;
    nebula.visible = true;
    cameraToggle.classList.remove('enabled');
    cameraToggle.setAttribute('aria-pressed', 'false');
    cameraToggle.setAttribute('aria-label', 'Start live camera background');
    cameraToggle.innerHTML = '▧ <span>CAMERA</span>';
    toast('Live camera off. Space scene restored.');
    return;
  }
  if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
    toast('Camera view requires HTTPS or localhost in a browser that supports camera access.');
    return;
  }
  cameraToggle.disabled = true;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
    });
    cameraStream = stream;
    cameraFeed.srcObject = stream;
    await cameraFeed.play();
    scene.background = null;
    scene.fog = null;
    nebula.visible = false;
    experience.classList.add('camera-active');
    cameraToggle.classList.add('enabled');
    cameraToggle.setAttribute('aria-pressed', 'true');
    cameraToggle.setAttribute('aria-label', 'Stop live camera background');
    cameraToggle.innerHTML = '▧ <span>CAMERA ON</span>';
    toast('Live camera on. Satellite and space graphics are overlaid on your surroundings.');
  } catch (error) {
    console.warn('Live camera could not start:', error);
    toast(error.name === 'NotAllowedError' ? 'Camera access was denied. Allow camera access in your browser to use the live background.' : 'Could not start the camera. Check browser permissions and try again.');
  } finally {
    cameraToggle.disabled = false;
  }
});
window.addEventListener('pagehide', () => cameraStream?.getTracks().forEach((track) => track.stop()));

// NASA Blue Marble base map, bundled locally. Earth is a cinematic scene backdrop, not to scale.
const earthCenter = new THREE.Vector3(0, -25, -76);
const earthRadius = 48;
const earthRig = new THREE.Group();
earthRig.position.copy(earthCenter);
scene.add(earthRig);
const textureLoader = new THREE.TextureLoader();
const earthTexture = textureLoader.load('/textures/earth-blue-marble.jpg');
earthTexture.colorSpace = THREE.SRGBColorSpace;
earthTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
const earth = new THREE.Mesh(new THREE.SphereGeometry(earthRadius, 96, 72), new THREE.MeshStandardMaterial({ map: earthTexture, roughness: 0.92, metalness: 0.02, emissive: new THREE.Color('#07152c'), emissiveIntensity: 0.12 }));
earth.rotation.y = -0.42;
earthRig.add(earth);
const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(earthRadius * 1.026, 96, 64), new THREE.ShaderMaterial({
  side: THREE.BackSide, transparent: true, depthWrite: false,
  vertexShader: `varying vec3 vNormal; varying vec3 vView; void main(){vec4 mv=modelViewMatrix*vec4(position,1.0);vNormal=normalize(normalMatrix*normal);vView=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}`,
  fragmentShader: `varying vec3 vNormal; varying vec3 vView; void main(){float rim=pow(1.0-max(dot(normalize(vNormal),normalize(vView)),0.0),3.2);gl_FragColor=vec4(0.18,0.52,1.0,rim*0.7);}`
}));
earthRig.add(atmosphere);
const groundPoint = earthCenter.clone().add(new THREE.Vector3(0, 0.47, 0.88).normalize().multiplyScalar(earthRadius * 1.006));
const station = new THREE.Group();
station.position.copy(groundPoint);
station.lookAt(earthCenter);
scene.add(station);
const stationBase = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.23, 0.12, 12), new THREE.MeshStandardMaterial({ color: '#d6e5f5', metalness: 0.7, roughness: 0.28, emissive: '#153e60', emissiveIntensity: 0.3 }));
station.add(stationBase);
const stationBeacon = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 12), new THREE.MeshBasicMaterial({ color: '#5df5ff' }));
stationBeacon.position.y = 0.2;
station.add(stationBeacon);
const beaconLight = new THREE.PointLight('#39e7ff', 4, 3);
beaconLight.position.y = 0.2;
station.add(beaconLight);

const shipPivot = new THREE.Group();
scene.add(shipPivot);
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/');
const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);
let currentShip = ships[0];
let loadedShip = null;
let missionKey = null;
let activePacket = null;
let missionStep = 0;
let xp = Number(localStorage.getItem('orbital-cipher-xp') || 0);
const toast = (message) => {
  const node = document.querySelector('#toast'); node.textContent = message; node.classList.add('show');
  clearTimeout(toast.timer); toast.timer = setTimeout(() => node.classList.remove('show'), 3200);
};
const fitModel = (root, maxSize = 4.6) => {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const largest = Math.max(size.x, size.y, size.z) || 1;
  const scale = maxSize / largest;
  const wrapper = new THREE.Group();
  wrapper.scale.setScalar(scale);
  wrapper.position.copy(center).multiplyScalar(-scale);
  wrapper.add(root);
  return wrapper;
};
function renderShipCards() {
  document.querySelector('#ship-list').innerHTML = ships.map((ship, index) => `
    <button class="ship-card ${ship.id === currentShip.id ? 'selected' : ''}" data-ship="${ship.id}">
      <span class="ship-index">0${index + 1}</span><span class="ship-symbol ${ship.hue}">${index === 0 ? '◈' : '✣'}</span>
      <span class="ship-copy"><b>${ship.name}</b><small>${ship.type}</small></span><span class="select-mark">↗</span>
    </button>`).join('');
  document.querySelectorAll('[data-ship]').forEach((button) => button.addEventListener('click', () => selectShip(button.dataset.ship)));
}
async function selectShip(id) {
  const ship = ships.find((item) => item.id === id);
  if (!ship || ship.id === currentShip.id && loadedShip) return;
  currentShip = ship;
  renderShipCards();
  document.querySelector('#loading').classList.add('visible');
  try {
    const gltf = await loader.loadAsync(ship.file);
    if (currentShip.id !== ship.id) return;
    const wrapper = fitModel(gltf.scene);
    if (loadedShip) shipPivot.remove(loadedShip);
    loadedShip = wrapper;
    shipPivot.add(wrapper);
    document.querySelector('#ship-caption').textContent = `${ship.name} · ${ship.type.toUpperCase()}`;
    document.querySelector('#loading').classList.remove('visible');
    toast(`${ship.name} ready for inspection.`);
  } catch (error) {
    console.error('Spacecraft could not be loaded:', error);
    document.querySelector('#loading').classList.remove('visible');
    toast(`Could not load ${ship.name}. Check that its GLB file is present in public/models.`);
  }
}
renderShipCards();
selectShip(currentShip.id);

function updateXP(amount) {
  xp += amount;
  localStorage.setItem('orbital-cipher-xp', String(xp));
  document.querySelector('#xp').textContent = xp;
  document.querySelector('#level').textContent = String(Math.floor(xp / 250) + 1).padStart(2, '0');
}
document.querySelector('#xp').textContent = xp;
document.querySelector('#level').textContent = String(Math.floor(xp / 250) + 1).padStart(2, '0');
function markStep(step) {
  missionStep = Math.max(missionStep, step);
  document.querySelector('#track-fill').style.width = `${(missionStep / 3) * 100}%`;
  for (let index = 1; index <= 3; index++) document.querySelector(`#step-${index}`).classList.toggle('active', index <= missionStep);
}
const bytesToHex = (buffer) => [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, '0')).join('').toUpperCase();
const bytesToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer); let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
};
const setResult = (html, state = '') => { const el = document.querySelector('#result'); el.innerHTML = html; el.className = `mission-result ${state}`; };
document.querySelector('#encrypt').addEventListener('click', async () => {
  const plainText = document.querySelector('#message').value.trim();
  if (!plainText) { toast('Enter telemetry before encrypting.'); return; }
  if (!globalThis.crypto?.subtle) { toast('Web Crypto requires localhost or HTTPS in a modern browser.'); return; }
  try {
    missionKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(plainText);
    const cipherAndTag = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, tagLength: 128 }, missionKey, encoded);
    const bytes = new Uint8Array(cipherAndTag);
    activePacket = { iv, cipherAndTag, cipher: bytes.slice(0, -16), tag: bytes.slice(-16), plainText };
    document.querySelector('#iv-value').textContent = bytesToHex(iv);
    document.querySelector('#cipher-value').textContent = bytesToBase64(activePacket.cipher);
    document.querySelector('#tag-value').textContent = bytesToHex(activePacket.tag);
    document.querySelector('#packet').hidden = false;
    document.querySelector('#transmit').disabled = false;
    document.querySelector('#tamper').disabled = true;
    document.querySelector('#encrypt').disabled = true;
    setResult('<b>PACKET SEALED</b><span>Authenticated ciphertext is ready for transmission.</span>', 'success');
    markStep(1);
    toast('AES-256-GCM packet sealed.');
  } catch (error) {
    console.error(error); setResult('<b>ENCRYPTION FAILED</b><span>Your browser could not create the secure packet.</span>', 'error');
  }
});
function animateTransmission() {
  return new Promise((resolve) => {
    const start = new THREE.Vector3(0, 0, 0);
    const end = station.position.clone().add(new THREE.Vector3(0, 0.3, 0));
    const mid = start.clone().lerp(end, 0.5).add(new THREE.Vector3(0, 2.2, 0));
    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    const points = curve.getPoints(60);
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineDashedMaterial({ color: '#59eaff', dashSize: 0.36, gapSize: 0.18, transparent: true, opacity: 0.82 }));
    line.computeLineDistances(); scene.add(line);
    const packet = new THREE.Mesh(new THREE.IcosahedronGeometry(0.19, 2), new THREE.MeshBasicMaterial({ color: '#85f5ff' }));
    const glow = new THREE.PointLight('#48dfff', 7, 8); packet.add(glow); scene.add(packet);
    const startTime = performance.now(); const duration = 2300;
    const tick = (time) => {
      const progress = Math.min((time - startTime) / duration, 1);
      packet.position.copy(curve.getPoint(progress));
      if (progress < 1) requestAnimationFrame(tick);
      else { scene.remove(packet); scene.remove(line); line.geometry.dispose(); line.material.dispose(); packet.geometry.dispose(); packet.material.dispose(); resolve(); }
    };
    requestAnimationFrame(tick);
  });
}
document.querySelector('#transmit').addEventListener('click', async (event) => {
  if (!activePacket || !missionKey) return;
  event.currentTarget.disabled = true;
  document.querySelector('#tamper').disabled = true;
  setResult('<b>UPLINK IN PROGRESS</b><span>Sending authenticated telemetry to the orbital ground station…</span>', 'pending');
  await animateTransmission();
  try {
    const recovered = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: activePacket.iv, tagLength: 128 }, missionKey, activePacket.cipherAndTag);
    const text = new TextDecoder().decode(recovered);
    stationBeacon.material.color.set('#72ffba'); beaconLight.color.set('#41ffb5');
    setResult(`<b>AUTHENTICATED · SIGNAL RECEIVED</b><span>Ground station recovered: “${escapeHTML(text)}”</span>`, 'success');
    markStep(2);
    updateXP(100);
    document.querySelector('#tamper').disabled = false;
    toast('Signal authenticated. Mission reward: +100 XP.');
  } catch (error) {
    setResult('<b>AUTHENTICATION FAILED</b><span>The ground station rejected this packet.</span>', 'error');
  }
});
function escapeHTML(value) { return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]); }
document.querySelector('#tamper').addEventListener('click', async (event) => {
  if (!activePacket || !missionKey) return;
  event.currentTarget.disabled = true;
  const damaged = new Uint8Array(activePacket.cipherAndTag.slice(0));
  if (!damaged.length) return;
  damaged[0] ^= 1;
  try {
    await crypto.subtle.decrypt({ name: 'AES-GCM', iv: activePacket.iv, tagLength: 128 }, missionKey, damaged);
    setResult('<b>UNEXPECTED ACCEPTANCE</b><span>Packet integrity check did not reject the altered bytes.</span>', 'error');
  } catch {
    setResult('<b>TAMPER DETECTED · AUTHENTICATION REJECTED</b><span>A single changed ciphertext bit invalidated the GCM authentication tag. No plaintext was released.</span>', 'success');
    markStep(3); updateXP(50); toast('Tamper rejected. Challenge reward: +50 XP.');
  }
});
document.querySelector('#reset').addEventListener('click', () => {
  activePacket = null; missionKey = null; missionStep = 0;
  document.querySelector('#packet').hidden = true;
  document.querySelector('#encrypt').disabled = false;
  document.querySelector('#transmit').disabled = true;
  document.querySelector('#tamper').disabled = true;
  stationBeacon.material.color.set('#5df5ff'); beaconLight.color.set('#39e7ff');
  document.querySelector('#track-fill').style.width = '0%';
  for (let index = 1; index <= 3; index++) document.querySelector(`#step-${index}`).classList.toggle('active', index === 1);
  setResult('Awaiting secure packet.');
  toast('Mission reset.');
});
document.querySelector('#fullscreen').addEventListener('click', async () => {
  try { if (!document.fullscreenElement) await document.documentElement.requestFullscreen(); else await document.exitFullscreen(); }
  catch { toast('Fullscreen is unavailable in this browser.'); }
});

const clock = new THREE.Clock();
const orbitBasePosition = new THREE.Vector3();
const orbitBaseQuaternion = new THREE.Quaternion();
const motionSpherical = new THREE.Spherical();
const motionOrbitOffset = new THREE.Vector3();
function animate() {
  requestAnimationFrame(animate);
  const elapsed = clock.getElapsedTime();
  earth.rotation.y += 0.00018;
  stationBeacon.scale.setScalar(1 + Math.sin(elapsed * 3) * 0.09);
  if (loadedShip) loadedShip.rotation.y += 0.0011;
  controls.update();
  let restoreOrbitPose = false;
  if (motionEnabled && sensorReady) {
    orbitBasePosition.copy(camera.position);
    orbitBaseQuaternion.copy(camera.quaternion);
    motionOrbitOffset.copy(camera.position).sub(controls.target);
    motionSpherical.setFromVector3(motionOrbitOffset);
    motionSpherical.theta += sensorOffset.yaw;
    motionSpherical.phi = THREE.MathUtils.clamp(motionSpherical.phi - sensorOffset.pitch, 0.08, Math.PI - 0.08);
    camera.position.setFromSpherical(motionSpherical).add(controls.target);
    camera.lookAt(controls.target);
    restoreOrbitPose = true;
  }
  renderer.render(scene, camera);
  if (restoreOrbitPose) {
    camera.position.copy(orbitBasePosition);
    camera.quaternion.copy(orbitBaseQuaternion);
  }
}
animate();
function resize() {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight); renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
}
window.addEventListener('resize', resize);
window.addEventListener('load', () => document.querySelector('#loading').classList.add('visible'));
earthTexture.addEventListener('load', () => document.querySelector('#loading').classList.remove('visible'));
