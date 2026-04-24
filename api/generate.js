const KIMI_API_URL = 'https://api.moonshot.ai/v1/chat/completions';
const KIMI_MODEL = 'kimi-k2.6';

function getApiKey() {
  return process.env.kimi_api_key || process.env.KIMI_API_KEY || process.env.MOONSHOT_API_KEY;
}

function getBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

function extractJson(text) {
  if (!text || typeof text !== 'string') return null;

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const source = fenced ? fenced[1] : text;
  const match = source.match(/\{[\s\S]*\}/);
  if (!match) return null;

  try {
    const parsed = JSON.parse(match[0]);
    if (!Array.isArray(parsed.hooks) || !parsed.script || !parsed.caption) return null;

    return {
      hooks: parsed.hooks.slice(0, 3).map(String),
      script: String(parsed.script),
      caption: String(parsed.caption)
    };
  } catch {
    return null;
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    return res.status(500).json({ error: 'Missing kimi_api_key environment variable' });
  }

  const body = getBody(req);
  const topic = String(body.topic || '').trim().slice(0, 180);
  const platform = String(body.platform || 'TikTok').trim().slice(0, 40);
  const tone = String(body.tone || 'Viral').trim().slice(0, 40);

  if (!topic) {
    return res.status(400).json({ error: 'Topic is required' });
  }

  const systemPrompt = [
    'You are a senior short-form video strategist.',
    'Generate concise, natural, high-retention content for creators.',
    'Return only a valid JSON object with exactly these keys: hooks, script, caption.',
    'hooks must be an array of exactly 3 strings.',
    'Do not wrap the JSON in markdown.'
  ].join(' ');

  const userPrompt = [
    `Topic: ${topic}`,
    `Platform: ${platform}`,
    `Tone: ${tone}`,
    '',
    'Write 3 scroll-stopping hooks, a 35-60 second video script, and one caption with relevant hashtags.'
  ].join('\n');

  try {
    const kimiRes = await fetch(KIMI_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: KIMI_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 1200,
        thinking: { type: 'disabled' }
      })
    });

    const payload = await kimiRes.json().catch(() => ({}));

    if (!kimiRes.ok) {
      return res.status(kimiRes.status).json({
        error: payload?.error?.message || `Kimi API error ${kimiRes.status}`
      });
    }

    const content = payload?.choices?.[0]?.message?.content || '';
    const parsed = extractJson(content);

    if (!parsed) {
      return res.status(502).json({ error: 'Kimi returned an invalid JSON response' });
    }

    return res.status(200).json(parsed);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to call Kimi API' });
  }
};
