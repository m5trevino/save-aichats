#!/bin/bash

# ============================================================
# 1. THE HEADER (THE BRAIN)
# ============================================================
cat << 'HEAD_EOF' > /tmp/nexus_header_v3.txt
ACT AS THE "NEXUS DEBRIEFER" — an elite intelligence triage officer.

MISSION: Analyze the attached raw chat transcripts. Consolidate the brainstorming, code snippets, and architectural decisions into a single, conflict-free STRATEGIC BLUEPRINT.

INPUT CONTEXT: These files contain the evolution of "PEACOCK V19/V20". Later messages override earlier ones.

HEAD_EOF

# ============================================================
# 2. THE FOOTER (THE LAW)
# ============================================================
cat << 'FOOT_EOF' > /tmp/nexus_footer_v3.txt

OPERATIONAL RULES (NON-NEGOTIABLE):

1. CHRONOLOGICAL SUPREMACY:
   - The chat logs are a timeline. If the user says "Make it Blue" in Part 00 and "Make it Green" in Part 01, the Blueprint must specify GREEN.
   - Ignore abandoned ideas. Only capture the final "agreed upon" state.

2. THE "ANTI-SNIPPET" PROTOCOL (CRITICAL):
   - You are FORBIDDEN from outputting "naked" code blocks.
   - EVERY piece of code or text file you generate must be wrapped in a Bash Heredoc command with a filename.
   - FORMAT: 
     cat << 'EOF' > [filename.ext]
     [content]
     EOF
   - If you do not provide this header, the system will fail. DO NOT use markdown titles like "**filename.js**". Use the COMMAND only.

3. MULTI-APP DETECTION:
   - If the logs discuss multiple distinct apps, separate them into distinct Blueprints.

4. BLUEPRINT STRUCTURE:
   Output the analysis in this format:

   ### STRATEGIC BLUEPRINT: [App Name]
   1. PRIME DIRECTIVE (1 sentence goal)
   2. CORE ENGINE (The logic/state machine)
   3. TECHNICAL DNA (Stack, Database, API Gateways)
   4. UI/UX SPECIFICATION (Colors, Layouts, Animations)
   5. OPERATIONAL WORKFLOW (Step-by-step user journey)
   6. INTEL VAULT (User backstory, preferences, non-technical notes)

   If you find actual code that needs to be preserved, output it using the ANTI-SNIPPET PROTOCOL defined in Rule #2.

FOOT_EOF

# ============================================================
# 3. EXECUTE INJECTION
# ============================================================
TARGETS=(
    "/home/flintx/peacock19.5/journey_factory_refactor_blueprintcp.md"
    "/home/flintx/peacock19.5/model_data_consolidation_and_analysis_part_00cp.md"
    "/home/flintx/peacock19.5/model_data_consolidation_and_analysis_part_01cp.md"
)

echo -e "\n\033[1;33m[INITIATING NEXUS V3 INJECTION]\033[0m"

for file in "${TARGETS[@]}"; do
    if [ -f "$file" ]; then
        # Sandwich: Header + Content + Footer
        cat /tmp/nexus_header_v3.txt "$file" /tmp/nexus_footer_v3.txt > "${file}.tmp"
        mv "${file}.tmp" "$file"
        echo -e "\033[1;32m[SECURED]\033[0m $file"
    else
        echo -e "\033[1;31m[MISSING]\033[0m $file"
    fi
done

# Cleanup
rm /tmp/nexus_header_v3.txt /tmp/nexus_footer_v3.txt

echo -e "\033[1;36m[OPERATION COMPLETE]\033[0m Targets armed with Anti-Snippet Protocol."

