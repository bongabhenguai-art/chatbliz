import { BUSINESS_STAGES, OPERATING_MODULES, PACKAGES, PARTNERS, PRODUCTS } from "./domain.mjs";

const byId = id => document.getElementById(id);
const partnerList = byId("partner-list");
const operatingModuleGrid = byId("operating-module-grid");
const productGrid = byId("product-grid");
const planGrid = byId("plan-grid");
const thread = byId("chat-thread");
const input = byId("message-input");
const buildList = byId("build-list");
let selectedPartner = null;
let authMode = "signup";
let currentUser = null;

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    credentials: "same-origin",
    headers: { "content-type": "application/json", ...(options.headers || {}) },
    ...options
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && path !== "/api/auth/login" && path !== "/api/auth/signup") showAuth();
    throw new Error(payload.error || `Request failed (${response.status}).`);
  }
  return payload;
}

function showAuth(message = "") {
  currentUser = null;
  byId("app-shell").hidden = true;
  byId("auth-screen").hidden = false;
  byId("auth-error").textContent = message;
}

function showApp() {
  byId("auth-screen").hidden = true;
  byId("app-shell").hidden = false;
  byId("owner-name").textContent = currentUser.displayName;
  byId("owner-email").textContent = currentUser.email;
  byId("owner-avatar").textContent = currentUser.displayName.split(/\s+/u).map(part => part[0]).join("").slice(0, 2).toUpperCase();
  byId("greeting").textContent = `Welcome, ${currentUser.displayName}. Tell your business team what you are working on.`;
}

function setAuthMode(mode) {
  authMode = mode;
  const signup = mode === "signup";
  byId("auth-name-label").hidden = !signup;
  byId("auth-name").required = signup;
  byId("auth-name").autocomplete = signup ? "name" : "off";
  byId("auth-password").autocomplete = signup ? "new-password" : "current-password";
  byId("auth-title").textContent = signup ? "Create your workspace" : "Welcome back";
  byId("auth-copy").textContent = signup
    ? "Create your account once. Chatbliz saves your business profile, conversations, tasks and customer project lessons to this private workspace."
    : "Sign in to return to your saved business workspace. Chatbliz remembers this device while you keep using it.";
  byId("auth-submit").textContent = signup ? "Create account" : "Sign in";
  byId("auth-toggle").textContent = signup ? "Already have an account? Sign in" : "New to Chatbliz? Create an account";
  byId("auth-error").textContent = "";
}

byId("auth-toggle").addEventListener("click", () => setAuthMode(authMode === "signup" ? "login" : "signup"));
byId("auth-form").addEventListener("submit", async event => {
  event.preventDefault();
  const button = byId("auth-submit");
  button.disabled = true;
  byId("auth-error").textContent = "";
  const body = {
    displayName: byId("auth-name").value,
    email: byId("auth-email").value,
    password: byId("auth-password").value
  };
  try {
    const result = await api(authMode === "signup" ? "/api/auth/signup" : "/api/auth/login", {
      method: "POST", body: JSON.stringify(body)
    });
    currentUser = result.user;
    showApp();
    await loadWorkspace(result.profile);
  } catch (error) {
    byId("auth-error").textContent = error.message;
  } finally {
    button.disabled = false;
  }
});

byId("sign-out").addEventListener("click", async () => {
  try { await api("/api/auth/logout", { method: "POST", body: "{}" }); }
  catch {
    byId("connection-status").textContent = "Sign-out could not be confirmed. Please retry.";
    return;
  }
  setAuthMode("login");
  showAuth();
});

for (const partner of PARTNERS) {
  const button = el("button", "partner-chip");
  button.type = "button";
  button.setAttribute("aria-pressed", "false");
  button.title = partner.description;
  button.append(el("span", "partner-icon", partner.icon), el("span", "", partner.name));
  button.addEventListener("click", () => {
    selectedPartner = selectedPartner === partner.id ? null : partner.id;
    for (const chip of partnerList.querySelectorAll("button")) {
      const active = chip === button && selectedPartner === partner.id;
      chip.classList.toggle("selected", active);
      chip.setAttribute("aria-pressed", String(active));
    }
    input.placeholder = selectedPartner ? `Ask ${partner.name}…` : "Tell Chatbliz what your business needs…";
    input.focus();
  });
  partnerList.append(button);
}

for (const product of PRODUCTS) {
  const card = el("article", "product-card");
  card.append(el("span", "product-icon", product.icon), el("h3", "", product.name), el("p", "", product.description));
  const action = el("button", "product-link", "Work with Chatbliz →");
  action.type = "button";
  action.addEventListener("click", () => {
    setWorkspace(product);
    input.value = `Help me work on ${product.name} for my business`;
    input.focus();
  });
  card.append(action);
  productGrid.append(card);
}

for (const plan of PACKAGES) {
  const card = el("article", `plan-card${plan.name === "Growth" ? " featured" : ""}`);
  if (plan.badge) card.append(el("span", "plan-badge", plan.badge));
  card.append(el("h3", "", plan.name), el("p", "plan-price", plan.price));
  const list = el("ul");
  for (const detail of plan.details) list.append(el("li", "", detail));
  card.append(list);
  planGrid.append(card);
}

