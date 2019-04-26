export function paintWebcam() {
  const canvas = document.getElementById('overlay');
  const video = document.getElementById('video');
  const ctx = canvas.getContext('2d');

  canvas.width = video.width;
  canvas.height = video.height;

  const width = canvas.width;
  const height = canvas.height;

  ctx.scale(-1, 1);
  ctx.translate(-width, 0);
  ctx.fliter = 'blur(4px) opacity(50%)';
  ctx.drawImage(video, 0, 0, width, height);
}
