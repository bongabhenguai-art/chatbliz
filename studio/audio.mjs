/** Chatbliz Studio audio pipeline: browser-only, never modifies existing video tracks. */
export class StudioAudio {
 constructor({mediaDevices=globalThis.navigator?.mediaDevices}={}){this.mediaDevices=mediaDevices;this.microphone=null;this.monitor=null;this.monitorStream=null;this.muted=false;}
 async devices(){if(!this.mediaDevices?.enumerateDevices)throw Error("Audio device discovery unavailable");return(await this.mediaDevices.enumerateDevices()).filter(d=>d.kind==="audioinput"||d.kind==="audiooutput")}
 async start({deviceId}={}){if(!this.mediaDevices?.getUserMedia)throw Error("Microphone API unavailable: use HTTPS and allow microphone access");const constraints={audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true,...(deviceId?{deviceId:{ideal:deviceId}}:{})},video:false};const stream=await this.mediaDevices.getUserMedia(constraints);if(!stream.getAudioTracks().length){stream.getTracks().forEach(t=>t.stop());throw Error("No microphone audio track returned")}this.stopMicrophone();this.microphone=stream;this.setMuted(this.muted);return stream}
 setMuted(value){this.muted=Boolean(value);for(const track of this.microphone?.getAudioTracks()||[])track.enabled=!this.muted;return this.muted}
 /** Returns a new stream containing existing video tracks plus microphone audio. */
 combine(videoStream){if(typeof MediaStream==="undefined")throw Error("MediaStream unsupported");const videoTracks=videoStream?.getVideoTracks?.()||[];const audioTracks=this.microphone?.getAudioTracks?.().filter(t=>t.readyState==="live")||[];if(!audioTracks.length)throw Error("Start microphone before recording or streaming");return new MediaStream([...videoTracks,...audioTracks])}
 async monitorOn(audioElement){if(!audioElement)throw Error("Audio element required");if(!this.microphone)throw Error("Start microphone first");this.monitorOff();this.monitor=audioElement;this.monitorStream=new MediaStream(this.microphone.getAudioTracks());audioElement.srcObject=this.monitorStream;audioElement.muted=false;audioElement.volume=1;await audioElement.play();return true}
 monitorOff(){if(this.monitor){this.monitor.pause();this.monitor.srcObject=null}this.monitor=null;this.monitorStream=null}
 stopMicrophone(){this.monitorOff();this.microphone?.getTracks().forEach(t=>t.stop());this.microphone=null}
 destroy(){this.stopMicrophone()}
}
