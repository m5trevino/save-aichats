#!/bin/bash

# ============================================================
# CONFIGURATION
# ============================================================
DEST_DIR="/home/flintx/aistudio-nexus3"
mkdir -p "$DEST_DIR"

# Colors for output
GREEN='\033[1;92m'
CYAN='\033[1;96m'
RED='\033[1;31m'
NC='\033[0m'

echo -e "${CYAN}[INITIALIZING] Mass Nexus Wrapping Protocol...${NC}"

# ============================================================
# 1. DEFINE HEADER (The Prompt)
# ============================================================
cat << 'HEAD_EOF' > /tmp/nexus_mass_header.txt
ACT AS THE "NEXUS DEBRIEFER" — an elite intelligence triage officer with zero tolerance for fabrication or assumption.

MISSION: Analyze the attached raw chat transcripts. Consolidate the brainstorming, code snippets, and architectural decisions into a single, conflict-free STRATEGIC BLUEPRINT.

INPUT CONTEXT: These files contain the evolution of "PEACOCK V19/V20". Later messages OVERRIDE earlier messages if there is a conflict (evolution of thought).

RAW TRANSCRIPT:
"""
HEAD_EOF

# ============================================================
# 2. DEFINE FOOTER (The Rules)
# ============================================================
cat << 'FOOT_EOF' > /tmp/nexus_mass_footer.txt
"""

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
# 3. DEFINE TARGET FILES
# ============================================================
TARGET_FILES=(
"/home/flintx/aistudio-490/software-architect/04.02.25.software-architect-ais.readytohelp.greeting/04.02.25.ais.readytohelp.greeting.og.txt"
"/home/flintx/aistudio-490/software-architect/04.04.25.software-architect-tech.hustle.nextlevel.play/04.04.25.tech.hustle.nextlevel.play.og.txt"
"/home/flintx/aistudio-490/software-architect/04.05.25.software-architect-restoring.system.snapshot.while.keeping.home/04.05.25.restoring.system.snapshot.while.keeping.home.og.txt"
"/home/flintx/aistudio-490/software-architect/04.06.25.software-architect-copy.of.copy.of.copy.of.tech.hustle.nextlevel.play1/04.06.25.copy.of.copy.of.copy.of.tech.hustle.nextlevel.play1.og.txt"
"/home/flintx/aistudio-490/software-architect/04.06.25.software-architect-copy.of.copy.of.tech.hustle.nextlevel.play/04.06.25.copy.of.copy.of.tech.hustle.nextlevel.play.og.txt"
"/home/flintx/aistudio-490/software-architect/04.06.25.software-architect-copy.of.tech.hustle.nextlevel.play/04.06.25.copy.of.tech.hustle.nextlevel.play.og.txt"
"/home/flintx/aistudio-490/software-architect/04.08.25.software-architect-nvidia.driver.failure/04.08.25.nvidia.driver.failure.og.txt"
"/home/flintx/aistudio-490/software-architect/04.09.25.software-architect-ubuntu.runlevel.3.using.systemd/04.09.25.ubuntu.runlevel.3.using.systemd.og.txt"
"/home/flintx/aistudio-490/software-architect/04.10.25.software-architect-branch.of.grub.configuration.explained/04.10.25.branch.of.grub.configuration.explained.og.txt"
"/home/flintx/aistudio-490/software-architect/04.10.25.software-architect-copy.of.grub.configuration.explained1/04.10.25.copy.of.grub.configuration.explained1.og.txt"
"/home/flintx/aistudio-490/software-architect/04.11.25.software-architect-grub.configuration.explained/04.11.25.grub.configuration.explained.og.txt"
"/home/flintx/aistudio-490/software-architect/04.14.25.software-architect-nvidia.driver.boot.issue.fix/04.14.25.nvidia.driver.boot.issue.fix.og.txt"
"/home/flintx/aistudio-490/software-architect/04.18.25.software-architect-installing.python.packages.via.pip/04.18.25.installing.python.packages.via.pip.og.txt"
"/home/flintx/aistudio-490/software-architect/04.20.25.software-architect-qt6.qregexp.error.fix/04.20.25.qt6.qregexp.error.fix.og.txt"
"/home/flintx/aistudio-490/software-architect/04.21.25.software-architect-python.script.issues/04.21.25.python.script.issues.og.txt"
"/home/flintx/aistudio-490/software-architect/04.24.25.software-architect-app.permissions.error.explained/04.24.25.app.permissions.error.explained.og.txt"
"/home/flintx/aistudio-490/software-architect/04.25.25.software-architect-llama.server.setup.and.configuration/04.25.25.llama.server.setup.and.configuration.og.txt"
"/home/flintx/aistudio-490/software-architect/04.25.25.software-architect-server.setup.request.for.gemma.model/04.25.25.server.setup.request.for.gemma.model.og.txt"
"/home/flintx/aistudio-490/software-architect/04.28.25.software-architect-rvc.training.troubleshooting/04.28.25.rvc.training.troubleshooting.og.txt"
"/home/flintx/aistudio-490/software-architect/04.30.25.software-architect-copy.of.copy.of.copy.of.python.modulenotfounderror.fix/04.30.25.copy.of.copy.of.copy.of.python.modulenotfounderror.fix.og.txt"
"/home/flintx/aistudio-490/software-architect/04.30.25.software-architect-llm.choice.for.powerful.system/04.30.25.llm.choice.for.powerful.system.og.txt"
"/home/flintx/aistudio-490/software-architect/05.01.25.software-architect-linux.android.studio.installation.script/05.01.25.linux.android.studio.installation.script.og.txt"
"/home/flintx/aistudio-490/software-architect/05.04.25.software-architect-questions.for.expert.x/05.04.25.questions.for.expert.x.og.txt"
"/home/flintx/aistudio-490/software-architect/05.04.25.software-architect-youtube.channel.creation.demo/05.04.25.youtube.channel.creation.demo.og.txt"
"/home/flintx/aistudio-490/software-architect/05.07.25.software-architect-branch.of.coqui.tts.demo.workflow.explanation/05.07.25.branch.of.coqui.tts.demo.workflow.explanation.og.txt"
"/home/flintx/aistudio-490/software-architect/05.07.25.software-architect-coqui.tts.demo.workflow.explanation/05.07.25.coqui.tts.demo.workflow.explanation.og.txt"
"/home/flintx/aistudio-490/software-architect/05.07.25.software-architect-justin.herbert.nfl.star.quarterback/05.07.25.justin.herbert.nfl.star.quarterback.og.txt"
"/home/flintx/aistudio-490/software-architect/05.12.25.software-architect-meningitis.types.cases.explained/05.12.25.meningitis.types.cases.explained.og.txt"
"/home/flintx/aistudio-490/software-architect/05.13.25.software-architect-automated.video.workflow.issues/05.13.25.automated.video.workflow.issues.og.txt"
"/home/flintx/aistudio-490/software-architect/05.15.25.software-architect-branch.of.oss.youtube.automation.engine.project.recap/05.15.25.branch.of.oss.youtube.automation.engine.project.recap.og.txt"
"/home/flintx/aistudio-490/software-architect/05.18.25.software-architect-dog.pain.vet.costs.and.next.steps/05.18.25.dog.pain.vet.costs.and.next.steps.og.txt"
"/home/flintx/aistudio-490/software-architect/05.18.25.software-architect-dog.pain.vet.costs.and.next.steps/05.18.25.dog.pain.vet.costs.and.next.steps.software-architect.wrapped.txt"
"/home/flintx/aistudio-490/software-architect/05.19.25.software-architect-branch.of.branch.of.branch.of.branch.of.branch.of.digital.strategy.discussion/05.19.25.branch.of.branch.of.branch.of.branch.of.branch.of.digital.strategy.discussion.og.txt"
"/home/flintx/aistudio-490/software-architect/05.19.25.software-architect-branch.of.branch.of.branch.of.branch.of.branch.of.online.reputation.management.handover/05.19.25.branch.of.branch.of.branch.of.branch.of.branch.of.online.reputation.management.handover.og.txt"
"/home/flintx/aistudio-490/software-architect/05.19.25.software-architect-branch.of.branch.of.branch.of.branch.of.digital.strategy.discussion/05.19.25.branch.of.branch.of.branch.of.branch.of.digital.strategy.discussion.og.txt"
"/home/flintx/aistudio-490/software-architect/05.19.25.software-architect-branch.of.branch.of.branch.of.branch.of.online.reputation.management.handover/05.19.25.branch.of.branch.of.branch.of.branch.of.online.reputation.management.handover.og.txt"
"/home/flintx/aistudio-490/software-architect/05.19.25.software-architect-branch.of.branch.of.branch.of.digital.strategy.discussion/05.19.25.branch.of.branch.of.branch.of.digital.strategy.discussion.og.txt"
"/home/flintx/aistudio-490/software-architect/05.19.25.software-architect-branch.of.branch.of.digital.strategy.discussion/05.19.25.branch.of.branch.of.digital.strategy.discussion.og.txt"
"/home/flintx/aistudio-490/software-architect/05.19.25.software-architect-branch.of.branch.of.online.reputation.management.handover/05.19.25.branch.of.branch.of.online.reputation.management.handover.og.txt"
"/home/flintx/aistudio-490/software-architect/05.19.25.software-architect-branch.of.digital.strategy.discussion/05.19.25.branch.of.digital.strategy.discussion.og.txt"
"/home/flintx/aistudio-490/software-architect/05.19.25.software-architect-branch.of.online.reputation.management.handover/05.19.25.branch.of.online.reputation.management.handover.og.txt"
"/home/flintx/aistudio-490/software-architect/05.19.25.software-architect-digital.strategy.discussion/05.19.25.digital.strategy.discussion.og.txt"
"/home/flintx/aistudio-490/software-architect/05.19.25.software-architect-online.reputation.management.handover/05.19.25.online.reputation.management.handover.og.txt"
"/home/flintx/aistudio-490/software-architect/05.20.25.software-architect-branch.of.branch.of.branch.of.online.reputation.management.handover/05.20.25.branch.of.branch.of.branch.of.online.reputation.management.handover.og.txt"
"/home/flintx/aistudio-490/software-architect/05.22.25.software-architect-blog.article.generation.request/05.22.25.blog.article.generation.request.og.txt"
"/home/flintx/aistudio-490/software-architect/05.22.25.software-architect-blog.article.generation.request/05.22.25.blog.article.generation.request.software-architect.wrapped.txt"
"/home/flintx/aistudio-490/software-architect/05.22.25.software-architect-blog.post.file.format/05.22.25.blog.post.file.format.og.txt"
"/home/flintx/aistudio-490/software-architect/05.22.25.software-architect-blog.post.file.format/05.22.25.blog.post.file.format.software-architect.wrapped.txt"
"/home/flintx/aistudio-490/software-architect/05.22.25.software-architect-branch.of.blog.post.file.format/05.22.25.branch.of.blog.post.file.format.og.txt"
"/home/flintx/aistudio-490/software-architect/05.22.25.software-architect-branch.of.blog.post.file.format/05.22.25.branch.of.blog.post.file.format.software-architect.wrapped.txt"
"/home/flintx/aistudio-490/software-architect/05.23.25.software-architect-intps.strategy.session/05.23.25.intps.strategy.session.og.txt"
"/home/flintx/aistudio-490/software-architect/05.25.25.software-architect-branch.of.troubleshooting.litellmollama.connection/05.25.25.branch.of.troubleshooting.litellmollama.connection.og.txt"
"/home/flintx/aistudio-490/software-architect/05.27.25.software-architect-technical.setup.and.strategy/05.27.25.technical.setup.and.strategy.og.txt"
"/home/flintx/aistudio-490/software-architect/05.28.25.software-architect-llm.text.gen.app.options/05.28.25.llm.text.gen.app.options.og.txt"
"/home/flintx/aistudio-490/software-architect/06.22.25.software-architect-new.feature.request.and.breakdown/06.22.25.new.feature.request.and.breakdown.og.txt"
"/home/flintx/aistudio-490/software-architect/07.05.25.software-architect-peacock.app.name.suggestions/07.05.25.peacock.app.name.suggestions.og.txt"
"/home/flintx/aistudio-490/software-architect/07.06.25.software-architect-python.error.diagnosis.blueprint/07.06.25.python.error.diagnosis.blueprint.og.txt"
"/home/flintx/aistudio-490/software-architect/07.08.25.software-architect-json.conversation.file.extraction/07.08.25.json.conversation.file.extraction.og.txt"
"/home/flintx/aistudio-490/software-architect/07.10.25.software-architect-branch.of.peacock.app.complex.but.flawed1/07.10.25.branch.of.peacock.app.complex.but.flawed1.og.txt"
"/home/flintx/aistudio-490/software-architect/07.10.25.software-architect-peacock.app.complex.but.flawed/07.10.25.peacock.app.complex.but.flawed.og.txt"
"/home/flintx/aistudio-490/software-architect/07.10.25.software-architect-peacock.handoff.cumulative.context.synthesis/07.10.25.peacock.handoff.cumulative.context.synthesis.og.txt"
"/home/flintx/aistudio-490/software-architect/07.11.25.software-architect-branch.of.branch.of.peacock.app.complex.but.flawed/07.11.25.branch.of.branch.of.peacock.app.complex.but.flawed.og.txt"
"/home/flintx/aistudio-490/software-architect/07.11.25.software-architect-branch.of.peacock.app.complex.but.flawed/07.11.25.branch.of.peacock.app.complex.but.flawed.og.txt"
"/home/flintx/aistudio-490/software-architect/07.11.25.software-architect-github.repo.fix.steps/07.11.25.github.repo.fix.steps.og.txt"
"/home/flintx/aistudio-490/software-architect/07.11.25.software-architect-new.script.gemini.fix/07.11.25.new.script.gemini.fix.og.txt"
"/home/flintx/aistudio-490/software-architect/07.11.25.software-architect-peacock.ai.coding.system/07.11.25.peacock.ai.coding.system.og.txt"
"/home/flintx/aistudio-490/software-architect/07.12.25.software-architect-ai.hood.hustle.plans/07.12.25.ai.hood.hustle.plans.og.txt"
"/home/flintx/aistudio-490/software-architect/07.13.25.software-architect-code.context.breakdown.for.two.scripts/07.13.25.code.context.breakdown.for.two.scripts.og.txt"
"/home/flintx/aistudio-490/software-architect/07.13.25.software-architect-llm.input.great.owl.code.refactoring/07.13.25.llm.input.great.owl.code.refactoring.og.txt"
"/home/flintx/aistudio-490/software-architect/07.13.25.software-architect-systemic.car.registration.oppression/07.13.25.systemic.car.registration.oppression.og.txt"
"/home/flintx/aistudio-490/software-architect/07.15.25.software-architect-debian.file.renaming.commands/07.15.25.debian.file.renaming.commands.og.txt"
"/home/flintx/aistudio-490/software-architect/07.15.25.software-architect-grok.3.feature.overview/07.15.25.grok.3.feature.overview.og.txt"
"/home/flintx/aistudio-490/software-architect/07.15.25.software-architect-questions.for.humans/07.15.25.questions.for.humans.og.txt"
"/home/flintx/aistudio-490/software-architect/07.16.25.software-architect-legal.issue.contradictory.service.claim/07.16.25.legal.issue.contradictory.service.claim.og.txt"
"/home/flintx/aistudio-490/software-architect/07.16.25.software-architect-substitute.service.judgment.claim.dispute/07.16.25.substitute.service.judgment.claim.dispute.og.txt"
"/home/flintx/aistudio-490/software-architect/07.17.25.software-architect-bot.explains.legal.dispute.over.service/07.17.25.bot.explains.legal.dispute.over.service.og.txt"
"/home/flintx/aistudio-490/software-architect/07.17.25.software-architect-peacock.memory.stanislaus.county.chat.access/07.17.25.peacock.memory.stanislaus.county.chat.access.og.txt"
"/home/flintx/aistudio-490/software-architect/07.17.25.software-architect-refactoring.mcp.app.output.updates/07.17.25.refactoring.mcp.app.output.updates.og.txt"
"/home/flintx/aistudio-490/software-architect/07.17.25.software-architect-substitute.service.dispute.judgment/07.17.25.substitute.service.dispute.judgment.og.txt"
"/home/flintx/aistudio-490/software-architect/07.17.25.software-architect-substitute.service.judgement.dispute/07.17.25.substitute.service.judgement.dispute.og.txt"
"/home/flintx/aistudio-490/software-architect/07.18.25.software-architect-substitute.service.judgment.dispute/07.18.25.substitute.service.judgment.dispute.og.txt"
"/home/flintx/aistudio-490/software-architect/07.19.25.software-architect-legal.analysis.setting.aside.default.judgment/07.19.25.legal.analysis.setting.aside.default.judgment.og.txt"
"/home/flintx/aistudio-490/software-architect/07.19.25.software-architect-project.blueprint.digital.ecosystem.map/07.19.25.project.blueprint.digital.ecosystem.map.og.txt"
"/home/flintx/aistudio-490/software-architect/07.21.25.software-architect-court.filing.rewrite.request/07.21.25.court.filing.rewrite.request.og.txt"
"/home/flintx/aistudio-490/software-architect/07.21.25.software-architect-pizza.hut.api.access.automation.options/07.21.25.pizza.hut.api.access.automation.options.og.txt"
"/home/flintx/aistudio-490/software-architect/07.21.25.software-architect-push.project.updates.to.github/07.21.25.push.project.updates.to.github.og.txt"
"/home/flintx/aistudio-490/software-architect/09.04.25.software-architect-how.to.play.guts/09.04.25.how.to.play.guts.og.txt"
"/home/flintx/aistudio-490/software-architect/09.06.25.software-architect-losing.in.pai.gow.poker/09.06.25.losing.in.pai.gow.poker.og.txt"
"/home/flintx/aistudio-490/software-architect/09.17.25.software-architect-aztec.mayan.tattoo.design.description/09.17.25.aztec.mayan.tattoo.design.description.og.txt"
"/home/flintx/aistudio-490/software-architect/09.17.25.software-architect-laptop.performance.troubleshooting.tips/09.17.25.laptop.performance.troubleshooting.tips.og.txt"
"/home/flintx/aistudio-490/software-architect/09.17.25.software-architect-mayan.astronaut.tattoo.design/09.17.25.mayan.astronaut.tattoo.design.og.txt"
"/home/flintx/aistudio-490/software-architect/09.17.25.software-architect-tattoo.design.mayan.astronaut.sun.god/09.17.25.tattoo.design.mayan.astronaut.sun.god.og.txt"
"/home/flintx/aistudio-490/software-architect/09.25.25.software-architect-google.ai.mode.explained/09.25.25.google.ai.mode.explained.og.txt"
"/home/flintx/aistudio-490/software-architect/09.25.25.software-architect-google.ai.mode.explained/09.25.25.google.ai.mode.explained.software-architect.wrapped.txt"
"/home/flintx/aistudio-490/software-architect/10.18.25.software-architect-forester.codes.catalytic.converter.fuel.sensor/10.18.25.forester.codes.catalytic.converter.fuel.sensor.og.txt"
"/home/flintx/aistudio-490/software-architect/11.02.25.software-architect-calfresh.calworks.benefits.suspended/11.02.25.calfresh.calworks.benefits.suspended.og.txt"
"/home/flintx/aistudio-490/software-architect/11.02.25.software-architect-car.as.generator.power.outage.solution/11.02.25.car.as.generator.power.outage.solution.og.txt"
"/home/flintx/aistudio-490/software-architect/11.02.25.software-architect-nvidias.chip.design.bottleneck.risk/11.02.25.nvidias.chip.design.bottleneck.risk.og.txt"
"/home/flintx/aistudio-490/software-architect/11.07.25.software-architect-seasonal.package.handler.job.description/11.07.25.seasonal.package.handler.job.description.og.txt"
"/home/flintx/aistudio-490/software-architect/11.08.25.software-architect-branch.of.is.perception.evil.a.nuanced.examination/11.08.25.branch.of.is.perception.evil.a.nuanced.examination.og.txt"
"/home/flintx/aistudio-490/software-architect/11.08.25.software-architect-is.perception.evil.a.nuanced.examination/11.08.25.is.perception.evil.a.nuanced.examination.og.txt"
"/home/flintx/aistudio-490/software-architect/11.13.25.software-architect-it.support.technician.job.posting/11.13.25.it.support.technician.job.posting.og.txt"
"/home/flintx/aistudio-490/software-architect/11.13.25.software-architect-ready.to.continue.our.chat/11.13.25.ready.to.continue.our.chat.og.txt"
"/home/flintx/aistudio-490/software-architect/11.16.25.software-architect-operation.deconstruct.instacart.protocol/11.16.25.operation.deconstruct.instacart.protocol.og.txt"
"/home/flintx/aistudio-490/software-architect/11.24.25.software-architect-branch.of.understanding.9d.breathworks.somatic.release/11.24.25.branch.of.understanding.9d.breathworks.somatic.release.og.txt"
"/home/flintx/aistudio-490/software-architect/11.24.25.software-architect-copy.of.branch.of.understanding.9d.breathworks.somatic.release/11.24.25.copy.of.branch.of.understanding.9d.breathworks.somatic.release.og.txt"
"/home/flintx/aistudio-490/software-architect/11.24.25.software-architect-understanding.9d.breathworks.somatic.release/11.24.25.understanding.9d.breathworks.somatic.release.og.txt"
"/home/flintx/aistudio-490/software-architect/11.26.25.software-architect-rv.ac.power.limitations/11.26.25.rv.ac.power.limitations.og.txt"
"/home/flintx/aistudio-490/software-architect/11.27.25.software-architect-branch.of.ready.for.data.input/11.27.25.branch.of.ready.for.data.input.og.txt"
"/home/flintx/aistudio-490/software-architect/11.27.25.software-architect-branchofreadyfordatainput/11.27.25.branchofreadyfordatainput.og.txt"
"/home/flintx/aistudio-490/software-architect/11.27.25.software-architect-coyote.defense.for.family.dog/11.27.25.coyote.defense.for.family.dog.og.txt"
"/home/flintx/aistudio-490/software-architect/11.27.25.software-architect-coyote.defense.for.family.dog/11.27.25.coyote.defense.for.family.dog.software-architect.wrapped.txt"
"/home/flintx/aistudio-490/software-architect/11.27.25.software-architect-ready.for.data.input/11.27.25.ready.for.data.input.og.txt"
"/home/flintx/aistudio-490/software-architect/11.27.25.software-architect-resume.job.breakdown/11.27.25.resume.job.breakdown.og.txt"
"/home/flintx/aistudio-490/software-architect/11.27.25.software-architect-system.debrief.trevino.war.room.blueprint/11.27.25.system.debrief.trevino.war.room.blueprint.og.txt"
"/home/flintx/aistudio-490/software-architect/11.27.25.software-architect-the.first.conversation.between.us/11.27.25.the.first.conversation.between.us.og.txt"
"/home/flintx/aistudio-490/software-architect/11.29.25.software-architect-format.restoration.error/11.29.25.format.restoration.error.og.txt"
"/home/flintx/aistudio-490/software-architect/11.30.25.software-architect-x/11.30.25.x.og.txt"
"/home/flintx/aistudio-490/software-architect/12.01.25.software-architect-no.tow.hook.check.your.compass/12.01.25.no.tow.hook.check.your.compass.og.txt"
"/home/flintx/aistudio-490/software-architect/12.02.25.software-architect-voltage.dictates.energy.flow/12.02.25.voltage.dictates.energy.flow.og.txt"
"/home/flintx/aistudio-490/software-architect/12.07.25.software-architect-paycheck.architecture.and.calculations/12.07.25.paycheck.architecture.and.calculations.og.txt"
"/home/flintx/aistudio-490/software-architect/12.08.25.software-architect-code.generation.protocols.locked.down/12.08.25.code.generation.protocols.locked.down.og.txt"
"/home/flintx/aistudio-490/software-architect/12.10.25.software-architect-copy.of.zsh.addon.for.python.env.activation/12.10.25.copy.of.zsh.addon.for.python.env.activation.og.txt"
"/home/flintx/aistudio-490/software-architect/12.12.25.software-architect-zsh.addon.for.python.env.activation/12.12.25.zsh.addon.for.python.env.activation.og.txt"
"/home/flintx/aistudio-490/software-architect/12.16.25.software-architect-copy.of.copy.of.the.trevino.doctrine.is.signed.copy/12.16.25.copy.of.copy.of.the.trevino.doctrine.is.signed.copy.og.txt"
"/home/flintx/aistudio-490/software-architect/12.16.25.software-architect-copy.of.copy.of.the.trevino.doctrine.is.signed/12.16.25.copy.of.copy.of.the.trevino.doctrine.is.signed.og.txt"
"/home/flintx/aistudio-490/software-architect/12.16.25.software-architect-copy.of.the.trevino.doctrine.is.signed/12.16.25.copy.of.the.trevino.doctrine.is.signed.og.txt"
"/home/flintx/aistudio-490/software-architect/12.18.25.software-architect-brainstorming.deck.of.cards.rotation/12.18.25.brainstorming.deck.of.cards.rotation.og.txt"
"/home/flintx/aistudio-490/software-architect/12.18.25.software-architect-ready.to.build.what/12.18.25.ready.to.build.what.og.txt"
"/home/flintx/aistudio-490/software-architect/12.18.25.software-architect-war.room.active.ai.command.center/12.18.25.war.room.active.ai.command.center.og.txt"
"/home/flintx/aistudio-490/software-architect/12.18.25.software-architect-war.room.v2.apex.predator.edition/12.18.25.war.room.v2.apex.predator.edition.og.txt"
)

# ============================================================
# 4. EXECUTE WRAP
# ============================================================
count=0
for file in "${TARGET_FILES[@]}"; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        dest_path="$DEST_DIR/$filename"
        
        # Combine Header + Original Content + Footer -> Destination
        cat /tmp/nexus_mass_header.txt "$file" /tmp/nexus_mass_footer.txt > "$dest_path"
        
        echo -e "${GREEN}[WRAPPED]${NC} $filename"
        ((count++))
    else
        echo -e "${RED}[MISSING]${NC} $file"
    fi
done

# Cleanup
rm /tmp/nexus_mass_header.txt /tmp/nexus_mass_footer.txt

echo -e "\n${CYAN}[MISSION COMPLETE]${NC} $count files secured in $DEST_DIR"

