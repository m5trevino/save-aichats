#!/bin/bash

# ==============================================================================
# NEXUS INTEL WRAPPER PROTOCOL
# TARGET: Specific list of .og.txt files
# ACTION: Prepend Header -> Append Content -> Append Footer -> Save as New Name
# ==============================================================================

# 1. DEFINE WRAPPER CONTENT
# Using read -r -d '' to handle multiline strings safely

read -r -d '' HEADER_TEXT << 'EOT'
ACT AS THE "NEXUS DEBRIEFER" — an elite intelligence triage officer with zero tolerance for fabrication or assumption.

MISSION: Analyze this raw transcript and synthesize it into one or more high-fidelity STRATEGIC BLUEPRINTS. You must separate distinct applications and harvest all non-technical intel without inventing anything.

RAW TRANSCRIPT:





=====
EOT

read -r -d '' FOOTER_TEXT << 'EOT'
=====


### EXECUTION
1.  Overwrite `server.py` and `templates/index.html`.
2.  Restart the server: `python3 server.py`
3.  Refresh the browser.

The description pane will no longer be blank. If a job has data, it shows. If it fails, it shows the error message in Red.
"""

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
- Title each blueprint accurately based only on evidence.
- End with: "NEXUS DEBRIEF COMPLETE. Awaiting SPARK analysis."
- NO additional commentary, explanations, or chatter outside the blueprints.
EOT

# 2. DEFINE TARGET FILES
FILES=(
"/home/flintx/indeed-trevino_war_room/11.29.25.copy.of.format.restoration.error.og.txt"
"/home/flintx/indeed-trevino_war_room/12.01.25.branch.of.copy.of.copy.of.format.restoration.error.og.txt"
"/home/flintx/indeed-trevino_war_room/12.01.25.branch.of.organizing.log.data.chronologically.og.txt"
"/home/flintx/indeed-trevino_war_room/12.01.25.copy.of.copy.of.current.code.issues.og.txt"
"/home/flintx/indeed-trevino_war_room/12.01.25.copy.of.copy.of.format.restoration.error.og.txt"
"/home/flintx/indeed-trevino_war_room/12.01.25.copy.of.current.code.issues.1.og.txt"
"/home/flintx/indeed-trevino_war_room/12.01.25.copy.of.current.code.issues.og.txt"
"/home/flintx/indeed-trevino_war_room/12.01.25.current.code.issues.og.txt"
"/home/flintx/indeed-trevino_war_room/12.01.25.organizing.log.data.chronologically.og.txt"
"/home/flintx/indeed-trevino_war_room/12.03.25.copy.of.geminiextractchatjson.og.txt"
"/home/flintx/indeed-trevino_war_room/12.03.25.geminiextractchatjson.og.txt"
"/home/flintx/indeed-trevino_war_room/12.07.25.trevinowarroom.og.txt"
"/home/flintx/indeed-trevino_war_room/12.08.25.copy.of.copy.of.trevinowarroom.og.txt"
"/home/flintx/indeed-trevino_war_room/12.08.25.copy.of.trevinowarroom.og.txt"
"/home/flintx/indeed-trevino_war_room/12.09.25.trevino.war.room.architecture.explained.og.txt"
"/home/flintx/indeed-trevino_war_room/12.12.25.ai.technical.documentation.protocol.og.txt"
"/home/flintx/indeed-trevino_war_room/12.12.25.architecture.before.execution.og.txt"
"/home/flintx/indeed-trevino_war_room/12.12.25.heredocs.unlocking.their.hidden.potential.og.txt"
"/home/flintx/indeed-trevino_war_room/12.12.25.repo.update.and.dataset.review.og.txt"
"/home/flintx/indeed-trevino_war_room/12.13.25.technical.documentation.standard.protocol.copy.og.txt"
"/home/flintx/indeed-trevino_war_room/12.13.25.technical.documentation.standard.protocol.og.txt"
"/home/flintx/indeed-trevino_war_room/12.13.25.test.the.steel.og.txt"
"/home/flintx/indeed-trevino_war_room/12.15.25.copy.of.post.mortem.of.a.failure.copy.og.txt"
"/home/flintx/indeed-trevino_war_room/12.15.25.copy.of.post.mortem.of.a.failure.og.txt"
"/home/flintx/indeed-trevino_war_room/12.16.25.copy.of.copy.of.post.mortem.of.a.failure.copy.og.txt"
"/home/flintx/indeed-trevino_war_room/12.16.25.copy.of.copy.of.post.mortem.of.a.failure.og.txt"
"/home/flintx/indeed-trevino_war_room/12.17.25.crash.postmortem.and.resolution.og.txt"
"/home/flintx/indeed-trevino_war_room/12.17.25.no.unsolicited.code.og.txt"
"/home/flintx/indeed-trevino_war_room/12.17.25.no.unsolicited.code.we.clear.og.txt"
"/home/flintx/indeed-trevino_war_room/12.17.25.test.the.steel.architecture.challenge.og.txt"
)

# 3. EXECUTE WRAPPER
echo "---------------------------------------------------"
echo "[⚡] INITIATING NEXUS WRAPPER PROTOCOL..."

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        # GENERATE NEW FILENAME
        # Replaces .og.txt with .software-architect.wrapped.txt
        new_file="${file/.og.txt/.software-architect.wrapped.txt}"
        
        # WRITE HEADER -> ORIGINAL CONTENT -> FOOTER
        echo "$HEADER_TEXT" > "$new_file"
        cat "$file" >> "$new_file"
        echo "$FOOTER_TEXT" >> "$new_file"
        
        echo "  -> [WRAPPED] $(basename "$new_file")"
    else
        echo "  -> [ERROR] Source file missing: $file"
    fi
done

echo "---------------------------------------------------"
echo "PROTOCOL COMPLETE. ALL ASSETS SECURED."
