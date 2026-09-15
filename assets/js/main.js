import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Octree } from 'three/addons/math/Octree.js';
import { Capsule } from 'three/addons/math/Capsule.js';

import RAPIER from 'https://cdn.skypack.dev/@dimforge/rapier3d-compat';

// ============================================================
// INICIALIZAR RAPIER
// ============================================================

await RAPIER.init();

// ============================================================
// CONTENEDOR
// ============================================================

const container = document.getElementById('scene-container');

// ============================================================
// ESCENA
// ============================================================

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x07111f);

scene.fog = new THREE.Fog(
  0x07111f,
  18,
  65
);

// ============================================================
// CÁMARA
// ============================================================

const camera = new THREE.PerspectiveCamera(
  70,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

camera.rotation.order = 'YXZ';

// ============================================================
// RENDERER
// ============================================================

const renderer = new THREE.WebGLRenderer({
  antialias: true
});

renderer.setPixelRatio(
  Math.min(
    window.devicePixelRatio,
    2
  )
);

renderer.setSize(
  window.innerWidth,
  window.innerHeight
);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

container.appendChild(
  renderer.domElement
);

// ============================================================
// LUCES
// ============================================================

const hemisphereLight = new THREE.HemisphereLight(
  0xbfe3ff,
  0x182030,
  1.8
);

scene.add(
  hemisphereLight
);

const sun = new THREE.DirectionalLight(
  0xffffff,
  3
);

sun.position.set(
  -5,
  18,
  6
);

sun.castShadow = true;

sun.shadow.mapSize.set(
  2048,
  2048
);

scene.add(
  sun
);

// ============================================================
// TEMPORIZADOR
// ============================================================

const timer = new THREE.Timer();

// ============================================================
// COLISIONES DEL ESCENARIO
// ============================================================

const worldOctree = new Octree();

// ============================================================
// JUGADOR
// ============================================================

const playerCollider = new Capsule(
  new THREE.Vector3(
    0,
    0.35,
    0
  ),

  new THREE.Vector3(
    0,
    1,
    0
  ),

  0.35
);

const playerVelocity = new THREE.Vector3();

const playerDirection = new THREE.Vector3();

let playerOnFloor = false;

// ============================================================
// TECLADO
// ============================================================

const keyStates = {};

// ============================================================
// RAPIER
// ============================================================

const gravity = {
  x: 0,
  y: -9.81,
  z: 0
};

const physicsWorld = new RAPIER.World(
  gravity
);

const physicalObjects = [];

// ============================================================
// PISO FÍSICO PARA OBJETOS RAPIER
// ============================================================

const groundDesc =
  RAPIER.ColliderDesc.cuboid(
    30,
    0.1,
    30
  )
    .setTranslation(
      0,
      -0.1,
      0
    )
    .setFriction(
      0.8
    );

physicsWorld.createCollider(
  groundDesc
);

// ============================================================
// CREAR CAJA DINÁMICA
// ============================================================

function createDynamicBox(
  x,
  y,
  z,
  sx,
  sy,
  sz,
  mass = 4
) {

  // ----------------------------------------------------------
  // MALLA THREE.JS
  // ----------------------------------------------------------

  const geometry =
    new THREE.BoxGeometry(
      sx,
      sy,
      sz
    );

  const material =
    new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.65,
      metalness: 0.08
    });

  const mesh =
    new THREE.Mesh(
      geometry,
      material
    );

  mesh.position.set(
    x,
    y,
    z
  );

  mesh.castShadow = true;
  mesh.receiveShadow = true;

  scene.add(
    mesh
  );

  // ----------------------------------------------------------
  // CUERPO FÍSICO
  // ----------------------------------------------------------

  const body =
    physicsWorld.createRigidBody(

      RAPIER.RigidBodyDesc
        .dynamic()
        .setTranslation(
          x,
          y,
          z
        )

    );

  // ----------------------------------------------------------
  // COLLIDER
  // ----------------------------------------------------------

  const volume =
    Math.max(
      sx * sy * sz,
      0.01
    );

  const collider =
    RAPIER.ColliderDesc
      .cuboid(
        sx / 2,
        sy / 2,
        sz / 2
      )
      .setDensity(
        mass / volume
      )
      .setFriction(
        0.7
      )
      .setRestitution(
        0.12
      );

  physicsWorld.createCollider(
    collider,
    body
  );

  physicalObjects.push({
    mesh,
    body
  });

}

