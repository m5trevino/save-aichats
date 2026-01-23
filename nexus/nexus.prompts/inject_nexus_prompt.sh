#!/bin/bash

# ============================================================
# 1. CONSTRUCT THE HEADER (ROLE & CONTEXT)
# ============================================================
cat << 'HEAD_EOF' > /tmp/nexus_header_v2.txt
ACT AS THE "NEXUS DEBRIEFER" — an elite intelligence triage officer with zero tolerance for fabrication or assumption.

MISSION: Analyze the attached raw chat transcripts and synthesize them into one or more high-fidelity STRATEGIC BLUEPRINTS. You must separate distinct applications and harvest all non-technical intel without inventing anything.

INPUT CONTEXT: These logs contain brainstorming, code iterations, and architectural decisions. Note that later messages OVERRIDE earlier messages if there is a conflict (evolution of thought).

RAW TRANSCRIPT:
"""
HEAD_EOF

# ============================================================
# 2. CONSTRUCT THE FOOTER (RULES & STRUCTURE)
# ============================================================
cat << 'FOOT_EOF' > /tmp/nexus_footer_v2.txt
"""

OPERATIONAL RULES (NON-NEGOTIABLE):

1. MULTI-APP DETECTION:
   - Identify EVERY distinct application, tool, system, or project discussed.
   - Evidence required: explicit project names, tech stacks, file structures, features, purposes, or user stories.
   - If only one app is clearly discussed → produce a single blueprint.
   - If multiple → produce ONE COMPLETE, SEPARATE BLUEPRINT PER APP.
   - If none → produce one blueprint titled "TRANSCRIPT INTEL HARVEST (No Clear Applications Detected)".
   - NEVER assume an idea belongs to a separate app without concrete evidence. When in doubt, keep it in one blueprint and note ambiguity.

2. CONFLICT RESOLUTION (CHRONOLOGICAL SUPREMACY):
   - If the user says "Make it blue" in File 1, and "Actually, make it green" in File 3, the Blueprint must specify GREEN.
   - Ignore abandoned ideas unless they are explicitly marked as "Future Features."

3. NO HALLUCINATION:
   - You may ONLY use information explicitly present in the transcript.
   - Every claim (feature, idea, personal note) must be traceable to direct quotes or clear paraphrases.
   - If something is vague or missing (e.g., "Database type not specified"), explicitly state "Unclear from transcript" or "Not mentioned".

4. BLUEPRINT STRUCTURE (EXACT FORMAT PER APP):
   Output each blueprint in this precise skeleton. Use clear markdown separation between blueprints.

----------------------------------------------------------------
### STRATEGIC BLUEPRINT: [App Name / Project Title]

1. PRIME DIRECTIVE
   One sentence summarizing the core goal of THIS specific application.

2. CORE ENGINE (The "What")
   High-level purpose, success criteria, and the primary problem it solves.

3. TECHNICAL DNA (The "How")
   Exhaustive bullet list of:
   - Tech Stack (Languages, Frameworks, Libraries).
   - Database Schema & Storage Logic (IndexedDB, LocalStorage, SQL, etc.).
   - API Gateways & Integrations.
   - File Structure (if mentioned).

4. UI/UX & AESTHETICS (The "Look")
   - Color Palettes (Hex codes if available).
   - Layouts (Sidebar, HUD, Modals, etc.).
   - Animations & Transitions.
   - Specific Assets (Logo names, icon styles).

5. OPERATIONAL WORKFLOWS
   Step-by-step breakdown of how the user interacts with the app (e.g., "User clicks X -> Y happens -> Z is saved").

6. CONSTRAINTS & RISKS
   - Environment details (e.g., MX Linux, localhost-only).
   - Security requirements.
   - Performance limitations mentioned.

7. INTEL VAULT: Non-Technical Assets
   Capture EVERYTHING of potential value that is NOT directly tied to code:
   - Business ideas & Monetization strategies.
   - User Backstory & Preferences (e.g., "Likes hacker style").
   - Future wishes / "Would be cool if" items.
   - Personal notes or context found in the logs.
----------------------------------------------------------------

FINAL OUTPUT INSTRUCTION:
If multiple apps are found, separate them clearly. Do not summarize the chat logs; EXTRACT the product definitions from them.
FOOT_EOF

# ============================================================
# 3. EXECUTE THE INJECTION
# ============================================================
TARGETS=(
    "/home/flintx/peacock19.5/journey_factory_refactor_blueprintcopy.md"
    "/home/flintx/peacock19.5/model_data_consolidation_and_analysis_part_00copy.md"
    "/home/flintx/peacock19.5/model_data_consolidation_and_analysis_part_01copy.md"
)

echo -e "\n\033[1;33m[INITIATING PROMPT INJECTION]\033[0m"

for file in "${TARGETS[@]}"; do
    if [ -f "$file" ]; then
        # Create a temp file: Header + Original Content + Footer
        cat /tmp/nexus_header_v2.txt "$file" /tmp/nexus_footer_v2.txt > "${file}.tmp"
        
        # Overwrite the original file
        mv "${file}.tmp" "$file"
        
        echo -e "\033[1;32m[ARMED]\033[0m $file"
    else
        echo -e "\033[1;31m[MISSING]\033[0m $file"
    fi
done

# Cleanup
rm /tmp/nexus_header_v2.txt /tmp/nexus_footer_v2.txt

echo -e "\033[1;36m[OPERATION COMPLETE]\033[0m Targets are ready for AI processing."

