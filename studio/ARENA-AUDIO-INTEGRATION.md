# Arena AI Studio audio repair integration

The working Arena video system must remain unchanged. This module is an additive browser audio controller, not a replacement for the studio.

Import `StudioAudio` from `studio/audio.mjs` into the actual Arena Studio component once its source is available. Call `await audio.start()` from a user-clicked **Enable Microphone** control. On microphone device changes, call `await audio.start({deviceId})`. Use `audio.setMuted(true/false)` for mute buttons. Use `audio.combine(existingCameraStream)` as the stream passed to the existing MediaRecorder or WebRTC publisher; do **not** stop or replace the working camera stream. To monitor sound locally, call `await audio.monitorOn(audioElement)` from a user gesture, with headphones to prevent feedback. Call `audio.destroy()` on session teardown.

If an existing publisher has already negotiated a WebRTC audio sender, replace its audio track using `RTCRtpSender.replaceTrack(audio.microphone.getAudioTracks()[0])`; if no audio sender exists, renegotiate after adding the track. For recording, construct MediaRecorder from the combined stream, not the video-only stream. Check the resulting recording for an audio track and actual audible sound. For livestream, verify remote viewers hear audio, not merely that the local track exists.

Test on Android Chrome and desktop: HTTPS/permission prompts, microphone denial, mic device selection, mute/unmute, camera switching, recording playback, livestream remote audio, reconnect, and stopping. Microphone monitoring can create echo; default it off. Audio playback may require a user gesture. MediaRecorder/WebRTC integrations and Arena's existing audio bugs are **not verified** until the live Studio source and a test session are available.
