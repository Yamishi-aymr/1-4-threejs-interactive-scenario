import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Octree } from 'three/addons/math/Octree.js';
import { Capsule } from 'three/addons/math/Capsule.js';

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
// SISTEMA DE COLISIONES DEL ESCENARIO
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
// CARGAR ESCENARIO
// ============================================================

const loader = new GLTFLoader();

loader.load(
  './assets/models/collision-world.glb',

  (gltf) => {

    const model = gltf.scene;

    model.traverse((child) => {

      if (child.isMesh) {

        child.castShadow = true;

        child.receiveShadow = true;

        if (child.material?.map) {

          child.material.map.anisotropy = 4;

        }

      }

    });

    scene.add(
      model
    );

    // Generar las colisiones a partir del escenario.
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
// DIRECCIÓN HACIA DELANTE
// ============================================================

function getForwardVector() {

  camera.getWorldDirection(
    playerDirection
  );

  playerDirection.y = 0;

  playerDirection.normalize();

  return playerDirection;

}

// ============================================================
// DIRECCIÓN LATERAL
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

function controls(deltaTime) {

  const speed = playerOnFloor
    ? 18
    : 7;

  // W
  if (keyStates.KeyW) {

    playerVelocity.add(
      getForwardVector().multiplyScalar(
        speed * deltaTime
      )
    );

  }

  // S
  if (keyStates.KeyS) {

    playerVelocity.add(
      getForwardVector().multiplyScalar(
        -speed * deltaTime
      )
    );

  }

  // A
  if (keyStates.KeyA) {

    playerVelocity.add(
      getSideVector().multiplyScalar(
        -speed * deltaTime
      )
    );

  }

  // D
  if (keyStates.KeyD) {

    playerVelocity.add(
      getSideVector().multiplyScalar(
        speed * deltaTime
      )
    );

  }

  // SPACE
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
    worldOctree.capsuleIntersect(
      playerCollider
    );

  playerOnFloor = false;

  if (result) {

    playerOnFloor =
      result.normal.y > 0;

    if (!playerOnFloor) {

      playerVelocity.addScaledVector(
        result.normal,
        -result.normal.dot(
          playerVelocity
        )
      );

    }

    playerCollider.translate(
      result.normal.multiplyScalar(
        result.depth
      )
    );

  }

}

// ============================================================
// ACTUALIZAR JUGADOR
// ============================================================

function updatePlayer(deltaTime) {

  let damping =
    Math.exp(
      -4 * deltaTime
    ) - 1;

  // Si estamos en el aire, aplicar gravedad.
  if (!playerOnFloor) {

    playerVelocity.y -=
      25 * deltaTime;

    damping *= 0.1;

  }

  // Frenado gradual.
  playerVelocity.addScaledVector(
    playerVelocity,
    damping
  );

  // Mover la cápsula.
  const deltaPosition =
    playerVelocity
      .clone()
      .multiplyScalar(
        deltaTime
      );

  playerCollider.translate(
    deltaPosition
  );

  // Revisar colisiones.
  playerCollisions();

  // La cámara sigue al jugador.
  camera.position.copy(
    playerCollider.end
  );

  // Si caemos fuera del escenario,
  // regresar al inicio.
  if (camera.position.y < -20) {

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
// TECLADO
// ============================================================

document.addEventListener(
  'keydown',
  (event) => {

    keyStates[event.code] = true;

  }
);

document.addEventListener(
  'keyup',
  (event) => {

    keyStates[event.code] = false;

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

      renderer.domElement.requestPointerLock();

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
      event.movementX / 500;

    camera.rotation.x -=
      event.movementY / 500;

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

  controls(
    delta
  );

  updatePlayer(
    delta
  );

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