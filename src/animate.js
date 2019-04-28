import * as THREE from 'three';
import GLTFLoader from 'three-gltf-loader';
import * as posenet from '@tensorflow-models/posenet';
import { loadVideo, estimatePose } from './estimate';
import { paintWebcam } from './canvas';

let scene, renderer, camera;
let container;
let clock;
let model = new THREE.Object3D();
let mixers = [];

const createCamera = () => {
  const fov = 35; // fov = Field Of View
  const aspect = container.clientWidth / container.clientHeight; // aspect

  const near = 0.1; // near clipping plane
  const far = 100; // far clipping plane
  camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

  camera.position.set(1, 2, -3);
  camera.lookAt(0, 1, 0);
};

const createLights = () => {
  const ambientLight = new THREE.HemisphereLight(
    0xddeeff, // sky color
    0x202020, // ground color
    5 // intensity
  );

  const mainLight = new THREE.DirectionalLight(0xffffff, 5);
  mainLight.position.set(10, 10, 10);
  const light = new THREE.DirectionalLight(0xffffff, 3.0);

  scene.add(ambientLight, mainLight, light);
};

const createBackground = () => {
  const textureLoader = new THREE.TextureLoader();
  textureLoader.load('surface.jpg', function(texture) {
    scene.background = texture;
  });
};

//code adapted from https://blackthread.io/blog/promisifying-threejs-loaders/ to handle the possibility of asynchronous behavior
const loadModel = () => {
  function promisifyLoader(loader, onProgress) {
    function promiseLoader(url) {
      return new Promise((resolve, reject) => {
        loader.load(url, resolve, onProgress, reject);
      });
    }

    return {
      originalLoader: loader,
      load: promiseLoader
    };
  }

  const loader = new GLTFLoader();
  // Next, we'll convert the GLTFLoader into a GLTFPromiseLoader
  // onProgress is optional and we are not using it here
  const GLTFPromiseLoader = promisifyLoader(loader);

  // Finally, here is simplest possible example of using the promise loader
  // Refer to www.blackthreaddesign.com/blog/promisifying-threejs-loaders/
  // for more detailed examples
  function load() {
    GLTFPromiseLoader.load('Droid.glb')
      .then((gltf, position) => {
        model = gltf.scene.children[0];
        position = new THREE.Vector3(0, 0, 7);
        model.position.copy(position);

        const animation = gltf.animations[3];

        const mixer = new THREE.AnimationMixer(model);
        mixers.push(mixer);

        const action = mixer.clipAction(animation);
        action.play();
        scene.add(model);
      })
      .catch(err => {
        console.error(err);
      });
  }
  load();
};

const setupRenderer = () => {
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.gammaOutput = true;
  renderer.gammaFactor = 2.2;
  renderer.shadowMap.enabled = true;
  container.appendChild(renderer.domElement);
};

const render = () => {
  renderer.render(scene, camera);
};

function init() {
  container = document.getElementById('animation-container');
  scene = new THREE.Scene();
  clock = new THREE.Clock();
  scene.background = new THREE.Color(0xcfcccc);

  createCamera();
  createLights();
  createBackground();
  loadModel();
  setupRenderer();
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', onWindowResize, false);

init();

export async function animationLoop() {
  const net = await posenet.load(0.75);
  const imageElement = await loadVideo();
  net.dispose();
  const poseToReturn = await estimatePose(imageElement, net);
  window.onload = paintWebcam();

  let minPoseConfidence = 0.1;
  let minPartScore = 0.5;
  let scalingFactor = 5000;

  console.log(poseToReturn);
  let maxPartScore = Math.max.apply(
    Math,
    poseToReturn.keypoints.map(elem => elem.score)
  );

  if (poseToReturn.score >= minPoseConfidence) {
    poseToReturn.keypoints.forEach(bodyPart => {
      if (bodyPart.score >= minPartScore) {
        if (bodyPart.score === maxPartScore) {
          let xCoord = bodyPart.position.x / scalingFactor;
          console.log('Show us the X', xCoord);
          model.position.x += xCoord;
        }
      }
    });
  }

  model.position.z += 0.001;

  const delta = clock.getDelta();
  mixers.forEach(mixer => {
    mixer.update(delta);
  });

  requestAnimationFrame(animationLoop);
  render();
}
