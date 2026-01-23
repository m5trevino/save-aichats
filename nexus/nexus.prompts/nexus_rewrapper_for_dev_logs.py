#!/usr/bin/env python3

import sys
from pathlib import Path

# ==================== FULL UPGRADED NEXUS PROMPT ====================
NEXUS_PROMPT = """ACT AS THE "NEXUS DEBRIEFER" — an elite intelligence triage officer with zero tolerance for fabrication or assumption.

MISSION: Analyze this raw transcript and synthesize it into one or more high-fidelity STRATEGIC BLUEPRINTS. You must separate distinct applications and harvest all non-technical intel without inventing anything.

RAW TRANSCRIPT:
\"\"\"
{INPUT CHAT LOG}
\"\"\"

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
- NO additional commentary, explanations, or chatter outside the blueprints."""

# ==================== RE-WRAPPER CORE ====================
def nexus_rewrap_dev_logs(refinery_dir: str):
    root = Path(refinery_dir)
    if not root.is_dir():
        print(f"[ERROR] Refinery output not found: {refinery_dir}")
        sys.exit(1)

    processed = 0
    for folder in root.iterdir():
        if not folder.is_dir():
            continue

        if "software-architect" not in folder.name:
            continue  # Only target development logs

        original = folder / "original.txt"
        if not original.exists():
            continue

        raw_content = original.read_text()

        # Apply full NEXUS prompt
        nexus_wrapped = NEXUS_PROMPT.replace("{INPUT CHAT LOG}", raw_content)

        # Overwrite the old wrapped file (usually the .txt with protocol slug)
        wrapped_files = [f for f in folder.glob("*.txt") if f.name != "original.txt"]
        if wrapped_files:
            target = wrapped_files[0]
        else:
            base = folder.name.split(".", 2)[-1]
            target = folder / f"{base}.nexus.txt"

        target.write_text(nexus_wrapped)
        print(f"[NEXUS UPGRADED] {folder.name} → {target.name}")
        processed += 1

    print(f"\n[⚡ NEXUS RE-WRAP COMPLETE] {processed} development logs upgraded to full NEXUS debriefer")
    print("These are now ready to feed directly into SPARK → FALCON → EAGLE → HAWK")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: ./nexus_rewrapper_for_dev_logs.py <refinery_output_dir>")
        print("Example: ./nexus_rewrapper_for_dev_logs.py aistudio_refinery_v3_output")
        sys.exit(1)

    nexus_rewrap_dev_logs(sys.argv[1])

