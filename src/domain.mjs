export const PARTNERS = Object.freeze([
  { id: "mentor", name: "AI Mentor", icon: "M", description: "Long-term business development and learning." },
  { id: "coach", name: "AI Coach", icon: "C", description: "Daily priorities, accountability and progress." },
  { id: "assistant", name: "AI Assistant", icon: "A", description: "Work organization, drafts and scheduling plans." },
  { id: "advisor", name: "AI Advisor", icon: "D", description: "Business decisions, risks and options." },
  { id: "negotiator", name: "AI Negotiator", icon: "N", description: "Customer objections and offer preparation." }
]);

export const PRODUCTS = Object.freeze([
  { id: "business", name: "My Business", icon: "⌂", description: "Plan daily operations, sales, customers and next actions.", status: "Planning workspace" },
  { id: "brand", name: "My Brand", icon: "✳", description: "Understand your public visibility and build a stronger brand.", status: "Search connection required" },
  { id: "website", name: "My Website & App", icon: "▤", description: "Shape website and app requirements, then build and review.", status: "Builder connection required" },
  { id: "content", name: "My Studio", icon: "◉", description: "Plan image, video, podcast and livestream content.", status: "Studio connection required" }
]);

export const PACKAGES = Object.freeze([
  { name: "Starter", price: "R299", badge: "", details: ["Business profile dashboard", "Sales Assistant", "Legal guide", "Mentor and Advisor"] },
  { name: "Growth", price: "R499", badge: "TEAM", details: ["Everything in Starter", "Expanded AI partner team", "Business Coach", "Executive team support"] },
  { name: "Studio", price: "R899", badge: "8 PROFILES", details: ["Expanded team and eight profiles", "Limited Digital Studio access", "Content planning workspace"] },
  { name: "Enterprise", price: "Custom", badge: "BY QUOTE", details: ["Unlimited assistants by agreement", "Custom team and business setup", "R2,000–R1,000,000 per month"] }
]);

const partnerRules = [
  ["negotiator", /negotiat|objection|counteroffer|close (?:a |the )?sale|deal/i],
  ["mentor", /mentor|teach|learn|lesson|train me/i],
  ["coach", /coach|goal|accountab|improve|priorit/i],
  ["assistant", /assistant|schedule|appointment|remind|draft|organize/i],
  ["advisor", /advi[sc]|compare|risk|competitor|pricing|decision/i]
];
const productRules = [
  ["website", /website|web app|build (?:an? )?app/i],
  ["content", /studio|podcast|video|livestream|content/i],
  ["brand", /brand|visibility|online presence|search my business/i],
  ["business", /business|sales|crm|lead|customer|grow/i]
];

export function preparePlan(message) {
  const text = String(message ?? "").trim().slice(0, 4000);
  if (!text) throw new Error("Write a message first.");
  const partnerIds = partnerRules.filter(([, rule]) => rule.test(text)).map(([id]) => id);
  const productId = productRules.find(([, rule]) => rule.test(text))?.[0] ?? "business";
  const partnerNames = (partnerIds.length ? partnerIds : ["assistant"]).map(id => PARTNERS.find(item => item.id === id).name);
  const product = PRODUCTS.find(item => item.id === productId);
  return {
    message: text,
    partners: partnerNames,
    product,
    status: "plan-prepared",
    execution: "not-connected",
    response: `${partnerNames.join(" and ")} can help with ${product.name}. I’ve prepared this as a planning request. ${product.status}. No external action has been taken.`
  };
}
