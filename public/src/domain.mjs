export const PARTNERS = Object.freeze([
  { id: "problem_solver", name: "AI Problem Solver", icon: "F", description: "Find the business bottleneck, plan a practical fix and measure the result." },
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

export const BUSINESS_STAGES = Object.freeze([
  { id: "rebuilding", name: "Rebuilding", prompt: "I am rebuilding my business after a setback. Help me identify the resources and customers I still have, then choose one low-cost next step." , focus: "Protect what remains and restore reliable customer activity.", firstStep: "List the resources you can use now, the customers you can still reach and the smallest offer you can deliver this week.", measure: "Available cash or resources, customer conversations and completed sales." },
  { id: "starting", name: "Starting", prompt: "I am starting a business. Help me test one customer problem and offer before I spend much money." , focus: "Test a real customer need before committing to larger costs.", firstStep: "Name one customer group, the problem they pay to solve and a simple offer you can discuss with them.", measure: "Customer conversations, requests for a next step and paid tests." },
  { id: "building", name: "Building", prompt: "I am building my business. Help me make delivery and customer follow-up more reliable." , focus: "Make the current offer easier to deliver consistently.", firstStep: "Map one customer journey from first enquiry to completed delivery and mark where work waits or repeats.", measure: "Response time, delivery time, repeat work and returning customers." },
  { id: "growing", name: "Growing", prompt: "I am growing my business. Help me check demand, profit and delivery capacity before choosing where to expand." , focus: "Grow from evidence about demand, margin and capacity.", firstStep: "Compare recent enquiries, completed sales, direct costs and available delivery capacity for one offer.", measure: "Enquiry-to-sale rate, gross margin and capacity used." }
]);

export const PACKAGES = Object.freeze([
  { name: "Starter", price: "R299", badge: "", details: ["Business profile dashboard", "Sales Assistant", "Legal guide", "Mentor and Advisor"] },
  { name: "Growth", price: "R499", badge: "TEAM", details: ["Everything in Starter", "Expanded AI partner team", "Business Coach", "Executive team support"] },
  { name: "Studio", price: "R899", badge: "8 PROFILES", details: ["Expanded team and eight profiles", "Limited Digital Studio access", "Content planning workspace"] },
  { name: "Enterprise", price: "Custom", badge: "BY QUOTE", details: ["Unlimited assistants by agreement", "Custom team and business setup", "R2,000–R1,000,000 per month"] }
]);

const partnerRules = [
  ["problem_solver", /\b(fix|fixing|broken|stuck|problem|issue|diagnos(?:e|is)|not working|doesn.t work|failed|failure|not saving|not saved|signup|sign up|database|not enough customers|more customers|more leads|low sales|losing sales|cash ?flow|bottleneck|complaint|delay)\b/i],
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

function diagnoseBusinessProblem(text) {
  if (/\b(sign ?up|signup|login|save|saving|database|not persisting|not saving|broken|bug|error|failure|not working|doesn.t work|stuck)\b/i.test(text)) {
    return {
      area: "Digital product reliability",
      assessment: "A save, sign-up or application failure is being reported. The root cause is not confirmed yet.",
      actions: [
        "Reproduce the failure with a fresh test record and capture the exact result.",
        "Trace the request from the screen through the API route to the database write.",
        "Compare the running app’s database and environment configuration with the one used for manual tests; never print secrets.",
        "Read the test record back from the same runtime database before reporting success. Return an error when the write fails."
      ],
      measure: "A test sign-up is readable from the app’s runtime database, and a failed write returns a visible error.",
      questions: ["Which action fails, and what exact message do you see?", "Does the same failure happen in preview and on the live site?"]
    };
  }

  if (/\b(no|few|more|need|find)\b.*\b(leads?|customers?|clients?|sales)\b|\b(leads?|customers?|sales)\b.*\b(low|slow|not enough|need|problem)\b/i.test(text)) {
    return {
      area: "Lead flow and sales",
      assessment: "The stated problem is getting enough suitable enquiries or converting them. The cause still needs business evidence.",
      actions: [
        "Write down the target customer, the problem they pay to solve and the offer you want them to choose.",
        "Choose one channel those customers already use and give them one clear next step, such as WhatsApp or a quote request.",
        "Record each enquiry, response time, follow-up and outcome for one week.",
        "Review where people stop responding, then adjust the offer or follow-up based on that evidence."
      ],
      measure: "Qualified enquiries per week, response time and the share of enquiries that become paying customers.",
      questions: ["What do you sell, and where do customers currently find you?", "How many enquiries and sales did you get last week?"]
    };
  }

  if (/\b(visibility|visible online|online presence|seo|google search|not found online|website traffic)\b/i.test(text)) {
    return {
      area: "Business visibility",
      assessment: "The request concerns how customers discover the business online. Chatbliz has not searched or verified your listings in this preview.",
      actions: [
        "List the business name, location, phone number, website and social pages customers should find.",
        "Check that the same name, contact details and service description appear on each owner-controlled listing.",
        "Choose one priority service and location, then prepare a useful page or post with a clear enquiry action.",
        "After an authorized connection is available, compare visits, calls and enquiries before and after the update."
      ],
      measure: "Profile completeness, relevant visits and qualified enquiries by source.",
      questions: ["What is the business name and service area?", "Which website or public business profiles do you control?"]
    };
  }

  if (/\b(cash ?flow|cashflow|profit|costs?|expenses?|pricing|margin|budget)\b/i.test(text)) {
    return {
      area: "Money and pricing operations",
      assessment: "The request concerns cash, cost or pricing pressure. There are not enough figures to identify the cause or recommend a change.",
      actions: [
        "Separate expected money in from committed money out for the next four weeks.",
        "For each main product or service, list its selling price and direct cost per sale.",
        "Mark upcoming bills, customer payments due and any amounts you are unsure about.",
        "Use the totals to identify the largest gap, then choose one action and review it weekly."
      ],
      measure: "Weekly cash position and gross margin per product or service, based on the figures you provide.",
      questions: ["Which payment or cost is creating the immediate pressure?", "What are your recent weekly sales and main direct costs?"]
    };
  }

  if (/\b(complaint|unhappy customer|refund|return customer|customer retention|bad review)\b/i.test(text)) {
    return {
      area: "Customer experience and retention",
      assessment: "The request concerns a customer experience problem. The specific cause and applicable policy need checking before promising an outcome.",
      actions: [
        "Record what the customer expected, what happened and when.",
        "Acknowledge the issue and confirm the next response time without promising an unapproved refund or remedy.",
        "Compare the case with the business’s stated policy and identify who can approve the remedy.",
        "Track resolution time and whether the same issue appears again."
      ],
      measure: "Time to first response, time to resolution and repeat complaint rate.",
      questions: ["What happened from the customer’s point of view?", "What return or service policy has the business already published?"]
    };
  }

  if (/\b(delay|late|orders?|workflow|process|staff|operations?|repeat task|bottleneck)\b/i.test(text)) {
    return {
      area: "Daily operations",
      assessment: "The request suggests a process bottleneck. The exact step causing the delay needs to be mapped.",
      actions: [
        "Write the process as steps from customer request to completed delivery.",
        "For one recent case, note who owned each step and how long it took.",
        "Mark the step that waited longest, lacked information or was repeated.",
        "Test one small change with a named owner and review the result after a week."
      ],
      measure: "Time from request to completion, overdue tasks and repeat work.",
      questions: ["Which process is delayed, and when does the delay begin?", "Who currently owns the delayed step?"]
    };
  }

  return {
    area: "Business planning",
    assessment: "I need the business problem and the result you want before I can identify a useful fix.",
    actions: ["Describe what is happening now, who it affects and what you want to be different.", "Share one recent example and any time, budget or resource limit.", "Chatbliz will turn that information into a prioritized action plan and a way to measure progress."],
    measure: "Choose one observable result after the problem and starting point are clear.",
    questions: ["What is the biggest business problem right now?", "What would a good result look like, and by when?"]
  };
}

export function preparePlan(message) {
  const text = String(message ?? "").trim().slice(0, 4000);
  if (!text) throw new Error("Write a message first.");
  const partnerIds = partnerRules.filter(([, rule]) => rule.test(text)).map(([id]) => id);
  const productId = productRules.find(([, rule]) => rule.test(text))?.[0] ?? "business";
  const partnerNames = (partnerIds.length ? partnerIds : ["assistant"]).map(id => PARTNERS.find(item => item.id === id).name);
  const product = PRODUCTS.find(item => item.id === productId);
  const solution = diagnoseBusinessProblem(text);
  const stageRules = [
    ["rebuilding", /\b(rebuild(?:ing)?|starting again|recover(?:ing|y)?|after (?:a )?setback|lost (?:my )?(?:business|shop|equipment)|business was destroyed)\b/i],
    ["starting", /\b(starting|start a business|new business|launch(?:ing)?|just started|beginning)\b/i],
    ["growing", /\b(growing|grow(?:th)?|scale|expand(?:ing)?|more locations|increase capacity)\b/i],
    ["building", /\b(building|build my business|established|improve operations|make .* reliable)\b/i]
  ];
  const stageId = stageRules.find(([, rule]) => rule.test(text))?.[0];
  const stage = BUSINESS_STAGES.find(item => item.id === stageId) ?? null;
  const problemSolving = solution.area !== "Business planning" || /\b(problem|fix|broken|stuck|not working|doesn.t work|issue|diagnos|failed|failure)\b/i.test(text);
  return {
    message: text,
    partners: partnerNames,
    product,
    status: "plan-prepared",
    execution: "not-connected",
    solution,
    stage,
    problemSolving,
    response: `${partnerNames.join(" and ")} can help with ${product.name}. I’ve prepared this as a planning request. ${stage ? `${stage.name}: ${stage.focus} First step: ${stage.firstStep} Measure: ${stage.measure}` : "Tell me whether you are rebuilding, starting, building or growing so I can tune the plan to your stage."} ${product.status}. No external action has been taken.`
  };
}
