import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import Stats from 'three/addons/libs/stats.module.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'

// Scene setup
const scene = new THREE.Scene();
scene.add(new THREE.AxesHelper(5));

scene.background = new THREE.Color(0x87ceeb);

// Lighting setup
const light = new THREE.PointLight(0xffffff, 2); // Reduced intensity for a more natural look
light.position.set(0.8, 1.4, 1.0);
scene.add(light);

const ambientLight = new THREE.AmbientLight(0xf1f1f1); // Soft ambient light
scene.add(ambientLight);

// Camera setup
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.set(0.8, 1.4, 1.0);

// Renderer setup
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// OrbitControls for camera interaction
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 1, 0);

// Clock for animation timing
const clock = new THREE.Clock();

// Stats for performance monitoring
const stats = new Stats();
document.body.appendChild(stats.dom);

// Variable to store the AnimationMixer
let mixer;

// Load the FBX model
const fbxLoader = new FBXLoader();
const glbLoader = new GLTFLoader();
const draco = new DRACOLoader();
draco.setDecoderPath('three/addons/libs/draco/')

//Variable for the player
let player;

// Variables for animation mode and movement
let mode = 'base';
let move = 'idle';
let map;
let front = true;
let back = false;
let left = false;
let right = false;

function setupJoystick() {
    const joystickContainer = document.createElement('div');
    joystickContainer.style.position = 'absolute';
    joystickContainer.style.bottom = '20px';
    joystickContainer.style.left = '20px';
    joystickContainer.style.width = '150px';
    joystickContainer.style.height = '150px';
    document.body.appendChild(joystickContainer);

    const joystick = nipplejs.create({
        zone: joystickContainer,
        mode: 'static',
        position: { left: '50%', top: '50%' },
        color: 'white',
    });

    joystick.on('move', (evt, data) => {
        if (data.angle) {
            const direction = data.angle.degree;
            const force = data.force;

            // Calculate movement vector based on joystick direction
            const moveSpeed = 0.5 * force;

            if (direction >= 45 && direction <= 135) {
                // Forward (now moves backward)
                if(back){
                    back = false;
                    front = true;
                    player.rotation.y += Math.PI
                }else if(left){
                    left = false;
                    front = true;
                    player.rotation.y -= Math.PI/2
                }else if(right){
                    right = false;
                    front = true;
                    player.rotation.y += Math.PI/2
                }
                mode = 'rage'
                map.position.z -= Math.cos(map.rotation.y) * moveSpeed;
                map.position.x -= Math.sin(map.rotation.y) * moveSpeed;
            } else if (direction >= 225 && direction <= 315) {
                // Backward (now moves forward)
                if(front){
                    front = false;
                    back = true;
                    player.rotation.y += Math.PI;
                }else if(left){
                    left = false;
                    back = true;
                    player.rotation.y += Math.PI/2;
                }else if (right){
                    right = false;
                    back = true;
                    player.rotation.y -= Math.PI/2;
                }
                map.position.z += Math.cos(map.rotation.y) * moveSpeed;
                map.position.x += Math.sin(map.rotation.y) * moveSpeed;
            }

            if (direction > 135 && direction < 225) {
                // Left (now moves right)
                if(front){
                    front = false;
                    left =  true;
                    player.rotation.y += Math.PI/2;
                }else if(back){
                    back = false;
                    left =  true;
                    player.rotation.y -= Math.PI/2;
                }else if(right){
                    right = false;
                    left = true;
                    player.rotation.y += Math.PI;
                }
                map.position.x -= Math.cos(map.rotation.y) * moveSpeed;
                map.position.z += Math.sin(map.rotation.y) * moveSpeed;
            } else if (direction > 315 || direction < 45) {
                // Right (now moves left)
                if(front){
                    front = false;
                    right = true;
                    player.rotation.y -= Math.PI/2;
                } else if(back){
                    back = false;
                    right = true;
                    player.rotation.y += Math.PI/2;
                } else if(left){
                    left = false;
                    right = true;
                    player.rotation.y += Math.PI;
                }
                map.position.x += Math.cos(map.rotation.y) * moveSpeed;
                map.position.z -= Math.sin(map.rotation.y) * moveSpeed;
            }
        }
    });

    joystick.on('end', () => {
        // Stop movement when joystick is released
    });
}
function loadWorld() {
    glbLoader.setDRACOLoader(draco);
    glbLoader.load('./src/world.glb', function (gltf) {
        map = gltf.scene;
        gltf.scene.scale.set(100, 100, 100);
        gltf.scene.position.y = 26.46;
        scene.add(gltf.scene);
    },
    (xhr) => {
        console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
    }, 
    function (error) {
        console.log(error);
    });
}
function loadModel(callback1, callback2) {
    fbxLoader.load(
        './public/flame_boy/' + mode + '/' + move + '.fbx', // Dynamic file path
        (object) => {
            player = object;
            // Remove the previous model
            scene.children = scene.children.filter(
                (child) => !(child.type === 'Group' && child.animations)
            );

            object.scale.set(0.01, 0.01, 0.01); // Scale the model if needed

            // Adjust position to keep feet on the ground
            const boundingBox = new THREE.Box3().setFromObject(object);
            const modelHeight = boundingBox.max.y - boundingBox.min.y;
            object.position.y = boundingBox.min.y; // Align the bottom of the model with y=0
            scene.add(object);

            // Check for animations and play the first one
            if (object.animations && object.animations.length > 0) {
                mixer = new THREE.AnimationMixer(object);

                // Play the first animation clip
                const action = mixer.clipAction(object.animations[0]);
                action.play();
            } else {
                console.log('No animations found in the FBX file.');
            }

            // Call the callback function if provided
            if (callback1) {
                callback1();
            }
            if(callback2){
                callback2();
            }
        },
        (xhr) => {
            console.log((xhr.loaded / xhr.total) *  100 + '% loaded');
        },
        (error) => {
            console.error('Error loading FBX file:', error);
        }
    );
}
function loadEnemies() {
    fbxLoader.load(
        './public/water_girl/girl.fbx',
        (object) => {

            object.scale.set(0.01, 0.01, 0.01); // Scale the model if needed

            // Adjust position to keep feet on the ground
            const boundingBox = new THREE.Box3().setFromObject(object);
            const modelHeight = boundingBox.max.y - boundingBox.min.y;
            object.rotation.y = Math.PI
            object.position.y = -boundingBox.min.y - 0.98;
            object.position.z = 2 // Align the bottom of the model with y=0
            scene.add(object);

            // Check for animations and play the first one
            if (object.animations && object.animations.length > 0) {
                mixer = new THREE.AnimationMixer(object);

                // Play the first animation clip
                const action = mixer.clipAction(object.animations[0]);
                action.play();
            } else {
                console.log('No animations found in the FBX file.');
            }

            // Call the callback function if provided
            if (callback) {
                callback();
            }
        },
        (xhr) => {
            console.log((xhr.loaded / xhr.total) *  100 + '% loaded');
        },
        (error) => {
            console.error('Error loading FBX file:', error);
        }
    );
}
// Add an event listener for the Enter key
window.addEventListener('keydown', (event) => {
    console.log(event.key);
    if (event.key === 'Enter') {
        // Toggle mode between 'base' and 'rage'
        mode = mode === 'base' ? 'rage' : 'base';
        console.log('Mode changed to:', mode);
        // Reload the model with the new mode and then the world
        loadModel(loadWorld, loadEnemies);
    }

    // Add functionality for spacebar to trigger kick animation
    if (event.key === ' ') {
        move = 'kick';
        loadModel(() => {
            setTimeout(() => {
                move = 'Fight_idle';
                loadModel(() => {
                    setTimeout(() => {
                        move = 'idle';
                        loadModel(loadWorld, loadEnemies);
                    }, 10000);
                });
            }, 1000);
        });
    }

    // Additional actions for spells
    const spellMapping = {
        '1': { move: 'spell1', duration: 6500 },
        '2': { move: 'spell2', duration: 2167 },
        '3': { move: 'spell3', duration: 3333 },
        '4': { move: 'spell4', duration: 2600 },
        '5': { move: 'spell5', duration: 4333 },
        '6': { move: 'spell6', duration: 3250 },
    };

    if (spellMapping[event.key]) {
        move = spellMapping[event.key].move;
        loadModel(() => {
            setTimeout(() => {
                move = 'Fight_idle';
                loadModel(() => {
                    setTimeout(() => {
                        move = 'idle';
                        loadModel(loadWorld, loadEnemies);
                    }, 10000);
                });
            }, spellMapping[event.key].duration);
        });
    }
});

