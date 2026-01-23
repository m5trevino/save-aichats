#!/bin/bash

# ============================================================
# 1. CONSTRUCT THE HEADER (THE PROMPT)
# ============================================================
cat << 'HEAD_EOF' > /tmp/nexus_header.txt
ACT AS THE "NEXUS DEBRIEFER" — an elite intelligence triage officer with zero tolerance for fabrication or assumption.

MISSION: Analyze this raw transcript and synthesize it into one or more high-fidelity STRATEGIC BLUEPRINTS. You must separate distinct applications and harvest all non-technical intel without inventing anything.

RAW TRANSCRIPT:
HEAD_EOF

# ============================================================
# 2. CONSTRUCT THE FOOTER (THE RULES)
# ============================================================
cat << 'FOOT_EOF' > /tmp/nexus_footer.txt

OPERATIONAL RULES (NON-NEGOTIABLE):

1. MULTI-APP DETECTION:
   - Identify EVERY distinct application, tool, system, or project discussed, even if only briefly mentioned.
   - Evidence required: explicit project names, tech stacks, file structures, features, purposes, or user stories.
   - If only one app is clearly discussed → produce a single blueprint.
   - If multiple → produce ONE COMPLETE, SEPARATE BLUEPRINT PER APP.
   - If none → produce one blueprint titled "TRANSCRIPT INTEL HARVEST (No Clear Applications Detected)".
   - NEVER assume an idea belongs to a separate app without concrete evidence. When in doubt, keep it in one blueprint and note ambiguity.

2. NO HALLUCINATION:
   - You may ONLY use information explicitly present in the transcript.
   - Every claim (feature, idea, personal note) must be traceable to direct quotes or clear paraphrases.
   - If something is vague or missing → explicitly state "Unclear from transcript" or "Not mentioned".
   - Do not invent project names, features, constraints, or ideas that are not stated.

3. BLUEPRINT STRUCTURE (EXACT FORMAT PER BLUEPRINT):
   Output each blueprint in this precise skeleton. Use clear markdown separation between blueprints.

### STRATEGIC BLUEPRINT: [Descriptive Title Based Only on Transcript Evidence]

1. PRIME DIRECTIVE
   One sentence summarizing the core goal of THIS specific application, using only transcript language.

2. CORE ENGINE
   High-level purpose and success criteria, quoted or directly derived from transcript.

3. TECHNICAL DNA
   Exhaustive bullet list of:
   - Every mentioned feature, logic rule, UI element, data model, file, or technical requirement.
   - Use direct references: "User stated: '...'" or "Discussed: ..."

4. CONSTRAINTS & RISKS
   - Environment details (e.g., MX Linux, localhost-only)
   - Security, performance, or usability constraints mentioned
   - Pain points, risks, or failures explicitly voiced

5. INTEL VAULT: Non-Technical Assets for Later Extraction
   Capture EVERYTHING of potential value that is NOT directly tied to code/architecture:
   - Good ideas (business, workflow, monetization, side concepts)
   - Personal information, preferences, backstory references
   - Operational notes (tools liked/hated, environment quirks)
   - Future wishes, "would be cool if", or aspirational statements
   - Risks, concerns, or philosophical points
   - Any other stray intel
   Bullet each item with a brief quote or paraphrase and context.

FINAL OUTPUT RULES:
- Separate multiple blueprints with --- and a blank line.
- Title each blueprint accurately based only on evidence (e.g., "ROAD DAWG v7 - AI Studio Code Vault" if that's what was discussed).
- End with: "NEXUS DEBRIEF COMPLETE. Awaiting SPARK analysis."
- NO additional commentary, explanations, or chatter outside the blueprints.
FOOT_EOF

# ============================================================
# 3. EXECUTE THE WRAP
# ============================================================
TARGETS=(
    "/home/flintx/peacock19.5/journey_factory_refactor_blueprint.md"
    "/home/flintx/peacock19.5/model_data_consolidation_and_analysis_part_00.md"
    "/home/flintx/peacock19.5/model_data_consolidation_and_analysis_part_01.md"
)

echo -e "\n\033[1;33m[INITIATING NEXUS WRAP]\033[0m"

for file in "${TARGETS[@]}"; do
    if [ -f "$file" ]; then
        # Combine: Header + Original Content + Footer -> Temp File
        cat /tmp/nexus_header.txt "$file" /tmp/nexus_footer.txt > "${file}.tmp"
        
        # Overwrite original with wrapped version
        mv "${file}.tmp" "$file"
        
        echo -e "\033[1;32m[SECURED]\033[0m $file"
    else
        echo -e "\033[1;31m[MISSING]\033[0m $file"
    fi
done

# Cleanup temp files
rm /tmp/nexus_header.txt /tmp/nexus_footer.txt

echo -e "\033[1;36m[OPERATION COMPLETE]\033[0m All targets wrapped with Nexus Protocol."

