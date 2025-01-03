import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import Stats from 'three/addons/libs/stats.module.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

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

// Variables for animation mode and movement
let mode = 'base';
let move = 'idle';

// Flag to track if the world has been loaded
let worldLoaded = false;

glbLoader.load('./src/field.glb', function (gltf) {
    if (!worldLoaded) {
        scene.add(gltf.scene);
        worldLoaded = true;
    }
}, undefined, function (error) {
    console.log(error);
});

// Load model and animation once
function loadModel() {
    const animationFilePath = './public/flame_boy/' + mode + '/' + move + '.fbx'; // Dynamic file path

    fbxLoader.load(
        animationFilePath, 
        (object) => {
            // Remove previous models and dispose of their resources
            scene.children.forEach(child => {
                if (child.type === 'Group' && child.animations) {
                    child.traverse((childObj) => {
                        if (childObj instanceof THREE.Mesh) {
                            childObj.geometry.dispose();
                            if (childObj.material instanceof THREE.Material) {
                                childObj.material.dispose();
                            }
                        }
                    });
                    scene.remove(child);
                }
            });

            object.scale.set(0.01, 0.01, 0.01); // Scale the model if needed

            // Adjust position to keep feet on the ground
            const boundingBox = new THREE.Box3().setFromObject(object);
            const modelHeight = boundingBox.max.y - boundingBox.min.y;
            object.position.y = -boundingBox.min.y; // Align the bottom of the model with y=0

            scene.add(object);

            // Set up animations
            if (object.animations && object.animations.length > 0) {
                mixer = new THREE.AnimationMixer(object);
                
                // Play the current move animation
                const action = mixer.clipAction(object.animations[0]);
                action.play();
            } else {
                console.log('No animations found in the FBX file.');
            }
        },
        (xhr) => {
            console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
        },
        (error) => {
            console.error('Error loading FBX file:', error);
            // Show a friendly error message to the user
            alert('Failed to load the model. Please try again later.');
        }
    );
}

// Splash screen functionality (show first)
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
    splash.style.fontFamily = '"Creepster", sans-serif'; // Apply Creepster font
    splash.style.transition = 'opacity 1s ease-out'; // Add fade transition
    splash.style.opacity = 1; // Start fully visible
    splash.innerHTML = 'Made By Brume in Corporation with ChatGPT';
    document.body.appendChild(splash);

    // Fade out the splash screen after 3 seconds
    setTimeout(() => {
        splash.style.opacity = 0; // Start fading out
    }, 3000); // Display for 3 seconds

    // Remove the splash screen after the fade-out transition
    setTimeout(() => {
        splash.remove(); // Remove from DOM after fade-out
        showHomeScreen(); // After the splash, show the home screen
    }, 4000); // Wait until the fade-out is complete
}

// Home screen functionality
function showHomeScreen() {
    // Create the home screen overlay
    const homeScreen = document.createElement('div');
    homeScreen.style.position = 'absolute';
    homeScreen.style.top = 0;
    homeScreen.style.left = 0;
    homeScreen.style.width = '100vw';
    homeScreen.style.height = '100vh';
    homeScreen.style.backgroundColor = 'black';
    homeScreen.style.color = 'white';
    homeScreen.style.display = 'flex';
    homeScreen.style.flexDirection = 'column';
    homeScreen.style.alignItems = 'center';
    homeScreen.style.justifyContent = 'center';
    homeScreen.style.fontFamily = '"Creepster", sans-serif'; // Apply Creepster font

    // Add title text
    const title = document.createElement('h1');
    title.innerHTML = 'Welcome to the Game';
    homeScreen.appendChild(title);

    // Add the "Play" button
    const playButton = document.createElement('button');
    playButton.innerHTML = 'Play';
    playButton.style.padding = '15px 30px';
    playButton.style.fontSize = '1.5rem';
    playButton.style.cursor = 'pointer';
    playButton.style.backgroundColor = '#ff9900';
    playButton.style.border = 'none';
    playButton.style.color = 'white';
    playButton.style.borderRadius = '10px';
    playButton.style.marginTop = '20px';
    homeScreen.appendChild(playButton);

    // Append the home screen to the body
    document.body.appendChild(homeScreen);

    // Event listener to start the game
    playButton.addEventListener('click', () => {
        homeScreen.style.opacity = 0; // Fade out the home screen
        setTimeout(() => {
            homeScreen.remove(); // Remove the home screen after fading out
            startGame(); // Start the game
        }, 1000); // Wait for fade-out
    });

    // Add mobile-friendly action buttons
    addMobileButtons();
}

// Add mobile-friendly buttons for key actions
function addMobileButtons() {
    const buttonContainer = document.createElement('div');
    buttonContainer.style.position = 'absolute';
    buttonContainer.style.bottom = '20px';
    buttonContainer.style.left = '50%';
    buttonContainer.style.transform = 'translateX(-50%)';
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'center';
    buttonContainer.style.alignItems = 'center';

    // Button for "Enter" key (Switch mode)
    const enterButton = createButton('Mode', () => {
        mode = mode === 'base' ? 'rage' : 'base';
        console.log('Mode changed to:', mode);
        loadModel();
    });

    // Button for "Space" key (Kick action)
    const spaceButton = createButton('Kick', () => {
        move = 'kick';
        loadModel();
        setTimeout(() => {
            move = 'fight_idle';
            loadModel();
            setTimeout(() => {
                move = 'idle';
                loadModel();
            }, 10000);
        }, 1000);
    });

    // Buttons for spell keys (1-6)
    const spellButtons = ['1', '2', '3', '4', '5', '6'].map((key) =>
        createButton(`Spell ${key}`, () => {
            move = `spell${key}`;
            loadModel();
            const spellDuration = [6500, 2167, 3333, 2600, 4333, 3250][key - 1];
            setTimeout(() => {
                move = 'fight_idle';
                loadModel();
                setTimeout(() => {
                    move = 'idle';
                    loadModel();
                }, 10000);
            }, spellDuration);
        })
    );

    // Add the buttons to the container
    buttonContainer.appendChild(enterButton);
    buttonContainer.appendChild(spaceButton);
    spellButtons.forEach(button => buttonContainer.appendChild(button));

    document.body.appendChild(buttonContainer);
}

// Helper function to create a button
function createButton(text, onClick) {
    const button = document.createElement('button');
    button.innerHTML = text;
    button.style.margin = '5px';
    button.style.padding = '10px 20px';
    button.style.fontSize = '1rem';
    button.style.cursor = 'pointer';
    button.style.backgroundColor = '#ff9900';
    button.style.border = 'none';
    button.style.color = 'white';
    button.style.borderRadius = '10px';
    button.addEventListener('click', onClick);
    return button;
}

// Start the game
function startGame() {
    loadModel(); // Load the model and world
    animate(); // Start the animation loop
}

// Display the splash screen initially
showSplashScreen();

// Animation loop
function animate() {
    requestAnimationFrame(animate);

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
