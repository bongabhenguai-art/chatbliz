# Chatbliz Studio: open-source AI engine

## Selected stack

- [ComfyUI](https://github.com/Comfy-Org/ComfyUI) is the self-hosted workflow runner and model interface. Its server API can be called by a Chatbliz Worker; Chatbliz will not bundle or replace the existing Cloudflare app with ComfyUI.
- [Wan 2.2](https://github.com/Wan-Video/Wan2.2) is the video model and inference code. The upstream repository publishes its code and models under Apache 2.0. Start with the 5B text-and-image-to-video workflow so an operator can provide a still frame from a local image or camera; the official ComfyUI guide says this workflow can fit an 8 GB VRAM GPU. The main model files still need about 17 GB of disk space.
- [Official ComfyUI Wan 2.2 workflow](https://github.com/Comfy-Org/workflow_templates/blob/main/templates/video_wan2_2_5B_ti2v.json) is the starting workflow. Preserve upstream attribution and check the template and model terms before redistribution.

ComfyUI is GPL-3.0. Chatbliz should connect to a separately installed ComfyUI process over an authenticated service boundary rather than copy ComfyUI source into this repository. Wan 2.2 is Apache 2.0; retain the upstream license notices if its code or model files are redistributed.

## Chatbliz integration boundary

Keep the existing Cloudflare Worker, D1 database, account sessions, Studio interface and Preview/Program controls. Add the open-source model runner behind an authenticated Worker service adapter:

1. AI Director accepts an operator's explicit prompt and optional still frame.
2. Chatbliz validates the signed-in owner, input type, size and prompt, records a job under that account in D1, then submits a Wan workflow to the self-hosted ComfyUI server.
3. The Studio polls the owner-scoped job status and only adds a generated file to Preview after ComfyUI reports success.
4. Take/Cut is still a separate operator action to put the scene on Program.
5. Video retrieval must use the authenticated Chatbliz route, not expose ComfyUI access credentials or its private host address to the browser.

Place ComfyUI behind a Cloudflare Tunnel and Cloudflare Access service token (or an equivalent private authenticated link). Do not expose ComfyUI's unauthenticated port to the public internet. Keep the Access service token in Worker secrets. Store generated clips on a persistent, access-controlled volume; a disposable container filesystem is not media storage.

## Runtime and cost requirements

There is no MiniMax/Hailuo API connection in this design. The open-source software and weights do not charge a per-generation API fee. The model still needs GPU compute, disk, electricity and a reachable host. A small official 5B workflow uses large model files and at least the upstream guide's stated 8 GB VRAM target; performance depends on the GPU and settings. Cloudflare Workers and D1 host Chatbliz's control plane, not the model inference.

No GPU-backed Studio engine is currently verified for the Chatbliz deployment. Until an owner-controlled ComfyUI/Wan host is connected and an end-to-end generation test succeeds, AI Director must remain clearly marked as unavailable. Do not make “free server” or “Hailuo clone” claims that imply zero compute cost, equivalent output quality, or a live AI feature.

## Release checks before enabling AI Director

- Confirm the model host is owner-controlled, persistent and behind authentication.
- Confirm Wan 2.2 files, ComfyUI version and workflow nodes are installed and licensed for the intended use.
- Submit a real test prompt through Chatbliz and confirm queue, error and completion states.
- Verify D1 owner scoping for job status and media retrieval.
- Verify the returned video is playable, retained on persistent storage, and loaded into Preview only after success.
- Confirm the model can be stopped and restarted without losing the job store or exposing the host.
