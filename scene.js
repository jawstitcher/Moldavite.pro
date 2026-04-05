import * as THREE from 'three';

let camera, scene, renderer, moldaviteMesh, gridMesh;
let light1, light2, ambientLight;
const clock = new THREE.Clock(); // for smooth timing

// Game state
let isGameStarted = false;
let isShrinking = false;
let currentScale = 1.0;
let transitionScale = 0.0; // 0 = spikey, 1 = smooth
let dimensionCount = 1;
let speed = 45.0; // Units per second

// Color Dimensions Checkpoints
const dimensions = [
    { bg: 0x0a110d, l1: 0x39ff14, l2: 0xaaffea, grid: 0x14ff64, rock: 0x116633, ems: 0x052211 }, // Green (Base)
    { bg: 0x110522, l1: 0xff1493, l2: 0x00ffff, grid: 0xff00ff, rock: 0x4B0082, ems: 0x1a0033 }, // Synthwave Purple
    { bg: 0x220505, l1: 0xff4500, l2: 0xff8c00, grid: 0xff2400, rock: 0x800000, ems: 0x3d0000 }, // Blood Moon
    { bg: 0x051a22, l1: 0x00ced1, l2: 0x1e90ff, grid: 0x00bfff, rock: 0x00008b, ems: 0x00003d }, // Abyssal Blue
    { bg: 0x221a05, l1: 0xffd700, l2: 0xffffff, grid: 0xdaa520, rock: 0xb8860b, ems: 0x4a3600 }, // Solar Gold
];

let targetDim = { ...dimensions[0] };

// Wormholes
const wormholes = [];
const obstacleGroup = new THREE.Group();

// Keyboard 
const keys = {
    ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false,
    w: false, a: false, s: false, d: false
};
const rockPos = new THREE.Vector3(0, 0, 0);
const rockVel = new THREE.Vector3(0, 0, 0);

init();
animate();

function init() {
    const container = document.getElementById('canvas-container');

    scene = new THREE.Scene();
    scene.background = new THREE.Color(targetDim.bg);
    scene.fog = new THREE.FogExp2(targetDim.bg, 0.035);
    scene.add(obstacleGroup);

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 3, 10);
    camera.lookAt(0, 0, 0);

    // MOLDAVITE MESH
    const geometry = new THREE.SphereGeometry(1.2, 64, 64);
    
    // Store original positions for Morphing (Spikey to Smooth)
    const posAttribute = geometry.attributes.position;
    const originalPositions = [];
    for (let i = 0; i < posAttribute.count; i++) {
        originalPositions.push(new THREE.Vector3().fromBufferAttribute(posAttribute, i));
    }
    geometry.userData.originalPositions = originalPositions;

    const material = new THREE.MeshPhysicalMaterial({
        color: targetDim.rock,
        emissive: targetDim.ems,
        roughness: 0.25,
        transmission: 0.8,
        thickness: 2.0,
        ior: 1.54,
        side: THREE.DoubleSide
    });
    moldaviteMesh = new THREE.Mesh(geometry, material);
    scene.add(moldaviteMesh);

    // GRAVITY GRID (Wormhole distortion field)
    const gridGeo = new THREE.PlaneGeometry(80, 100, 40, 40);
    gridGeo.rotateX(-Math.PI / 2);
    const gridOriginalPositions = [];
    const gridAttr = gridGeo.attributes.position;
    for (let i = 0; i < gridAttr.count; i++) {
        gridOriginalPositions.push(new THREE.Vector3().fromBufferAttribute(gridAttr, i));
    }
    gridGeo.userData.originalPositions = gridOriginalPositions;
    
    const gridMat = new THREE.MeshBasicMaterial({
        color: targetDim.grid,
        wireframe: true,
        transparent: true,
        opacity: 0.15,
        blending: THREE.AdditiveBlending
    });
    gridMesh = new THREE.Mesh(gridGeo, gridMat);
    gridMesh.position.y = -4;
    scene.add(gridMesh);

    // LIGHTS
    ambientLight = new THREE.AmbientLight(targetDim.bg, 3.5);
    scene.add(ambientLight);

    light1 = new THREE.DirectionalLight(targetDim.l1, 2.5);
    light1.position.set(2, 2, 2);
    scene.add(light1);

    light2 = new THREE.DirectionalLight(targetDim.l2, 1.5);
    light2.position.set(-2, 1, -2);
    scene.add(light2);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(targetDim.bg, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    window.addEventListener('resize', onWindowResize);

    // Controls
    window.addEventListener('keydown', (e) => {
        if (e.key === ' ' && isGameStarted) {
            e.preventDefault();
            isShrinking = true;
        }
        if (keys.hasOwnProperty(e.key)) keys[e.key] = true;
        if(e.key.toLowerCase() === 'w') keys.w = true;
        if(e.key.toLowerCase() === 'a') keys.a = true;
        if(e.key.toLowerCase() === 's') keys.s = true;
        if(e.key.toLowerCase() === 'd') keys.d = true;
    });
    
    window.addEventListener('keyup', (e) => {
        if (e.key === ' ') isShrinking = false;
        if (keys.hasOwnProperty(e.key)) keys[e.key] = false;
        if(e.key.toLowerCase() === 'w') keys.w = false;
        if(e.key.toLowerCase() === 'a') keys.a = false;
        if(e.key.toLowerCase() === 's') keys.s = false;
        if(e.key.toLowerCase() === 'd') keys.d = false;
    });
    
    window.addEventListener('mousedown', () => { if (isGameStarted) isShrinking = true; });
    window.addEventListener('mouseup', () => isShrinking = false);
    window.addEventListener('touchstart', (e) => { 
        if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'INPUT') { 
            if (isGameStarted) isShrinking = true; 
        } 
    });
    window.addEventListener('touchend', () => isShrinking = false);

    window.addEventListener('awakenMoldavite', (e) => {
        isGameStarted = true;
        dimensionCount = 1;
        updateScoreUI();
        setInterval(spawnWormhole, 2800); 
    });
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Procedural noise for jagged tektite mapping
function complexNoise(x, y, z) {
    let n = Math.sin(x * 4.1) * Math.cos(y * 3.8) * Math.sin(z * 4.5);
    n += 0.5 * Math.sin(x * 8.2) * Math.cos(y * 7.5) * Math.sin(z * 9.1);
    return n;
}

