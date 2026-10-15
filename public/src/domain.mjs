export const PARTNERS = Object.freeze([
  { id: "problem_solver", name: "AI Problem Solver", icon: "F", description: "Find the business bottleneck, plan a practical fix and measure the result." },
  { id: "mentor", name: "AI Mentor", icon: "M", description: "Long-term business development and learning." },
  { id: "coach", name: "AI Coach", icon: "C", description: "Daily priorities, accountability and progress." },
  { id: "assistant", name: "AI Assistant", icon: "A", description: "Work organization, drafts and scheduling plans." },
  { id: "advisor", name: "AI Advisor", icon: "D", description: "Business decisions, risks and options." },
  { id: "negotiator", name: "AI Negotiator", icon: "N", description: "Customer objections and offer preparation." },
  { id: "hunter", name: "AI Hunter", icon: "H", description: "Find and qualify opportunities from evidence and owner-approved sources." },
  { id: "fishing", name: "AI Fishing Agent", icon: "F", description: "Plan customer follow-up and retention; outreach needs approval and a connected channel." },
  { id: "closer", name: "AI Closer", icon: "C", description: "Prepare quote conversations and objection responses without making commitments." },
  { id: "researcher", name: "AI Business Researcher", icon: "R", description: "Organize public evidence and research questions; live search is not connected yet." },
  { id: "amplifier", name: "AI Marketing Amplifier", icon: "A", description: "Prepare brand-consistent content and campaign drafts; publishing needs a connected channel." },
  { id: "builder", name: "AI Builder & Fixer", icon: "B", description: "Structure customer builds and technical repair steps; live code changes need approval." }
]);

