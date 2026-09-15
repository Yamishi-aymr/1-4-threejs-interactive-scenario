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

const BANANA_MIN_SPEED = 35;
const BANANA_MAX_SPEED = 65;

const BANANA_MIN_FORCE = 18;
const BANANA_MAX_FORCE = 55;

const AIM_DISTANCE = 500;

// El jugador ahora espera a que el escenario esté listo.
const PLAYER_SPAWN_START = new THREE.Vector3(
  0,
  0.55,
  0
);

const PLAYER_SPAWN_END = new THREE.Vector3(
  0,
  1.20,
  0
);

const PLAYER_RADIUS = 0.35;

// ============================================================
// ESCENA
// ============================================================

const container =
  document.getElementById(
    'scene-container'
  );

const scene =
  new THREE.Scene();

scene.background =
  new THREE.Color(
    0x79d7f2
  );

scene.fog =
  new THREE.Fog(
    0xa9e7ef,
    42,
    125
  );

// ============================================================
// CÁMARA
// ============================================================

const camera =
  new THREE.PerspectiveCamera(
    70,
    window.innerWidth /
      window.innerHeight,
    0.1,
    1000
  );

camera.rotation.order =
  'YXZ';

scene.add(
  camera
);

// ============================================================
// RENDERER
// ============================================================

const renderer =
  new THREE.WebGLRenderer({
    antialias: true
  });

renderer.setPixelRatio(
  Math.min(
    window.devicePixelRatio,
    1.75
  )
);

renderer.setSize(
  window.innerWidth,
  window.innerHeight
);

renderer.shadowMap.enabled =
  true;

renderer.shadowMap.type =
  THREE.PCFSoftShadowMap;

renderer.outputColorSpace =
  THREE.SRGBColorSpace;

renderer.toneMapping =
  THREE.ACESFilmicToneMapping;

renderer.toneMappingExposure =
  1.08;

container.appendChild(
  renderer.domElement
);

// ============================================================
// ILUMINACIÓN
// ============================================================

scene.add(
  new THREE.HemisphereLight(
    0xc8efff,
    0xc39a57,
    2.25
  )
);

const sunLight =
  new THREE.DirectionalLight(
    0xfff1c4,
    3.4
  );

sunLight.position.set(
  -14,
  24,
  10
);

sunLight.castShadow =
  true;

sunLight.shadow.mapSize.set(
  1024,
  1024
);

sunLight.shadow.camera.left =
  -24;

sunLight.shadow.camera.right =
  24;

sunLight.shadow.camera.top =
  24;

sunLight.shadow.camera.bottom =
  -24;

scene.add(
  sunLight
);

// ============================================================
// SOL
// ============================================================

const sunMesh =
  new THREE.Mesh(
    new THREE.SphereGeometry(
      3.2,
      20,
      20
    ),

    new THREE.MeshBasicMaterial({
      color: 0xffdf71
    })
  );

sunMesh.position.set(
  -32,
  26,
  -62
);

scene.add(
  sunMesh
);

// ============================================================
// TEXTURA PROCEDURAL DE ARENA
// ============================================================

function createSandTexture() {

  const canvas =
    document.createElement(
      'canvas'
    );

  canvas.width =
    128;

  canvas.height =
    128;

  const ctx =
    canvas.getContext(
      '2d'
    );

  const image =
    ctx.createImageData(
      128,
      128
    );

  for (
    let i = 0;
    i < image.data.length;
    i += 4
  ) {

    const n =
      Math.floor(
        Math.random() * 22
      ) - 11;

    image.data[i] =
      226 + n;

    image.data[i + 1] =
      194 + n;

    image.data[i + 2] =
      123 +
      Math.floor(
        n * 0.55
      );

    image.data[i + 3] =
      255;

  }

  ctx.putImageData(
    image,
    0,
    0
  );

  // Motitas de arena.
  for (
    let i = 0;
    i < 220;
    i++
  ) {

    const v =
      145 +
      Math.floor(
        Math.random() * 55
      );

    ctx.fillStyle =
      `rgba(${v}, ${Math.max(
        95,
        v - 25
      )}, 55, 0.18)`;

    ctx.beginPath();

    ctx.arc(
      Math.random() *
        128,

      Math.random() *
        128,

      0.5 +
        Math.random() *
        1.3,

      0,

      Math.PI * 2
    );

    ctx.fill();

  }

  const texture =
    new THREE.CanvasTexture(
      canvas
    );

  texture.wrapS =
    THREE.RepeatWrapping;

  texture.wrapT =
    THREE.RepeatWrapping;

  texture.repeat.set(
    14,
    14
  );

  texture.colorSpace =
    THREE.SRGBColorSpace;

  texture.anisotropy =
    Math.min(
      4,
      renderer.capabilities
        .getMaxAnisotropy()
    );

  return texture;

}