function spawnWormhole() {
    if (!isGameStarted) return;
    
    const startZ = -120;
    
    // Create a glowing wormhole Torus
    const radius = 3.5; 
    const tube = 0.25;
    const geo = new THREE.TorusGeometry(radius, tube, 16, 64);
    
    const mat = new THREE.MeshPhysicalMaterial({ 
        color: targetDim.l1,
        emissive: targetDim.l1,
        emissiveIntensity: 2.5,
        transparent: true,
        opacity: 0.9,
    });
    
    const mesh = new THREE.Mesh(geo, mat);
    
    // Procedural random positions targeting play area
    mesh.position.set((Math.random() - 0.5) * 14, (Math.random() - 0.5) * 8, startZ);
    mesh.rotation.x = (Math.random() - 0.5) * 0.4;
    mesh.rotation.y = (Math.random() - 0.5) * 0.4;
    
    mesh.userData = { passed: false };
    
    obstacleGroup.add(mesh);
    wormholes.push(mesh);
}

function shiftDimension() {
    dimensionCount++;
    updateScoreUI();
    
    // Flash effect for piercing the dimension
    const flash = document.createElement('div');
    flash.style.position = 'fixed';
    flash.style.top = '0'; flash.style.left = '0';
    flash.style.width = '100vw'; flash.style.height = '100vh';
    flash.style.backgroundColor = '#ffffff';
    flash.style.zIndex = '100';
    flash.style.opacity = '1';
    flash.style.transition = 'opacity 0.8s ease-out';
    flash.style.pointerEvents = 'none';
    document.body.appendChild(flash);
    
    setTimeout(() => { flash.style.opacity = '0'; }, 50);
    setTimeout(() => { flash.remove(); }, 850);
    
    // Shift targets to a random dimension palette
    targetDim = dimensions[Math.floor(Math.random() * dimensions.length)];
}

