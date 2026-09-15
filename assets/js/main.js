import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Octree } from 'three/addons/math/Octree.js';
import { Capsule } from 'three/addons/math/Capsule.js';

import RAPIER from 'https://cdn.skypack.dev/@dimforge/rapier3d-compat';

// ============================================================
// RAPIER
// ============================================================

await RAPIER.init();

// ============================================================
// ESCENA
// ============================================================

const container = document.getElementById('scene-container');

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x07111f);

scene.fog = new THREE.Fog(
  0x07111f,
  25,
  90
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

scene.add(
  new THREE.HemisphereLight(
    0xbfe3ff,
    0x182030,
    1.8
  )
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
// OCTREE DEL ESCENARIO
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
// MUNDO FÍSICO RAPIER
// ============================================================

const physicsWorld = new RAPIER.World({
  x: 0,
  y: -9.81,
  z: 0
});

const physicalObjects = [];

const lasers = [];

// ============================================================
// CREAR COLISIONES RAPIER DESDE EL ESCENARIO GLB
// ============================================================

function createRapierWorldColliders(model) {

  model.updateMatrixWorld(true);

  let colliderCount = 0;

  model.traverse((child) => {

    if (
      !child.isMesh ||
      !child.geometry ||
      !child.geometry.attributes.position
    ) {
      return;
    }

    // Copiamos la geometría para no modificar el modelo visible.
    const geometry = child.geometry.clone();

    // Aplicamos posición, rotación y escala global del mesh.
    geometry.applyMatrix4(
      child.matrixWorld
    );

    const position =
      geometry.attributes.position;

    // --------------------------------------------------------
    // VÉRTICES
    // --------------------------------------------------------

    const vertices =
      new Float32Array(
        position.count * 3
      );

    for (
      let i = 0;
      i < position.count;
      i++
    ) {

      vertices[
        i * 3
      ] = position.getX(i);

      vertices[
        i * 3 + 1
      ] = position.getY(i);

      vertices[
        i * 3 + 2
      ] = position.getZ(i);

    }

    // --------------------------------------------------------
    // ÍNDICES
    // --------------------------------------------------------

    let indices;

    if (
      geometry.index
    ) {

      indices =
        new Uint32Array(
          geometry.index.count
        );

      for (
        let i = 0;
        i < geometry.index.count;
        i++
      ) {

        indices[i] =
          geometry.index.getX(i);

      }

    } else {

      indices =
        new Uint32Array(
          position.count
        );

      for (
        let i = 0;
        i < position.count;
        i++
      ) {

        indices[i] = i;

      }

    }

    // --------------------------------------------------------
    // TRIMESH RAPIER
    // --------------------------------------------------------

    const colliderDesc =
      RAPIER.ColliderDesc
        .trimesh(
          vertices,
          indices
        )
        .setFriction(
          0.9
        )
        .setRestitution(
          0.05
        );

    physicsWorld.createCollider(
      colliderDesc
    );

    colliderCount++;

    geometry.dispose();

  });

  console.log(
    `✅ Colliders físicos del escenario: ${colliderCount}`
  );

}

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
  mass = 4,
  color = 0x94a3b8
) {

  // ----------------------------------------------------------
  // THREE.JS
  // ----------------------------------------------------------

  const mesh =
    new THREE.Mesh(

      new THREE.BoxGeometry(
        sx,
        sy,
        sz
      ),

      new THREE.MeshStandardMaterial({
        color,
        roughness: 0.55,
        metalness: 0.12
      })

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
  // RIGID BODY
  // ----------------------------------------------------------

  const bodyDesc =
    RAPIER.RigidBodyDesc
      .dynamic()
      .setTranslation(
        x,
        y,
        z
      )
      .setCcdEnabled(
        true
      );

  const body =
    physicsWorld.createRigidBody(
      bodyDesc
    );

  // ----------------------------------------------------------
  // COLLIDER
  // ----------------------------------------------------------

  const volume =
    Math.max(
      sx * sy * sz,
      0.01
    );

  const colliderDesc =
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
        0.75
      )
      .setRestitution(
        0.18
      );

  physicsWorld.createCollider(
    colliderDesc,
    body
  );

  physicalObjects.push({
    mesh,
    body,

    spawn: {
      x,
      y,
      z
    }
  });

}

// ============================================================
// CREAR TODOS LOS OBJETOS
// ============================================================

function createPhysicalObjects() {

  // Torre principal.
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

        0.55 +
        level,

        -5,

        1,
        1,
        1,

        4,

        0x94a3b8
      );

    }

  }

  // Caja grande.
  createDynamicBox(
    3,
    0.8,
    -5,
    1.2,
    1.5,
    1.2,
    8,
    0x64748b
  );

  // Caja pequeña.
  createDynamicBox(
    4.4,
    0.45,
    -5,
    0.8,
    0.8,
    0.8,
    2,
    0xcbd5e1
  );

}

