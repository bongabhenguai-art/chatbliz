# Chatbliz Studio: production workflow and build requirements

This document carries the Studio workflow from [Bonga Bhengu OS](https://github.com/bongabhenguai-art/bonga-bhengu) into Chatbliz. The implementation is intentionally incremental: keep Chatbliz's existing app, auth, database and Cloudflare deployment, and add Studio capabilities only when their real workflow can be verified.

Reference material in Bonga Bhengu OS:

- `docs/studio-upgrade-implementation.md` — product workflow, architecture, acceptance criteria and delivery phases.
- `chatgpt-site/dist/digital-studio.html` and `digital-studio.js` — studio interface and local production interactions.
- `chatgpt-site/dist/studio-console.js`, `studio-capture.js`, and `studio-multistream.js` — source examples for scene composition, capture and stream orchestration. Their Bonga-specific APIs are not portable without their authenticated backend contracts.
- Root `AGENTS.md` — deliver a working vertical slice and do not claim integrations without end-to-end proof.

## Operator workflow

1. **Connect devices.** Ask for camera or microphone permission only when the operator activates that device. Enumerate device labels after permission. Let the operator select a camera and microphone, show a permission/error state, and stop tracks when disconnected or the page closes.
2. **Prepare Preview (PVM).** Preview is a private staging monitor. The operator may select a connected camera, a local image/video, or a configured scene. Preparing or changing Preview must not silently alter Program.
3. **Take or Cut to Program (PGM).** Explicit Take/Cut commits the staged source to Program. Program is the one output used by local recording and, when a verified broadcast service is connected, by streaming. The two monitors and their controls must fit together on a desktop screen; narrow screens may stack them.
4. **Auto Cut.** Automatic switching is opt-in, visible and stoppable. It requires at least two valid moving sources; still images are excluded. Every transition must change the actual Program source. No AI-director behavior is implied by this control.
5. **Mix audio.** Select a microphone, show that its track is connected, provide a live level meter, gain and mute, and route the selected mix into recordings and streams. Warn about unavailable devices and clipping. Never show a healthy state based on a UI toggle alone.
6. **Record.** Local browser recording must create a playable file, clearly indicate whether microphone audio is included, and offer save/download. If an authorized server-side media library is added later, show upload progress, retry, ownership, access and deletion status. Do not describe a local download as cloud storage.
7. **Go Live.** This action requires a configured and health-checked ingest service and destination. Validate destination, stream settings, entitlements and credentials before starting. Keep stream keys server-side. Start/stop must reflect the provider's actual session state. Until that backend is connected, the control must disclose that streaming is unavailable and must not claim viewers, bitrate or a live status.
8. **Guests and production tools.** Guest links require expiring tokens and WebRTC with TURN. Captions, AI scene changes, publishing, chat overlays, scheduling, analytics and media library controls must each be backed by a configured service before appearing available.

## Current Chatbliz implementation

| Workflow | Current status |
| --- | --- |
| Dual Preview and Program monitors, Take/Cut | Implemented in the browser; output is local to this device. |
| Browser camera and camera device selection | Implemented with browser permission, device selection and local preview. |
| Local image/video source selection | Implemented; files remain in this browser and are not uploaded. |
| Auto Cut | Implemented between at least two moving local sources at an 8-second interval; explicit and stoppable. |
| Microphone, gain, mute and level meter | Implemented as a local browser input. Microphone is added to new local recordings when connected and unmuted. |
| Local recording / basic podcast capture | Implemented as WebM download; includes microphone audio when connected. This is not a multi-track editor, cloud recording library or podcast publisher. |
| Public live stream, stream ingest, guests, multi-device/phone ingest, cloud media library | Not configured; do not represent these as working. |
| Scene compositor, overlays, AI director, social destinations, captioning and production analytics | Not implemented as real workflows in Chatbliz yet. |

The Studio is a local production surface, not an end-to-end broadcast product. A production stream still needs a maintained ingest service (for example, MediaMTX or SRS) and a tested bridge from the browser's Program output to RTMP/SRT/WebRTC destinations. Browser WebRTC signaling and TURN, server-side stream-key handling, session health, and a secured upload/media service require separate, authenticated service integrations. Do not expose Docker or host-control sockets to a browser-facing agent.

## Integration architecture when ready

- Keep the browser UI as the control surface, using the existing Chatbliz session and authorization boundaries.
- Put source/session authorization and destination credentials behind authenticated Chatbliz APIs.
- Use a scene compositor/encoder and a maintained ingest service for multi-destination output; instrument actual session state and fail closed on unhealthy ingest.
- Use WebRTC signaling with TURN for remote guests and remote camera contribution. Scope and expire room tokens.
- Store production metadata in the app's authorized database and media in an explicitly selected object-storage service. Check ownership, quotas, visibility, deletion and recovery.
- Keep provider keys server-side. Add health checks, structured logs, rate limits, timeouts and retry rules that cannot duplicate a broadcast start.
- Integrate any open-source component only after verifying license, maintenance, dependencies and security posture. Add it behind an API contract and tests, not by running unreviewed code in production.

## Release gates

- Permission denied, device absent, device switched and device disconnected are visible and recoverable.
- Taking a source changes Program while Preview stays a staging area.
- Auto Cut is disabled with fewer than two moving sources, switches Program when enabled, and stops cleanly.
- A downloaded recording plays and has the expected video and optional microphone audio tracks; gain affects the recorded microphone path.
- Go Live cannot claim success unless a real destination session starts and provider health confirms it.
- Guest access uses expiring, authorized tokens; media access is private by default.
- Buttons either perform their documented operation or explain the unmet dependency.
- Desktop one-screen layout has no overlapping controls; mobile layout remains usable.
- Browser/device tests and backend integration tests pass for the capabilities being released.

## Suggested delivery order

1. Device permission and source selection, Preview/Program, audio mix and local recording (current browser-first slice).
2. Authorized saved recording library, resumable media upload, scene composition and graphics.
3. Guest contribution and real broadcast ingest/destinations, with provider health and rollback.
4. Captions, AI production assistance, scheduling and analytics after their services and privacy controls are verified.