function updateScoreUI() {
    let scoreEl = document.getElementById('score-display');
    if (!scoreEl) {
        scoreEl = document.createElement('div');
        scoreEl.id = 'score-display';
        scoreEl.style.position = 'absolute';
        scoreEl.style.top = '1.5rem';
        scoreEl.style.left = '1.5rem';
        scoreEl.style.color = '#ffffff';
        scoreEl.style.fontFamily = "'Space Grotesk', sans-serif";
        scoreEl.style.fontSize = '1.2rem';
        scoreEl.style.letterSpacing = '2px';
        scoreEl.style.zIndex = '20';
        scoreEl.style.textShadow = '0 0 10px rgba(255, 255, 255, 0.8)';
        
        const hud = document.querySelector('.hud-elements');
        if(hud) hud.appendChild(scoreEl);
    }
    scoreEl.innerText = `DIMENSION O-${dimensionCount}`;
    
    // Give it a subtle pulse animation for achieving a new dimension
    scoreEl.style.transform = 'scale(1.2)';
    setTimeout(() => scoreEl.style.transform = 'scale(1.0)', 300);
    scoreEl.style.transition = 'transform 0.3s ease';
}

function gameOver() {
    isGameStarted = false;
    isShrinking = false;
    light1.color.setHex(0xff0000); // Red flash
    scene.background.setHex(0xff0000);
    
    // Screen Shake Extravaganza
    const originalPos = camera.position.clone();
    let shakes = 0;
    const shakeInterval = setInterval(() => {
        camera.position.x = originalPos.x + (Math.random() - 0.5) * 0.9;
        camera.position.y = originalPos.y + (Math.random() - 0.5) * 0.9;
        shakes++;
        if (shakes > 12) {
            clearInterval(shakeInterval);
            camera.position.copy(originalPos);
        }
    }, 40);

    setTimeout(() => {
        wormholes.forEach(o => obstacleGroup.remove(o));
        wormholes.length = 0;
        dimensionCount = 1;
        updateScoreUI();
        rockPos.set(0,0,0);
        rockVel.set(0,0,0);
        
        // Reset colors
        targetDim = dimensions[0];
        
        isGameStarted = true;
    }, 1800);
}

