import os
import json
import zipfile
import io
import re
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="THE WASHHOUSE: AI LOG REFINERY")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- MODELS ---

class RefineryOptions(BaseModel):
    include_user: bool = True
    include_bot: bool = True
    include_thoughts: bool = False
    output_format: str = "md"
    base_filename: str = "WASHHOUSE_PAYLOAD"

# --- ASCII ART ASSETS ---

ASCII_PATH = "/home/flintx/website/ascii"

def get_ascii(filename: str, font_block: str = "double_blocky") -> str:
    path = os.path.join(ASCII_PATH, filename)
    if not os.path.exists(path):
        return ""
    try:
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
            # Extract specific font block if exists, otherwise return whole file
            pattern = rf"--- FONT: {font_block} ---\n(.*?)\n\n"
            match = re.search(pattern, content, re.DOTALL)
            if match:
                return match.group(1).strip()
            return content.strip()
    except:
        return ""

USER_HEADER = get_ascii("user.txt", "pagga") # pagga looks cleaner for User
GEMINI_HEADER = get_ascii("gemini.txt", "double_blocky")
CLAUDE_HEADER = get_ascii("claude.txt", "double_blocky")

# --- UTILS ---

def clean_filename(name: str) -> str:
    if not name: return "Untitled_Chat"
    cleaned = re.sub(r'[\s]+', '.', name)
    cleaned = re.sub(r'[^a-zA-Z0-9.-]', '', cleaned)
    return cleaned.strip('.')

def format_message(role: str, text: str, brand: str, index: int) -> str:
    if role == "user":
        header = f"╔═══━━━─── • ───━━━═══╗\n{USER_HEADER}\n[USER ENTRY #{str(index).zfill(3)}]\n╚═══━━━─── • ───━━━═══╝"
        return f"\n{header}\n\n{text}\n\n"
    else:
        art = GEMINI_HEADER if brand.lower() == "gemini" else CLAUDE_HEADER
        label = brand.upper()
        header = f"┎━─━─━─━─━─━─━─━─━┒\n{art}\n[{label} RESPONSE #{str(index).zfill(3)}]\n┖━─━─━─━─━─━─━─━─━┚"
        return f"\n{header}\n\n{text}\n\n"

class LogRefiner:
    def __init__(self, brand: str, options: RefineryOptions):
        self.brand = brand
        self.options = options
        self.extracted: List[Dict[str, Any]] = []

    def push_or_merge(self, role: str, text: str, is_thought: bool = False):
        if not text or not text.strip(): return
        if self.extracted:
            last = self.extracted[-1]
            if last['role'] == role and last.get('is_thought') == is_thought:
                last['text'] += "\n" + text.strip()
                return
        self.extracted.append({"role": role, "text": text.strip(), "is_thought": is_thought})

    def get_refined_content(self) -> str:
        output = []
        user_idx, bot_idx = 1, 1
        for msg in self.extracted:
            role = msg.get("role")
            if not self.options.include_thoughts and msg.get("is_thought"): continue
            if not self.options.include_user and role == "user": continue
            if not self.options.include_bot and role == "model": continue
            current_idx = user_idx if role == "user" else bot_idx
            output.append(format_message(role, msg["text"], self.brand, current_idx))
            if role == "user": user_idx += 1
            else: bot_idx += 1
        return "".join(output)

# --- BRAND HANDLERS ---

def handle_chatgpt(conv: Dict[str, Any], options: RefineryOptions) -> str:
    refiner = LogRefiner("ChatGPT", options)
    mapping = conv.get("mapping", {})
    root_id = next((node_id for node_id, node in mapping.items() if node.get("parent") is None), None)
    current_id = root_id
    while current_id:
        node = mapping[current_id]
        msg_obj = node.get("message")
        if msg_obj:
            role = msg_obj.get("author", {}).get("role")
            content = msg_obj.get("content", {})
            parts = content.get("parts", [])
            text = "".join([p if isinstance(p, str) else "" for p in parts])
            if role in ["user", "assistant"] and text.strip():
                refiner.push_or_merge("user" if role == "user" else "model", text)
        children = node.get("children", [])
        current_id = children[-1] if children else None
    return refiner.get_refined_content()

def handle_claude(chat: Dict[str, Any], options: RefineryOptions) -> str:
    refiner = LogRefiner("Claude", options)
    for m in chat.get("chat_messages", []):
        sender = m.get("sender")
        content_blocks = m.get("content", [])
        text = "".join([b.get("text", "") for b in content_blocks if isinstance(b, dict) and b.get("type") == "text"])
        refiner.push_or_merge("user" if sender == "human" else "model", text)
    return refiner.get_refined_content()

def handle_gemini(data: Dict[str, Any], options: RefineryOptions) -> str:
    refiner = LogRefiner("Gemini", options)
    chunks = data.get("chunkedPrompt", {}).get("chunks", [])
    for chunk in chunks:
        role = chunk.get("role")
        if role in ["user", "model"]:
            text = chunk.get("text", "")
            if "parts" in chunk:
                text += "".join([p.get("text", "") for p in chunk["parts"] if isinstance(p, dict) and "text" in p])
            is_thought = chunk.get("isThought", False) or any(p.get("thought") for p in chunk.get("parts", []) if isinstance(p, dict))
            refiner.push_or_merge(role, text, is_thought)
    return refiner.get_refined_content()

# --- ENDPOINTS ---

@app.post("/refine")
async def refine_payload(file: UploadFile = File(...), options_json: str = Form(...)):
    try:
        options = RefineryOptions(**json.loads(options_json))
        content = await file.read()
        
        # Extension-agnostic Forensic Detection
        try:
            raw_data = json.loads(content)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="INVALID_JSON_PAYLOAD")

        refined_files = []
        
        if isinstance(raw_data, list) and len(raw_data) > 0 and "mapping" in raw_data[0]:
            for conv in raw_data:
                refined_files.append({"name": conv.get("title") or "ChatGPT_Chat", "content": handle_chatgpt(conv, options)})
        elif isinstance(raw_data, list) and len(raw_data) > 0 and "chat_messages" in raw_data[0]:
            for chat in raw_data:
                refined_files.append({"name": chat.get("name") or "Claude_Chat", "content": handle_claude(chat, options)})
        elif isinstance(raw_data, dict) and "chunkedPrompt" in raw_data:
            refined_files.append({"name": file.filename or "Gemini_Export", "content": handle_gemini(raw_data, options)})
        else:
            raise HTTPException(status_code=400, detail="UNKNOWN_SCHEMA")

        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "a", zipfile.ZIP_DEFLATED, False) as zip_file:
            # Clean the base name provided by the frontend
            clean_base = clean_filename(options.base_filename)
            
            for idx, rf in enumerate(refined_files):
                if len(refined_files) == 1:
                    # Pure mirror: input name -> WASHHOUSE_inputname.md
                    filename = f"WASHHOUSE_{clean_base}.{options.output_format}"
                else:
                    # Multi-chat: input name + internal title
                    clean_title = clean_filename(rf['name'])
                    filename = f"WASHHOUSE_{clean_base}_{clean_title}.{options.output_format}"
                
                zip_file.writestr(filename, rf['content'])
        
        zip_buffer.seek(0)
        return StreamingResponse(zip_buffer, media_type="application/x-zip-compressed", 
                                 headers={"Content-Disposition": f"attachment; filename=WASHHOUSE_{clean_base}.zip"})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
