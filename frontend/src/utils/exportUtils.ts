import { Message, Prompt } from '../types';

export type ExportFormat = 'json' | 'md' | 'txt' | 'html';

export const formatMessageContent = (
  messages: Message[], 
  format: ExportFormat, 
  options: { includeCode: boolean, includeThoughts: boolean, exportTitle: string, selectedPrompt: Prompt | null }
): string => {
  const { includeCode, includeThoughts, exportTitle, selectedPrompt } = options;
  const processText = (text: string) => includeCode ? text.trim() : text.replace(/'''[\s\S]*?'''/g, '[CODE REMOVED]').trim();
  const visibleMessages = messages.filter(msg => includeThoughts || !msg.isThought);

  if (format === 'json') {
    return JSON.stringify(visibleMessages.map(m => ({ role: m.role, text: processText(m.text) })), null, 2);
  }
  if (format === 'md') {
    return `# ${exportTitle}\n\n` + visibleMessages.map(msg => `### ${msg.role.toUpperCase()}\n${processText(msg.text)}`).join('\n\n---\n\n');
  }
  if (format === 'html') {
    return `<html><body><h1>${exportTitle}</h1>${visibleMessages.map(msg => `<div><h3>${msg.role}</h3><pre>${processText(msg.text)}</pre></div>`).join('')}</body></html>`;
  }
  return visibleMessages.map(msg => `[${msg.role.toUpperCase()}]\n${processText(msg.text)}`).join('\n\n');
};