for (const module of OPERATING_MODULES) {
  const card = el("article", "operating-module-card");
  card.append(el("span", "module-area", module.area), el("h3", "", module.name), el("p", "", module.summary));
  card.append(el("small", "module-status", module.state));
  const action = el("button", "module-action", module.id === "studio" ? "Open Studio →" : module.id === "connections" ? "Open setup guide →" : "Plan with Chatbliz →");
  action.type = "button";
  action.addEventListener("click", () => {
    if (module.id === "connections") {
      showTechnicalDesk();
      byId("social-wizard-title").scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const product = PRODUCTS.find(item => item.id === module.workspace);
    if (product) setWorkspace(product);
    if (module.id === "studio") {
      byId("studio-title").scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (module.id === "twin") {
      byId("profile-title").scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    input.value = module.prompt;
    input.focus();
    input.scrollIntoView({ behavior: "smooth", block: "center" });
  });
  card.append(action);
  operatingModuleGrid.append(card);
}

for (const text of [
  "I need more customers for my business",
  "Help me improve my online visibility",
  "The sign-up says successful but does not save",
  "Help me prepare for a customer negotiation"
]) {
  const button = el("button", "suggestion", text);
  button.type = "button";
  button.addEventListener("click", () => { input.value = text; input.focus(); });
  byId("suggestions").append(button);
}

document.querySelectorAll("[data-workspace]").forEach(button => {
  button.addEventListener("click", () => {
    const product = PRODUCTS.find(item => item.id === button.dataset.workspace);
    if (product) setWorkspace(product);
  });
});

document.querySelector("[data-technical-nav]").addEventListener("click", () => showTechnicalDesk());

function showTechnicalDesk() {
  document.querySelectorAll("[data-workspace]").forEach(button => button.classList.remove("active"));
  byId("developer-desk").hidden = true;
  byId("technical-repair").hidden = false;
  byId("app-shell").classList.add("technical-mode");
  byId("app-shell").classList.remove("studio-mode");
  byId("studio-desk").hidden = true;
  document.querySelector("[data-technical-nav]").classList.add("active");
  byId("active-workspace-label").textContent = "TECHNICAL REPAIR";
  byId("workspace-title").textContent = "Check and repair Chatbliz";
  byId("technical-repair").scrollIntoView({ behavior: "smooth", block: "start" });
}

function setWorkspace(product) {
  document.querySelectorAll("[data-workspace]").forEach(button => button.classList.toggle("active", button.dataset.workspace === product.id));
  document.querySelector("[data-technical-nav]").classList.remove("active");
  byId("technical-repair").hidden = true;
  byId("app-shell").classList.remove("technical-mode");
  byId("app-shell").classList.toggle("studio-mode", product.id === "content");
  byId("active-workspace-label").textContent = product.name.toUpperCase();
  byId("workspace-title").textContent = product.id === "business" ? "What are we working on today?" : `Let's work on ${product.name}`;
  byId("developer-desk").hidden = product.id !== "website";
  byId("studio-desk").hidden = product.id !== "content";
}

let studioCameraStream = null;
let studioPreviewSource = null;
let studioProgramSource = null;
let studioRecorder = null;
let studioRecordedChunks = [];
let studioRecordingHasMic = false;
const studioSources = new Map();
let studioMicStream = null;
let studioAudioContext = null;
let studioMicGain = null;
let studioAudioDestination = null;
let studioAudioAnalyser = null;
let studioAudioFrame = null;
let studioAutoCutTimer = null;
let studioMicMuted = false;
const studioMessage = byId("studio-message");

function setStudioMessage(message) {
  studioMessage.textContent = message;
}

function showStudioSource(slot, source) {
  const video = byId(`studio-${slot}-video`);
  const image = byId(`studio-${slot}-image`);
  const empty = byId(`studio-${slot}-empty`);
  video.pause();
  video.srcObject = null;
  video.removeAttribute("src");
  image.removeAttribute("src");
  video.hidden = true;
  image.hidden = true;
  empty.hidden = Boolean(source);
  if (!source) return;
  if (source.kind === "image") {
    image.src = source.url;
    image.hidden = false;
  } else {
    video.srcObject = source.stream || null;
    if (source.url) video.src = source.url;
    video.loop = source.kind === "video";
    video.hidden = false;
    video.play().catch(() => setStudioMessage("Browser blocked playback. Press play on the video preview to continue."));
  }
}

function updateSourceOptions(selectedId = "") {
  const select = byId("studio-source-select");
  const current = selectedId || select.value;
  select.replaceChildren(new Option(studioSources.size ? "Choose source…" : "No sources", ""));
  for (const [id, source] of studioSources) select.add(new Option(source.label, id));
  select.disabled = studioSources.size === 0;
  if (current && studioSources.has(current)) select.value = current;
  else if (studioPreviewSource) select.value = [...studioSources].find(([, source]) => source === studioPreviewSource)?.[0] || "";
}

function selectStudioPreview(id) {
  studioPreviewSource = studioSources.get(id) || null;
  showStudioSource("preview", studioPreviewSource);
  byId("studio-switcher-help").textContent = studioPreviewSource ? `Ready: ${studioPreviewSource.label}` : "Choose a source for preview";
  refreshStudioControls();
}

function stopStudioMic() {
  if (studioAudioFrame !== null) cancelAnimationFrame(studioAudioFrame);
  studioAudioFrame = null;
  studioMicStream?.getTracks().forEach(track => track.stop());
  studioMicStream = null;
  studioMicGain?.disconnect();
  studioAudioAnalyser?.disconnect();
  studioMicGain = null;
  studioAudioAnalyser = null;
  studioAudioDestination?.stream.getTracks().forEach(track => track.stop());
  studioAudioDestination = null;
  studioAudioContext?.close().catch(() => {});
  studioAudioContext = null;
  byId("studio-mic-toggle").textContent = "Connect mic";
  byId("studio-mic-select").disabled = false;
  byId("studio-mic-mute").disabled = true;
  byId("studio-mic-mute").textContent = "Mute mic";
  studioMicMuted = false;
  byId("studio-mic-gain").disabled = true;
  byId("studio-audio-state").textContent = "Mic not connected";
  byId("studio-audio-level").style.setProperty("--level", "0%");
}

async function populateStudioDevices() {
  if (!navigator.mediaDevices?.enumerateDevices) return;
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const video = devices.filter(device => device.kind === "videoinput");
    const audio = devices.filter(device => device.kind === "audioinput");
    const cameraSelect = byId("studio-camera-select");
    const cameraValue = cameraSelect.value;
    cameraSelect.replaceChildren(new Option("Default camera", ""));
    video.forEach((device, index) => cameraSelect.add(new Option(device.label || `Camera ${index + 1}`, device.deviceId)));
    if (cameraValue && video.some(device => device.deviceId === cameraValue)) cameraSelect.value = cameraValue;
    const micSelect = byId("studio-mic-select");
    const micValue = micSelect.value;
    micSelect.replaceChildren(new Option(audio.length ? "Choose microphone…" : "No microphone found", ""));
    audio.forEach((device, index) => micSelect.add(new Option(device.label || `Microphone ${index + 1}`, device.deviceId)));
    if (micValue && audio.some(device => device.deviceId === micValue)) micSelect.value = micValue;
    updateSourceOptions(byId("studio-source-select").value);
  } catch {
    setStudioMessage("Browser could not list media devices. Check device permissions and retry.");
  }
}

function drawStudioAudioMeter() {
  if (!studioAudioAnalyser) return;
  const samples = new Uint8Array(studioAudioAnalyser.fftSize);
  studioAudioAnalyser.getByteTimeDomainData(samples);
  let peak = 0;
  for (const sample of samples) peak = Math.max(peak, Math.abs(sample - 128) / 128);
  byId("studio-audio-level").style.setProperty("--level", `${Math.min(100, Math.round(peak * 180))}%`);
  if (peak > 0.94) byId("studio-audio-state").textContent = "Clipping risk · lower mic gain";
  else if (studioMicStream) byId("studio-audio-state").textContent = studioMicMuted ? "Mic muted" : "Mic connected · included in next recording";
  studioAudioFrame = requestAnimationFrame(drawStudioAudioMeter);
}

function stopStudioAutoCut(message = "Auto cut stopped because its source changed.") {
  if (!studioAutoCutTimer) return;
  clearInterval(studioAutoCutTimer);
  studioAutoCutTimer = null;
  byId("studio-auto-cut").setAttribute("aria-pressed", "false");
  byId("studio-auto-cut").textContent = "Auto cut";
  setStudioMessage(message);
}

function refreshStudioControls() {
  byId("studio-take").disabled = !studioPreviewSource;
  byId("studio-record").disabled = !studioProgramSource || studioProgramSource.kind === "image" || !window.MediaRecorder;
  byId("studio-camera-health").textContent = studioCameraStream?.active ? "Camera on" : "Camera off";
  byId("studio-program-source").textContent = studioProgramSource?.label || "No program source";
  byId("studio-status").lastChild.textContent = studioRecorder?.state === "recording" ? " Recording locally" : " Local studio · not broadcasting";
  byId("studio-auto-cut").disabled = [...studioSources.values()].filter(source => source.kind !== "image").length < 2;
  byId("studio-switcher-help").textContent = studioAutoCutTimer ? "Auto cut running · press to stop" : studioSources.size < 2 ? "Add a second source to use auto cut" : studioPreviewSource ? `Ready: ${studioPreviewSource.label}` : "Choose a source for preview";
}

async function startStudioCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    setStudioMessage("Camera access requires HTTPS and a browser that supports media capture.");
    return;
  }
  byId("studio-camera").disabled = true;
  try {
    const deviceId = byId("studio-camera-select").value;
    studioCameraStream = await navigator.mediaDevices.getUserMedia({ video: deviceId ? { deviceId: { exact: deviceId } } : true, audio: false });
    const track = studioCameraStream.getVideoTracks()[0];
    const label = track?.label || "Browser camera";
    studioSources.set("camera", { kind: "camera", stream: studioCameraStream, label, deviceId: track?.getSettings().deviceId || "" });
    updateSourceOptions("camera");
    selectStudioPreview("camera");
    byId("studio-camera").textContent = "Stop camera";
    setStudioMessage("Camera preview is running in this browser. Use Take / Cut to send it to the local program monitor.");
  } catch (error) {
    studioCameraStream = null;
    setStudioMessage(error.name === "NotAllowedError" ? "Camera permission was denied. Allow camera access in your browser settings and retry." : "Camera could not start. Check that a camera is connected and not in use by another app.");
  } finally {
    byId("studio-camera").disabled = false;
    await populateStudioDevices();
    refreshStudioControls();
  }
}

