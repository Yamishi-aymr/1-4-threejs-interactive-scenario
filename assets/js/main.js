import * as THREE from 'three';

import {
    GLTFLoader
} from 'three/addons/loaders/GLTFLoader.js';

import {
    createEnvironment,
    updateEnvironment
} from './environment.js';

import {
    setupDynamicPhysics,
    updatePhysics
} from './physics.js';

import {
    setupPlayerWorld,
    setupPlayerControls,
    updatePlayer
} from './player.js';

import {
    setupWeapon,
    updateWeapon,
    updateProjectiles,
    getCameraRecoil
} from './weapon.js';

// ============================================================
// CONTENEDOR
// ============================================================

const container =
    document.getElementById(
        'scene-container'
    );

// ============================================================
// ESCENA
// ============================================================

const scene =
    new THREE.Scene();

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
    THREE.PCFShadowMap;

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
// BANANA BEACH
// ============================================================

createEnvironment(
    scene,
    renderer
);

// ============================================================
// CONTROLES DEL JUGADOR
// ============================================================

setupPlayerControls(
    renderer,
    camera
);

// ============================================================
// BANANA BLÁSTER
// ============================================================

setupWeapon(
    scene,
    camera,
    renderer
);

// ============================================================
// TEMPORIZADOR
// ============================================================

const timer =
    new THREE.Timer();

// ============================================================
// TROPICALIZAR MODELO ORIGINAL
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

    let index = 0;

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
// CARGAR ESCENARIO
// ============================================================

const loader =
    new GLTFLoader();

loader.load(
    './assets/models/collision-world.glb',

    (gltf) => {

        const model =
            gltf.scene;

        // ====================================================
        // APARIENCIA TROPICAL
        // ====================================================

        tropicalizeModel(
            model
        );

        scene.add(
            model
        );

        // ====================================================
        // JUGADOR
        // ====================================================

        setupPlayerWorld(
            model,
            camera
        );

        console.log(
            '🌴 Banana Beach visual lista'
        );

        // ====================================================
        // FÍSICA DINÁMICA
        // ====================================================

        setTimeout(
            () => {

                setupDynamicPhysics(
                    scene,
                    model
                );

            },
            60
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
// CICLO PRINCIPAL
// ============================================================

function animate() {

    timer.update();

    const delta =
        Math.min(
            0.05,
            timer.getDelta()
        );

    // ========================================================
    // ARMA
    // ========================================================

    updateWeapon(
        delta
    );

    // ========================================================
    // JUGADOR
    // ========================================================

    updatePlayer(
        delta,
        camera,
        getCameraRecoil()
    );

    // ========================================================
    // AMBIENTE
    // ========================================================

    updateEnvironment(
        delta
    );

    // ========================================================
    // FÍSICA
    // ========================================================

    updatePhysics(
        delta
    );

    // ========================================================
    // PROYECTILES
    // ========================================================

    updateProjectiles(
        delta
    );

    // ========================================================
    // RENDER
    // ========================================================

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