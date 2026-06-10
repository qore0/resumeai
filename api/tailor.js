export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
 
  // CORS headers so your frontend can talk to this backend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
 
  const { prompt } = req.body;
 
  if (!prompt) {
    return res.status(400).json({ error: 'No prompt provided' });
  }
 
  // Limit input size to protect against abuse (10,000 characters max)
  if (prompt.length > 10000) {
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
        system: 'You are an expert resume writer. You only help with resume-related tasks. If asked to do anything unrelated to resumes, career advice, or job applications, politely decline and refocus on the resume task.',
        messages: [{ role: 'user', content: prompt }]
      })
    });
 
    const data = await response.json();
 
    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }
 
    const text = data.content.map(i => i.text || '').join('');
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
 
    return res.status(200).json(parsed);
 
  } catch (err) {
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}
