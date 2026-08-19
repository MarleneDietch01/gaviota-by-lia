# Three.js product viewers

Reach for this only when the task actually needs true 3D: a model the user can freely rotate/drag, multiple angles of the same object without separate source photos, or the user already has/wants a `.glb`/`.gltf` model. For a static or hover-tilt hero shot from existing product images, use `references/css-3d-product-shots.md` instead — it's simpler and has no dependency.

Start from `assets/threejs-viewer.html` and adapt it. It's a single self-contained HTML file that loads Three.js from a CDN (no build step, no npm) — appropriate for a landing page. If the project already has a bundler/npm, `npm install three` and import normally instead of the CDN script tag, everything else below still applies.

## Where the model comes from

Three.js renders a model, it doesn't create the product's geometry from nothing. Handle this depending on what's available:

- **User has a `.glb`/`.gltf` file**: load it directly with `GLTFLoader`, this is the easy path.
- **User has a 3D file in another format** (`.obj`, `.fbx`, `.stl`): convert to `.glb` first (Blender's glTF export, or an online converter) — Three.js's ecosystem is built around glTF.
- **No model exists yet, but the product is a simple shape** (bottle, tube, box, can): build it procedurally from primitives (`CylinderGeometry`, `BoxGeometry`, `LatheGeometry` for bottle profiles) rather than trying to source a model — this is often good enough for a stylized product hero and avoids an asset pipeline entirely. `assets/threejs-viewer.html` demonstrates this with a lathed bottle shape.
- **No model exists and the shape is complex/specific** (an actual branded product with a real label and cap): say so — this needs either a real 3D asset from the user/their brand team, or a generated one from a tool like Meshy, Spline, or Common Sense Machines, which are outside what this skill produces directly. Don't fabricate a fake-looking "close enough" primitive and pass it off as the real product.

## Minimal setup (the parts that matter for a product looking real)

```js
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100); // 30-45deg fov reads as "product photography", wide angles distort
camera.position.set(0, 0.4, 3.2);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;   // avoids blown-out highlights, big realism win over the default
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;

// Environment map — THE single biggest lever for "looks like a render" vs "looks real".
// A plain ambient+directional light setup on a shiny/plastic material looks flat and CG.
// An HDRI environment gives real-looking reflections/specular highlights for free.
new RGBELoader().load('studio.hdr', (hdri) => {
  hdri.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = hdri;      // lights + reflects the scene, without necessarily being the visible background
});
```

If there's no HDRI file available, Three.js's `RoomEnvironment` (`three/addons/environments/RoomEnvironment.js`) generates a plausible studio-like environment procedurally with no external asset — use that as the default rather than skipping environment lighting entirely.

## Lighting rig (only needed on top of the environment map for extra shape-defining light)

Mirror real product-photography setups, not a single flat light:

```js
const key = new THREE.DirectionalLight(0xffffff, 2.2);
key.position.set(3, 4, 2);
key.castShadow = true;

const fill = new THREE.DirectionalLight(0xffffff, 0.6);
fill.position.set(-3, 1, 2);   // softer, opposite side, fills in the shadow key creates — never zero fill light, it looks harsh

const rim = new THREE.DirectionalLight(0xffffff, 1.2);
rim.position.set(0, 3, -3);    // behind the subject, separates it from the background

scene.add(key, fill, rim);
```

## Ground / contact shadow

Give the object something to sit on, even if the "floor" itself is invisible — use a shadow-only material so only the contact shadow renders:

```js
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(20, 20),
  new THREE.ShadowMaterial({ opacity: 0.25 })
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);
```

## Interaction

`OrbitControls` with damping feels far more premium than raw drag:

```js
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 2; controls.maxDistance = 5;
controls.maxPolarAngle = Math.PI * 0.6;   // stop the camera from going under the "floor"
controls.autoRotate = true;               // slow idle rotation makes a static product page feel alive; disable on user interaction
controls.autoRotateSpeed = 1.2;
```

## Common failure modes and fixes

- **Looks like a video game asset, not a photo**: no environment map, or `toneMapping` left at default (`NoToneMapping`) — both give flat, oversaturated results. Add `RoomEnvironment` at minimum and set `ACESFilmicToneMapping`.
- **Materials look chalky/matte plastic when they should look glossy**: check `roughness`/`metalness` on the `MeshStandardMaterial` — glass/glossy plastic wants low roughness (0.1–0.3), matte cardboard/fabric wants high roughness (0.7–0.9).
- **Model floats with no grounding**: missing `ShadowMaterial` floor + `castShadow`/`receiveShadow` flags, or lights not configured to cast shadows.
- **Janky rotation on drag**: `enableDamping` not set, or damping update not called in the render loop (`controls.update()` must run every frame when damping is on).