byId("studio-camera").addEventListener("click", async () => {
  if (studioCameraStream?.active) {
    stopStudioAutoCut();
    studioCameraStream.getTracks().forEach(track => track.stop());
    studioCameraStream = null;
    if (studioPreviewSource?.kind === "camera") {
      studioPreviewSource = null;
      showStudioSource("preview", null);
    }
    if (studioProgramSource?.kind === "camera") {
      studioProgramSource = null;
      showStudioSource("program", null);
    }
    studioSources.delete("camera");
    updateSourceOptions();
    byId("studio-camera").textContent = "Start camera";
    setStudioMessage("Camera stopped. No camera input is being shared with this studio.");
    refreshStudioControls();
    return;
  }
  await startStudioCamera();
});

byId("studio-camera-select").addEventListener("change", async () => {
  if (!studioCameraStream?.active) return;
  stopStudioAutoCut("Auto cut stopped while changing camera.");
  studioCameraStream.getTracks().forEach(track => track.stop());
  studioCameraStream = null;
  studioSources.delete("camera");
  if (studioPreviewSource?.kind === "camera") { studioPreviewSource = null; showStudioSource("preview", null); }
  if (studioProgramSource?.kind === "camera") { studioProgramSource = null; showStudioSource("program", null); }
  await startStudioCamera();
});

