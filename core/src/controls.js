import * as THREE from "three"
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

    const element = this.domElement;

    this.sphericalDelta.theta -= 2 * Math.PI * this.rotateDelta.x / element.clientWidth * this.rotateSpeed;
    this.sphericalDelta.phi -= 2 * Math.PI * this.rotateDelta.y / element.clientHeight * this.rotateSpeed;

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

    const element = this.domElement;

    offset.setFromMatrixColumn(this.camera.matrix, 0); // get X column of matrix
    offset.multiplyScalar(-2 * deltaX / element.clientWidth);

    this.panOffset.add(offset);

    offset.setFromMatrixColumn(this.camera.matrix, 1); // get Y column of matrix
    offset.multiplyScalar(2 * deltaY / element.clientHeight);

    this.panOffset.add(offset);
  }

  update() {
    const offset = new THREE.Vector3();

    // get current camera position in spherical coordinates
    offset.copy(this.camera.position).sub(this.target);
    this.spherical.setFromVector3(offset);

    // apply rotation
    this.spherical.theta += this.sphericalDelta.theta;
    this.spherical.phi += this.sphericalDelta.phi;

    // restrict phi to be between desired limits
    this.spherical.phi = Math.max(0.01, Math.min(Math.PI - 0.01, this.spherical.phi));

    // apply zoom
    this.spherical.radius *= this.scale;

    // apply pan
    this.target.add(this.panOffset);

    // convert back to Cartesian coordinates
    offset.setFromSpherical(this.spherical);

    // update camera position
    this.camera.position.copy(this.target).add(offset);
    this.camera.lookAt(this.target);

    // reset changes
    this.sphericalDelta.set(0, 0, 0);
    this.scale = 1;
    this.panOffset.set(0, 0, 0);
  }
}

export function initControls(camera, domElement) {
  return new OrbitControls(camera, domElement);
}
