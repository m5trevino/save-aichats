# 💀 THE WASHHOUSE: AI LOG REFINERY (GENESIS DOSSIER)

**PROJECT CODENAME:** THE WASHHOUSE  
**VERSION:** 1.0 (PROTOTYPE ARCHITECTURE)  
**STATUS:** VERIFIED LOGIC MAP  

---

## 1. THE MISSION (THE "WHY")
Raw AI exports (Gemini, Claude, ChatGPT) are built for machine consumption, not human review. They are cluttered with metadata, fragmented "chunks," and complex nested branches. 

**THE WASHHOUSE** is a public utility designed to act as a digital washroom. Users drop their "dirty" JSON logs, surgically select the data they care about—**User Input, Bot Response, or Internal Reasoning (Thoughts)**—and receive a "pressed" Markdown or Text file that is verbatim and high-fidelity.

---

## 2. THE STACK (THE "HOW")
We are utilizing a **Dual-Core System** to ensure high-bandwidth processing without crashing the client or server.

*   **FRONTEND (THE BODY):** Next.js 15 + Tailwind CSS + Framer Motion.
    *   *Visual Doctrine:* Void Black (#050505), Matrix Green (#00FF41), High-Voltage Yellow.
    *   *Physics:* Mechanical snaps, text descrambling, and industrial high-density layouts.
*   **BACKEND (THE BRAIN):** FastAPI (Python).
    *   *Streaming Engine:* `ijson` for iterative parsing. It streams the JSON file, meaning it can process a 100MB chat log while only using a few MB of RAM.
*   **BUNDLING:** `ZipStream` for backend or `JSZip` for frontend to deliver multi-file hauls in a single package.

---

## 3. CORE FUNCTIONAL REGISTRY

### A. `inspectPayload(file)`
*   **LOGIC:** Scans the root keys of the uploaded JSON.
*   **WHY:** To identify the "Brand" (Gemini, Claude, or ChatGPT). Each brand has a different proprietary language. This function tells the engine which forensic map to use.

### B. `refineDataStream(jsonContent)`
*   **LOGIC:** Iterates through the data arrays using a **"Push or Merge"** strategy.
*   **WHY:** AI responses arrive in fragments. If we just pull them, the text stutters. 
*   **forensics:** `pushOrMerge` checks if the current chunk's role matches the last one. If yes, it welds them together. If no, it starts a new block.

### C. `applySelectionLogic(extractedArray, filters)`
*   **LOGIC:** The interface between the user's checkboxes and the data.
*   **WHY:** Gives the user total authority. If they uncheck "Thoughts," this function surgically deletes those objects before they hit the final document.

### D. `followCurrentBranch(mapping, root_id)` [PLAY A - CHATGPT ONLY]
*   **LOGIC:** Navigates the ChatGPT Tree Structure.
*   **WHY:** ChatGPT branches when you edit or regenerate. Play A follows the "Last Child" path—the final version you kept—discarding all rejected versions to keep the file clean.

### E. `renderHumanizedString(filteredArray, format)`
*   **LOGIC:** Injects the **Visual Doctrine** into the text.
*   **WHY:** Provides landmarks. Adds `===== USER ENTRY =====` and `----- BOT RESPONSE -----` dividers so the human eye can navigate the intel effortlessly.

### F. `generateFilename(chatMetadata)`
*   **LOGIC:** Sanitizes titles and adds `YYYYMMDD` prefixes.
*   **WHY:** Automates logistics. Ensures the user's vault remains organized and searchable.

### G. `bundleAndCompress(fileList)`
*   **LOGIC:** Bundles Markdown/Text files into a `.zip`.
*   **WHY:** Click-economy. It’s illogical to make a user download 500 chats individually.

### H. `omertaPurge()`
*   **LOGIC:** Stateless cleanup.
*   **WHY:** Real recognizes real. We burn the tracks. Once the download is sent, all memory/temp data is wiped to ensure user privacy.

---

## 4. THE USER EXPERIENCE (UX)
1.  **Ingestion:** User drags and drops `conversations.json`.
2.  **Calibration:** User selects checkboxes for [User], [Bot], [Thoughts].
3.  **Refinery:** The engine parses the data based on the identified brand.
4.  **Extraction:** The user receives a high-fidelity ZIP archive of their entire history.

**LA UNICA COSA:** This is the most efficient system for archiving AI interaction. It respects the logic of the architect and the privacy of the user.

