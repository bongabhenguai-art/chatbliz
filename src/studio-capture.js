// Chatbliz My Studio: real local camera/microphone capture and recording.
// Browser permissions and secure context required. No cloud upload or AI generation.
const root=document.getElementById("chatbliz-studio");
if(root){
 const state={stream:null,recorder:null,chunks:[],url:null};
 const status=root.querySelector("[data-studio-status]");
 const video=root.querySelector("video");
 const start=root.querySelector("[data-studio-camera]");
 const record=root.querySelector("[data-studio-record]");
 const stop=root.querySelector("[data-studio-stop]");
 const download=root.querySelector("[data-studio-download]");
 const cameraSelect=root.querySelector("[data-studio-camera-select]");
 const playback=root.querySelector("[data-studio-playback]");
 const setStatus=text=>{status.textContent=text;};
 const stopTracks=()=>{if(state.stream){state.stream.getTracks().forEach(t=>t.stop());state.stream=null;}video.srcObject=null;};
 const refreshCameras=async()=>{
  if(!navigator.mediaDevices?.enumerateDevices)return;
  const devices=(await navigator.mediaDevices.enumerateDevices()).filter(d=>d.kind==="videoinput");
  const current=cameraSelect.value;
  cameraSelect.replaceChildren(new Option("Default camera",""));
  devices.forEach((d,i)=>cameraSelect.add(new Option(d.label||"Camera "+(i+1),d.deviceId)));
  if(devices.some(d=>d.deviceId===current))cameraSelect.value=current;
 };
 start.addEventListener("click",async()=>{
  try{
   if(!navigator.mediaDevices?.getUserMedia)throw Error("Camera capture needs HTTPS or localhost and a compatible browser");
   if(state.recorder?.state==="recording")throw Error("Stop recording before switching cameras");
   stopTracks();
   state.stream=await navigator.mediaDevices.getUserMedia({video:cameraSelect.value?{deviceId:{ideal:cameraSelect.value}}:true,audio:true});
   video.srcObject=state.stream;await video.play().catch(()=>{});
   await refreshCameras();
   record.disabled=false;stop.disabled=false;setStatus("Camera and microphone connected locally. No livestream is being sent.");
  }catch(e){setStatus("Camera unavailable: "+e.message);record.disabled=true;}
 });
 record.addEventListener("click",()=>{
  if(!state.stream)return;
  if(typeof MediaRecorder==="undefined"){setStatus("Recording unsupported in this browser");return;}
  try{
   const mime=["video/webm;codecs=vp8,opus","video/webm","video/mp4"].find(x=>MediaRecorder.isTypeSupported(x));
   state.chunks=[];
   state.recorder=new MediaRecorder(state.stream,mime?{mimeType:mime}:undefined);
   state.recorder.addEventListener("dataavailable",e=>{if(e.data.size)state.chunks.push(e.data);});
   state.recorder.addEventListener("stop",()=>{
    if(state.url)URL.revokeObjectURL(state.url);
    const blob=new Blob(state.chunks,{type:state.recorder.mimeType||"video/webm"});
    state.url=URL.createObjectURL(blob);playback.src=state.url;
    download.href=state.url;download.download="chatbliz-studio-"+new Date().toISOString().replace(/[:.]/g,"-")+(blob.type.includes("mp4")?".mp4":".webm");
    download.hidden=false;setStatus("Recording saved in this browser session. Download to keep your file.");
   });
   state.recorder.start(1000);record.disabled=true;stop.disabled=false;setStatus("Recording camera and microphone locally…");
  }catch(e){setStatus("Recording failed: "+e.message);}
 });
 stop.addEventListener("click",()=>{
  if(state.recorder?.state==="recording")state.recorder.stop();
  stopTracks();record.disabled=true;stop.disabled=true;
  if(state.recorder?.state!=="inactive")setStatus("Camera stopped.");
 });
 window.addEventListener("pagehide",()=>{stopTracks();if(state.url)URL.revokeObjectURL(state.url);});
 refreshCameras().catch(()=>{});
}
