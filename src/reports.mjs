// Reports are local owner imports until a private backend is connected.
export function parseReport(value) {
  const text = String(value ?? "").replace(/\r\n?/g, "\n");
  if (!text.trim() || text.length > 40000 || text.includes("\0")) throw new Error("Choose a text report under 40,000 characters.");
  const date = text.match(/^\d{4}-\d{2}-\d{2}T\S+/m)?.[0];
  const timestamp = date && Number.isFinite(Date.parse(date)) ? date : null;
  const sources = [];
  for (const match of text.matchAll(/^Source:\s*(https:\/\/\S+)/gm)) {
    try {
      const url = new URL(match[1]);
      if (url.username || url.password || !url.hostname || sources.includes(url.href)) continue;
      sources.push(url.href);
      if (sources.length === 30) break;
    } catch {}
  }
  return {text, timestamp, sources, importedAt: new Date().toISOString()};
}
export function isFresh(report, now = new Date()) {
  if (!report.timestamp) return false;
  const day = value => new Intl.DateTimeFormat("en-ZA", {timeZone:"Africa/Johannesburg", year:"numeric", month:"2-digit", day:"2-digit"}).format(new Date(value));
  return day(report.timestamp) === day(now) && Date.parse(report.timestamp) <= now.getTime() + 3600000;
}

export function whatsappReport(report) {
  const date = report.timestamp ? new Date(report.timestamp).toLocaleString("en-ZA", {timeZone:"Africa/Johannesburg"}) + " SAST" : "Date not supplied";
  return "Chatbliz — system report\n" + date + "\nImported report; findings require review.\n\n" + report.text.slice(0,1200) + (report.text.length > 1200 ? "\n[Excerpt — read the full report in Chatbliz]" : "") + "\n\nEvidence:\n" + report.sources.slice(0,3).join("\n");
}
