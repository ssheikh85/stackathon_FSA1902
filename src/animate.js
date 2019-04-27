import { loadVideo, estimatePose } from './estimate';
import { paintWebcam } from './canvas';
import * as THREE from 'three';
import GLTFLoader from 'three-gltf-loader';
import * as posenet from '@tensorflow-models/posenet';

let scene, renderer, camera;
let model;
let mixers = [];
let container;
let clock;

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

  scene.add(ambientLight, mainLight);
};

const loadModel = () => {
  const loader = new GLTFLoader();
  const onLoad = (gltf, position) => {
    model = gltf.scene.children[0];
    model.position.copy(position);

    const animation = gltf.animations[3];

    const mixer = new THREE.AnimationMixer(model);
    mixers.push(mixer);

    const action = mixer.clipAction(animation);
    action.play();

    scene.add(model);
  };
  const onProgress = () => {};

  const onError = errorMessage => {
    console.log(errorMessage);
  };

  const position = new THREE.Vector3(0, 0, 4);
  loader.load('Droid.glb', gltf => onLoad(gltf, position), onProgress, onError);
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
const update = () => {
  const delta = clock.getDelta();
  mixers.forEach(mixer => {
    mixer.update(delta);
  });
};
const render = () => {
  renderer.render(scene, camera);
};

const play = () => {
  renderer.setAnimationLoop(() => {
    update();
    render();
  });
};

export function init() {
  container = document.getElementById('animation-container');
  scene = new THREE.Scene();
  clock = new THREE.Clock();
  scene.background = new THREE.Color(0xcfcccc);

  createCamera();
  createLights();
  loadModel();
  setupRenderer();
  play();
}

// class ModelToUpdate {
//   constructor(modelIn) {
//     this.model = modelIn;
//   }
//   updatePosition(x = 0, y = 0) {
//     this.model.position.x = x;
//     this.model.position.y = y;
//   }
// }
// console.log(model);
// const modelToMove = new ModelToUpdate(model);
// console.log(modelToMove);

// export function animationLoop() {
//   const net = await posenet.load(0.75);
//   const imageElement = await loadVideo();
//   net.dispose();
//   const poseToReturn = await estimatePose(imageElement, net);
//   window.onload = paintWebcam();

//   let minPoseConfidence = 0;
//   let minPartCodifence = 0;

//   console.log(poseToReturn);
//   if (poseToReturn.score >= minPoseConfidence) {
//     poseToReturn.keypoints.forEach(bodyPart => {
//       if (bodyPart.score >= minPartCodifence) {
//         let xCoord = bodyPart.position.x * 0.00075;
//         let yCoord = bodyPart.position.y * 0.00075;
//         console.log('Show us the X', xCoord, 'Show us the Y', yCoord);
//         model.position.x += xCoord;
//         model.position.y += yCoord;
//       }
//     });
//   }

//   requestAnimationFrame(animationLoop);
// }

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', onWindowResize, false);
