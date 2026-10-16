export const BUSINESS_MODULES = [
  {
    "name": "Authority Control",
    "purpose": "Permissions, approvals, audit, delegated access",
    "status": "configuration required"
  },
  {
    "name": "Economic Trends",
    "purpose": "Source-backed market signals and observation",
    "status": "configuration required"
  },
  {
    "name": "Opportunity Leads",
    "purpose": "Lead qualification and market opportunity tracking",
    "status": "configuration required"
  },
  {
    "name": "Gap Fixer",
    "purpose": "Business gap diagnosis and remediation",
    "status": "configuration required"
  },
  {
    "name": "Closer Intelligence",
    "purpose": "CRM pipeline, objection handling, ethical follow-up",
    "status": "configuration required"
  },
  {
    "name": "Negotiate Intelligence",
    "purpose": "Deal terms, margins, counteroffers and approval",
    "status": "configuration required"
  },
  {
    "name": "Marketing Hooks",
    "purpose": "Channel-specific hooks, offers and experiments",
    "status": "configuration required"
  },
  {
    "name": "Content Loops",
    "purpose": "Hook-story-proof-CTA campaigns and iteration",
    "status": "configuration required"
  },
  {
    "name": "Business Fixer",
    "purpose": "Diagnosis to execution with evidence and metrics",
    "status": "configuration required"
  },
  {
    "name": "Opportunity Scraper",
    "purpose": "Permitted public business discovery with provenance",
    "status": "configuration required"
  },
  {
    "name": "AI Employees",
    "purpose": "Mentor, coach, advisor, assistant, researcher, sales and developer",
    "status": "configuration required"
  },
  {
    "name": "Sourcing & Partners",
    "purpose": "White-label, dropshipping, wholesale, suppliers and manufacturers",
    "status": "configuration required"
  },
  {
    "name": "Website & App Builder",
    "purpose": "Requirements, templates, preview and deployment readiness",
    "status": "configuration required"
  },
  {
    "name": "My Studio",
    "purpose": "Photography, video, podcast, livestream and branding assets",
    "status": "configuration required"
  }
];
export const TASK_STAGES = ["intake","triage","assigned","in progress","awaiting approval","verified","completed"];
export function createTask(brief,moduleName){const b=String(brief||"").trim();if(!b)throw new Error("Task brief is required");if(!BUSINESS_MODULES.some(x=>x.name===moduleName))throw new Error("Unknown module");return {id:"task-"+Date.now().toString(36),brief:b,module:moduleName,status:"intake",assignee:null,evidence:[],approvals:[],createdAt:new Date().toISOString()};}
export function advanceTask(task,next){if(!TASK_STAGES.includes(next))throw new Error("Invalid status");if(next==="completed"&&(!task.evidence?.length||!task.approvals?.length))throw new Error("Completion requires evidence and approval");return {...task,status:next};}
