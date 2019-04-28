import * as THREE from 'three';
import GLTFLoader from 'three-gltf-loader';
import OrbitControls from 'three-orbitcontrols';
import * as posenet from '@tensorflow-models/posenet';
import { loadVideo, estimatePose } from './estimate';
import { paintWebcam } from './canvas';

let scene, renderer, camera;
let controls;
let container;
let clock;
let env = new THREE.Object3D();
let model = new THREE.Object3D();
let group = new THREE.Group();

let mixers = [];

const createCamera = () => {
  const fov = 35; // fov = Field Of View
  const aspect = container.clientWidth / container.clientHeight; // aspect

  const near = 0.1; // near clipping plane
  const far = 100; // far clipping plane
  camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

  camera.position.set(1, 2, 7);
  camera.lookAt(0, 0, 0);
};

const createControls = () => {
  controls = new OrbitControls(camera, container);
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
  textureLoader.load('background.jpg', function(texture) {
    scene.background = texture;
  });
};

//code adapted from https://blackthread.io/blog/promisifying-threejs-loaders/ to handle the possibility of asynchronous behavior
const loadEnv = () => {
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

  const loaderEnv = new GLTFLoader();
  const loaderModel = new GLTFLoader();

  const GLTFPromiseLoaderEnv = promisifyLoader(loaderEnv);
  const GLTFPromiseLoaderModel = promisifyLoader(loaderModel);

  function load() {
    GLTFPromiseLoaderEnv.load('terrain.glb')
      .then((gltf1, position1, scale1) => {
        env = gltf1.scene.children[0];
        position1 = new THREE.Vector3(0, 0, 0);
        model.position.copy(position1);
        scale1 = new THREE.Vector3(17, 17, 17);
        env.scale.copy(scale1);
        group.add(env);
      })
      .catch(err => {
        console.error(err);
      });
    GLTFPromiseLoaderModel.load('Bird.glb')
      .then((gltf2, position, scale) => {
        model = gltf2.scene.children[0];
        position = new THREE.Vector3(0, 0, 0);
        scale = new THREE.Vector3(0.005, 0.005, 0.005);
        model.position.copy(position);
        model.scale.copy(scale);

        const animation = gltf2.animations[0];

        const mixer = new THREE.AnimationMixer(model);
        mixers.push(mixer);

        const action = mixer.clipAction(animation);
        action.play();

        group.add(model);
      })
      .catch(err => {
        console.error(err);
      });
  }

  load();
  scene.add(group);
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
  createControls();
  createBackground();
  loadEnv();
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
  let scalingFactor = 6000;

  if (poseToReturn.score >= minPoseConfidence) {
    poseToReturn.keypoints.forEach(bodyPart => {
      let xCoord = bodyPart.position.x / scalingFactor;
      let yCoord = bodyPart.position.x / scalingFactor;
      if (bodyPart.score >= minPartScore) {
        if (bodyPart.part.includes('left')) {
          //model movement
          model.position.x -= xCoord;
          model.position.y -= yCoord;
          model.rotation.x -= xCoord;
          model.rotation.y -= yCoord;
        } else if (bodyPart.part.includes('right')) {
          //model movement
          model.position.x += xCoord;
          model.position.y += yCoord;
          model.rotation.x += xCoord;
          model.rotation.y += yCoord;
        }
      }
    });
  }

  const delta = clock.getDelta();
  mixers.forEach(mixer => {
    mixer.update(delta);
  });

  requestAnimationFrame(animationLoop);
  render();
}
