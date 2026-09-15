import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Octree } from 'three/addons/math/Octree.js';
import { Capsule } from 'three/addons/math/Capsule.js';

import RAPIER from 'https://cdn.skypack.dev/@dimforge/rapier3d-compat';

await RAPIER.init();

// ============================================================
// CONFIGURACIÓN
// ============================================================

const MAX_CHARGE_TIME = 2;

const LASER_MIN_SPEED = 90;
const LASER_MAX_SPEED = 145;

const LASER_MIN_FORCE = 18;
const LASER_MAX_FORCE = 55;

const AIM_DISTANCE = 500;

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

scene.add(camera);

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
// TIMER
// ============================================================

const timer = new THREE.Timer();

// ============================================================
// OCTREE
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

const keyStates = {};

// ============================================================
// RAPIER
// ============================================================

const physicsWorld = new RAPIER.World({
  x: 0,
  y: -9.81,
  z: 0
});

const physicalObjects = [];

const lasers = [];

// ============================================================
// ESTADO DEL ARMA
// ============================================================

let chargingShot = false;

let chargeStartTime = 0;

let cameraRecoil = 0;

let weaponRecoil = 0;

let weaponKick = 0;

// ============================================================
// BANANA BLÁSTER
// ============================================================

const bananaGun = new THREE.Group();

const bananaBasePosition = new THREE.Vector3(
  0.46,
  -0.38,
  -0.72
);

bananaGun.position.copy(
  bananaBasePosition
);

// ============================================================
// CUERPO DEL PLÁTANO
// ============================================================

const bananaCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(
    0,
    -0.03,
    0.22
  ),

  new THREE.Vector3(
    0,
    -0.04,
    0
  ),

  new THREE.Vector3(
    0.02,
    -0.02,
    -0.25
  ),

  new THREE.Vector3(
    0.06,
    0.05,
    -0.5
  ),

  new THREE.Vector3(
    0.1,
    0.16,
    -0.78
  )
]);

const bananaGeometry = new THREE.TubeGeometry(
  bananaCurve,
  32,
  0.115,
  12,
  false
);

const bananaMaterial = new THREE.MeshStandardMaterial({
  color: 0xffdc32,
  roughness: 0.48,
  metalness: 0.05
});

const bananaMesh = new THREE.Mesh(
  bananaGeometry,
  bananaMaterial
);

bananaMesh.castShadow = true;

bananaGun.add(
  bananaMesh
);

// ============================================================
// PUNTA TRASERA
// ============================================================

const backTip = new THREE.Mesh(
  new THREE.CylinderGeometry(
    0.055,
    0.07,
    0.13,
    10
  ),

  new THREE.MeshStandardMaterial({
    color: 0x6b4423,
    roughness: 0.8
  })
);

backTip.rotation.x =
  Math.PI / 2;

backTip.position.set(
  0,
  -0.03,
  0.29
);

bananaGun.add(
  backTip
);

// ============================================================
// PUNTA DEL CAÑÓN
// ============================================================

const frontTip = new THREE.Mesh(
  new THREE.CylinderGeometry(
    0.055,
    0.075,
    0.16,
    10
  ),

  new THREE.MeshStandardMaterial({
    color: 0x594126,
    roughness: 0.8
  })
);

frontTip.rotation.x =
  Math.PI / 2;

frontTip.rotation.z =
  -0.18;

frontTip.position.set(
  0.105,
  0.19,
  -0.84
);

bananaGun.add(
  frontTip
);

// ============================================================
// EMPUÑADURA
// ============================================================

const grip = new THREE.Mesh(
  new THREE.BoxGeometry(
    0.13,
    0.33,
    0.13
  ),

  new THREE.MeshStandardMaterial({
    color: 0x44311e,
    roughness: 0.75
  })
);

grip.position.set(
  0,
  -0.2,
  -0.18
);

grip.rotation.x =
  -0.18;

bananaGun.add(
  grip
);

// ============================================================
// GATILLO
// ============================================================

const trigger = new THREE.Mesh(
  new THREE.TorusGeometry(
    0.065,
    0.012,
    8,
    16,
    Math.PI
  ),

  new THREE.MeshStandardMaterial({
    color: 0x222222,
    metalness: 0.5,
    roughness: 0.4
  })
);

trigger.position.set(
  0,
  -0.1,
  -0.24
);

trigger.rotation.y =
  Math.PI / 2;

bananaGun.add(
  trigger
);

// ============================================================
// PUNTO DE SALIDA DEL DISPARO
// ============================================================

const muzzle = new THREE.Object3D();

muzzle.position.set(
  0.11,
  0.2,
  -0.96
);

