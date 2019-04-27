import { loadVideo, estimatePose } from './estimate';
import { paintWebcam } from './canvas';

const start = new Date();

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
}
