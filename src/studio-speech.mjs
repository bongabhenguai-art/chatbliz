// Studio service for authorized server-side use only.
// A customer-facing route must first verify account access and usage limits.
const VOICES = new Set(["male-qn-qingse", "female-shaonv", "presenter_male", "presenter_female"]);
export function createStudioSpeechService({ provider, authorize }) {
  if (!provider || typeof provider.invoke !== "function") throw new TypeError("MiniMax provider required");
  if (typeof authorize !== "function") throw new TypeError("Studio authorization required");
  return {
    async generate({ userId, businessId, text, voice = "male-qn-qingse" }) {
      if (typeof text !== "string" || !text.trim() || text.length > 1500) {
        throw new TypeError("Speech text must be 1–1500 characters");
      }
      if (!VOICES.has(voice)) throw new TypeError("Unsupported speech voice");
      const allowed = await authorize({ userId, businessId, capability: "studio.speech" });
      if (!allowed) throw Object.assign(new Error("Studio access not permitted"), { status: 403 });
      return provider.invoke({
        payload: {
          model: "speech-02-hd",
          text: text.trim(),
          stream: false,
          voice_setting: { voice_id: voice, speed: 1, vol: 1, pitch: 0 },
          audio_setting: { sample_rate: 32000, bitrate: 128000, format: "mp3", channel: 1 }
        }
      });
    }
  };
}
