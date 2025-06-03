import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let scene, camera, renderer, controls;
const cubes = [];

function main() {
    initializeScene();
    setupLighting();
    createGeometry();
    createTextureExamples();
    createSkySphere();
    setupEventHandlers();
    startRenderLoop();
}

function initializeScene() {
    // Setup canvas, renderer, camera, scene, and controls
    const canvas = document.querySelector('#c');
    
    renderer = new THREE.WebGLRenderer({
        antialias: true,
        canvas,
        alpha: true,
    });
    renderer.setSize(800, 600);
    
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
}

function setupLighting() {
    // Add hemisphere lighting to the scene
    const skyColor = 0xB1E1FF;
    const groundColor = 0xB97A20;
    const intensity = 3;
    const light = new THREE.HemisphereLight(skyColor, groundColor, intensity);
    scene.add(light);
}

function createGeometry() {
    // Create basic geometric shapes in the scene
    createTexturedPlane();
    createColoredCube();
    createColoredSphere();
    loadOBJModel();
}

function createTexturedPlane() {
    // Create a large textured ground plane
    const planeSize = 40;
    const loader = new THREE.TextureLoader();
    const texture = loader.load('tile.jpg');
    
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.magFilter = THREE.NearestFilter;
    texture.colorSpace = THREE.SRGBColorSpace;
    
    const repeats = planeSize / 2;
    texture.repeat.set(repeats, repeats);
    
    const planeGeo = new THREE.PlaneGeometry(planeSize, planeSize);
    const planeMat = new THREE.MeshPhongMaterial({
        map: texture,
        side: THREE.DoubleSide,
    });
    
    const mesh = new THREE.Mesh(planeGeo, planeMat);
    mesh.rotation.x = Math.PI * -0.5;
    mesh.position.y = -2.5;
    scene.add(mesh);
}

function createColoredCube() {
    // Create a blue cube positioned to the right
    const cubeSize = 4;
    const cubeGeo = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
    const cubeMat = new THREE.MeshPhongMaterial({ color: '#8AC' });
    const mesh = new THREE.Mesh(cubeGeo, cubeMat);
    mesh.position.set(cubeSize + 1, cubeSize / 2, 0);
    scene.add(mesh);
}

function createColoredSphere() {
    // Create a pink sphere positioned to the left
    const sphereRadius = 3;
    const sphereWidthDivisions = 32;
    const sphereHeightDivisions = 16;
    const sphereGeo = new THREE.SphereGeometry(sphereRadius, sphereWidthDivisions, sphereHeightDivisions);
    const sphereMat = new THREE.MeshPhongMaterial({ color: '#CA8' });
    const mesh = new THREE.Mesh(sphereGeo, sphereMat);
    mesh.position.set(-sphereRadius - 1, sphereRadius + 2, 0);
    scene.add(mesh);
}

function loadOBJModel() {
    // Load and display a 3D OBJ model with texture
    const objLoader = new OBJLoader();
    const textureLoader = new THREE.TextureLoader();
    
    const texture = textureLoader.load('shaded.png');
    texture.colorSpace = THREE.SRGBColorSpace;
    
    const material = new THREE.MeshPhongMaterial({ map: texture });
    
    objLoader.load('Shephard_tri.obj', (root) => {
        root.traverse((child) => {
            if (child.isMesh) {
                child.material = material;
            }
        });
        
        root.scale.set(1.75, 1.75, 1.75);
        root.position.set(0, -2.5, 1.5);
        scene.add(root);
    }, 
    (progress) => {
        console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%');
    },
    (error) => {
        console.error('Error loading OBJ:', error);
    });
}

function createTextureExamples() {
    // Create various cubes demonstrating different texture techniques
    const loadManager = new THREE.LoadingManager();
    const loader = new THREE.TextureLoader(loadManager);
    
    loadManager.onLoad = () => console.log('All textures loaded!');
    loadManager.onProgress = (url, itemsLoaded, itemsTotal) => {
        console.log(`Loading progress: ${itemsLoaded}/${itemsTotal} - ${url}`);
    };
    loadManager.onError = (url) => console.error(`Failed to load: ${url}`);
    
    const loadColorTexture = (path) => {
        const texture = loader.load(path);
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
    };
    
    createSingleTextureCube(loadColorTexture);
    createMultiTextureCube(loadColorTexture);
    createCustomTextureCube(loadColorTexture);
    createFilteringExamples(loadColorTexture);
    createPixelatedCube(loadColorTexture);
}

function createSingleTextureCube(loadColorTexture) {
    // Create a cube with a single texture applied to all faces
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const texture = loadColorTexture('wallG.jpg');
    const material = new THREE.MeshBasicMaterial({ map: texture });
    const cube = new THREE.Mesh(geometry, material);
    cube.position.x = -2;
    scene.add(cube);
    cubes.push(cube);
}

