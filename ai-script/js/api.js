const HF_API_KEY = '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';

export async function generateScriptAPI(topic, platform, tone) {
  const prompt = `You are a viral short-form content expert.\n\nReturn STRICT JSON format:\n{\n  "hooks": ["", "", ""],\n  "script": "",\n  "caption": ""\n}\n\nTopic: ${topic}\nPlatform: ${platform}\nTone: ${tone}\n\nMake it natural, engaging, and human. Only return the JSON object, nothing else.`;

  const res = await fetch('https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${HF_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: { max_new_tokens: 400, temperature: 0.7, return_full_text: false }
    })
  });

  if (!res.ok) throw new Error(`HF API error ${res.status}`);
  const aiData = await res.json();
  return aiData?.[0]?.generated_text || aiData?.generated_text || '';
}
