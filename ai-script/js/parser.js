export function parseAIResponse(text) {
  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]);
    if (!Array.isArray(parsed.hooks) || !parsed.script || !parsed.caption) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function smartFallback(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const hooks = [];
  let script = '';
  let caption = '';

  for (const line of lines) {
    if (hooks.length < 3 && (
      line.toLowerCase().includes('hook') ||
      line.startsWith('1') ||
      line.startsWith('-')
    )) {
      hooks.push(line.replace(/^[-\d.\s]+/, ''));
      continue;
    }
    if (line.includes('#')) { caption = line; continue; }
    script += line + ' ';
  }

  const result = { hooks: hooks.slice(0, 3), script: script.trim(), caption };
  if (!result.hooks.length || !result.script) return null;
  return result;
}

export function emptyResult() {
  return {
    hooks: [
      "This might be the easiest way to go viral...",
      "Nobody talks about this trick...",
      "You're doing this wrong..."
    ],
    script: "Try again with a clearer topic.",
    caption: "#content #viral"
  };
}
