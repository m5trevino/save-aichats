import { Router } from 'express';
import fs from 'fs/promises';
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
  prompts: path.join(ROOT, 'nexus.prompts')
};

// Ensure all exist
Object.values(DIRS).forEach(d => fs.mkdir(d, { recursive: true }).catch(() => {}));

const sanitize = (s: string) => s.replace(/[\s]+/g, '.').replace(/[^a-zA-Z0-9.-]/g, '').replace(/\.+/g, '.').toLowerCase().replace(/^[.]+|[.]+$/g, '');

const getTimestamp = () => {
  const now = new Date();
  return `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getFullYear()).slice(-2)}`;
};

const humanizeGemini = (content: string) => {
  try {
    const data = JSON.parse(content);
    const messages = data.chunkedPrompt?.chunks || data.messages || [];
    return messages.map((m: any) => {
      const role = m.role === 'model' ? '▃ GEMINI ▃' : '● USER ●';
      const text = m.parts?.[0]?.text || m.content || '';
      return `${role}\n${text}`;
    }).join('\n\n');
  } catch (e) { return content; }
};

// 1. List files for specific tabs
nexusRouter.get('/list/:type', async (req, res) => {
  const { type } = req.params;
  try {
    let targetDir = DIRS.ammo;
    if (type === 'claude') targetDir = DIRS.claude_h;
    else if (type === 'gemini_h') targetDir = DIRS.gemini_h;
    else if (type === 'gemini_r') targetDir = DIRS.gemini_r;
    
    const files = await fs.readdir(targetDir);
    const details = await Promise.all(files.map(async f => {
      const stat = await fs.stat(path.join(targetDir, f));
      return { name: f, time: stat.mtime.getTime(), isDir: stat.isDirectory() };
    }));
    res.json(details.filter(f => !f.isDir).sort((a, b) => b.time - a.time));
  } catch (e) { res.json([]); }
});

// 2. Humanize and move to processed
nexusRouter.post('/ingest/gemini', async (req, res) => {
  const { name, content } = req.body;
  try {
    const fileName = `${getTimestamp()}.${sanitize(name)}.md`;
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

// 3. Get content
nexusRouter.get('/get/:source/:file', async (req, res) => {
  const { source, file } = req.params;
  let targetDir = DIRS.ammo;
  if (source === 'claude') targetDir = DIRS.claude_h;
  else if (source === 'gemini_h') targetDir = DIRS.gemini_h;
  else if (source === 'gemini_r') targetDir = DIRS.gemini_r;

  try {
    const content = await fs.readFile(path.join(targetDir, file), 'utf-8');
    res.json({ content });
  } catch (e) { res.status(500).json({ error: 'Read failed' }); }
});

// 4. Prompts
nexusRouter.get('/prompts', async (req, res) => {
  try { 
    const files = await fs.readdir(DIRS.prompts);
    res.json(files.filter(f => f.endsWith('.md') || f.endsWith('.txt')));
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