// ============================================================
// CARGAR COLLISION-WORLD.GLB
// ============================================================

const loader =
  new GLTFLoader();

loader.load(

  './assets/models/collision-world.glb',

  (gltf) => {

    const model =
      gltf.scene;

    model.traverse((child) => {

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

    });

    scene.add(
      model
    );

    // --------------------------------------------------------
    // COLISIONES DEL JUGADOR
    // --------------------------------------------------------

    worldOctree.fromGraphNode(
      model
    );

    // --------------------------------------------------------
    // COLISIONES DE LAS CAJAS
    // --------------------------------------------------------

    createRapierWorldColliders(
      model
    );

    // Solo creamos las cajas cuando el escenario físico
    // ya está preparado.
    createPhysicalObjects();

    console.log(
      '✅ Escenario cargado correctamente'
    );

    console.log(
      '✅ Octree generado'
    );

    console.log(
      '✅ Física Rapier del escenario generada'
    );

  },

  undefined,

  (error) => {

    console.error(
      '❌ Error al cargar collision-world.glb:',
      error
    );

  }

);

// ============================================================
// VECTOR FRONTAL
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
    worldOctree.capsuleIntersect(
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
      result.normal.multiplyScalar(
        result.depth
      )
    );

  }

}

// ============================================================
// EMPUJAR CAJAS CON EL JUGADOR
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
      distance <
      1.15
    ) {

      const force =
        1.3 /
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
            0.08,

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

    damping *=
      0.1;

  }

  playerVelocity.addScaledVector(
    playerVelocity,
    damping
  );

  playerCollider.translate(

    playerVelocity
      .clone()
      .multiplyScalar(
        deltaTime
      )

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
// DISPARO LÁSER
// ============================================================

function shootLaser() {

  if (
    document.pointerLockElement !==
    renderer.domElement
  ) {
    return;
  }

  const direction =
    new THREE.Vector3();

  camera.getWorldDirection(
    direction
  );

  direction.normalize();

  // Láser visual más largo y grueso.
  const geometry =
    new THREE.CylinderGeometry(
      0.055,
      0.055,
      1.5,
      12
    );

  geometry.rotateX(
    Math.PI / 2
  );

  const material =
    new THREE.MeshBasicMaterial({
      color: 0x67e8f9
    });

  const mesh =
    new THREE.Mesh(
      geometry,
      material
    );

  mesh.position
    .copy(
      camera.position
    )
    .addScaledVector(
      direction,
      0.9
    );

  mesh.quaternion.setFromUnitVectors(
    new THREE.Vector3(
      0,
      0,
      1
    ),
    direction
  );

  // Brillo del proyectil.
  const laserLight =
    new THREE.PointLight(
      0x22d3ee,
      3,
      4,
      2
    );

  mesh.add(
    laserLight
  );

  scene.add(
    mesh
  );

  lasers.push({
    mesh,
    direction,

    // Antes: 32
    speed: 90,

    life: 1.3
  });

}

// ============================================================
// EFECTO DE IMPACTO
// ============================================================

function createImpact(
  position
) {

  // Flash.
  const flash =
    new THREE.PointLight(
      0x67e8f9,
      18,
      7,
      2
    );

  flash.position.copy(
    position
  );

  scene.add(
    flash
  );

  // Esfera brillante.
  const impact =
    new THREE.Mesh(

      new THREE.SphereGeometry(
        0.13,
        12,
        12
      ),

      new THREE.MeshBasicMaterial({
        color: 0xffffff
      })

    );

  impact.position.copy(
    position
  );

  scene.add(
    impact
  );

  setTimeout(
    () => {

      scene.remove(
        flash
      );

      scene.remove(
        impact
      );

      impact.geometry.dispose();

      impact.material.dispose();

    },

    110
  );

}

// ============================================================
// ACTUALIZAR LÁSER
// ============================================================

function updateLasers(
  deltaTime
) {

  const meshes =
    physicalObjects.map(
      (item) =>
        item.mesh
    );

  for (
    let i =
      lasers.length - 1;

    i >= 0;

    i--
  ) {

    const laser =
      lasers[i];

    const distance =
      laser.speed *
      deltaTime;

    const ray =
      new THREE.Raycaster(
        laser.mesh.position,
        laser.direction,
        0,
        distance + 0.8
      );

    const hit =
      ray.intersectObjects(
        meshes,
        false
      )[0];

    if (
      hit
    ) {

      const item =
        physicalObjects.find(
          (entry) =>
            entry.mesh ===
            hit.object
        );

      if (
        item
      ) {

        // ====================================================
        // IMPULSO MUCHO MÁS FUERTE
        // ====================================================

        const force =
          24;

        const impulse = {

          x:
            laser.direction.x *
            force,

          y:
            laser.direction.y *
            force +
            3,

          z:
            laser.direction.z *
            force

        };

        // Aplicarlo justo donde golpeó el láser.
        // Esto genera movimiento + rotación.
        item.body.applyImpulseAtPoint(

          impulse,

          {
            x:
              hit.point.x,

            y:
              hit.point.y,

            z:
              hit.point.z
          },

          true

        );

      }

      createImpact(
        hit.point
      );

      scene.remove(
        laser.mesh
      );

      laser.mesh.geometry.dispose();

      laser.mesh.material.dispose();

      lasers.splice(
        i,
        1
      );

      continue;

    }

    // Mover láser.
    laser.mesh.position.addScaledVector(
      laser.direction,
      distance
    );

    laser.life -=
      deltaTime;

    if (
      laser.life <= 0
    ) {

      scene.remove(
        laser.mesh
      );

      laser.mesh.geometry.dispose();

      laser.mesh.material.dispose();

      lasers.splice(
        i,
        1
      );

    }

  }

}

// ============================================================
// RECUPERAR OBJETOS QUE CAIGAN FUERA DEL MAPA
// ============================================================

function recoverFallenObjects() {

  for (
    const item of physicalObjects
  ) {

    const position =
      item.body.translation();

    if (
      position.y <
      -25
    ) {

      item.body.setTranslation(
        {
          x:
            item.spawn.x,

          y:
            item.spawn.y +
            3,

          z:
            item.spawn.z
        },

        true
      );

      item.body.setRotation(
        {
          x: 0,
          y: 0,
          z: 0,
          w: 1
        },

        true
      );

      item.body.setLinvel(
        {
          x: 0,
          y: 0,
          z: 0
        },

        true
      );

      item.body.setAngvel(
        {
          x: 0,
          y: 0,
          z: 0
        },

        true
      );

    }

  }

}

// ============================================================
// SINCRONIZAR RAPIER → THREE.JS
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
// MOUSE
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
// DISPARO
// ============================================================

document.addEventListener(
  'mousedown',
  (event) => {

    if (
      event.button === 0
    ) {

      shootLaser();

    }

  }
);

// ============================================================
// ANIMACIÓN
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

  // Física.
  physicsWorld.timestep =
    delta;

  physicsWorld.step();

  recoverFallenObjects();

  syncPhysics();

  // Disparos.
  updateLasers(
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