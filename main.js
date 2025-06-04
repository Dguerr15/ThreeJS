import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Global variables
let scene, camera, renderer, controls;
const cubes = [];
let softball, raycaster, mouse;
let isAnimating = false;
let door, doorOriginalY;
let isDoorRising = false;
let doorRiseStartTime = 0;
let animationStartTime = 0;
let lastTime = 0;

const animationDuration = 4;

// Main entry point
function main() {
    initializeScene();
    setupLighting();
    createGeometry();
    createSkySphere();
    setupEventHandlers();
    startRenderLoop();
}

// Scene initialization
function initializeScene() {
    const canvas = document.querySelector('#c');
    
    renderer = new THREE.WebGLRenderer({
        antialias: true,
        canvas,
        alpha: true,
    });
    renderer.setSize(800, 600);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    const fov = 75;
    const aspect = 2;
    const near = 0.1;
    const far = 100;
    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(0, 10, 20);
    
    scene = new THREE.Scene();
    
    controls = new OrbitControls(camera, canvas);
    controls.target.set(0, 0, 0);
    controls.update();
    
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
}

// Lighting setup
function setupLighting() {
    const skyColor = 0xB1E1FF;
    const groundColor = 0xB97A20;
    const intensity = 2;
    const light = new THREE.HemisphereLight(skyColor, groundColor, intensity);
    scene.add(light);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    scene.add(directionalLight);
    
    const pointLight = new THREE.PointLight(0xff6600, 0.8, 30);
    pointLight.position.set(0, 8, 0);
    pointLight.castShadow = true;
    scene.add(pointLight);
}

// Create all scene geometry
function createGeometry() {
    createTexturedPlane();
    createCarpet();
    createColoredCube(30,-6);
    createColoredCube(-30,-6);
    createDoor(0, -6);
    createCrate(0, -26);
    createColoredSphere();
    loadOBJModel(0, -1.5);
    createTexturedCylinder(-24, -5);
    createTexturedCylinder(24, -5);
    createTexturedCylinder(-12, -5);
    createTexturedCylinder(12, -5);
    createTexturedCylinder(36, -5);
    createTexturedCylinder(-36, -5);
    createTexturedCylinder(48, -5);
    createTexturedCylinder(-48, -5);
    createFence(-12, 4);
    createFence(12, 4);
    createTorch(18, -4);
    createTorch(-18, -4);
    createTorch(-30, -4);
    createTorch(30, -4);
    createTorch(-42, -4);
    createTorch(42, -4);
}

// Ground plane with tiling texture
function createTexturedPlane() {
    const planeSize = 100;
    const loader = new THREE.TextureLoader();
    const texture = loader.load('tile.jpg');
    
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.magFilter = THREE.NearestFilter;
    texture.colorSpace = THREE.SRGBColorSpace;
    
    const repeats = planeSize / 8;
    texture.repeat.set(repeats, repeats);
    
    const planeGeo = new THREE.PlaneGeometry(planeSize, planeSize);
    const planeMat = new THREE.MeshPhongMaterial({
        map: texture,
        side: THREE.DoubleSide,
    });
    
    const mesh = new THREE.Mesh(planeGeo, planeMat);
    mesh.rotation.x = Math.PI * -0.5;
    mesh.position.y = -2.5;
    mesh.receiveShadow = true;
    scene.add(mesh);
}

// Carpet texture on ground
function createCarpet() {
    const planeX = 20;
    const planeZ = 30;
    const loader = new THREE.TextureLoader();
    const texture = loader.load('carpet.jpg');
    
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.magFilter = THREE.NearestFilter;
    texture.colorSpace = THREE.SRGBColorSpace;
    
    const planeGeo = new THREE.PlaneGeometry(planeX, planeZ);
    const planeMat = new THREE.MeshPhongMaterial({
        map: texture,
    });
    
    const mesh = new THREE.Mesh(planeGeo, planeMat);
    mesh.rotation.x = Math.PI * -0.5;
    mesh.position.z = -3;
    mesh.position.y = -2.4;
    mesh.receiveShadow = true;
    scene.add(mesh);
}

