import * as posenet from '@tensorflow-models/posenet';

const videoFeed = document.getElementById('video');
const width = videoFeed.width;
const height = videoFeed.height;

// Referenced code from https://github.com/tensorflow/tfjs-models/blob/master/posenet/demos/camera.js
// https://github.com/playgrdstar/posenet_threejs/blob/master/sketch.js for posenet and loading webcam
// Referenced MDN docs on navigator.mediaDevices.getUserMedia and promises
// https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia

async function getVideo() {
  const constraints = {
    audio: true,
    video: { facingMode: 'user', width: width, height: height }
  };
  if (await navigator.mediaDevices.getUserMedia) {
    try {
      let stream = await navigator.mediaDevices.getUserMedia(constraints);
      videoFeed.srcObject = stream;
      const videoPromise = new Promise(resolve => {
        videoFeed.onloadedmetadata = () => {
          resolve(videoFeed);
        };
      });
      return videoPromise;
    } catch (error) {
      console.error(error);
    }
  }
}

export async function loadVideo() {
  const video = await getVideo();
  video.play();
  return video;
}

export async function estimatePose(anImage) {
  const imageScaleFactor = 0.5;
  const flipHorizontal = true;
  const outputStride = 32;

  const net = await posenet.load();

  const pose = await net.estimateSinglePose(
    anImage,
    imageScaleFactor,
    flipHorizontal,
    outputStride
  );

  return pose;
}

