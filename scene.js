import * as THREE from 'three';

let camera, scene, renderer, moldaviteMesh, light1;
const clock = new THREE.Clock(); // for smooth timing

// Game state
let isGameStarted = false;
let isShrinking = false;
let targetScale = 1.0;
let currentScale = 1.0;
let distanceScore = 0;
let speed = 25.0; // Units per second

// Obstacles
const obstacles = [];
const obstacleGroup = new THREE.Group();

// Keyboard 
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

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a110d, 0.04);
    scene.add(obstacleGroup);

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 3, 10);
    camera.lookAt(0, 0, 0);

    // MOLDAVITE MESH
    const geometry = new THREE.SphereGeometry(1.2, 64, 64);
    
    // Add noise to geometry to keep it looking like a tektite
    const posAttribute = geometry.attributes.position;
    for (let i = 0; i < posAttribute.count; i++) {
        const v = new THREE.Vector3().fromBufferAttribute(posAttribute, i);
        // Simple noise displacement radially
        const noise = Math.sin(v.x * 5) * Math.cos(v.y * 5) * Math.sin(v.z * 5) * 0.1;
        v.add(v.clone().normalize().multiplyScalar(noise));
        posAttribute.setXYZ(i, v.x, v.y, v.z);
    }
    geometry.computeVertexNormals();

    const material = new THREE.MeshPhysicalMaterial({
        color: 0x116633,
        emissive: 0x052211,
        roughness: 0.25,
        transmission: 0.8,
        thickness: 2.0,
        ior: 1.54,
        side: THREE.DoubleSide
    });
    moldaviteMesh = new THREE.Mesh(geometry, material);
    scene.add(moldaviteMesh);

    // LIGHTS
    const ambientLight = new THREE.AmbientLight(0x051a0d, 1.5);
    scene.add(ambientLight);

    light1 = new THREE.DirectionalLight(0x39ff14, 2.5);
    light1.position.set(2, 2, 2);
    scene.add(light1);

    const light2 = new THREE.DirectionalLight(0xaaffea, 1.5);
    light2.position.set(-2, 1, -2);
    scene.add(light2);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    window.addEventListener('resize', onWindowResize);

    // Controls
    window.addEventListener('keydown', (e) => {
        if (e.key === ' ' && isGameStarted) {
            e.preventDefault(); // Stop page scrolling
            isShrinking = true;
        }
        if (keys.hasOwnProperty(e.key)) keys[e.key] = true;
    });
    window.addEventListener('keyup', (e) => {
        if (e.key === ' ') isShrinking = false;
        if (keys.hasOwnProperty(e.key)) keys[e.key] = false;
    });
    
    window.addEventListener('mousedown', () => { if (isGameStarted) isShrinking = true; });
    window.addEventListener('mouseup', () => isShrinking = false);
    window.addEventListener('touchstart', (e) => { 
        if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'INPUT') { 
            if (isGameStarted) isShrinking = true; 
        } 
    });
    window.addEventListener('touchend', () => isShrinking = false);

    // Listen for Awaken event from main.js
    window.addEventListener('awakenMoldavite', (e) => {
        isGameStarted = true;
        distanceScore = 0;
        console.log("Moldavite Awakened: ", e.detail.name);
        
        // Spawn obstacles exactly every 800ms
        setInterval(spawnObstaclePair, 800); 
    });
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function createPillar(isTop, xPos, startZ) {
    const height = 20 + Math.random() * 15;
    const radius = 2.0 + Math.random() * 2.5;
    const geo = new THREE.ConeGeometry(radius, height, 8);
    
    // Add jaggedness to cone
    const posAttr = geo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
        if (posAttr.getY(i) === height / 2) continue; // Keep the tip sharp
        const v = new THREE.Vector3().fromBufferAttribute(posAttr, i);
        const noise = (Math.random() - 0.5) * 0.8;
        v.x += noise;
        v.z += noise;
        posAttr.setXYZ(i, v.x, v.y, v.z);
    }
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({ 
        color: 0x030805, 
        roughness: 0.9,
        flatShading: true
    });
    const mesh = new THREE.Mesh(geo, mat);
    
    if (isTop) {
        mesh.rotation.x = Math.PI;
        // Base is now up, tip is down
        mesh.position.set(xPos, height/2 + 1.5, startZ); 
    } else {
        mesh.position.set(xPos, -height/2 - 1.5, startZ);
    }
    
    mesh.rotation.z += (Math.random() - 0.5) * 0.2;
    mesh.rotation.x += (Math.random() - 0.5) * 0.2;

    return mesh;
}

function spawnObstaclePair() {
    if (!isGameStarted) return;

    const startZ = -80;
    // Spawn across 3 lanes (-5, 0, 5)
    for (let i = -1; i <= 1; i++) {
        const xPos = i * 5; 
        const type = Math.floor(Math.random() * 4); // 0=none, 1=top, 2=bot, 3=both
        
        // Ensure gap is sometimes tight vertically
        const tightGap = Math.random() < 0.6;
        
        if (type === 1 || type === 3) {
            let obsTop = createPillar(true, xPos, startZ);
            if (tightGap) obsTop.position.y -= 2.0;
            obstacleGroup.add(obsTop);
            obstacles.push(obsTop);
        }
        if (type === 2 || type === 3) {
            let obsBot = createPillar(false, xPos, startZ);
            if (tightGap) obsBot.position.y += 2.0;
            obstacleGroup.add(obsBot);
            obstacles.push(obsBot);
        }
    }
}

