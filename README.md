# Instituto Tecnológico de Pachuca

## Ingeniería en tecnologías de la Información y Comunicaciones

### Desarrollo de Soluciones en Ambientes virtuales

Profesor: **Víctor Manuel Pinedo Fernández**

Autor: **Alicia Yamileth Mariano Reséndiz**

Fecha: **15/09/2026**

# Práctica 1.4 | Escenarios interactivos

## Banana Beach – Escenario Interactivo 3D

Proyecto desarrollado con **Three.js** y **Rapier 3D** para crear un escenario interactivo en primera persona con movimiento, colisiones, objetos físicos y disparos.

El proyecto parte de un escenario 3D basado en el ejemplo `games_fps` de Three.js y fue personalizado con una temática de **isla tropical - Banana Beach**.

El jugador puede recorrer el escenario, saltar, interactuar físicamente con cajas y utilizar una **Banana Bláster** que dispara proyectiles con forma de plátano.

---

## 🌴 Descripción del proyecto

Banana Beach es un pequeño escenario 3D interactivo ambientado en una isla tropical.

El entorno incluye elementos como:

- Arena.
- Palmeras.
- Rocas.
- Nubes.
- Iluminación tropical.
- Objetos físicos.
- Cajas que pueden ser empujadas y derribadas.
- Arma temática denominada **Banana Bláster**.
- Proyectiles 3D con forma de plátano.

El objetivo principal de la práctica es experimentar con diferentes conceptos de interacción y física dentro de un entorno tridimensional.

---

## Controles

`W`
`S`
`A`
`D`
`SPACE`-> Saltar

`Mouse` -> Mover la cámara

`Click izquierdo` -> Disparar

`Mantener Click izquierdo` -> Cargar el disparo

`Soltar Click` -> Lanzar el proyectil cargado

Para comenzar a controlar la cámara es necesario hacer clic sobre el escenario.

---

Al mantener presionado el botón izquierdo del mouse:

- Aumenta el tamaño del proyectil;
- Aumenta su velocidad;
- Aumenta la fuerza del impacto;
- Aumenta el brillo del efecto de carga;
- Aumenta el retroceso del arma.

Al soltar el botón se dispara un plátano 3D hacia el centro de la mira.

Los proyectiles también giran mientras se desplazan, dando la sensación de que el plátano fue lanzado físicamente.

---

## 🎯 Sistema de apuntado

El sistema utiliza un `Raycaster` desde el centro de la cámara.

Esto permite determinar el punto exacto al que apunta la mira.

Aunque el proyectil aparece físicamente desde la punta de la Banana Bláster, su trayectoria se calcula desde el arma hasta el punto seleccionado por la mira.

De esta manera se evita que el disparo viaje paralelo al objetivo y permite obtener una mayor precisión.

---

## 📦 Objetos físicos

Las cajas del escenario utilizan **Rapier 3D** para simular física.

Los objetos cuentan con:

- Masa, gravedad, fricción, restitución, rotación, velocidad,  impulsos.

Cuando un proyectil golpea una caja se aplica un impulso en el punto de impacto.

Esto permite que los objetos no solamente se desplacen, sino que también puedan girar dependiendo del lugar en el que reciben el disparo.

El jugador también puede empujar las cajas al caminar contra ellas