// ============================================================
// TORRE DE CAJAS
// ============================================================

for (
  let level = 0;
  level < 3;
  level++
) {

  for (
    let i = 0;
    i < 3 - level;
    i++
  ) {

    createDynamicBox(
      -2 +
      i * 1.15 +
      level * 0.55,

      0.5 +
      level,

      -5,

      1,
      1,
      1,

      4
    );

  }

}

// ============================================================
// CAJAS EXTRA
// ============================================================

createDynamicBox(
  3,
  0.75,
  -5,
  1.2,
  1.5,
  1.2,
  8
);

createDynamicBox(
  4.4,
  0.4,
  -5,
  0.8,
  0.8,
  0.8,
  2
);

// ============================================================
// CARGAR ESCENARIO
// ============================================================

const loader = new GLTFLoader();

loader.load(
  './assets/models/collision-world.glb',

  (gltf) => {

    const model =
      gltf.scene;

    model.traverse(
      (child) => {

        if (
          child.isMesh
        ) {

          child.castShadow = true;

          child.receiveShadow = true;

          if (
            child.material?.map
          ) {

            child.material.map.anisotropy = 4;

          }

        }

      }
    );

    scene.add(
      model
    );

    worldOctree.fromGraphNode(
      model
    );

    console.log(
      '✅ Escenario cargado correctamente'
    );

    console.log(
      '✅ Octree de colisiones generado'
    );

  },

  undefined,

  (error) => {

    console.error(
      '❌ Error al cargar el escenario:',
      error
    );

  }
);

// ============================================================
// VECTOR HACIA DELANTE
// ============================================================

function getForwardVector() {

  camera.getWorldDirection(
    playerDirection
  );

  playerDirection.y = 0;

  return playerDirection.normalize();

}

// ============================================================
// VECTOR LATERAL
// ============================================================

function getSideVector() {

  camera.getWorldDirection(
    playerDirection
  );

  playerDirection.y = 0;

  playerDirection.normalize();

  playerDirection.cross(
    camera.up
  );

  return playerDirection;

}

// ============================================================
// CONTROLES
// ============================================================

function controls(
  deltaTime
) {

  const speed =
    playerOnFloor
      ? 18
      : 7;

  if (
    keyStates.KeyW
  ) {

    playerVelocity.add(
      getForwardVector()
        .multiplyScalar(
          speed *
          deltaTime
        )
    );

  }

  if (
    keyStates.KeyS
  ) {

    playerVelocity.add(
      getForwardVector()
        .multiplyScalar(
          -speed *
          deltaTime
        )
    );

  }

  if (
    keyStates.KeyA
  ) {

    playerVelocity.add(
      getSideVector()
        .multiplyScalar(
          -speed *
          deltaTime
        )
    );

  }

  if (
    keyStates.KeyD
  ) {

    playerVelocity.add(
      getSideVector()
        .multiplyScalar(
          speed *
          deltaTime
        )
    );

  }

  if (
    playerOnFloor &&
    keyStates.Space
  ) {

    playerVelocity.y = 7;

  }

}

// ============================================================
// COLISIONES DEL JUGADOR
// ============================================================

function playerCollisions() {

  const result =
    worldOctree
      .capsuleIntersect(
        playerCollider
      );

  playerOnFloor = false;

  if (
    result
  ) {

    playerOnFloor =
      result.normal.y > 0;

    if (
      !playerOnFloor
    ) {

      playerVelocity.addScaledVector(
        result.normal,
        -result.normal.dot(
          playerVelocity
        )
      );

    }

    playerCollider.translate(
      result.normal
        .multiplyScalar(
          result.depth
        )
    );

  }

}

// ============================================================
// EMPUJAR OBJETOS CERCANOS
// ============================================================

