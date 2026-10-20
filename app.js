/**
 * NV. FACE LAB — original independent visualization.
 * MediaPipe dependencies are version pinned and requested only after user consent.
 * No images/video or landmarks are persisted, uploaded, logged, or stored by this code.
 */
import { calculateInferenceGap, getCameraConstraints } from "./performance.mjs";

const MP_VERSION = "1.1.1";
const MP_IMPORT = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VERSION}/vision_bundle.mjs`;
const MP_WASM = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VERSION}/wasm`;
const FACE_MODEL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
const HAND_MODEL = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

const $ = id => document.getElementById(id);
const dom = {
  stage: $("stage"), video: $("camera"), canvas: $("vision-canvas"),
  consent: $("consent"), start: $("start-btn"), stop: $("stop-btn"),
  startLabel: $("start-label"), liveText: $("live-text"), note: $("stage-note"),
  noteTitle: $("note-title"), noteDescription: $("note-description"),
  scanText: $("scan-text"), stageFps: $("stage-fps"), coords: $("stage-coordinate"),
  error: $("error-message"), trackingLed: $("tracking-led"), trackingState: $("tracking-state"),
  trackingDetail: $("tracking-detail"), faceCount: $("face-count"), handCount: $("hand-count"),
  gestureName: $("gesture-name"), gestureDetail: $("gesture-detail"),
  fingersValue: $("fingers-value"), meterFill: $("meter-fill"),
  ghost: $("ghost-toggle"), mesh: $("mesh-toggle"), motion: $("motion-toggle"),
  announcements: $("announcements")
};
const ctx = dom.canvas.getContext("2d", { alpha: true });
const prefersLessMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches || false;
dom.motion.checked = prefersLessMotion;

const colors = ["#4de0ff", "#4d8dff", "#bd9cff", "#66efc8", "#f5ca86", "#4de0ff"];
const modes = ["ZERO / PULSE", "ONE / ORBIT", "TWO / PRISM", "THREE / FLUX", "FOUR / BLOOM", "FIVE / SUPERNOVA"];
const state = {
  running: false, loading: false, stream: null, generation: 0, modelPromise: null,
  vision: null, faceTask: null, handTask: null, faceLandmarks: [], handLandmarks: [],
  faceConnections: [], faceOval: [], leftEye: [], rightEye: [], lips: [],
  handCount: 0, stableFingers: null, proposedFingers: null, proposedFrames: 0,
  lastVideoTime: -1, lastInference: 0, inferenceGapMs: 50, fps: 0, lastFpsAt: 0,
  fpsFrames: 0, color: colors[0], motionReduced: prefersLessMotion, meshEnabled: true,
  viewportW: 800, viewportH: 450, particles: [], ambience: [], frameId: 0, lastDrawAt: 0
};

function setStatus(mode, main, detail, scan) {
  dom.stage.dataset.mode = mode;
  dom.liveText.textContent = mode === "live" ? "CAMERA ACTIVE" : mode === "loading" ? "INITIALIZING VISION" : "SYSTEM STANDBY";
  dom.trackingState.textContent = main;
  dom.trackingDetail.textContent = detail;
  dom.scanText.textContent = scan;
  dom.trackingLed.classList.toggle("active", mode === "live");
}
function announce(text) { dom.announcements.textContent = text; }
function showError(text) {
  dom.error.hidden = false;
  dom.error.textContent = text;
  announce(text);
}
function hideError() { dom.error.hidden = true; dom.error.textContent = ""; }
function setLoading(isLoading) {
  state.loading = isLoading;
  dom.start.disabled = isLoading || state.running || !dom.consent.checked;
  dom.stop.disabled = !isLoading && !state.running;
  dom.startLabel.textContent = isLoading ? "Initializing…" : "Start experience";
}
function resetReadouts() {
  state.faceLandmarks = []; state.handLandmarks = []; state.handCount = 0;
  state.stableFingers = null; state.proposedFingers = null; state.proposedFrames = 0;
  state.lastVideoTime = -1; state.lastInference = 0; state.inferenceGapMs = 50; state.fps = 0;
  state.fpsFrames = 0; state.lastFpsAt = 0; state.particles.length = 0;
  state.color = colors[0];
  dom.faceCount.textContent = "—"; dom.handCount.textContent = "—";
  dom.gestureName.textContent = "AWAITING INPUT";
  dom.gestureDetail.textContent = "Show your hand to shift the scene.";
  dom.fingersValue.textContent = "— / 5"; dom.meterFill.style.width = "0%";
  dom.stageFps.textContent = "-- TRACK/S"; dom.coords.textContent = "X — / Y —";
}

