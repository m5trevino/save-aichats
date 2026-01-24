import os
import json
import zipfile
import io
import re
import time # Added for archival timestamps
import asyncio
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request # Added Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# SPLIT IDENTITY DOCTRINE
# SIPHON: Fast, Professional, Data Archival Enabled.
# TOLL: Gritty, Monetized, 5-min Lock, Stateless (save-aichats.com default).
SITE_PERSONALITY = os.getenv("SITE_PERSONALITY", "TOLL").upper()

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

ASCII_PATH = os.path.join(os.path.dirname(__file__), "..", "ascii")

def get_ascii(filename: str, font_block: str = "double_blocky") -> str:
    path = os.path.join(ASCII_PATH, filename)
    if not os.path.exists(path):
        return ""
    try:
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
            # Extract specific font block
            pattern = rf"--- FONT: {font_block} ---\n(.*?)\n\n"
            match = re.search(pattern, content, re.DOTALL)
            if match:
                return match.group(1).strip('\n')
            return content.strip('\n')
    except:
        return ""

def get_dividers() -> List[tuple]:
    path = os.path.join(ASCII_PATH, "dividers.txt")
    if not os.path.exists(path):
        return [("╔═══━━━─── • ───━━━═══╗", "╚═══━━━─── • ───━━━═══╝")]
    try:
        with open(path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            # Simple eval of the tuples in the file
            divs = []
            for line in lines:
                if "(" in line and ")" in line:
                    # Clean the line and wrap in brackets if needed for eval
                    clean = line.strip().strip(',')
                    divs.append(eval(clean))
            return divs if divs else [("╔═══━━━─── • ───━━━═══╗", "╚═══━━━─── • ───━━━═══╝")]
    except:
        return [("╔═══━━━─── • ───━━━═══╗", "╚═══━━━─── • ───━━━═══╝")]

USER_HEADER = get_ascii("user.txt", "pagga")
GEMINI_HEADER = get_ascii("gemini.txt", "double_blocky")
CLAUDE_HEADER = get_ascii("claude.txt", "double_blocky")
DIVIDERS = get_dividers()

# --- UTILS ---

def clean_filename(name: str) -> str:
    if not name: return "Untitled_Chat"
    cleaned = re.sub(r'[\s]+', '.', name)
    cleaned = re.sub(r'[^a-zA-Z0-9.-]', '', cleaned)
    return cleaned.strip('.')

def format_message(role: str, text: str, brand: str, index: int) -> str:
    # Use different dividers based on index to keep it fresh
    div_pair = DIVIDERS[index % len(DIVIDERS)]
    top_div, bot_div = div_pair
    
    if role == "user":
        header = f"{top_div}\n{USER_HEADER}\n[USER ENTRY #{str(index).zfill(3)}]\n{bot_div}"
        return f"\n{header}\n\n{text}\n\n"
    else:
        art = GEMINI_HEADER if brand.lower() == "gemini" else CLAUDE_HEADER
        label = brand.upper()
        header = f"{top_div}\n{art}\n[{label} RESPONSE #{str(index).zfill(3)}]\n{bot_div}"
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

    def get_refined_messages(self) -> List[Dict[str, Any]]:
        output = []
        for msg in self.extracted:
            if not self.options.include_thoughts and msg.get("is_thought"): continue
            if not self.options.include_user and msg["role"] == "user": continue
            if not self.options.include_bot and msg["role"] == "model": continue
            output.append(msg)
        return output

    def get_refined_content(self) -> str:
        output = []
        user_idx, bot_idx = 1, 1
        for msg in self.extracted:
            role = msg.get("role")
            if not self.options.include_thoughts and msg.get("is_thought"): continue
            if not self.options.include_user and role == "user": continue
            if not self.options.include_bot and role == "model": continue
            
            current_idx = user_idx if role == "user" else bot_idx
            formatted = format_message(role, msg["text"], self.brand, current_idx)
            output.append(formatted)
            
            # Update msg for stream if needed (add the ascii art version)
            msg["ascii_header"] = formatted.split("\n\n")[0].strip()
            
            if role == "user": user_idx += 1
            else: bot_idx += 1
        return "".join(output)

# --- BRAND HANDLERS ---

def handle_chatgpt(conv: Dict[str, Any], options: RefineryOptions, raw: bool = False) -> Any:
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
    return refiner.get_refined_messages() if raw else refiner.get_refined_content()

def handle_claude(chat: Dict[str, Any], options: RefineryOptions, raw: bool = False) -> Any:
    refiner = LogRefiner("Claude", options)
    for m in chat.get("chat_messages", []):
        sender = m.get("sender")
        content_blocks = m.get("content", [])
        text = "".join([b.get("text", "") for b in content_blocks if isinstance(b, dict) and b.get("type") == "text"])
        refiner.push_or_merge("user" if sender == "human" else "model", text)
    return refiner.get_refined_messages() if raw else refiner.get_refined_content()

def handle_gemini(data: Dict[str, Any], options: RefineryOptions, raw: bool = False) -> Any:
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
    return refiner.get_refined_messages() if raw else refiner.get_refined_content()

# --- ENDPOINTS ---

@app.get("/config")
async def get_config():
    """Expose the site personality to the frontend for UI skinning."""
    return {"personality": SITE_PERSONALITY}

@app.post("/refine-stream")
async def refine_stream(request: Request, file: UploadFile = File(...), options_json: str = Form(...), start_index: int = Form(0)):
    try:
        options = RefineryOptions(**json.loads(options_json))
        content = await file.read()
        
        # THE SIPHON: Immediate archival to vault if in SIPHON mode
        if SITE_PERSONALITY == "SIPHON":
            os.makedirs("vault/raw", exist_ok=True)
            timestamp = int(time.time())
            filename = f"vault/raw/{timestamp}_{file.filename}"
            with open(filename, "wb") as f:
                f.write(content)
            print(f"SIPHON_INGEST: Persisted raw log to {filename}")

        try:
            raw_data = json.loads(content)
            print(f"DEBUG: JSON_LOAD_SUCCESS. Type: {type(raw_data)}")
        except json.JSONDecodeError as je:
            print(f"DEBUG: JSON_LOAD_FAILED: {je}")
            raise HTTPException(status_code=400, detail="INVALID_JSON_PAYLOAD")

        async def event_generator():
            print("DEBUG: STREAM_STARTING...")
            batch = []
            if isinstance(raw_data, list) and len(raw_data) > 0 and "mapping" in raw_data[0]:
                # ChatGPT Logic: 20-chat batching
                batch = raw_data[start_index : start_index + 20]
                brand_handler = handle_chatgpt
                brand_name = "ChatGPT"
            elif isinstance(raw_data, list) and len(raw_data) > 0 and "chat_messages" in raw_data[0]:
                # Claude Logic: 20-chat batching
                batch = raw_data[start_index : start_index + 20]
                brand_handler = handle_claude
                brand_name = "Claude"
            elif isinstance(raw_data, dict) and "chunkedPrompt" in raw_data:
                # Gemini Logic: Whole file (as it's usually singular)
                batch = [raw_data]
                brand_handler = handle_gemini
                brand_name = "Gemini"
                yield f"data: {json.dumps({'status': 'error', 'message': 'UNKNOWN_SCHEMA'})}\n\n"
                return

            total_in_batch = len(batch)
            batch_names = []
            for idx, item in enumerate(batch):
                name = item.get("title") or item.get("name") or f"{brand_name}_Chat_{start_index + idx}"
                batch_names.append(name)

            yield f"data: {json.dumps({'status': 'start', 'total': total_in_batch, 'batch_names': batch_names})}\n\n"
            print("DEBUG: START_PACKET_YIELDED_WITH_NAMES")
            
            # THE TOLL: Elastic Dwell Time (NERFED FOR USABILITY)
            if SITE_PERSONALITY == "TOLL":
                # User feedback: The long wait (1-5m) felt like a crash.
                # New Logic: 0.5s per chat. Just enough to see the animation.
                delay_per_chat = 0.5
            else:
                # SIPHON MODE: No artificial delay
                delay_per_chat = 0

            print(f"DEBUG: BATCH_SIZE={len(batch)}, DELAY_PER_CHAT={delay_per_chat}")

            for idx, item in enumerate(batch):
                print(f"DEBUG: PROCESSING_ITEM_{idx + 1}/{len(batch)}")
                # THE HUSTLE: Ad-Tethering Check
                if await request.is_disconnected():
                    print("STRIKE_SEVERED: Client disconnected. Purging volatile memory.")
                    break

                # THE TOLL BOOTH: Dynamic Elastic Delay
                if idx > 0 or total_in_batch == 1:
                    # For total_in_batch == 1, we wait before the first and only yield
                    # For total_in_batch > 1, we wait before each yield to stagger
                    await asyncio.sleep(delay_per_chat)
                
                messages = brand_handler(item, options, raw=True)
                name = item.get("title") or item.get("name") or f"{brand_name}_Chat_{start_index + idx}"
                
                yield f"data: {json.dumps({'status': 'welded', 'index': idx + 1, 'total': total_in_batch, 'name': name, 'messages': messages, 'msg_count': len(messages)})}\n\n"
            
            yield f"data: {json.dumps({'status': 'complete'})}\n\n"

        return StreamingResponse(
            event_generator(), 
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"
            }
        )
    except Exception as e:
        print(f"DEBUG: REFINE_STREAM_ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/refine")
