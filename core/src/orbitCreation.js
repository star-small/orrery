import * as THREE from "three"
const KM_TO_AU = 1 / 149597870.7;
const ARCSEC_TO_RAD = Math.PI / (180 * 3600);
const orbitalData = [
  {
    name: "Mercury",
    a: 57909175 * KM_TO_AU,  // Semi-major axis in AU
    e: 0.205630,  // Eccentricity
    i: 7.005 * ARCSEC_TO_RAD,  // Inclination
    node: 48.331 * ARCSEC_TO_RAD,  // Longitude of ascending node
    peri: 77.456 * ARCSEC_TO_RAD,  // Argument of perihelion
    lambda: 15 * ARCSEC_TO_RAD,  // Mean longitude
    phi: 1 * ARCSEC_TO_RAD,  // Latitude
    color: 0x8B8B8B,  // Gray
    objectSize: 0.000016  // Scaled size
  },
  {
    name: "Venus",
    a: 108208925 * KM_TO_AU,
    e: 0.006772,
    i: 3.39471 * ARCSEC_TO_RAD,
    node: 76.680 * ARCSEC_TO_RAD,
    peri: 131.533 * ARCSEC_TO_RAD,
    lambda: 20 * ARCSEC_TO_RAD,
    phi: 1 * ARCSEC_TO_RAD,
    color: 0xFFA500,  // Orange
    objectSize: 0.000038
  },
  {
    name: "Earth",
    a: 149597870.7 * KM_TO_AU,  // 1 AU
    e: 0.0167086,
    i: 0.00005 * ARCSEC_TO_RAD,
    node: -11.26064 * ARCSEC_TO_RAD,
    peri: 102.94719 * ARCSEC_TO_RAD,
    lambda: 20 * ARCSEC_TO_RAD,
    phi: 8 * ARCSEC_TO_RAD,
    color: 0x0000FF,  // Blue
    objectSize: 0.000040
  },
  {
    name: "Mars",
    a: 227939366 * KM_TO_AU,
    e: 0.0934,
    i: 1.85061 * ARCSEC_TO_RAD,
    node: 49.57854 * ARCSEC_TO_RAD,
    peri: 336.04084 * ARCSEC_TO_RAD,
    lambda: 40 * ARCSEC_TO_RAD,
    phi: 2 * ARCSEC_TO_RAD,
    color: 0xFF0000,  // Red
    objectSize: 0.000021
  },
  {
    name: "Jupiter",
    a: 778547200 * KM_TO_AU,
    e: 0.0489,
    i: 1.30530 * ARCSEC_TO_RAD,
    node: 100.55615 * ARCSEC_TO_RAD,
    peri: 14.75385 * ARCSEC_TO_RAD,
    lambda: 400 * ARCSEC_TO_RAD,
    phi: 10 * ARCSEC_TO_RAD,
    color: 0xFFA500,  // Orange
    objectSize: 0.000446
  },
  {
    name: "Saturn",
    a: 1433449370 * KM_TO_AU,
    e: 0.0565,
    i: 2.48446 * ARCSEC_TO_RAD,
    node: 113.71504 * ARCSEC_TO_RAD,
    peri: 92.43194 * ARCSEC_TO_RAD,
    lambda: 600 * ARCSEC_TO_RAD,
    phi: 25 * ARCSEC_TO_RAD,
    color: 0xFFD700,  // Gold
    objectSize: 0.000378
  },
  {
    name: "Uranus",
    a: 2870671400 * KM_TO_AU,
    e: 0.0457,
    i: 0.77004 * ARCSEC_TO_RAD,
    node: 74.22988 * ARCSEC_TO_RAD,
    peri: 170.96424 * ARCSEC_TO_RAD,
    lambda: 50 * ARCSEC_TO_RAD,
    phi: 2 * ARCSEC_TO_RAD,
    color: 0x00FFFF,  // Cyan
    objectSize: 0.000160
  },
  {
    name: "Neptune",
    a: 4498542600 * KM_TO_AU,
    e: 0.0113,
    i: 1.76917 * ARCSEC_TO_RAD,
    node: 131.72169 * ARCSEC_TO_RAD,
    peri: 44.97135 * ARCSEC_TO_RAD,
    lambda: 10 * ARCSEC_TO_RAD,
    phi: 1 * ARCSEC_TO_RAD,
    color: 0x0000FF,  // Blue
    objectSize: 0.000155
  }
];
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
export function createOrbits(scene) {
  const allObjects = [];

  // Create Sun
  const sunRadius = 696340 * KM_TO_AU; // Sun's radius in AU
  const sunGeometry = new THREE.SphereGeometry(sunRadius, 32, 32);
  const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFF00 });
  const sun = new THREE.Mesh(sunGeometry, sunMaterial);
  sun.name = "Sun";
  scene.add(sun);
  allObjects.push(sun);

  // Add a point light at the Sun's position
  const sunLight = new THREE.PointLight(0xFFFFFF, 1.5, 0, 0);
  sun.add(sunLight);

  orbitalData.forEach(data => {
    const points = calculateOrbitPoints(data);

    // Create orbit line
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: data.color, opacity: 0.5, transparent: true });
    const orbit = new THREE.Line(geometry, material);

    scene.add(orbit);

    // Create planet
    const objectGeometry = new THREE.SphereGeometry(data.objectSize, 32, 32);
    const objectMaterial = new THREE.MeshPhongMaterial({ color: data.color });
    const object = new THREE.Mesh(objectGeometry, objectMaterial);
    object.name = data.name;

    object.userData = {
      isOrbitObject: true,
      points: points,
      currentPoint: 0,
      speed: 0.01 / Math.sqrt(data.a * data.a * data.a) // Kepler's Third Law
    };

    scene.add(object);
    allObjects.push(object);
  });

  return allObjects;
}
