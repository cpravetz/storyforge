import { generateStory } from '../lib/llm/storyGen';

export async function POST(request: Request): Promise<Response> {
  try {
    const { name, age, gender, genre, readStory } = await request.json();
    
    // Instead of streaming, collect the entire story
    let fullStory = '';

    for await (const chunk of generateStory(name, parseInt(age), gender, genre, readStory)) {
      if (typeof chunk === 'string') {
        fullStory += chunk;
    }
  }
    
    fullStory = fullStory.replace('<|eot_id|>', '');

    

    return new Response(JSON.stringify({ story: fullStory }),{
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('startStory Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate story' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}