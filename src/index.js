import { loadVideo, estimatePose } from './estimate.js';

async function performEstimation() {
  const imageElement = await loadVideo();
  const poseToReturn = await estimatePose(imageElement);
  console.log(poseToReturn);
  return poseToReturn;
}

performEstimation();
