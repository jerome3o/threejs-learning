import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

let frame = 0;

interface MousePosition {
  x: number;
  y: number;
}

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

function makeCube() {
  const geometry = new THREE.BoxGeometry(2, 1, 1);

  // with wireframe
  const material = new THREE.MeshBasicMaterial({
    color: 0x00ff00,
    wireframe: true,
  });
  const cube = new THREE.Mesh(geometry, material);
  return cube;
}

// listen for window resize
window.addEventListener("resize", () => {
  // update camera
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  // update renderer
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
});

function setUpMouse(
  leftClickDrag: ((
    oldPosition: MousePosition,
    newPosition: MousePosition
  ) => void)[],
  rightClickDrag: ((
    oldPosition: MousePosition,
    newPosition: MousePosition
  ) => void)[] = [],
  scroll: ((scrollDelta: number) => void)[] = []
) {
  // listen for mouse drag
  let isDraggingLeft = false;
  let isDraggingRight = false;

  let previousMousePosition = {
    x: 0,
    y: 0,
  };

  document.addEventListener("mousedown", (event) => {
    // check if left click
    if (event.button === 0) {
      isDraggingLeft = true;
    } else if (event.button === 2) {
      isDraggingRight = true;
    }
    previousMousePosition = {
      x: event.offsetX,
      y: event.offsetY,
    };
  });

  document.addEventListener("mouseup", (event) => {
    // check if left click
    if (event.button === 0) {
      isDraggingLeft = false;
    } else if (event.button === 2) {
      isDraggingRight = false;
    }
  });

  document.addEventListener("mousemove", (event) => {
    // only update if dragging
    if (!isDraggingLeft && !isDraggingRight) {
      return;
    }

    if (isDraggingLeft) {
      // call functions
      leftClickDrag.forEach((f) =>
        f(previousMousePosition, {
          x: event.offsetX,
          y: event.offsetY,
        })
      );
    }

    if (isDraggingRight) {
      // call functions
      rightClickDrag.forEach((f) =>
        f(previousMousePosition, {
          x: event.offsetX,
          y: event.offsetY,
        })
      );
    }

    // update previous mouse position
    previousMousePosition = {
      x: event.offsetX,
      y: event.offsetY,
    };
  });

  // listen for mouse scroll
  document.addEventListener("wheel", (event) => {
    // call functions
    scroll.forEach((f) => f(event.deltaY));
  });
}

function drawHexagon(x: number, y: number, radius: number) {
  const material = new THREE.LineBasicMaterial({ color: 0x0000ff });
  const points = [];
  const sides = 6;

  for (let i = 0; i < sides; i++) {
    const angle = (i * (Math.PI * 2)) / sides;
    points.push(
      new THREE.Vector2(
        x + radius * Math.sin(angle),
        y + radius * Math.cos(angle)
      )
    );
  }
  // add first point again to close the shape
  points.push(points[0]);

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const line = new THREE.Line(geometry, material);
  return line;
}

function drawGridlines() {
  //  draw vertical and horizontal lines
  // 1 unit apart
  const material = new THREE.LineBasicMaterial({ color: 0xff00ff });
  const points = [];

  const bottomLeft = new THREE.Vector2(-1, -1);
  const bottomRight = new THREE.Vector2(1, -1);
  const topLeft = new THREE.Vector2(-1, 1);
  const topRight = new THREE.Vector2(1, 1);

  points.push(bottomLeft);
  points.push(bottomRight);
  points.push(topRight);
  points.push(topLeft);
  points.push(bottomLeft);

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const line = new THREE.Line(geometry, material);
  return line;
}

function getApothem(radius: number) {
  return radius * (Math.sqrt(3) / 2.0);
}

function getRadius(apothem: number) {
  return apothem / (Math.sqrt(3) / 2.0);
}

function getSide(apothem: number) {
  return apothem / (Math.sqrt(3) / 2);
}

function getDebugInfoString(camera: THREE.PerspectiveCamera) {
  // return {
  //   fov: camera.fov,
  //   aspect: camera.aspect,
  //   near: camera.near,
  //   far: camera.far,
  //   position: camera.position,
  //   rotation: camera.rotation,
  // };
  return `fov: ${camera.fov}
aspect: ${camera.aspect}
near: ${camera.near}
far: ${camera.far}
position: ${camera.position.x}, ${camera.position.y}, ${camera.position.z}
rotation: ${camera.rotation.x}, ${camera.rotation.y}, ${camera.rotation.z}
gameRotation: ${cameraAngle}`;
}

