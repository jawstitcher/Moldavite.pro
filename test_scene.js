import * as THREE from 'three';

let camera, scene, renderer, mesh;

init();
animate();

function init() {
    const container = document.getElementById('canvas-container');
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xff0000);

    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 5;

    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);
    
    // Add UI just like before to simulate it
    let scoreEl = document.createElement('div');
    scoreEl.id = 'score-display';
    scoreEl.style.position = 'absolute';
    scoreEl.style.top = '1.5rem';
    scoreEl.style.left = '1.5rem';
    scoreEl.style.color = '#ffffff';
    scoreEl.innerText = `MINIMAL SCENE TEST`;
    document.body.appendChild(scoreEl);
}

function animate() {
    requestAnimationFrame(animate);
    mesh.rotation.x += 0.01;
    mesh.rotation.y += 0.02;
    renderer.render(scene, camera);
}