// ============================================================
// ARENA
// ============================================================

const sandMaterial =
  new THREE.MeshStandardMaterial({
    map:
      createSandTexture(),

    color:
      0xffffff,

    roughness:
      1,

    metalness:
      0,

    polygonOffset:
      true,

    polygonOffsetFactor:
      -2,

    polygonOffsetUnits:
      -2
  });

const sand =
  new THREE.Mesh(
    new THREE.CircleGeometry(
      27.5,
      64
    ),
    sandMaterial
  );

sand.rotation.x =
  -Math.PI / 2;

// Antes estaba debajo del escenario.
// Ahora está ligeramente por encima.
sand.position.y =
  0.035;

sand.receiveShadow =
  true;

sand.renderOrder =
  2;

scene.add(
  sand
);

// ============================================================
// AGUA
// ============================================================

const water =
  new THREE.Mesh(
    new THREE.CircleGeometry(
      80,
      72
    ),

    new THREE.MeshPhysicalMaterial({
      color:
        0x19b9d6,

      transparent:
        true,

      opacity:
        0.82,

      roughness:
        0.2,

      metalness:
        0,

      clearcoat:
        0.65,

      clearcoatRoughness:
        0.2
    })
  );

water.rotation.x =
  -Math.PI / 2;

water.position.y =
  -0.5;

scene.add(
  water
);

// ============================================================
// PALMERAS
// ============================================================

function createPalmTree(
  x,
  y,
  z,
  scale = 1
) {

  const palm =
    new THREE.Group();

  const trunkMaterial =
    new THREE.MeshStandardMaterial({
      color:
        0x8b572f,

      roughness:
        0.92
    });

  const leafMaterial =
    new THREE.MeshStandardMaterial({
      color:
        0x2b9348,

      roughness:
        0.85,

      side:
        THREE.DoubleSide
    });

  const coconutMaterial =
    new THREE.MeshStandardMaterial({
      color:
        0x58351f,

      roughness:
        0.95
    });

  // Un solo tronco en vez de muchos segmentos.
  const trunk =
    new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.18 * scale,
        0.28 * scale,
        4.2 * scale,
        8
      ),
      trunkMaterial
    );

  trunk.position.y =
    2.1 * scale;

  trunk.rotation.z =
    0.035;

  trunk.castShadow =
    true;

  palm.add(
    trunk
  );

  const topY =
    4.25 * scale;

  // Hojas.
  for (
    let i = 0;
    i < 7;
    i++
  ) {

    const leaf =
      new THREE.Mesh(
        new THREE.ConeGeometry(
          0.32 * scale,
          2.8 * scale,
          6
        ),
        leafMaterial
      );

    const angle =
      (
        i /
        7
      ) *
      Math.PI *
      2;

    leaf.position.set(
      Math.cos(angle) *
        0.68 *
        scale,

      topY,

      Math.sin(angle) *
        0.68 *
        scale
    );

    leaf.rotation.z =
      Math.PI /
      2.55;

    leaf.rotation.y =
      -angle;

    leaf.castShadow =
      true;

    palm.add(
      leaf
    );

  }

  // Cocos.
  for (
    let i = 0;
    i < 3;
    i++
  ) {

    const coconut =
      new THREE.Mesh(
        new THREE.SphereGeometry(
          0.17 *
            scale,
          8,
          8
        ),

        coconutMaterial
      );

    const angle =
      (
        i /
        3
      ) *
      Math.PI *
      2;

    coconut.position.set(
      Math.cos(angle) *
        0.28 *
        scale,

      topY -
        0.18 *
        scale,

      Math.sin(angle) *
        0.28 *
        scale
    );

    palm.add(
      coconut
    );

  }

  palm.position.set(
    x,
    y,
    z
  );

  scene.add(
    palm
  );

  return palm;

}

createPalmTree(
  -11,
  0,
  -8,
  1.05
);

createPalmTree(
  11,
  0,
  -9,
  1.12
);

createPalmTree(
  -12,
  0,
  8,
  0.92
);

createPalmTree(
  12,
  0,
  9,
  1.02
);

// ============================================================
// ROCAS
// ============================================================

