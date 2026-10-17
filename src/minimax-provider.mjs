// Optional MiniMax adapter. Server-only: never import into the browser.
// An approved worker must supply a server-held key and authorize every request.
// The caller supplies a verified, allowlisted endpoint for the selected MiniMax API.
export function createMiniMaxProvider({ apiKey, endpoint, fetchImpl = fetch }) {
  if (typeof apiKey !== "string" || apiKey.length < 12) throw new TypeError("MiniMax API key is required on the server");
  let url;
  try { url = new URL(endpoint); } catch { throw new TypeError("Valid MiniMax endpoint required"); }
  if (url.protocol !== "https:" || !["api.minimax.io", "api.minimaxi.chat"].includes(url.hostname) || url.username || url.password) {
    throw new TypeError("Endpoint must use an approved MiniMax HTTPS host");
  }
  if (typeof fetchImpl !== "function") throw new TypeError("Fetch implementation required");
  return {
    async invoke({ payload, signal }) {
      if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new TypeError("Object payload required");
      const response = await fetchImpl(url.toString(), {
        method: "POST",
        headers: { "Authorization": "Bearer " + apiKey, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal
      });
      if (!response.ok) throw new Error("MiniMax provider request failed (" + response.status + ")");
      return response.json();
    }
  };
}
