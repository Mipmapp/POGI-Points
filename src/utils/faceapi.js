// Lazy face-api.js loader — keeps the heavy library out of the initial bundle.
// Models are pulled from the @vladmandic/face-api jsdelivr CDN the first time
// any face flow is opened, then cached by the browser.

let faceapiModule = null;
let modelsLoaded = false;
let modelsLoadingPromise = null;

const MODEL_BASE = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.13/model';

export async function getFaceApi() {
  if (!faceapiModule) {
    faceapiModule = await import('@vladmandic/face-api');
  }
  return faceapiModule;
}

export async function ensureModelsLoaded() {
  if (modelsLoaded) return;
  if (modelsLoadingPromise) return modelsLoadingPromise;
  modelsLoadingPromise = (async () => {
    const fa = await getFaceApi();
    await Promise.all([
      fa.nets.tinyFaceDetector.loadFromUri(MODEL_BASE),
      fa.nets.faceLandmark68TinyNet.loadFromUri(MODEL_BASE),
      fa.nets.faceRecognitionNet.loadFromUri(MODEL_BASE),
    ]);
    modelsLoaded = true;
  })();
  try {
    await modelsLoadingPromise;
  } finally {
    modelsLoadingPromise = null;
  }
}

export function isModelsReady() {
  return modelsLoaded;
}

// Compute a 128-float descriptor (compatible with the SSAAM backend) from a
// <video> or <img> element. Returns null when no face is detected.
export async function detectDescriptor(input) {
  const fa = await getFaceApi();
  await ensureModelsLoaded();
  const detection = await fa
    .detectSingleFace(input, new fa.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
    .withFaceLandmarks(true)
    .withFaceDescriptor();
  if (!detection || !detection.descriptor) return null;
  return Array.from(detection.descriptor);
}

// Euclidean distance between two 128-float descriptors. Lower = more similar.
// face-api.js convention: < 0.6 is typically the same face.
export function descriptorDistance(a, b) {
  if (!a || !b || a.length !== b.length) return Infinity;
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return Math.sqrt(sum);
}

export const FACE_MATCH_THRESHOLD = 0.55;
export const FACE_MATCH_STREAK = 3; // consecutive matches required to accept