function pushNearbyObjects() {

  const moving =
    new THREE.Vector3(
      playerVelocity.x,
      0,
      playerVelocity.z
    );

  if (
    moving.lengthSq() <
    0.04
  ) {

    return;

  }

  for (
    const item of physicalObjects
  ) {

    const position =
      item.body.translation();

    const dx =
      position.x -
      camera.position.x;

    const dz =
      position.z -
      camera.position.z;

    const distance =
      Math.hypot(
        dx,
        dz
      );

    if (
      distance < 1.15
    ) {

      const force =
        0.7 /
        Math.max(
          distance,
          0.25
        );

      item.body.applyImpulse(
        {
          x:
            dx *
            force,

          y:
            0.05,

          z:
            dz *
            force
        },

        true
      );

    }

  }

}

// ============================================================
// ACTUALIZAR JUGADOR
// ============================================================

function updatePlayer(
  deltaTime
) {

  let damping =
    Math.exp(
      -4 *
      deltaTime
    ) - 1;

  if (
    !playerOnFloor
  ) {

    playerVelocity.y -=
      25 *
      deltaTime;

    damping *= 0.1;

  }

  playerVelocity.addScaledVector(
    playerVelocity,
    damping
  );

  const deltaPosition =
    playerVelocity
      .clone()
      .multiplyScalar(
        deltaTime
      );

  playerCollider.translate(
    deltaPosition
  );

  playerCollisions();

  camera.position.copy(
    playerCollider.end
  );

  pushNearbyObjects();

  if (
    camera.position.y <
    -20
  ) {

    resetPlayer();

  }

}

// ============================================================
// REINICIAR JUGADOR
// ============================================================

function resetPlayer() {

  playerCollider.start.set(
    0,
    0.35,
    0
  );

  playerCollider.end.set(
    0,
    1,
    0
  );

  playerVelocity.set(
    0,
    0,
    0
  );

  camera.position.copy(
    playerCollider.end
  );

}

// ============================================================
// SINCRONIZAR THREE.JS CON RAPIER
// ============================================================

function syncPhysics() {

  for (
    const item of physicalObjects
  ) {

    const position =
      item.body.translation();

    const rotation =
      item.body.rotation();

    item.mesh.position.set(
      position.x,
      position.y,
      position.z
    );

    item.mesh.quaternion.set(
      rotation.x,
      rotation.y,
      rotation.z,
      rotation.w
    );

  }

}

// ============================================================
// TECLADO
// ============================================================

document.addEventListener(
  'keydown',
  (event) => {

    keyStates[
      event.code
    ] = true;

  }
);

document.addEventListener(
  'keyup',
  (event) => {

    keyStates[
      event.code
    ] = false;

  }
);

// ============================================================
// POINTER LOCK
// ============================================================

renderer.domElement.addEventListener(
  'click',
  () => {

    if (
      document.pointerLockElement !==
      renderer.domElement
    ) {

      renderer.domElement
        .requestPointerLock();

    }

  }
);

// ============================================================
// MOVIMIENTO DEL MOUSE
// ============================================================

document.addEventListener(
  'mousemove',
  (event) => {

    if (
      document.pointerLockElement !==
      renderer.domElement
    ) {

      return;

    }

    camera.rotation.y -=
      event.movementX /
      500;

    camera.rotation.x -=
      event.movementY /
      500;

    camera.rotation.x =
      THREE.MathUtils.clamp(
        camera.rotation.x,
        -Math.PI / 2,
        Math.PI / 2
      );

  }
);

// ============================================================
// CICLO DE ANIMACIÓN
// ============================================================

function animate() {

  timer.update();

  const delta =
    Math.min(
      0.05,
      timer.getDelta()
    );

  // Movimiento del jugador.
  controls(
    delta
  );

  updatePlayer(
    delta
  );

  // Física Rapier.
  physicsWorld.timestep =
    delta;

  physicsWorld.step();

  syncPhysics();

  renderer.render(
    scene,
    camera
  );

}

renderer.setAnimationLoop(
  animate
);

// ============================================================
// RESPONSIVE
// ============================================================

window.addEventListener(
  'resize',
  () => {

    camera.aspect =
      window.innerWidth /
      window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
      window.innerWidth,
      window.innerHeight
    );

  }
);