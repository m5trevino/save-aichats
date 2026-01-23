import { Router } from 'express';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';

export const nexusRouter = Router();

const ROOT = '/home/flintx/peacock';
const DIRS = {
  ammo: path.join(ROOT, 'ammo'),
  claude_h: path.join(ROOT, 'claude/humanized'),
  gemini_h: path.join(ROOT, 'gemini/humanized'),
  gemini_r: path.join(ROOT, 'gemini'),
  gemini_p: path.join(ROOT, 'gemini/processed'),
  nexus_output: path.join(ROOT, 'gemini/nexus.output'),
  prompts: path.join(ROOT, 'nexus.prompts'),
  ascii: path.join(ROOT, 'ascii')
};

// Ensure all exist
Object.values(DIRS).forEach(d => fs.mkdir(d, { recursive: true }).catch(() => {}));

// --- ASCII PERSONA TRIAGE ---
const loadPersonaDeck = async (filename: string): Promise<string[]> => {
  try {
    const content = await fs.readFile(path.join(DIRS.ascii, filename), 'utf-8');
    const cards = content.split(/={10,}/).map(c => c.trim()).filter(c => c.length > 5);
    return cards;
  } catch (e) {
    return [];
  }
};

let decks: Record<string, string[]> = { user: [], gemini: [], claude: [] };
(async () => {
  decks.user = await loadPersonaDeck('user.txt');
  decks.gemini = await loadPersonaDeck('gemini.txt');
  decks.claude = await loadPersonaDeck('claude.txt');
})();

const getRandomAscii = (role: 'user' | 'model' | 'claude'): string => {
  const deck = decks[role] || [];
  if (deck.length === 0) return role === 'user' ? '● USER ●' : '▃ AI ▃';
  return deck[Math.floor(Math.random() * deck.length)];
};

// --- CORE UTILS ---
const sanitize = (s: string) => s.replace(/[\s_]+/g, '.').replace(/[^a-zA-Z0-9.-]/g, '').replace(/\.+/g, '.').toLowerCase().replace(/^[.]+|[.]+$/g, '');

const getHistoricalDate = (data: any): string => {
  let dateObj = new Date();
  if (data?.chunkedPrompt?.chunks?.[0]?.createTime) {
    dateObj = new Date(data.chunkedPrompt.chunks[0].createTime);
  } else if (data?.messages?.[0]?.created_at) {
    dateObj = new Date(data.messages[0].created_at);
  }
  return `${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}-${String(dateObj.getFullYear()).slice(-2)}`;
};

const humanizeGemini = (content: string) => {
  try {
    const data = JSON.parse(content);
    const chunks = data.chunkedPrompt?.chunks || data.messages || [];
    
    return chunks.map((c: any) => {
      const rawRole = c.role || c.author || 'model';
      const isUser = rawRole === 'user' || rawRole === 'human';
      const header = getRandomAscii(isUser ? 'user' : 'gemini');

      let text = '';
      let thought = '';

      if (c.parts) {
        c.parts.forEach((p: any) => {
          if (p.thought) thought += p.text + '\n';
          else text += p.text + '\n';
        });
      } else {
        text = c.text || c.content || '';
        if (c.isThought) thought = text;
      }

      let output = `${header}\n`;
      if (thought) output += `[THOUGHTS]:\n${thought.trim()}\n\n`;
      output += text.trim();
      return output;
    }).join('\n\n' + '='.repeat(40) + '\n\n');
  } catch (e) { return content; }
};

// --- ROUTES ---

nexusRouter.get('/list/:type', async (req, res) => {
  const { type } = req.params;
  try {
    let targetDir = DIRS.ammo;
    if (type === 'claude') targetDir = DIRS.claude_h;
    else if (type === 'gemini') targetDir = DIRS.gemini_h;
    else if (type === 'staging') targetDir = DIRS.gemini_r;
    
    const files = await fs.readdir(targetDir);
    const details = await Promise.all(files.map(async (f: string) => {
      const stat = await fs.stat(path.join(targetDir, f));
      return { name: f, time: stat.mtime.getTime(), isDir: stat.isDirectory() };
    }));
    res.json(details.filter((f: any) => !f.isDir && !f.name.startsWith('.')).sort((a: any, b: any) => b.time - a.time));
  } catch (e) { res.json([]); }
});

nexusRouter.post('/ingest/gemini', async (req, res) => {
  const { name, content } = req.body;
  try {
    let rawData = {};
    try { rawData = JSON.parse(content); } catch {}

    const datePrefix = getHistoricalDate(rawData);
    const cleanName = sanitize(name.replace('.json', ''));
    const fileName = `${datePrefix}.${cleanName}.human.md`;
    
    const finalContent = humanizeGemini(content);
    await fs.writeFile(path.join(DIRS.gemini_h, fileName), finalContent);
    
    const originalPath = path.join(DIRS.gemini_r, name);
    try {
        await fs.access(originalPath);
        await fs.rename(originalPath, path.join(DIRS.gemini_p, name));
    } catch (e) {}

    res.json({ status: 'success', file: fileName });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

nexusRouter.get('/get/:source/:file', async (req, res) => {
  let { source, file } = req.params;
  let targetDir = DIRS.ammo;
  if (source === 'claude') targetDir = DIRS.claude_h;
  else if (source === 'gemini') targetDir = DIRS.gemini_h;
  else if (source === 'staging') targetDir = DIRS.gemini_r;

  try {
    const content = await fs.readFile(path.join(targetDir, file), 'utf-8');
    res.json({ content });
  } catch (e) { res.status(500).json({ error: 'Read failed' }); }
});

nexusRouter.get('/prompts', async (req, res) => {
  try { 
    const files = await fs.readdir(DIRS.prompts);
    res.json(files.filter((f: string) => f.endsWith('.md') || f.endsWith('.txt')));
  } catch (e) { res.json([]); }
});

nexusRouter.get('/prompts/:file', async (req, res) => {
  try {
    const content = await fs.readFile(path.join(DIRS.prompts, req.params.file), 'utf-8');
    res.json({ content });
  } catch (e) { res.status(500).json({ error: 'Read failed' }); }
});

nexusRouter.post('/prompts', async (req, res) => {
  const { name, content } = req.body;
  try {
    await fs.writeFile(path.join(DIRS.prompts, name), content);
    res.json({ status: 'saved' });
  } catch (e) { res.status(500).json({ error: 'Save failed' }); }
});

nexusRouter.post('/disposition', async (req, res) => {
    res.json({ status: 'logged_to_vault' });
});