byId("studio-source-select").addEventListener("change", event => selectStudioPreview(event.target.value));

byId("studio-media-file").addEventListener("change", event => {
  const file = event.target.files?.[0];
  if (!file) return;
  const kind = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : null;
  if (!kind) {
    setStudioMessage("Choose a supported image or video file.");
    event.target.value = "";
    return;
  }
  stopStudioAutoCut("Auto cut stopped while replacing a media source.");
  const old = studioSources.get("media");
  if (old?.url?.startsWith("blob:")) URL.revokeObjectURL(old.url);
  studioSources.set("media", { kind, url: URL.createObjectURL(file), label: file.name });
  updateSourceOptions("media");
  selectStudioPreview("media");
  setStudioMessage(`${file.name} is loaded in the preview. Media stays in this browser and is not uploaded.`);
  refreshStudioControls();
  event.target.value = "";
});

byId("studio-take").addEventListener("click", () => {
  if (!studioPreviewSource) return;
  studioProgramSource = studioPreviewSource;
  showStudioSource("program", studioProgramSource);
  setStudioMessage(`Program switched to ${studioProgramSource.label}. This is a local monitor output, not a public live stream.`);
  refreshStudioControls();
});

byId("studio-auto-cut").addEventListener("click", () => {
  if (studioAutoCutTimer) {
    stopStudioAutoCut("Auto cut stopped. Program remains on its current source.");
    refreshStudioControls();
    return;
  }
  const sources = [...studioSources.values()].filter(source => source.kind !== "image");
  if (sources.length < 2) {
    setStudioMessage("Auto cut needs two moving sources. Connect the camera and load a video source first.");
    return;
  }
  let index = Math.max(0, sources.indexOf(studioProgramSource));
  studioProgramSource = sources[index];
  showStudioSource("program", studioProgramSource);
  studioAutoCutTimer = setInterval(() => {
    index = (index + 1) % sources.length;
    studioProgramSource = sources[index];
    showStudioSource("program", studioProgramSource);
    byId("studio-program-source").textContent = studioProgramSource.label;
    setStudioMessage(`Auto cut switched local program to ${studioProgramSource.label}. This is not a public live stream.`);
  }, 8000);
  byId("studio-auto-cut").setAttribute("aria-pressed", "true");
  byId("studio-auto-cut").textContent = "Stop auto";
  setStudioMessage("Auto cut is switching between local video sources every 8 seconds. The program remains on this device.");
  refreshStudioControls();
});

document.querySelector('[data-studio-action="Audio"]').addEventListener("click", async () => {
  const panel = byId("studio-audio-panel");
  panel.hidden = !panel.hidden;
  if (!panel.hidden) await populateStudioDevices();
});

document.querySelector('[data-studio-action="Podcast"]').addEventListener("click", async () => {
  const panel = byId("studio-audio-panel");
  panel.hidden = false;
  await populateStudioDevices();
  setStudioMessage("Podcast mode uses the same local Preview/Program recording path. Connect a mic for audio; separate tracks, editing, cloud storage and podcast publishing are not connected.");
  byId("studio-audio-panel").scrollIntoView({ behavior: "smooth", block: "nearest" });
});

byId("studio-mic-toggle").addEventListener("click", async () => {
  if (studioMicStream) {
    stopStudioMic();
    setStudioMessage("Microphone disconnected. New recordings will be video-only.");
    return;
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    setStudioMessage("Microphone access requires HTTPS and a browser that supports media capture.");
    return;
  }
  try {
    const deviceId = byId("studio-mic-select").value;
    studioMicStream = await navigator.mediaDevices.getUserMedia({ audio: deviceId ? { deviceId: { exact: deviceId }, echoCancellation: true, noiseSuppression: true } : { echoCancellation: true, noiseSuppression: true }, video: false });
    const AudioContextType = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextType) throw new Error("Web Audio is not supported in this browser.");
    studioAudioContext = new AudioContextType();
    const inputNode = studioAudioContext.createMediaStreamSource(studioMicStream);
    studioMicGain = studioAudioContext.createGain();
    studioAudioAnalyser = studioAudioContext.createAnalyser();
    studioAudioDestination = studioAudioContext.createMediaStreamDestination();
    inputNode.connect(studioMicGain);
    studioMicGain.connect(studioAudioAnalyser);
    studioMicGain.connect(studioAudioDestination);
    studioMicGain.gain.value = Number(byId("studio-mic-gain").value);
    byId("studio-mic-toggle").textContent = "Disconnect mic";
    byId("studio-mic-select").disabled = true;
    byId("studio-mic-mute").disabled = false;
    byId("studio-mic-gain").disabled = false;
    byId("studio-audio-state").textContent = "Mic connected · included in next recording";
    drawStudioAudioMeter();
    setStudioMessage("Microphone connected. Its input is metered and will be included in new local recordings.");
    await populateStudioDevices();
  } catch (error) {
    stopStudioMic();
    setStudioMessage(error.name === "NotAllowedError" ? "Microphone permission was denied. Allow microphone access in browser settings and retry." : error.message || "Microphone could not start. Check the selected device and retry.");
  }
});

