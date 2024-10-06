import * as THREE from 'three';

export function initScene() {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.0001, 30);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0x404040);
  scene.add(ambientLight);

  const pointLight = new THREE.PointLight(0xffffff, 1, 30);
  pointLight.position.set(0, 0, 0);
  scene.add(pointLight);

  camera.position.set(0, 3, 10); // Positioned to view the entire inner solar system
  camera.lookAt(0, 0, 0);

  return { scene, camera, renderer };
}

export function animate({ scene, camera, renderer }) {
  // Update object positions
  scene.children.forEach(child => {
    if (child.userData && child.userData.isOrbitObject) {
      const obj = child.userData;
      const point = obj.points[Math.floor(obj.currentPoint)];

      if (obj.parentObject) {
        // For moons, position relative to their parent (Jupiter)
        child.position.copy(point).add(obj.parentObject.position);
      } else {
        // For planets, position relative to the Sun
        child.position.copy(point);
      }

      child.position.applyAxisAngle(new THREE.Vector3(1, 0, 0), obj.inclination);
      child.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), obj.node);

      obj.currentPoint += obj.speed;
      if (obj.currentPoint >= obj.points.length) obj.currentPoint = 0;
    }
  });

  renderer.render(scene, camera);
}
