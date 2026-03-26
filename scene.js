import * as THREE from 'three';

let camera, scene, renderer, moldaviteMesh, gridMesh;
const clock = new THREE.Clock(); // for smooth timing

// Mouse tracking and raycasting
const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
const targetPosition = new THREE.Vector3(0, 0, 0);
const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0); // Invisible plane at Z=0 to intersect mouse rays

// Keyboard tracking for movement
const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false
};
const rockPos = new THREE.Vector3(0, 0, 0);
const rockVel = new THREE.Vector3(0, 0, 0);

init();
animate();

function init() {
    const container = document.getElementById('canvas-container');

    // Setup scene
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a110d, 0.08);

    // Setup camera
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 2, 8);
    camera.lookAt(0, 0, 0);

    // --- MOLDAVITE MESH ---
    const geometry = new THREE.SphereGeometry(1.1, 128, 128);

    const posAttribute = geometry.attributes.position;
    const originalPositions = [];
    for (let i = 0; i < posAttribute.count; i++) {
        originalPositions.push(new THREE.Vector3().fromBufferAttribute(posAttribute, i));
    }
    geometry.userData.originalPositions = originalPositions;

    const material = new THREE.MeshPhysicalMaterial({
        color: 0x116633,           // Deep alien green
        emissive: 0x052211,        // Subtle inner glow
        roughness: 0.25,           // Glassy and rugged
        metalness: 0.2,
        transmission: 0.8,         // Translucent like glass
        thickness: 2.0,
        ior: 1.54,                 // Approx refractive index for tektite glass
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
        side: THREE.DoubleSide
    });

    moldaviteMesh = new THREE.Mesh(geometry, material);
    scene.add(moldaviteMesh);

    // --- GRAVITY GRID ---
    const gridGeo = new THREE.PlaneGeometry(30, 30, 100, 100);
    gridGeo.rotateX(-Math.PI / 2); // Lay it flat

    const gridPosAttr = gridGeo.attributes.position;
    const gridOriginalPositions = [];
    for (let i = 0; i < gridPosAttr.count; i++) {
        gridOriginalPositions.push(new THREE.Vector3().fromBufferAttribute(gridPosAttr, i));
    }
    gridGeo.userData.originalPositions = gridOriginalPositions;

    const gridMatMesh = new THREE.MeshBasicMaterial({
        color: 0x14ff64,
        wireframe: true,
        transparent: true,
        opacity: 0.20,
        blending: THREE.AdditiveBlending
    });

    gridMesh = new THREE.Mesh(gridGeo, gridMatMesh);
    gridMesh.position.y = -2;
    scene.add(gridMesh);

    // --- LIGHTS ---
    const ambientLight = new THREE.AmbientLight(0x051a0d, 1.5);
    scene.add(ambientLight);

    const light1 = new THREE.DirectionalLight(0x39ff14, 2.5);
    light1.position.set(2, 2, 2);
    scene.add(light1);

    const light2 = new THREE.DirectionalLight(0xaaffea, 1.5); // Czech glass icy blue/green
    light2.position.set(-2, 1, -2);
    scene.add(light2);

    const light3 = new THREE.PointLight(0x14ff64, 3, 10);
    light3.position.set(0, -2, 2);
    scene.add(light3);

    // --- RENDERER ---
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    container.appendChild(renderer.domElement);

    window.addEventListener('resize', onWindowResize);
    window.addEventListener('mousemove', onMouseMove);

    // Keyboard events
    window.addEventListener('keydown', (e) => {
        if (document.activeElement.tagName === 'INPUT') return;
        if (keys.hasOwnProperty(e.key)) {
            keys[e.key] = true;
        }
    });
    window.addEventListener('keyup', (e) => {
        if (document.activeElement.tagName === 'INPUT') return;
        if (keys.hasOwnProperty(e.key)) {
            keys[e.key] = false;
        }
    });
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseMove(event) {
    // Calculate mouse position in normalized device coordinates
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
}

// Pseudo noise for organic rock shapes
function complexNoise(x, y, z) {
    let n = Math.sin(x * 3.1) * Math.cos(y * 2.8) * Math.sin(z * 3.5);
    n += 0.5 * Math.sin(x * 6.2) * Math.cos(y * 5.5) * Math.sin(z * 7.1);
    n += 0.25 * Math.sin(x * 12.4 + y * 10) * Math.cos(z * 11.2);
    return n;
}

