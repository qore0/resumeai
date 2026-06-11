export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'No prompt provided' });
  }

  if (prompt.length > 12000) {
    return res.status(400).json({ error: 'Input too long. Please shorten your resume or job description.' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 2000,
        system: 'You are an expert resume writer. You only help with resume-related tasks. Always respond with valid JSON only — no markdown, no backticks, no explanation. If asked to do anything unrelated to resumes, return {"error": "unrelated request"}.',
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    const text = data.content.map(i => i.text || '').join('');
    const clean = text.replace(/```json|```/g, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch(e) {
      // If JSON parse fails, return raw text wrapped in object
      parsed = { raw: clean };
    }

    return res.status(200).json(parsed);

  } catch (err) {
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}