byId("studio-mic-gain").addEventListener("input", event => {
  if (studioMicGain) studioMicGain.gain.value = studioMicMuted ? 0 : Number(event.target.value);
});

byId("studio-mic-mute").addEventListener("click", () => {
  if (!studioMicGain) return;
  studioMicMuted = !studioMicMuted;
  studioMicGain.gain.value = studioMicMuted ? 0 : Number(byId("studio-mic-gain").value);
  byId("studio-mic-mute").textContent = studioMicMuted ? "Unmute mic" : "Mute mic";
  byId("studio-audio-state").textContent = studioMicMuted ? "Mic muted" : "Mic connected · included in next recording";
});

byId("studio-record").addEventListener("click", () => {
  const button = byId("studio-record");
  if (studioRecorder?.state === "recording") {
    studioRecorder.stop();
    button.textContent = "● Record";
    return;
  }
  const video = byId("studio-program-video");
  const capture = video.captureStream || video.mozCaptureStream;
  if (!capture) {
    setStudioMessage("This browser cannot record the program video. Try a current version of Chrome, Edge or Firefox.");
    return;
  }
  try {
    studioRecordedChunks = [];
    const recordingStream = capture.call(video);
    studioRecordingHasMic = Boolean(studioAudioDestination && !studioMicMuted);
    if (studioRecordingHasMic) recordingStream.addTrack(studioAudioDestination.stream.getAudioTracks()[0].clone());
    studioRecorder = new MediaRecorder(recordingStream);
    studioRecorder.addEventListener("dataavailable", event => { if (event.data.size) studioRecordedChunks.push(event.data); });
    studioRecorder.addEventListener("stop", () => {
      const blob = new Blob(studioRecordedChunks, { type: studioRecorder.mimeType || "video/webm" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `chatbliz-studio-${new Date().toISOString().replaceAll(":", "-")}.webm`;
      link.click();
      setStudioMessage(`Local ${studioRecordingHasMic ? "video and microphone audio" : "video-only"} recording downloaded to your device. It was not uploaded or published.`);
      byId("studio-record-health").textContent = "Recording downloaded";
      button.textContent = "● Record";
      refreshStudioControls();
    });
    studioRecorder.start();
    button.textContent = "■ Stop & save";
    byId("studio-record-health").textContent = "Recording locally";
    setStudioMessage(`Recording program output ${studioRecordingHasMic ? "with microphone audio" : "without microphone audio"}. Stop & save downloads a WebM file to your device.`);
    refreshStudioControls();
  } catch {
    setStudioMessage("Recording could not start for this source in your browser.");
  }
});

document.querySelectorAll("[data-studio-action]").forEach(button => button.addEventListener("click", () => {
  const action = button.dataset.studioAction;
  const guidance = {
    Cameras: "Allow camera access to add the current browser camera as a source. Use Preview source to switch among connected camera and local media sources.",
    Audio: "Open the audio panel to connect a microphone, adjust its recording gain and check its input meter. This is a local browser mix.",
    Lighting: "Lighting controls require compatible connected hardware; none is configured in this workspace.",
    Scenes: "For this session, use Add media to load a scene image or video into Preview.",
    "AI Director": "The planned Studio engine is open-source Wan 2.2 running through ComfyUI. Its model host is not connected yet, so no clip is generated and no Hailuo API is used.",
    Graphics: "Graphics overlays are not connected yet.",
    Sponsors: "Sponsor assets and sponsor management are not connected yet.",
    Chat: "Studio chat is not connected yet. Use the Chatbliz conversation in My Business.",
    Podcast: "Basic podcast capture uses the local camera and microphone recording path. Separate tracks, editing, cloud storage and podcast publishing are not connected."
  };
  setStudioMessage(guidance[action] || `${action} is not configured yet.`);
}));

byId("studio-go-live").addEventListener("click", () => setStudioMessage("Live streaming is not configured. Connect and test a streaming provider before using Go Live."));

window.addEventListener("beforeunload", () => {
  studioCameraStream?.getTracks().forEach(track => track.stop());
  stopStudioMic();
  if (studioAutoCutTimer) clearInterval(studioAutoCutTimer);
  for (const source of studioSources.values()) if (source.url?.startsWith("blob:")) URL.revokeObjectURL(source.url);
});

document.querySelectorAll("[data-journey-workspace]").forEach(button => {
  button.addEventListener("click", () => {
    const product = PRODUCTS.find(item => item.id === button.dataset.journeyWorkspace);
    if (!product) return;
    setWorkspace(product);
    input.value = button.dataset.journeyPrompt || `Help me work on ${product.name} for my business`;
    input.focus();
    input.scrollIntoView({ behavior: "smooth", block: "center" });
  });
});

document.querySelectorAll("[data-business-stage]").forEach(button => {
  button.addEventListener("click", () => {
    const stage = BUSINESS_STAGES.find(item => item.id === button.dataset.businessStage);
    const product = PRODUCTS.find(item => item.id === "business");
    if (!stage || !product) return;
    setWorkspace(product);
    input.value = stage.prompt;
    input.focus();
    input.scrollIntoView({ behavior: "smooth", block: "center" });
  });
});

byId("run-diagnostics").addEventListener("click", async () => {
  const button = byId("run-diagnostics");
  const status = byId("diagnostics-status");
  const results = byId("diagnostics-results");
  button.disabled = true;
  status.textContent = "Checking your account, storage and app files…";
  results.replaceChildren();
  const checks = [
    ["Signed-in account", async () => {
      const result = await api("/api/me");
      return `${result.user.displayName} (${result.user.email})`;
    }],
    ["Chatbliz database", async () => {
      const result = await api("/api/health");
      if (result.storage !== "connected") throw new Error("Storage response is not healthy.");
      return "D1 is responding";
    }],
    ["Front-end app file", async () => checkStaticAsset("./src/app.js")],
    ["Front-end styles", async () => checkStaticAsset("./styles.css")]
  ];
  let passed = 0;
  try {
    for (const [label, run] of checks) {
      const row = el("div", "diagnostic-row");
      row.append(el("span", "diagnostic-name", label));
      try {
        row.append(el("span", "diagnostic-pass", `OK · ${await run()}`));
        passed++;
      } catch (error) { row.append(el("span", "diagnostic-fail", `Needs attention · ${error.message}`)); }
      results.append(row);
    }
    status.textContent = `${passed}/${checks.length} checks passed · ${new Date().toLocaleString()}`;
  } finally { button.disabled = false; }
});

async function checkStaticAsset(path) {
  const response = await fetch(path, { credentials: "same-origin", cache: "no-store" });
  if (!response.ok) throw new Error(`File returned ${response.status}.`);
  const body = await response.text();
  if (!body.trim()) throw new Error("File is empty.");
  return `loaded (${response.status})`;
}

const socialProviders = {
  meta: { url: "https://developers.facebook.com/apps/", name: "Meta", needs: "Create a Meta developer app and enable the Facebook Login and Instagram Graph API products needed for this business." },
  tiktok: { url: "https://developers.tiktok.com/", name: "TikTok", needs: "Create a TikTok developer app and request the user and content permissions this business needs." },
  linkedin: { url: "https://developer.linkedin.com/", name: "LinkedIn", needs: "Create a LinkedIn developer app and request the organization or member permissions required for the intended workflow." },
  youtube: { url: "https://console.cloud.google.com/apis/credentials", name: "YouTube", needs: "Create a Google Cloud OAuth client and enable the YouTube API scopes the business needs." },
  x: { url: "https://developer.x.com/en/portal/dashboard", name: "X", needs: "Create an X developer app and enable OAuth 2.0 with the least permissions required." }
};

byId("social-platform").addEventListener("change", event => {
  const provider = socialProviders[event.target.value];
  byId("social-setup-link").href = provider.url;
  byId("social-setup-link").textContent = `Open ${provider.name} app setup ↗`;
  byId("social-setup-guidance").textContent = `${provider.needs} After registration, add the client ID and secret to Cloudflare Worker secrets. Chatbliz authorization remains off until the credentials and callback are configured and tested.`;
});

function renderTask(task) {
  const row = el("div", `task-row${task.status === "done" ? " is-done" : ""}`);
  const taskLabel = el("label", "task-label");
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = task.status === "done";
  checkbox.setAttribute("aria-label", `${checkbox.checked ? "Reopen" : "Complete"} task: ${task.title}`);
  checkbox.addEventListener("change", async () => {
    checkbox.disabled = true;
    try {
      const result = await api(`/api/tasks/${encodeURIComponent(task.id)}`, {
        method: "PATCH", body: JSON.stringify({ status: checkbox.checked ? "done" : "open" })
      });
      row.classList.toggle("is-done", result.task.status === "done");
      await loadTasks();
    } catch (error) {
      checkbox.checked = !checkbox.checked;
      alert(error.message);
    } finally { checkbox.disabled = false; }
  });
  taskLabel.append(checkbox, el("span", "", task.title));
  const review = el("button", "workflow-trigger", "Prepare review");
  review.type = "button";
  review.setAttribute("aria-label", `Prepare an owner review for ${task.title}`);
  review.addEventListener("click", async () => {
    review.disabled = true;
    review.textContent = "Preparing…";
    try {
      const { workflow } = await api("/api/workflows", { method: "POST", body: JSON.stringify({ taskId: task.id }) });
      for (let attempt = 0; attempt < 12; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 250));
        const current = await api(`/api/workflows/${encodeURIComponent(workflow.id)}`);
        if (current.workflow.status !== "queued") break;
      }
      await loadWorkflows();
    } catch (error) {
      alert(error.message);
    } finally {
      review.disabled = false;
      review.textContent = "Prepare review";
    }
  });
  row.append(taskLabel, review);
  return row;
}