function animate() {
    requestAnimationFrame(animate);

    const time = clock.getElapsedTime();

    // Update the raycaster with camera and mouse position
    raycaster.setFromCamera(mouse, camera);

    if (moldaviteMesh) {
        // --- Keyboard Controls (Velocity & Bounce) ---
        const moveAccel = 0.012;
        const friction = 0.92;

        if (keys.ArrowUp) rockVel.z -= moveAccel;
        if (keys.ArrowDown) rockVel.z += moveAccel;
        if (keys.ArrowLeft) rockVel.x -= moveAccel;
        if (keys.ArrowRight) rockVel.x += moveAccel;

        rockPos.add(rockVel);
        rockVel.multiplyScalar(friction);

        // Grid boundaries (bouncing effect)
        const boundX = 14;
        const boundZMin = -14;
        const boundZMax = 4; // So it doesn't hit or pass the camera at z=8

        if (Math.abs(rockPos.x) > boundX) {
            rockPos.x = Math.sign(rockPos.x) * boundX;
            rockVel.x *= -0.6; // bounce back
        }
        if (rockPos.z > boundZMax) {
            rockPos.z = boundZMax;
            rockVel.z *= -0.6;
        }
        if (rockPos.z < boundZMin) {
            rockPos.z = boundZMin;
            rockVel.z *= -0.6;
        }

        // --- 1. Rock Position with Subtle Bobbing ---
        moldaviteMesh.position.x = rockPos.x;
        moldaviteMesh.position.y = Math.sin(time * 1.5) * 0.15;
        moldaviteMesh.position.z = rockPos.z;

        // Find intersection with dynamic invisible plane at Z = rockPos.z
        plane.constant = -rockPos.z;
        raycaster.ray.intersectPlane(plane, targetPosition);

        // We limit the cursor target distance to prevent infinite stretching (relative to rock center)
        const maxDist = 3.5;
        const offset = targetPosition.clone().sub(moldaviteMesh.position);
        offset.clampLength(0, maxDist);
        const clampedTarget = moldaviteMesh.position.clone().add(offset);

        // Mumbling rotation and movement tilt
        moldaviteMesh.rotation.y += 0.005;
        moldaviteMesh.rotation.x = rockVel.z * 1.5;
        moldaviteMesh.rotation.z = Math.sin(time * 0.1) * 0.1 - rockVel.x * 1.5;

        // --- 2. Morph Geometry & Ferrofluid Effect ---
        const posAttr = moldaviteMesh.geometry.attributes.position;
        const origPos = moldaviteMesh.geometry.userData.originalPositions;

        // The magnet target in local space of the mesh
        const localTarget = clampedTarget.clone().sub(moldaviteMesh.position);

        // Inverse rotate the localTarget to match mesh's local rotation
        const euler = new THREE.Euler().copy(moldaviteMesh.rotation).reorder('YXZ');
        localTarget.applyEuler(new THREE.Euler(-euler.x, -euler.y, -euler.z, 'YXZ'));

        const targetDist = localTarget.length();
        const targetDir = targetDist > 0 ? localTarget.clone().normalize() : new THREE.Vector3();

        for (let i = 0; i < posAttr.count; i++) {
            const v = origPos[i];

            // Base organic noise (jagged tektite)
            const n = complexNoise(v.x * 2.0 + time * 0.2, v.y * 2.0 + time * 0.25, v.z * 2.0);
            const jagged = Math.pow(Math.abs(n), 1.2) * Math.sign(n);
            let displacementScale = jagged * 0.3 + 0.1;

            // Ferrofluid magnetic pull
            if (targetDist > 0.05) {
                const vertexNormal = v.clone().normalize();
                const dot = vertexNormal.dot(targetDir);

                // If the vertex is pointing towards the magnet
                if (dot > 0.4) {
                    const magnetStrength = Math.pow((dot - 0.4) / 0.6, 2.0); // 0 to 1 scaling factor

                    // Add high frequency noise to make spikes jagged and trembling like ferrofluid
                    const spikeNoise = Math.sin(v.x * 20.0 + time * 8.0) * Math.cos(v.y * 20.0 + time * 7.0) * Math.sin(v.z * 20.0) * 0.15;

                    // The pull force increases as the target gets further (to a maximum stretch)
                    const pullForce = Math.min(targetDist, 1.5) * 0.5;

                    // Pull the vertex out into a spike
                    displacementScale += magnetStrength * pullForce * (1.0 + spikeNoise);
                }
            }

            const displacement = v.clone().normalize().multiplyScalar(displacementScale);
            posAttr.setXYZ(i, v.x + displacement.x, v.y + displacement.y, v.z + displacement.z);
        }
        posAttr.needsUpdate = true;
        moldaviteMesh.geometry.computeVertexNormals();

        // Pulse emissive intensity based on how much it is stretched
        const stretchAmount = Math.min(targetDist, 2.0);
        const pulse = (Math.sin(time * 3) + 1) / 2;
        moldaviteMesh.material.emissiveIntensity = 0.1 + (pulse * 0.4) + (stretchAmount * 0.3);
    }

    if (gridMesh) {
        // Morph the grid to simulate gravity well from the moldavite
        const gPosAttr = gridMesh.geometry.attributes.position;
        const gOrigPos = gridMesh.geometry.userData.originalPositions;

        // Track the actual rock position
        const rockX = moldaviteMesh ? moldaviteMesh.position.x : 0;
        const rockY = moldaviteMesh ? moldaviteMesh.position.y : 0;
        const rockZ = moldaviteMesh ? moldaviteMesh.position.z : 0;

        for (let i = 0; i < gPosAttr.count; i++) {
            const v = gOrigPos[i];

            // Offset the well to follow the rock
            const dx = v.x - rockX;
            const dz = v.z - rockZ;
            const distSq = dx * dx + dz * dz;

            const gravityWellScale = 6.0;
            const wellWidth = 0.4;

            let yDisp = -gravityWellScale / (distSq * wellWidth + 1.0);

            const dist = Math.sqrt(distSq);
            const ripple = Math.sin(dist * 1.5 - time * 2.0) * 0.1;

            // Breathing effect modulated by rock's height
            gPosAttr.setY(i, v.y + yDisp * (1.0 + rockY * 0.3) + ripple);
        }
        gPosAttr.needsUpdate = true;
    }

    renderer.render(scene, camera);
}
