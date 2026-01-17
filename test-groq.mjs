import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: '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',
});

console.log('Groq instance created:', !!groq);

try {
  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{role: 'user', content: 'Say hello'}],
    max_tokens: 100,
  });
  console.log('✅ API works!', response.choices[0].message.content.substring(0, 100));
} catch (error) {
  console.error('❌ API error:', error.message);
  console.error('Status:', error.status);
  console.error('Error type:', error.constructor.name);
}