function animate() {
    requestAnimationFrame(animate);
    const time = clock.getElapsedTime();

    if (moldaviteMesh) {
        
        // --- Dimension Lerp Interpolation ---
        ambientLight.color.lerp(new THREE.Color(targetDim.bg), 0.02);
        scene.fog.color.lerp(new THREE.Color(targetDim.bg), 0.02);
        scene.background.lerp(new THREE.Color(targetDim.bg), 0.02);
        renderer.setClearColor(scene.background, 1);
        light1.color.lerp(new THREE.Color(targetDim.l1), 0.02);
        light2.color.lerp(new THREE.Color(targetDim.l2), 0.02);
        gridMesh.material.color.lerp(new THREE.Color(targetDim.grid), 0.02);
        moldaviteMesh.material.color.lerp(new THREE.Color(targetDim.rock), 0.02);
        moldaviteMesh.material.emissive.lerp(new THREE.Color(targetDim.ems), 0.02);

        // --- Morph & Shrink Logic ---
        targetScale = isShrinking ? 0.35 : 1.0;
        currentScale += (targetScale - currentScale) * 0.15;
        moldaviteMesh.scale.set(currentScale, currentScale, currentScale);
        
        // transitionScale maps morphing ratio (1.0 = fully smooth, 0.0 = fully spikey)
        const targetTransition = isShrinking ? 1.0 : 0.0;
        transitionScale += (targetTransition - transitionScale) * 0.12;

        const posAttr = moldaviteMesh.geometry.attributes.position;
        const origPos = moldaviteMesh.geometry.userData.originalPositions;
        
        // As player shrinks (transitionScale approaches 1.0), spike noise reduces to 0
        const noiseAmplitude = 0.35 * (1.0 - transitionScale);
        
        for (let i = 0; i < posAttr.count; i++) {
            const v = origPos[i];
            
            if (noiseAmplitude > 0.01) {
                const n = complexNoise(v.x * 2.0 + time, v.y * 2.0 + time, v.z * 2.5);
                const jagged = Math.pow(Math.abs(n), 1.5) * Math.sign(n);
                
                const displacementScale = 1.0 + (jagged * noiseAmplitude);
                const displaced = v.clone().normalize().multiplyScalar(displacementScale);
                posAttr.setXYZ(i, displaced.x, displaced.y, displaced.z);
            } else {
                posAttr.setXYZ(i, v.x, v.y, v.z);
            }
        }
        posAttr.needsUpdate = true;
        moldaviteMesh.geometry.computeVertexNormals();

        // --- XY Screen-Space Movement Logic ---
        const moveAccel = 0.030;
        const friction = 0.86;

        if (keys.ArrowUp || keys.w) rockVel.y += moveAccel;
        if (keys.ArrowDown || keys.s) rockVel.y -= moveAccel;
        if (keys.ArrowLeft || keys.a) rockVel.x -= moveAccel;
        if (keys.ArrowRight || keys.d) rockVel.x += moveAccel;

        // Auto constant gravity pull towards center to make steering dynamic
        rockVel.x -= rockPos.x * 0.0015;
        rockVel.y -= rockPos.y * 0.0015;

        rockPos.add(rockVel);
        rockVel.multiplyScalar(friction);

        // Movement limits
        const boundXY = 9.5;
        if (Math.abs(rockPos.x) > boundXY) { rockPos.x = Math.sign(rockPos.x) * boundXY; rockVel.x *= -0.5; }
        if (Math.abs(rockPos.y) > boundXY) { rockPos.y = Math.sign(rockPos.y) * boundXY; rockVel.y *= -0.5; }

        moldaviteMesh.position.x = rockPos.x;
        moldaviteMesh.position.y = rockPos.y + (Math.sin(time * 3.0) * 0.15); // subtle bob
        moldaviteMesh.position.z = 0;

        // Spin it aggressively when transitioning dimensions or accelerating
        moldaviteMesh.rotation.y += 0.01;
        moldaviteMesh.rotation.x = -rockVel.y * 1.5;
        moldaviteMesh.rotation.z = Math.sin(time * 0.5) * 0.2 - rockVel.x * 1.5;

        // Ensure glass visibility while maintaining emissive strength
        const baseIntensity = isShrinking ? 1.0 + Math.sin(time * 20) * 0.5 : 0.4;
        moldaviteMesh.material.emissiveIntensity = baseIntensity;
    }

    if (gridMesh) {
        // Warp grid towards player (Visible Gravity Field)
        const gPosAttr = gridMesh.geometry.attributes.position;
        const gOrigPos = gridMesh.geometry.userData.originalPositions;
        
        for (let i = 0; i < gPosAttr.count; i++) {
            const v = gOrigPos[i];
            
            // Sweep Z to simulate high speed flight
            const scrollSpeed = isGameStarted ? time * speed : time * 8.0;
            const wrapZ = ((v.z + scrollSpeed + 50) % 100) - 50; 
            
            // Gravity well effect pulling aggressively upwards forming a tunnel impression
            const dist = Math.sqrt(v.x*v.x + wrapZ*wrapZ);
            const well = Math.max(0, 18 - dist) * 0.3;
            
            gPosAttr.setXYZ(i, v.x, v.y + well + Math.sin(v.x*0.5 + time*2.0)*0.5, wrapZ);
        }
        gPosAttr.needsUpdate = true;
    }

    if (isGameStarted) {
        const speedDz = speed * 0.016; 

        // Update Wormholes
        for (let i = wormholes.length - 1; i >= 0; i--) {
            const wh = wormholes[i];
            wh.position.z += speedDz;
            
            // Spin the wormhole intensely
            wh.rotation.z -= 0.08;
            wh.material.color.lerp(new THREE.Color(targetDim.l1), 0.05);
            wh.material.emissive.lerp(new THREE.Color(targetDim.l1), 0.05);

            // Wormhole logic: Pass through z = 0 safely
            if (wh.position.z > -1 && wh.position.z < 1.5 && !wh.userData.passed) {
                const distToCenter = Math.sqrt(
                    Math.pow(moldaviteMesh.position.x - wh.position.x, 2) + 
                    Math.pow(moldaviteMesh.position.y - wh.position.y, 2)
                );
                
                // Collisions: 
                // 1. Must be actively shrinking
                // 2. Must physically fit inside the inner radius (which is approx ~2.2ish)
                if (!isShrinking || distToCenter > 2.0) {
                    gameOver();
                    break;
                } else if (Math.abs(wh.position.z) < 0.5) {
                    wh.userData.passed = true;
                    shiftDimension();
                }
            }

            if (wh.position.z > 12) {
                obstacleGroup.remove(wh);
                wormholes.splice(i, 1);
            }
        }
    }

    renderer.render(scene, camera);
}
