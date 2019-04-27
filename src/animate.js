import { loadVideo, estimatePose } from './estimate';
import { paintWebcam } from './canvas';
import * as THREE from 'three';
import GLTFLoader from 'three-gltf-loader';

const start = new Date();

let scene, renderer, camera, stats;
let model, skeleton, mixer, clock;
let crossFadeControls = [];
let idleAction, walkAction, runAction;
let idleWeight, walkWeight, runWeight;
let actions, settings;
let singleStepMode = false;
let sizeOfNextStep = 0;
init();

function init() {
  const container = document.getElementById('animation-container');
  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    1,
    1000
  );
  camera.position.set(1, 2, -3);
  camera.lookAt(0, 1, 0);
  clock = new THREE.Clock();
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xa0a0a0);
  scene.fog = new THREE.Fog(0xa0a0a0, 10, 50);
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444);
  hemiLight.position.set(0, 20, 0);
  scene.add(hemiLight);
  const dirLight = new THREE.DirectionalLight(0xffffff);
  dirLight.position.set(-3, 10, -10);
  dirLight.castShadow = true;
  dirLight.shadow.camera.top = 2;
  dirLight.shadow.camera.bottom = -2;
  dirLight.shadow.camera.left = -2;
  dirLight.shadow.camera.right = 2;
  dirLight.shadow.camera.near = 0.1;
  dirLight.shadow.camera.far = 40;
  scene.add(dirLight);

  const mesh = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(100, 100),
    new THREE.MeshPhongMaterial({ color: 0x999999, depthWrite: false })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;
  scene.add(mesh);
  const loader = new GLTFLoader();
  loader.load('Soldier.glb', function(gltf) {
    model = gltf.scene;
    scene.add(model);
    model.traverse(function(object) {
      if (object.isMesh) object.castShadow = true;
    });
    //
    skeleton = new THREE.SkeletonHelper(model);
    skeleton.visible = false;
    scene.add(skeleton);

    const animations = gltf.animations;
    mixer = new THREE.AnimationMixer(model);
    idleAction = mixer.clipAction(animations[0]);
    walkAction = mixer.clipAction(animations[3]);
    runAction = mixer.clipAction(animations[1]);
    actions = [idleAction, walkAction, runAction];
    animationLoop();
  });
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.gammaOutput = true;
  renderer.gammaFactor = 2.2;
  renderer.shadowMap.enabled = true;
  container.appendChild(renderer.domElement);
  window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

export async function animationLoop() {
  const imageElement = await loadVideo();
  const poseToReturn = await estimatePose(imageElement);
  window.onload = paintWebcam();
  const timestamp = new Date();

  console.log(poseToReturn);
  const progress = timestamp - start;
  if (progress < 100000) {
    window.requestAnimationFrame(animationLoop);
  }
  renderer.render(scene, camera);
}
