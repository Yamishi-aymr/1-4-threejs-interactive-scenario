import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

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

camera.position.set(
  0,
  2,
  6
);

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

    console.log(
      '✅ Escenario cargado correctamente'
    );

  },

  (progress) => {

    if (progress.total > 0) {

      const percentage =
        progress.loaded /
        progress.total *
        100;

      console.log(
        `Cargando escenario: ${percentage.toFixed(0)}%`
      );

    }

  },

  (error) => {

    console.error(
      '❌ Error al cargar collision-world.glb:',
      error
    );

  }
);

// ============================================================
// ANIMACIÓN
// ============================================================

function animate() {

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