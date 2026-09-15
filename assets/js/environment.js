import * as THREE from 'three';

import {
    createSandTexture
} from './textures.js';

// ============================================================
// VARIABLES INTERNAS DEL AMBIENTE
// ============================================================

let water = null;

const clouds = [];

let environmentTime = 0;


// ============================================================
// CREAR AMBIENTE COMPLETO
// ============================================================

export function createEnvironment(
    scene,
    renderer
) {

    // ========================================================
    // CIELO
    // ========================================================

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


    // ========================================================
    // ILUMINACIÓN
    // ========================================================

    createLighting(
        scene
    );


    // ========================================================
    // SOL
    // ========================================================

    createSun(
        scene
    );


    // ========================================================
    // ARENA
    // ========================================================

    createSand(
        scene,
        renderer
    );


    // ========================================================
    // AGUA
    // ========================================================

    createWater(
        scene
    );


    // ========================================================
    // PALMERAS
    // ========================================================

    createPalmTree(
        scene,
        -11,
        0,
        -8,
        1.05
    );

    createPalmTree(
        scene,
        11,
        0,
        -9,
        1.12
    );

    createPalmTree(
        scene,
        -12,
        0,
        8,
        0.92
    );

    createPalmTree(
        scene,
        12,
        0,
        9,
        1.02
    );


    // ========================================================
    // ROCAS
    // ========================================================

    createRock(
        scene,
        -9,
        0.45,
        -3,
        1.25
    );

    createRock(
        scene,
        9,
        0.35,
        2,
        0.95
    );

    createRock(
        scene,
        -11,
        0.4,
        11,
        1.05
    );

    createRock(
        scene,
        10,
        0.45,
        12,
        1.3
    );


    // ========================================================
    // NUBES
    // ========================================================

    clouds.push(
        createCloud(
            scene,
            -18,
            14,
            -30,
            1.6
        )
    );

    clouds.push(
        createCloud(
            scene,
            14,
            18,
            -42,
            1.9
        )
    );

    clouds.push(
        createCloud(
            scene,
            -7,
            20,
            -58,
            2.1
        )
    );


    console.log(
        '🌴 Ambiente Banana Beach listo'
    );
}


// ============================================================
// ILUMINACIÓN
// ============================================================

function createLighting(
    scene
) {

    const hemisphereLight =
        new THREE.HemisphereLight(
            0xc8efff,
            0xc39a57,
            2.25
        );

    scene.add(
        hemisphereLight
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
}


// ============================================================
// SOL
// ============================================================

function createSun(
    scene
) {

    const sun =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                3.2,
                20,
                20
            ),

            new THREE.MeshBasicMaterial({
                color:
                    0xffdf71
            })
        );

    sun.position.set(
        -32,
        26,
        -62
    );

    scene.add(
        sun
    );
}


// ============================================================
// ARENA
// ============================================================

function createSand(
    scene,
    renderer
) {

    const sandMaterial =
        new THREE.MeshStandardMaterial({

            map:
                createSandTexture(
                    renderer
                ),

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

    sand.position.y =
        0.035;

    sand.receiveShadow =
        true;

    sand.renderOrder =
        2;

    scene.add(
        sand
    );
}


// ============================================================
// AGUA
// ============================================================

function createWater(
    scene
) {

    water =
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

    water.receiveShadow =
        true;

    scene.add(
        water
    );
}


// ============================================================
// PALMERA
// ============================================================

function createPalmTree(
    scene,
    x,
    y,
    z,
    scale = 1
) {

    const palm =
        new THREE.Group();


    // ========================================================
    // MATERIALES
    // ========================================================

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


    // ========================================================
    // TRONCO
    // ========================================================

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


    // ========================================================
    // PARTE SUPERIOR
    // ========================================================

    const topY =
        4.25 * scale;


    // ========================================================
    // HOJAS
    // ========================================================

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
                i / 7
            ) *
            Math.PI *
            2;


        leaf.position.set(

            Math.cos(
                angle
            ) *
            0.68 *
            scale,

            topY,

            Math.sin(
                angle
            ) *
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


    // ========================================================
    // COCOS
    // ========================================================

    for (
        let i = 0;
        i < 3;
        i++
    ) {

        const coconut =
            new THREE.Mesh(
                new THREE.SphereGeometry(
                    0.17 * scale,
                    8,
                    8
                ),

                coconutMaterial
            );


        const angle =
            (
                i / 3
            ) *
            Math.PI *
            2;


        coconut.position.set(

            Math.cos(
                angle
            ) *
            0.28 *
            scale,

            topY -
            0.18 *
            scale,

            Math.sin(
                angle
            ) *
            0.28 *
            scale
        );


        coconut.castShadow =
            true;

        palm.add(
            coconut
        );
    }


    // ========================================================
    // POSICIÓN
    // ========================================================

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


// ============================================================
// ROCA
// ============================================================

function createRock(
    scene,
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

        scale *
        0.72,

        scale *
        1.1
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

    return rock;
}


// ============================================================
// NUBE
// ============================================================

function createCloud(
    scene,
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

        [
            0,
            0,
            0,
            1
        ],

        [
            1.05,
            0.05,
            0,
            0.75
        ],

        [
            -1.05,
            0.03,
            0,
            0.72
        ],

        [
            0.45,
            0.38,
            0,
            0.62
        ],

        [
            -0.42,
            0.34,
            0,
            0.64
        ]
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


// ============================================================
// ACTUALIZAR AMBIENTE
// ============================================================

export function updateEnvironment(
    deltaTime
) {

    environmentTime +=
        deltaTime;


    // ========================================================
    // MOVIMIENTO DEL AGUA
    // ========================================================

    if (
        water
    ) {

        water.position.y =
            -0.5 +
            Math.sin(
                environmentTime *
                0.75
            ) *
            0.018;
    }


    // ========================================================
    // MOVIMIENTO DE NUBES
    // ========================================================

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