// Wall cubes with texture
function createColoredCube(x,z) {
    const textureLoader = new THREE.TextureLoader();
    const scaleX = 40;
    const scaleY = 14;
    const scaleZ = 1;
    const cubeGeo = new THREE.BoxGeometry(scaleX, scaleY, scaleZ);
    const texture = textureLoader.load('wallG.jpg');
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    const cubeMat = new THREE.MeshPhongMaterial({ map: texture });
    const mesh = new THREE.Mesh(cubeGeo, cubeMat);
    mesh.position.set(x, scaleY/2 - 2.5, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
}

// Interactive door that rises when right-clicked
function createDoor(x,z) {
    const textureLoader = new THREE.TextureLoader();
    const scaleX = 20;
    const scaleY = 14;
    const scaleZ = 1;
    const cubeGeo = new THREE.BoxGeometry(scaleX, scaleY, scaleZ);
    const texture = textureLoader.load('door.jpg');
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    const cubeMat = new THREE.MeshPhongMaterial({ map: texture });
    const mesh = new THREE.Mesh(cubeGeo, cubeMat);
    mesh.position.set(x, scaleY/2 - 2.5, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    door = mesh;
    doorOriginalY = mesh.position.y;
    
    scene.add(mesh);
}

// Storage crate
function createCrate(x,z) {
    const textureLoader = new THREE.TextureLoader();
    const scaleX = 10;
    const scaleY = 4;
    const scaleZ = 6;
    const cubeGeo = new THREE.BoxGeometry(scaleX, scaleY, scaleZ);
    const texture = textureLoader.load('crate.png');
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    const cubeMat = new THREE.MeshPhongMaterial({ map: texture });
    const mesh = new THREE.Mesh(cubeGeo, cubeMat);
    mesh.position.set(x, scaleY/2 - 2.5, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
}

// Fence barrier
function createFence(x,z) {
    const textureLoader = new THREE.TextureLoader();
    const scaleX = 15;
    const scaleY = 5;
    const scaleZ = .5;
    const cubeGeo = new THREE.BoxGeometry(scaleX, scaleY, scaleZ);
    const texture = textureLoader.load('fence.jpg');
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    const cubeMat = new THREE.MeshPhongMaterial({ map: texture });
    const mesh = new THREE.Mesh(cubeGeo, cubeMat);
    mesh.position.set(x, scaleY/2 - 2.5, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.rotation.y = Math.PI * 0.5;
    scene.add(mesh);
}

// Torch with orange flame top
function createTorch(x, z) {
    const textureLoader = new THREE.TextureLoader();
    const scaleX = 1;
    const scaleY = 4;
    const scaleZ = 1;
    const cubeGeo = new THREE.BoxGeometry(scaleX, scaleY, scaleZ);
    
    const texture = textureLoader.load('torch.png');
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    
    const materials = [
        new THREE.MeshPhongMaterial({ map: texture }),
        new THREE.MeshPhongMaterial({ map: texture }),
        new THREE.MeshPhongMaterial({ color: 0xff6600 }),
        new THREE.MeshPhongMaterial({ color: 0x8B4513  }),
        new THREE.MeshPhongMaterial({ map: texture }),
        new THREE.MeshPhongMaterial({ map: texture })
    ];
    
    const mesh = new THREE.Mesh(cubeGeo, materials);
    mesh.position.set(x, 7, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.rotation.x = Math.PI * 0.25;
    scene.add(mesh);
}

// Interactive softball that bounces when clicked
function createColoredSphere() {
    const textureLoader = new THREE.TextureLoader();
    const sphereRadius = 1;
    const sphereWidthDivisions = 32;
    const sphereHeightDivisions = 16;
    const sphereGeo = new THREE.SphereGeometry(sphereRadius, sphereWidthDivisions, sphereHeightDivisions);
    const texture = textureLoader.load('SoftballColor.jpg');
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    const sphereMat = new THREE.MeshPhongMaterial({ map: texture });
    const mesh = new THREE.Mesh(sphereGeo, sphereMat);
    mesh.position.set(-3, sphereRadius - 2.5, 4);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    softball = mesh;
    scene.add(mesh);
}

// Concrete pillars
function createTexturedCylinder(x, z) {
    const cylinderRadius = 1.7;
    const cylinderHeight = 14;
    const cylinderSegments = 32;
    
    const cylinderGeo = new THREE.CylinderGeometry(cylinderRadius, cylinderRadius, cylinderHeight, cylinderSegments);
    
    const loader = new THREE.TextureLoader();
    const concreteTexture = loader.load('concrete.jpg');
    concreteTexture.colorSpace = THREE.SRGBColorSpace;
    
    const cylinderMaterials = [
        new THREE.MeshPhongMaterial({ map: concreteTexture }),
        new THREE.MeshPhongMaterial({ color: 0xffffff }),
        new THREE.MeshPhongMaterial({ color: 0xffffff })
    ];
    
    const mesh = new THREE.Mesh(cylinderGeo, cylinderMaterials);
    
    mesh.position.set(x, cylinderHeight / 2 - 2.5, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
}

// Load 3D character model
function loadOBJModel(x,z) {
    const objLoader = new OBJLoader();
    const textureLoader = new THREE.TextureLoader();
    
    const texture = textureLoader.load('shaded.png');
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    const material = new THREE.MeshPhongMaterial({ map: texture });
    
    objLoader.load('Shephard_tri.obj', (root) => {
        root.traverse((child) => {
            if (child.isMesh) {
                child.material = material;
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        
        root.scale.set(3.75, 3.75, 3.75);
        root.position.set(x, -2.5, z);
        scene.add(root);
    }, 
    (progress) => {
        console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%');
    },
    (error) => {
        console.error('Error loading OBJ:', error);
    });
}

// Skybox with daylight texture
function createSkySphere() {
    const skyGeometry = new THREE.SphereGeometry(50, 32, 32);
    const textureLoader = new THREE.TextureLoader();
    
    const skyTexture = textureLoader.load('Daylight.png', 
        () => console.log('Sky texture loaded successfully'),
        (progress) => console.log('Sky texture loading progress:', progress),
        (error) => {
            console.error('Error loading sky texture:', error);
            createFallbackSkySphere();
        }
    );
    
    skyTexture.colorSpace = THREE.SRGBColorSpace;
    
    const skyMaterial = new THREE.MeshBasicMaterial({
        map: skyTexture,
        side: THREE.BackSide
    });
    
    const skySphere = new THREE.Mesh(skyGeometry, skyMaterial);
    skySphere.position.set(0,  - 2.5, 0);
    scene.add(skySphere);
}

// Fallback sky if texture fails to load
function createFallbackSkySphere() {
    const skyGeometry = new THREE.SphereGeometry(50, 32, 32);
    const skyMaterial = new THREE.MeshBasicMaterial({
        color: 0x87CEEB,
        side: THREE.BackSide
    });
    const skySphere = new THREE.Mesh(skyGeometry, skyMaterial);
    scene.add(skySphere);
}

// Event handler setup
function setupEventHandlers() {
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('click', onMouseClick);
    window.addEventListener('contextmenu', onRightClick);
}

// Handle window resizing
function onWindowResize() {
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
}

// Handle left mouse click for softball interaction
function onMouseClick(event) {
    const canvas = renderer.domElement;
    const rect = canvas.getBoundingClientRect();
    
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    
    if (softball) {
        const intersects = raycaster.intersectObject(softball);
        if (intersects.length > 0) {
            isAnimating = !isAnimating;
            if (isAnimating) {
                animationStartTime = performance.now();
            }
            console.log('Softball clicked! Animation:', isAnimating ? 'ON' : 'OFF');
        }
    }
}

// Handle right mouse click for door interaction
function onRightClick(event) {
    event.preventDefault();
    
    const canvas = renderer.domElement;
    const rect = canvas.getBoundingClientRect();
    
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    
    if (door) {
        const intersects = raycaster.intersectObject(door);
        if (intersects.length > 0) {
            if (!isDoorRising) {
                isDoorRising = true;
                doorRiseStartTime = Date.now();
                console.log('Door right-clicked! Door is opening...');
            }
        }
    }
}

// Animate bouncing softball
function animateSoftball(time) {
    if (isAnimating && softball) {
        const currentTime = performance.now();
        const elapsedTime = (currentTime - animationStartTime) / 1000;
        
        if (elapsedTime < animationDuration) {
            const groundLevel = 1 - 2.5;
            
            const decay = Math.exp(-elapsedTime * 1.2);
            
            const bounceFreq = 1.5;
            
            const height = Math.abs(Math.sin(elapsedTime * bounceFreq * Math.PI)) * 6 * decay;
            
            softball.position.y = groundLevel + height;
            
            softball.rotation.x = time * 2;
            softball.rotation.y = time * 1.5;
            softball.rotation.z = time * 0.5;
        } else {
            isAnimating = false;
            softball.position.y = 1 - 2.5;
            console.log('Softball animation stopped');
        }
    }
}

// Animate door opening
function updateDoorAnimation() {
    if (isDoorRising && door) {
        const currentTime = Date.now();
        const elapsedTime = (currentTime - doorRiseStartTime) / 1000;
        const riseDuration = 3;
        const riseHeight = 12;
        
        if (elapsedTime < riseDuration) {
            const progress = elapsedTime / riseDuration;
            const easedProgress = 1 - Math.pow(1 - progress, 3);
            
            door.position.y = doorOriginalY + (riseHeight * easedProgress);
        } else {
            door.position.y = doorOriginalY + riseHeight;
        }
    }
}

// Check if renderer needs resizing
function resizeRendererToDisplaySize() {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    
    if (needResize) {
        renderer.setSize(width, height, false);
    }
    
    return needResize;
}

// Main render loop
function render(time) {
    time *= 0.001;
    const deltaTime = time - lastTime;
    lastTime = time;
    
    if (resizeRendererToDisplaySize()) {
        const canvas = renderer.domElement;
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
    }
    
    animateSoftball(time);
    updateDoorAnimation();
    
    renderer.render(scene, camera);
    requestAnimationFrame(render);
}

// Start the animation loop
function startRenderLoop() {
    requestAnimationFrame(render);
}

main();