// Handle window resizing
window.addEventListener('resize', onWindowResize(), false);
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    render();
}

// Splash screen functionality
function showSplashScreen() {
    const splash = document.createElement('div');
    splash.style.position = 'absolute';
    splash.style.top = 0;
    splash.style.left = 0;
    splash.style.width = '100vw';
    splash.style.height = '100vh';
    splash.style.backgroundColor = 'black';
    splash.style.color = 'white';
    splash.style.display = 'flex';
    splash.style.alignItems = 'center';
    splash.style.justifyContent = 'center';
    splash.style.fontSize = '2rem';
    splash.style.fontFamily = 'Arial, sans-serif';
    splash.innerHTML = 'Made By Brume in Corporation with ChatGPT';
    splash.style.transition = 'opacity 1s ease-out'; // Add fade transition
    splash.style.opacity = 1; // Start fully visible
    document.body.appendChild(splash);

    // Fade out the splash screen after 3 seconds
    setTimeout(() => {
        splash.style.opacity = 0; // Start fading out
    }, 3000); // Display for 3 seconds

    // Remove the splash screen after the fade-out transition
    setTimeout(() => {
        splash.remove(); // Remove from DOM after fade-out
    }, 4000); // Wait until the fade-out is complete
}

// Display splash screen on load
showSplashScreen();
let ltr = false;
// Animation loop
function animate() {
    requestAnimationFrame(animate);
    addEventListener('keydown', (event)=>{
        // Move Player
        if(event.key === 'ArrowUp'){
            map.position.z -= 0.001;
        }
        if(event.key === 'ArrowRight'){
            player.rotation.y += 0.0001;
            map.rotation.y += 0.0001;
        }
        if(event.key === 'ArrowLeft'){
            player.rotation.y -= 0.0001;
            map.rotation.y -= 0.0001;
        }
    })

    // Update the animation mixer
    if (mixer) {
        const delta = clock.getDelta();
        mixer.update(delta);
    }

    controls.update();
    render();
    stats.update();
}

function render() {
    renderer.render(scene, camera);
}


// Initialize everything
function initializeScene() {
    setupJoystick();
    loadModel(loadWorld, loadEnemies);
    animate();
}

initializeScene();