async function initializeModels() {
  if (state.modelPromise) return state.modelPromise;
  state.modelPromise = (async () => {
    const vision = await import(MP_IMPORT);
    const fileset = await vision.FilesetResolver.forVisionTasks(MP_WASM);
    const make = async (Task, options) => {
      try {
        return await Task.createFromOptions(fileset, { ...options, baseOptions: { ...options.baseOptions, delegate: "GPU" } });
      } catch (gpuError) {
        // Safari/older devices may not support the GPU delegate.
        return await Task.createFromOptions(fileset, { ...options, baseOptions: { ...options.baseOptions, delegate: "CPU" } });
      }
    };
    const face = await make(vision.FaceLandmarker, {
      baseOptions: { modelAssetPath: FACE_MODEL }, runningMode: "VIDEO", numFaces: 1,
      minFaceDetectionConfidence: 0.5, minFacePresenceConfidence: 0.5, minTrackingConfidence: 0.5,
      outputFaceBlendshapes: false, outputFacialTransformationMatrixes: false
    });
    let hand;
    try {
      hand = await make(vision.HandLandmarker, {
        baseOptions: { modelAssetPath: HAND_MODEL }, runningMode: "VIDEO", numHands: 1,
        minHandDetectionConfidence: 0.5, minHandPresenceConfidence: 0.5, minTrackingConfidence: 0.5
      });
    } catch (error) {
      face.close(); throw error;
    }
    state.vision = vision;
    state.faceTask = face;
    state.handTask = hand;
    state.faceConnections = vision.FaceLandmarker.FACE_LANDMARKS_TESSELATION || [];
    state.faceOval = vision.FaceLandmarker.FACE_LANDMARKS_FACE_OVAL || [];
    state.leftEye = vision.FaceLandmarker.FACE_LANDMARKS_LEFT_EYE || [];
    state.rightEye = vision.FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE || [];
    state.lips = vision.FaceLandmarker.FACE_LANDMARKS_LIPS || [];
  })();
  try { await state.modelPromise; }
  catch (error) { state.modelPromise = null; throw error; }
}

function cameraErrorMessage(error) {
  switch (error?.name) {
    case "NotAllowedError": case "PermissionDeniedError":
      return "Camera permission was declined or blocked. Allow camera access in your browser's site permissions and try again.";
    case "NotFoundError": case "DevicesNotFoundError":
      return "No webcam was found. Connect or enable a camera and try again.";
    case "NotReadableError": case "TrackStartError":
      return "Your webcam is currently in use or unavailable. Close other camera apps and try again.";
    case "OverconstrainedError":
      return "Your camera does not support the requested video settings.";
    default: return "The camera could not start. Verify camera permission, HTTPS, and browser compatibility, then try again.";
  }
}

async function beginVideoPlayback() {
  // Some mobile browsers can leave video.play() unresolved after device changes.
  // Always cancel the timeout even if video.play() rejects first.
  let timeout;
  try {
    await Promise.race([
      dom.video.play(),
      new Promise((_, reject) => {
        timeout = setTimeout(() => reject(new Error("VideoStartTimeout")), 15000);
      })
    ]);
  } finally {
    clearTimeout(timeout);
  }
}