bananaGun.add(
  muzzle
);

// ============================================================
// ESFERA DE CARGA
// ============================================================

const chargeOrb = new THREE.Mesh(
  new THREE.SphereGeometry(
    0.075,
    16,
    16
  ),

  new THREE.MeshStandardMaterial({
    color: 0xffff33,
    emissive: 0xffcc00,
    emissiveIntensity: 4,
    transparent: true,
    opacity: 0.9
  })
);

chargeOrb.visible = false;

chargeOrb.position.copy(
  muzzle.position
);

bananaGun.add(
  chargeOrb
);

// ============================================================
// LUZ DE CARGA
// ============================================================

const chargeLight = new THREE.PointLight(
  0xffdd22,
  0,
  3,
  2
);

chargeLight.position.copy(
  muzzle.position
);

bananaGun.add(
  chargeLight
);

// ============================================================
// COLOCAR ARMA EN CÁMARA
// ============================================================

bananaGun.rotation.set(
  -0.05,
  -0.08,
  0.02
);

camera.add(
  bananaGun
);

// ============================================================
// CREAR COLISIONES RAPIER DEL MAPA
// ============================================================

function createRapierWorldColliders(
  model
) {

  model.updateMatrixWorld(
    true
  );

  let colliderCount = 0;

  model.traverse((child) => {

    if (
      !child.isMesh ||
      !child.geometry ||
      !child.geometry.attributes.position
    ) {
      return;
    }

    const geometry =
      child.geometry.clone();

    geometry.applyMatrix4(
      child.matrixWorld
    );

    const position =
      geometry.attributes.position;

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

    const collider =
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
      collider
    );

    colliderCount++;

    geometry.dispose();

  });

  console.log(
    `✅ Colliders del escenario: ${colliderCount}`
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

  const mesh = new THREE.Mesh(
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

  const body =
    physicsWorld.createRigidBody(

      RAPIER.RigidBodyDesc
        .dynamic()
        .setTranslation(
          x,
          y,
          z
        )
        .setCcdEnabled(
          true
        )

    );

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
        0.75
      )
      .setRestitution(
        0.18
      );

  physicsWorld.createCollider(
    collider,
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
// CREAR OBJETOS
// ============================================================

function createPhysicalObjects() {

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
// CARGAR ESCENARIO
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

    worldOctree.fromGraphNode(
      model
    );

    createRapierWorldColliders(
      model
    );

    createPhysicalObjects();

    console.log(
      '✅ Escenario cargado'
    );

    console.log(
      '🍌 Banana Bláster lista'
    );

    console.log(
      '🎯 Apuntado centrado activado'
    );

  },

  undefined,

  (error) => {

    console.error(
      '❌ Error cargando escenario:',
      error
    );

  }
);

// ============================================================
// MOVIMIENTO
// ============================================================

function getForwardVector() {

  camera.getWorldDirection(
    playerDirection
  );

  playerDirection.y = 0;

  return playerDirection.normalize();

}

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
// COLISIONES JUGADOR
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
// EMPUJAR OBJETOS
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

  // Retroceso de cámara.
  if (
    cameraRecoil >
    0.001
  ) {

    const recoilDirection =
      new THREE.Vector3();

    camera.getWorldDirection(
      recoilDirection
    );

    camera.position.addScaledVector(
      recoilDirection,
      -cameraRecoil
    );

  }

  pushNearbyObjects();

  if (
    camera.position.y <
    -20
  ) {

    resetPlayer();

  }

}

// ============================================================
// RESET JUGADOR
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

}

// ============================================================
// CARGA
// ============================================================

function getChargeLevel() {

  if (
    !chargingShot
  ) {
    return 0;
  }

  const elapsed =
    (
      performance.now() -
      chargeStartTime
    ) /
    1000;

  return THREE.MathUtils.clamp(
    elapsed /
    MAX_CHARGE_TIME,
    0,
    1
  );

}

// ============================================================
// COMENZAR CARGA
// ============================================================

function startCharging() {

  if (
    document.pointerLockElement !==
    renderer.domElement
  ) {
    return;
  }

  if (
    chargingShot
  ) {
    return;
  }

  chargingShot = true;

  chargeStartTime =
    performance.now();

  chargeOrb.visible = true;

}

// ============================================================
// CANCELAR CARGA
// ============================================================

function cancelCharge() {

  chargingShot = false;

  chargeOrb.visible = false;

  chargeLight.intensity = 0;

}

// ============================================================
// OBTENER PUNTO EXACTO DE LA MIRA
// ============================================================

