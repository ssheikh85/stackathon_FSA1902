import { scene, camera, renderer, cube } from './environment';
import { loadVideo, estimatePose } from './estimate';
import { paintWebcam } from './canvas';

const start = new Date();
async function animationLoop() {
  const imageElement = await loadVideo();
  const poseToReturn = await estimatePose(imageElement);
  window.onload = paintWebcam();
  const timestamp = new Date();

  console.log(poseToReturn);
  const progress = timestamp - start;
  console.log(progress);
  if (progress < 100000) {
    window.requestAnimationFrame(animationLoop);
  }
  cube.rotation.x += 0.1;
  cube.rotation.y += 0.1;
  renderer.render(scene, camera);
}

animationLoop();