async function loadTasks() {
  const { tasks } = await api("/api/tasks");
  const list = byId("task-list");
  list.replaceChildren();
  byId("task-count").textContent = `${tasks.filter(task => task.status === "open").length} open · ${tasks.length} total`;
  if (!tasks.length) list.append(el("p", "empty-state", "Your saved follow-up actions will appear here."));
  else for (const task of tasks) list.append(renderTask(task));
}

const workflowStatusLabel = {
  queued: "Preparing review",
  awaiting_approval: "Waiting for your decision",
  approved: "Plan approved · follow-through is yours",
  rejected: "Plan rejected",
  expired: "Review expired",
  failed: "Could not prepare review"
};

function renderWorkflow(workflow) {
  const card = el("article", `workflow-card workflow-${workflow.status}`);
  const heading = el("div", "workflow-card-heading");
  heading.append(el("strong", "", workflow.taskTitle), el("span", "workflow-status", workflowStatusLabel[workflow.status] || workflow.status));
  card.append(heading);
  if (workflow.plan?.response) card.append(el("p", "workflow-plan", workflow.plan.response));
  else if (workflow.status === "queued") card.append(el("p", "workflow-plan", "Chatbliz is preparing the saved plan for your review."));

  if (workflow.status === "awaiting_approval") {
    const actions = el("div", "workflow-actions");
    for (const [decision, label] of [["approve", "Approve plan"], ["reject", "Reject plan"]]) {
      const button = el("button", decision === "approve" ? "workflow-approve" : "workflow-reject", label);
      button.type = "button";
      button.addEventListener("click", async () => {
        button.disabled = true;
        try {
          await api(`/api/workflows/${encodeURIComponent(workflow.id)}/decision`, {
            method: "POST", body: JSON.stringify({ decision })
          });
          await loadWorkflows();
        } catch (error) {
          alert(error.message);
          button.disabled = false;
        }
      });
      actions.append(button);
    }
    card.append(actions);
  }
  if (workflow.status === "approved") {
    card.append(el("p", "workflow-disclosure", "Approval records the plan only. Connected execution, messaging and publishing are not configured."));
  }
  return card;
}

