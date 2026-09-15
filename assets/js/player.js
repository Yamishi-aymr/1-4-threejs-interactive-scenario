import * as THREE from 'three';

import {
    Octree
} from 'three/addons/math/Octree.js';

import {
    Capsule
} from 'three/addons/math/Capsule.js';

import {
    physicalObjects,
    dynamicPhysicsReady
} from './physics.js';


// ============================================================
// CONFIGURACIÓN DEL JUGADOR
// ============================================================

const PLAYER_RADIUS = 0.35;

const PLAYER_SPAWN_START =
    new THREE.Vector3(
        0,
        0.55,
        0
    );

const PLAYER_SPAWN_END =
    new THREE.Vector3(
        0,
        1.20,
        0
    );


// ============================================================
// OCTREE
// ============================================================

const worldOctree =
    new Octree();


// ============================================================
// CAPSULE
// ============================================================

const playerCollider =
    new Capsule(
        PLAYER_SPAWN_START.clone(),
        PLAYER_SPAWN_END.clone(),
        PLAYER_RADIUS
    );


// ============================================================
// MOVIMIENTO
// ============================================================

const playerVelocity =
    new THREE.Vector3();

const playerDirection =
    new THREE.Vector3();

let playerOnFloor =
    false;

let worldReady =
    false;


// ============================================================
// TECLADO
// ============================================================

const keyStates = {};


// ============================================================
// OBJETOS TEMPORALES
// ============================================================

const tempBox =
    new THREE.Box3();

const tempCenter =
    new THREE.Vector3();

const tempNormal =
    new THREE.Vector3();

const tempMove =
    new THREE.Vector3();

const tempVelocity =
    new THREE.Vector3();

const tempRecoilDirection =
    new THREE.Vector3();


// ============================================================
// CONFIGURAR ESCENARIO DEL JUGADOR
// ============================================================

export function setupPlayerWorld(
    model,
    camera
) {

    worldOctree.fromGraphNode(
        model
    );

    worldReady =
        true;

    resetPlayer(
        camera
    );

    console.log(
        '✅ Jugador colocado correctamente'
    );
}


// ============================================================
// SABER SI EL ESCENARIO ESTÁ LISTO
// ============================================================

export function isPlayerWorldReady() {

    return worldReady;
}


// ============================================================
// DIRECCIÓN HACIA DELANTE
// ============================================================

function getForwardVector(
    camera
) {

    camera.getWorldDirection(
        playerDirection
    );

    playerDirection.y =
        0;

    return playerDirection.normalize();
}


// ============================================================
// DIRECCIÓN LATERAL
// ============================================================