function createRock(
  x,
  y,
  z,
  scale = 1
) {

  const rock =
    new THREE.Mesh(
      new THREE.IcosahedronGeometry(
        0.8,
        1
      ),

      new THREE.MeshStandardMaterial({
        color:
          0x8c8170,

        roughness:
          1
      })
    );

  rock.position.set(
    x,
    y,
    z
  );

  rock.scale.set(
    scale,
    scale * 0.72,
    scale * 1.1
  );

  rock.rotation.set(
    Math.random() *
      0.3,

    Math.random() *
      Math.PI,

    Math.random() *
      0.2
  );

  rock.castShadow =
    true;

  rock.receiveShadow =
    true;

  scene.add(
    rock
  );

}

createRock(
  -9,
  0.45,
  -3,
  1.25
);

createRock(
  9,
  0.35,
  2,
  0.95
);

createRock(
  -11,
  0.4,
  11,
  1.05
);

createRock(
  10,
  0.45,
  12,
  1.3
);

// ============================================================
// NUBES
// ============================================================

function createCloud(
  x,
  y,
  z,
  scale = 1
) {

  const cloud =
    new THREE.Group();

  const material =
    new THREE.MeshStandardMaterial({
      color:
        0xffffff,

      transparent:
        true,

      opacity:
        0.86,

      roughness:
        1
    });

  const puffGeometry =
    new THREE.SphereGeometry(
      1,
      10,
      8
    );

  const parts = [
    [0, 0, 0, 1],
    [1.05, 0.05, 0, 0.75],
    [-1.05, 0.03, 0, 0.72],
    [0.45, 0.38, 0, 0.62],
    [-0.42, 0.34, 0, 0.64]
  ];

  for (
    const [
      px,
      py,
      pz,
      ps
    ] of parts
  ) {

    const puff =
      new THREE.Mesh(
        puffGeometry,
        material
      );

    puff.position.set(
      px,
      py,
      pz
    );

    puff.scale.setScalar(
      ps
    );

    cloud.add(
      puff
    );

  }

  cloud.position.set(
    x,
    y,
    z
  );

  cloud.scale.setScalar(
    scale
  );

  scene.add(
    cloud
  );

  return cloud;

}

const clouds = [
  createCloud(
    -18,
    14,
    -30,
    1.6
  ),

  createCloud(
    14,
    18,
    -42,
    1.9
  ),

  createCloud(
    -7,
    20,
    -58,
    2.1
  )
];

// ============================================================
// JUGADOR Y FÍSICA
// ============================================================

const timer =
  new THREE.Timer();

const worldOctree =
  new Octree();

const playerCollider =
  new Capsule(
    PLAYER_SPAWN_START.clone(),
    PLAYER_SPAWN_END.clone(),
    PLAYER_RADIUS
  );

const playerVelocity =
  new THREE.Vector3();

const playerDirection =
  new THREE.Vector3();

const keyStates = {};

let playerOnFloor =
  false;

// Evita que caiga mientras carga el GLB.
let worldReady =
  false;

let dynamicPhysicsReady =
  false;

camera.position.copy(
  PLAYER_SPAWN_END
);

// ============================================================
// RAPIER
// ============================================================

const physicsWorld =
  new RAPIER.World({
    x: 0,
    y: -9.81,
    z: 0
  });

const physicalObjects =
  [];

const lasers =
  [];

// Objetos temporales reutilizables.
// Evitan crear objetos cada frame.
const tempBox =
  new THREE.Box3();

const tempCenter =
  new THREE.Vector3();

const tempNormal =
  new THREE.Vector3();

const tempMove =
  new THREE.Vector3();

// ============================================================
// FORMA DE PLÁTANO
// ============================================================

function createBananaShapeGeometry(
  depth = 0.11
) {

  const shape =
    new THREE.Shape();

  shape.moveTo(
    -0.46,
    -0.06
  );

  shape.bezierCurveTo(
    -0.33,
    0.19,

    -0.13,
    0.31,

    0.08,
    0.29
  );

  shape.bezierCurveTo(
    0.25,
    0.28,

    0.41,
    0.13,

    0.48,
    -0.05
  );

  shape.bezierCurveTo(
    0.29,
    0.08,

    0.13,
    0.11,

    -0.02,
    0.09
  );

  shape.bezierCurveTo(
    -0.19,
    0.08,

    -0.32,
    0.02,

    -0.46,
    -0.06
  );

  shape.closePath();

  const geometry =
    new THREE.ExtrudeGeometry(
      shape,
      {
        depth,

        bevelEnabled:
          true,

        bevelThickness:
          0.025,

        bevelSize:
          0.025,

        bevelSegments:
          2,

        curveSegments:
          14,

        steps:
          1
      }
    );

  geometry.translate(
    0,
    0,
    -depth /
      2
  );

  return geometry;

}

