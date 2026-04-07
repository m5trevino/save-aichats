import { Message, CommandArtifact, FileGroup } from '../types';

export const parseCommands = (messages: Message[]): FileGroup[] => {
  let globalIdCounter = 1;
  const allCommands: CommandArtifact[] = [];

  messages.forEach((msg, msgIndex) => {
    const text = msg.text;
    const eofRegex = /cat\s+<<\s*(?:'|")?EOF(?:'|")?\s*>\s*([^\s;]+)[\s\S]*?\nEOF/g;
    let match;
    while ((match = eofRegex.exec(text)) !== null) {
      allCommands.push({
        id: globalIdCounter++,
        type: 'eof',
        filename: match[1],
        command: match[0],
        sourceMessageIndex: msgIndex
      });
    }
  });

  const groups: Record<string, CommandArtifact[]> = {};
  allCommands.forEach(cmd => {
    if (!groups[cmd.filename]) groups[cmd.filename] = [];
    groups[cmd.filename].push(cmd);
  });

  return Object.keys(groups).map(filename => ({
    filename,
    commands: groups[filename]
  }));
};
