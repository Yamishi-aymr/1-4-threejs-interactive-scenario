import * as THREE from 'three';

import {
    physicalObjects
} from './physics.js';

// ============================================================
// CONFIGURACIÓN DEL ARMA
// ============================================================

const MAX_CHARGE_TIME = 2;

const BANANA_MIN_SPEED = 35;
const BANANA_MAX_SPEED = 65;

const BANANA_MIN_FORCE = 18;
const BANANA_MAX_FORCE = 55;

const AIM_DISTANCE = 500;

// ============================================================
// REFERENCIAS PRINCIPALES
// ============================================================

let scene = null;
let camera = null;
let renderer = null;

// ============================================================
// BANANA BLÁSTER
// ============================================================

let bananaGun = null;
let muzzle = null;
let chargeOrb = null;
let chargeLight = null;

const bananaBasePosition =
    new THREE.Vector3(
        0.46,
        -0.38,
        -0.72
    );

// ============================================================
// ESTADO DEL ARMA
// ============================================================

let chargingShot = false;
let chargeStartTime = 0;

let cameraRecoil = 0;
let weaponRecoil = 0;
let weaponKick = 0;

// ============================================================
// PROYECTILES
// ============================================================

const projectiles = [];

// ============================================================
// VECTORES TEMPORALES
// ============================================================

const tempSpawnPosition =
    new THREE.Vector3();

const tempDirection =
    new THREE.Vector3();

const tempCameraPosition =
    new THREE.Vector3();

const tempCameraDirection =
    new THREE.Vector3();

const projectileForward =
    new THREE.Vector3(
        0,
        0,
        1
    );

// ============================================================
// CREAR FORMA DEL PLÁTANO
// ============================================================

function createBananaShapeGeometry(
    depth = 0.11
) {

    const shape =
        new THREE.Shape();

    // Curva exterior.
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

    // Curva interior.
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
        -depth / 2
    );

    return geometry;
}

// ============================================================
// CREAR BANANA BLÁSTER
// ============================================================

function createBananaGun() {

    bananaGun =
        new THREE.Group();

    bananaGun.position.copy(
        bananaBasePosition
    );

    // ========================================================
    // CUERPO
    // ========================================================

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

    gunMesh.castShadow =
        true;

    bananaGun.add(
        gunMesh
    );

    // ========================================================
    // PUNTA TRASERA
    // ========================================================

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

    // ========================================================
    // PUNTA DEL CAÑÓN
    // ========================================================

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

    // ========================================================
    // EMPUÑADURA
    // ========================================================

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

    // ========================================================
    // GATILLO
    // ========================================================

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
        Math.PI / 2;

    bananaGun.add(
        trigger
    );

    // ========================================================
    // PUNTO DE SALIDA
    // ========================================================

    muzzle =
        new THREE.Object3D();

    muzzle.position.set(
        0.11,
        0.2,
        -0.96
    );

    bananaGun.add(
        muzzle
    );

    // ========================================================
    // ESFERA DE CARGA
    // ========================================================

    chargeOrb =
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

    // ========================================================
    // LUZ DE CARGA
    // ========================================================

    chargeLight =
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

    // ========================================================
    // ROTACIÓN BASE
    // ========================================================

    bananaGun.rotation.set(
        -0.05,
        -0.08,
        0.02
    );

    camera.add(
        bananaGun
    );
}

// ============================================================
// INICIALIZAR ARMA
// ============================================================

export function setupWeapon(
    gameScene,
    gameCamera,
    gameRenderer
) {

    scene =
        gameScene;

    camera =
        gameCamera;

    renderer =
        gameRenderer;

    createBananaGun();

    setupWeaponControls();

    console.log(
        '🍌 Banana Bláster lista'
    );
}

// ============================================================
// OBTENER RETROCESO DE CÁMARA
// ============================================================

