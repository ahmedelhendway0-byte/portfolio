
/* ---------- "What we build" core: three real meshing gears (big, medium, small) that the idea cards wrap around ---------- */
/* the 3D library is big, so it only loads when the visitor gets close to this section */
const host = document.getElementById('engine');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
new IntersectionObserver((es, ob) => { if (es[0].isIntersecting) { ob.disconnect(); startGears(); } }, { rootMargin: '1200px 0px' }).observe(document.getElementById('build'));

async function startGears() {
const THREE = await import('three');
const { RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));   // the gears are faded, so more detail wouldn't show
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
host.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), .04).texture;
const camera = new THREE.PerspectiveCamera(30, 1.4, .1, 100);

const steel = new THREE.MeshStandardMaterial({ color: 0xc3ccd6, metalness: 1, roughness: .26 });
const dark = new THREE.MeshStandardMaterial({ color: 0x4f5864, metalness: 1, roughness: .34 });
const blue = new THREE.MeshStandardMaterial({ color: 0x5f96c8, metalness: .85, roughness: .28, emissive: 0x1f4a70, emissiveIntensity: .5 });

/* gear with trapezoid teeth, a bore and lightening holes; m = module (tooth size), z = teeth */
function gearGeo(z, m, depth, holes) {
  const rp = m * z / 2, ra = rp + m, rf = rp - 1.25 * m, step = Math.PI * 2 / z, s = new THREE.Shape();
  for (let i = 0; i < z; i++) {
    const a = i * step;
    [[rf, 0], [ra, .24], [ra, .46], [rf, .7]].forEach(([r, f], k) => {
      const x = Math.cos(a + f * step) * r, y = Math.sin(a + f * step) * r;
      (i === 0 && k === 0) ? s.moveTo(x, y) : s.lineTo(x, y);
    });
  }
  s.closePath();
  const bore = new THREE.Path(); bore.absarc(0, 0, rf * .16, 0, Math.PI * 2, true); s.holes.push(bore);
  for (let h = 0; h < holes; h++) {
    const a = h / holes * Math.PI * 2, p = new THREE.Path();
    p.absarc(Math.cos(a) * rf * .58, Math.sin(a) * rf * .58, rf * .2, 0, Math.PI * 2, true); s.holes.push(p);
  }
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelSize: .03, bevelThickness: .03, bevelSegments: 2, curveSegments: 10 });
  g.translate(0, 0, -depth / 2);
  return g;
}
const rig = new THREE.Group(); scene.add(rig);
/* a gear lying in the x-y plane on its own axle, with a glowing hub */
function gear(z, m, depth, holes, mat, x, y) {
  const g = new THREE.Group(), mesh = new THREE.Mesh(gearGeo(z, m, depth, holes), mat);
  g.position.set(x, y, 0); g.add(mesh);
  const rf = m * z / 2 - 1.25 * m;
  const hub = new THREE.Mesh(new THREE.TorusGeometry(rf * .22, .05, 10, 40), blue); hub.position.z = depth / 2 + .04; g.add(hub);
  const axle = new THREE.Mesh(new THREE.CylinderGeometry(rf * .12, rf * .12, depth + .5, 24), dark); axle.rotation.x = Math.PI / 2; g.add(axle);
  rig.add(g);
  return { mesh, z, at: [x, y] };
}
function mesh2(a, b) { // angle that keeps gear b meshing with gear a
  const beta = Math.atan2(b.at[1] - a.at[1], b.at[0] - a.at[0]), r = a.z / b.z;
  return th => beta + Math.PI + Math.PI / b.z - r * (th - beta);
}

// big 40T drives the medium 24T, which drives the small 14T (module .1, so centre distances are exact)
const M = .1, BIG = [-1.25, -.35], A1 = .44, A2 = -1.05;
const MED = [BIG[0] + Math.cos(A1) * M * 32, BIG[1] + Math.sin(A1) * M * 32];
const SML = [MED[0] + Math.cos(A2) * M * 19, MED[1] + Math.sin(A2) * M * 19];
const gB = gear(40, M, .42, 7, steel, BIG[0], BIG[1]);
const gM = gear(24, M, .38, 5, dark, MED[0], MED[1]);
const gS = gear(14, M, .34, 0, blue, SML[0], SML[1]);
const angM = mesh2(gB, gM), angS = th => mesh2(gM, gS)(angM(th));

scene.add(new THREE.AmbientLight(0xffffff, .5));
const keyL = new THREE.DirectionalLight(0xffffff, 1.4); keyL.position.set(4, 6, 8); scene.add(keyL);
const blueL = new THREE.PointLight(0x2e9bff, 30, 20); blueL.position.set(-3, 2, 4); scene.add(blueL);
const rimL = new THREE.PointLight(0x9fd3ff, 25, 20); rimL.position.set(3, 3, -3); scene.add(rimL);

function size() { const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
addEventListener('resize', size); size();
let mx = 0; addEventListener('pointermove', e => { mx = e.clientX / innerWidth - .5; });

const clock = new THREE.Clock();
let odd = false;
renderer.setAnimationLoop(() => {
  odd = !odd; if (odd) return;                           // every second frame is plenty for slow gears
  const r = host.getBoundingClientRect();
  if (r.bottom < 0 || r.top > innerHeight) { clock.getDelta(); return; }
  const t = clock.getElapsedTime(), p = (window.HB && window.HB.p) || 0;
  const th = (reduce ? 0 : t * .45) + p * 7;            // big gear angle: time + scroll
  gB.mesh.rotation.z = th; gM.mesh.rotation.z = angM(th); gS.mesh.rotation.z = angS(th);
  // the camera looks at the gears slightly from the side and drifts as you scroll
  const phi = -.42 + p * .5 + Math.sin(t * .2) * .05 + mx * .15, R = host.clientWidth < 500 ? 13.5 : 11.5;
  camera.position.set(Math.sin(phi) * R, 1.6, Math.cos(phi) * R);
  camera.lookAt(0, 0, 0);
  renderer.render(scene, camera);
});
}
