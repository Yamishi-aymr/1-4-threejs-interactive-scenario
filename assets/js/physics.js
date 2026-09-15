import * as THREE from 'three';

import RAPIER from 'https://cdn.skypack.dev/@dimforge/rapier3d-compat';

await RAPIER.init();

// ============================================================
// MUNDO FÍSICO
// ============================================================

const physicsWorld =
    new RAPIER.World({
        x: 0,
        y: -9.81,
        z: 0
    });


// ============================================================
// OBJETOS DINÁMICOS
// ============================================================

export const physicalObjects = [];

export let dynamicPhysicsReady = false;


// ============================================================
// CREAR COLLIDER DEL ESCENARIO
// ============================================================

function createMergedRapierWorldCollider(
    model
) {

    model.updateMatrixWorld(
        true
    );

    const vertexArrays = [];
    const indexArrays = [];

    let vertexOffset = 0;

    let totalVertices = 0;
    let totalIndices = 0;


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
                    position.count * 3
                );


            for (
                let i = 0;
                i < position.count;
                i++
            ) {

                vertices[i * 3] =
                    position.getX(i);

                vertices[i * 3 + 1] =
                    position.getY(i);

                vertices[i * 3 + 2] =
                    position.getZ(i);
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
                        geometry.index.getX(i) +
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


    // ========================================================
    // UNIR VÉRTICES
    // ========================================================

    const vertices =
        new Float32Array(
            totalVertices
        );


    const indices =
        new Uint32Array(
            totalIndices
        );


    let vertexPosition = 0;
    let indexPosition = 0;


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


    // ========================================================
    // CREAR COLLIDER ÚNICO
    // ========================================================

    if (
        indices.length >= 3
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
// CREAR CAJA DINÁMICA
// ============================================================

function createDynamicBox(
    scene,
    x,
    y,
    z,
    sx,
    sy,
    sz,
    mass = 4,
    color = 0xd99a32
) {

    // ========================================================
    // OBJETO THREE.JS
    // ========================================================

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


    // ========================================================
    // CUERPO RÍGIDO RAPIER
    // ========================================================

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


    // ========================================================
    // DENSIDAD
    // ========================================================

    const volume =
        Math.max(
            sx *
            sy *
            sz,

            0.01
        );


    // ========================================================
    // COLLIDER
    // ========================================================

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


    // ========================================================
    // GUARDAR OBJETO
    // ========================================================

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
// CREAR CAJAS DE BANANA BEACH
// ============================================================

function createPhysicalObjects(
    scene
) {

    const colors = [

        0xf4b942,
        0xe8942f,
        0xe8c34a,
        0xd99130,
        0xffd34e,
        0xc9872b
    ];


    let colorIndex = 0;


    // ========================================================
    // TORRE DE CAJAS
    // ========================================================

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

                scene,

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


    // ========================================================
    // CAJA GRANDE
    // ========================================================

    createDynamicBox(

        scene,

        3,
        0.8,
        -5,

        1.2,
        1.5,
        1.2,

        8,

        0x9e642c
    );


    // ========================================================
    // CAJA PEQUEÑA
    // ========================================================

    createDynamicBox(

        scene,

        4.4,
        0.45,
        -5,

        0.8,
        0.8,
        0.8,

        2,

        0xffcf3e
    );
}


// ============================================================
// INICIAR FÍSICA DEL ESCENARIO
// ============================================================

export function setupDynamicPhysics(
    scene,
    model
) {

    if (
        dynamicPhysicsReady
    ) {

        return;
    }


    // ========================================================
    // COLLIDER DEL MAPA
    // ========================================================

    createMergedRapierWorldCollider(
        model
    );


    // ========================================================
    // OBJETOS DINÁMICOS
    // ========================================================

    createPhysicalObjects(
        scene
    );


    dynamicPhysicsReady =
        true;


    console.log(
        '✅ Física dinámica lista'
    );
}


// ============================================================
// SINCRONIZAR RAPIER -> THREE.JS
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
// RECUPERAR OBJETOS QUE CAIGAN
// ============================================================

function recoverFallenObjects() {

    for (
        const item of physicalObjects
    ) {

        const position =
            item.body.translation();


        if (
            position.y >= -25
        ) {

            continue;
        }


        // ====================================================
        // POSICIÓN
        // ====================================================

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


        // ====================================================
        // ROTACIÓN
        // ====================================================

        item.body.setRotation(

            {
                x: 0,
                y: 0,
                z: 0,
                w: 1
            },

            true
        );


        // ====================================================
        // VELOCIDAD
        // ====================================================

        item.body.setLinvel(

            {
                x: 0,
                y: 0,
                z: 0
            },

            true
        );


        // ====================================================
        // ROTACIÓN / VELOCIDAD ANGULAR
        // ====================================================

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
// ACTUALIZAR FÍSICA
// ============================================================

export function updatePhysics(
    deltaTime
) {

    if (
        !dynamicPhysicsReady
    ) {

        return;
    }


    physicsWorld.timestep =
        deltaTime;


    physicsWorld.step();


    syncPhysics();


    recoverFallenObjects();
}