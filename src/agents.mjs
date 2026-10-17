export const SKILLS = Object.freeze([
  { id: "scheduler", name: "Scheduler", icon: "📅", description: "Propose meeting times and reminders." },
  { id: "seo", name: "SEO Analyzer", icon: "🔎", description: "Suggest on-page SEO improvements and keywords." },
  { id: "copy", name: "Copywriter", icon: "✍", description: "Draft short marketing copy and CTAs." }
]);

export async function runSkill(id, message) {
  const text = String(message ?? "").trim().slice(0, 2000);
  switch (id) {
    case "scheduler":
      return `Scheduler suggests: Propose three meeting times to discuss "${text.slice(0,80)}" and add a reminder.`;
    case "seo": {
      const words = (text.match(/\b[\w']{4,}\b/g) || []).slice(0, 5);
      return `SEO Analyzer: suggested focus keywords — ${words.join(", ") || "(no strong keywords found)"}. Consider titles and meta descriptions.`;
    }
    case "copy":
      return `Copywriter draft: "${text.slice(0,120)}" — polish for clarity, add a single strong CTA.`;
    default:
      return "";
  }
}
