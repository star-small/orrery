import { initScene, animate } from './sceneSetup.js';
import { createOrbits } from './orbitCreation.js';
import { initControls } from './controls.js';

const sceneData = initScene();
createOrbits(sceneData.scene);
const controls = initControls(sceneData.camera, sceneData.renderer.domElement);

function animateScene() {
  requestAnimationFrame(animateScene);
  animate(sceneData);
  controls.update();
}

animateScene();

// Handle window resize
window.addEventListener('resize', () => {
  sceneData.camera.aspect = window.innerWidth / window.innerHeight;
  sceneData.camera.updateProjectionMatrix();
  sceneData.renderer.setSize(window.innerWidth, window.innerHeight);
});

