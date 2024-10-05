import * as THREE from 'three';
// Type definitions
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Orbital data
const orbitalData = [
  {
    name: "Object 1",
    e: 0.3565,
    a: 0.85154,
    i: 44.053,
    node: 8.152,
    peri: 9.123,
    M: 4.432,
    epoch: 458853.5,
    color: 0xff0000,
    objectSize: 0.05
  },
  {
    name: "Object 2",
    e: 0.2011,
    a: 1.27212,
    i: 22.742,
    node: 24.602,
    peri: 41.815,
    M: 1.162,
    epoch: 458080.5,
    color: 0x00ff00,
    objectSize: 0.05
  }
];

const orbitObjects = [];

function calculateOrbitPoints(orbitalElements, pointCount = 1000) {
  const points = [];
  const { a, e } = orbitalElements;

  for (let i = 0; i < pointCount; i++) {
    const angle = (i / pointCount) * Math.PI * 2;
    const r = a * (1 - e * e) / (1 + e * Math.cos(angle));
    const x = r * Math.cos(angle);
    const y = r * Math.sin(angle);
    points.push(new THREE.Vector3(x, 0, y));
  }

  return points;
}

// Create orbits and objects
orbitalData.forEach(data => {
  const points = calculateOrbitPoints(data);
  console.table(calculateOrbitPoints(data))

  // Create orbit line
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ color: data.color });
  const orbit = new THREE.Line(geometry, material);

  // Apply inclination rotation
  orbit.rotation.x = data.i * Math.PI / 180;

  // Create object moving along orbit
  const objectGeometry = new THREE.SphereGeometry(data.objectSize, 32, 32);
  const objectMaterial = new THREE.MeshPhongMaterial({ color: data.color });
  const object = new THREE.Mesh(objectGeometry, objectMaterial);

  orbitObjects.push({
    object: object,
    points: points,
    currentPoint: 0,
    speed: 0.001,
    orbit: orbit
  });

  scene.add(orbit);
  scene.add(object);
});

// Add central body (Sun)
const sunGeometry = new THREE.SphereGeometry(0.1, 32, 32);
const sunMaterial = new THREE.MeshPhongMaterial({
  color: 0xffff00,
  emissive: 0xffff00,
  emissiveIntensity: 0.5
});
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 1, 100);
pointLight.position.set(0, 0, 0);
scene.add(pointLight);

// Camera controls
class OrbitControls {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;
    this.target = new THREE.Vector3();

    this.rotateSpeed = 1.0;
    this.zoomSpeed = 1.2;

    this.spherical = new THREE.Spherical();
    this.sphericalDelta = new THREE.Spherical();

    this.scale = 1;

    this.panOffset = new THREE.Vector3();
    this.zoomStart = new THREE.Vector2();
    this.zoomEnd = new THREE.Vector2();

    this.rotateStart = new THREE.Vector2();
    this.rotateEnd = new THREE.Vector2();
    this.rotateDelta = new THREE.Vector2();

    this.panStart = new THREE.Vector2();
    this.panEnd = new THREE.Vector2();
    this.panDelta = new THREE.Vector2();

    this.domElement.addEventListener('contextmenu', this.onContextMenu.bind(this));
    this.domElement.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.domElement.addEventListener('wheel', this.onMouseWheel.bind(this));

    this.update();
  }

  onContextMenu(event) {
    event.preventDefault();
  }

  onMouseDown(event) {
    event.preventDefault();

    if (event.button === 0) {
      this.rotateStart.set(event.clientX, event.clientY);
      document.addEventListener('mousemove', this.onMouseMoveRotate.bind(this));
      document.addEventListener('mouseup', this.onMouseUp.bind(this));
    } else if (event.button === 2) {
      this.panStart.set(event.clientX, event.clientY);
      document.addEventListener('mousemove', this.onMouseMovePan.bind(this));
      document.addEventListener('mouseup', this.onMouseUp.bind(this));
    }
  }

  onMouseMoveRotate(event) {
    this.rotateEnd.set(event.clientX, event.clientY);
    this.rotateDelta.subVectors(this.rotateEnd, this.rotateStart);

    this.sphericalDelta.theta -= 2 * Math.PI * this.rotateDelta.x / this.domElement.clientWidth * this.rotateSpeed;
    this.sphericalDelta.phi -= 2 * Math.PI * this.rotateDelta.y / this.domElement.clientHeight * this.rotateSpeed;

    this.rotateStart.copy(this.rotateEnd);
    this.update();
  }

  onMouseMovePan(event) {
    this.panEnd.set(event.clientX, event.clientY);
    this.panDelta.subVectors(this.panEnd, this.panStart);

    this.pan(this.panDelta.x, this.panDelta.y);

    this.panStart.copy(this.panEnd);
    this.update();
  }

  onMouseUp() {
    document.removeEventListener('mousemove', this.onMouseMoveRotate.bind(this));
    document.removeEventListener('mousemove', this.onMouseMovePan.bind(this));
    document.removeEventListener('mouseup', this.onMouseUp.bind(this));
  }

  onMouseWheel(event) {
    event.preventDefault();

    if (event.deltaY < 0) {
      this.scale /= this.zoomSpeed;
    } else {
      this.scale *= this.zoomSpeed;
    }

    this.update();
  }

  pan(deltaX, deltaY) {
    const offset = new THREE.Vector3();

    offset.setFromMatrixColumn(this.camera.matrix, 0);
    offset.multiplyScalar(-deltaX * 0.01);
    this.panOffset.add(offset);

    offset.setFromMatrixColumn(this.camera.matrix, 1);
    offset.multiplyScalar(deltaY * 0.01);
    this.panOffset.add(offset);
  }

  update() {
    const offset = new THREE.Vector3();
    offset.copy(this.camera.position).sub(this.target);

    this.spherical.setFromVector3(offset);

    this.spherical.theta += this.sphericalDelta.theta;
    this.spherical.phi += this.sphericalDelta.phi;

    this.spherical.phi = Math.max(0.01, Math.min(Math.PI - 0.01, this.spherical.phi));
    this.spherical.radius *= this.scale;

    this.target.add(this.panOffset);

    offset.setFromSpherical(this.spherical);

    this.camera.position.copy(this.target).add(offset);
    this.camera.lookAt(this.target);

    this.sphericalDelta.set(0, 0, 0);
    this.scale = 1;
    this.panOffset.set(0, 0, 0);
  }
}

// Camera position and controls
camera.position.z = 5;
const controls = new OrbitControls(camera, renderer.domElement);

// Animation
function animate() {
  requestAnimationFrame(animate);

  // Update object positions
  orbitObjects.forEach((obj, index) => {
    const point = obj.points[Math.floor(obj.currentPoint)];
    obj.object.position.copy(point);
    obj.object.position.applyAxisAngle(new THREE.Vector3(1, 0, 0), orbitalData[index].i * Math.PI / 180);

    obj.currentPoint += obj.speed;
    if (obj.currentPoint >= obj.points.length) obj.currentPoint = 0;
  });

  renderer.render(scene, camera);
}
animate();

// Handle window resize
window.addEventListener('resize', function() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