function getAimTarget() {

  camera.updateMatrixWorld(
    true
  );

  const cameraPosition =
    new THREE.Vector3();

  const cameraDirection =
    new THREE.Vector3();

  camera.getWorldPosition(
    cameraPosition
  );

  camera.getWorldDirection(
    cameraDirection
  );

  cameraDirection.normalize();

  // ----------------------------------------------------------
  // RAYCAST DESDE EL CENTRO EXACTO DE LA CÁMARA
  // ----------------------------------------------------------

  const aimRay =
    new THREE.Raycaster(
      cameraPosition,
      cameraDirection,
      0,
      AIM_DISTANCE
    );

  // Objetos a los que podemos disparar.
  const targets =
    physicalObjects.map(
      (item) =>
        item.mesh
    );

  const hits =
    aimRay.intersectObjects(
      targets,
      false
    );

  // Si la mira está encima de una caja,
  // apuntamos exactamente al punto de impacto.
  if (
    hits.length > 0
  ) {

    return hits[0].point.clone();

  }

  // Si no hay ningún objeto en la mira,
  // apuntamos a un punto lejano perfectamente
  // alineado con el centro de la pantalla.
  return cameraPosition
    .clone()
    .addScaledVector(
      cameraDirection,
      AIM_DISTANCE
    );

}

// ============================================================
// DISPARAR
// ============================================================

function fireChargedShot() {

  if (
    !chargingShot
  ) {
    return;
  }

  const charge =
    getChargeLevel();

  chargingShot = false;

  chargeOrb.visible = false;

  chargeLight.intensity = 0;

  // ==========================================================
  // ACTUALIZAR MATRICES
  // ==========================================================

  camera.updateMatrixWorld(
    true
  );

  bananaGun.updateMatrixWorld(
    true
  );

  // ==========================================================
  // POSICIÓN REAL DE LA PUNTA DEL PLÁTANO
  // ==========================================================

  const spawnPosition =
    new THREE.Vector3();

  muzzle.getWorldPosition(
    spawnPosition
  );

  // ==========================================================
  // PUNTO EXACTO AL QUE APUNTA LA MIRA
  // ==========================================================

  const targetPoint =
    getAimTarget();

  // ==========================================================
  // DIRECCIÓN CORREGIDA
  //
  // ANTES:
  // dirección de cámara
  //
  // AHORA:
  // punta del arma -> punto de la mira
  // ==========================================================

  const direction =
    new THREE.Vector3()
      .subVectors(
        targetPoint,
        spawnPosition
      )
      .normalize();

  // ==========================================================
  // TAMAÑO SEGÚN CARGA
  // ==========================================================

  const radius =
    THREE.MathUtils.lerp(
      0.045,
      0.13,
      charge
    );

  const length =
    THREE.MathUtils.lerp(
      1.1,
      3,
      charge
    );

  const geometry =
    new THREE.CylinderGeometry(
      radius,
      radius,
      length,
      12
    );

  geometry.rotateX(
    Math.PI / 2
  );

  // ==========================================================
  // PROYECTIL AMARILLO
  // ==========================================================

  const material =
    new THREE.MeshStandardMaterial({
      color: 0xffff33,
      emissive: 0xffcc00,

      emissiveIntensity:
        THREE.MathUtils.lerp(
          4,
          12,
          charge
        )
    });

  const mesh =
    new THREE.Mesh(
      geometry,
      material
    );

  mesh.position.copy(
    spawnPosition
  );

  mesh.quaternion.setFromUnitVectors(
    new THREE.Vector3(
      0,
      0,
      1
    ),
    direction
  );

  // ==========================================================
  // LUZ DEL DISPARO
  // ==========================================================

  const laserLight =
    new THREE.PointLight(
      0xffdd22,

      THREE.MathUtils.lerp(
        4,
        15,
        charge
      ),

      THREE.MathUtils.lerp(
        4,
        9,
        charge
      ),

      2
    );

  mesh.add(
    laserLight
  );

  scene.add(
    mesh
  );

  // ==========================================================
  // VELOCIDAD Y FUERZA
  // ==========================================================

  const speed =
    THREE.MathUtils.lerp(
      LASER_MIN_SPEED,
      LASER_MAX_SPEED,
      charge
    );

  const force =
    THREE.MathUtils.lerp(
      LASER_MIN_FORCE,
      LASER_MAX_FORCE,
      charge
    );

  lasers.push({
    mesh,
    direction,
    speed,
    force,
    charge,
    life: 1.4
  });

  // ==========================================================
  // RETROCESO
  // ==========================================================

  cameraRecoil +=
    THREE.MathUtils.lerp(
      0.035,
      0.16,
      charge
    );

  weaponRecoil +=
    THREE.MathUtils.lerp(
      0.06,
      0.2,
      charge
    );

  weaponKick +=
    THREE.MathUtils.lerp(
      0.025,
      0.12,
      charge
    );

  camera.rotation.x +=
    THREE.MathUtils.lerp(
      0.008,
      0.035,
      charge
    );

}