function createMultiTextureCube(loadColorTexture) {
    // Create a cube with different textures on each face
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const materials = [
        new THREE.MeshBasicMaterial({ map: loadColorTexture('flower-1.jpg') }),
        new THREE.MeshBasicMaterial({ map: loadColorTexture('flower-2.jpg') }),
        new THREE.MeshBasicMaterial({ map: loadColorTexture('flower-3.jpg') }),
        new THREE.MeshBasicMaterial({ map: loadColorTexture('flower-4.jpg') }),
        new THREE.MeshBasicMaterial({ map: loadColorTexture('flower-5.jpg') }),
        new THREE.MeshBasicMaterial({ map: loadColorTexture('flower-6.jpg') }),
    ];
    
    const cube = new THREE.Mesh(geometry, materials);
    cube.position.x = 0;
    scene.add(cube);
    cubes.push(cube);
}

function createCustomTextureCube(loadColorTexture) {
    // Create a cube demonstrating texture transformation (repeat, offset, rotation)
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const texture = loadColorTexture('wallG.jpg');
    
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 1);
    texture.offset.set(0.25, 0.25);
    texture.center.set(0.5, 0.5);
    texture.rotation = THREE.MathUtils.degToRad(45);
    
    const material = new THREE.MeshBasicMaterial({ map: texture });
    const cube = new THREE.Mesh(geometry, material);
    cube.position.x = 2;
    scene.add(cube);
    cubes.push(cube);
}

function createFilteringExamples(loadColorTexture) {
    // Create multiple cubes showing different texture filtering modes
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const y = -2;
    
    const filterModes = [
        { name: 'NearestFilter', magFilter: THREE.NearestFilter, minFilter: THREE.NearestFilter },
        { name: 'LinearFilter', magFilter: THREE.LinearFilter, minFilter: THREE.LinearFilter },
        { name: 'NearestMipmapNearestFilter', magFilter: THREE.NearestFilter, minFilter: THREE.NearestMipmapNearestFilter },
        { name: 'NearestMipmapLinearFilter', magFilter: THREE.NearestFilter, minFilter: THREE.NearestMipmapLinearFilter },
        { name: 'LinearMipmapNearestFilter', magFilter: THREE.LinearFilter, minFilter: THREE.LinearMipmapNearestFilter },
        { name: 'LinearMipmapLinearFilter', magFilter: THREE.LinearFilter, minFilter: THREE.LinearMipmapLinearFilter },
    ];
    
    filterModes.forEach((mode, index) => {
        const texture = loadColorTexture('wallG.jpg');
        texture.magFilter = mode.magFilter;
        texture.minFilter = mode.minFilter;
        
        const material = new THREE.MeshBasicMaterial({ map: texture });
        const cube = new THREE.Mesh(geometry, material);
        
        cube.position.x = (index - 2.5) * 1.2;
        cube.position.y = y;
        cube.scale.set(0.8, 0.8, 0.8);
        
        scene.add(cube);
        cubes.push(cube);
        
        console.log(`Filter mode ${index}: ${mode.name}`);
    });
}

function createPixelatedCube(loadColorTexture) {
    // Create a cube with pixelated texture using nearest neighbor filtering
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const texture = loadColorTexture('wallG.jpg');
    
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    
    const material = new THREE.MeshBasicMaterial({ map: texture });
    const cube = new THREE.Mesh(geometry, material);
    cube.position.set(0, 2, 0);
    scene.add(cube);
    cubes.push(cube);
}

function createSkySphere() {
    // Create a textured sky sphere surrounding the scene
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
    scene.add(skySphere);
}

function createFallbackSkySphere() {
    // Create a basic gradient sky sphere as fallback
    const skyGeometry = new THREE.SphereGeometry(50, 32, 32);
    const skyMaterial = new THREE.MeshBasicMaterial({
        color: 0x87CEEB,
        side: THREE.BackSide
    });
    const skySphere = new THREE.Mesh(skyGeometry, skyMaterial);
    scene.add(skySphere);
}

function setupEventHandlers() {
    // Handle window resize events
    window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
    // Update camera and renderer when window is resized
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
}

function resizeRendererToDisplaySize() {
    // Check if renderer needs to be resized and update if necessary
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    
    if (needResize) {
        renderer.setSize(width, height, false);
    }
    
    return needResize;
}

function animateCubes(time) {
    // Animate rotation of all cubes in the scene
    cubes.forEach((cube, index) => {
        const speed = 1 + index * 0.1;
        const rotation = time * speed;
        cube.rotation.x = rotation;
        cube.rotation.y = rotation;
    });
}

function render(time) {
    // Main render loop with animation and responsive canvas handling
    time *= 0.001;
    
    if (resizeRendererToDisplaySize()) {
        const canvas = renderer.domElement;
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
    }
    
    animateCubes(time);
    renderer.render(scene, camera);
    requestAnimationFrame(render);
}

function startRenderLoop() {
    // Begin the animation render loop
    requestAnimationFrame(render);
}

main();