async function startCamera() {
  if (state.loading || state.running || !dom.consent.checked) return;
  if (!ctx) { showError("Canvas rendering is not available in this browser. Try an updated Chrome, Edge, Firefox or Safari."); return; }
  hideError();
  if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
    showError("Camera access requires HTTPS or localhost in a supported browser. Do not open the HTML directly using file://. See README for local preview steps.");
    return;
  }
  const generation = ++state.generation;
  resetReadouts();
  setStatus("loading", "STARTING…", "PREPARING PRIVATE SESSION", "AWAITING CAMERA PERMISSION");
  dom.note.classList.remove("is-hidden");
  dom.noteTitle.textContent = "STARTING YOUR EXPERIENCE";
  dom.noteDescription.textContent = "Allow camera access; AI models are loading for local processing.";
  setLoading(true);
  try {
    // Request webcam only as a direct result of the user's Start action.
    const stream = await navigator.mediaDevices.getUserMedia(getCameraConstraints({
      hardwareConcurrency: navigator.hardwareConcurrency,
      saveData: navigator.connection?.saveData === true
    }));
    if (generation !== state.generation) { stream.getTracks().forEach(t => t.stop()); return; }
    state.stream = stream;
    dom.video.srcObject = stream;
    stream.getVideoTracks()[0]?.addEventListener("ended", () => {
      if (generation === state.generation) stopCamera("The camera was disconnected or its permission changed.");
    }, { once: true });
    await beginVideoPlayback();
    dom.scanText.textContent = "INITIALIZING AI MODELS";
    await initializeModels();
    if (generation !== state.generation) return;
    state.running = true;
    state.lastVideoTime = -1;
    setStatus("live", "SCANNING", "FINDING FACIAL LANDMARKS", "SEARCHING FOR FACE");
    dom.note.classList.add("is-hidden");
    announce("Camera is active. Vision tracking is running locally.");
    setLoading(false);
    dom.start.disabled = true;
    dom.stop.disabled = false;
  } catch (error) {
    if (generation !== state.generation) return;
    const cameraErrNames = new Set(["NotAllowedError", "PermissionDeniedError", "NotFoundError", "DevicesNotFoundError", "NotReadableError", "TrackStartError", "OverconstrainedError"]);
    const message = cameraErrNames.has(error?.name)
      ? cameraErrorMessage(error)
      : error?.message === "VideoStartTimeout"
        ? "The camera did not become ready in time. It has been stopped. Check whether another application is using it, then try again."
        : "Vision engine could not initialize. Check your internet connection (required to load MediaPipe and its models) and try again.";
    stopCamera();
    showError(message);
    // Developer can inspect the original error locally, but avoid exposing private frame data.
    console.warn("NV Face Lab initialization failed:", error?.name || "Error");
  }
}
function stopCamera(message) {
  state.generation++;
  state.running = false;
  state.loading = false;
  if (state.stream) { state.stream.getTracks().forEach(track => track.stop()); state.stream = null; }
  if (dom.video.srcObject) { dom.video.pause(); dom.video.srcObject = null; }
  resetReadouts();
  setLoading(false);
  setStatus("idle", "OFFLINE", "READY WHEN YOU ARE", "AWAITING CAMERA INPUT");
  dom.note.classList.remove("is-hidden");
  dom.noteTitle.textContent = "THE FUTURE IS LOOKING AT YOU.";
  dom.noteDescription.textContent = "Enable your camera to turn this abstract sculpture into a responsive face mesh.";
  if (message) announce(message);
}

