import * as THREE from 'three';

// ============================================================
// TEXTURA PROCEDURAL DE ARENA
// ============================================================

export function createSandTexture(renderer) {

    const canvas =
        document.createElement(
            'canvas'
        );

    canvas.width = 128;
    canvas.height = 128;

    const ctx =
        canvas.getContext(
            '2d'
        );

    const image =
        ctx.createImageData(
            128,
            128
        );

    // ========================================================
    // COLOR BASE + VARIACIONES
    // ========================================================

    for (
        let i = 0;
        i < image.data.length;
        i += 4
    ) {

        const variation =
            Math.floor(
                Math.random() * 22
            ) - 11;

        image.data[i] =
            226 +
            variation;

        image.data[i + 1] =
            194 +
            variation;

        image.data[i + 2] =
            123 +
            Math.floor(
                variation * 0.55
            );

        image.data[i + 3] =
            255;

    }

    ctx.putImageData(
        image,
        0,
        0
    );

    // ========================================================
    // PEQUEÑOS GRANOS / MOTITAS
    // ========================================================

    for (
        let i = 0;
        i < 220;
        i++
    ) {

        const value =
            145 +
            Math.floor(
                Math.random() * 55
            );

        ctx.fillStyle =
            `rgba(
                ${value},
                ${Math.max(
                    95,
                    value - 25
                )},
                55,
                0.18
            )`;

        ctx.beginPath();

        ctx.arc(
            Math.random() * 128,
            Math.random() * 128,

            0.5 +
            Math.random() * 1.3,

            0,
            Math.PI * 2
        );

        ctx.fill();

    }

    // ========================================================
    // CREAR TEXTURA THREE.JS
    // ========================================================

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

    texture.needsUpdate =
        true;

    return texture;
}