export function getCameraRecoil() {

    return cameraRecoil;
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
// INICIAR CARGA
// ============================================================

function startCharging() {

    if (
        !renderer ||
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

    chargingShot =
        true;

    chargeStartTime =
        performance.now();

    chargeOrb.visible =
        true;
}

// ============================================================
// CANCELAR CARGA
// ============================================================

function cancelCharge() {

    chargingShot =
        false;

    if (
        chargeOrb
    ) {

        chargeOrb.visible =
            false;
    }

    if (
        chargeLight
    ) {

        chargeLight.intensity =
            0;
    }
}

// ============================================================
// PUNTO EXACTO DE LA MIRA
// ============================================================

function getAimTarget() {

    camera.updateMatrixWorld(
        true
    );

    camera.getWorldPosition(
        tempCameraPosition
    );

    camera.getWorldDirection(
        tempCameraDirection
    );

    tempCameraDirection.normalize();

    const aimRay =
        new THREE.Raycaster(
            tempCameraPosition,
            tempCameraDirection,
            0,
            AIM_DISTANCE
        );

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

    if (
        hits.length >
        0
    ) {

        return hits[
            0
        ].point.clone();
    }

    return tempCameraPosition
        .clone()
        .addScaledVector(
            tempCameraDirection,
            AIM_DISTANCE
        );
}

// ============================================================
// CREAR PROYECTIL PLÁTANO
// ============================================================

function createBananaProjectile(
    charge
) {

    const projectile =
        new THREE.Group();

    // ========================================================
    // CUERPO DEL PLÁTANO
    // ========================================================

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

    // ========================================================
    // TALLO
    // ========================================================

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

    // ========================================================
    // PUNTA OSCURA
    // ========================================================

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

    // ========================================================
    // LUZ
    // ========================================================

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

    // ========================================================
    // ESCALA
    // ========================================================

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
        !chargingShot ||
        !scene ||
        !camera
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

    // ========================================================
    // POSICIÓN DE SALIDA
    // ========================================================

    muzzle.getWorldPosition(
        tempSpawnPosition
    );

    // ========================================================
    // OBJETIVO
    // ========================================================

    const targetPoint =
        getAimTarget();

    tempDirection
        .subVectors(
            targetPoint,
            tempSpawnPosition
        )
        .normalize();

    // ========================================================
    // CREAR PROYECTIL
    // ========================================================

    const mesh =
        createBananaProjectile(
            charge
        );

    mesh.position.copy(
        tempSpawnPosition
    );

    mesh.quaternion.setFromUnitVectors(
        projectileForward,
        tempDirection
    );

    // Inclinación inicial.
    mesh.rotateZ(
        -0.45
    );

    scene.add(
        mesh
    );

    // ========================================================
    // GUARDAR PROYECTIL
    // ========================================================

    projectiles.push({

        mesh,

        direction:
            tempDirection.clone(),

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

    // ========================================================
    // RETROCESO
    // ========================================================

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

    camera.rotation.x =
        THREE.MathUtils.clamp(
            camera.rotation.x,
            -Math.PI / 2,
            Math.PI / 2
        );
}

// ============================================================
// ACTUALIZAR ARMA
// ============================================================

export function updateWeapon(
    deltaTime
) {

    if (
        !bananaGun
    ) {

        return;
    }

    // ========================================================
    // CARGA
    // ========================================================

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

        // Vibración al cargar mucho.
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

    // ========================================================
    // RECUPERAR RETROCESO
    // ========================================================

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

    // ========================================================
    // POSICIÓN BASE
    // ========================================================

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
// EFECTO DE IMPACTO
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

            if (
                child.geometry
            ) {

                child.geometry.dispose();
            }

            if (
                Array.isArray(
                    child.material
                )
            ) {

                child.material.forEach(
                    (material) => {

                        material.dispose();
                    }
                );

            } else if (
                child.material
            ) {

                child.material.dispose();
            }
        }
    );
}

// ============================================================
// ACTUALIZAR PROYECTILES
// ============================================================

export function updateProjectiles(
    deltaTime
) {

    if (
        projectiles.length ===
        0
    ) {

        return;
    }

    const meshes =
        physicalObjects.map(
            (item) =>
                item.mesh
        );

    for (
        let i =
            projectiles.length - 1;

        i >= 0;

        i--
    ) {

        const projectile =
            projectiles[i];

        const distance =
            projectile.speed *
            deltaTime;

        // ====================================================
        // GIRO
        // ====================================================

        projectile.mesh.rotateZ(
            projectile.spin *
            deltaTime
        );

        projectile.mesh.rotateX(
            projectile.tumble *
            deltaTime
        );

        projectile.mesh.rotateY(
            projectile.tumble *
            0.45 *
            deltaTime
        );

        // ====================================================
        // DETECCIÓN DE IMPACTO
        // ====================================================

        const ray =
            new THREE.Raycaster(
                projectile.mesh.position,
                projectile.direction,
                0,
                distance + 1.5
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
                            projectile.direction.x *
                            projectile.force,

                        y:
                            projectile.direction.y *
                            projectile.force +
                            THREE.MathUtils.lerp(
                                2,
                                8,
                                projectile.charge
                            ),

                        z:
                            projectile.direction.z *
                            projectile.force
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
                projectile.charge
            );

            scene.remove(
                projectile.mesh
            );

            disposeProjectile(
                projectile.mesh
            );

            projectiles.splice(
                i,
                1
            );

            continue;
        }

        // ====================================================
        // MOVIMIENTO
        // ====================================================

        projectile.mesh.position
            .addScaledVector(
                projectile.direction,
                distance
            );

        // ====================================================
        // VIDA
        // ====================================================

        projectile.life -=
            deltaTime;

        if (
            projectile.life <=
            0
        ) {

            scene.remove(
                projectile.mesh
            );

            disposeProjectile(
                projectile.mesh
            );

            projectiles.splice(
                i,
                1
            );
        }
    }
}

// ============================================================
// CONTROLES DEL ARMA
// ============================================================

function setupWeaponControls() {

    // ========================================================
    // COMENZAR CARGA
    // ========================================================

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

    // ========================================================
    // DISPARAR AL SOLTAR
    // ========================================================

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

    // ========================================================
    // CANCELAR SI SALIMOS DEL POINTER LOCK
    // ========================================================

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
}