// ============================================================
// BANANA BLÁSTER
// ============================================================

let chargingShot =
  false;

let chargeStartTime =
  0;

let cameraRecoil =
  0;

let weaponRecoil =
  0;

let weaponKick =
  0;

const bananaGun =
  new THREE.Group();

const bananaBasePosition =
  new THREE.Vector3(
    0.46,
    -0.38,
    -0.72
  );

bananaGun.position.copy(
  bananaBasePosition
);

const gunCurve =
  new THREE.CatmullRomCurve3([
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

const gunMesh =
  new THREE.Mesh(
    new THREE.TubeGeometry(
      gunCurve,
      24,
      0.115,
      10,
      false
    ),

    new THREE.MeshStandardMaterial({
      color:
        0xffdc32,

      roughness:
        0.48,

      metalness:
        0.04
    })
  );

bananaGun.add(
  gunMesh
);

// Punta trasera.
const backTip =
  new THREE.Mesh(
    new THREE.CylinderGeometry(
      0.055,
      0.07,
      0.13,
      8
    ),

    new THREE.MeshStandardMaterial({
      color:
        0x6b4423,

      roughness:
        0.85
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

// Punta delantera.
const frontTip =
  new THREE.Mesh(
    new THREE.CylinderGeometry(
      0.055,
      0.075,
      0.16,
      8
    ),

    new THREE.MeshStandardMaterial({
      color:
        0x594126,

      roughness:
        0.85
    })
  );

frontTip.rotation.x =
  Math.PI /
  2;

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

// Empuñadura.
const grip =
  new THREE.Mesh(
    new THREE.BoxGeometry(
      0.13,
      0.33,
      0.13
    ),

    new THREE.MeshStandardMaterial({
      color:
        0x44311e,

      roughness:
        0.8
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

// Gatillo.
const trigger =
  new THREE.Mesh(
    new THREE.TorusGeometry(
      0.065,
      0.012,
      8,
      14,
      Math.PI
    ),

    new THREE.MeshStandardMaterial({
      color:
        0x222222,

      metalness:
        0.45,

      roughness:
        0.4
    })
  );

trigger.position.set(
  0,
  -0.1,
  -0.24
);

trigger.rotation.y =
  Math.PI /
  2;

bananaGun.add(
  trigger
);

// Punto de salida.
const muzzle =
  new THREE.Object3D();

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

const chargeOrb =
  new THREE.Mesh(
    new THREE.SphereGeometry(
      0.075,
      12,
      12
    ),

    new THREE.MeshStandardMaterial({
      color:
        0xffff33,

      emissive:
        0xffcc00,

      emissiveIntensity:
        4,

      transparent:
        true,

      opacity:
        0.9
    })
  );

chargeOrb.visible =
  false;

chargeOrb.position.copy(
  muzzle.position
);

bananaGun.add(
  chargeOrb
);

const chargeLight =
  new THREE.PointLight(
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

bananaGun.rotation.set(
  -0.05,
  -0.08,
  0.02
);

camera.add(
  bananaGun
);

// ============================================================
// DAR ASPECTO TROPICAL AL MODELO
// ============================================================

function tropicalizeModel(
  model
) {

  const palette = [
    0xb9a06b,
    0xc1aa74,
    0xad9562,
    0xc8b37d
  ];

  let index =
    0;

  model.traverse(
    (child) => {

      if (
        !child.isMesh
      ) {

        return;

      }

      child.castShadow =
        false;

      child.receiveShadow =
        true;

      // Quitamos la textura cuadriculada
      // original del ejemplo.
      child.material =
        new THREE.MeshStandardMaterial({
          color:
            palette[
              index %
              palette.length
            ],

          roughness:
            0.88,

          metalness:
            0
        });

      index++;

    }
  );

}

// ============================================================
// COLLIDER RAPIER OPTIMIZADO
// ============================================================

function createMergedRapierWorldCollider(
  model
) {

  model.updateMatrixWorld(
    true
  );

  const vertexArrays =
    [];

  const indexArrays =
    [];

  let vertexOffset =
    0;

  let totalVertices =
    0;

  let totalIndices =
    0;

  model.traverse(
    (child) => {

      if (
        !child.isMesh ||
        !child.geometry?.attributes?.position
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
          position.count *
            3
        );

      for (
        let i = 0;
        i < position.count;
        i++
      ) {

        vertices[
          i * 3
        ] =
          position.getX(
            i
          );

        vertices[
          i * 3 + 1
        ] =
          position.getY(
            i
          );

        vertices[
          i * 3 + 2
        ] =
          position.getZ(
            i
          );

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
            geometry.index.getX(
              i
            ) +
            vertexOffset;

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

          indices[i] =
            i +
            vertexOffset;

        }

      }

      vertexArrays.push(
        vertices
      );

      indexArrays.push(
        indices
      );

      totalVertices +=
        vertices.length;

      totalIndices +=
        indices.length;

      vertexOffset +=
        position.count;

      geometry.dispose();

    }
  );

  const vertices =
    new Float32Array(
      totalVertices
    );

  const indices =
    new Uint32Array(
      totalIndices
    );

  let vertexPosition =
    0;

  let indexPosition =
    0;

  for (
    const array of vertexArrays
  ) {

    vertices.set(
      array,
      vertexPosition
    );

    vertexPosition +=
      array.length;

  }

  for (
    const array of indexArrays
  ) {

    indices.set(
      array,
      indexPosition
    );

    indexPosition +=
      array.length;

  }

  if (
    indices.length >=
    3
  ) {

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
          0.04
        );

    physicsWorld.createCollider(
      collider
    );

  }

}

// ============================================================
// CAJAS DINÁMICAS
// ============================================================

function createDynamicBox(
  x,
  y,
  z,
  sx,
  sy,
  sz,
  mass = 4,
  color = 0xd99a32
) {

  const mesh =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        sx,
        sy,
        sz
      ),

      new THREE.MeshStandardMaterial({
        color,
        roughness:
          0.82,

        metalness:
          0.02
      })
    );

  mesh.position.set(
    x,
    y,
    z
  );

  mesh.castShadow =
    true;

  mesh.receiveShadow =
    true;

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
      sx *
        sy *
        sz,

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
        mass /
          volume
      )
      .setFriction(
        0.78
      )
      .setRestitution(
        0.14
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
    },

    size:
      new THREE.Vector3(
        sx,
        sy,
        sz
      )
  });

}

// ============================================================
// CREAR CAJAS
// ============================================================

function createPhysicalObjects() {

  const colors = [
    0xf4b942,
    0xe8942f,
    0xe8c34a,
    0xd99130,
    0xffd34e,
    0xc9872b
  ];

  let colorIndex =
    0;

  for (
    let level = 0;
    level < 3;
    level++
  ) {

    for (
      let i = 0;
      i <
      3 - level;
      i++
    ) {

      createDynamicBox(
        -2 +
          i *
            1.15 +
          level *
            0.55,

        0.55 +
          level,

        -5,

        1,
        1,
        1,

        4,

        colors[
          colorIndex %
            colors.length
        ]
      );

      colorIndex++;

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

    0x9e642c
  );

  createDynamicBox(
    4.4,
    0.45,
    -5,

    0.8,
    0.8,
    0.8,

    2,

    0xffcf3e
  );

  dynamicPhysicsReady =
    true;

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

    tropicalizeModel(
      model
    );

    scene.add(
      model
    );

    // Primero generamos las colisiones
    // indispensables para el jugador.
    worldOctree.fromGraphNode(
      model
    );

    // Ahora sí puede empezar a caer/caminar.
    worldReady =
      true;

    resetPlayer();

    console.log(
      '🌴 Banana Beach visual lista'
    );

    console.log(
      '✅ Jugador colocado correctamente'
    );

    // El trabajo más pesado de Rapier se
    // retrasa ligeramente para que el navegador
    // pueda dibujar primero la escena.
    setTimeout(
      () => {

        createMergedRapierWorldCollider(
          model
        );

        createPhysicalObjects();

        console.log(
          '✅ Física dinámica lista'
        );

      },

      60
    );

  },

  undefined,

  (error) => {

    console.error(
      '❌ Error cargando collision-world.glb:',
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

  playerDirection.y =
    0;

  return playerDirection.normalize();

}

function getSideVector() {

  camera.getWorldDirection(
    playerDirection
  );

  playerDirection.y =
    0;

  playerDirection.normalize();

  playerDirection.cross(
    camera.up
  );

  return playerDirection;

}

function controls(
  deltaTime
) {

  if (
    !worldReady
  ) {

    return;

  }

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

    playerVelocity.y =
      7;

  }

}

// ============================================================
// COLISIONES CON ESCENARIO
// ============================================================

function playerCollisions() {

  const result =
    worldOctree.capsuleIntersect(
      playerCollider
    );

  playerOnFloor =
    false;

  if (
    result
  ) {

    playerOnFloor =
      result.normal.y >
      0;

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
// COLISIÓN JUGADOR <-> CAJAS
// ============================================================

function resolvePlayerBoxCollisions() {

  if (
    !dynamicPhysicsReady ||
    physicalObjects.length ===
      0
  ) {

    return;

  }

  // Centro de la cápsula.
  tempCenter
    .copy(
      playerCollider.start
    )
    .add(
      playerCollider.end
    )
    .multiplyScalar(
      0.5
    );

  const playerMinY =
    Math.min(
      playerCollider.start.y,
      playerCollider.end.y
    ) -
    PLAYER_RADIUS;

  const playerMaxY =
    Math.max(
      playerCollider.start.y,
      playerCollider.end.y
    ) +
    PLAYER_RADIUS;

  // Dos pasadas para casos donde hay
  // más de una caja alrededor.
  for (
    let pass = 0;
    pass < 2;
    pass++
  ) {

    for (
      const item of physicalObjects
    ) {

      tempBox.setFromObject(
        item.mesh
      );

      // No hay contacto vertical.
      if (
        playerMaxY <
          tempBox.min.y ||
        playerMinY >
          tempBox.max.y
      ) {

        continue;

      }

      const closestX =
        THREE.MathUtils.clamp(
          tempCenter.x,
          tempBox.min.x,
          tempBox.max.x
        );

      const closestZ =
        THREE.MathUtils.clamp(
          tempCenter.z,
          tempBox.min.z,
          tempBox.max.z
        );

      const dx =
        tempCenter.x -
        closestX;

      const dz =
        tempCenter.z -
        closestZ;

      const distanceSquared =
        dx * dx +
        dz * dz;

      const radiusSquared =
        PLAYER_RADIUS *
        PLAYER_RADIUS;

      if (
        distanceSquared >=
        radiusSquared
      ) {

        continue;

      }

      let depth =
        0;

      if (
        distanceSquared >
        0.00000001
      ) {

        const distance =
          Math.sqrt(
            distanceSquared
          );

        tempNormal.set(
          dx /
            distance,

          0,

          dz /
            distance
        );

        depth =
          PLAYER_RADIUS -
          distance;

      } else {

        // Si ya está dentro, buscamos
        // la salida más cercana.
        const left =
          Math.abs(
            tempCenter.x -
              tempBox.min.x
          );

        const right =
          Math.abs(
            tempBox.max.x -
              tempCenter.x
          );

        const back =
          Math.abs(
            tempCenter.z -
              tempBox.min.z
          );

        const front =
          Math.abs(
            tempBox.max.z -
              tempCenter.z
          );

        const minimum =
          Math.min(
            left,
            right,
            back,
            front
          );

        if (
          minimum ===
          left
        ) {

          tempNormal.set(
            -1,
            0,
            0
          );

        } else if (
          minimum ===
          right
        ) {

          tempNormal.set(
            1,
            0,
            0
          );

        } else if (
          minimum ===
          back
        ) {

          tempNormal.set(
            0,
            0,
            -1
          );

        } else {

          tempNormal.set(
            0,
            0,
            1
          );

        }

        depth =
          PLAYER_RADIUS +
          minimum;

      }

      // ======================================================
      // IMPEDIR QUE EL JUGADOR ATRAVIESE LA CAJA
      // ======================================================

      tempMove
        .copy(
          tempNormal
        )
        .multiplyScalar(
          depth +
            0.002
        );

      playerCollider.translate(
        tempMove
      );

      tempCenter.add(
        tempMove
      );

      // ======================================================
      // FRENAR AL JUGADOR CONTRA LA CAJA
      // ======================================================

      const normalSpeed =
        playerVelocity.dot(
          tempNormal
        );

      if (
        normalSpeed <
        0
      ) {

        playerVelocity.addScaledVector(
          tempNormal,
          -normalSpeed
        );

      }

      // ======================================================
      // LA CAJA SIGUE SIENDO EMPUJABLE
      // ======================================================

      const horizontalSpeed =
        Math.hypot(
          playerVelocity.x,
          playerVelocity.z
        );

      const push =
        THREE.MathUtils.clamp(
          0.8 +
            horizontalSpeed *
              0.55,

          0.8,

          3.2
        );

      item.body.applyImpulse(
        {
          x:
            -tempNormal.x *
            push,

          y:
            0.03,

          z:
            -tempNormal.z *
            push
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

  // Mientras el GLB carga no dejamos
  // que la gravedad tire al jugador.
  if (
    !worldReady
  ) {

    camera.position.copy(
      PLAYER_SPAWN_END
    );

    return;

  }

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

  // Escenario estático.
  playerCollisions();

  // Cajas dinámicas.
  resolvePlayerBoxCollisions();

  camera.position.copy(
    playerCollider.end
  );

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

  playerCollider.start.copy(
    PLAYER_SPAWN_START
  );

  playerCollider.end.copy(
    PLAYER_SPAWN_END
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
// CARGA DEL ARMA
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

function startCharging() {

  if (
    document.pointerLockElement !==
      renderer.domElement ||
    chargingShot
  ) {

    return;

  }

  chargingShot =
    true;

  chargeStartTime =
    performance.now();

  chargeOrb.visible =
    true;

}

function cancelCharge() {

  chargingShot =
    false;

  chargeOrb.visible =
    false;

  chargeLight.intensity =
    0;

}

// ============================================================
// APUNTADO
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

  camera
    .getWorldDirection(
      cameraDirection
    )
    .normalize();

  const aimRay =
    new THREE.Raycaster(
      cameraPosition,
      cameraDirection,
      0,
      AIM_DISTANCE
    );

  const hits =
    aimRay.intersectObjects(
      physicalObjects.map(
        (item) =>
          item.mesh
      ),

      false
    );

  if (
    hits.length >
    0
  ) {

    return hits[
      0
    ].point.clone();

  }

  return cameraPosition
    .clone()
    .addScaledVector(
      cameraDirection,
      AIM_DISTANCE
    );

}

// ============================================================
// PROYECTIL PLÁTANO
// ============================================================

function createBananaProjectile(
  charge
) {

  const projectile =
    new THREE.Group();

  const banana =
    new THREE.Mesh(
      createBananaShapeGeometry(
        0.11
      ),

      new THREE.MeshStandardMaterial({
        color:
          0xffdf2b,

        emissive:
          0x8a5c00,

        emissiveIntensity:
          THREE.MathUtils.lerp(
            0.15,
            1.35,
            charge
          ),

        roughness:
          0.55
      })
    );

  banana.castShadow =
    true;

  projectile.add(
    banana
  );

  // Tallo.
  const stem =
    new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.045,
        0.065,
        0.18,
        8
      ),

      new THREE.MeshStandardMaterial({
        color:
          0x5b391c,

        roughness:
          0.9
      })
    );

  stem.position.set(
    0.49,
    -0.01,
    0
  );

  stem.rotation.z =
    -Math.PI /
    3.1;

  projectile.add(
    stem
  );

  // Punta.
  const tip =
    new THREE.Mesh(
      new THREE.SphereGeometry(
        0.055,
        8,
        8
      ),

      new THREE.MeshStandardMaterial({
        color:
          0x4a2e17,

        roughness:
          0.9
      })
    );

  tip.position.set(
    -0.465,
    -0.055,
    0
  );

  projectile.add(
    tip
  );

  // Luz ligera para que no tape la forma.
  const light =
    new THREE.PointLight(
      0xffd633,

      THREE.MathUtils.lerp(
        0.25,
        1.9,
        charge
      ),

      THREE.MathUtils.lerp(
        1,
        3.5,
        charge
      ),

      2
    );

  projectile.add(
    light
  );

  projectile.scale.setScalar(
    THREE.MathUtils.lerp(
      0.9,
      2.3,
      charge
    )
  );

  return projectile;

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

  chargingShot =
    false;

  chargeOrb.visible =
    false;

  chargeLight.intensity =
    0;

  camera.updateMatrixWorld(
    true
  );

  bananaGun.updateMatrixWorld(
    true
  );

  const spawnPosition =
    new THREE.Vector3();

  muzzle.getWorldPosition(
    spawnPosition
  );

  const targetPoint =
    getAimTarget();

  const direction =
    new THREE.Vector3()
      .subVectors(
        targetPoint,
        spawnPosition
      )
      .normalize();

  const mesh =
    createBananaProjectile(
      charge
    );

  mesh.position.copy(
    spawnPosition
  );

  // Sigue disparando exactamente a la mira.
  mesh.quaternion.setFromUnitVectors(
    new THREE.Vector3(
      0,
      0,
      1
    ),

    direction
  );

  mesh.rotateZ(
    -0.45
  );

  scene.add(
    mesh
  );

  lasers.push({
    mesh,

    direction,

    speed:
      THREE.MathUtils.lerp(
        BANANA_MIN_SPEED,
        BANANA_MAX_SPEED,
        charge
      ),

    force:
      THREE.MathUtils.lerp(
        BANANA_MIN_FORCE,
        BANANA_MAX_FORCE,
        charge
      ),

    charge,

    life:
      2.6,

    spin:
      THREE.MathUtils.lerp(
        3,
        7,
        charge
      ),

    tumble:
      THREE.MathUtils.lerp(
        0.8,
        2,
        charge
      )
  });

  // Retroceso.
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

    chargeOrb.visible =
      true;

    chargeOrb.scale.setScalar(
      THREE.MathUtils.lerp(
        0.7,
        2.8,
        charge
      )
    );

    chargeOrb.material.emissiveIntensity =
      THREE.MathUtils.lerp(
        3,
        14,
        charge
      );

    chargeLight.intensity =
      THREE.MathUtils.lerp(
        2,
        16,
        charge
      );

    chargeLight.distance =
      THREE.MathUtils.lerp(
        2,
        6,
        charge
      );

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
        9,
        22,
        charge
      ),

      THREE.MathUtils.lerp(
        4,
        8,
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
          0.26,
          charge
        ),

        12,
        12
      ),

      new THREE.MeshBasicMaterial({
        color:
          0xffff55
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
// ELIMINAR PROYECTIL
// ============================================================

function disposeProjectile(
  projectile
) {

  projectile.traverse(
    (child) => {

      if (
        !child.isMesh
      ) {

        return;

      }

      child.geometry?.dispose();

      if (
        Array.isArray(
          child.material
        )
      ) {

        child.material.forEach(
          (material) =>
            material.dispose()
        );

      } else {

        child.material?.dispose();

      }

    }
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
      lasers.length -
      1;

    i >=
    0;

    i--
  ) {

    const laser =
      lasers[i];

    const distance =
      laser.speed *
      deltaTime;

    // Giro visible.
    laser.mesh.rotateZ(
      laser.spin *
      deltaTime
    );

    laser.mesh.rotateX(
      laser.tumble *
      deltaTime
    );

    laser.mesh.rotateY(
      laser.tumble *
      0.45 *
      deltaTime
    );

    const ray =
      new THREE.Raycaster(
        laser.mesh.position,
        laser.direction,
        0,

        distance +
        1.5
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

        item.body.applyImpulseAtPoint(
          {
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
          },

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

      disposeProjectile(
        laser.mesh
      );

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
      laser.life <=
      0
    ) {

      scene.remove(
        laser.mesh
      );

      disposeProjectile(
        laser.mesh
      );

      lasers.splice(
        i,
        1
      );

    }

  }

}

// ============================================================
// SINCRONIZAR RAPIER
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
// RECUPERAR CAJAS
// ============================================================

function recoverFallenObjects() {

  for (
    const item of physicalObjects
  ) {

    const position =
      item.body.translation();

    if (
      position.y >=
      -25
    ) {

      continue;

    }

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

// ============================================================
// AMBIENTE
// ============================================================

let environmentTime =
  0;

function updateEnvironment(
  deltaTime
) {

  environmentTime +=
    deltaTime;

  water.position.y =
    -0.5 +
    Math.sin(
      environmentTime *
      0.75
    ) *
    0.018;

  clouds.forEach(
    (
      cloud,
      index
    ) => {

      cloud.position.x +=
        (
          0.11 +
          index *
          0.02
        ) *
        deltaTime;

      if (
        cloud.position.x >
        28
      ) {

        cloud.position.x =
          -28;

      }

    }
  );

}

// ============================================================
// TECLADO
// ============================================================

document.addEventListener(
  'keydown',
  (event) => {

    keyStates[
      event.code
    ] =
      true;

  }
);

document.addEventListener(
  'keyup',
  (event) => {

    keyStates[
      event.code
    ] =
      false;

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

        -Math.PI /
        2,

        Math.PI /
        2
      );

  }
);

// ============================================================
// CARGAR DISPARO
// ============================================================

document.addEventListener(
  'mousedown',
  (event) => {

    if (
      event.button ===
      0
    ) {

      startCharging();

    }

  }
);

// ============================================================
// DISPARAR
// ============================================================

document.addEventListener(
  'mouseup',
  (event) => {

    if (
      event.button ===
      0
    ) {

      fireChargedShot();

    }

  }
);

// ============================================================
// POINTER LOCK CHANGE
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
// LOOP PRINCIPAL
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

  updateEnvironment(
    delta
  );

  if (
    dynamicPhysicsReady
  ) {

    physicsWorld.timestep =
      delta;

    physicsWorld.step();

    syncPhysics();

    recoverFallenObjects();

  }

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