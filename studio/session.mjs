import {StudioAudio} from "./audio.mjs";
/** Additive Studio controller. Existing camera/video stream remains owned by Arena. */
export class StudioSession {
 constructor(){this.audio=new StudioAudio();this.video=null;this.recorder=null;this.chunks=[];this.recordingStream=null;this.peerConnections=new Set();}
 attachVideo(stream){if(!stream?.getVideoTracks)throw Error("Valid camera stream required");this.video=stream;return stream}
 async enableMic(deviceId){const stream=await this.audio.start({deviceId});await this.updatePublishers();return stream}
 mute(muted){return this.audio.setMuted(muted)}
 async updatePublishers(){const track=this.audio.microphone?.getAudioTracks()[0];if(!track)return;for(const pc of this.peerConnections){const sender=pc.getSenders().find(s=>s.track?.kind==="audio");if(sender)await sender.replaceTrack(track);else{pc.addTrack(track,this.audio.microphone);if(pc.signalingState==="stable")pc.dispatchEvent(new Event("chatbliz:renegotiation-needed"))}}}
 registerPublisher(pc){if(!pc?.getSenders||!pc?.addTrack)throw Error("RTCPeerConnection required");this.peerConnections.add(pc);return()=>this.peerConnections.delete(pc)}
 async startRecording({mimeType}={}){if(this.recorder?.state==="recording")throw Error("Already recording");if(typeof MediaRecorder==="undefined")throw Error("Recording unsupported");if(!this.video)throw Error("Attach existing video stream");this.recordingStream=this.audio.combine(this.video);const options=mimeType&&MediaRecorder.isTypeSupported(mimeType)?{mimeType}:undefined;this.chunks=[];this.recorder=new MediaRecorder(this.recordingStream,options);this.recorder.addEventListener("dataavailable",event=>{if(event.data?.size)this.chunks.push(event.data)});this.recorder.start(1000);return this.recorder}
 async stopRecording(){const recorder=this.recorder;if(!recorder||recorder.state==="inactive")throw Error("Not recording");return new Promise((resolve,reject)=>{recorder.addEventListener("stop",()=>{const blob=new Blob(this.chunks,{type:recorder.mimeType||"video/webm"});this.recorder=null;this.recordingStream=null;resolve(blob)},{once:true});recorder.addEventListener("error",event=>reject(event.error||Error("Recording failed")),{once:true});recorder.stop()})}
 async audioDevices(){return this.audio.devices()}
 async monitor(element){return this.audio.monitorOn(element)}
 stopMonitor(){this.audio.monitorOff()}
 destroy(){if(this.recorder?.state==="recording")this.recorder.stop();this.audio.destroy();this.peerConnections.clear();this.video=null}
}
