import { Message, Prompt } from '../types';

export type ExportFormat = 'json' | 'md' | 'txt' | 'html' | 'nexus';

const NEXUS_CORE_TEMPLATE = `ACT AS "NEXUS CORE EXTRACTOR" - An elite intelligence extraction officer with zero tolerance for hallucination.

MISSION: Analyze this raw chat log and extract ALL valuable intelligence for organization, search, and future reference.

RAW CHAT LOG:
"""
{INPUT}
"""

OPERATIONAL RULES (NON-NEGOTIABLE):

1. CATEGORIZATION
Assign ONE primary category from this list:
- CODING & DEVELOPMENT
- SYSTEM & INFRASTRUCTURE
- ARCHITECTURE & DESIGN
- BUSINESS & STRATEGY
- LEGAL & COMPLIANCE
- CAREER & PROFESSIONAL
- FINANCE & ECONOMICS
- PERSONAL & LIFE
- PHILOSOPHY & WORLDVIEW
- CREATIVE & CONTENT
- LEARNING & KNOWLEDGE
- TROUBLESHOOTING & SUPPORT
- PLANNING & ORGANIZATION
- GAMING & ENTERTAINMENT
- MISCELLANEOUS

If multiple categories apply, list as: PRIMARY_CATEGORY (secondary: OTHER_CATEGORY)

2. SEMANTIC TAGS
Extract 10-20 searchable keywords/phrases that capture:
- Tools, languages, frameworks mentioned
- Project/app names
- Key concepts discussed
- Problem domains
- Technologies
- File names mentioned
- Important entities (people, companies, products)

3. APP/PROJECT DETECTION
If chat involves ANY app, project, or system (built, partial, or just idea):
- app_detected: true/false
- app_name: [name or "Unnamed X Tool"]
- development_stage: idea/prototype/beta/production/abandoned
- completion_percentage: [0-100]
- what_exists: [list of implemented features/files]
- what_missing: [list of planned but not done]
- buildable_from_scratch: true/false

4. INTEL VAULT
Extract valuable non-code information:
- Business ideas/strategies mentioned
- Personal preferences/context
- Life wisdom/insights
- Future plans/wishes
- Risks/concerns voiced
- Key decisions made
- Creative concepts
- Learning resources

5. SEARCH-OPTIMIZED SUMMARY
One sentence (20-40 words) capturing the essence using actual keywords from chat.

6. KEY DECISIONS
Any significant choices made (technical, business, personal, strategic).
Format: "Decided X over Y because Z"

7. STATUS & OUTCOME
- success/failed/in_progress/abandoned
- What was achieved or resolved

8. PEACOCK BUILD SPEC (if app detected)
Generate a specification that PEACOCK can use to build this app from scratch:
- Core concept (what it does)
- Problem it solves
- Key features (bullet list)
- User workflow (step-by-step)
- Tech requirements mentioned
- Constraints (MX Linux, localhost, etc.)
- UI/UX notes

OUTPUT FORMAT (JSON):
{
  "primary_category": "",
  "secondary_categories": [],
  "session_date": "",
  "status": "",
  "semantic_tags": [],
  "search_summary": "",
  "app_detected": true/false,
  "app_info": {
    "name": "",
    "stage": "",
    "completion_percentage": 0,
    "what_exists": [],
    "what_missing": [],
    "buildable": true/false
  },
  "intel_vault": {
    "business_ideas": [],
    "personal_context": [],
    "decisions": [],
    "future_plans": []
  },
  "peacock_spec": {
    "core_concept": "",
    "problem_solved": "",
    "key_features": [],
    "user_workflow": "",
    "tech_requirements": [],
    "constraints": [],
    "ui_ux_notes": ""
  },
  "files_mentioned": [],
  "key_entities": []
}

NO HALLUCINATION. Only extract what's explicitly in the chat.`;

export const formatMessageContent = (
  messages: Message[],
  format: ExportFormat,
  options: { includeCode: boolean, includeThoughts: boolean, exportTitle: string, selectedPrompt: Prompt | null }
): string => {
  const { includeCode, includeThoughts, exportTitle, selectedPrompt } = options;
  const processText = (text: string) => includeCode ? text.trim() : text.replace(/'''[\s\S]*?'''/g, '[CODE REMOVED]').trim();
  const visibleMessages = messages.filter(msg => includeThoughts || !msg.isThought);

  if (format === 'json') {
    return JSON.stringify(visibleMessages.map(m => ({ role: m.role, text: processText(m.text) })), null, 2);
  }
  if (format === 'md') {
    return `# ${exportTitle}\n\n` + visibleMessages.map(msg => `### ${msg.role.toUpperCase()}\n${processText(msg.text)}`).join('\n\n---\n\n');
  }
  if (format === 'html') {
    return `<html><body><h1>${exportTitle}</h1>${visibleMessages.map(msg => `<div><h3>${msg.role}</h3><pre>${processText(msg.text)}</pre></div>`).join('')}</body></html>`;
  }

  const rawChat = visibleMessages.map(msg => `[${msg.role.toUpperCase()}]\n${processText(msg.text)}`).join('\n\n');

  if (format === 'nexus') {
    return NEXUS_CORE_TEMPLATE.replace('{INPUT}', rawChat);
  }

  return rawChat;
};