async def refine_payload(file: UploadFile = File(...), options_json: str = Form(...), start_index: int = Form(0)):
    try:
        options = RefineryOptions(**json.loads(options_json))
        content = await file.read()
        
        try:
            raw_data = json.loads(content)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="INVALID_JSON_PAYLOAD")

        refined_files = []
        
        if isinstance(raw_data, list) and len(raw_data) > 0 and "mapping" in raw_data[0]:
            batch = raw_data[start_index : start_index + 20]
            for conv in batch:
                refined_files.append({"name": conv.get("title") or "ChatGPT_Chat", "content": handle_chatgpt(conv, options)})
        elif isinstance(raw_data, list) and len(raw_data) > 0 and "chat_messages" in raw_data[0]:
            batch = raw_data[start_index : start_index + 20]
            for chat in batch:
                refined_files.append({"name": chat.get("name") or "Claude_Chat", "content": handle_claude(chat, options)})
        elif isinstance(raw_data, dict) and "chunkedPrompt" in raw_data:
            refined_files.append({"name": file.filename or "Gemini_Export", "content": handle_gemini(raw_data, options)})
        else:
            raise HTTPException(status_code=400, detail="UNKNOWN_SCHEMA")

        zip_io = io.BytesIO()
        
        # ZIP EXPORT: Static Naming based on Identity
        zip_filename = "ULTRADATA_STRIKE_EXTRACT.zip" if SITE_PERSONALITY == "TOLL" else "refined_chat_export.zip"
        
        with zipfile.ZipFile(zip_io, mode='w', compression=zipfile.ZIP_DEFLATED) as temp_zip:
            for file_info in refined_files:
                temp_zip.writestr(f"{file_info['name']}.md", file_info['content'])
        
        zip_io.seek(0)
        
        # THE SIPHON: Archive the final refined output
        if SITE_PERSONALITY == "SIPHON":
            os.makedirs("vault/refined", exist_ok=True)
            archive_path = f"vault/refined/{int(time.time())}_{zip_filename}"
            with open(archive_path, "wb") as f:
                f.write(zip_io.getvalue())
            print(f"SIPHON_EXPORT: Persisted refined artifact to {archive_path}")
            zip_io.seek(0) # Reset after writing

        return StreamingResponse(
            iter([zip_io.getvalue()]),
            media_type="application/x-zip-compressed",
            headers={"Content-Disposition": f"attachment; filename={zip_filename}"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
