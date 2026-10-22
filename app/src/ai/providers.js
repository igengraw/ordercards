export const PROVIDERS = {
  gemini: { label: 'Gemini', model: 'gemini-3.5-flash-lite', hint: 'Key from aistudio.google.com' },
  anthropic: { label: 'Claude', model: 'claude-haiku-5-5', hint: 'Key from console.anthropic.com' },
  openai: {
    label: 'OpenAI-compatible',
    model: '',
    baseUrl: 'https://api.openai.com/v1',
    hint: 'OpenAI, Groq, OpenRouter, Ollama… (key is optional for Ollama)',
  },
};

export function parseJSON(text) {
  const a = text.indexOf('{');
  const b = text.lastIndexOf('}');
  if (a < 0 || b < a) throw new Error('The model did not return JSON. Try again or pick another model.');
  return JSON.parse(text.slice(a, b + 1));
}

async function post(url, headers, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message || data?.message || `HTTP ${res.status}`);
  return data;
}

// Sends one prompt to the provider the user chose and returns the reply text.
export async function callModel(s, prompt) {
  const p = PROVIDERS[s.provider];
  const model = (s.model || '').trim().replace(/^models\//, '');
  const key = (s.apiKey || '').trim();
  if (!p) throw new Error('Unknown AI provider.');
  if (!key && s.provider !== 'openai') throw new Error('Open Settings and add your API key.');
  if (!model) throw new Error('Open Settings and enter a model name.');

  try {
    if (s.provider === 'gemini') {
      const data = await post(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        { 'x-goog-api-key': key },
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0 },
        }
      );
      return (data.candidates?.[0]?.content?.parts || []).map((x) => x.text || '').join('');
    }

    if (s.provider === 'anthropic') {
      const data = await post(
        'https://api.anthropic.com/v1/messages',
        {
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        { model, max_tokens: 1024, messages: [{ role: 'user', content: prompt }] }
      );
      return (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('');
    }

    const base = (s.baseUrl || p.baseUrl).trim().replace(/\/+$/, '');
    const data = await post(
      `${base}/chat/completions`,
      key ? { Authorization: `Bearer ${key}` } : {},
      { model, temperature: 0, messages: [{ role: 'user', content: prompt }] }
    );
    return data.choices?.[0]?.message?.content || '';
  } catch (e) {
    if (e instanceof TypeError) {
      throw new Error('Network error. Check your internet connection (and the base URL for custom providers).');
    }
    throw e;
  }
}

export async function testConnection(s) {
  return (await callModel(s, 'Reply with the single word OK.')).trim();
}