function getSideVector(
    camera
) {

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


// ============================================================
// CONTROLES DE MOVIMIENTO
// ============================================================

function controls(
    deltaTime,
    camera
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


    // ========================================================
    // W
    // ========================================================

    if (
        keyStates.KeyW
    ) {

        playerVelocity.add(
            getForwardVector(
                camera
            )
                .multiplyScalar(
                    speed *
                    deltaTime
                )
        );
    }


    // ========================================================
    // S
    // ========================================================

    if (
        keyStates.KeyS
    ) {

        playerVelocity.add(
            getForwardVector(
                camera
            )
                .multiplyScalar(
                    -speed *
                    deltaTime
                )
        );
    }


    // ========================================================
    // A
    // ========================================================

    if (
        keyStates.KeyA
    ) {

        playerVelocity.add(
            getSideVector(
                camera
            )
                .multiplyScalar(
                    -speed *
                    deltaTime
                )
        );
    }


    // ========================================================
    // D
    // ========================================================

    if (
        keyStates.KeyD
    ) {

        playerVelocity.add(
            getSideVector(
                camera
            )
                .multiplyScalar(
                    speed *
                    deltaTime
                )
        );
    }


    // ========================================================
    // SALTO
    // ========================================================

    if (
        playerOnFloor &&
        keyStates.Space
    ) {

        playerVelocity.y =
            7;
    }
}


// ============================================================
// COLISIONES CON EL ESCENARIO
// ============================================================

function playerWorldCollisions() {

    const result =
        worldOctree.capsuleIntersect(
            playerCollider
        );


    playerOnFloor =
        false;


    if (
        !result
    ) {

        return;
    }


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


// ============================================================
// COLISIONES JUGADOR <-> CAJAS
// ============================================================

function resolvePlayerBoxCollisions() {

    if (
        !dynamicPhysicsReady ||
        physicalObjects.length === 0
    ) {

        return;
    }


    // ========================================================
    // CENTRO DEL JUGADOR
    // ========================================================

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


    // Dos pasadas ayudan cuando hay varias cajas juntas.
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


            // =================================================
            // NO HAY CONTACTO VERTICAL
            // =================================================

            if (
                playerMaxY <
                tempBox.min.y ||
                playerMinY >
                tempBox.max.y
            ) {

                continue;
            }


            // =================================================
            // PUNTO MÁS CERCANO
            // =================================================

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


            let depth = 0;


            // =================================================
            // CONTACTO NORMAL
            // =================================================

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
            }

            // =================================================
            // JUGADOR DENTRO DE LA CAJA
            // =================================================

            else {

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
                    minimum === left
                ) {

                    tempNormal.set(
                        -1,
                        0,
                        0
                    );

                } else if (
                    minimum === right
                ) {

                    tempNormal.set(
                        1,
                        0,
                        0
                    );

                } else if (
                    minimum === back
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


            // =================================================
            // SACAR AL JUGADOR DE LA CAJA
            // =================================================

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


            // =================================================
            // FRENAR MOVIMIENTO HACIA LA CAJA
            // =================================================

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


            // =================================================
            // EMPUJAR CAJA
            // =================================================

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

export function updatePlayer(
    deltaTime,
    camera,
    cameraRecoil = 0
) {

    // ========================================================
    // ESPERAR A QUE CARGUE EL ESCENARIO
    // ========================================================

    if (
        !worldReady
    ) {

        camera.position.copy(
            PLAYER_SPAWN_END
        );

        return;
    }


    // ========================================================
    // CONTROLES
    // ========================================================

    controls(
        deltaTime,
        camera
    );


    // ========================================================
    // FRICCIÓN
    // ========================================================

    let damping =
        Math.exp(
            -4 *
            deltaTime
        ) - 1;


    // ========================================================
    // GRAVEDAD
    // ========================================================

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


    // ========================================================
    // MOVIMIENTO
    // ========================================================

    tempVelocity
        .copy(
            playerVelocity
        )
        .multiplyScalar(
            deltaTime
        );


    playerCollider.translate(
        tempVelocity
    );


    // ========================================================
    // COLISIONES
    // ========================================================

    playerWorldCollisions();

    resolvePlayerBoxCollisions();


    // ========================================================
    // POSICIÓN DE LA CÁMARA
    // ========================================================

    camera.position.copy(
        playerCollider.end
    );


    // ========================================================
    // RETROCESO
    // ========================================================

    if (
        cameraRecoil >
        0.001
    ) {

        camera.getWorldDirection(
            tempRecoilDirection
        );


        camera.position.addScaledVector(
            tempRecoilDirection,
            -cameraRecoil
        );
    }


    // ========================================================
    // RESET SI CAEMOS
    // ========================================================

    if (
        camera.position.y <
        -20
    ) {

        resetPlayer(
            camera
        );
    }
}


// ============================================================
// RESET DEL JUGADOR
// ============================================================

export function resetPlayer(
    camera
) {

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


    playerOnFloor =
        false;


    camera.position.copy(
        playerCollider.end
    );
}


// ============================================================
// CONFIGURAR CONTROLES
// ============================================================

export function setupPlayerControls(
    renderer,
    camera
) {

    // ========================================================
    // TECLADO PRESIONADO
    // ========================================================

    document.addEventListener(
        'keydown',
        (event) => {

            keyStates[
                event.code
            ] =
                true;


            // Evitar que SPACE mueva la página.
            if (
                event.code ===
                'Space'
            ) {

                event.preventDefault();
            }
        }
    );


    // ========================================================
    // TECLADO SOLTADO
    // ========================================================

    document.addEventListener(
        'keyup',
        (event) => {

            keyStates[
                event.code
            ] =
                false;
        }
    );


    // ========================================================
    // POINTER LOCK
    // ========================================================

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


    // ========================================================
    // MOVIMIENTO DEL MOUSE
    // ========================================================

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
}