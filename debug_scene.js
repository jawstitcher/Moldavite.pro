import * as THREE from 'three';

let camera, scene, renderer;
let light1, ambientLight;
const clock = new THREE.Clock();

init();
animate();

function init() {
    const container = document.getElementById('canvas-container');

    scene = new THREE.Scene();
    
    // Explicit red background to prove it works
    scene.background = new THREE.Color(0xaa0000);

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 3, 10);
    camera.lookAt(0, 0, 0);

    // MOLDAVITE MESH (BASIC)
    const geometry = new THREE.SphereGeometry(1.2, 32, 32);
    const material = new THREE.MeshStandardMaterial({
        color: 0x00ff00,
        roughness: 0.5,
        metalness: 0.1
    });
    const moldaviteMesh = new THREE.Mesh(geometry, material);
    scene.add(moldaviteMesh);

    // LIGHTS
    ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);

    light1 = new THREE.DirectionalLight(0xffffff, 2.0);
    light1.position.set(2, 2, 2);
    scene.add(light1);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0xaa0000, 1);
    
    container.appendChild(renderer.domElement);
    
    // Simulate main.js awaken firing 
    window.addEventListener('awakenMoldavite', (e) => {
        let scoreEl = document.createElement('div');
        scoreEl.id = 'score-display';
        scoreEl.style.position = 'absolute';
        scoreEl.style.top = '1.5rem';
        scoreEl.style.left = '1.5rem';
        scoreEl.style.color = '#ffffff';
        scoreEl.style.zIndex = '20';
        scoreEl.innerText = `DEBUG SCENE`;
        document.querySelector('.hud-elements').appendChild(scoreEl);
    });
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