export const OPERATING_MODULES = Object.freeze([
  { id: "discovery", name: "Business Discovery", area: "MY BRAND", state: "Planning · live search not connected", summary: "Collect a business name, location, website and public profile links; prepare a visibility checklist and evidence plan.", input: "Owner-provided business details and public URLs", output: "Organized profile facts, missing evidence and next-step questions", prompt: "Help me discover and improve my business visibility. First ask for my exact business name, service area, website and the public profile links I own. Separate verified facts from information I still need to check." , workspace: "brand" },
  { id: "connections", name: "Connection Wizard", area: "MY BRAND", state: "Official authorization required", summary: "Plan connections to social, search and customer channels. Customers should authorize through each provider, never share a password with Chatbliz.", input: "Selected platform and owner-approved account", output: "Provider setup checklist and callback requirements", prompt: "Help me prepare an official connection for a business social or search platform. Ask which platform and account I own, then give me the provider's setup steps. Do not claim the account is connected." , workspace: "brand" },
  { id: "twin", name: "Business Digital Twin", area: "MY BUSINESS", state: "Profile, conversations & tasks save", summary: "Keep the owner-entered business profile, conversation history, customer build notes and tasks together in this private account.", input: "Owner-entered profile, plans and project feedback", output: "Saved workspace context and follow-up tasks", prompt: "Review my saved business profile and tasks with me. Ask before changing business details, and help me choose the next measurable action." , workspace: "business" },
  { id: "sales", name: "Sales & Follow-up", area: "MY BUSINESS", state: "Planning · CRM not connected", summary: "Use enquiry, offer and follow-up details to prepare a lead plan. No leads are scraped, contacted or tracked automatically.", input: "Owner-entered offer, enquiry count and follow-up outcomes", output: "Lead-flow plan, conversation prompts and tracking measures", prompt: "Help me improve sales and follow-up. Ask what I sell, who buys it, how many recent enquiries I received and what happened after each enquiry. Prepare a tracking plan; do not contact anyone." , workspace: "business" },
  { id: "builder", name: "Website & App Builder", area: "MY WEBSITE & APP", state: "Customer briefs save · code publishing not connected", summary: "Save a separate build brief and customer lesson for each project; review code and hosting connections before publication.", input: "Customer, business need, build goal and owner-entered lesson", output: "Saved project brief and next-step plan", prompt: "Help me plan the next step for a customer website or app. Ask which customer build I mean, use only that project's saved lesson and clearly label anything that still needs developer or hosting access." , workspace: "website" },
  { id: "studio", name: "Creative Studio", area: "MY STUDIO", state: "Local camera/media preview & recording", summary: "Preview and take a browser camera or local media source, then record supported program video to a local download. No cloud upload or public livestream is connected.", input: "Browser camera permission or owner-selected local media", output: "Local preview/program output and downloadable recording", prompt: "Help me plan a Studio recording for my business. Ask what I want customers to understand, the channel and format, and what media I already have. Tell me that livestream and publishing connections are not active." , workspace: "content" },
  { id: "execution", name: "Execution & Approvals", area: "MY BUSINESS", state: "Durable plan review · external actions not connected", summary: "Prepare a saved task plan in a durable workflow, then record the owner's approval or rejection. Outbound messages, publishing, bookings, payments and deployment still require connected services.", input: "An owner-scoped saved task and its source conversation", output: "Persisted review plan and owner decision", prompt: "Turn my approved business plan into clear tasks with an owner, next action and measure. Do not send messages, publish content, spend money or change live systems." , workspace: "business" },
  { id: "performance", name: "Business Performance", area: "MY BUSINESS", state: "Profile & task status only · analytics not connected", summary: "Use figures the owner provides to make a review plan. Chatbliz does not currently import verified leads, reach or revenue metrics.", input: "Owner-entered period, leads, quotes, sales and costs", output: "A transparent performance review and next measure", prompt: "Help me review business performance using numbers I provide. Ask for the period, enquiries, quotes, sales and direct costs. Mark missing figures as unknown and do not invent analytics." , workspace: "business" }
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
  ["hunter", /\b(find|discover|identify|more|new|qualified)\b.*\b(leads?|customers?|clients?|prospects?|opportunit(?:y|ies)|sales)\b|\b(business visibility|digital footprint|market research)\b/i],
  ["fishing", /\b(follow.?up|follow up|retention|repeat customer|returning customer|nurture|remind(?:er)?)\b/i],
  ["closer", /\b(close|closing|objection|quote conversation|sales conversation|conversion|negotiate|negotiation)\b/i],
  ["researcher", /\b(research|discover|visibility|competitor|competitors|seo|digital footprint|evidence)\b/i],
  ["amplifier", /\b(marketing|campaign|content plan|social media|publish|promotion|amplify)\b/i],
  ["builder", /\b(website|web app|build (?:an? )?app|technical repair|debug|code|broken app)\b/i],
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
  if (/\b(sign ?up|signup|login|database|not persisting|not saving|broken|bug|error|failure|not working|doesn.t work|stuck)\b/i.test(text)) {
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

  if (/\b(no|few|more|need|find)\b.*\b(leads?|customers?|clients?|sales)\b|\b(leads?|customers?|sales)\b.*\b(low|slow|not enough|need|problem)\b|\b(low|falling|declining|slow|poor)\s+(?:sales|customers?)\b|\b(?:sales|customers?)\s+(?:are|is)\s+(?:low|falling|declining|slow|poor)\b|\b(?:not enough|do not have enough|don't have enough)\s+customers?\b/i.test(text)) {
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

  if (/\b(money[- ]saving|save money|save on|reduce (?:costs?|expenses?|spending)|cut (?:costs?|expenses?|spending)|lower (?:costs?|expenses?))\b/i.test(text)) {
    return {
      area: "Cost control and pricing",
      assessment: "You want to reduce business costs. The best cuts depend on which costs protect sales, quality and reliable delivery.",
      actions: [
        "List the last month’s fixed and variable costs and separate essential delivery costs from optional spending.",
        "Compare supplier prices and recurring fees while checking quality, delivery time and cancellation terms.",
        "Estimate the effect of each proposed cut on sales, customer experience and your profit margin before changing it.",
        "Choose one low-risk cost change, record the amount saved and review the result after a month."
      ],
      measure: "Monthly costs saved, gross margin and any change in sales or customer complaints.",
      questions: ["Which costs have increased most recently?", "What must stay reliable for customers while you reduce spending?"]
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