function gameOver() {
    isGameStarted = false;
    isShrinking = false;
    light1.color.setHex(0xff0000); // Red flash
    
    // Shake camera effect
    const originalPos = camera.position.clone();
    let shakes = 0;
    const shakeInterval = setInterval(() => {
        camera.position.x = originalPos.x + (Math.random() - 0.5) * 0.7;
        camera.position.y = originalPos.y + (Math.random() - 0.5) * 0.7;
        shakes++;
        if (shakes > 10) {
            clearInterval(shakeInterval);
            camera.position.copy(originalPos);
        }
    }, 50);

    setTimeout(() => {
        obstacles.forEach(o => obstacleGroup.remove(o));
        obstacles.length = 0;
        distanceScore = 0;
        rockPos.set(0,0,0);
        rockVel.set(0,0,0);
        light1.color.setHex(0x39ff14);
        isGameStarted = true;
    }, 1500);
}

function animate() {
    requestAnimationFrame(animate);

    const time = clock.getElapsedTime();

    if (moldaviteMesh) {
        // Shrink lerp (0.35 scale when shrunk)
        targetScale = isShrinking ? 0.35 : 1.0;
        currentScale += (targetScale - currentScale) * 0.15;
        moldaviteMesh.scale.set(currentScale, currentScale, currentScale);

        // Keyboard Movement
        const moveAccel = 0.02;
        const friction = 0.88;

        if (keys.ArrowUp) rockVel.z -= moveAccel;
        if (keys.ArrowDown) rockVel.z += moveAccel;
        if (keys.ArrowLeft) rockVel.x -= moveAccel;
        if (keys.ArrowRight) rockVel.x += moveAccel;

        rockPos.add(rockVel);
        rockVel.multiplyScalar(friction);

        // Bounding limits
        const boundX = 8;
        const boundZMin = -6;
        const boundZMax = 3; 

        if (Math.abs(rockPos.x) > boundX) { rockPos.x = Math.sign(rockPos.x) * boundX; rockVel.x *= -0.5; }
        if (rockPos.z > boundZMax) { rockPos.z = boundZMax; rockVel.z *= -0.5; }
        if (rockPos.z < boundZMin) { rockPos.z = boundZMin; rockVel.z *= -0.5; }

        // Position & Bobbing
        moldaviteMesh.position.x = rockPos.x;
        moldaviteMesh.position.y = Math.sin(time * 2.5) * 0.2;
        moldaviteMesh.position.z = rockPos.z;

        // Rotation
        moldaviteMesh.rotation.y += 0.01;
        moldaviteMesh.rotation.x = rockVel.z * 1.5;
        moldaviteMesh.rotation.z = Math.sin(time * 0.5) * 0.2 - rockVel.x * 1.5;

        // Pulse emissive when shrinking to look energized
        moldaviteMesh.material.emissiveIntensity = isShrinking ? 0.6 + Math.sin(time * 15) * 0.3 : 0.2;
    }

    if (isGameStarted) {
        const speedDz = speed * 0.016; 
        distanceScore += speedDz * 0.1;

        // Update Score UI
        let scoreEl = document.getElementById('score-display');
        if (!scoreEl) {
            scoreEl = document.createElement('div');
            scoreEl.id = 'score-display';
            scoreEl.style.position = 'absolute';
            scoreEl.style.top = '1.5rem';
            scoreEl.style.left = '1.5rem';
            scoreEl.style.color = 'var(--emerald-text, #39ff14)';
            scoreEl.style.fontFamily = "'Space Grotesk', sans-serif";
            scoreEl.style.fontSize = '1.2rem';
            scoreEl.style.letterSpacing = '2px';
            scoreEl.style.zIndex = '20';
            scoreEl.style.textShadow = '0 0 10px rgba(57, 255, 20, 0.5)';
            const hud = document.querySelector('.hud-elements');
            if(hud) hud.appendChild(scoreEl);
        }
        scoreEl.innerText = `${Math.floor(distanceScore)} Ly`; // Lightyears

        const moldaviteBox = new THREE.Box3().setFromObject(moldaviteMesh);
        // Shrink the bounding box severely to be very forgiving / fun to play
        moldaviteBox.expandByScalar(isShrinking ? -0.2 : -0.4); 

        let hit = false;
        for (let i = obstacles.length - 1; i >= 0; i--) {
            const obs = obstacles[i];
            obs.position.z += speedDz;

            const obsBox = new THREE.Box3().setFromObject(obs);
            obsBox.expandByScalar(-0.4); 

            if (moldaviteBox.intersectsBox(obsBox)) {
                hit = true;
            }

            if (obs.position.z > 12) {
                obstacleGroup.remove(obs);
                obstacles.splice(i, 1);
            }
        }

        if (hit) {
            gameOver();
        }
    }

    renderer.render(scene, camera);
}