function updateDebugText(camera: THREE.PerspectiveCamera) {
  const debugText = document.getElementById("info");
  if (debugText) {
    debugText.innerText = getDebugInfoString(camera);
  }
}

function updateCameraPosition(
  oldPosition: MousePosition,
  newPosition: MousePosition
) {
  // calculate delta
  const deltaX = newPosition.x - oldPosition.x;
  const deltaY = newPosition.y - oldPosition.y;

  const delta = new THREE.Vector2(deltaX, deltaY);
  delta.rotateAround(new THREE.Vector2(0, 0), -cameraAngle + Math.PI / 2.0);

  // update camera position
  cameralocation.x += delta.x / 100.0;
  cameralocation.y -= delta.y / 100.0;
}

function updateCameraRotation(
  oldPosition: MousePosition,
  newPosition: MousePosition
) {
  // // calculate delta
  const deltaX = newPosition.x - oldPosition.x;

  // update camera rotation
  cameraAngle -= deltaX / 500.0;
}

function updateCameraZoom(scrollDelta: number) {
  // update camera zoom
  cameraHeight = cameraHeight + (cameraHeight * scrollDelta) / 1000.0;
  cameraRadius = cameraRadius + (cameraRadius * scrollDelta) / 1000.0;
}

function updateCamera() {
  updateCameraInner(cameralocation, cameraHeight, cameraRadius, cameraAngle);
  updateDebugText(camera);
}

function updateCameraInner(
  cameralocation: THREE.Vector2,
  cameraHeight: number,
  cameraRadius: number,
  cameraAngle: number
) {
  // calculate camera position
  camera.position.x = cameralocation.x + cameraRadius * Math.cos(cameraAngle);
  camera.position.y = cameralocation.y + cameraRadius * Math.sin(cameraAngle);
  camera.position.z = cameraHeight;

  camera.lookAt(cameralocation.x, cameralocation.y, 0);
  // ensure top of camera is always pointing up
  camera.up.set(0, 0, 1);
}

// initialise
camera.position.z = 5;

setUpMouse([updateCameraPosition], [updateCameraRotation], [updateCameraZoom]);

// const hexRadius = 1;
// const hexApothem = getApothem(hexRadius);

const hexApothem = 1;
const hexRadius = getRadius(hexApothem);
const hexSide = getSide(hexApothem);

let cameralocation = new THREE.Vector2(0, 0);
let cameraHeight = 5;
let cameraRadius = 5;
let cameraAngle = 0;

console.log({ hexApothem, hexRadius });

// tessellate 100 hexagons
const hexagon = new THREE.Group();
for (let i = 0.0; i < 10.0; i++) {
  for (let j = 0.0; j < 10.0; j++) {
    // calculate position
    let x = hexApothem * 2 * i;
    let y = (hexRadius + hexSide / 2.0) * j;
    if (j % 2 === 1) {
      x += hexApothem;
    }

    // draw hexagon
    const hex = drawHexagon(x, y, hexRadius * 0.9);

    // add hexagon to group
    hexagon.add(hex);
  }
}

const grids = drawGridlines();

const light = new THREE.AmbientLight(0x404040); // soft white light
const pointLight = new THREE.PointLight(0xffffff, 50, 100);
pointLight.position.set(0, 0, 10);

const loader = new GLTFLoader();
loader.load(
  "/avocado/Avocado.gltf",
  (gltf: any) => {
    // scale up by 100
    gltf.scene.scale.set(10, 10, 10);
    gltf.scene.position.set(0, 0, 1);
    scene.add(gltf.scene);
  },
  // called while loading is progressing
  function (xhr: any) {
    console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
  },
  (error: any) => {
    console.log(error);
  }
);

scene.add(grids);

// scene.add(cube);
scene.add(hexagon);
scene.add(light);
scene.add(pointLight);
scene.background = new THREE.Color(0xffffff);

function animate() {
  requestAnimationFrame(animate);
  updateDebugText(camera);
  updateCamera();

  renderer.render(scene, camera);
  frame++;
}
animate();