async function loadWorkflows() {
  const { workflows } = await api("/api/workflows");
  const list = byId("workflow-list");
  list.replaceChildren();
  byId("workflow-count").textContent = `${workflows.filter(item => ["queued", "awaiting_approval"].includes(item.status)).length} waiting · ${workflows.length} total`;
  if (!workflows.length) list.append(el("p", "empty-state", "Use Prepare review beside a task to start an owner-controlled workflow."));
  else for (const workflow of workflows) list.append(renderWorkflow(workflow));
}

function buildPrompt(build) {
  const base = [
    `Plan the next build step for customer business ${build.businessName} (${build.businessType}).`,
    `Customer need: ${build.problem}`,
    `Build goal: ${build.goal}`,
    "Use this customer's project context to prepare practical steps across brand, website or app, studio content, and business operations. Mark anything that needs a connected service; do not claim code has been built or published."
  ].join("\n");
  const lesson = build.learningNotes?.trim();
  return `${base}${lesson ? `\nOwner-reviewed learning from this customer's feedback: ${lesson.slice(0, Math.max(0, 3900 - base.length))}` : ""}`.slice(0, 4000);
}

function renderBuild(build) {
  const card = el("article", "build-card");
  const top = el("div", "build-card-top");
  const identity = el("div");
  identity.append(el("h4", "", build.businessName), el("span", "build-type", build.businessType));
  top.append(identity, el("span", "build-saved", `Updated ${new Date(build.updatedAt).toLocaleDateString()}`));
  card.append(top, el("p", "build-detail", `Customer need: ${build.problem}`), el("p", "build-detail", `Build goal: ${build.goal}`));
  const notesLabel = el("label", "build-notes-label", "Customer feedback / lesson learned");
  const notes = el("textarea", "build-notes");
  notes.value = build.learningNotes || "";
  notes.maxLength = 2000;
  notes.rows = 3;
  notes.placeholder = "Summarize confirmed feedback or a lesson to use on this project’s next step…";
  notesLabel.append(notes);
  card.append(notesLabel);
  const actions = el("div", "build-actions");
  const save = el("button", "build-secondary", "Save project lesson");
  save.type = "button";
  save.addEventListener("click", async () => {
    save.disabled = true;
    try {
      const result = await api(`/api/builds/${encodeURIComponent(build.id)}`, {
        method: "PATCH", body: JSON.stringify({ learningNotes: notes.value })
      });
      build.learningNotes = result.build.learningNotes;
      save.textContent = "Lesson saved";
      byId("build-count").textContent = "Project lesson saved";
      await loadBuilds();
    } catch (error) {
      save.textContent = "Retry saving lesson";
      byId("build-count").textContent = error.message;
    } finally { save.disabled = false; }
  });
  const plan = el("button", "build-primary", "Plan next build step →");
  plan.type = "button";
  plan.addEventListener("click", () => {
    setWorkspace(PRODUCTS.find(item => item.id === "website"));
    input.value = buildPrompt(build);
    input.focus();
    input.scrollIntoView({ behavior: "smooth", block: "center" });
  });
  actions.append(save, plan);
  card.append(actions);
  return card;
}

async function loadBuilds() {
  const { builds } = await api("/api/builds");
  buildList.replaceChildren();
  byId("build-count").textContent = `${builds.length} saved ${builds.length === 1 ? "build" : "builds"}`;
  if (!builds.length) buildList.append(el("p", "empty-state", "Save a customer build brief to start. Each project's learning notes stay separate."));
  else for (const build of builds) buildList.append(renderBuild(build));
}

byId("build-form").addEventListener("submit", async event => {
  event.preventDefault();
  const button = byId("build-form").querySelector("button[type='submit']");
  const status = byId("build-status");
  button.disabled = true;
  status.textContent = "Saving this customer build to your account…";
  try {
    await api("/api/builds", {
      method: "POST",
      body: JSON.stringify({
        businessName: byId("build-business").value,
        businessType: byId("build-type").value,
        problem: byId("build-problem").value,
        goal: byId("build-goal").value
      })
    });
    byId("build-form").reset();
    status.textContent = "Customer build saved. Add feedback later, then use Plan next build step.";
    await loadBuilds();
  } catch (error) { status.textContent = error.message; }
  finally { button.disabled = false; }
});

async function saveTask(title, sourceMessageId) {
  await api("/api/tasks", { method: "POST", body: JSON.stringify({ title, sourceMessageId }) });
  await loadTasks();
}