// ============================================================
// ACTUALIZAR ARMA
// ============================================================

function updateWeapon(
  deltaTime
) {

  if (
    chargingShot
  ) {

    const charge =
      getChargeLevel();

    chargeOrb.visible = true;

    const scale =
      THREE.MathUtils.lerp(
        0.7,
        2.8,
        charge
      );

    chargeOrb.scale.setScalar(
      scale
    );

    chargeOrb.material.emissiveIntensity =
      THREE.MathUtils.lerp(
        3,
        15,
        charge
      );

    chargeLight.intensity =
      THREE.MathUtils.lerp(
        2,
        18,
        charge
      );

    chargeLight.distance =
      THREE.MathUtils.lerp(
        2,
        6,
        charge
      );

    // Vibración con carga alta.
    if (
      charge >
      0.65
    ) {

      bananaGun.position.x =
        bananaBasePosition.x +
        (
          Math.random() -
          0.5
        ) *
        0.006 *
        charge;

      bananaGun.position.y =
        bananaBasePosition.y +
        (
          Math.random() -
          0.5
        ) *
        0.006 *
        charge;

    }

  }

  // Recuperación de retroceso.
  cameraRecoil =
    THREE.MathUtils.lerp(
      cameraRecoil,
      0,
      1 -
      Math.exp(
        -12 *
        deltaTime
      )
    );

  weaponRecoil =
    THREE.MathUtils.lerp(
      weaponRecoil,
      0,
      1 -
      Math.exp(
        -15 *
        deltaTime
      )
    );

  weaponKick =
    THREE.MathUtils.lerp(
      weaponKick,
      0,
      1 -
      Math.exp(
        -14 *
        deltaTime
      )
    );

  if (
    !chargingShot
  ) {

    bananaGun.position.x =
      THREE.MathUtils.lerp(
        bananaGun.position.x,
        bananaBasePosition.x,
        0.18
      );

    bananaGun.position.y =
      THREE.MathUtils.lerp(
        bananaGun.position.y,
        bananaBasePosition.y,
        0.18
      );

  }

  bananaGun.position.z =
    bananaBasePosition.z +
    weaponRecoil;

  bananaGun.rotation.x =
    -0.05 +
    weaponKick;

}

// ============================================================
// IMPACTO
// ============================================================

function createImpact(
  position,
  charge
) {

  const flash =
    new THREE.PointLight(
      0xffff33,

      THREE.MathUtils.lerp(
        12,
        32,
        charge
      ),

      THREE.MathUtils.lerp(
        5,
        10,
        charge
      ),

      2
    );

  flash.position.copy(
    position
  );

  scene.add(
    flash
  );

  const impact =
    new THREE.Mesh(

      new THREE.SphereGeometry(
        THREE.MathUtils.lerp(
          0.1,
          0.28,
          charge
        ),
        16,
        16
      ),

      new THREE.MeshBasicMaterial({
        color: 0xffff55
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

    120
  );

}

// ============================================================
// ACTUALIZAR PROYECTILES
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
        distance + 1
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

        const impulse = {

          x:
            laser.direction.x *
            laser.force,

          y:
            laser.direction.y *
            laser.force +
            THREE.MathUtils.lerp(
              2,
              8,
              laser.charge
            ),

          z:
            laser.direction.z *
            laser.force

        };

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
        hit.point,
        laser.charge
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
// RECUPERAR OBJETOS
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
// SINCRONIZAR FÍSICA
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
// INICIAR CARGA
// ============================================================

document.addEventListener(
  'mousedown',
  (event) => {

    if (
      event.button === 0
    ) {

      startCharging();

    }

  }
);

// ============================================================
// SOLTAR DISPARO
// ============================================================

document.addEventListener(
  'mouseup',
  (event) => {

    if (
      event.button === 0
    ) {

      fireChargedShot();

    }

  }
);

// ============================================================
// SALIR DE POINTER LOCK
// ============================================================

document.addEventListener(
  'pointerlockchange',
  () => {

    if (
      document.pointerLockElement !==
      renderer.domElement
    ) {

      cancelCharge();

    }

  }
);

// ============================================================
// LOOP
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

  updateWeapon(
    delta
  );

  physicsWorld.timestep =
    delta;

  physicsWorld.step();

  recoverFallenObjects();

  syncPhysics();

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