const handConnections = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]];
function dist(a,b) { if (!a || !b) return 0; return Math.hypot(a.x-b.x, a.y-b.y, (a.z-b.z)*.38); }
function fingerCount(hand) {
  if (!hand || hand.length < 21) return null;
  let count = 0;
  for (const [tip,pip,mcp] of [[8,6,5],[12,10,9],[16,14,13],[20,18,17]]) {
    if (dist(hand[tip],hand[mcp]) > dist(hand[pip],hand[mcp])*1.52) count++;
  }
  // Thumb threshold is a heuristic; camera angle and partial occlusion affect results.
  if (dist(hand[4],hand[5]) > dist(hand[3],hand[5])*1.22 && dist(hand[4],hand[17]) > dist(hand[3],hand[17])*1.12) count++;
  return Math.max(0,Math.min(5,count));
}
function setGesture(next) {
  if (next === state.stableFingers) return;
  state.stableFingers = next;
  if (next === null) {
    state.color = colors[0]; dom.gestureName.textContent = "NO HAND DETECTED";
    dom.gestureDetail.textContent = "Raise one hand to interact.";
    dom.fingersValue.textContent = "— / 5"; dom.meterFill.style.width = "0%";
  } else {
    state.color = colors[next];
    dom.gestureName.textContent = modes[next];
    dom.gestureDetail.textContent = next === 5 ? "Open hand → particle burst activated." : `${next} finger${next===1?"":"s"} visible · scene color changed`;
    dom.fingersValue.textContent = `${next} / 5`;
    dom.meterFill.style.width = `${next*20}%`;
    if (next === 5) spawnBurst();
  }
  dom.stage.style.setProperty("--accent",state.color);
}
function infer(frameTime) {
  if (!state.running || !state.faceTask || !state.handTask || dom.video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
  if (dom.video.currentTime === state.lastVideoTime || frameTime - state.lastInference < state.inferenceGapMs) return;
  state.lastVideoTime = dom.video.currentTime;
  state.lastInference = frameTime;
  const inferenceStartedAt = performance.now();
  try {
    const faceResult = state.faceTask.detectForVideo(dom.video,frameTime);
    const handResult = state.handTask.detectForVideo(dom.video,frameTime);
    state.faceLandmarks = faceResult.faceLandmarks?.[0] || [];
    state.handLandmarks = handResult.landmarks?.[0] || [];
    state.handCount = handResult.landmarks?.length || 0;
    dom.faceCount.textContent = String(state.faceLandmarks.length);
    dom.handCount.textContent = String(state.handCount);
    if (state.faceLandmarks.length) {
      dom.trackingState.textContent = "FACE LOCKED";
      dom.trackingDetail.textContent = "LIVE LANDMARK TRACKING";
      dom.scanText.textContent = "FACE MESH ACTIVE";
      const middle = state.faceLandmarks[1] || state.faceLandmarks[0];
      dom.coords.textContent = `X ${Math.round(middle.x*100).toString().padStart(2,'0')} / Y ${Math.round(middle.y*100).toString().padStart(2,'0')}`;
    } else {
      dom.trackingState.textContent = "SCANNING";
      dom.trackingDetail.textContent = "FINDING FACIAL LANDMARKS";
      dom.scanText.textContent = "SEARCHING FOR FACE";
      dom.coords.textContent = "X — / Y —";
    }
    const next = state.handCount ? fingerCount(state.handLandmarks) : null;
    if (next === state.proposedFingers) state.proposedFrames++;
    else { state.proposedFingers = next; state.proposedFrames = 1; }
    if (state.proposedFrames >= 3) setGesture(next);
    state.fpsFrames++;
    if (!state.lastFpsAt) state.lastFpsAt = frameTime;
    if (frameTime - state.lastFpsAt > 950) {
      state.fps = Math.round(state.fpsFrames*1000/(frameTime-state.lastFpsAt));
      state.fpsFrames = 0; state.lastFpsAt = frameTime;
      dom.stageFps.textContent = `${state.fps} TRACK/S`;
    }
  } catch (error) {
    // Avoid endlessly using a broken media stream; leave a clear recoverable state.
    stopCamera();
    showError("Video tracking encountered an error. The camera has been stopped; you can try again.");
    console.warn("NV Face Lab tracking error:", error?.name || "Error");
  } finally {
    // Inference is synchronous. Reduce the inference rate on slower hardware to
    // preserve room for UI rendering rather than piling up camera frame work.
    if (state.running) {
      state.inferenceGapMs = calculateInferenceGap(performance.now() - inferenceStartedAt, state.inferenceGapMs);
    }
  }
}

function resizeCanvas() {
  const bounds = dom.stage.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.max(1,Math.round(bounds.width));
  const h = Math.max(1,Math.round(bounds.height));
  if (w===state.viewportW && h===state.viewportH && dom.canvas.width===Math.round(w*dpr)) return;
  state.viewportW=w; state.viewportH=h;
  dom.canvas.width = Math.round(w*dpr); dom.canvas.height = Math.round(h*dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);
  state.ambience = Array.from({length:Math.max(30,Math.round(w*h/11000))},(_,i)=>({
    x:((i*73.39+17)%101)/101*w, y:((i*42.23+13)%97)/97*h,
    radius:.45+(i%3)*.3, phase:(i*1.77)%6.28
  }));
}
function projected(lm) {
  const w = state.viewportW, h = state.viewportH;
  const sourceW = dom.video.videoWidth || w, sourceH = dom.video.videoHeight || h;
  const scale = Math.max(w/sourceW,h/sourceH);
  const renderW = sourceW*scale, renderH = sourceH*scale;
  const offsetX = (w-renderW)/2, offsetY = (h-renderH)/2;
  return {x:w-(lm.x*renderW+offsetX),y:lm.y*renderH+offsetY};
}
function drawEnvironment(ms) {
  const w = state.viewportW, h = state.viewportH;
  const t=state.motionReduced?0:ms*.001;
  ctx.save();
  for (let i=0;i<state.ambience.length;i++){
    const p=state.ambience[i];
    ctx.fillStyle=`rgba(77,224,255,${.13+.12*Math.sin(t*.85+p.phase)})`;
    const xx=p.x+(state.motionReduced?0:Math.sin(t*.35+p.phase)*6);
    const yy=p.y+(state.motionReduced?0:Math.cos(t*.45+p.phase)*8);
    ctx.beginPath();ctx.arc(xx,yy,p.radius,0,Math.PI*2);ctx.fill();
  }
  ctx.strokeStyle="rgba(77,224,255,.08)";ctx.lineWidth=1;
  ctx.beginPath();ctx.arc(w*.5,h*.47,Math.min(w,h)*.32,0,Math.PI*2);ctx.stroke();
  ctx.strokeStyle="rgba(77,224,255,.2)";
  const radius = Math.min(w,h)*.32;
  for(let i=0;i<4;i++){
    const a=t*.15+i*Math.PI/2;
    ctx.beginPath();ctx.arc(w*.5,h*.47,radius,a,a+.17);ctx.stroke();
  }
  if (!state.motionReduced){
    const sy=((ms*.038)%(h+160))-80;
    const gr=ctx.createLinearGradient(0,sy-60,0,sy+20);
    gr.addColorStop(0,"rgba(77,224,255,0)");gr.addColorStop(.9,"rgba(77,224,255,.04)");gr.addColorStop(1,"rgba(77,224,255,.18)");
    ctx.fillStyle=gr;ctx.fillRect(0,sy-60,w,80);
    ctx.fillStyle="rgba(77,224,255,.2)";ctx.fillRect(0,sy+19,w,1);
  }
  ctx.restore();
}
function drawIdle(ms) {
  const w=state.viewportW,h=state.viewportH;
  const t=state.motionReduced?0:ms*.001;
  const cx=w*.5,cy=h*.43, rx=Math.min(w*.155,h*.245), ry=Math.min(h*.31,w*.19);
  ctx.save();ctx.translate(cx,cy);
  const sway=Math.sin(t*.5)*.12;
  const rings=9,slices=29;
  const point=(r,a)=>{
    const elevation=(r/rings)*2-1;
    const lat=Math.asin(Math.max(-1,Math.min(1,elevation)));
    const widthScale=Math.cos(lat)*(.88+.12*Math.cos(lat));
    const theta=a/slices*Math.PI*2;
    const depth=Math.sin(theta+sway)*.27;
    const x=Math.cos(theta+sway)*rx*widthScale*(1+depth*.08);
    const y=elevation*ry*(1+(elevation>0?.07:0));
    return [x+depth*rx*.14,y+(Math.cos(theta+sway)*Math.cos(lat))*4];
  };
  ctx.strokeStyle="rgba(77,224,255,.23)";ctx.lineWidth=.7;
  for(let r=1;r<rings;r++){
    ctx.beginPath();for(let a=0;a<=slices;a++){const [x,y]=point(r,a);if(a===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.stroke();
  }
  for(let a=0;a<slices;a+=2){ctx.beginPath();for(let r=0;r<=rings;r++){const [x,y]=point(r,a);if(r===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.stroke();}
  ctx.strokeStyle="rgba(77,224,255,.51)";ctx.lineWidth=1.25;ctx.shadowColor="rgba(77,224,255,.32)";ctx.shadowBlur=11;
  ctx.beginPath();ctx.ellipse(0,0,rx*.89,ry*.99,sway*.4,0,Math.PI*2);ctx.stroke();
  ctx.shadowBlur=0;
  const features=[[-.34,-.14,.27,.055],[.34,-.14,.27,.055],[0,.42,.26,.085]];
  for(let i=0;i<features.length;i++){
    const [x,y,rad,scaleY]=features[i];ctx.beginPath();ctx.ellipse(x*rx,y*ry,rad*rx,Math.max(3,scaleY*ry),0,0,Math.PI*2);ctx.stroke();
  }
  ctx.beginPath();ctx.moveTo(0,-ry*.08);ctx.lineTo(-rx*.08,ry*.24);ctx.lineTo(rx*.08,ry*.24);ctx.stroke();
  for(let r=2;r<rings;r+=2){for(let a=0;a<slices;a+=3){const [x,y]=point(r,a);const glow=.34+.32*Math.sin(t*1.1+r*.66+a*.54);ctx.fillStyle=`rgba(127,233,255,${glow})`;ctx.beginPath();ctx.arc(x,y,1.25,0,Math.PI*2);ctx.fill();}}
  ctx.restore();
}
function connectPoints(landmarks,lines,color,width=1,step=1) {
  if(!landmarks?.length) return;
  ctx.save();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();
  for(let i=0;i<lines.length;i+=step){const link=lines[i];const a=landmarks[link.start??link[0]], b=landmarks[link.end??link[1]];if(!a||!b)continue;const p=projected(a),q=projected(b);ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);}
  ctx.stroke();ctx.restore();
}
function renderLandmarks(ms) {
  const face=state.faceLandmarks,hand=state.handLandmarks;
  if (!face.length && !hand.length) return;
  const color=state.color;
  if(face.length){
    if(state.meshEnabled) connectPoints(face,state.faceConnections,"rgba(106,221,255,.27)",.65,2);
    ctx.shadowBlur=9;ctx.shadowColor=color;
    connectPoints(face,state.faceOval,color,1.65);
    connectPoints(face,state.leftEye,"rgba(211,247,255,.94)",1.15);
    connectPoints(face,state.rightEye,"rgba(211,247,255,.94)",1.15);
    connectPoints(face,state.lips,"rgba(142,227,255,.66)",.8,2);
    ctx.shadowBlur=0;
    ctx.fillStyle="rgba(190,243,255,.69)";
    for(let i=0;i<face.length;i+=4){const p=projected(face[i]);ctx.beginPath();ctx.arc(p.x,p.y,1.0,0,Math.PI*2);ctx.fill();}
    const p=projected(face[1]||face[0]);
    ctx.save();ctx.strokeStyle="rgba(77,224,255,.4)";ctx.lineWidth=.8;
    const r=20+(state.motionReduced?0:Math.sin(ms*.002)*4);
    ctx.beginPath();ctx.moveTo(p.x-r,p.y);ctx.lineTo(p.x-9,p.y);ctx.moveTo(p.x+9,p.y);ctx.lineTo(p.x+r,p.y);ctx.moveTo(p.x,p.y-r);ctx.lineTo(p.x,p.y-9);ctx.moveTo(p.x,p.y+9);ctx.lineTo(p.x,p.y+r);ctx.stroke();ctx.restore();
  }
  if(hand.length){
    connectPoints(hand,handConnections,color,2.1);
    ctx.save();ctx.fillStyle="#dcfaff";ctx.shadowColor=color;ctx.shadowBlur=11;
    for(let i=0;i<hand.length;i++){const p=projected(hand[i]);ctx.beginPath();ctx.arc(p.x,p.y,[4,8,12,16,20].includes(i)?3.3:2,0,Math.PI*2);ctx.fill();}
    ctx.restore();
  }
}
function spawnBurst() {
  if(state.motionReduced) return;
  const src=state.faceLandmarks?.[1] ? projected(state.faceLandmarks[1]) : {x:state.viewportW*.5,y:state.viewportH*.47};
  state.particles=[];
  for(let i=0;i<100;i++){
    const ang=(i*2.399963229728653)%6.283;
    const sp=1.8+(i%11)*.42;
    state.particles.push({x:src.x+(i%9-4)*2,y:src.y+(i%5-2)*2,vx:Math.cos(ang)*sp,vy:Math.sin(ang)*sp,life:1,size:1+(i%4)*.65});
  }
}
function drawBurst(){
  if(!state.particles.length)return;
  ctx.save();ctx.shadowColor=state.color;ctx.shadowBlur=10;
  for(const p of state.particles){
    p.x+=p.vx;p.y+=p.vy;p.vx*=.985;p.vy*=.985;p.life-=.012;
    ctx.globalAlpha=Math.max(0,p.life);ctx.fillStyle=state.color;
    ctx.fillRect(p.x,p.y,p.size,p.size);
  }
  ctx.restore();state.particles=state.particles.filter(p=>p.life>0);
}
function draw(ms){
  if(!ctx)return;
  resizeCanvas();const {viewportW:w,viewportH:h}=state;
  ctx.clearRect(0,0,w,h);
  drawEnvironment(ms);
  if(state.running && (state.faceLandmarks.length||state.handLandmarks.length))renderLandmarks(ms);
  else if(!state.running)drawIdle(ms);
  drawBurst();
}
function tick(time){
  // Video inference stays on the main thread in Phase 1; it is adaptively
  // throttled. Workers are a separate tested Phase 2 migration.
  if (!document.hidden) {
    if (state.running) infer(time);
    const drawInterval = state.motionReduced ? 90 : 28;
    if (time - state.lastDrawAt >= drawInterval) { draw(time); state.lastDrawAt = time; }
  }
  state.frameId=requestAnimationFrame(tick);
}

// UI and privacy lifecycle.
dom.consent.addEventListener("change",()=>{dom.start.disabled=!dom.consent.checked || state.running || state.loading;if(!dom.consent.checked&&(state.running||state.loading))stopCamera("Camera stopped because consent was withdrawn.");});
dom.start.addEventListener("click",startCamera);
dom.stop.addEventListener("click",()=>stopCamera("Camera stopped. The session has ended."));
dom.ghost.addEventListener("change",()=>dom.stage.classList.toggle("no-ghost",!dom.ghost.checked));
dom.mesh.addEventListener("change",()=>{state.meshEnabled=dom.mesh.checked;});
dom.motion.addEventListener("change",()=>{state.motionReduced=dom.motion.checked;document.body.classList.toggle("reduce-motion",dom.motion.checked);if(dom.motion.checked)state.particles.length=0;});
if(prefersLessMotion) document.body.classList.add("reduce-motion");
document.addEventListener("visibilitychange",()=>{if(document.hidden && (state.running||state.loading))stopCamera("Camera automatically stopped when the tab was hidden.");});
window.addEventListener("pagehide",()=>stopCamera());
if (ctx) {
  window.addEventListener("resize",resizeCanvas,{passive:true});
  if (window.ResizeObserver) new ResizeObserver(resizeCanvas).observe(dom.stage);
  resizeCanvas();
  requestAnimationFrame(tick);
} else {
  showError("NV. FACE LAB could not initialize its canvas. Try an updated browser.");
  dom.start.disabled = true;
}