function appendMessage(role, text, status) {
  const article = el("article", `message ${role === "user" ? "user-message" : "assistant-message"}`);
  article.append(el("span", "message-avatar", role === "user" ? currentUser.displayName.slice(0, 2).toUpperCase() : "C"));
  const body = el("div", "message-body");
  body.append(el("p", "", text));
  if (status) body.append(el("small", "", status));
  article.append(body);
  thread.append(article);
  thread.scrollTop = thread.scrollHeight;
}

function appendSolution(plan, sourceMessageId) {
  const article = el("article", "message assistant-message");
  article.append(el("span", "message-avatar", "F"));
  const body = el("div", "message-body");
  body.append(el("p", "", `Problem area: ${plan.solution.area}. ${plan.solution.assessment}`));
  if (plan.stage) body.append(el("p", "stage-guidance", `${plan.stage.name}: ${plan.stage.focus} First step: ${plan.stage.firstStep}`));
  body.append(el("strong", "", "Practical next steps"));
  const steps = el("ol");
  for (const action of plan.solution.actions) {
    const item = el("li", "");
    item.append(document.createTextNode(action));
    const add = el("button", "add-task", "Add task");
    add.type = "button";
    add.addEventListener("click", async () => {
      add.disabled = true;
      try { await saveTask(action, sourceMessageId); add.textContent = "Saved"; }
      catch (error) { add.disabled = false; add.textContent = "Retry"; alert(error.message); }
    });
    item.append(add);
    steps.append(item);
  }
  body.append(steps);
  body.append(el("p", "", `Measure: ${plan.solution.measure}`));
  body.append(el("p", "", `To make this specific: ${plan.solution.questions.join(" ")}`));
  body.append(el("small", "", "Saved conversation · Planning workflow (no external action taken)"));
  article.append(body);
  thread.append(article);
  thread.scrollTop = thread.scrollHeight;
}

function renderSavedMessage(item) {
  if (item.role === "user") appendMessage("user", item.body, "Saved in your account");
  else if (item.plan?.problemSolving) appendSolution(item.plan, item.id);
  else appendMessage("assistant", item.body, "Saved in your account");
}

async function submitChat(value) {
  const message = value.trim();
  if (!message) return;
  appendMessage("user", message, "Saving to your account…");
  const button = document.querySelector("#chat-form button[type='submit']");
  button.disabled = true;
  try {
    const result = await api("/api/chat", {
      method: "POST",
      body: JSON.stringify({ message, partnerId: selectedPartner })
    });
    const plan = result.plan;
    const useSolver = selectedPartner === "problem_solver" || plan.problemSolving;
    if (useSolver) {
      plan.problemSolving = true;
      appendSolution(plan, result.assistantMessageId);
    } else appendMessage("assistant", plan.response, "Saved conversation · Built-in planning workflow");
    setWorkspace(plan.product);
  } catch (error) {
    appendMessage("assistant", error.message, "Not saved · retry when the connection is restored");
  } finally {
    button.disabled = false;
    selectedPartner = null;
    partnerList.querySelectorAll("button").forEach(chip => {
      chip.classList.remove("selected");
      chip.setAttribute("aria-pressed", "false");
    });
    input.placeholder = "Tell Chatbliz what your business needs…";
  }
}

byId("chat-form").addEventListener("submit", async event => {
  event.preventDefault();
  const value = input.value;
  input.value = "";
  await submitChat(value);
  input.focus();
});
input.addEventListener("keydown", event => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    byId("chat-form").requestSubmit();
  }
});

byId("profile-form").addEventListener("submit", async event => {
  event.preventDefault();
  const status = byId("profile-status");
  status.textContent = "Saving…";
  const profile = {
    displayName: byId("profile-display-name").value,
    businessName: byId("profile-business-name").value,
    industry: byId("profile-industry").value,
    location: byId("profile-location").value,
    website: byId("profile-website").value,
    whatsapp: byId("profile-whatsapp").value
  };
  try {
    const result = await api("/api/profile", { method: "PUT", body: JSON.stringify(profile) });
    currentUser = result.user;
    showApp();
    fillProfile(result.user, result.profile);
    status.textContent = "Saved and verified.";
  } catch (error) { status.textContent = error.message; }
});

function fillProfile(user, profile = {}) {
  byId("profile-display-name").value = user.displayName || "";
  byId("profile-business-name").value = profile.businessName || "";
  byId("profile-industry").value = profile.industry || "";
  byId("profile-location").value = profile.location || "";
  byId("profile-website").value = profile.website || "";
  byId("profile-whatsapp").value = profile.whatsapp || "";
}

async function loadWorkspace(initialProfile) {
  showApp();
  byId("connection-status").innerHTML = "<i></i> Account storage connected";
  try {
    const details = initialProfile ? { user: currentUser, profile: initialProfile } : await api("/api/me");
    fillProfile(details.user, details.profile);
    const [messages] = await Promise.all([api("/api/chat"), loadTasks(), loadBuilds(), loadWorkflows()]);
    if (messages.messages.length) {
      thread.replaceChildren();
      for (const item of messages.messages) renderSavedMessage(item);
    }
  } catch (error) {
    if (error.message !== "Sign in to continue.") byId("connection-status").textContent = "Storage connection issue";
  }
}

async function boot() {
  setAuthMode("signup");
  try {
    await api("/api/health");
    const result = await api("/api/me");
    currentUser = result.user;
    await loadWorkspace(result.profile);
  } catch (error) {
    if (error.message === "Sign in to continue.") showAuth();
    else showAuth("Chatbliz storage is not connected yet. Please try again later.");
  }
}

boot();
