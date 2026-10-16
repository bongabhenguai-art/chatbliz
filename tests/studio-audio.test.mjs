import test from "node:test";
import assert from "node:assert/strict";
import {StudioAudio} from "../studio/audio.mjs";
import {StudioSession} from "../studio/session.mjs";
test("audio rejects unsupported microphone environments",async()=>{const audio=new StudioAudio({mediaDevices:null});await assert.rejects(audio.start(),/unavailable/);audio.destroy()});
test("audio captures microphone only and mutes tracks",async()=>{const track={kind:"audio",enabled:true,readyState:"live",stop(){this.stopped=true}};let constraints;const mediaDevices={async getUserMedia(c){constraints=c;return {getAudioTracks:()=>[track],getTracks:()=>[track]}}};const audio=new StudioAudio({mediaDevices});await audio.start();assert.equal(constraints.video,false);audio.setMuted(true);assert.equal(track.enabled,false);audio.setMuted(false);assert.equal(track.enabled,true);audio.destroy();assert.equal(track.stopped,true)});
test("session rejects invalid video streams",()=>{const session=new StudioSession();assert.throws(()=>session.attachVideo(null),/camera/);session.destroy()});
test("session recording requires an attached video stream",async()=>{const session=new StudioSession();await assert.rejects(session.startRecording(),/unsupported|Attach/);session.destroy()});
